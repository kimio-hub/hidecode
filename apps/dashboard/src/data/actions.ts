export type DashboardActionDomain = 'approval' | 'replay' | 'agent' | 'command';

export type ApprovalAction = 'approve' | 'reject';
export type ReplayAction = 'replay' | 'fork' | 'save-eval';
export type AgentAction = 'assign' | 'handoff' | 'unblock';
export type CommandAction = 'ask-harness';

export type DashboardAction = ApprovalAction | ReplayAction | AgentAction | CommandAction;

export type DashboardActionTargetKind = 'approval' | 'replay-step' | 'run' | 'agent' | 'command';

export interface DashboardActionTarget {
  kind: DashboardActionTargetKind;
  id?: string;
}

export type ReplayStepActionTarget = DashboardActionTarget & { kind: 'replay-step'; id: string };
export type RunActionTarget = DashboardActionTarget & { kind: 'run' };

export interface ReplayActionTargetByAction {
  replay: ReplayStepActionTarget | RunActionTarget;
  fork: RunActionTarget;
  'save-eval': RunActionTarget;
}

interface BaseDashboardActionIntent {
  id: string;
  label: string;
  enabled: boolean;
  reason: string;
  requiresBackend: boolean;
  targetId?: string;
  target?: DashboardActionTarget;
}

export type ReplayActionIntent = {
  [Action in ReplayAction]: BaseDashboardActionIntent & {
    domain: 'replay';
    action: Action;
    target: ReplayActionTargetByAction[Action];
  };
}[ReplayAction];

export type DashboardActionIntent =
  | (BaseDashboardActionIntent & { domain: 'approval'; action: ApprovalAction; target: DashboardActionTarget & { kind: 'approval'; id: string }; targetId: string })
  | ReplayActionIntent
  | (BaseDashboardActionIntent & { domain: 'agent'; action: AgentAction; target: DashboardActionTarget & { kind: 'agent'; id: string }; targetId: string })
  | (BaseDashboardActionIntent & { domain: 'command'; action: CommandAction; target: DashboardActionTarget & { kind: 'command' } });

export interface DashboardActionReasonAttributes {
  title: string;
  'aria-description': string;
}

export type DashboardRuntimeActionReadinessState = 'not-configured' | 'offline' | 'online' | 'preview-only';

export interface DashboardRuntimeActionReadiness {
  state: DashboardRuntimeActionReadinessState;
  canSubmitActions: boolean;
  reason: string;
  checkedAt?: string;
  backendVersion?: string;
  contractVersion?: 'dashboard-runtime-actions.v1';
  lastError?: string;
}

export type RuntimeActionReadinessTone = 'muted' | 'danger' | 'warning' | 'success';

export interface RuntimeActionReadinessIndicator {
  label: string;
  tone: RuntimeActionReadinessTone;
  detail: string;
}

export const DEFAULT_RUNTIME_ACTION_READINESS: DashboardRuntimeActionReadiness = {
  state: 'not-configured',
  canSubmitActions: false,
  reason: 'Dashboard runtime actions backend is not configured.',
};

export interface RuntimeActionRequest {
  domain: DashboardActionDomain;
  action: DashboardAction;
  target?: DashboardActionTarget;
  requiresBackend: true;
  clientRequestId?: string;
}

export type RuntimeActionStatus = 'accepted' | 'rejected' | 'duplicate';

export interface RuntimeActionResponse {
  status: RuntimeActionStatus;
  accepted: boolean;
  commandId: string;
  traceEventId: string;
  reason?: string;
  queuedOperationId?: string;
}

export interface RuntimeActionAuditEvent {
  eventId: string;
  type: `dashboard.runtime_action.${RuntimeActionStatus}`;
  commandId: string;
  clientRequestId?: string;
  domain: RuntimeActionRequest['domain'];
  action: RuntimeActionRequest['action'];
  target?: RuntimeActionRequest['target'];
  receivedAt: string;
  outcome: {
    status: RuntimeActionStatus;
    accepted: boolean;
    reason?: string;
    queuedOperationId?: string;
  };
}

export interface RuntimeActionAuditEventInput {
  eventId: string;
  commandId: string;
  request: RuntimeActionRequest;
  response: RuntimeActionResponse;
  receivedAt: string;
}

const BACKEND_REASON = 'Disabled until the Dashboard runtime backend API is available.';
const COMMAND_REASON = 'Command submission is disabled until the Dashboard runtime backend API is available.';

const approvalLabels: Record<ApprovalAction, string> = {
  approve: 'Approve',
  reject: 'Reject',
};

const replayLabels: Record<ReplayAction, string> = {
  replay: 'Replay',
  fork: 'Fork',
  'save-eval': 'Save Eval',
};

const agentLabels: Record<AgentAction, string> = {
  assign: 'Assign',
  handoff: 'Handoff',
  unblock: 'Unblock',
};

const commandLabels: Record<CommandAction, string> = {
  'ask-harness': 'Ask Harness',
};

export function buildApprovalActionIntent(action: ApprovalAction, targetId: string): DashboardActionIntent {
  return disabledIntent('approval', action, approvalLabels[action], BACKEND_REASON, { kind: 'approval', id: targetId });
}

export function buildReplayActionIntent(action: 'replay', target?: string | ReplayActionTargetByAction['replay']): ReplayActionIntent & { action: 'replay' };
export function buildReplayActionIntent(action: 'fork', target?: ReplayActionTargetByAction['fork']): ReplayActionIntent & { action: 'fork' };
export function buildReplayActionIntent(action: 'save-eval', target?: ReplayActionTargetByAction['save-eval']): ReplayActionIntent & { action: 'save-eval' };
export function buildReplayActionIntent(action: ReplayAction, target?: string | ReplayActionTargetByAction[ReplayAction]): ReplayActionIntent {
  const normalizedTarget = normalizeReplayActionTarget(target);
  return disabledIntent('replay', action, replayLabels[action], BACKEND_REASON, normalizedTarget) as ReplayActionIntent;
}

