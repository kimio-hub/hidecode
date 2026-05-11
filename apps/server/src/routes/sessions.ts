import type { JsonStore } from '../storage.js';
import { UnsafeSessionIdError } from '../storage.js';
import { jsonResponse, readJsonObject } from '../http.js';

export type SessionMessageRole = 'user' | 'assistant' | 'system';

export interface SessionMessage {
  id: string;
  role: SessionMessageRole;
  content: string;
  createdAt: string;
}

export interface SessionEvent {
  id: string;
  sessionId: string;
  type: string;
  createdAt: string;
  data: Record<string, unknown>;
}

export interface SessionRecord {
  id: string;
  title: string;
  projectPath: string;
  createdAt: string;
  updatedAt: string;
  messages: SessionMessage[];
  events: SessionEvent[];
}

export async function handleListSessions(store: JsonStore): Promise<Response> {
  await ensureSessionsDir(store);
  const sessions = await readAllSessions(store);
  return jsonResponse({ sessions: sessions.map(toSessionSummary) });
}

export async function handleCreateSession(store: JsonStore, request: Request): Promise<Response> {
  const body = await readJsonObject(request);
  const projectPath = typeof body.projectPath === 'string' && body.projectPath.trim().length > 0
    ? body.projectPath.trim()
    : store.rootDir;
  const title = typeof body.title === 'string' && body.title.trim().length > 0
    ? body.title.trim()
    : 'New coding session';
  const now = new Date().toISOString();
  const session: SessionRecord = {
    id: makeId('sess'),
    title,
    projectPath,
    createdAt: now,
    updatedAt: now,
    messages: [],
    events: [],
  };
  session.events.push(makeEvent(session.id, 'session.created', { title, projectPath }, now));

  await writeSession(store, session);
  return jsonResponse({ session }, { status: 201 });
}

export async function handleGetSession(store: JsonStore, sessionId: string): Promise<Response> {
  const session = await readSession(store, sessionId);
  if (!session) {
    return jsonResponse({ error: 'session_not_found', sessionId }, { status: 404 });
  }
  return jsonResponse({ session });
}

export async function handleCreateMessage(store: JsonStore, sessionId: string, request: Request): Promise<Response> {
  const session = await readSession(store, sessionId);
  if (!session) {
    return jsonResponse({ error: 'session_not_found', sessionId }, { status: 404 });
  }

  const body = await readJsonObject(request);
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) {
    return jsonResponse({ error: 'message_content_required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const message: SessionMessage = {
    id: makeId('msg'),
    role: 'user',
    content,
    createdAt: now,
  };
  session.messages.push(message);
  session.events.push(makeEvent(session.id, 'chat.message.created', { messageId: message.id, role: message.role, content }, now));
  session.updatedAt = now;

  await writeSession(store, session);
  return jsonResponse({ message, session }, { status: 201 });
}

export async function handleListEvents(store: JsonStore, sessionId: string): Promise<Response> {
  const session = await readSession(store, sessionId);
  if (!session) {
    return jsonResponse({ error: 'session_not_found', sessionId }, { status: 404 });
  }
  return jsonResponse({ events: session.events });
}

async function ensureSessionsDir(store: JsonStore): Promise<void> {
  await store.writeJson(`${store.sessionsDir}/.keep.json`, { ok: true });
}

async function readAllSessions(store: JsonStore): Promise<SessionRecord[]> {
  const { readdir } = await import('node:fs/promises');
  try {
    const files = await readdir(store.sessionsDir);
    const sessions = await Promise.all(
      files
        .filter((file) => file.endsWith('.json') && file !== '.keep.json')
        .map((file) => store.readJson<SessionRecord | null>(`${store.sessionsDir}/${file}`, null)),
    );
    return sessions
      .filter((session): session is SessionRecord => Boolean(session))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function readSession(store: JsonStore, sessionId: string): Promise<SessionRecord | null> {
  try {
    return await store.readJson<SessionRecord | null>(store.sessionFile(sessionId), null);
  } catch (error) {
    if (error instanceof UnsafeSessionIdError) {
      return null;
    }
    throw error;
  }
}

async function writeSession(store: JsonStore, session: SessionRecord): Promise<void> {
  await store.writeJson(store.sessionFile(session.id), session);
}

function toSessionSummary(session: SessionRecord) {
  return {
    id: session.id,
    title: session.title,
    projectPath: session.projectPath,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount: session.messages.length,
    eventCount: session.events.length,
  };
}

function makeEvent(sessionId: string, type: string, data: Record<string, unknown>, createdAt = new Date().toISOString()): SessionEvent {
  return {
    id: makeId('evt'),
    sessionId,
    type,
    createdAt,
    data,
  };
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
