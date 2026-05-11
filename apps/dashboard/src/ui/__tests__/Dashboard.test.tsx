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
    expect(screen.getByRole('button', { name: 'Ask Harness' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ask Harness' })).toHaveAttribute('title', expect.stringMatching(/command submission is disabled until the dashboard runtime backend api is available/i));
  });

  it('surfaces runtime action readiness as unavailable without enabling controls', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);

    expect(screen.getByRole('status', { name: 'Runtime action readiness' })).toHaveTextContent(
      'Runtime actions unavailable: backend not configured',
    );
    expect(screen.getByText(/read-only dock placeholder/i)).toBeInTheDocument();

    const askHarnessButton = screen.getByRole('button', { name: 'Ask Harness' });
    expect(askHarnessButton).toBeDisabled();
    expect(askHarnessButton).toHaveAttribute(
      'aria-description',
      expect.stringMatching(/command submission is disabled until the dashboard runtime backend api is available/i),
    );
  });

  it('renders provided runtime action readiness fixtures without enabling controls', () => {
    render(
      <Dashboard
        events={MOCK_EVENTS}
        run={MOCK_RUN}
        runtimeActionReadiness={{
          state: 'preview-only',
          canSubmitActions: true,
          reason: 'Runtime actions are visible for preview while submission remains policy-gated.',
          contractVersion: 'dashboard-runtime-actions.v1',
        }}
      />,
    );

    expect(screen.getByRole('status', { name: 'Runtime action readiness' })).toHaveTextContent(
      'Runtime actions preview only: Runtime actions are visible for preview while submission remains policy-gated.',
    );
    expect(screen.getByRole('button', { name: 'Ask Harness' })).toBeDisabled();
  });

  it('renders read-only approval queue items', () => {
    render(<Dashboard events={MOCK_EVENTS} run={MOCK_RUN} />);
    expect(screen.getByText('Approval Queue')).toBeInTheDocument();
    expect(screen.getByText('Policy decision: allow')).toBeInTheDocument();
    const approvalReason = /disabled until the dashboard runtime backend api is available/i;
    const approveButton = screen.getByRole('button', { name: 'Approve' });
    const rejectButton = screen.getByRole('button', { name: 'Reject' });
    expect(approveButton).toBeDisabled();
    expect(rejectButton).toBeDisabled();
    expect(approveButton).toHaveAttribute('title', expect.stringMatching(approvalReason));
    expect(rejectButton).toHaveAttribute('title', expect.stringMatching(approvalReason));
    expect(approveButton).toHaveAttribute('aria-description', expect.stringMatching(approvalReason));
    expect(rejectButton).toHaveAttribute('aria-description', expect.stringMatching(approvalReason));
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
    const replayReason = /disabled until the dashboard runtime backend api is available/i;
    expect(screen.getByRole('button', { name: 'Replay' })).toHaveAttribute('title', expect.stringMatching(replayReason));
    expect(screen.getByRole('button', { name: 'Fork' })).toHaveAttribute('title', expect.stringMatching(replayReason));
    expect(screen.getByRole('button', { name: 'Save Eval' })).toHaveAttribute('title', expect.stringMatching(replayReason));
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
    const agentReason = /disabled until the dashboard runtime backend api is available/i;
    expect(screen.getByRole('button', { name: 'Assign' })).toHaveAttribute('title', expect.stringMatching(agentReason));
    expect(screen.getByRole('button', { name: 'Handoff' })).toHaveAttribute('title', expect.stringMatching(agentReason));
    expect(screen.getByRole('button', { name: 'Unblock' })).toHaveAttribute('title', expect.stringMatching(agentReason));
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
    expect(screen.getAllByText('Dashboard tests passed inside sandbox').length).toBeGreaterThanOrEqual(1);
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

  it('renders exact current orchestrator trace shape without enriched tool metadata', () => {
    const run: RunMeta = {
      runId: 'run-current-orchestrator',
      taskId: 'task-current-orchestrator',
      harnessVersion: '0.1.0-test',
      model: { provider: 'scripted', name: 'scripted-local' },
      summary: 'Current orchestrator trace completed',
    };

    const events: TraceEvent[] = [
      {
        eventId: 'current-1-task-created',
        runId: run.runId,
        taskId: run.taskId,
        type: 'task.created',
        timestamp: '2026-05-11T13:00:00.000Z',
        actor: 'orchestrator',
        data: {
          goal: 'Run exact current orchestrator trace through Dashboard',
          mode: 'autonomous',
          budget: '1/5 steps',
        },
      },
      {
        eventId: 'current-2-model-requested',
        runId: run.runId,
        taskId: run.taskId,
        type: 'model.requested',
        timestamp: '2026-05-11T13:00:01.000Z',
        actor: 'orchestrator',
        data: { step: 0, budget: '1/5 steps' },
      },
      {
        eventId: 'current-3-model-completed',
        runId: run.runId,
        taskId: run.taskId,
        type: 'model.completed',
        timestamp: '2026-05-11T13:00:02.000Z',
        actor: 'orchestrator',
        data: { step: 0, kind: 'tool', budget: '1/5 steps' },
      },
      {
        eventId: 'current-4-tool-requested',
        runId: run.runId,
        taskId: run.taskId,
        type: 'tool.requested',
        timestamp: '2026-05-11T13:00:03.000Z',
        actor: 'orchestrator',
        data: {
          tool: 'run',
          input: { command: 'printf blocked > out.txt', cwd: '/tmp/world-harness-current-fixture' },
          reasoning: 'Verify sandbox handling',
        },
      },
      {
        eventId: 'current-5-policy-decided',
        runId: run.runId,
        taskId: run.taskId,
        type: 'policy.decided',
        timestamp: '2026-05-11T13:00:04.000Z',
        actor: 'orchestrator',
        data: { decision: 'allow', reason: 'allowed by test policy', matchedRule: 'execute' },
      },
      {
        eventId: 'current-6-tool-started',
        runId: run.runId,
        taskId: run.taskId,
        type: 'tool.started',
        timestamp: '2026-05-11T13:00:05.000Z',
        actor: 'orchestrator',
        data: { tool: 'run' },
      },
      {
        eventId: 'current-7-tool-finished',
        runId: run.runId,
        taskId: run.taskId,
        type: 'tool.finished',
        timestamp: '2026-05-11T13:00:06.000Z',
        actor: 'orchestrator',
        data: {
          tool: 'run',
          ok: false,
          error: 'Readonly sandbox blocked write command',
          evidence: [],
          sandbox: { mode: 'local', writeMode: 'readonly', blocked: true },
        },
      },
      {
        eventId: 'current-8-sandbox-blocked',
        runId: run.runId,
        taskId: run.taskId,
        type: 'sandbox.blocked',
        timestamp: '2026-05-11T13:00:07.000Z',
        actor: 'orchestrator',
        data: {
          tool: 'run',
          error: 'Readonly sandbox blocked write command',
          sandbox: { mode: 'local', writeMode: 'readonly', blocked: true },
        },
      },
      {
        eventId: 'current-9-model-requested',
        runId: run.runId,
        taskId: run.taskId,
        type: 'model.requested',
        timestamp: '2026-05-11T13:00:08.000Z',
        actor: 'orchestrator',
        data: { step: 1, budget: '2/5 steps' },
      },
      {
        eventId: 'current-10-model-completed',
        runId: run.runId,
        taskId: run.taskId,
        type: 'model.completed',
        timestamp: '2026-05-11T13:00:09.000Z',
        actor: 'orchestrator',
        data: { step: 1, kind: 'final', summary: 'readonly sandbox blocked write command', budget: '2/5 steps' },
      },
      {
        eventId: 'current-11-task-completed',
        runId: run.runId,
        taskId: run.taskId,
        type: 'task.completed',
        timestamp: '2026-05-11T13:00:10.000Z',
        actor: 'orchestrator',
        data: { summary: 'readonly sandbox blocked write command', budget: '2/5 steps' },
      },
    ];

    render(<Dashboard events={events} run={run} sourceLabel="Current orchestrator fixture" />);

    expect(screen.getAllByText(run.taskId).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(run.model.name)).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Current orchestrator fixture')).toBeInTheDocument();

    expect(screen.getAllByText('Tool Timeline').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('run').length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getAllByText('run')[0]);
    expect(screen.getAllByText('Readonly sandbox blocked write command').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('mode=local · writeMode=readonly · blocked=true')).toBeInTheDocument();
    expect(screen.queryByText('2750ms')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard tests passed inside sandbox')).not.toBeInTheDocument();

    expect(screen.getByText('Approval Queue')).toBeInTheDocument();
    expect(screen.getByText('Policy decision: allow')).toBeInTheDocument();
    expect(screen.getAllByText('allowed by test policy').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sandbox blocked: local')).toBeInTheDocument();

    expect(screen.getAllByText('Replay Debug').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Task created')).toBeInTheDocument();
    expect(screen.getAllByText('Model requested').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Model completed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tool requested')).toBeInTheDocument();
    expect(screen.getByText('Tool started')).toBeInTheDocument();
    expect(screen.getByText('Tool finished')).toBeInTheDocument();
    expect(screen.getByText('Sandbox blocked')).toBeInTheDocument();
    expect(screen.getByText('Task completed')).toBeInTheDocument();

    expect(screen.getByText('Multi-Agent Board')).toBeInTheDocument();
    expect(screen.getAllByText('orchestrator').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('readonly sandbox blocked write command').length).toBeGreaterThanOrEqual(1);
  });
});
