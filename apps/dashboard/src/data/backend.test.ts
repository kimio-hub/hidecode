import { describe, expect, it } from 'vitest';

import { sessionEventsToTraceEvents, sessionMessagesToChatMessages, type BackendSession } from './backend';

const createdAt = '2026-05-11T22:00:00.000Z';

describe('dashboard backend adapters', () => {
  it('maps backend session messages into chat messages', () => {
    expect(sessionMessagesToChatMessages([
      { id: 'msg-1', role: 'user', content: 'Fix tests', createdAt },
    ])).toEqual([
      { id: 'msg-1', role: 'user', content: 'Fix tests', createdAt },
    ]);
  });

  it('allows sessions to carry persisted run summaries', () => {
    const session: BackendSession = {
      id: 'sess-1',
      title: 'hidecode session',
      projectPath: '/repo',
      messages: [],
      events: [],
      runs: [{
        id: 'run-1',
        ok: true,
        summary: 'done',
        tracePath: '/repo/.runs/run-1/trace.jsonl',
        reportPath: '/repo/.runs/run-1/report.md',
        steps: 2,
        durationMs: 10,
        createdAt,
      }],
    };

    expect(session.runs?.[0]?.summary).toBe('done');
  });

  it('maps backend session events into trace events for the inspector', () => {
    expect(sessionEventsToTraceEvents([
      {
        id: 'evt-1',
        sessionId: 'sess-1',
        type: 'tool.requested',
        createdAt,
        data: { runId: 'run-1', taskId: 'task-1', actor: 'orchestrator', tool: 'read' },
      },
    ])).toEqual([
      {
        eventId: 'evt-1',
        runId: 'run-1',
        taskId: 'task-1',
        type: 'tool.requested',
        timestamp: createdAt,
        actor: 'orchestrator',
        data: { runId: 'run-1', taskId: 'task-1', actor: 'orchestrator', tool: 'read' },
      },
    ]);
  });
});
