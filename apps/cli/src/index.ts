#!/usr/bin/env node
import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { HARNESS_VERSION, TaskSchema } from '@world-harness/core';
import { ScriptedModelAdapter } from '@world-harness/models';
import { runSingleAgentTask } from '@world-harness/orchestrator';
import { localTools } from '@world-harness/tools';
import { defaultPolicy } from '@world-harness/policy';

const program = new Command();
program.name('world-harness').version(HARNESS_VERSION);

program.command('inspect').argument('<trace>').action(async (trace) => {
  const content = await readFile(trace, 'utf8');
  for (const line of content.split('\n').filter(Boolean)) {
    const event = JSON.parse(line);
    console.log(`${event.timestamp} ${event.type} ${JSON.stringify(event.data)}`);
  }
});

program.command('replay').argument('<trace>').action(async (trace) => {
  const lines = (await readFile(trace, 'utf8')).split('\n').filter(Boolean).map((line) => JSON.parse(line));
  console.log(JSON.stringify({ events: lines.length, first: lines[0]?.type, last: lines.at(-1)?.type }, null, 2));
});

program.command('smoke').requiredOption('--repo <repo>').requiredOption('--goal <goal>').action(async (opts) => {
  const repo = path.resolve(process.cwd(), '..', '..', opts.repo);
  const task = TaskSchema.parse({ taskId: `task-${Date.now()}`, repo, goal: opts.goal, mode: 'autonomous', constraints: [], acceptanceCriteria: ['trace exists', 'report exists'], budget: { maxSteps: 3 } });
  const model = new ScriptedModelAdapter([{ kind: 'final', summary: 'smoke completed: runtime emitted trace and report' }]);
  const result = await runSingleAgentTask({ task, model, tools: localTools, policy: { ...defaultPolicy, allow: ['read', 'write', 'execute', 'git', 'network'], ask: [] } });
  console.log(JSON.stringify(result, null, 2));
});

program.parse();
