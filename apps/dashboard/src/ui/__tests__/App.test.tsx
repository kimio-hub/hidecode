import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    expect(screen.getByText('hidecode')).toBeInTheDocument();
    expect(screen.getByText('Chat workspace coming next')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Run inspector' })).toBeInTheDocument();
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
