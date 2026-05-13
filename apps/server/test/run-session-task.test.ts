import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createServer } from '../src/index.js';
import { buildSessionTask, runSessionTask } from '../src/runtime/run-session-task.js';

async function git(args: string[]) {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  return promisify(execFile)('git', args, { cwd: rootDir });
}

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
      'approval.requested',
    ]));
    expect(result.run.tracePath).toContain('.runs');
  });

  it('captures a review diff and approval request after the session runtime finishes', async () => {
    await git(['init']);
    await git(['config', 'user.email', 'test@example.com']);
    await git(['config', 'user.name', 'Test User']);
    await writeFile(join(rootDir, 'tracked.ts'), 'export const before = 1;\n');
    await git(['add', 'tracked.ts']);
    await git(['commit', '-m', 'initial']);
    await writeFile(join(rootDir, 'tracked.ts'), 'export const after = 2;\n');

    const result = await runSessionTask({
      sessionId: 'sess_abc_123',
      projectPath: rootDir,
      message: 'Inspect changed files safely',
      model: 'scripted',
      maxSteps: 3,
    });

    expect(result.review).toMatchObject({
      approval: expect.objectContaining({ status: 'pending', risk: 'medium' }),
      summary: expect.objectContaining({ fileCount: 1, additions: 1, deletions: 1 }),
      changedFiles: [expect.objectContaining({ path: 'tracked.ts', status: 'modified' })],
    });
    expect(result.review?.diffs[0]).toMatchObject({ filePath: 'tracked.ts', patch: expect.stringContaining('export const after = 2;') });
    expect(result.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'approval.requested', data: expect.objectContaining({ fileCount: 1 }) }),
    ]));
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
      review: expect.objectContaining({ approval: expect.objectContaining({ status: 'pending' }) }),
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
      'approval.requested',
    ]));

    const streamResponse = await server.fetch(new Request(`http://localhost/api/sessions/${sessionId}/stream`));
    const streamText = await streamResponse.text();

    expect(streamResponse.headers.get('content-type')).toContain('text/event-stream');
    expect(streamText).toContain('event: runtime.task.finished');
    expect(streamText).toContain('data:');
  });
});
