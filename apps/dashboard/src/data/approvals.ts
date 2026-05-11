import type { TraceEvent } from './loader';

export type ApprovalQueueKind = 'approval' | 'policy' | 'security' | 'tool-risk' | 'sandbox';
export type ApprovalRisk = 'low' | 'medium' | 'high' | 'critical' | 'unknown';
export type ApprovalStatus = 'pending' | 'allowed' | 'denied' | 'informational';

export interface ApprovalQueueItem {
  id: string;
  title: string;
  kind: ApprovalQueueKind;
  risk: ApprovalRisk;
  status: ApprovalStatus;
  timestamp: string;
  summary: string;
}

const riskRank: Record<ApprovalRisk, number> = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function deriveApprovalQueue(events: TraceEvent[]): ApprovalQueueItem[] {
  return events.flatMap(event => {
    if (event.type === 'approval.requested' || event.type === 'approval.resolved') {
      return [approvalItem(event)];
    }

    if (event.type === 'policy.decision' || event.type === 'policy.decided') {
      return [policyItem(event)];
    }

    if (event.type === 'security.finding') {
      return [securityItem(event)];
    }

    if (event.type === 'sandbox.blocked') {
      return [sandboxItem(event)];
    }

    const risk = normalizeRisk(event.data.risk);
    if (event.type.startsWith('tool.') && (risk === 'high' || risk === 'critical')) {
      return [toolRiskItem(event, risk)];
    }

    return [];
  });
}

function approvalItem(event: TraceEvent): ApprovalQueueItem {
  const toolName = stringifySummary(event.data.tool ?? event.data.name ?? 'unknown');
  const decision = String(event.data.decision ?? event.data.status ?? '').toLowerCase();
  const isResolved = event.type === 'approval.resolved';
  return {
    id: event.eventId,
    title: isResolved ? `Approval resolved: ${toolName}` : `Approval requested: ${toolName}`,
    kind: 'approval',
    risk: normalizeRisk(event.data.risk),
    status: approvalStatus(decision, isResolved),
    timestamp: event.timestamp,
    summary: stringifySummary(event.data.reason ?? event.data.summary ?? event.data.message ?? 'Approval event recorded'),
  };
}

function approvalStatus(decision: string, isResolved: boolean): ApprovalStatus {
  if (!isResolved) return 'pending';
  if (/allow|approve|grant/.test(decision)) return 'allowed';
  if (/deny|denied|reject|block/.test(decision)) return 'denied';
  return 'informational';
}

function policyItem(event: TraceEvent): ApprovalQueueItem {
  const decision = String(event.data.decision ?? 'unknown').toLowerCase();
  const risk = normalizeRisk(event.data.risk);
  return {
    id: event.eventId,
    title: `Policy decision: ${decision}`,
    kind: 'policy',
    risk,
    status: decision === 'allow' ? 'allowed' : decision === 'deny' ? 'denied' : 'pending',
    timestamp: event.timestamp,
    summary: stringifySummary(event.data.reason ?? event.data.summary ?? event.data.message ?? 'Policy decision recorded'),
  };
}

function securityItem(event: TraceEvent): ApprovalQueueItem {
  const findings = Array.isArray(event.data.findings) ? event.data.findings : [];
  const risks = findings.map(finding => normalizeRisk((finding as Record<string, unknown>).severity));
  const risk = highestRisk(risks.length > 0 ? risks : [normalizeRisk(event.data.severity)]);
  const messages = findings
    .map(finding => (finding as Record<string, unknown>).message)
    .filter(Boolean)
    .map(String);

  return {
    id: event.eventId,
    title: 'Security findings',
    kind: 'security',
    risk,
    status: 'informational',
    timestamp: event.timestamp,
    summary: messages.length > 0 ? messages.join('; ') : stringifySummary(event.data.message ?? 'Security finding recorded'),
  };
}

function sandboxItem(event: TraceEvent): ApprovalQueueItem {
  const sandbox = typeof event.data.sandbox === 'object' && event.data.sandbox !== null ? event.data.sandbox as Record<string, unknown> : {};
  const mode = typeof sandbox.mode === 'string' ? sandbox.mode : 'sandbox';
  const writeMode = typeof sandbox.writeMode === 'string' ? sandbox.writeMode : undefined;
  return {
    id: event.eventId,
    title: `Sandbox blocked: ${mode}`,
    kind: 'sandbox',
    risk: 'high',
    status: 'denied',
    timestamp: event.timestamp,
    summary: [stringifySummary(event.data.error ?? 'Sandbox blocked command'), writeMode ? `writeMode=${writeMode}` : undefined].filter(Boolean).join(' · '),
  };
}

function toolRiskItem(event: TraceEvent, risk: ApprovalRisk): ApprovalQueueItem {
  const toolName = String(event.data.name ?? event.data.tool ?? 'unknown');
  return {
    id: event.eventId,
    title: `High-risk tool: ${toolName}`,
    kind: 'tool-risk',
    risk,
    status: 'pending',
    timestamp: event.timestamp,
    summary: stringifySummary(event.data.summary ?? event.data.input ?? `${toolName} requested ${risk} risk execution`),
  };
}

function normalizeRisk(value: unknown): ApprovalRisk {
  const risk = String(value ?? 'unknown').toLowerCase();
  if (risk === 'low' || risk === 'medium' || risk === 'high' || risk === 'critical') return risk;
  return 'unknown';
}

function highestRisk(risks: ApprovalRisk[]): ApprovalRisk {
  return risks.reduce((highest, risk) => riskRank[risk] > riskRank[highest] ? risk : highest, 'unknown');
}

function stringifySummary(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
