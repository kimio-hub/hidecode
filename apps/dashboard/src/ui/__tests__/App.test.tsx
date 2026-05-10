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

  it('renders mock data by default', () => {
    render(<App />);
    expect(screen.getByText('Mock')).toBeInTheDocument();
    expect(screen.getAllByText('task-1778423383432').length).toBeGreaterThanOrEqual(1);
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