export function buildAgentActionIntent(action: AgentAction, targetId: string): DashboardActionIntent {
  return disabledIntent('agent', action, agentLabels[action], BACKEND_REASON, { kind: 'agent', id: targetId });
}

export function buildCommandActionIntent(action: CommandAction): DashboardActionIntent {
  return disabledIntent('command', action, commandLabels[action], COMMAND_REASON, { kind: 'command' });
}

export function actionReasonAttributes(intent: Pick<DashboardActionIntent, 'reason'>): DashboardActionReasonAttributes {
  return {
    title: intent.reason,
    'aria-description': intent.reason,
  };
}

export function runtimeActionReadinessMessage(status: DashboardRuntimeActionReadiness): string {
  switch (status.state) {
    case 'not-configured':
      return 'Runtime actions unavailable: backend not configured.';
    case 'offline':
      return `Runtime actions unavailable: backend offline. ${status.reason}${status.lastError ? ` Last error: ${status.lastError}` : ''}`;
    case 'preview-only':
      return `Runtime actions preview only: ${status.reason}`;
    case 'online':
      return status.canSubmitActions
        ? `Runtime actions ready: ${status.reason}`
        : `Runtime actions preview only: online backend cannot submit actions until the dashboard-runtime-actions.v1 contract is confirmed. ${status.reason}`;
  }
}

export function runtimeActionReadinessIndicator(input?: Partial<DashboardRuntimeActionReadiness>): RuntimeActionReadinessIndicator {
  const status = normalizeRuntimeActionReadiness(input);
  const detail = runtimeActionReadinessMessage(status);

  switch (status.state) {
    case 'not-configured':
      return { label: 'Offline', tone: 'muted', detail };
    case 'offline':
      return { label: 'Offline', tone: 'danger', detail };
    case 'preview-only':
      return { label: 'Preview only', tone: 'warning', detail };
    case 'online':
      return status.canSubmitActions
        ? { label: 'Ready', tone: 'success', detail }
        : { label: 'Preview only', tone: 'warning', detail };
  }
}

export function runtimeActionPreview(request: RuntimeActionRequest): string {
  const target = request.target ? `${request.target.kind}${request.target.id ? `:${request.target.id}` : ''}` : 'untargeted';
  return `${request.domain}.${request.action} → ${target}${request.clientRequestId ? ` · client=${request.clientRequestId}` : ''}`;
}

export function normalizeRuntimeActionReadiness(input?: Partial<DashboardRuntimeActionReadiness>): DashboardRuntimeActionReadiness {
  if (!input?.state) return DEFAULT_RUNTIME_ACTION_READINESS;

  const normalized: DashboardRuntimeActionReadiness = {
    state: input.state,
    canSubmitActions: input.state === 'online' && input.contractVersion === 'dashboard-runtime-actions.v1' && input.canSubmitActions === true,
    reason: input.reason ?? DEFAULT_RUNTIME_ACTION_READINESS.reason,
    ...(input.checkedAt ? { checkedAt: input.checkedAt } : {}),
    ...(input.backendVersion ? { backendVersion: input.backendVersion } : {}),
    ...(input.contractVersion ? { contractVersion: input.contractVersion } : {}),
    ...(input.lastError ? { lastError: input.lastError } : {}),
  };

  if (normalized.state === 'online' && normalized.canSubmitActions) return normalized;
  return { ...normalized, canSubmitActions: false };
}

export function toRuntimeActionRequest(intent: DashboardActionIntent, clientRequestId?: string): RuntimeActionRequest {
  return {
    domain: intent.domain,
    action: intent.action,
    ...(intent.target ? { target: intent.target } : {}),
    requiresBackend: true,
    ...(clientRequestId ? { clientRequestId } : {}),
  };
}

export function toRuntimeActionAuditEvent(input: RuntimeActionAuditEventInput): RuntimeActionAuditEvent {
  return {
    eventId: input.eventId,
    type: `dashboard.runtime_action.${input.response.status}`,
    commandId: input.commandId,
    ...(input.request.clientRequestId ? { clientRequestId: input.request.clientRequestId } : {}),
    domain: input.request.domain,
    action: input.request.action,
    ...(input.request.target ? { target: input.request.target } : {}),
    receivedAt: input.receivedAt,
    outcome: {
      status: input.response.status,
      accepted: input.response.accepted,
      ...(input.response.reason ? { reason: input.response.reason } : {}),
      ...(input.response.queuedOperationId ? { queuedOperationId: input.response.queuedOperationId } : {}),
    },
  };
}

function normalizeReplayActionTarget(target?: string | ReplayActionTargetByAction[ReplayAction]): ReplayActionTargetByAction[ReplayAction] {
  if (typeof target === 'string') return { kind: 'replay-step', id: target };
  if (target) return target;
  return { kind: 'run' };
}

function disabledIntent(
  domain: DashboardActionDomain,
  action: DashboardAction,
  label: string,
  reason: string,
  target?: DashboardActionTarget,
): DashboardActionIntent {
  const targetId = target?.id;
  return {
    id: targetId ? `${domain}.${action}:${targetId}` : target ? `${domain}.${action}:${target.kind}` : `${domain}.${action}`,
    domain,
    action,
    label,
    enabled: false,
    reason,
    requiresBackend: true,
    ...(targetId ? { targetId } : {}),
    ...(target ? { target } : {}),
  } as DashboardActionIntent;
}
