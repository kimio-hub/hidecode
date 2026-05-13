import { describe, expect, it, vi } from 'vitest';

import {
  listBackendSessions,
  loadBackendSession,
  sessionEventsToTraceEvents,
  sessionMessagesToChatMessages,
  type BackendSession,
} from './backend';

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

  it('lists backend session summaries from the local app backend', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        sessions: [{
          id: 'sess-1',
          title: 'hidecode session',
          projectPath: '/repo',
          createdAt,
          updatedAt: createdAt,
          messageCount: 2,
          eventCount: 5,
        }],
      }),
    } as Response));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listBackendSessions('http://127.0.0.1:8787')).resolves.toEqual([
      {
        id: 'sess-1',
        title: 'hidecode session',
        projectPath: '/repo',
        createdAt,
        updatedAt: createdAt,
        messageCount: 2,
        eventCount: 5,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8787/api/sessions', expect.objectContaining({ method: 'GET' }));
  });

  it('loads a full backend session by id', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        session: {
          id: 'sess/1',
          title: 'Fix tests',
          projectPath: '/repo',
          messages: [{ id: 'msg-1', role: 'user', content: 'Fix tests', createdAt }],
          events: [{ id: 'evt-1', sessionId: 'sess/1', type: 'tool.requested', createdAt, data: { tool: 'test' } }],
        },
      }),
    } as Response));
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadBackendSession('sess/1', 'http://127.0.0.1:8787')).resolves.toMatchObject({
      id: 'sess/1',
      title: 'Fix tests',
      messages: [expect.objectContaining({ content: 'Fix tests' })],
      events: [expect.objectContaining({ type: 'tool.requested' })],
    });
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8787/api/sessions/sess%2F1', expect.objectContaining({ method: 'GET' }));
  });
});
