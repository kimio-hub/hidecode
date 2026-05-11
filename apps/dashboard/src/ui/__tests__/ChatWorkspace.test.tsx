import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChatWorkspace from '../modes/ChatWorkspace';

describe('ChatWorkspace', () => {
  it('renders user and assistant messages', () => {
    render(<ChatWorkspace />);

    expect(screen.getByText('Can you fix the failing tests and keep the changes reviewable?')).toBeInTheDocument();
    expect(screen.getByText(/I’ll inspect the test failure/)).toBeInTheDocument();
  });

  it('renders an agent plan card with step statuses', () => {
    render(<ChatWorkspace />);

    expect(screen.getByText('Plan: fix failing dashboard tests')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
    expect(screen.getByText('waiting')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('calls review mode callback from the Review quick action', () => {
    let requestedMode = '';
    render(<ChatWorkspace onReview={() => { requestedMode = 'review'; }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(requestedMode).toBe('review');
  });
});
