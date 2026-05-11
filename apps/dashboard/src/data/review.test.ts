import { describe, expect, it } from 'vitest';
import { buildMockReviewState, summarizeChangedFiles, type ChangedFileSummary } from './review';

describe('review data model', () => {
  it('summarizes changed files with totals and status counts', () => {
    const files: ChangedFileSummary[] = [
      { path: 'src/App.tsx', language: 'tsx', additions: 24, deletions: 6, status: 'modified' },
      { path: 'src/review.ts', language: 'ts', additions: 41, deletions: 0, status: 'added' },
      { path: 'README.md', language: 'md', additions: 0, deletions: 8, status: 'deleted' },
    ];

    expect(summarizeChangedFiles(files)).toEqual({
      fileCount: 3,
      additions: 65,
      deletions: 14,
      byStatus: {
        added: 1,
        modified: 1,
        deleted: 1,
        renamed: 0,
      },
    });
  });

  it('builds mock review data for the approval workspace', () => {
    const state = buildMockReviewState();

    expect(state.title).toBe('Review proposed changes');
    expect(state.changedFiles.length).toBeGreaterThan(0);
    expect(state.selectedFile.path).toBe(state.changedFiles[0].path);
    expect(state.diff.before).toContain('Before');
    expect(state.diff.after).toContain('After');
    expect(state.approval.status).toBe('pending');
    expect(state.command.command).toContain('pnpm');
  });
});
