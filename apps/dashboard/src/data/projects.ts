export interface RecentProject {
  id: string;
  name: string;
  path: string;
  description: string;
  lastOpened: string;
}

export interface QuickStartAction {
  id: string;
  title: string;
  description: string;
}

export interface ModelSafetyItem {
  id: string;
  label: string;
  value: string;
  tone: 'ready' | 'guarded' | 'offline';
}

export const recentProjects: RecentProject[] = [
  {
    id: 'hidecode',
    name: 'hidecode',
    path: '~/world-harness',
    description: 'GUI-first AI coding workspace',
    lastOpened: 'Today',
  },
  {
    id: 'world-harness',
    name: 'world-harness',
    path: '~/world-harness',
    description: 'Agent runtime and trace harness',
    lastOpened: 'Yesterday',
  },
  {
    id: 'ljquant',
    name: 'ljquant',
    path: '~/ljquant',
    description: 'Quant competition training pipeline',
    lastOpened: 'This week',
  },
];

export const quickStartActions: QuickStartAction[] = [
  { id: 'fix-tests', title: 'Fix failing tests', description: 'Run tests, inspect failures, and propose a safe patch.' },
  { id: 'review-diff', title: 'Review current diff', description: 'Explain changed files and surface risky edits.' },
  { id: 'explain-codebase', title: 'Explain this codebase', description: 'Map the project structure and important flows.' },
  { id: 'plan-feature', title: 'Plan a new feature', description: 'Turn a request into milestones and implementation tasks.' },
];

export const modelSafetySetup: ModelSafetyItem[] = [
  { id: 'model', label: 'Model', value: 'GPT-5.5', tone: 'ready' },
  { id: 'provider', label: 'Provider', value: 'Local CPA', tone: 'ready' },
  { id: 'sandbox', label: 'Sandbox', value: 'Guarded sandbox', tone: 'guarded' },
  { id: 'runtime', label: 'Runtime', value: 'Runtime offline', tone: 'offline' },
];
