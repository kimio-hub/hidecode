import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TraceEvent } from '../../data/mock';
import DiffPanel from '../components/DiffPanel';

function event(partial: Pick<TraceEvent, 'eventId' | 'type' | 'timestamp' | 'actor'> & { data?: Record<string, unknown> }): TraceEvent {
  return {
    runId: 'run-1',
    taskId: 'task-1',
    data: {},
    ...partial,
  };
}

describe('DiffPanel', () => {
  it('renders current runtime file.changed events with file names and diff content', () => {
    render(<DiffPanel events={[
      event({
        eventId: 'file-changed',
        type: 'file.changed',
        timestamp: '2026-05-11T13:00:00.000Z',
        actor: 'runtime',
        data: {
          files: ['src/calculator.ts', 'src/calculator.test.ts'],
          diff: '+ fixed add implementation',
        },
      }),
    ]} />);

    expect(screen.getByText('src/calculator.ts, src/calculator.test.ts')).toBeInTheDocument();
    expect(screen.getByText('file.changed')).toBeInTheDocument();
    expect(screen.getByText('+ fixed add implementation')).toBeInTheDocument();
  });

  it('keeps rendering legacy diff.applied events', () => {
    render(<DiffPanel events={[
      event({
        eventId: 'legacy-diff',
        type: 'diff.applied',
        timestamp: '2026-05-11T13:00:01.000Z',
        actor: 'agent',
        data: { files: ['src/legacy.ts'], diff: '- old\n+ new' },
      }),
    ]} />);

    expect(screen.getByText('src/legacy.ts')).toBeInTheDocument();
    expect(screen.getByText('diff.applied')).toBeInTheDocument();
    expect(screen.getByText('+ new')).toBeInTheDocument();
  });

  it('keeps rendering legacy write_file tool calls', () => {
    render(<DiffPanel events={[
      event({
        eventId: 'legacy-write',
        type: 'tool.call',
        timestamp: '2026-05-11T13:00:02.000Z',
        actor: 'agent',
        data: { name: 'write_file', input: { path: 'docs/report.md', content: '# Report' } },
      }),
    ]} />);

    expect(screen.getByText('docs/report.md')).toBeInTheDocument();
    expect(screen.getByText('tool.call')).toBeInTheDocument();
    expect(screen.getByText('# Report')).toBeInTheDocument();
  });
});
