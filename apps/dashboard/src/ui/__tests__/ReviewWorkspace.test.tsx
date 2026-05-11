import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReviewWorkspace from '../modes/ReviewWorkspace';

describe('ReviewWorkspace', () => {
  it('renders changed files, side-by-side diff, approval policy, and command preview', () => {
    render(<ReviewWorkspace />);

    expect(screen.getByRole('heading', { name: 'Review proposed changes' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Changed files' })).toBeInTheDocument();
    expect(screen.getAllByText('apps/dashboard/src/ui/modes/ReviewWorkspace.tsx').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('+86')).toBeInTheDocument();
    expect(screen.getAllByText('-0').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByRole('region', { name: 'Side-by-side diff preview' })).toBeInTheDocument();
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
    expect(screen.getAllByText(/mock side-by-side diff/i).length).toBeGreaterThanOrEqual(1);

    expect(screen.getByRole('region', { name: 'Approval request' })).toBeInTheDocument();
    expect(screen.getByText('Manual approval required')).toBeInTheDocument();
    expect(screen.getByText(/disabled until backend approval APIs/i)).toBeInTheDocument();

    expect(screen.getByRole('region', { name: 'Command preview' })).toBeInTheDocument();
    expect(screen.getByText('pnpm --filter @world-harness/dashboard test')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve changes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reject changes' })).toBeDisabled();
  });
});
