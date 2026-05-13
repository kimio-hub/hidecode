import type { ChatMessage } from './chat';
import type { TraceEvent } from './loader';

export interface BackendSessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface BackendSessionEvent {
  id: string;
  sessionId: string;
  type: string;
  createdAt: string;
  data: Record<string, unknown>;
}

export interface BackendSessionRun {
  id: string;
  ok: boolean;
  summary: string;
  tracePath: string;
  reportPath: string;
  steps: number;
  durationMs: number;
  createdAt: string;
}

export interface BackendSession {
  id: string;
  title: string;
  projectPath: string;
  messages: BackendSessionMessage[];
  events: BackendSessionEvent[];
  runs?: BackendSessionRun[];
  review?: BackendSessionReview;
}

export interface BackendSessionReview {
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
  approval: {
    id: string;
    title: string;
    status: 'pending' | 'approved' | 'rejected';
    risk: 'low' | 'medium' | 'high' | 'critical';
    policyExplanation: string;
  };
}

export interface BackendSessionSummary {
  id: string;
  title: string;
  projectPath: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  eventCount: number;
}

export interface BackendListSessionsResponse {
  sessions: BackendSessionSummary[];
}

export interface BackendListSessionEventsResponse {
  events: BackendSessionEvent[];
}

export interface BackendCreateSessionResponse {
  session: BackendSession;
}

export interface BackendGetSessionResponse {
  session: BackendSession;
}

export interface BackendCreateMessageResponse {
  message: BackendSessionMessage;
  session: BackendSession;
  run?: Omit<BackendSessionRun, 'id' | 'createdAt'>;
}

export function getBackendBaseUrl(search = window.location.search): string {
  const params = new URLSearchParams(search);
  return params.get('api') ?? '';
}

export function sessionMessagesToChatMessages(messages: BackendSessionMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    createdAt: message.createdAt,
    content: message.content,
  }));
}

export function sessionEventsToTraceEvents(events: BackendSessionEvent[]): TraceEvent[] {
  return events.map((event) => ({
    eventId: event.id,
    runId: stringValue(event.data.runId) ?? event.sessionId,
    taskId: stringValue(event.data.taskId) ?? event.sessionId,
    type: event.type,
    timestamp: event.createdAt,
    actor: stringValue(event.data.actor) ?? 'server',
    data: event.data,
  }));
}

export async function listBackendSessions(baseUrl = ''): Promise<BackendSessionSummary[]> {
  const response = await fetch(`${baseUrl}/api/sessions`, { method: 'GET' });
  if (!response.ok) throw new Error(`Failed to list sessions: ${response.status}`);
  const body = await response.json() as BackendListSessionsResponse;
  return body.sessions;
}

export async function loadBackendSession(sessionId: string, baseUrl = ''): Promise<BackendSession> {
  const response = await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(sessionId)}`, { method: 'GET' });
  if (!response.ok) throw new Error(`Failed to load session: ${response.status}`);
  const body = await response.json() as BackendGetSessionResponse;
  return body.session;
}

export async function listBackendSessionEvents(sessionId: string, baseUrl = ''): Promise<BackendSessionEvent[]> {
  const response = await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/events`, { method: 'GET' });
  if (!response.ok) throw new Error(`Failed to list session events: ${response.status}`);
  const body = await response.json() as BackendListSessionEventsResponse;
  return body.events;
}

export async function createBackendSession(projectPath = '', baseUrl = ''): Promise<BackendSession> {
  const trimmedProjectPath = projectPath.trim();
  const response = await fetch(`${baseUrl}/api/sessions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...(trimmedProjectPath ? { projectPath: trimmedProjectPath } : {}), title: 'hidecode session' }),
  });
  if (!response.ok) throw new Error(`Failed to create session: ${response.status}`);
  const body = await response.json() as BackendCreateSessionResponse;
  return body.session;
}

export async function postBackendMessage(sessionId: string, content: string, baseUrl = ''): Promise<BackendCreateMessageResponse> {
  const response = await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error(`Failed to post message: ${response.status}`);
  return await response.json() as BackendCreateMessageResponse;
}

export function openSessionEventSource(sessionId: string, baseUrl = ''): EventSource {
  return new EventSource(`${baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/stream`);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
