import { mkdir, readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { TraceEventSchema } from './schema.js';
import type { TraceEvent } from './types.js';

export class JsonlEventStore {
  constructor(public readonly tracePath: string) {}

  async append(event: TraceEvent): Promise<void> {
    const parsed = TraceEventSchema.parse(event);
    await mkdir(path.dirname(this.tracePath), { recursive: true });
    await appendFile(this.tracePath, `${JSON.stringify(parsed)}\n`, 'utf8');
  }

  async *readAll(): AsyncIterable<TraceEvent> {
    let content = '';
    try { content = await readFile(this.tracePath, 'utf8'); } catch (error: any) {
      if (error?.code === 'ENOENT') return;
      throw error;
    }
    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      yield TraceEventSchema.parse(JSON.parse(line));
    }
  }
}

export function event(event: Omit<TraceEvent, 'eventId' | 'timestamp' | 'actor'> & { actor?: string }): TraceEvent {
  return { actor: 'runtime', ...event, eventId: crypto.randomUUID(), timestamp: new Date().toISOString() };
}
