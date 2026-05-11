export const chatMessageRoles = ['user', 'assistant', 'tool', 'system'] as const;

export type ChatMessageRole = (typeof chatMessageRoles)[number];

export type AgentPlanStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'waiting';

export interface AgentPlanStep {
  id: string;
  label: string;
  status: AgentPlanStepStatus;
}

export interface AgentPlan {
  title: string;
  steps: AgentPlanStep[];
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  createdAt: string;
  content: string;
  plan?: AgentPlan;
}

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-user-1',
    role: 'user',
    createdAt: '2026-05-11T20:00:00.000Z',
    content: 'Can you fix the failing tests and keep the changes reviewable?',
  },
  {
    id: 'msg-assistant-1',
    role: 'assistant',
    createdAt: '2026-05-11T20:00:04.000Z',
    content: 'I’ll inspect the test failure, make a minimal patch, and pause before any risky mutation.',
    plan: {
      title: 'Plan: fix failing dashboard tests',
      steps: [
        { id: 'inspect', label: 'Inspect failing test output', status: 'completed' },
        { id: 'patch', label: 'Patch App shell routing', status: 'running' },
        { id: 'review', label: 'Wait for human diff review', status: 'waiting' },
        { id: 'rerun', label: 'Rerun focused tests', status: 'pending' },
        { id: 'smoke', label: 'Investigate smoke regression', status: 'failed' },
      ],
    },
  },
  {
    id: 'msg-tool-1',
    role: 'tool',
    createdAt: '2026-05-11T20:00:08.000Z',
    content: 'pnpm --filter @world-harness/dashboard test src/ui/__tests__/App.test.tsx',
  },
];
