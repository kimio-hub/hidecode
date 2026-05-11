import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createServer } from '../src/index.js';

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(join(tmpdir(), 'world-harness-server-'));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

async function json(response: Response) {
  return await response.json() as Record<string, unknown>;
}

describe('local backend skeleton', () => {
  it('reports health for the local app backend', async () => {
    const server = createServer({ rootDir });

    const response = await server.fetch(new Request('http://localhost/api/health'));
    const body = await json(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, service: 'world-harness-server' });
    expect(body.storage).toMatchObject({ rootDir });
  });

  it('opens and lists projects in local storage', async () => {
    const server = createServer({ rootDir });

    const openResponse = await server.fetch(new Request('http://localhost/api/projects/open', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: '/workspace/hidecode', name: 'hidecode' }),
    }));
    const opened = await json(openResponse);

    expect(openResponse.status).toBe(201);
    expect(opened.project).toMatchObject({ path: '/workspace/hidecode', name: 'hidecode' });

    const listResponse = await server.fetch(new Request('http://localhost/api/projects'));
    const listed = await json(listResponse);

    expect(listResponse.status).toBe(200);
    expect(listed.projects).toMatchObject([
      { path: '/workspace/hidecode', name: 'hidecode' },
    ]);
  });

  it('creates sessions, accepts chat messages, and exposes session events', async () => {
    const server = createServer({ rootDir });

    const sessionResponse = await server.fetch(new Request('http://localhost/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectPath: '/workspace/hidecode', title: 'Fix tests' }),
    }));
    const created = await json(sessionResponse);

    expect(sessionResponse.status).toBe(201);
    expect(created.session).toMatchObject({ projectPath: '/workspace/hidecode', title: 'Fix tests' });
    expect(typeof (created.session as { id?: unknown }).id).toBe('string');

    const sessionId = (created.session as { id: string }).id;
    const messageResponse = await server.fetch(new Request(`http://localhost/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'Please inspect failing tests' }),
    }));
    const messageBody = await json(messageResponse);

    expect(messageResponse.status).toBe(201);
    expect(messageBody.message).toMatchObject({ role: 'user', content: 'Please inspect failing tests' });

    const getSessionResponse = await server.fetch(new Request(`http://localhost/api/sessions/${sessionId}`));
    const getSessionBody = await json(getSessionResponse);

    expect(getSessionResponse.status).toBe(200);
    expect(getSessionBody.session).toMatchObject({ id: sessionId });
    expect(getSessionBody.session).toMatchObject({
      messages: [expect.objectContaining({ role: 'user', content: 'Please inspect failing tests' })],
    });

    const eventsResponse = await server.fetch(new Request(`http://localhost/api/sessions/${sessionId}/events`));
    const eventsBody = await json(eventsResponse);

    expect(eventsResponse.status).toBe(200);
    expect(eventsBody.events).toEqual([
      expect.objectContaining({ type: 'session.created', sessionId }),
      expect.objectContaining({ type: 'chat.message.created', sessionId }),
    ]);
  });

  it('rejects encoded traversal attempts in session ids', async () => {
    const server = createServer({ rootDir });

    await server.fetch(new Request('http://localhost/api/projects/open', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: '/workspace/hidecode', name: 'hidecode' }),
    }));

    const response = await server.fetch(new Request('http://localhost/api/sessions/..%2Fprojects'));
    const body = await json(response);

    expect(response.status).toBe(404);
    expect(body).toMatchObject({ error: 'session_not_found' });
  });
});
