import { describe, expect, it } from 'vitest';
import { buildMockReviewState, buildReviewStateFromBackendSession } from './review';
import type { BackendSession } from './backend';

describe('review state backend mapping', () => {
  it('uses real backend review diff when present', () => {
    const session: BackendSession = {
      id: 'sess_1_abc',
      title: 'Real diff session',
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

    const state = buildReviewStateFromBackendSession(session, buildMockReviewState());

    expect(state.title).toBe('Review real git diff before apply');
    expect(state.changedFiles).toEqual([expect.objectContaining({ path: 'src/app.ts', status: 'modified' })]);
    expect(state.diff).toMatchObject({ filePath: 'src/app.ts', before: expect.stringContaining('-old'), after: expect.stringContaining('+new') });
    expect(state.approval.policyExplanation).toContain('audit-only');
  });

  it('falls back to mock review state when no backend review exists yet', () => {
    const fallback = buildMockReviewState();
    const session: BackendSession = {
      id: 'sess_1_abc',
      title: 'No review',
      projectPath: '/workspace/hidecode',
      messages: [],
      events: [],
    };

    expect(buildReviewStateFromBackendSession(session, fallback)).toBe(fallback);
  });
});
