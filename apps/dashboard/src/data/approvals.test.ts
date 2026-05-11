import { describe, expect, it } from 'vitest';
import type { TraceEvent } from './loader';
import { deriveApprovalQueue } from './approvals';

function event(partial: Partial<TraceEvent> & { type: string; data?: Record<string, unknown> }): TraceEvent {
  return {
    eventId: partial.eventId ?? `event-${partial.type}`,
    runId: partial.runId ?? 'run-test',
    taskId: partial.taskId ?? 'task-test',
    timestamp: partial.timestamp ?? '2026-05-10T00:00:00.000Z',
    actor: partial.actor ?? 'runtime',
    type: partial.type,
    data: partial.data ?? {},
  };
}

describe('deriveApprovalQueue', () => {
  it('derives policy decisions as queue items', () => {
    const items = deriveApprovalQueue([
      event({
        eventId: 'p1',
        type: 'policy.decision',
        data: { decision: 'deny', reason: 'write outside workspace', risk: 'high' },
      }),
    ]);

    expect(items).toEqual([
      expect.objectContaining({
        id: 'p1',
        kind: 'policy',
        risk: 'high',
        status: 'denied',
        title: 'Policy decision: deny',
        summary: 'write outside workspace',
      }),
    ]);
  });

  it('derives security findings and preserves highest severity', () => {
    const items = deriveApprovalQueue([
      event({
        eventId: 's1',
        type: 'security.finding',
        data: { findings: [{ severity: 'medium', message: 'token-like value' }, { severity: 'critical', message: 'private key' }] },
      }),
    ]);

    expect(items[0]).toMatchObject({
      id: 's1',
      kind: 'security',
      risk: 'critical',
      status: 'informational',
      title: 'Security findings',
    });
    expect(items[0].summary).toContain('private key');
  });

  it('includes high and critical risk tool events but excludes low risk tools', () => {
    const items = deriveApprovalQueue([
      event({ eventId: 'low-tool', type: 'tool.call', data: { name: 'read_file', risk: 'low' } }),
      event({ eventId: 'high-tool', type: 'tool.call', data: { name: 'write_file', risk: 'high', input: { path: 'src/a.ts' } } }),
      event({ eventId: 'critical-tool', type: 'tool.started', data: { name: 'execute', risk: 'critical' } }),
    ]);

    expect(items.map(item => item.id)).toEqual(['high-tool', 'critical-tool']);
    expect(items[0]).toMatchObject({ kind: 'tool-risk', risk: 'high', status: 'pending', title: 'High-risk tool: write_file' });
    expect(items[1]).toMatchObject({ kind: 'tool-risk', risk: 'critical', status: 'pending', title: 'High-risk tool: execute' });
  });

  it('derives sandbox blocked events as denied high-risk queue items', () => {
    const items = deriveApprovalQueue([
      event({
        eventId: 'sandbox-1',
        type: 'sandbox.blocked',
        data: { error: 'Readonly sandbox blocked write', sandbox: { mode: 'local', writeMode: 'readonly' } },
      }),
    ]);

    expect(items[0]).toMatchObject({
      id: 'sandbox-1',
      kind: 'sandbox',
      risk: 'high',
      status: 'denied',
      title: 'Sandbox blocked: local',
    });
    expect(items[0].summary).toContain('Readonly sandbox blocked write');
    expect(items[0].summary).toContain('writeMode=readonly');
  });

  it('derives explicit orchestrator approval requests as pending approval items', () => {
    const items = deriveApprovalQueue([
      event({
        eventId: 'approval-1',
        type: 'approval.requested',
        data: {
          tool: 'execute_shell',
          reason: 'Command requires write access',
          risk: 'high',
        },
      }),
    ]);

    expect(items).toEqual([
      expect.objectContaining({
        id: 'approval-1',
        kind: 'approval',
        risk: 'high',
        status: 'pending',
        title: 'Approval requested: execute_shell',
        summary: 'Command requires write access',
      }),
    ]);
  });

  it('derives resolved orchestrator approvals as allowed or denied items', () => {
    const items = deriveApprovalQueue([
      event({
        eventId: 'approval-allowed',
        type: 'approval.resolved',
        data: { tool: 'write_file', decision: 'approved', summary: 'Allowed by operator', risk: 'medium' },
      }),
      event({
        eventId: 'approval-denied',
        type: 'approval.resolved',
        data: { tool: 'terminal', decision: 'denied', reason: 'Unsafe command', risk: 'critical' },
      }),
    ]);

    expect(items[0]).toMatchObject({
      id: 'approval-allowed',
      kind: 'approval',
      risk: 'medium',
      status: 'allowed',
      title: 'Approval resolved: write_file',
      summary: 'Allowed by operator',
    });
    expect(items[1]).toMatchObject({
      id: 'approval-denied',
      kind: 'approval',
      risk: 'critical',
      status: 'denied',
      title: 'Approval resolved: terminal',
      summary: 'Unsafe command',
    });
  });
});
