import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ScriptedModelAdapter } from '@world-harness/models';
import { readTool, runTool } from '@world-harness/tools';
import { runSingleAgentTask } from '../src/index.js';

const taskFor = (repo: string) => ({
  taskId: 't1',
  goal: 'smoke',
  repo,
  mode: 'autonomous' as const,
  constraints: [],
  acceptanceCriteria: [],
});

describe('single-agent orchestrator', () => {
  it('writes trace and report for minimal task', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const result = await runSingleAgentTask({
      task: taskFor(repo),
      model: new ScriptedModelAdapter([{ kind: 'final', summary: 'done' }]),
      tools: [],
      policy: { id: 'allow', allow: ['read', 'write', 'execute', 'git', 'network'], ask: [], deny: [] },
    });
    expect(result.ok).toBe(true);
    expect(result.tracePath).toContain('trace.jsonl');
    expect(result.reportPath).toContain('report.md');
  });

  it('records safe model metadata in the run manifest', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const result = await runSingleAgentTask({
      task: taskFor(repo),
      model: new ScriptedModelAdapter([{ kind: 'final', summary: 'done' }]),
      tools: [],
      policy: { id: 'allow', allow: ['read', 'write', 'execute', 'git', 'network'], ask: [], deny: [] },
    });

    const manifestPath = path.join(path.dirname(result.tracePath), 'run.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    expect(manifest.model).toEqual({ provider: 'scripted', name: 'scripted-local' });
  });

  it('records safe model metadata when model execution fails', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const model = {
      provider: 'test-provider',
      name: 'failing-model',
      async next() {
        throw new Error('synthetic model failure');
      },
    };

    const result = await runSingleAgentTask({
      task: taskFor(repo),
      model,
      tools: [],
      policy: { id: 'allow', allow: ['read', 'write', 'execute', 'git', 'network'], ask: [], deny: [] },
    });

    const manifestPath = path.join(path.dirname(result.tracePath), 'run.json');
    const manifestText = await readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestText);
    expect(result.ok).toBe(false);
    expect(manifest.model).toEqual({ provider: 'test-provider', name: 'failing-model' });
    expect(manifestText).not.toContain('apiKey');
    expect(manifestText).not.toContain('baseUrl');
    expect(manifestText).not.toContain('systemPrompt');
  });

  it('records extended event types accepted by the trace schema', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const result = await runSingleAgentTask({
      task: taskFor(repo),
      model: new ScriptedModelAdapter([
        { kind: 'plan', subtasks: ['inspect'] },
        { kind: 'tool', request: { tool: 'run', input: { command: 'rm -rf /' }, risks: ['execute'] } },
        { kind: 'final', summary: 'blocked unsafe command' },
      ]),
      tools: [runTool],
      policy: { id: 'allow', allow: ['read', 'write', 'execute', 'git', 'network'], ask: [], deny: [] },
    });

    const trace = await readFile(result.tracePath, 'utf8');
    expect(trace).toContain('plan.created');
    expect(trace).toContain('security.finding');
    expect(result.ok).toBe(true);
  });

  it('does not auto-approve ask policy decisions', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    await writeFile(path.join(repo, 'a.txt'), 'hello');

    const result = await runSingleAgentTask({
      task: taskFor(repo),
      model: new ScriptedModelAdapter([
        { kind: 'tool', request: { tool: 'read', input: { path: path.join(repo, 'a.txt') }, risks: ['read'] } },
        { kind: 'final', summary: 'done' },
      ]),
      tools: [readTool],
      policy: { id: 'ask-read', allow: [], ask: ['read'], deny: [] },
    });

    const trace = await readFile(result.tracePath, 'utf8');
    expect(trace).toContain('approval.requested');
    expect(trace).not.toContain('approval.resolved');
    expect(trace).not.toContain('tool.started');
    expect(result.ok).toBe(false);
    expect(result.summary).toMatch(/requires explicit approval/);
  });

  it('reports budget exhaustion as failure instead of completed success', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const result = await runSingleAgentTask({
      task: taskFor(repo),
      model: new ScriptedModelAdapter([
        { kind: 'tool', request: { tool: 'missing', input: {}, risks: [] } },
      ]),
      tools: [],
      budget: { maxSteps: 1 },
      policy: { id: 'allow', allow: ['read', 'write', 'execute', 'git', 'network'], ask: [], deny: [] },
    });

    const trace = await readFile(result.tracePath, 'utf8');
    expect(result.ok).toBe(false);
    expect(result.summary).toMatch(/did not complete/i);
    expect(trace).toContain('task.failed');
    expect(trace).not.toContain('task.completed');
  });

  it('fails unknown acceptance criteria instead of ignoring them', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const result = await runSingleAgentTask({
      task: { ...taskFor(repo), acceptanceCriteria: ['tests pass'] },
      model: new ScriptedModelAdapter([{ kind: 'final', summary: 'done' }]),
      tools: [],
      policy: { id: 'allow', allow: ['read', 'write', 'execute', 'git', 'network'], ask: [], deny: [] },
    });

    expect(result.ok).toBe(false);
    expect(result.summary).toMatch(/not verifiable/);
  });
});
