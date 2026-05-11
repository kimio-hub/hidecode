import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createServer } from '../src/index.js';
import { buildSessionTask, runSessionTask } from '../src/runtime/run-session-task.js';

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(join(tmpdir(), 'world-harness-session-runtime-'));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

async function json(response: Response) {
  return await response.json() as Record<string, unknown>;
}

describe('chat to orchestrator bridge', () => {
  it('builds a TaskSchema-compatible task from a session and user message', () => {
    const task = buildSessionTask({
      sessionId: 'sess_abc_123',
      projectPath: rootDir,
      message: 'Fix the failing add test',
      maxSteps: 3,
    });

    expect(task).toMatchObject({
      taskId: 'sess_abc_123',
      repo: rootDir,
      goal: 'Fix the failing add test',
      mode: 'autonomous',
      budget: { maxSteps: 3 },
    });
  });

  it('runs a deterministic session task and returns persisted runtime events', async () => {
    const result = await runSessionTask({
      sessionId: 'sess_abc_123',
      projectPath: rootDir,
      message: 'Inspect the project safely',
      model: 'scripted',
      maxSteps: 3,
    });

    expect(result.ok).toBe(true);
    expect(result.run).toMatchObject({ ok: true, summary: 'session task completed' });
    expect(result.events.map((event) => event.type)).toEqual(expect.arrayContaining([
      'runtime.task.started',
      'task.created',
      'model.requested',
      'task.completed',
      'runtime.task.finished',
    ]));
    expect(result.run.tracePath).toContain('.runs');
  });

  it('starts a runtime task when a chat message is posted and streams events as SSE', async () => {
    const server = createServer({ rootDir });
    const sessionResponse = await server.fetch(new Request('http://localhost/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectPath: rootDir, title: 'Bridge test' }),
    }));
    const created = await json(sessionResponse);
    const sessionId = (created.session as { id: string }).id;

    const messageResponse = await server.fetch(new Request(`http://localhost/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'Run a deterministic bridge task' }),
    }));
    const messageBody = await json(messageResponse);

    expect(messageResponse.status).toBe(201);
    expect(messageBody.run).toMatchObject({ ok: true, summary: 'session task completed' });
    expect(messageBody.session).toMatchObject({
      runs: [expect.objectContaining({ ok: true, summary: 'session task completed' })],
    });

    const eventsResponse = await server.fetch(new Request(`http://localhost/api/sessions/${sessionId}/events`));
    const eventsBody = await json(eventsResponse);
    const eventTypes = (eventsBody.events as Array<{ type: string }>).map((event) => event.type);

    expect(eventTypes).toEqual(expect.arrayContaining([
      'chat.message.created',
      'runtime.task.started',
      'task.created',
      'task.completed',
      'runtime.task.finished',
    ]));

    const streamResponse = await server.fetch(new Request(`http://localhost/api/sessions/${sessionId}/stream`));
    const streamText = await streamResponse.text();

    expect(streamResponse.headers.get('content-type')).toContain('text/event-stream');
    expect(streamText).toContain('event: runtime.task.finished');
    expect(streamText).toContain('data:');
  });
});
