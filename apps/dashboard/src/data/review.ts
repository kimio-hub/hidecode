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
  };
}
