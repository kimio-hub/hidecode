import {
  HARNESS_VERSION, JsonlEventStore, runArtifactLayout,
  BudgetTracker, withRetry, scanToolInput, scanText,
  type Task, type TypedTool, type Policy, type BudgetConfig,
} from '@world-harness/core';
import type { ModelAdapter, Observation } from '@world-harness/models';
import { decide } from '@world-harness/policy';
import { mkdir, writeFile, cp, rm, readFile, realpath as fsRealpath } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

// ─── Types ─────────────────────────────────────────────────────
export type OrchestratorOptions = {
  task: Task;
  model: ModelAdapter;
  tools: TypedTool[];
  policy?: Policy;
  budget?: BudgetConfig;
  onEvent?: (evt: HarnessEvent) => void;
  /** Enable auto-snapshot before risky operations */
  autoSnapshot?: boolean;
  /** Enable security scanning of tool I/O */
  securityScan?: boolean;
};

export type HarnessEvent = {
  eventId: string;
  runId: string;
  taskId: string;
  type: string;
  timestamp: string;
  actor: string;
  data: Record<string, unknown>;
};

export type OrchestratorResult = {
  ok: boolean;
  summary: string;
  steps: number;
  tracePath: string;
  reportPath: string;
  durationMs: number;
  budget: ReturnType<BudgetTracker['getState']>;
  snapshots: string[];
};

// ─── Subtask DAG ───────────────────────────────────────────────
interface Subtask {
  id: string;
  goal: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  dependencies: string[];
  result?: string;
}

