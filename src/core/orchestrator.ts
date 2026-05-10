import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JsonlEventStore } from './event-store.js';
import { PolicyEngine } from './policy.js';
import { gitDiffTool, gitStatusTool, readFileTool, runCommandTool, searchFilesTool, type ToolContext } from './tools.js';
import { newId, nowIso, type HarnessEvent, type Task } from './schemas.js';

export interface RunOptions {
  goal: string;
  workspace: string;
  mode?: Task['mode'];
}

export class Orchestrator {
  async run(options: RunOptions): Promise<{ task: Task; reportPath: string; eventsPath: string }> {
    const taskId = newId('task');
    const harnessDir = join(options.workspace, '.world-harness', taskId);
    await mkdir(harnessDir, { recursive: true });
    const eventsPath = join(harnessDir, 'events.jsonl');
    const store = new JsonlEventStore(eventsPath);
    const task: Task = {
      id: taskId,
      goal: options.goal,
      workspace: options.workspace,
      mode: options.mode ?? 'plan',
      status: 'in_progress',
      constraints: [],
      successCriteria: ['collect repo status', 'inspect project files', 'produce evidence-backed report'],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    await emit(store, { taskId, type: 'task.created', actor: 'orchestrator', data: task });
    const policy = new PolicyEngine({ workspace: options.workspace });
    const ctx: ToolContext = { workspace: options.workspace, policy };

    const status = await gitStatusTool(ctx);
    await emit(store, { taskId, type: 'tool.finished', actor: 'gitStatus', data: status });

    const files = await searchFilesTool(ctx, '{package.json,README.md,AGENTS.md,CLAUDE.md,src/**/*.ts,tests/**/*.ts}');
    await emit(store, { taskId, type: 'tool.finished', actor: 'searchFiles', data: files });

    const packageRead = await readFileTool(ctx, 'package.json').catch((error) => ({ ok: false, summary: String(error), durationMs: 0, changedFiles: [] }));
    await emit(store, { taskId, type: 'tool.finished', actor: 'readFile', data: packageRead });

    const testResult = await runCommandTool(ctx, 'pnpm test');
    await emit(store, { taskId, type: 'verification.finished', actor: 'runCommand', data: testResult });

    const diff = await gitDiffTool(ctx);
    await emit(store, { taskId, type: 'tool.finished', actor: 'gitDiff', data: diff });

    const report = renderReport(options.goal, status, files, packageRead, testResult, diff);
    const reportPath = join(harnessDir, 'report.md');
    await writeFile(reportPath, report, 'utf8');
    await emit(store, { taskId, type: 'summary.created', actor: 'orchestrator', data: { reportPath } });
    return { task, reportPath, eventsPath };
  }
}

async function emit(store: JsonlEventStore, event: Omit<HarnessEvent, 'id' | 'timestamp'>): Promise<void> {
  await store.append({ id: newId('evt'), timestamp: nowIso(), ...event });
}

function renderReport(goal: string, status: any, files: any, packageRead: any, testResult: any, diff: any): string {
  return `# World Harness Run Report\n\n## Goal\n\n${goal}\n\n## Evidence\n\n- Git status collected: ${status.ok}\n- Project files discovered: ${files.ok ? files.data.files.length : 0}\n- package.json read: ${packageRead.ok}\n- Test command attempted: pnpm test\n- Test result: ${testResult.ok ? 'passed' : 'failed or blocked'}\n- Diff collected: ${diff.ok}\n\n## Verification\n\n\`pnpm test\` exit code: ${testResult.exitCode ?? 'n/a'}\n\n## Risk\n\nThis MVP run is inspect/verify oriented. File edits are not automated yet.\n\n## Next Step\n\nImplement patch-first edit tool, model adapter, and task graph planning.\n`;
}
