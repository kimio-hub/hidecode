import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RunMeta, TraceEvent } from '../../data/mock';
import Header from '../components/Header';

const run: RunMeta = {
  runId: 'run-header',
  taskId: 'task-header',
  harnessVersion: '0.1.0-test',
  model: { provider: 'test', name: 'test-model' },
  summary: 'Header test run',
};

function event(partial: Pick<TraceEvent, 'eventId' | 'type' | 'timestamp' | 'actor'> & { data?: Record<string, unknown> }): TraceEvent {
  return {
    runId: run.runId,
    taskId: run.taskId,
    data: {},
    ...partial,
  };
}

describe('Header', () => {
  it('counts requested-only tool activity', () => {
    render(<Header run={run} events={[
      event({ eventId: 'requested', type: 'tool.requested', timestamp: '2026-05-11T13:00:00.000Z', actor: 'orchestrator', data: { tool: 'run' } }),
      event({ eventId: 'policy', type: 'policy.decided', timestamp: '2026-05-11T13:00:01.000Z', actor: 'policy', data: { decision: 'deny' } }),
    ]} />);

    expect(screen.getByText('1 tools')).toBeInTheDocument();
  });

  it('does not over-count a normal requested-started-finished lifecycle', () => {
    render(<Header run={run} events={[
      event({ eventId: 'requested', type: 'tool.requested', timestamp: '2026-05-11T13:00:00.000Z', actor: 'orchestrator', data: { tool: 'run' } }),
      event({ eventId: 'started', type: 'tool.started', timestamp: '2026-05-11T13:00:01.000Z', actor: 'orchestrator', data: { tool: 'run' } }),
      event({ eventId: 'finished', type: 'tool.finished', timestamp: '2026-05-11T13:00:02.000Z', actor: 'orchestrator', data: { tool: 'run', ok: true } }),
    ]} />);

    expect(screen.getByText('1 tools')).toBeInTheDocument();
  });

  it('keeps counting legacy tool.call events as separate tool activity', () => {
    render(<Header run={run} events={[
      event({ eventId: 'read', type: 'tool.call', timestamp: '2026-05-11T13:00:00.000Z', actor: 'agent', data: { name: 'read_file' } }),
      event({ eventId: 'term', type: 'tool.call', timestamp: '2026-05-11T13:00:01.000Z', actor: 'agent', data: { name: 'terminal' } }),
    ]} />);

    expect(screen.getByText('2 tools')).toBeInTheDocument();
  });
});
