import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReviewWorkspace from '../modes/ReviewWorkspace';
import type { BackendSession } from '../../data/backend';

const backendSession: BackendSession = {
  id: 'sess_1_abc',
  title: 'Real review',
  projectPath: '/workspace/hidecode',
  messages: [],
  events: [],
  review: {
    summary: { fileCount: 1, additions: 2, deletions: 1, byStatus: { added: 0, modified: 1, deleted: 0, renamed: 0 } },
    changedFiles: [{ path: 'src/app.ts', language: 'ts', additions: 2, deletions: 1, status: 'modified' }],
    diffs: [{ filePath: 'src/app.ts', patch: 'diff --git a/src/app.ts b/src/app.ts\n-old\n+new\n+next' }],
    approval: {
      id: 'approval_sess_1_abc',
      title: 'Review real git diff before apply',
      status: 'pending',
      risk: 'medium',
      policyExplanation: 'Real git diff captured from the selected project. Approve/reject is audit-only.',
    },
  },
};

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

  it('renders real backend review diff when a session is provided', () => {
    render(<ReviewWorkspace session={backendSession} />);

    expect(screen.getByRole('heading', { name: 'Review real git diff before apply' })).toBeInTheDocument();
    expect(screen.getAllByText('src/app.ts').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('+2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('-1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('real git diff')).toBeInTheDocument();
    expect(screen.getByText('-old')).toBeInTheDocument();
    expect(screen.getByText(/\+new/)).toBeInTheDocument();
    expect(screen.getAllByText(/audit-only/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Approve changes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reject changes' })).toBeDisabled();
  });
});
