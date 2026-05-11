import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { MOCK_EVENTS, MOCK_RUN } from '../../data/mock';
import type { RunMeta, TraceEvent } from '../../data/mock';

describe('Dashboard', () => {
  it('renders the header with task id', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getAllByText(MOCK_RUN.taskId).length).toBeGreaterThanOrEqual(1);
  });

  it('renders all panel titles', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText('Task Graph')).toBeInTheDocument();
    expect(screen.getByText('Tool Timeline')).toBeInTheDocument();
    expect(screen.getAllByText('Replay Debug').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText('Policy / Risk')).toBeInTheDocument();
    expect(screen.getByText('Diff / Changes')).toBeInTheDocument();
  });

  it('renders Mission Control v2 shell elements', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText('Mission Control')).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getAllByText('Approvals').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Replay').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Agents').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Events').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tools').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Risk')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Command Dock')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('Ask Harness')).toBeInTheDocument();
  });

  it('renders read-only approval queue items', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText('Approval Queue')).toBeInTheDocument();
    expect(screen.getByText('Policy decision: allow')).toBeInTheDocument();
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('renders read-only replay debugger items and future actions', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getAllByText('Replay Debug').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Task created')).toBeInTheDocument();
    expect(screen.getAllByText('Tool result').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Save Eval')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Replay' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fork' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save Eval' })).toBeDisabled();
  });

  it('renders read-only multi-agent board items and future actions', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText('Multi-Agent Board')).toBeInTheDocument();
    expect(screen.getAllByText('Agents').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('agent').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Assign')).toBeInTheDocument();
    expect(screen.getByText('Handoff')).toBeInTheDocument();
    expect(screen.getByText('Unblock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Assign' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Handoff' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Unblock' })).toBeDisabled();
  });

  it('shows model name in header', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText(MOCK_RUN.model.name)).toBeInTheDocument();
  });

  it('shows completed status when task.completed event exists', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders orchestrator-style task, tool, approval, sandbox, and completion events across dashboard panels', () => {
    const run: RunMeta = {
      runId: 'run-orchestrator-integration',
      taskId: 'task-orchestrator-integration',
      harnessVersion: '0.1.0-test',
      model: { provider: 'nous', name: 'Hermes Orchestrator' },
      summary: 'Exercise dashboard with orchestrator trace event names',
    };

    const events: TraceEvent[] = [
      {
        eventId: 'orch-1-task-created',
        runId: run.runId,
        taskId: run.taskId,
        type: 'task.created',
        timestamp: '2026-05-11T12:00:00.000Z',
        actor: 'orchestrator',
        data: { agentId: 'planner', goal: 'Run dashboard integration coverage from orchestrator trace' },
      },
      {
        eventId: 'orch-2-tool-requested',
        runId: run.runId,
        taskId: run.taskId,
        type: 'tool.requested',
        timestamp: '2026-05-11T12:00:01.000Z',
        actor: 'orchestrator',
        data: {
          agentId: 'executor',
          tool: 'execute_shell',
          command: 'pnpm --filter @world-harness/dashboard test',
          risks: ['write', 'network'],
        },
      },
      {
        eventId: 'orch-3-approval-requested',
        runId: run.runId,
        taskId: run.taskId,
        type: 'approval.requested',
        timestamp: '2026-05-11T12:00:02.000Z',
        actor: 'policy',
        data: {
          agentId: 'executor',
          tool: 'execute_shell',
          reason: 'Shell command requires elevated orchestrator approval',
          risk: 'high',
        },
      },
      {
        eventId: 'orch-4-tool-finished',
        runId: run.runId,
        taskId: run.taskId,
        type: 'tool.finished',
        timestamp: '2026-05-11T12:00:04.000Z',
        actor: 'runtime',
        data: {
          agentId: 'executor',
          tool: 'execute_shell',
          durationMs: 2750,
          output: {
            ok: true,
            summary: 'Dashboard tests passed inside sandbox',
            stdout: 'PASS apps/dashboard/src/ui/__tests__/Dashboard.test.tsx',
          },
          sandbox: {
            mode: 'ephemeral',
            writeMode: 'workspace',
            blocked: false,
          },
        },
      },
      {
        eventId: 'orch-5-sandbox-blocked',
        runId: run.runId,
        taskId: run.taskId,
        type: 'sandbox.blocked',
        timestamp: '2026-05-11T12:00:05.000Z',
        actor: 'runtime',
        data: {
          agentId: 'executor',
          error: 'Readonly sandbox blocked write outside workspace',
          sandbox: { mode: 'ephemeral', writeMode: 'readonly' },
        },
      },
      {
        eventId: 'orch-6-task-completed',
        runId: run.runId,
        taskId: run.taskId,
        type: 'task.completed',
        timestamp: '2026-05-11T12:00:06.000Z',
        actor: 'orchestrator',
        data: { agentId: 'executor', summary: 'Orchestrator dashboard integration trace completed' },
      },
    ];

    render(<Dashboard events={events} run={run} sourceLabel="Orchestrator fixture" />);

    expect(screen.getAllByText('Tool Timeline').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('execute_shell').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2750ms')).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('execute_shell')[0]);
    expect(screen.getByText('PASS apps/dashboard/src/ui/__tests__/Dashboard.test.tsx')).toBeInTheDocument();
    expect(screen.getByText('Dashboard tests passed inside sandbox')).toBeInTheDocument();
    expect(screen.getByText('mode=ephemeral · writeMode=workspace · blocked=false')).toBeInTheDocument();

    expect(screen.getByText('Approval Queue')).toBeInTheDocument();
    expect(screen.getByText('Approval requested: execute_shell')).toBeInTheDocument();
    expect(screen.getByText('Shell command requires elevated orchestrator approval')).toBeInTheDocument();
    expect(screen.getByText('Sandbox blocked: ephemeral')).toBeInTheDocument();
    expect(screen.getAllByText(/Readonly sandbox blocked write outside workspace/).length).toBeGreaterThanOrEqual(1);

    expect(screen.getAllByText('Replay Debug').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tool requested')).toBeInTheDocument();
    expect(screen.getByText('execute_shell · risk=high')).toBeInTheDocument();
    expect(screen.getByText('Tool finished')).toBeInTheDocument();
    expect(screen.getByText('Sandbox blocked')).toBeInTheDocument();
    expect(screen.getByText('Task completed')).toBeInTheDocument();

    expect(screen.getByText('Multi-Agent Board')).toBeInTheDocument();
    expect(screen.getByText('executor')).toBeInTheDocument();
    expect(screen.getAllByText('Orchestrator dashboard integration trace completed').length).toBeGreaterThanOrEqual(1);
  });
});
