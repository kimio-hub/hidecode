import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ScriptedModelAdapter } from '@world-harness/models';
import { runSingleAgentTask } from '../src/index.js';

describe('single-agent orchestrator', () => {
  it('writes trace and report for minimal task', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const result = await runSingleAgentTask({
      task: { taskId: 't1', goal: 'smoke', repo, mode: 'autonomous', constraints: [], acceptanceCriteria: [] },
      model: new ScriptedModelAdapter([{ kind: 'final', summary: 'done' }]),
      tools: [],
      policy: { id: 'allow', allow: ['read', 'write', 'execute', 'git', 'network'], ask: [], deny: [] }
    });
    expect(result.ok).toBe(true);
    expect(result.tracePath).toContain('trace.jsonl');
    expect(result.reportPath).toContain('report.md');
  });
});
