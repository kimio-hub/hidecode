import { TaskSchema, type Task, type Policy } from '@world-harness/core';
import { ScriptedModelAdapter, OpenAIModelAdapter, type ModelAdapter } from '@world-harness/models';
import { runSingleAgentTask, type OrchestratorResult } from '@world-harness/orchestrator';
import { defaultPolicy } from '@world-harness/policy';
import { createRepoTools, LocalSandbox } from '@world-harness/tools';

import { captureGitDiff, type GitDiffSnapshot } from '@world-harness/workspace';

import type { SessionEvent } from '../routes/sessions.js';
import { makeRuntimeSessionEvent, runtimeEventToSessionEvent } from './session-events.js';

export interface BuildSessionTaskOptions {
  sessionId: string;
  projectPath: string;
  message: string;
  maxSteps?: number;
}

export interface RunSessionTaskOptions extends BuildSessionTaskOptions {
  model?: 'scripted' | 'openai';
  modelName?: string;
  baseUrl?: string;
  apiKey?: string;
  policy?: Policy;
}

export interface SessionReviewSnapshot {
  summary: GitDiffSnapshot['summary'];
  changedFiles: GitDiffSnapshot['files'];
  diffs: GitDiffSnapshot['patches'];
  approval: {
    id: string;
    title: string;
    status: 'pending' | 'approved' | 'rejected';
    risk: 'low' | 'medium' | 'high' | 'critical';
    policyExplanation: string;
  };
}

export interface RunSessionTaskResult {
  ok: boolean;
  run: OrchestratorResult;
  events: SessionEvent[];
  review: SessionReviewSnapshot;
}

export function buildSessionTask(options: BuildSessionTaskOptions): Task {
  return TaskSchema.parse({
    taskId: options.sessionId,
    goal: options.message,
    repo: options.projectPath,
    mode: 'autonomous',
    constraints: [
      'Run from the selected local project only.',
      'Prefer minimal safe changes and preserve user work.',
      'Record trace events for the GUI inspector.',
    ],
    acceptanceCriteria: [],
    budget: { maxSteps: options.maxSteps ?? 3 },
  });
}

export async function runSessionTask(options: RunSessionTaskOptions): Promise<RunSessionTaskResult> {
  const task = buildSessionTask(options);
  const events: SessionEvent[] = [
    makeRuntimeSessionEvent(options.sessionId, 'runtime.task.started', {
      goal: options.message,
      projectPath: options.projectPath,
      model: options.model ?? 'scripted',
    }),
  ];

  const model = createRuntimeModel(options);
  const run = await runSingleAgentTask({
    task,
    model,
    tools: createRepoTools(task.repo, { sandbox: new LocalSandbox({ env: {}, network: 'disabled' }) }),
    policy: options.policy ?? defaultPolicy,
    budget: { maxSteps: options.maxSteps ?? 3 },
    autoSnapshot: false,
    securityScan: true,
    onEvent: (event) => {
      events.push(runtimeEventToSessionEvent(options.sessionId, event));
    },
  });

  events.push(makeRuntimeSessionEvent(options.sessionId, run.ok ? 'task.completed' : 'task.failed', {
    summary: run.summary,
    tracePath: run.tracePath,
    reportPath: run.reportPath,
    steps: run.steps,
  }));

  events.push(makeRuntimeSessionEvent(options.sessionId, 'runtime.task.finished', {
    ok: run.ok,
    summary: run.summary,
    tracePath: run.tracePath,
    reportPath: run.reportPath,
    durationMs: run.durationMs,
    steps: run.steps,
  }));

  const review = await buildSessionReviewSnapshot(options.sessionId, options.projectPath);
  events.push(makeRuntimeSessionEvent(options.sessionId, 'approval.requested', {
    approvalId: review.approval.id,
    status: review.approval.status,
    risk: review.approval.risk,
    fileCount: review.summary.fileCount,
    additions: review.summary.additions,
    deletions: review.summary.deletions,
  }));

  return { ok: run.ok, run, events, review };
}

function buildSessionReviewSnapshot(sessionId: string, projectPath: string): Promise<SessionReviewSnapshot> {
  return captureGitDiff(projectPath).then((diff) => ({
    summary: diff.summary,
    changedFiles: diff.files,
    diffs: diff.patches,
    approval: {
      id: `approval_${sessionId}`,
      title: diff.summary.fileCount > 0 ? 'Review real git diff before apply' : 'No file changes detected',
      status: 'pending',
      risk: diff.summary.fileCount > 0 ? 'medium' : 'low',
      policyExplanation: diff.summary.fileCount > 0
        ? 'Real git diff captured from the selected project. Approve/reject is audit-only; mutation execution remains guarded.'
        : 'The session produced no git diff. Approval remains audit-only for traceability.',
    },
  }));
}

function createRuntimeModel(options: RunSessionTaskOptions): ModelAdapter {
  if (options.model === 'openai') {
    return new OpenAIModelAdapter({
      baseUrl: options.baseUrl ?? process.env.OPENAI_BASE_URL ?? 'http://127.0.0.1:3000/v1',
      apiKey: options.apiKey ?? process.env.OPENAI_API_KEY ?? '',
      model: options.modelName ?? process.env.WORLD_HARNESS_MODEL ?? 'gpt-5.5',
      maxSteps: options.maxSteps ?? 3,
    });
  }

  return new ScriptedModelAdapter([
    { kind: 'plan', subtasks: ['Inspect the request', 'Prepare a safe execution trace'] },
    { kind: 'final', summary: 'session task completed' },
  ]);
}

