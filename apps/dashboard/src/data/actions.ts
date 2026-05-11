export type DashboardActionDomain = 'approval' | 'replay' | 'agent' | 'command';

export type ApprovalAction = 'approve' | 'reject';
export type ReplayAction = 'replay' | 'fork' | 'save-eval';
export type AgentAction = 'assign' | 'handoff' | 'unblock';
export type CommandAction = 'ask-harness';

export type DashboardAction = ApprovalAction | ReplayAction | AgentAction | CommandAction;

export interface DashboardActionIntent {
  id: string;
  domain: DashboardActionDomain;
  action: DashboardAction;
  label: string;
  enabled: boolean;
  reason: string;
  requiresBackend: boolean;
  targetId?: string;
}

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
  return disabledIntent('approval', action, approvalLabels[action], BACKEND_REASON, targetId);
}

export function buildReplayActionIntent(action: ReplayAction, targetId?: string): DashboardActionIntent {
  return disabledIntent('replay', action, replayLabels[action], BACKEND_REASON, targetId);
}

export function buildAgentActionIntent(action: AgentAction, targetId: string): DashboardActionIntent {
  return disabledIntent('agent', action, agentLabels[action], BACKEND_REASON, targetId);
}

export function buildCommandActionIntent(action: CommandAction): DashboardActionIntent {
  return disabledIntent('command', action, commandLabels[action], COMMAND_REASON);
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
  targetId?: string,
): DashboardActionIntent {
  return {
    id: targetId ? `${domain}.${action}:${targetId}` : `${domain}.${action}`,
    domain,
    action,
    label,
    enabled: false,
    reason,
    requiresBackend: true,
    ...(targetId ? { targetId } : {}),
  };
}
