export interface ChangedFileSummary {
  path: string;
  language?: string;
  additions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
}

export interface ChangedFilesSummary {
  fileCount: number;
  additions: number;
  deletions: number;
  byStatus: Record<ChangedFileSummary['status'], number>;
}

export interface ReviewDiffPreview {
  filePath: string;
  before: string;
  after: string;
}

export interface ReviewApprovalCard {
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  risk: 'low' | 'medium' | 'high' | 'critical';
  policyExplanation: string;
}

export interface ReviewCommandPreview {
  command: string;
  cwd: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
}

export interface ReviewWorkspaceState {
  title: string;
  summary: ChangedFilesSummary;
  changedFiles: ChangedFileSummary[];
  selectedFile: ChangedFileSummary;
  diff: ReviewDiffPreview;
  approval: ReviewApprovalCard;
  command: ReviewCommandPreview;
  source: 'mock' | 'backend';
}

interface BackendReviewSession {
  projectPath: string;
  review?: {
    summary: ChangedFilesSummary;
    changedFiles: ChangedFileSummary[];
    diffs: Array<{ filePath: string; patch: string }>;
    approval: ReviewApprovalCard;
  };
}

export function summarizeChangedFiles(files: ChangedFileSummary[]): ChangedFilesSummary {
  return files.reduce<ChangedFilesSummary>((summary, file) => {
    summary.fileCount += 1;
    summary.additions += file.additions;
    summary.deletions += file.deletions;
    summary.byStatus[file.status] += 1;
    return summary;
  }, {
    fileCount: 0,
    additions: 0,
    deletions: 0,
    byStatus: {
      added: 0,
      modified: 0,
      deleted: 0,
      renamed: 0,
    },
  });
}

export function buildMockReviewState(): ReviewWorkspaceState {
  const changedFiles: ChangedFileSummary[] = [
    {
      path: 'apps/dashboard/src/ui/modes/ReviewWorkspace.tsx',
      language: 'tsx',
      additions: 86,
      deletions: 0,
      status: 'added',
    },
    {
      path: 'apps/dashboard/src/data/review.ts',
      language: 'ts',
      additions: 72,
      deletions: 0,
      status: 'added',
    },
    {
      path: 'apps/dashboard/src/ui/App.tsx',
      language: 'tsx',
      additions: 9,
      deletions: 2,
      status: 'modified',
    },
  ];

  return {
    title: 'Review proposed changes',
    summary: summarizeChangedFiles(changedFiles),
    changedFiles,
    selectedFile: changedFiles[0],
    diff: {
      filePath: changedFiles[0].path,
      before: 'Before\n\n// No dedicated review workspace yet.\n// Diff and approval context only appear in the inspector.',
      after: 'After\n\nexport default function ReviewWorkspace() {\n  return <section>mock side-by-side diff preview</section>;\n}',
    },
    approval: {
      title: 'Manual approval required',
      status: 'pending',
      risk: 'medium',
      policyExplanation: 'Preview-only approval card. Apply controls stay disabled until backend approval APIs and explicit policy semantics exist.',
    },
    command: {
      command: 'pnpm --filter @world-harness/dashboard test',
      cwd: '/root/world-harness',
      risk: 'low',
      explanation: 'Runs the dashboard test suite before any proposed UI changes can be accepted.',
    },
    source: 'mock',
  };
}

export function buildReviewStateFromBackendSession(session: BackendReviewSession, fallback = buildMockReviewState()): ReviewWorkspaceState {
  if (!session.review) return fallback;
  const selectedFile = session.review.changedFiles[0] ?? {
    path: 'No file changes',
    additions: 0,
    deletions: 0,
    status: 'modified' as const,
  };
  const firstDiff = session.review.diffs.find((diff) => diff.filePath === selectedFile.path) ?? session.review.diffs[0];
  return {
    title: session.review.approval.title,
    summary: session.review.summary,
    changedFiles: session.review.changedFiles,
    selectedFile,
    diff: diffPreviewFromPatch(firstDiff, selectedFile.path),
    approval: session.review.approval,
    command: {
      command: 'git diff HEAD --patch',
      cwd: session.projectPath,
      risk: session.review.approval.risk,
      explanation: 'Captured from the selected project worktree. Approval/rejection is audit-only in this milestone.',
    },
    source: 'backend',
  };
}

function diffPreviewFromPatch(diff: { filePath: string; patch: string } | undefined, filePath: string): ReviewDiffPreview {
  if (!diff) return { filePath, before: 'No diff captured.', after: 'No diff captured.' };
  const lines = diff.patch.split('\n');
  const before = lines.filter((line) => line.startsWith('-') && !line.startsWith('---')).join('\n') || 'No removed lines.';
  const after = lines.filter((line) => line.startsWith('+') && !line.startsWith('+++')).join('\n') || 'No added lines.';
  return { filePath: diff.filePath, before, after };
}
