import type { HarnessEvent } from '@world-harness/orchestrator';

import type { SessionEvent } from '../routes/sessions.js';

export function runtimeEventToSessionEvent(sessionId: string, event: HarnessEvent): SessionEvent {
  return {
    id: event.eventId,
    sessionId,
    type: event.type,
    createdAt: event.timestamp,
    data: {
      ...event.data,
      runId: event.runId,
      taskId: event.taskId,
      actor: event.actor,
    },
  };
}

export function makeRuntimeSessionEvent(sessionId: string, type: string, data: Record<string, unknown> = {}): SessionEvent {
  const now = new Date().toISOString();
  return {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    sessionId,
    type,
    createdAt: now,
    data,
  };
}

export function encodeSessionEventsAsSse(events: SessionEvent[]): string {
  return events
    .map((event) => [
      `id: ${event.id}`,
      `event: ${event.type}`,
      `data: ${JSON.stringify(event)}`,
      '',
    ].join('\n'))
    .join('\n');
}
