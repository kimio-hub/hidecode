#!/usr/bin/env node
import { Command } from 'commander';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { Orchestrator } from './core/orchestrator.js';
import { JsonlEventStore } from './core/event-store.js';

const program = new Command();
program.name('world-harness').description('Task-centric coding-agent harness runtime').version('0.1.0');

program
  .command('init')
  .description('Initialize harness metadata in a workspace')
  .option('-w, --workspace <path>', 'workspace path', process.cwd())
  .action(async (opts) => {
    const workspace = resolve(opts.workspace);
    await mkdir(`${workspace}/.world-harness`, { recursive: true });
    await writeFile(`${workspace}/.world-harness/policy.json`, JSON.stringify({ version: 1 }, null, 2), 'utf8');
    console.log(`Initialized .world-harness in ${workspace}`);
  });

program
  .command('run <goal>')
  .description('Run a minimal task-centric agent loop')
  .option('-w, --workspace <path>', 'workspace path', process.cwd())
  .action(async (goal, opts) => {
    const workspace = resolve(opts.workspace);
    const result = await new Orchestrator().run({ goal, workspace, mode: 'plan' });
    console.log(`Task: ${result.task.id}`);
    console.log(`Events: ${result.eventsPath}`);
    console.log(`Report: ${result.reportPath}`);
  });

program
  .command('inspect <eventsPath>')
  .description('Inspect a JSONL event trace')
  .action(async (eventsPath) => {
    const events = await new JsonlEventStore(resolve(eventsPath)).readAll();
    for (const event of events) {
      console.log(`${event.timestamp} ${event.type} ${event.actor}`);
    }
  });

await program.parseAsync();
