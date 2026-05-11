import type { TraceEvent } from './loader';
import { toolNameForEvent } from './trace-normalize';

export type AgentStatus = 'active' | 'idle' | 'blocked' | 'handoff';

export interface AgentBoardItem {
  id: string;
  name: string;
  status: AgentStatus;
  taskId?: string;
  lastEventType: string;
  lastSeen: string;
  eventCount: number;
  toolCount: number;
  blockers: string[];
  handoffs: string[];
  focus: string;
}

interface AgentAccumulator {
  id: string;
  events: TraceEvent[];
}

export function deriveAgentBoard(events: TraceEvent[]): AgentBoardItem[] {
  const groups = new Map<string, AgentAccumulator>();

  for (const event of events) {
    const id = agentIdFor(event);
    const group = groups.get(id) ?? { id, events: [] };
    group.events.push(event);
    groups.set(id, group);
  }

  return [...groups.values()]
    .map(groupToBoardItem)
    .sort((a, b) => compareTimestampDesc(a.lastSeen, b.lastSeen));
}

function groupToBoardItem(group: AgentAccumulator): AgentBoardItem {
  const ordered = [...group.events].sort((a, b) => compareTimestampAsc(a.timestamp, b.timestamp));
  const latest = latestValidEvent(ordered) ?? ordered[ordered.length - 1] ?? group.events[0]!;
  const blockers = unique(ordered.flatMap(blockersFor));
  const handoffs = unique(ordered.flatMap(handoffsFor));
  const hasTerminalLatest = latest.type === 'task.completed';
  const status: AgentStatus = blockers.length > 0 ? 'blocked' : handoffs.length > 0 ? 'handoff' : hasTerminalLatest ? 'idle' : 'active';

  return {
    id: group.id,
    name: group.id,
    status,
    taskId: latest.taskId,
    lastEventType: latest.type,
    lastSeen: latest.timestamp,
    eventCount: ordered.length,
    toolCount: ordered.filter(event => event.type.startsWith('tool.')).length,
    blockers,
    handoffs,
    focus: focusFor(latest),
  };
}

function latestValidEvent(events: TraceEvent[]): TraceEvent | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event && parseTimestampMs(event.timestamp) !== null) return event;
  }
  return undefined;
}

function agentIdFor(event: TraceEvent): string {
  const explicit = event.data?.agentId;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  if (event.actor.trim()) return event.actor.trim();
  return 'unknown';
}

function blockersFor(event: TraceEvent): string[] {
  const blockers: string[] = [];
  const explicit = event.data?.blocker;
  if (typeof explicit === 'string' && explicit.trim()) blockers.push(explicit.trim());

  if (event.type === 'tool.result' && event.data?.ok === false) {
    blockers.push(stringField(event.data.summary) ?? 'Tool failed');
  }

  if (event.type === 'security.finding') {
    blockers.push(stringField(event.data.message) ?? stringField(event.data.ruleId) ?? 'Security finding');
  }

  if (event.type === 'policy.decision' || event.type === 'policy.decided') {
    const decision = stringField(event.data.decision);
    if (decision && /deny|block|needs_approval/i.test(decision)) {
      const reason = stringField(event.data.reason);
      blockers.push(reason ? `${decision}: ${reason}` : decision);
    }
  }

  return blockers;
}

function handoffsFor(event: TraceEvent): string[] {
  const handoffs: string[] = [];
  const to = stringField(event.data?.handoffTo);
  const from = stringField(event.data?.handoffFrom);
  if (to) handoffs.push(`to ${to}`);
  if (from) handoffs.push(`from ${from}`);
  return handoffs;
}

function focusFor(event: TraceEvent): string {
  const data = event.data ?? {};
  return stringField(data.summary)
    ?? stringField(data.goal)
    ?? stringField(data.message)
    ?? stringField(data.prompt)
    ?? toolFocus(event)
    ?? event.type;
}

function toolFocus(event: TraceEvent): string | undefined {
  if (!event.type.startsWith('tool.')) return undefined;
  const name = toolNameForEvent(event, 'tool') ?? 'tool';
  const ok = typeof event.data?.ok === 'boolean' ? (event.data.ok ? 'ok' : 'failed') : undefined;
  return [name, ok].filter(Boolean).join(' · ');
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function compareTimestampAsc(a: string, b: string): number {
  const aTime = parseTimestampMs(a);
  const bTime = parseTimestampMs(b);
  if (aTime === null && bTime === null) return 0;
  if (aTime === null) return 1;
  if (bTime === null) return -1;
  return aTime - bTime;
}

function compareTimestampDesc(a: string, b: string): number {
  return compareTimestampAsc(b, a);
}

function parseTimestampMs(timestamp: string): number | null {
  const value = new Date(timestamp).getTime();
  return Number.isFinite(value) ? value : null;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
