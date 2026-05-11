import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from '../modes/HomePage';

describe('HomePage', () => {
  it('renders the hidecode first-open project picker', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Build with hidecode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Folder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clone Repository' })).toBeInTheDocument();
    expect(screen.getByText('Drag a project folder here')).toBeInTheDocument();
  });

  it('shows recent projects and quick-start coding tasks', () => {
    render(<HomePage />);

    expect(screen.getByText('hidecode')).toBeInTheDocument();
    expect(screen.getByText('world-harness')).toBeInTheDocument();
    expect(screen.getByText('ljquant')).toBeInTheDocument();
    expect(screen.getByText('Fix failing tests')).toBeInTheDocument();
    expect(screen.getByText('Review current diff')).toBeInTheDocument();
    expect(screen.getByText('Explain this codebase')).toBeInTheDocument();
    expect(screen.getByText('Plan a new feature')).toBeInTheDocument();
  });

  it('shows model and safety setup status', () => {
    render(<HomePage />);

    expect(screen.getByText('GPT-5.5')).toBeInTheDocument();
    expect(screen.getByText('Local CPA')).toBeInTheDocument();
    expect(screen.getByText('Guarded sandbox')).toBeInTheDocument();
    expect(screen.getByText('Runtime offline')).toBeInTheDocument();
  });
});
