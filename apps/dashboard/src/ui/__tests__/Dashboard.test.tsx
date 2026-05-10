import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { MOCK_EVENTS, MOCK_RUN } from '../../data/mock';

describe('Dashboard', () => {
  it('renders the header with task id', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText(MOCK_RUN.taskId)).toBeInTheDocument();
  });

  it('renders all panel titles', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText('Task Graph')).toBeInTheDocument();
    expect(screen.getByText('Tool Timeline')).toBeInTheDocument();
    expect(screen.getAllByText('Replay Debug').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText('Policy / Risk')).toBeInTheDocument();
    expect(screen.getByText('Diff / Changes')).toBeInTheDocument();
  });

  it('renders Mission Control v2 shell elements', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText('Mission Control')).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getAllByText('Approvals').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Replay').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Risk')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Command Dock')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('Ask Harness')).toBeInTheDocument();
  });

  it('renders read-only approval queue items', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText('Approval Queue')).toBeInTheDocument();
    expect(screen.getByText('Policy decision: allow')).toBeInTheDocument();
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('renders read-only replay debugger items and future actions', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getAllByText('Replay Debug').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Task created')).toBeInTheDocument();
    expect(screen.getAllByText('Tool result').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Save Eval')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Replay' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fork' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save Eval' })).toBeDisabled();
  });

  it('shows model name in header', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText(MOCK_RUN.model.name)).toBeInTheDocument();
  });

  it('shows completed status when task.completed event exists', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
