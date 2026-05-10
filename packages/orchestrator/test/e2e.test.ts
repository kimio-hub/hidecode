import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ScriptedModelAdapter } from '@world-harness/models';
import { createRepoTools } from '@world-harness/tools';
import { runSingleAgentTask } from '../src/index.js';

const allowAll = { id: 'allow', allow: ['read', 'write', 'execute', 'git', 'network'], ask: [], deny: [] };

describe('coding task e2e semantics', () => {
  it('only succeeds when the workspace is actually changed and verification passes', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-e2e-'));
    const src = path.join(repo, 'math.js');
    await writeFile(src, 'export function add(a, b) { return a - b; }\n');

    const result = await runSingleAgentTask({
      task: {
        taskId: 'fix-add',
        goal: 'Fix add implementation',
        repo,
        mode: 'autonomous',
        constraints: [],
        acceptanceCriteria: ['math.js contains a + b'],
      },
      model: new ScriptedModelAdapter([
        { kind: 'tool', request: { tool: 'patch', input: { path: 'math.js', oldText: 'a - b', newText: 'a + b' }, risks: ['write'] } },
        { kind: 'tool', request: { tool: 'run', input: { command: "node -e \"import('./math.js').then(m=>{if(m.add(2,2)!==4) process.exit(1)})\"" }, risks: ['execute'] } },
        { kind: 'final', summary: 'fixed add and verified it returns 4' },
      ]),
      tools: createRepoTools(repo),
      policy: allowAll,
      budget: { maxSteps: 5 },
    });

    expect(result.ok).toBe(true);
    expect(await readFile(src, 'utf8')).toContain('a + b');
    const trace = await readFile(result.tracePath, 'utf8');
    expect(trace).toContain('tool.finished');
    expect(trace).toContain('task.completed');
  });

  it('fails when the model claims final without satisfying acceptance criteria', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-e2e-'));
    const src = path.join(repo, 'math.js');
    await writeFile(src, 'export function add(a, b) { return a - b; }\n');

    const result = await runSingleAgentTask({
      task: {
        taskId: 'fake-success',
        goal: 'Fix add implementation',
        repo,
        mode: 'autonomous',
        constraints: [],
        acceptanceCriteria: ['math.js contains a + b'],
      },
      model: new ScriptedModelAdapter([{ kind: 'final', summary: 'done' }]),
      tools: createRepoTools(repo),
      policy: allowAll,
      budget: { maxSteps: 3 },
    });

    expect(result.ok).toBe(false);
    expect(result.summary).toMatch(/acceptance criteria/i);
    expect(await readFile(src, 'utf8')).toContain('a - b');
  });
});
