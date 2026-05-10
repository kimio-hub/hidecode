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
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText('Policy / Risk')).toBeInTheDocument();
    expect(screen.getByText('Diff / Changes')).toBeInTheDocument();
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
