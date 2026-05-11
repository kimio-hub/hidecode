import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TraceEvent } from '../../data/mock';
import EvidencePanel from '../components/EvidencePanel';

function event(partial: Pick<TraceEvent, 'eventId' | 'type' | 'timestamp' | 'actor'> & { data?: Record<string, unknown> }): TraceEvent {
  return {
    runId: 'run-1',
    taskId: 'task-1',
    data: {},
    ...partial,
  };
}

describe('EvidencePanel', () => {
  it('surfaces current runtime tool.finished errors as evidence', () => {
    render(<EvidencePanel events={[
      event({
        eventId: 'tool-finished-error',
        type: 'tool.finished',
        timestamp: '2026-05-11T13:00:06.000Z',
        actor: 'orchestrator',
        data: {
          tool: 'run',
          ok: false,
          error: 'Readonly sandbox blocked write command',
          evidence: [],
        },
      }),
    ]} />);

    expect(screen.getByText('tool.finished')).toBeInTheDocument();
    expect(screen.getByText('Readonly sandbox blocked write command')).toBeInTheDocument();
  });

  it('surfaces nested output summaries and evidence items from tool.finished events', () => {
    render(<EvidencePanel events={[
      event({
        eventId: 'tool-finished-output',
        type: 'tool.finished',
        timestamp: '2026-05-11T13:00:07.000Z',
        actor: 'orchestrator',
        data: {
          tool: 'run',
          ok: true,
          output: { summary: 'command completed' },
          evidence: ['wrote report.md', { path: 'report.md', kind: 'file' }],
        },
      }),
    ]} />);

    expect(screen.getByText('command completed')).toBeInTheDocument();
    expect(screen.getByText('wrote report.md')).toBeInTheDocument();
    expect(screen.getByText(JSON.stringify({ path: 'report.md', kind: 'file' }))).toBeInTheDocument();
  });

  it('keeps rendering legacy tool.result summaries', () => {
    render(<EvidencePanel events={[
      event({
        eventId: 'legacy-tool-result',
        type: 'tool.result',
        timestamp: '2026-05-11T13:00:08.000Z',
        actor: 'agent',
        data: { ok: true, summary: 'Read 15 lines from calculator.ts' },
      }),
    ]} />);

    expect(screen.getByText('tool.result')).toBeInTheDocument();
    expect(screen.getByText('Read 15 lines from calculator.ts')).toBeInTheDocument();
  });
});
