import { HARNESS_VERSION, JsonlEventStore, event, runArtifactLayout, type Task, type TypedTool, type Policy } from '@world-harness/core';
import type { ModelAdapter, Observation } from '@world-harness/models';
import { decide } from '@world-harness/policy';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// ─── Types ─────────────────────────────────────────────────────
export type OrchestratorOptions = {
  task: Task;
  model: ModelAdapter;
  tools: TypedTool[];
  policy?: Policy;
  maxSteps?: number;
  onEvent?: (evt: unknown) => void;
};

export type OrchestratorResult = {
  ok: boolean;
  summary: string;
  steps: number;
  tracePath: string;
  reportPath: string;
  durationMs: number;
};

// ─── ReAct Orchestrator ────────────────────────────────────────
export async function runSingleAgentTask(opts: OrchestratorOptions): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const runId = `run-${startTime}`;
  const taskId = opts.task.id ?? `task-${startTime}`;
  const artifacts = runArtifactLayout(opts.task.repo, runId);
  const trace = new JsonlEventStore(artifacts.trace);

  const emit = async (type: string, data: Record<string, unknown> = {}) => {
    const evt = {
      eventId: randomUUID(),
      runId,
      taskId,
      type: type as any,
      timestamp: new Date().toISOString(),
      actor: 'orchestrator',
      data,
    };
    await trace.append(evt as any);
    opts.onEvent?.(evt);
  };

  await mkdir(artifacts.root, { recursive: true });
  await emit('task.created', { goal: opts.task.goal, mode: opts.task.mode ?? 'plan' });

  const observations: Observation[] = [];
  const maxSteps = opts.maxSteps ?? 20;
  let finalSummary = 'Task did not complete within step budget.';

  for (let step = 0; step < maxSteps; step++) {
    await emit('model.requested', { step });

    let modelStep;
    try {
      modelStep = await opts.model.next(opts.task, observations);
    } catch (err: any) {
      await emit('task.failed', { reason: `Model error: ${err.message}` });
      return finish(false, `Model error at step ${step}: ${err.message}`, step, startTime, artifacts, runId, taskId, opts.task);
    }

    await emit('model.completed', { step, kind: modelStep.kind, summary: 'summary' in modelStep ? modelStep.summary : undefined });

    if (modelStep.kind === 'final') {
      finalSummary = modelStep.summary;
      break;
    }

    if (modelStep.kind === 'plan') {
      await emit('plan.created', { subtasks: modelStep.subtasks, step });
      observations.push({ stepIndex: step, ok: true, output: `Plan created with ${modelStep.subtasks.length} subtasks` });
      continue;
    }

    // Tool execution
    const toolReq = modelStep.request;
    await emit('tool.requested', { tool: toolReq.tool, input: toolReq.input, reasoning: modelStep.reasoning });

    // Policy check
    const policyDecision = decide(opts.policy, toolReq);
    await emit('policy.decided', { decision: policyDecision.decision, reason: policyDecision.reason, matchedRule: policyDecision.matchedRule });

    if (policyDecision.decision === 'deny') {
      observations.push({ stepIndex: step, toolName: toolReq.tool, ok: false, error: `Denied: ${policyDecision.reason}` });
      continue;
    }

    if (policyDecision.decision === 'ask') {
      await emit('approval.requested', { tool: toolReq.tool, reason: policyDecision.reason });
      // Auto-approve in MVP (real impl would pause for user input)
      await emit('approval.resolved', { decision: 'approved' });
    }

    // Find and execute tool
    const tool = opts.tools.find(t => t.name === toolReq.tool);
    if (!tool) {
      observations.push({ stepIndex: step, toolName: toolReq.tool, ok: false, error: `Unknown tool: ${toolReq.tool}` });
      continue;
    }

    await emit('tool.started', { tool: toolReq.tool });
    const result = await tool.run(toolReq.input);
    await emit('tool.finished', { tool: toolReq.tool, ok: result.ok, error: result.error });

    if (result.evidence?.length) {
      await emit('file.changed', { files: result.evidence });
    }

    observations.push({
      stepIndex: step,
      toolName: toolReq.tool,
      ok: result.ok,
      output: result.output,
      error: result.error,
    });
  }

  return finish(true, finalSummary, observations.length, startTime, artifacts, runId, taskId, opts.task);
}

async function finish(
  ok: boolean, summary: string, steps: number, startTime: number,
  artifacts: ReturnType<typeof runArtifactLayout>, runId: string, taskId: string, task: Task,
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
    data: { summary },
  } as any);

  // Write report
  const report = `# Run Report\n\n- Task: ${taskId}\n- Goal: ${task.goal}\n- Result: ${summary}\n- Steps: ${steps}\n- Duration: ${durationMs}ms\n- Trace: ${artifacts.trace}\n`;
  await writeFile(artifacts.report, report, 'utf8');

  // Write run manifest
  const manifest = {
    runId, taskId,
    harnessVersion: HARNESS_VERSION,
    model: { provider: 'unknown', name: 'unknown' },
    workspace: { repo: task.repo },
    artifacts,
    summary,
    steps,
    durationMs,
  };
  await writeFile(artifacts.run, JSON.stringify(manifest, null, 2), 'utf8');

  return { ok, summary, steps, tracePath: artifacts.trace, reportPath: artifacts.report, durationMs };
}
