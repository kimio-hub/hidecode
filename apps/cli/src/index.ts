#!/usr/bin/env node
import { Command } from 'commander';
import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { HARNESS_VERSION, TaskSchema } from '@world-harness/core';
import { ScriptedModelAdapter, OpenAIModelAdapter } from '@world-harness/models';
import { runSingleAgentTask } from '@world-harness/orchestrator';
import { createRepoTools, LocalSandbox } from '@world-harness/tools';
import { defaultPolicy } from '@world-harness/policy';

const program = new Command();
program.name('world-harness').version(HARNESS_VERSION);

function parseIntOption(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSandboxNetwork(value?: string): 'enabled' | 'disabled' {
  if (value === undefined) return 'enabled';
  if (value === 'enabled' || value === 'disabled') return value;
  throw new Error(`Unsupported sandbox network mode: ${value}`);
}

function dashboardRunQuery(runRoot: string): string {
  return `?run=${encodeURIComponent(runRoot)}`;
}

async function printTraceDashboardHint(tracePath: string) {
  const runRoot = dirname(tracePath);
  const manifestPath = join(runRoot, 'run.json');
  try {
    await access(manifestPath);
  } catch {
    return;
  }

  console.log(`[world-harness] Run manifest: ${manifestPath}`);
  console.log(`[world-harness] Dashboard query: ${dashboardRunQuery(runRoot)}`);
  console.log('[world-harness] Dashboard note: serve or copy this run directory under the dashboard dev server before opening this query.');
}

function printArtifactHints(result: { tracePath: string; reportPath: string }) {
  const runRoot = dirname(result.tracePath);
  const manifestPath = join(runRoot, 'run.json');
  console.log(`[world-harness] Trace: ${result.tracePath}`);
  console.log(`[world-harness] Run manifest: ${manifestPath}`);
  console.log(`[world-harness] Report: ${result.reportPath}`);
  console.log(`[world-harness] Dashboard query: ${dashboardRunQuery(runRoot)}`);
  console.log('[world-harness] Dashboard note: serve or copy .runs output under the dashboard dev server before opening this query.');
}

function createLocalSandbox(opts: { sandboxTimeoutMs?: string; sandboxMaxBuffer?: string; sandboxNetwork?: string }) {
  return new LocalSandbox({
    timeoutMs: parseIntOption(opts.sandboxTimeoutMs ?? '60000', 60000),
    maxBuffer: parseIntOption(opts.sandboxMaxBuffer ?? String(1024 * 1024), 1024 * 1024),
    network: parseSandboxNetwork(opts.sandboxNetwork),
    env: {},
  });
}

// ─── inspect: read and display a trace ─────────────────────────
program.command('inspect').argument('<trace>').action(async (trace) => {
  const content = await readFile(trace, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  console.log(`Trace: ${trace}`);
  console.log(`Events: ${lines.length}`);
  for (const line of lines) {
    const evt = JSON.parse(line);
    const ts = new Date(evt.timestamp).toLocaleTimeString();
    console.log(`  [${ts}] ${evt.type} — ${JSON.stringify(evt.data).slice(0, 80)}`);
  }
  await printTraceDashboardHint(trace);
});

// ─── run: execute a task with real LLM ─────────────────────────
program.command('run')
  .requiredOption('--repo <path>', 'Workspace repo path')
  .requiredOption('--goal <text>', 'Task goal description')
  .option('--model <name>', 'Model name (default: gpt-5.5)', 'gpt-5.5')
  .option('--base-url <url>', 'API base URL', process.env.OPENAI_BASE_URL ?? 'http://127.0.0.1:3000/v1')
  .option('--api-key <key>', 'API key', process.env.OPENAI_API_KEY ?? '')
  .option('--max-steps <n>', 'Max reasoning steps', '20')
  .option('--mode <mode>', 'Task mode', 'plan')
  .option('--sandbox <mode>', 'Execution sandbox mode (local)', 'local')
  .option('--sandbox-timeout-ms <n>', 'Sandbox command timeout in milliseconds', '60000')
  .option('--sandbox-max-buffer <n>', 'Sandbox stdout/stderr max buffer in bytes', String(1024 * 1024))
  .option('--sandbox-network <mode>', 'Sandbox network policy metadata (enabled|disabled)', 'enabled')
  .action(async (opts) => {
    const task = TaskSchema.parse({
      taskId: `task-${Date.now()}`,
      goal: opts.goal,
      repo: resolve(opts.repo),
      mode: opts.mode ?? 'autonomous',
    });

    const model = new OpenAIModelAdapter({
      baseUrl: opts.baseUrl,
      apiKey: opts.apiKey,
      model: opts.model,
      maxSteps: parseInt(opts.maxSteps),
    });

    if (opts.sandbox !== 'local') throw new Error(`Unsupported sandbox mode: ${opts.sandbox}`);
    const sandbox = createLocalSandbox(opts);

    console.log(`[world-harness] Running task: ${task.goal}`);
    console.log(`[world-harness] Model: ${model.name}`);
    console.log(`[world-harness] Workspace: ${task.repo}`);
    console.log(`[world-harness] Sandbox: ${sandbox.mode} timeout=${parseIntOption(opts.sandboxTimeoutMs, 60000)}ms maxBuffer=${parseIntOption(opts.sandboxMaxBuffer, 1024 * 1024)} network=${parseSandboxNetwork(opts.sandboxNetwork)}`);
    console.log();

    const result = await runSingleAgentTask({
      task,
      model,
      tools: createRepoTools(task.repo, { sandbox }),
      policy: defaultPolicy,
      budget: { maxSteps: parseInt(opts.maxSteps) },
      onEvent: (evt: any) => {
        const ts = new Date(evt.timestamp).toLocaleTimeString();
        const info = evt.data?.tool ?? evt.data?.summary ?? evt.data?.reason ?? '';
        console.log(`  [${ts}] ${evt.type}${info ? ' — ' + JSON.stringify(info).slice(0, 60) : ''}`);
      },
    });

    console.log();
    console.log(`[world-harness] ${result.ok ? '✓' : '✗'} ${result.summary}`);
    console.log(`[world-harness] Steps: ${result.steps}, Duration: ${result.durationMs}ms`);
    printArtifactHints(result);

    process.exit(result.ok ? 0 : 1);
  });

// ─── smoke: deterministic smoke test ───────────────────────────
program.command('smoke')
  .requiredOption('--repo <path>', 'Workspace repo path')
  .requiredOption('--goal <text>', 'Task goal description')
  .action(async (opts) => {
    const task = TaskSchema.parse({
      taskId: `task-${Date.now()}`,
      goal: opts.goal,
      repo: resolve(opts.repo),
      mode: 'autonomous',
    });

    const model = new ScriptedModelAdapter([
      { kind: 'tool', request: { tool: 'test', input: { cwd: opts.repo }, risks: ['execute'] } },
      { kind: 'final', summary: 'smoke completed: runtime emitted trace and report' },
    ]);

    const result = await runSingleAgentTask({
      task,
      model,
      tools: createRepoTools(task.repo, { sandbox: new LocalSandbox({ env: {} }) }),
      policy: { id: 'smoke-allow-execute', allow: ['read', 'write', 'execute', 'git', 'network'], ask: [], deny: ['rm -rf', 'secret'] },
    });
    console.log(`[smoke] ${result.ok ? 'PASS' : 'FAIL'} — ${result.summary}`);
    printArtifactHints(result);
    process.exit(result.ok ? 0 : 1);
  });

// ─── replay: deterministic replay from trace ───────────────────
program.command('replay').argument('<trace>').action(async (tracePath) => {
  const content = await readFile(tracePath, 'utf8');
  const events = content.split('\n').filter(Boolean).map(line => JSON.parse(line));
  console.log(`Replaying ${events.length} events from ${tracePath}`);
  for (const evt of events) {
    console.log(`  [${evt.type}] ${JSON.stringify(evt.data).slice(0, 100)}`);
  }
  console.log('Replay complete.');
  await printTraceDashboardHint(tracePath);
});

program.parse();
