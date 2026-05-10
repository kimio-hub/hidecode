export interface TraceEvent {
  eventId: string;
  runId: string;
  taskId: string;
  type: string;
  timestamp: string;
  actor: string;
  data: Record<string, unknown>;
}

export interface RunMeta {
  runId: string;
  taskId: string;
  harnessVersion: string;
  model: { provider: string; name: string };
  summary: string;
}

export const MOCK_RUN: RunMeta = {
  runId: 'run-1778423383435',
  taskId: 'task-1778423383432',
  harnessVersion: '0.1.0',
  model: { provider: 'openai', name: 'gpt-5.5' },
  summary: 'Fix failing add test in calculator module',
};

export const MOCK_EVENTS: TraceEvent[] = [
  {
    eventId: 'e1',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'task.created',
    timestamp: '2026-05-10T14:29:43.439Z',
    actor: 'runtime',
    data: { goal: 'Fix failing add test in calculator module', mode: 'plan' },
  },
  {
    eventId: 'e2',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'model.requested',
    timestamp: '2026-05-10T14:29:43.442Z',
    actor: 'runtime',
    data: { step: 0, prompt: 'Analyze the failing test and determine root cause' },
  },
  {
    eventId: 'e3',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'tool.call',
    timestamp: '2026-05-10T14:29:44.100Z',
    actor: 'agent',
    data: { name: 'read_file', input: { path: 'src/calculator.ts' }, risk: 'low' },
  },
  {
    eventId: 'e4',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'tool.result',
    timestamp: '2026-05-10T14:29:44.250Z',
    actor: 'runtime',
    data: { ok: true, summary: 'Read 15 lines from calculator.ts', durationMs: 150 },
  },
  {
    eventId: 'e5',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'tool.call',
    timestamp: '2026-05-10T14:29:45.000Z',
    actor: 'agent',
    data: { name: 'terminal', input: { command: 'pnpm test' }, risk: 'low' },
  },
  {
    eventId: 'e6',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'tool.result',
    timestamp: '2026-05-10T14:29:47.500Z',
    actor: 'runtime',
    data: {
      ok: false,
      summary: 'Test failed: expected 5 but got 6',
      exitCode: 1,
      stdout: 'FAIL src/calculator.test.ts\n  × add(2,3) should return 5\nAssertionError: expected 6 to equal 5',
      durationMs: 2500,
    },
  },
  {
    eventId: 'e7',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'policy.decision',
    timestamp: '2026-05-10T14:29:48.000Z',
    actor: 'policy',
    data: { decision: 'allow', reason: 'write allowed within workspace', risk: 'medium', ruleId: 'file.write' },
  },
  {
    eventId: 'e8',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'tool.call',
    timestamp: '2026-05-10T14:29:48.500Z',
    actor: 'agent',
    data: {
      name: 'write_file',
      input: {
        path: 'src/calculator.ts',
        content: 'export function add(a: number, b: number) {\n  return a + b;\n}',
      },
      risk: 'medium',
    },
  },
  {
    eventId: 'e9',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'tool.result',
    timestamp: '2026-05-10T14:29:48.800Z',
    actor: 'runtime',
    data: { ok: true, summary: 'Wrote 3 lines to calculator.ts', changedFiles: ['src/calculator.ts'], durationMs: 300 },
  },
  {
    eventId: 'e10',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'diff.applied',
    timestamp: '2026-05-10T14:29:49.000Z',
    actor: 'agent',
    data: {
      files: ['src/calculator.ts'],
      diff: '- export function add(a: number, b: number) {\n-   return a + b + 1;\n+ export function add(a: number, b: number) {\n+   return a + b;\n  }',
    },
  },
  {
    eventId: 'e11',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'tool.call',
    timestamp: '2026-05-10T14:29:50.000Z',
    actor: 'agent',
    data: { name: 'terminal', input: { command: 'pnpm test' }, risk: 'low' },
  },
  {
    eventId: 'e12',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'tool.result',
    timestamp: '2026-05-10T14:29:52.000Z',
    actor: 'runtime',
    data: { ok: true, summary: 'All tests passed', exitCode: 0, durationMs: 2000 },
  },
  {
    eventId: 'e13',
    runId: 'run-1778423383435',
    taskId: 'task-1778423383432',
    type: 'task.completed',
    timestamp: '2026-05-10T14:29:52.500Z',
    actor: 'runtime',
    data: { summary: 'Fixed add() bug — removed +1 offset. All tests green.' },
  },
];
