import { describe, expect, it } from 'vitest';
import type { TraceEvent } from './loader';
import { deriveAgentBoard } from './agents';

const base: Omit<TraceEvent, 'eventId' | 'type' | 'timestamp' | 'actor' | 'data'> = {
  runId: 'run-1',
  taskId: 'task-1',
};

function event(partial: Pick<TraceEvent, 'eventId' | 'type' | 'timestamp' | 'actor'> & { data?: Record<string, unknown>; taskId?: string }): TraceEvent {
  return { ...base, data: {}, ...partial };
}

describe('deriveAgentBoard', () => {
  it('groups events by explicit agent id before actor and sorts most recent agents first', () => {
    const board = deriveAgentBoard([
      event({ eventId: 'a1', type: 'task.created', timestamp: '2026-05-10T10:00:00.000Z', actor: 'runtime', data: { agentId: 'planner', goal: 'Plan work' } }),
      event({ eventId: 'a2', type: 'model.responded', timestamp: '2026-05-10T10:00:05.000Z', actor: 'runtime', data: { agentId: 'planner', summary: 'Plan ready' } }),
      event({ eventId: 'b1', type: 'tool.call', timestamp: '2026-05-10T10:00:07.000Z', actor: 'agent', data: { name: 'read_file' } }),
    ]);

    expect(board.map(item => item.id)).toEqual(['agent', 'planner']);
    expect(board[0]).toMatchObject({ name: 'agent', status: 'active', eventCount: 1, toolCount: 1, lastEventType: 'tool.call' });
    expect(board[1]).toMatchObject({ name: 'planner', status: 'active', eventCount: 2, toolCount: 0, lastEventType: 'model.responded' });
  });

  it('marks agents blocked by failed tools, security findings, policy denial, and explicit blockers', () => {
    const board = deriveAgentBoard([
      event({ eventId: 'a1', type: 'tool.result', timestamp: '2026-05-10T10:00:01.000Z', actor: 'agent-a', data: { ok: false, summary: 'Tests failed' } }),
      event({ eventId: 'b1', type: 'security.finding', timestamp: '2026-05-10T10:00:02.000Z', actor: 'agent-b', data: { message: 'Secret-like value' } }),
      event({ eventId: 'c1', type: 'policy.decision', timestamp: '2026-05-10T10:00:03.000Z', actor: 'agent-c', data: { decision: 'needs_approval', reason: 'write file' } }),
      event({ eventId: 'd1', type: 'task.updated', timestamp: '2026-05-10T10:00:04.000Z', actor: 'agent-d', data: { blocker: 'waiting on review' } }),
    ]);

    expect(board).toHaveLength(4);
    expect(board.every(item => item.status === 'blocked')).toBe(true);
    expect(board.find(item => item.id === 'agent-a')?.blockers).toContain('Tests failed');
    expect(board.find(item => item.id === 'agent-b')?.blockers).toContain('Secret-like value');
    expect(board.find(item => item.id === 'agent-c')?.blockers.join(' ')).toContain('needs_approval');
    expect(board.find(item => item.id === 'agent-d')?.blockers).toContain('waiting on review');
  });

  it('tracks handoffs and falls back to idle after terminal task completion', () => {
    const board = deriveAgentBoard([
      event({ eventId: 'a1', type: 'task.updated', timestamp: '2026-05-10T10:00:01.000Z', actor: '', data: { handoffTo: 'reviewer', summary: 'Ready for review' } }),
      event({ eventId: 'b1', type: 'task.completed', timestamp: '2026-05-10T10:00:02.000Z', actor: 'finisher', data: { summary: 'Done' } }),
    ]);

    expect(board.find(item => item.id === 'unknown')).toMatchObject({ status: 'handoff', handoffs: ['to reviewer'] });
    expect(board.find(item => item.id === 'finisher')).toMatchObject({ status: 'idle', focus: 'Done' });
  });
});
