import { describe, expect, it } from 'vitest';
import type { DashboardActionIntent } from './actions';
import {
  buildAgentActionIntent,
  buildApprovalActionIntent,
  buildCommandActionIntent,
  buildReplayActionIntent,
  actionReasonAttributes,
} from './actions';

function expectDisabledBackendIntent(intent: DashboardActionIntent, expected: Partial<DashboardActionIntent>) {
  expect(intent).toMatchObject({
    enabled: false,
    requiresBackend: true,
    ...expected,
  });
  expect(intent.reason).toMatch(/backend API/i);
}

describe('Dashboard runtime action intents', () => {
  it('models approval approve/reject actions as disabled backend intents with target ids and target metadata', () => {
    expectDisabledBackendIntent(buildApprovalActionIntent('approve', 'approval-1'), {
      id: 'approval.approve:approval-1',
      domain: 'approval',
      action: 'approve',
      label: 'Approve',
      targetId: 'approval-1',
      target: { kind: 'approval', id: 'approval-1' },
    });

    expectDisabledBackendIntent(buildApprovalActionIntent('reject', 'approval-2'), {
      id: 'approval.reject:approval-2',
      domain: 'approval',
      action: 'reject',
      label: 'Reject',
      targetId: 'approval-2',
      target: { kind: 'approval', id: 'approval-2' },
    });
  });

  it('models replay actions as disabled until replay/fork/save-eval backend support exists with explicit target kinds', () => {
    expectDisabledBackendIntent(buildReplayActionIntent('replay', { kind: 'replay-step', id: 'step-1' }), {
      id: 'replay.replay:step-1',
      domain: 'replay',
      action: 'replay',
      targetId: 'step-1',
      target: { kind: 'replay-step', id: 'step-1' },
    });

    expectDisabledBackendIntent(buildReplayActionIntent('fork', { kind: 'run', id: 'run-1' }), {
      id: 'replay.fork:run-1',
      domain: 'replay',
      action: 'fork',
      targetId: 'run-1',
      target: { kind: 'run', id: 'run-1' },
    });

    expectDisabledBackendIntent(buildReplayActionIntent('save-eval', { kind: 'run' }), {
      id: 'replay.save-eval:run',
      domain: 'replay',
      action: 'save-eval',
      target: { kind: 'run' },
    });
  });

  it('models agent assign/handoff/unblock actions as disabled backend intents', () => {
    expectDisabledBackendIntent(buildAgentActionIntent('assign', 'agent-1'), {
      domain: 'agent',
      action: 'assign',
      targetId: 'agent-1',
    });

    expectDisabledBackendIntent(buildAgentActionIntent('handoff', 'agent-2'), {
      domain: 'agent',
      action: 'handoff',
      targetId: 'agent-2',
    });

    expectDisabledBackendIntent(buildAgentActionIntent('unblock', 'agent-3'), {
      domain: 'agent',
      action: 'unblock',
      targetId: 'agent-3',
    });
  });

  it('models Ask Harness command submission as a disabled backend intent with clear reason text', () => {
    const intent = buildCommandActionIntent('ask-harness');

    expectDisabledBackendIntent(intent, {
      domain: 'command',
      action: 'ask-harness',
    });
    expect(intent.reason).toMatch(/command/i);
  });

  it('exposes shared title and aria reason attributes for disabled action buttons', () => {
    const intent = buildReplayActionIntent('replay', 'step-1');

    expect(actionReasonAttributes(intent)).toEqual({
      title: intent.reason,
      'aria-description': intent.reason,
    });
  });
});