// ─── ReAct Orchestrator ────────────────────────────────────────
export async function runSingleAgentTask(opts: OrchestratorOptions): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const runId = `run-${startTime}`;
  const taskId = opts.task.taskId ?? `task-${startTime}`;
  const artifacts = runArtifactLayout(opts.task.repo, runId);
  const trace = new JsonlEventStore(artifacts.trace);
  const budget = new BudgetTracker(opts.budget ?? { maxSteps: 20 });
  const snapshots: string[] = [];
  const subtasks: Subtask[] = [];

  const emit = async (type: string, data: Record<string, unknown> = {}) => {
    const evt: HarnessEvent = {
      eventId: randomUUID(),
      runId, taskId,
      type,
      timestamp: new Date().toISOString(),
      actor: 'orchestrator',
      data,
    };
    await trace.append(evt as any);
    opts.onEvent?.(evt);
  };

  await mkdir(artifacts.root, { recursive: true });
  await emit('task.created', { goal: opts.task.goal, mode: opts.task.mode ?? 'plan', budget: budget.formatSummary() });

  const observations: Observation[] = [];
  let finalSummary = 'Task did not complete within budget.';
  let blockedByApproval = false;

  while (!budget.isExceeded()) {
    const stepIndex = budget.getState().steps;
    budget.recordStep();
    await emit('model.requested', { step: stepIndex, budget: budget.formatSummary() });

    // ─── Call model with retry ───────────────────────────────
    let modelStep;
    try {
      modelStep = await withRetry(
        () => opts.model.next(opts.task, observations),
        { maxAttempts: 3, baseDelayMs: 1000 },
      );
    } catch (err: any) {
      await emit('task.failed', { reason: `Model error: ${err.message}`, budget: budget.formatSummary() });
      return finish(false, `Model error at step ${stepIndex}: ${err.message}`, stepIndex, startTime, artifacts, runId, taskId, opts.task, opts.model, budget, snapshots);
    }

    // Track token usage if model provides it
    if ('usage' in modelStep && modelStep.usage) {
      const usage = modelStep.usage as { input_tokens?: number; output_tokens?: number };
      budget.recordModelUsage(usage.input_tokens ?? 0, usage.output_tokens ?? 0);
    }

    await emit('model.completed', {
      step: stepIndex,
      kind: modelStep.kind,
      summary: 'summary' in modelStep ? modelStep.summary : undefined,
      budget: budget.formatSummary(),
    });

    // ─── Final ───────────────────────────────────────────────
    if (modelStep.kind === 'final') {
      finalSummary = await verifyAcceptanceCriteria(opts.task, modelStep.summary);
      break;
    }

    // ─── Plan / Subtask Decomposition ────────────────────────
    if (modelStep.kind === 'plan') {
      const newSubtasks: Subtask[] = modelStep.subtasks.map((goal, i) => ({
        id: `sub-${stepIndex}-${i}`,
        goal,
        status: 'pending' as const,
        dependencies: [],
      }));
      subtasks.push(...newSubtasks);
      await emit('plan.created', { subtasks: newSubtasks.map(s => ({ id: s.id, goal: s.goal })), total: subtasks.length });
      observations.push({ stepIndex, ok: true, output: `Plan created: ${newSubtasks.length} subtasks. Execute them one by one.` });
      continue;
    }

    // ─── Tool Execution ──────────────────────────────────────
    const toolReq = modelStep.request;
    await emit('tool.requested', { tool: toolReq.tool, input: toolReq.input, reasoning: modelStep.reasoning });

    // Security scan
    if (opts.securityScan !== false) {
      const scanResult = scanToolInput(toolReq.tool, toolReq.input as Record<string, unknown>);
      if (!scanResult.clean) {
        await emit('security.finding', {
          tool: toolReq.tool,
          findings: scanResult.findings,
        });
        const critical = scanResult.findings.filter(f => f.severity === 'critical');
        if (critical.length > 0) {
          observations.push({
            stepIndex,
            toolName: toolReq.tool,
            ok: false,
            error: `Security block: ${critical.map(f => f.message).join('; ')}`,
          });
          continue;
        }
      }
    }

    // Policy check
    const policyDecision = decide(opts.policy, toolReq);
    await emit('policy.decided', { decision: policyDecision.decision, reason: policyDecision.reason, matchedRule: policyDecision.matchedRule });

    if (policyDecision.decision === 'deny') {
      observations.push({ stepIndex, toolName: toolReq.tool, ok: false, error: `Denied: ${policyDecision.reason}` });
      continue;
    }

    if (policyDecision.decision === 'ask') {
      await emit('approval.requested', { tool: toolReq.tool, reason: policyDecision.reason });
      observations.push({
        stepIndex,
        toolName: toolReq.tool,
        ok: false,
        error: `Approval required: ${policyDecision.reason}`,
      });
      blockedByApproval = true;
      continue;
    }

    // Auto-snapshot before write operations
    if (opts.autoSnapshot && (toolReq.risks?.includes('write') || toolReq.risks?.includes('git'))) {
      const snapId = `snap-${runId}-${stepIndex}`;
      const snapPath = path.join(artifacts.root, 'snapshots', snapId);
      try {
        await mkdir(snapPath, { recursive: true });
        await cp(opts.task.repo, snapPath, { recursive: true, filter: (src) => !src.includes('node_modules') && !src.includes('.runs') });
        snapshots.push(snapPath);
        await emit('snapshot.created', { snapshotId: snapId, path: snapPath });
      } catch (err: any) {
        await emit('snapshot.failed', { error: err instanceof Error ? err.message : String(err) });
      }
    }

    // Find and execute tool
    const tool = opts.tools.find(t => t.name === toolReq.tool);
    if (!tool) {
      observations.push({ stepIndex, toolName: toolReq.tool, ok: false, error: `Unknown tool: ${toolReq.tool}` });
      continue;
    }

    budget.recordToolCall();
    await emit('tool.started', { tool: toolReq.tool });

    let result;
    try {
      result = await withRetry(
        () => tool.run(toolReq.input),
        { maxAttempts: 2, baseDelayMs: 500 },
      );
    } catch (err: any) {
      result = { ok: false,        error: err instanceof Error ? err.message : String(err)};
    }

    await emit('tool.finished', { tool: toolReq.tool, ok: result.ok, error: result.error, evidence: result.evidence });

    // Scan output for secrets
    if (opts.securityScan !== false && result.output) {
      const outputStr = typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
      const outputScan = scanText(outputStr, `${toolReq.tool}.output`);
      if (!outputScan.clean) {
        await emit('security.finding', { tool: toolReq.tool, findings: outputScan.findings, context: 'output' });
      }
    }

    if (result.evidence?.length) {
      await emit('file.changed', { files: result.evidence });
    }

    observations.push({
      stepIndex,
      toolName: toolReq.tool,
      ok: result.ok,
      output: result.output,
      error: result.error,
    });
  }

  if (blockedByApproval && !finalSummary.startsWith('Acceptance criteria not satisfied:')) {
    finalSummary = 'Task requires explicit approval before it can complete.';
  }

  const completed = finalSummary !== 'Task did not complete within budget.' && !finalSummary.startsWith('Acceptance criteria not satisfied:') && !finalSummary.startsWith('Acceptance criteria not verifiable:') && !blockedByApproval;
  if (!completed) {
    const reason = budget.getState().exceededReason;
    if (reason) finalSummary = `Task did not complete: ${reason}.`;
  }
  return finish(completed, finalSummary, budget.getState().steps, startTime, artifacts, runId, taskId, opts.task, opts.model, budget, snapshots);
}

