import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskGraph from '../components/TaskGraph';
import { MOCK_EVENTS } from '../../data/mock';

describe('TaskGraph', () => {
  it('renders task created event', () => {
    render(<TaskGraph events={MOCK_EVENTS} />);
    expect(screen.getByText('Task Created')).toBeInTheDocument();
  });

  it('renders task completed event', () => {
    render(<TaskGraph events={MOCK_EVENTS} />);
    expect(screen.getByText('Task Completed')).toBeInTheDocument();
  });

  it('renders model requested event', () => {
    render(<TaskGraph events={MOCK_EVENTS} />);
    expect(screen.getByText('Model Requested')).toBeInTheDocument();
  });

  it('renders with empty events', () => {
    const { container } = render(<TaskGraph events={[]} />);
    expect(container.firstChild).toBeTruthy();
  });
});
