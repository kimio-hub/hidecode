import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JsonlEventStore } from '../src/core/event-store.js';
import { newId, nowIso } from '../src/core/schemas.js';

describe('JsonlEventStore', () => {
  it('appends and reads typed events', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'world-harness-'));
    const store = new JsonlEventStore(join(dir, 'events.jsonl'));
    await store.append({ id: newId('evt'), timestamp: nowIso(), type: 'task.created', actor: 'test', data: { ok: true } });
    const events = await store.readAll();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('task.created');
    const raw = await readFile(join(dir, 'events.jsonl'), 'utf8');
    expect(raw.trim().split('\n')).toHaveLength(1);
  });
});
