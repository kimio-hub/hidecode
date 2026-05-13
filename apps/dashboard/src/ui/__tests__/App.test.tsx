import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';

const originalLocation = window.location;

function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation, search },
  });
}

describe('App data loading', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setSearch('');
  });

  it('renders the hidecode app shell by default', () => {
    render(<App />);
    expect(screen.getByText('GUI-first coding workspace')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Build with hidecode' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Run inspector' })).toBeInTheDocument();
  });

  it('renders review workspace when app mode is review', () => {
    setSearch('?mode=review');

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Review proposed changes' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Command preview' })).toBeInTheDocument();
  });

  it('switches from chat mode to review mode when the Review action is clicked', () => {
    setSearch('?mode=chat');

    render(<App />);
    expect(screen.getByRole('heading', { name: 'Chat with your coding agent' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(screen.getByRole('heading', { name: 'Review proposed changes' })).toBeInTheDocument();
  });

  it('carries backend session review from chat into review mode', async () => {
    setSearch('?mode=chat');
    const createdAt = '2026-05-11T22:00:00.000Z';
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === '/api/sessions') {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            session: { id: 'sess-1', title: 'hidecode session', projectPath: '/repo', messages: [], events: [] },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 201,
        json: async () => ({
          message: { id: 'msg-1', role: 'user', content: 'Fix this', createdAt },
          run: { ok: true, summary: 'scripted run complete', tracePath: '/repo/.runs/run-1/trace.jsonl', reportPath: '/repo/.runs/run-1/report.md', steps: 1, durationMs: 5 },
          session: {
            id: 'sess-1',
            title: 'hidecode session',
            projectPath: '/repo',
            messages: [{ id: 'msg-1', role: 'user', content: 'Fix this', createdAt }],
            events: [],
            review: {
              summary: { fileCount: 1, additions: 2, deletions: 1, byStatus: { added: 0, modified: 1, deleted: 0, renamed: 0 } },
              changedFiles: [{ path: 'src/app.ts', language: 'ts', additions: 2, deletions: 1, status: 'modified' }],
              diffs: [{ filePath: 'src/app.ts', patch: 'diff --git a/src/app.ts b/src/app.ts\n-old\n+new' }],
              approval: {
                id: 'approval_sess-1',
                title: 'Review real git diff before apply',
                status: 'pending',
                risk: 'medium',
                policyExplanation: 'Real git diff captured from the selected project. Approve/reject is audit-only.',
              },
            },
          },
        }),
      } as Response;
    }));

    render(<App />);
    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Fix this' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(screen.getByText('scripted run complete')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(screen.getByRole('heading', { name: 'Review real git diff before apply' })).toBeInTheDocument();
    expect(screen.getAllByText('src/app.ts').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('real git diff')).toBeInTheDocument();
  });

  it('opens a recent project and creates the next chat session with that project path', async () => {
    setSearch('');
    const createdAt = '2026-05-12T09:00:00.000Z';
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/api/projects/open') {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(init?.body as string)).toMatchObject({ name: 'hidecode', path: '~/world-harness' });
        return {
          ok: true,
          status: 201,
          json: async () => ({ project: { id: 'hidecode', name: 'hidecode', path: '~/world-harness', openedAt: createdAt } }),
        } as Response;
      }

      if (url === '/api/sessions') {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(init?.body as string)).toMatchObject({ projectPath: '~/world-harness', title: 'hidecode session' });
        return {
          ok: true,
          status: 201,
          json: async () => ({
            session: { id: 'sess-project', title: 'hidecode session', projectPath: '~/world-harness', messages: [], events: [] },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 201,
        json: async () => ({
          message: { id: 'msg-project', role: 'user', content: 'Explain this project', createdAt },
          run: { ok: true, summary: 'scripted run complete', tracePath: '~/world-harness/.runs/run-1/trace.jsonl', reportPath: '~/world-harness/.runs/run-1/report.md', steps: 1, durationMs: 5 },
          session: {
            id: 'sess-project',
            title: 'hidecode session',
            projectPath: '~/world-harness',
            messages: [{ id: 'msg-project', role: 'user', content: 'Explain this project', createdAt }],
            events: [{ id: 'evt-project', sessionId: 'sess-project', type: 'session.created', createdAt, data: { projectPath: '~/world-harness' } }],
          },
        }),
      } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /hidecode.*~\/world-harness/s }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Chat with your coding agent' })).toBeInTheDocument());
    expect(screen.getAllByText('hidecode').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/project: ~\/world-harness/).length).toBeGreaterThanOrEqual(1);

    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Explain this project' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(screen.getByText('scripted run complete')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/open', expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith('/api/sessions', expect.any(Object));
  });

  it('keeps the user on Home when opening a project fails', async () => {
    setSearch('');
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'open_failed' }),
    } as Response)));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /hidecode.*~\/world-harness/s }));

    await waitFor(() => expect(screen.getByText('Failed to open project: 500')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Build with hidecode' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Chat with your coding agent' })).not.toBeInTheDocument();
  });

  it('loads a run directory from the run query parameter', async () => {
    setSearch('?run=/runs/demo');
    const traceLine = JSON.stringify({
      eventId: 'real-1',
      runId: 'run-real',
      taskId: 'task-real',
      type: 'task.completed',
      timestamp: '2026-05-10T00:00:00.000Z',
      actor: 'runtime',
      data: { summary: 'done' },
    });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      text: async () => traceLine,
      json: async () => ({
        runId: 'run-real',
        taskId: 'task-real',
        harnessVersion: '0.2.0',
        model: { provider: 'test', name: 'model-real' },
        summary: 'real summary',
      }),
    } as Response)));

    render(<App />);

    expect(screen.getByText('Loading run trace…')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('task-real').length).toBeGreaterThanOrEqual(1));
    expect(screen.getByText('Run URL: /runs/demo')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/runs/demo/trace.jsonl');
    expect(fetch).toHaveBeenCalledWith('/runs/demo/run.json');
  });

  it('loads real smoke-shaped artifacts into trace-derived dashboard panels', async () => {
    setSearch('?run=/runs/smoke');
    const traceLines = [
      JSON.stringify({
        eventId: 'event-task-created',
        runId: 'run-smoke',
        taskId: 'task-smoke',
        type: 'task.created',
        timestamp: '2026-05-11T00:24:23.686Z',
        actor: 'orchestrator',
        data: { goal: 'fix failing add test' },
      }),
      JSON.stringify({
        eventId: 'event-tool-finished',
        runId: 'run-smoke',
        taskId: 'task-smoke',
        type: 'tool.finished',
        timestamp: '2026-05-11T00:24:23.700Z',
        actor: 'orchestrator',
        data: { tool: 'test', ok: false, error: 'ENOENT: no such file or directory' },
      }),
      JSON.stringify({
        eventId: 'event-task-completed',
        runId: 'run-smoke',
        taskId: 'task-smoke',
        type: 'task.completed',
        timestamp: '2026-05-11T00:24:23.704Z',
        actor: 'orchestrator',
        data: { summary: 'smoke completed: runtime emitted trace and report' },
      }),
    ].join('\n');
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/trace.jsonl')) {
        return { ok: true, status: 200, text: async () => traceLines } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          runId: 'run-smoke',
          taskId: 'task-smoke',
          harnessVersion: '0.1.0',
          model: { provider: 'unknown', name: 'unknown' },
          workspace: { repo: '/workspace/fixtures/bugfix-ts' },
          artifacts: {
            root: '/workspace/fixtures/bugfix-ts/.runs/run-smoke',
            trace: '/workspace/fixtures/bugfix-ts/.runs/run-smoke/trace.jsonl',
            run: '/workspace/fixtures/bugfix-ts/.runs/run-smoke/run.json',
            report: '/workspace/fixtures/bugfix-ts/.runs/run-smoke/report.md',
          },
          summary: 'smoke completed: runtime emitted trace and report',
          steps: 2,
          durationMs: 53,
          budget: { steps: 2, toolCalls: 1, exceeded: false },
          snapshots: 0,
        }),
      } as Response;
    }));

    render(<App />);

    await waitFor(() => expect(screen.getAllByText('task-smoke').length).toBeGreaterThanOrEqual(1));
    expect(screen.getByText('Run URL: /runs/smoke')).toBeInTheDocument();
    expect(screen.getAllByText('Replay Debug').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Multi-Agent Board')).toBeInTheDocument();
    expect(screen.getByText('fix failing add test')).toBeInTheDocument();
    expect(screen.getAllByText('smoke completed: runtime emitted trace and report').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('orchestrator').length).toBeGreaterThanOrEqual(1);
  });

  it('shows an error state when loading fails', async () => {
    setSearch('?trace=/missing/trace.jsonl');
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 404,
      text: async () => '',
      json: async () => ({}),
    } as Response)));

    render(<App />);

    await waitFor(() => expect(screen.getByText('Failed to load run trace')).toBeInTheDocument());
    expect(screen.getByText(/HTTP 404/)).toBeInTheDocument();
  });
});
