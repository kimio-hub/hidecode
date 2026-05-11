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

interface BaseDashboardActionIntent {
  id: string;
  label: string;
  enabled: boolean;
  reason: string;
  requiresBackend: boolean;
  targetId?: string;
  target?: DashboardActionTarget;
}

export type DashboardActionIntent =
  | (BaseDashboardActionIntent & { domain: 'approval'; action: ApprovalAction; target: DashboardActionTarget & { kind: 'approval'; id: string }; targetId: string })
  | (BaseDashboardActionIntent & { domain: 'replay'; action: ReplayAction; target?: DashboardActionTarget & { kind: 'replay-step' | 'run' } })
  | (BaseDashboardActionIntent & { domain: 'agent'; action: AgentAction; target: DashboardActionTarget & { kind: 'agent'; id: string }; targetId: string })
  | (BaseDashboardActionIntent & { domain: 'command'; action: CommandAction; target: DashboardActionTarget & { kind: 'command' } });

export interface DashboardActionReasonAttributes {
  title: string;
  'aria-description': string;
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

export function buildReplayActionIntent(action: ReplayAction, target?: string | (DashboardActionTarget & { kind: 'replay-step' | 'run' })): DashboardActionIntent {
  const normalizedTarget = typeof target === 'string' ? { kind: 'replay-step' as const, id: target } : target;
  return disabledIntent('replay', action, replayLabels[action], BACKEND_REASON, normalizedTarget);
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
