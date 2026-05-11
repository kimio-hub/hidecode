import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TraceEvent } from '../../data/loader';
import ToolTimeline from '../components/ToolTimeline';

const base: Omit<TraceEvent, 'eventId' | 'type' | 'timestamp' | 'actor' | 'data'> = {
  runId: 'run-real',
  taskId: 'task-real',
};

function event(partial: Pick<TraceEvent, 'eventId' | 'type' | 'timestamp' | 'actor'> & { data?: Record<string, unknown> }): TraceEvent {
  return { ...base, data: {}, ...partial };
}

describe('ToolTimeline', () => {
  it('renders real orchestrator requested/finished tool events with nested output and sandbox metadata', () => {
    render(
      <ToolTimeline
        events={[
          event({
            eventId: 'requested-1',
            type: 'tool.requested',
            timestamp: '2026-05-10T10:00:00.000Z',
            actor: 'orchestrator',
            data: {
              tool: 'terminal',
              input: { command: 'touch blocked.txt' },
              risks: ['filesystem-write'],
            },
          }),
          event({
            eventId: 'finished-1',
            type: 'tool.finished',
            timestamp: '2026-05-10T10:00:00.250Z',
            actor: 'orchestrator',
            data: {
              tool: 'terminal',
              ok: false,
              durationMs: 250,
              output: { stdout: '', stderr: 'blocked by readonly sandbox', exitCode: 1 },
              sandbox: { mode: 'local', writeMode: 'readonly', blocked: true },
              error: 'Readonly sandbox blocked write command',
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText('terminal')).toBeInTheDocument();
    expect(screen.getByText('250ms')).toBeInTheDocument();

    fireEvent.click(screen.getByText('terminal'));

    expect(screen.getByText(/blocked by readonly sandbox/)).toBeInTheDocument();
    expect(screen.getByText(/Readonly sandbox blocked write command/)).toBeInTheDocument();
    expect(screen.getByText(/writeMode=readonly/)).toBeInTheDocument();
  });
});
