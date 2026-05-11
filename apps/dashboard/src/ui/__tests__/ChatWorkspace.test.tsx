import { render, screen } from '@testing-library/react';
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

  it('renders composer quick actions', () => {
    render(<ChatWorkspace />);

    expect(screen.getByRole('textbox', { name: 'Message hidecode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Plan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
  });
});
