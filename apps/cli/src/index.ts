#!/usr/bin/env node
import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { HARNESS_VERSION, TaskSchema } from '@world-harness/core';
import { ScriptedModelAdapter, OpenAIModelAdapter } from '@world-harness/models';
import { runSingleAgentTask } from '@world-harness/orchestrator';
import { localTools } from '@world-harness/tools';
import { defaultPolicy } from '@world-harness/policy';

const program = new Command();
program.name('world-harness').version(HARNESS_VERSION);

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
  .action(async (opts) => {
    const task = TaskSchema.parse({
      taskId: `task-${Date.now()}`,
      goal: opts.goal,
      repo: path.resolve(opts.repo),
      mode: opts.mode ?? 'autonomous',
    });

    const model = new OpenAIModelAdapter({
      baseUrl: opts.baseUrl,
      apiKey: opts.apiKey,
      model: opts.model,
      maxSteps: parseInt(opts.maxSteps),
    });

    console.log(`[world-harness] Running task: ${task.goal}`);
    console.log(`[world-harness] Model: ${model.name}`);
    console.log(`[world-harness] Workspace: ${task.repo}`);
    console.log();

    const result = await runSingleAgentTask({
      task,
      model,
      tools: localTools,
      policy: defaultPolicy,
      maxSteps: parseInt(opts.maxSteps),
      onEvent: (evt: any) => {
        const ts = new Date(evt.timestamp).toLocaleTimeString();
        const info = evt.data?.tool ?? evt.data?.summary ?? evt.data?.reason ?? '';
        console.log(`  [${ts}] ${evt.type}${info ? ' — ' + JSON.stringify(info).slice(0, 60) : ''}`);
      },
    });

    console.log();
    console.log(`[world-harness] ${result.ok ? '✓' : '✗'} ${result.summary}`);
    console.log(`[world-harness] Steps: ${result.steps}, Duration: ${result.durationMs}ms`);
    console.log(`[world-harness] Trace: ${result.tracePath}`);
    console.log(`[world-harness] Report: ${result.reportPath}`);

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
      repo: path.resolve(opts.repo),
      mode: 'autonomous',
    });

    const model = new ScriptedModelAdapter([
      { kind: 'tool', request: { tool: 'test', input: { cwd: opts.repo }, risks: ['execute'] } },
      { kind: 'final', summary: 'smoke completed: runtime emitted trace and report' },
    ]);

    const result = await runSingleAgentTask({ task, model, tools: localTools });
    console.log(`[smoke] ${result.ok ? 'PASS' : 'FAIL'} — ${result.summary}`);
    process.exit(result.ok ? 0 : 1);
  });

// ─── replay: deterministic replay from trace ───────────────────
program.command('replay').argument('<trace>').action(async (tracePath) => {
  const content = await readFile(tracePath, 'utf8');
  const events = content.split('\n').filter(Boolean).map(JSON.parse);
  console.log(`Replaying ${events.length} events from ${tracePath}`);
  for (const evt of events) {
    console.log(`  [${evt.type}] ${JSON.stringify(evt.data).slice(0, 100)}`);
  }
  console.log('Replay complete.');
});

program.parse();
