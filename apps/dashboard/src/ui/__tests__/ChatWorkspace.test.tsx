import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    render(<ChatWorkspace onReview={() => { requestedMode = 'review'; }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(requestedMode).toBe('review');
  });

  it('creates a backend session, submits a message, and publishes inspector events', async () => {
    const onEventsChange = vi.fn();
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

    render(<ChatWorkspace onEventsChange={onEventsChange} />);

    fireEvent.change(screen.getByLabelText('Message hidecode'), { target: { value: 'Fix this' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/sessions', expect.objectContaining({ method: 'POST' })));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/sessions/sess-1/messages', expect.objectContaining({ method: 'POST' })));
    await waitFor(() => expect(screen.getByText('scripted run complete')).toBeInTheDocument());
    expect(screen.getByText('Fix this')).toBeInTheDocument();
    expect(onEventsChange).toHaveBeenCalledWith([
      expect.objectContaining({ eventId: 'evt-1', runId: 'run-1', taskId: 'task-1', type: 'tool.requested' }),
    ]);
  });
});
