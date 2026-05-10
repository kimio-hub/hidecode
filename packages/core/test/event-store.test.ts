import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { JsonlEventStore, event } from '../src/index.js';

describe('JsonlEventStore', () => {
  it('appends and reads events in order', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'wh-'));
    const store = new JsonlEventStore(path.join(dir, 'trace.jsonl'));
    await store.append(event({ runId: 'r1', taskId: 't1', type: 'task.created', data: {} }));
    await store.append(event({ runId: 'r1', taskId: 't1', type: 'task.completed', data: { ok: true } }));
    const events = [];
    for await (const e of store.readAll()) events.push(e.type);
    expect(events).toEqual(['task.created', 'task.completed']);
  });
});
