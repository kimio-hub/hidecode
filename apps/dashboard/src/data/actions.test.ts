import { describe, expect, it } from 'vitest';
import type { DashboardActionIntent, ReplayActionIntent, RuntimeActionResponse } from './actions';
import {
  buildAgentActionIntent,
  buildApprovalActionIntent,
  buildCommandActionIntent,
  buildReplayActionIntent,
  actionReasonAttributes,
  DEFAULT_RUNTIME_ACTION_READINESS,
  normalizeRuntimeActionReadiness,
  runtimeActionReadinessMessage,
  toRuntimeActionAuditEvent,
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

describe('Dashboard runtime action readiness', () => {
  it('defaults to no backend configured with action submission disabled', () => {
    expect(DEFAULT_RUNTIME_ACTION_READINESS).toEqual({
      state: 'not-configured',
      canSubmitActions: false,
      reason: 'Dashboard runtime actions backend is not configured.',
    });

    expect(runtimeActionReadinessMessage(DEFAULT_RUNTIME_ACTION_READINESS)).toBe(
      'Runtime actions unavailable: backend not configured.',
    );
  });

  it('models a configured backend that is offline or unhealthy', () => {
    expect(
      runtimeActionReadinessMessage({
        state: 'offline',
        canSubmitActions: false,
        reason: 'Dashboard runtime actions backend is unreachable.',
        checkedAt: '2026-05-11T00:00:00.000Z',
        backendVersion: 'runtime-0.1.0',
        contractVersion: 'dashboard-runtime-actions.v1',
        lastError: 'Health check timed out.',
      }),
    ).toBe('Runtime actions unavailable: backend offline. Dashboard runtime actions backend is unreachable. Last error: Health check timed out.');
  });

  it('models an online backend that remains preview-only and cannot submit actions', () => {
    expect(
      runtimeActionReadinessMessage({
        state: 'preview-only',
        canSubmitActions: false,
        reason: 'Runtime actions are visible for preview while submission remains policy-gated.',
        checkedAt: '2026-05-11T00:01:00.000Z',
        backendVersion: 'runtime-0.2.0',
        contractVersion: 'dashboard-runtime-actions.v1',
      }),
    ).toBe('Runtime actions preview only: Runtime actions are visible for preview while submission remains policy-gated.');
  });

  it('models an online contract-compatible backend as action-submission ready', () => {
    expect(
      runtimeActionReadinessMessage({
        state: 'online',
        canSubmitActions: true,
        reason: 'Runtime action backend is online and contract-compatible.',
        checkedAt: '2026-05-11T00:02:00.000Z',
        backendVersion: 'runtime-1.0.0',
        contractVersion: 'dashboard-runtime-actions.v1',
      }),
    ).toBe('Runtime actions ready: Runtime action backend is online and contract-compatible.');
  });
  it('normalizes absent readiness to the safe default', () => {
    expect(normalizeRuntimeActionReadiness()).toEqual(DEFAULT_RUNTIME_ACTION_READINESS);
  });

  it('normalizes incoherent unavailable readiness states to non-submittable', () => {
    expect(
      normalizeRuntimeActionReadiness({
        state: 'offline',
        canSubmitActions: true,
        reason: 'Backend health check failed.',
        contractVersion: 'dashboard-runtime-actions.v1',
        lastError: 'ECONNREFUSED',
      }),
    ).toEqual({
      state: 'offline',
      canSubmitActions: false,
      reason: 'Backend health check failed.',
      contractVersion: 'dashboard-runtime-actions.v1',
      lastError: 'ECONNREFUSED',
    });

    expect(
      normalizeRuntimeActionReadiness({
        state: 'preview-only',
        canSubmitActions: true,
        reason: 'Preview mode only.',
        contractVersion: 'dashboard-runtime-actions.v1',
      }),
    ).toMatchObject({ state: 'preview-only', canSubmitActions: false });
  });

  it('only preserves submit capability for online contract-compatible readiness', () => {
    expect(
      normalizeRuntimeActionReadiness({
        state: 'online',
        canSubmitActions: true,
        reason: 'Runtime action backend is online and contract-compatible.',
        contractVersion: 'dashboard-runtime-actions.v1',
        backendVersion: 'runtime-1.0.0',
      }),
    ).toEqual({
      state: 'online',
      canSubmitActions: true,
      reason: 'Runtime action backend is online and contract-compatible.',
      contractVersion: 'dashboard-runtime-actions.v1',
      backendVersion: 'runtime-1.0.0',
    });

    expect(
      normalizeRuntimeActionReadiness({
        state: 'online',
        canSubmitActions: true,
        reason: 'Runtime action backend is online with an unknown contract.',
      }),
    ).toMatchObject({ state: 'online', canSubmitActions: false });
  });
});

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

  it('models accepted runtime action responses and audit events without side effects', () => {
    const request = toRuntimeActionRequest(buildApprovalActionIntent('approve', 'approval-1'), 'client-1');
    const response: RuntimeActionResponse = {
      status: 'accepted',
      accepted: true,
      commandId: 'command-1',
      traceEventId: 'trace-1',
      queuedOperationId: 'operation-1',
    };

    expect(toRuntimeActionAuditEvent({ eventId: response.traceEventId, commandId: response.commandId, request, response, receivedAt: '2026-05-11T00:00:00.000Z' })).toEqual({
      eventId: 'trace-1',
      type: 'dashboard.runtime_action.accepted',
      commandId: 'command-1',
      clientRequestId: 'client-1',
      domain: 'approval',
      action: 'approve',
      target: { kind: 'approval', id: 'approval-1' },
      receivedAt: '2026-05-11T00:00:00.000Z',
      outcome: {
        status: 'accepted',
        accepted: true,
        queuedOperationId: 'operation-1',
      },
    });
  });

  it('models rejected and duplicate runtime action audit events with sanitized reasons', () => {
    const request = toRuntimeActionRequest(buildReplayActionIntent('fork', { kind: 'run', id: 'run-1' }), 'client-2');
    const rejected: RuntimeActionResponse = {
      status: 'rejected',
      accepted: false,
      commandId: 'command-2',
      traceEventId: 'trace-2',
      reason: 'Rejected by policy check.',
    };

    expect(toRuntimeActionAuditEvent({ eventId: rejected.traceEventId, commandId: rejected.commandId, request, response: rejected, receivedAt: '2026-05-11T00:01:00.000Z' })).toEqual({
      eventId: 'trace-2',
      type: 'dashboard.runtime_action.rejected',
      commandId: 'command-2',
      clientRequestId: 'client-2',
      domain: 'replay',
      action: 'fork',
      target: { kind: 'run', id: 'run-1' },
      receivedAt: '2026-05-11T00:01:00.000Z',
      outcome: {
        status: 'rejected',
        accepted: false,
        reason: 'Rejected by policy check.',
      },
    });

    const duplicate: RuntimeActionResponse = {
      status: 'duplicate',
      accepted: false,
      commandId: 'command-2',
      traceEventId: 'trace-2',
      reason: 'Duplicate commandId; original trace event returned.',
    };

    expect(toRuntimeActionAuditEvent({ eventId: 'trace-duplicate', commandId: duplicate.commandId, request, response: duplicate, receivedAt: '2026-05-11T00:02:00.000Z' }).outcome).toEqual({
      status: 'duplicate',
      accepted: false,
      reason: 'Duplicate commandId; original trace event returned.',
    });
  });
});
