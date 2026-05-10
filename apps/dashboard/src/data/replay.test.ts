import { describe, expect, it } from 'vitest';
import type { TraceEvent } from './loader';
import { deriveReplaySteps } from './replay';

const base: Omit<TraceEvent, 'eventId' | 'type' | 'timestamp' | 'actor' | 'data'> = {
  runId: 'run-1',
  taskId: 'task-1',
};

function event(partial: Pick<TraceEvent, 'eventId' | 'type' | 'timestamp' | 'actor'> & { data?: Record<string, unknown> }): TraceEvent {
  return { ...base, data: {}, ...partial };
}

describe('deriveReplaySteps', () => {
  it('sorts events chronologically and computes elapsed time from first event', () => {
    const steps = deriveReplaySteps([
      event({ eventId: 'tool-1', type: 'tool.call', timestamp: '2026-05-10T10:00:03.000Z', actor: 'agent', data: { name: 'terminal' } }),
      event({ eventId: 'task-1', type: 'task.created', timestamp: '2026-05-10T10:00:00.000Z', actor: 'runtime', data: { goal: 'Fix tests' } }),
      event({ eventId: 'model-1', type: 'model.requested', timestamp: '2026-05-10T10:00:01.500Z', actor: 'runtime', data: { prompt: 'Analyze failure' } }),
    ]);

    expect(steps.map(step => step.id)).toEqual(['task-1', 'model-1', 'tool-1']);
    expect(steps.map(step => step.index)).toEqual([1, 2, 3]);
    expect(steps.map(step => step.elapsedMs)).toEqual([0, 1500, 3000]);
  });

  it('normalizes categories and titles for known event families', () => {
    const steps = deriveReplaySteps([
      event({ eventId: 'a', type: 'task.created', timestamp: '2026-05-10T10:00:00.000Z', actor: 'runtime', data: { goal: 'Fix add' } }),
      event({ eventId: 'b', type: 'model.responded', timestamp: '2026-05-10T10:00:01.000Z', actor: 'model', data: { summary: 'Need inspect file' } }),
      event({ eventId: 'c', type: 'tool.result', timestamp: '2026-05-10T10:00:02.000Z', actor: 'runtime', data: { ok: false, summary: 'Tests failed' } }),
      event({ eventId: 'd', type: 'policy.decision', timestamp: '2026-05-10T10:00:03.000Z', actor: 'policy', data: { decision: 'allow', reason: 'within repo' } }),
      event({ eventId: 'e', type: 'security.finding', timestamp: '2026-05-10T10:00:04.000Z', actor: 'security', data: { severity: 'high', message: 'Secret-like token' } }),
      event({ eventId: 'f', type: 'diff.applied', timestamp: '2026-05-10T10:00:05.000Z', actor: 'agent', data: { files: ['src/a.ts'] } }),
      event({ eventId: 'g', type: 'budget.updated', timestamp: '2026-05-10T10:00:06.000Z', actor: 'runtime', data: { tokens: 123 } }),
    ]);

    expect(steps.map(step => step.category)).toEqual(['task', 'model', 'tool', 'policy', 'security', 'diff', 'other']);
    expect(steps.map(step => step.title)).toEqual([
      'Task created',
      'Model responded',
      'Tool result',
      'Policy decision',
      'Security finding',
      'Diff applied',
      'Budget updated',
    ]);
    expect(steps[2]?.summary).toContain('Tests failed');
    expect(steps[3]?.summary).toContain('allow');
    expect(steps[4]?.summary).toContain('Secret-like token');
    expect(steps[5]?.summary).toContain('src/a.ts');
  });

  it('uses stable fallback ids and handles invalid timestamps', () => {
    const steps = deriveReplaySteps([
      { ...base, eventId: '', type: 'custom.event', timestamp: 'not-a-date', actor: '', data: {} },
      event({ eventId: 'valid', type: 'task.completed', timestamp: '2026-05-10T10:00:01.000Z', actor: 'runtime', data: { summary: 'Done' } }),
    ]);

    expect(steps).toHaveLength(2);
    expect(steps[0]?.id).toBe('valid');
    expect(steps[0]?.elapsedMs).toBe(0);
    expect(steps[1]?.id).toBe('step-2');
    expect(steps[1]?.elapsedMs).toBe(0);
    expect(steps[1]?.actor).toBe('unknown');
    expect(steps[0]?.category).toBe('task');
  });
});
