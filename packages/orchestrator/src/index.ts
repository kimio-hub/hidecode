import { HARNESS_VERSION, JsonlEventStore, event, runArtifactLayout, type Task, type TypedTool, type Policy } from '@world-harness/core';
import type { ModelAdapter } from '@world-harness/models';
import { decide } from '@world-harness/policy';
import { mkdir, writeFile } from 'node:fs/promises';

export type OrchestratorOptions = { task: Task; model: ModelAdapter; tools: TypedTool[]; policy?: Policy; maxSteps?: number };
export type OrchestratorResult = { ok: boolean; summary: string; tracePath: string; reportPath: string };

export async function runSingleAgentTask(opts: OrchestratorOptions): Promise<OrchestratorResult> {
  const runId = `run-${Date.now()}`;
  const artifacts = runArtifactLayout(opts.task.repo, runId);
  await mkdir(artifacts.artifactsDir, { recursive: true });
  const store = new JsonlEventStore(artifacts.trace);
  await writeFile(artifacts.task, JSON.stringify(opts.task, null, 2));
  await writeFile(artifacts.run, JSON.stringify({ runId, taskId: opts.task.taskId, harnessVersion: HARNESS_VERSION, model: { provider: 'local', name: opts.model.name }, workspace: { repo: opts.task.repo }, artifacts, summary: '' }, null, 2));
  await store.append(event({ runId, taskId: opts.task.taskId, type: 'task.created', data: { goal: opts.task.goal } }));
  const observations: unknown[] = [];
  for (let step = 0; step < (opts.maxSteps ?? opts.task.budget?.maxSteps ?? 8); step++) {
    await store.append(event({ runId, taskId: opts.task.taskId, type: 'model.requested', data: { step } }));
    const next = await opts.model.next(opts.task, observations);
    await store.append(event({ runId, taskId: opts.task.taskId, type: 'model.completed', data: next }));
    if (next.kind === 'final') {
      await store.append(event({ runId, taskId: opts.task.taskId, type: 'task.completed', data: { summary: next.summary } }));
      const report = `# Run Report\n\n- Task: ${opts.task.taskId}\n- Goal: ${opts.task.goal}\n- Result: ${next.summary}\n- Trace: ${artifacts.trace}\n`;
      await writeFile(artifacts.report, report);
      return { ok: true, summary: next.summary, tracePath: artifacts.trace, reportPath: artifacts.report };
    }
    await store.append(event({ runId, taskId: opts.task.taskId, type: 'tool.requested', data: next.request }));
    const decision = decide(opts.policy, next.request);
    await store.append(event({ runId, taskId: opts.task.taskId, type: 'policy.decided', data: decision }));
    if (decision.decision !== 'allow') {
      await store.append(event({ runId, taskId: opts.task.taskId, type: 'task.failed', data: { reason: decision.reason } }));
      return { ok: false, summary: decision.reason, tracePath: artifacts.trace, reportPath: artifacts.report };
    }
    const tool = opts.tools.find(t => t.name === next.request.tool);
    if (!tool) throw new Error(`Unknown tool: ${next.request.tool}`);
    await store.append(event({ runId, taskId: opts.task.taskId, type: 'tool.started', data: { tool: tool.name } }));
    const result = await tool.run(next.request.input as never);
    observations.push(result);
    await store.append(event({ runId, taskId: opts.task.taskId, type: 'tool.finished', data: result }));
  }
  await store.append(event({ runId, taskId: opts.task.taskId, type: 'task.failed', data: { reason: 'max steps reached' } }));
  return { ok: false, summary: 'max steps reached', tracePath: artifacts.trace, reportPath: artifacts.report };
}
