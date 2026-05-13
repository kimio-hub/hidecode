import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatWorkspace from '../modes/ChatWorkspace';

const createdAt = '2026-05-11T22:00:00.000Z';

describe('ChatWorkspace', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders user and assistant messages', () => {
    render(<ChatWorkspace />);

    expect(screen.getByText('Can you fix the failing tests and keep the changes reviewable?')).toBeInTheDocument();
    expect(screen.getByText(/I’ll inspect the test failure/)).toBeInTheDocument();
  });

  it('renders an agent plan card with step statuses', () => {
    render(<ChatWorkspace />);

    expect(screen.getByText('Plan: fix failing dashboard tests')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
    expect(screen.getByText('waiting')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('calls review mode callback from the Review quick action', () => {
    let requestedMode = '';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<ChatWorkspace onReview={() => { requestedMode = 'review'; }} />);

    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Review this without running' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(requestedMode).toBe('review');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows Plan as preview-only without submitting composer content', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<ChatWorkspace />);

    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Plan this without running' } });
    fireEvent.click(screen.getByRole('button', { name: 'Plan' }));

    expect(screen.getByText('Plan preview is not wired yet.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows Stop as preview-only without submitting composer content', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<ChatWorkspace />);

    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Stop this without running' } });
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(screen.getByText('Stop is not wired yet.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders run progress lifecycle states from chat submission', async () => {
    let resolveMessage: (response: Response) => void = () => {};
    const messageResponse = new Promise<Response>((resolve) => { resolveMessage = resolve; });
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/sessions') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            session: {
              id: 'sess-1',
              title: 'hidecode session',
              projectPath: '/repo',
              messages: [],
              events: [],
            },
          }),
        } as Response);
      }

      return messageResponse;
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<ChatWorkspace />);

    const progress = screen.getByRole('progressbar');
    const runProgress = screen.getByRole('region', { name: 'Run progress' });
    expect(progress).toHaveAttribute('aria-valuenow', '0');
    expect(within(runProgress).getByText('preview')).toBeInTheDocument();
    expect(screen.getByText(/Runtime output will appear after Run/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Fix this' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(progress).toHaveAttribute('aria-valuenow', '50'));
    expect(within(runProgress).getByText('running')).toBeInTheDocument();
    expect(screen.getAllByText('Running scripted backend session…').length).toBeGreaterThan(0);

    resolveMessage({
      ok: true,
      status: 201,
      json: async () => ({
        message: { id: 'msg-1', role: 'user', content: 'Fix this', createdAt },
        run: {
          ok: true,
          summary: 'scripted run complete',
          tracePath: '/repo/.runs/run-1/trace.jsonl',
          reportPath: '/repo/.runs/run-1/report.md',
          steps: 1,
          durationMs: 5,
        },
        session: {
          id: 'sess-1',
          title: 'hidecode session',
          projectPath: '/repo',
          messages: [{ id: 'msg-1', role: 'user', content: 'Fix this', createdAt }],
          events: [],
          runs: [],
        },
      }),
    } as Response);

    await waitFor(() => expect(progress).toHaveAttribute('aria-valuenow', '100'));
    expect(within(runProgress).getByText('completed')).toBeInTheDocument();
    expect(within(runProgress).getByText('scripted run complete')).toBeInTheDocument();
  });

  it('renders failed run progress when the backend rejects submission', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/sessions') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            session: {
              id: 'sess-1',
              title: 'hidecode session',
              projectPath: '/repo',
              messages: [],
              events: [],
            },
          }),
        } as Response);
      }

      return Promise.resolve({ ok: false, status: 500, json: async () => ({}) } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<ChatWorkspace />);

    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Fix this' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    const runProgress = screen.getByRole('region', { name: 'Run progress' });
    await waitFor(() => expect(within(runProgress).getByText('failed')).toBeInTheDocument());
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(within(runProgress).getByText('Failed to post message: 500')).toBeInTheDocument();
  });

  it('creates a backend session, submits a message, and publishes inspector events', async () => {
    const onEventsChange = vi.fn();
    const onSessionChange = vi.fn();
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/api/sessions') {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            session: {
              id: 'sess-1',
              title: 'hidecode session',
              projectPath: '/repo',
              messages: [],
              events: [],
            },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 201,
        json: async () => ({
          message: { id: 'msg-1', role: 'user', content: 'Fix this', createdAt },
          run: {
            ok: true,
            summary: 'scripted run complete',
            tracePath: '/repo/.runs/run-1/trace.jsonl',
            reportPath: '/repo/.runs/run-1/report.md',
            steps: 1,
            durationMs: 5,
          },
          session: {
            id: 'sess-1',
            title: 'hidecode session',
            projectPath: '/repo',
            messages: [{ id: 'msg-1', role: 'user', content: 'Fix this', createdAt }],
            events: [{
              id: 'evt-1',
              sessionId: 'sess-1',
              type: 'tool.requested',
              createdAt,
              data: { runId: 'run-1', taskId: 'task-1', actor: 'orchestrator', tool: 'scripted' },
            }],
            runs: [{
              id: 'run-1',
              ok: true,
              summary: 'scripted run complete',
              tracePath: '/repo/.runs/run-1/trace.jsonl',
              reportPath: '/repo/.runs/run-1/report.md',
              steps: 1,
              durationMs: 5,
              createdAt,
            }],
          },
        }),
      } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ChatWorkspace onEventsChange={onEventsChange} onSessionChange={onSessionChange} />);

    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Fix this' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/sessions', expect.objectContaining({ method: 'POST' })));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/sessions/sess-1/messages', expect.objectContaining({ method: 'POST' })));
    await waitFor(() => expect(screen.getAllByText('scripted run complete').length).toBeGreaterThan(0));
    expect(screen.getByText('Fix this')).toBeInTheDocument();
    expect(onEventsChange).toHaveBeenCalledWith([
      expect.objectContaining({ eventId: 'evt-1', runId: 'run-1', taskId: 'task-1', type: 'tool.requested' }),
    ]);
    expect(onSessionChange).toHaveBeenLastCalledWith(expect.objectContaining({
      id: 'sess-1',
      runs: [expect.objectContaining({ id: 'run-1' })],
    }));
  });
});
