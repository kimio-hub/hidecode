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
  it('models approval approve/reject actions as disabled backend intents with target ids', () => {
    expectDisabledBackendIntent(buildApprovalActionIntent('approve', 'approval-1'), {
      domain: 'approval',
      action: 'approve',
      targetId: 'approval-1',
    });

    expectDisabledBackendIntent(buildApprovalActionIntent('reject', 'approval-2'), {
      domain: 'approval',
      action: 'reject',
      targetId: 'approval-2',
    });
  });

  it('models replay actions as disabled until replay/fork/save-eval backend support exists', () => {
    expectDisabledBackendIntent(buildReplayActionIntent('replay', 'step-1'), {
      domain: 'replay',
      action: 'replay',
      targetId: 'step-1',
    });

    expectDisabledBackendIntent(buildReplayActionIntent('fork', 'run-1'), {
      domain: 'replay',
      action: 'fork',
      targetId: 'run-1',
    });

    expectDisabledBackendIntent(buildReplayActionIntent('save-eval'), {
      domain: 'replay',
      action: 'save-eval',
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
