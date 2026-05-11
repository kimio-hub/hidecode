import type { TraceEvent } from './loader';
import { outputForData, riskForData, sandboxForData, stringField as normalizeStringField, toolNameForEvent } from './trace-normalize';

export type ReplayStepCategory = 'task' | 'model' | 'tool' | 'policy' | 'security' | 'sandbox' | 'diff' | 'other';

export interface ReplayStep {
  id: string;
  index: number;
  type: string;
  actor: string;
  timestamp: string;
  elapsedMs: number;
  category: ReplayStepCategory;
  title: string;
  summary: string;
}

export function deriveReplaySteps(events: TraceEvent[]): ReplayStep[] {
  const ordered = [...events].sort((a, b) => {
    const aTime = parseTimestampMs(a.timestamp);
    const bTime = parseTimestampMs(b.timestamp);
    if (aTime === null && bTime === null) return 0;
    if (aTime === null) return 1;
    if (bTime === null) return -1;
    return aTime - bTime;
  });
  const firstValidTime = ordered.map(e => parseTimestampMs(e.timestamp)).find((value): value is number => value !== null) ?? 0;

  return ordered.map((event, offset) => {
    const currentTime = parseTimestampMs(event.timestamp);
    const elapsedMs = currentTime === null ? 0 : Math.max(0, currentTime - firstValidTime);

    return {
      id: event.eventId || `step-${offset + 1}`,
      index: offset + 1,
      type: event.type,
      actor: event.actor || 'unknown',
      timestamp: event.timestamp,
      elapsedMs,
      category: categoryFor(event.type),
      title: titleFor(event.type),
      summary: summaryFor(event),
    };
  });
}

function parseTimestampMs(timestamp: string): number | null {
  const value = new Date(timestamp).getTime();
  return Number.isFinite(value) ? value : null;
}

function categoryFor(type: string): ReplayStepCategory {
  if (type.startsWith('task.')) return 'task';
  if (type.startsWith('model.')) return 'model';
  if (type.startsWith('tool.')) return 'tool';
  if (type.startsWith('policy.')) return 'policy';
  if (type.startsWith('security.')) return 'security';
  if (type.startsWith('sandbox.')) return 'sandbox';
  if (type.startsWith('diff.')) return 'diff';
  return 'other';
}

function titleFor(type: string): string {
  const [scope = 'event', action = 'event'] = type.split('.');
  return `${capitalize(scope)} ${action.replace(/_/g, ' ')}`;
}

function summaryFor(event: TraceEvent): string {
  const data = event.data ?? {};

  if (typeof data.summary === 'string' && data.summary.trim()) return data.summary;
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  if (event.type === 'task.created' && typeof data.goal === 'string') return data.goal;
  if (event.type.startsWith('model.') && typeof data.prompt === 'string') return truncate(data.prompt);
  if (event.type.startsWith('tool.')) return toolSummary(event);
  if (event.type.startsWith('policy.')) return policySummary(data);
  if (event.type.startsWith('security.')) return securitySummary(data);
  if (event.type.startsWith('sandbox.')) return sandboxSummary(data);
  if (event.type.startsWith('diff.')) return diffSummary(data);

  const compact = JSON.stringify(data);
  return compact && compact !== '{}' ? truncate(compact) : event.type;
}

function toolSummary(event: TraceEvent): string {
  const data = event.data ?? {};
  const toolName = toolNameForEvent(event, 'tool') ?? 'tool';
  const output = outputForData(data);
  const ok = output.ok !== undefined
    ? (output.ok ? 'ok' : 'failed')
    : typeof data.ok === 'boolean' ? (data.ok ? 'ok' : 'failed') : undefined;
  const risk = riskForData(data);
  const pieces = [toolName, ok, risk ? `risk=${risk}` : undefined, output.summary].filter(Boolean);
  return pieces.length > 0 ? pieces.join(' · ') : event.type;
}

function policySummary(data: Record<string, unknown>): string {
  const decision = normalizeStringField(data.decision);
  const reason = normalizeStringField(data.reason);
  const risk = normalizeStringField(data.risk) ? `risk=${data.risk}` : undefined;
  return [decision, reason, risk].filter(Boolean).join(' · ') || 'Policy event';
}

function securitySummary(data: Record<string, unknown>): string {
  const severity = typeof data.severity === 'string' ? data.severity : undefined;
  const message = typeof data.message === 'string' ? data.message : undefined;
  const rule = typeof data.ruleId === 'string' ? data.ruleId : undefined;
  return [severity, message, rule].filter(Boolean).join(' · ') || 'Security finding';
}

function sandboxSummary(data: Record<string, unknown>): string {
  const sandbox = sandboxForData(data) ?? {};
  const writeMode = typeof sandbox.writeMode === 'string' ? `writeMode=${sandbox.writeMode}` : undefined;
  const mode = typeof sandbox.mode === 'string' ? `mode=${sandbox.mode}` : undefined;
  const error = typeof data.error === 'string' ? data.error : undefined;
  return [error, mode, writeMode].filter(Boolean).join(' · ') || 'Sandbox blocked command';
}

function diffSummary(data: Record<string, unknown>): string {
  const files = Array.isArray(data.files) ? data.files.filter((item): item is string => typeof item === 'string') : [];
  if (files.length > 0) return `Changed ${files.join(', ')}`;
  return 'Diff event';
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);
}

function truncate(value: string, max = 120): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
