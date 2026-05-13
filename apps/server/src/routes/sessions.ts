import type { JsonStore } from '../storage.js';
import { UnsafeSessionIdError } from '../storage.js';
import { jsonResponse, readJsonObject } from '../http.js';
import { runSessionTask, type RunSessionTaskOptions } from '../runtime/run-session-task.js';
import { encodeSessionEventsAsSse } from '../runtime/session-events.js';

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
  runs?: SessionRun[];
  review?: SessionReview;
}

export interface SessionReviewApproval {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  risk: 'low' | 'medium' | 'high' | 'critical';
  policyExplanation: string;
}

export interface SessionReview {
  summary: {
    fileCount: number;
    additions: number;
    deletions: number;
    byStatus: Record<'added' | 'modified' | 'deleted' | 'renamed', number>;
  };
  changedFiles: Array<{
    path: string;
    oldPath?: string;
    language?: string;
    additions: number;
    deletions: number;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
  }>;
  diffs: Array<{ filePath: string; oldPath?: string; patch: string }>;
  approval: SessionReviewApproval;
}

export interface SessionRun {
  id: string;
  ok: boolean;
  summary: string;
  tracePath: string;
  reportPath: string;
  steps: number;
  durationMs: number;
  createdAt: string;
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

  const runtimeOptions = parseRuntimeOptions(body, session.id, session.projectPath, content);
  let runtimeResult: Awaited<ReturnType<typeof runSessionTask>> | undefined;
  try {
    runtimeResult = await runSessionTask(runtimeOptions);
    session.events.push(...runtimeResult.events);
    session.runs = [...(session.runs ?? []), toSessionRun(runtimeResult.run)];
    session.review = runtimeResult.review;
    session.updatedAt = new Date().toISOString();
  } catch (error) {
    session.events.push(makeEvent(session.id, 'runtime.task.failed', {
      message: error instanceof Error ? error.message : String(error),
    }));
    session.updatedAt = new Date().toISOString();
    await writeSession(store, session);
    throw error;
  }

  await writeSession(store, session);
  return jsonResponse({ message, session, run: runtimeResult?.run }, { status: 201 });
}

export async function handleListEvents(store: JsonStore, sessionId: string): Promise<Response> {
  const session = await readSession(store, sessionId);
  if (!session) {
    return jsonResponse({ error: 'session_not_found', sessionId }, { status: 404 });
  }
  return jsonResponse({ events: session.events });
}

export async function handleStreamEvents(store: JsonStore, sessionId: string): Promise<Response> {
  const session = await readSession(store, sessionId);
  if (!session) {
    return jsonResponse({ error: 'session_not_found', sessionId }, { status: 404 });
  }

  return new Response(encodeSessionEventsAsSse(session.events), {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    },
  });
}

function parseRuntimeOptions(body: Record<string, unknown>, sessionId: string, projectPath: string, message: string): RunSessionTaskOptions {
  const runtime = body.runtime;
  if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)) {
    return { sessionId, projectPath, message, model: 'scripted', maxSteps: 3 };
  }

  const runtimeBody = runtime as Record<string, unknown>;
  const model = runtimeBody.model === 'openai' ? 'openai' : 'scripted';
  const maxSteps = typeof runtimeBody.maxSteps === 'number' && Number.isInteger(runtimeBody.maxSteps) && runtimeBody.maxSteps > 0
    ? runtimeBody.maxSteps
    : 3;

  return {
    sessionId,
    projectPath,
    message,
    model,
    maxSteps,
    modelName: typeof runtimeBody.modelName === 'string' ? runtimeBody.modelName : undefined,
    baseUrl: typeof runtimeBody.baseUrl === 'string' ? runtimeBody.baseUrl : undefined,
    apiKey: typeof runtimeBody.apiKey === 'string' ? runtimeBody.apiKey : undefined,
  };
}

function toSessionRun(run: Awaited<ReturnType<typeof runSessionTask>>['run']): SessionRun {
  return {
    id: run.tracePath,
    ok: run.ok,
    summary: run.summary,
    tracePath: run.tracePath,
    reportPath: run.reportPath,
    steps: run.steps,
    durationMs: run.durationMs,
    createdAt: new Date().toISOString(),
  };
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
