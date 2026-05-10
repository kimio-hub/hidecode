import { describe, expect, it } from 'vitest';
import { TaskSchema, TraceEventSchema, RunManifestSchema, ChangeSetSchema } from '../src/index.js';

describe('core schemas', () => {
  it('validates task as first-class object', () => {
    const task = TaskSchema.parse({ taskId: 't1', goal: 'fix bug', repo: '/repo', mode: 'autonomous' });
    expect(task.constraints).toEqual([]);
  });
  it('validates replay-grade event', () => {
    expect(TraceEventSchema.parse({ eventId: 'e1', runId: 'r1', taskId: 't1', type: 'task.created', timestamp: new Date().toISOString() }).type).toBe('task.created');
  });
  it('validates run manifest and changeset', () => {
    expect(RunManifestSchema.safeParse({ runId: 'r1', taskId: 't1', harnessVersion: '0.1.0', model: { provider: 'local', name: 'scripted' }, workspace: { repo: '/repo' }, artifacts: { root: 'r', trace: 't', report: 'p', patch: 'd' } }).success).toBe(true);
    expect(ChangeSetSchema.safeParse({ changeSetId: 'c1', taskId: 't1', changes: [] }).success).toBe(true);
  });
});