async function verifyAcceptanceCriteria(task: Task, summary: string): Promise<string> {
  const repoReal = await fsRealpath(task.repo);
  for (const criterion of task.acceptanceCriteria ?? []) {
    const match = criterion.match(/^(.+?)\s+contains\s+(.+)$/i);
    if (!match) return `Acceptance criteria not verifiable: ${criterion}`;
    const relativePath = match[1].trim();
    const expected = match[2].trim();
    const filePath = path.resolve(task.repo, relativePath);
    if (!filePath.startsWith(path.resolve(task.repo) + path.sep) && filePath !== path.resolve(task.repo)) {
      return `Acceptance criteria not satisfied: ${criterion}`;
    }
    try {
      const fileReal = await fsRealpath(filePath);
      if (!fileReal.startsWith(repoReal + path.sep) && fileReal !== repoReal) return `Acceptance criteria not satisfied: ${criterion}`;
      const content = await readFile(filePath, 'utf8');
      if (!content.includes(expected)) return `Acceptance criteria not satisfied: ${criterion}`;
    } catch {
      return `Acceptance criteria not satisfied: ${criterion}`;
    }
  }
  return summary;
}

async function finish(
  ok: boolean, summary: string, steps: number, startTime: number,
  artifacts: ReturnType<typeof runArtifactLayout>, runId: string, taskId: string, task: Task, model: ModelAdapter,
  budget: BudgetTracker, snapshots: string[],
): Promise<OrchestratorResult> {
  const durationMs = Date.now() - startTime;
  const trace = new JsonlEventStore(artifacts.trace);
  const endEvent = ok ? 'task.completed' : 'task.failed';
  await trace.append({
    eventId: randomUUID(),
    runId, taskId,
    type: endEvent as any,
    timestamp: new Date().toISOString(),
    actor: 'orchestrator',
    data: { summary, budget: budget.formatSummary() },
  } as any);

  const budgetState = budget.getState();
  const report = [
    `# Run Report`,
    ``,
    `- Task: ${taskId}`,
    `- Goal: ${task.goal}`,
    `- Result: ${summary}`,
    `- Steps: ${steps}`,
    `- Duration: ${durationMs}ms`,
    `- Budget: ${budget.formatSummary()}`,
    `- Snapshots: ${snapshots.length}`,
    `- Trace: ${artifacts.trace}`,
  ].join('\n');
  await writeFile(artifacts.report, report, 'utf8');

  const manifest = {
    runId, taskId,
    harnessVersion: HARNESS_VERSION,
    model: { provider: model.provider ?? 'unknown', name: model.name ?? 'unknown' },
    workspace: { repo: task.repo },
    artifacts,
    summary,
    steps,
    durationMs,
    budget: budgetState,
    snapshots: snapshots.length,
  };
  await writeFile(artifacts.run, JSON.stringify(manifest, null, 2), 'utf8');

  return { ok, summary, steps, tracePath: artifacts.trace, reportPath: artifacts.report, durationMs, budget: budgetState, snapshots };
}
