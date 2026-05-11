import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RightInspector from '../components/RightInspector';
import type { TraceEvent } from '../../data/loader';

const events: TraceEvent[] = [
  {
    eventId: 'evt-task',
    type: 'task.created',
    timestamp: '2026-05-11T00:00:00.000Z',
    runId: 'run-hidecode',
    taskId: 'task-hidecode',
    actor: 'planner',
    data: { goal: 'Add chat workspace' },
  },
  {
    eventId: 'evt-tool-call',
    type: 'tool.call',
    timestamp: '2026-05-11T00:00:01.000Z',
    runId: 'run-hidecode',
    taskId: 'task-hidecode',
    actor: 'agent-1',
    data: { name: 'terminal', input: { command: 'pnpm test' }, risk: 'medium' },
  },
  {
    eventId: 'evt-tool-result',
    type: 'tool.result',
    timestamp: '2026-05-11T00:00:02.000Z',
    runId: 'run-hidecode',
    taskId: 'task-hidecode',
    actor: 'agent-1',
    data: { name: 'terminal', ok: true, summary: 'tests passed', durationMs: 1200 },
  },
  {
    eventId: 'evt-approval',
    type: 'approval.requested',
    timestamp: '2026-05-11T00:00:03.000Z',
    runId: 'run-hidecode',
    taskId: 'task-hidecode',
    actor: 'policy',
    data: { name: 'write_file', risk: 'high', reason: 'Patch requires user approval' },
  },
];

describe('RightInspector', () => {
  it('renders read-only inspector tabs and normalized trace summaries', async () => {
    render(<RightInspector events={events} />);

    const inspector = screen.getByRole('complementary', { name: 'Run inspector' });
    const planTab = within(inspector).getByRole('tab', { name: 'Plan' });
    const toolsTab = within(inspector).getByRole('tab', { name: 'Tools' });
    const approvalsTab = within(inspector).getByRole('tab', { name: 'Approvals' });
    const traceTab = within(inspector).getByRole('tab', { name: 'Trace' });

    expect(planTab).toHaveAttribute('aria-selected', 'true');
    expect(within(inspector).getByText('Read-only runtime inspector')).toBeInTheDocument();
    expect(within(inspector).getByText('4 events')).toBeInTheDocument();
    expect(within(inspector).getByText('1 tool call')).toBeInTheDocument();
    expect(within(inspector).getByText('1 approval')).toBeInTheDocument();
    expect(within(inspector).getByRole('tabpanel', { name: 'Plan' })).toBeInTheDocument();

    fireEvent.click(toolsTab);
    expect(toolsTab).toHaveAttribute('aria-selected', 'true');
    expect(within(inspector).getByRole('tabpanel', { name: 'Tools' })).toBeInTheDocument();
    expect(within(inspector).getByText('terminal')).toBeInTheDocument();

    fireEvent.click(approvalsTab);
    expect(approvalsTab).toHaveAttribute('aria-selected', 'true');
    expect(within(inspector).getByRole('tabpanel', { name: 'Approvals' })).toBeInTheDocument();
    expect(within(inspector).getByText('Approval requested: write_file')).toBeInTheDocument();

    fireEvent.click(traceTab);
    expect(traceTab).toHaveAttribute('aria-selected', 'true');
    expect(within(inspector).getByRole('tabpanel', { name: 'Trace' })).toBeInTheDocument();
    expect(within(inspector).getByText('Replay Debug')).toBeInTheDocument();
  });
});
