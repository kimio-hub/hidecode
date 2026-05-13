import { StrictMode } from 'react';
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

  it('continues a loaded backend session instead of creating a new one', async () => {
    const onSessionChange = vi.fn();
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/api/sessions/sess-loaded/messages') {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            message: { id: 'msg-followup', role: 'user', content: 'Follow up', createdAt },
            session: {
              id: 'sess-loaded',
              title: 'Loaded session',
              projectPath: '/repo',
              messages: [
                { id: 'msg-existing', role: 'assistant', content: 'Existing answer', createdAt },
                { id: 'msg-followup', role: 'user', content: 'Follow up', createdAt },
              ],
              events: [],
            },
          }),
        } as Response;
      }

      return { ok: false, status: 418, json: async () => ({}) } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ChatWorkspace
      initialMessages={[{ id: 'msg-existing', role: 'assistant', content: 'Existing answer', createdAt }]}
      initialSession={{ id: 'sess-loaded', title: 'Loaded session', projectPath: '/repo', messages: [], events: [] }}
      onSessionChange={onSessionChange}
    />);

    expect(screen.getByText('Existing answer')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Follow up' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/sessions/sess-loaded/messages', expect.objectContaining({ method: 'POST' })));
    expect(fetchMock).not.toHaveBeenCalledWith('/api/sessions', expect.objectContaining({ method: 'POST' }));
    await waitFor(() => expect(screen.getByText('Follow up')).toBeInTheDocument());
    expect(onSessionChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'sess-loaded' }));
  });

  it('subscribes to active session event snapshots while a message is running', async () => {
    let resolveMessage: (response: Response) => void = () => {};
    const messageResponse = new Promise<Response>((resolve) => { resolveMessage = resolve; });
    const onEventsChange = vi.fn();
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/sessions') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            session: { id: 'sess-live', title: 'hidecode session', projectPath: '/repo', messages: [], events: [] },
          }),
        } as Response);
      }

      if (url === '/api/sessions/sess-live/events') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            events: [{
              id: 'evt-live-tool',
              sessionId: 'sess-live',
              type: 'tool.requested',
              createdAt,
              data: { runId: 'run-live', taskId: 'task-live', actor: 'orchestrator', tool: 'test' },
            }],
          }),
        } as Response);
      }

      if (url === '/api/sessions/sess-live/messages') return messageResponse;

      return Promise.resolve({ ok: false, status: 418, json: async () => ({}) } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ChatWorkspace onEventsChange={onEventsChange} />);
    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Fix live updates' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/sessions/sess-live/messages', expect.objectContaining({ method: 'POST' })));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/sessions/sess-live/events', expect.objectContaining({ method: 'GET' })));
    expect(onEventsChange).toHaveBeenCalledWith([
      expect.objectContaining({ eventId: 'evt-live-tool', runId: 'run-live', taskId: 'task-live', type: 'tool.requested' }),
    ]);

    resolveMessage({
      ok: true,
      status: 201,
      json: async () => ({
        message: { id: 'msg-live', role: 'user', content: 'Fix live updates', createdAt },
        run: { ok: true, summary: 'live run complete', tracePath: '/repo/.runs/run-live/trace.jsonl', reportPath: '/repo/.runs/run-live/report.md', steps: 1, durationMs: 5 },
        session: {
          id: 'sess-live',
          title: 'hidecode session',
          projectPath: '/repo',
          messages: [{ id: 'msg-live', role: 'user', content: 'Fix live updates', createdAt }],
          events: [],
        },
      }),
    } as Response);
    await waitFor(() => expect(screen.getAllByText('live run complete').length).toBeGreaterThan(0));
  });

  it('stops live event polling when the chat workspace unmounts mid-run', async () => {
    let resolveMessage: (response: Response) => void = () => {};
    const messageResponse = new Promise<Response>((resolve) => { resolveMessage = resolve; });
    const onEventsChange = vi.fn();
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/sessions') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            session: { id: 'sess-cleanup', title: 'hidecode session', projectPath: '/repo', messages: [], events: [] },
          }),
        } as Response);
      }

      if (url === '/api/sessions/sess-cleanup/events') {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ events: [] }) } as Response);
      }

      if (url === '/api/sessions/sess-cleanup/messages') return messageResponse;

      return Promise.resolve({ ok: false, status: 418, json: async () => ({}) } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { unmount } = render(<ChatWorkspace onEventsChange={onEventsChange} />);
    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Fix cleanup' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/sessions/sess-cleanup/events', expect.objectContaining({ method: 'GET' })));
    const callsBeforeUnmount = fetchMock.mock.calls.length;

    unmount();
    await new Promise((resolve) => window.setTimeout(resolve, 1100));

    expect(fetchMock.mock.calls.length).toBe(callsBeforeUnmount);
    resolveMessage({
      ok: true,
      status: 201,
      json: async () => ({
        message: { id: 'msg-cleanup', role: 'user', content: 'Fix cleanup', createdAt },
        session: { id: 'sess-cleanup', title: 'hidecode session', projectPath: '/repo', messages: [], events: [] },
      }),
    } as Response);
  });

  it('does not start live event polling after unmounting during session creation', async () => {
    let resolveSession: (response: Response) => void = () => {};
    const sessionResponse = new Promise<Response>((resolve) => { resolveSession = resolve; });
    const onEventsChange = vi.fn();
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/sessions') return sessionResponse;
      if (url === '/api/sessions/sess-after-unmount/events') {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ events: [] }) } as Response);
      }
      if (url === '/api/sessions/sess-after-unmount/messages') {
        return Promise.resolve({ ok: true, status: 201, json: async () => ({ session: { id: 'sess-after-unmount', title: 'hidecode session', projectPath: '/repo', messages: [], events: [] } }) } as Response);
      }
      return Promise.resolve({ ok: false, status: 418, json: async () => ({}) } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { unmount } = render(<ChatWorkspace onEventsChange={onEventsChange} />);
    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Fix cleanup' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/sessions', expect.objectContaining({ method: 'POST' })));

    unmount();
    resolveSession({
      ok: true,
      status: 201,
      json: async () => ({
        session: { id: 'sess-after-unmount', title: 'hidecode session', projectPath: '/repo', messages: [], events: [] },
      }),
    } as Response);
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(fetchMock).not.toHaveBeenCalledWith('/api/sessions/sess-after-unmount/events', expect.anything());
    expect(fetchMock).not.toHaveBeenCalledWith('/api/sessions/sess-after-unmount/messages', expect.anything());
    expect(onEventsChange).not.toHaveBeenCalled();
  });

  it('submits backend messages when rendered in React StrictMode', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/sessions') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            session: { id: 'sess-strict', title: 'hidecode session', projectPath: '/repo', messages: [], events: [] },
          }),
        } as Response);
      }

      if (url === '/api/sessions/sess-strict/events') {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ events: [] }) } as Response);
      }

      if (url === '/api/sessions/sess-strict/messages') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            message: { id: 'msg-strict', role: 'user', content: 'Fix strict mode', createdAt },
            run: { ok: true, summary: 'strict run complete', tracePath: '/repo/.runs/run-strict/trace.jsonl', reportPath: '/repo/.runs/run-strict/report.md', steps: 1, durationMs: 5 },
            session: {
              id: 'sess-strict',
              title: 'hidecode session',
              projectPath: '/repo',
              messages: [{ id: 'msg-strict', role: 'user', content: 'Fix strict mode', createdAt }],
              events: [],
            },
          }),
        } as Response);
      }

      return Promise.resolve({ ok: false, status: 418, json: async () => ({}) } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<StrictMode><ChatWorkspace /></StrictMode>);
    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Fix strict mode' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/sessions/sess-strict/messages', expect.objectContaining({ method: 'POST' })));
    await waitFor(() => expect(screen.getAllByText('strict run complete').length).toBeGreaterThan(0));
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
