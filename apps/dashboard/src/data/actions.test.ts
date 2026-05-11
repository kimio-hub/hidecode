import { describe, expect, it } from 'vitest';
import type { DashboardActionIntent, ReplayActionIntent } from './actions';
import {
  buildAgentActionIntent,
  buildApprovalActionIntent,
  buildCommandActionIntent,
  buildReplayActionIntent,
  actionReasonAttributes,
  toRuntimeActionRequest,
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
    const replayStepIntent = buildReplayActionIntent('replay', { kind: 'replay-step', id: 'step-1' });
    expectDisabledBackendIntent(replayStepIntent, {
      id: 'replay.replay:step-1',
      domain: 'replay',
      action: 'replay',
      targetId: 'step-1',
      target: { kind: 'replay-step', id: 'step-1' },
    });

    const replayRunIntent = buildReplayActionIntent('replay', { kind: 'run', id: 'run-1' });
    expectDisabledBackendIntent(replayRunIntent, {
      id: 'replay.replay:run-1',
      domain: 'replay',
      action: 'replay',
      targetId: 'run-1',
      target: { kind: 'run', id: 'run-1' },
    });

    const forkIntent = buildReplayActionIntent('fork', { kind: 'run', id: 'run-1' });
    expectDisabledBackendIntent(forkIntent, {
      id: 'replay.fork:run-1',
      domain: 'replay',
      action: 'fork',
      targetId: 'run-1',
      target: { kind: 'run', id: 'run-1' },
    });

    const saveEvalIntent = buildReplayActionIntent('save-eval', { kind: 'run' });
    expectDisabledBackendIntent(saveEvalIntent, {
      id: 'replay.save-eval:run',
      domain: 'replay',
      action: 'save-eval',
      target: { kind: 'run' },
    });
  });

  it('type-checks replay action targets by action', () => {
    const replayStepIntent: ReplayActionIntent & { action: 'replay' } = buildReplayActionIntent('replay', 'step-1');
    const replayRunIntent: ReplayActionIntent & { action: 'replay' } = buildReplayActionIntent('replay', { kind: 'run' });
    const forkRunIntent: ReplayActionIntent & { action: 'fork' } = buildReplayActionIntent('fork', { kind: 'run', id: 'run-1' });
    const saveEvalRunIntent: ReplayActionIntent & { action: 'save-eval' } = buildReplayActionIntent('save-eval', { kind: 'run' });

    expect([replayStepIntent.target?.kind, replayRunIntent.target?.kind, forkRunIntent.target?.kind, saveEvalRunIntent.target?.kind]).toEqual([
      'replay-step',
      'run',
      'run',
      'run',
    ]);

    // @ts-expect-error fork targets runs, not individual replay steps.
    buildReplayActionIntent('fork', { kind: 'replay-step', id: 'step-1' });
    // @ts-expect-error save-eval targets runs, not individual replay steps.
    buildReplayActionIntent('save-eval', { kind: 'replay-step', id: 'step-1' });
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

  it('converts disabled intents into side-effect-free runtime action requests', () => {
    const approvalRequest = toRuntimeActionRequest(buildApprovalActionIntent('approve', 'approval-1'));
    expect(approvalRequest).toEqual({
      domain: 'approval',
      action: 'approve',
      target: { kind: 'approval', id: 'approval-1' },
      requiresBackend: true,
    });

    const replayRequest = toRuntimeActionRequest(buildReplayActionIntent('replay', { kind: 'replay-step', id: 'step-1' }), 'client-1');
    expect(replayRequest).toEqual({
      domain: 'replay',
      action: 'replay',
      target: { kind: 'replay-step', id: 'step-1' },
      requiresBackend: true,
      clientRequestId: 'client-1',
    });

    const commandRequest = toRuntimeActionRequest(buildCommandActionIntent('ask-harness'));
    expect(commandRequest).toEqual({
      domain: 'command',
      action: 'ask-harness',
      target: { kind: 'command' },
      requiresBackend: true,
    });
  });
});
