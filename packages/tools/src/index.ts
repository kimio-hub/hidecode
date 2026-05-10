import { readFile, writeFile, readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { resolve } from 'node:path';
import type { ToolResult, TypedTool } from '@world-harness/core';
const execFileAsync = promisify(execFile);

// ─── Path Safety ───────────────────────────────────────────────
export function resolveInside(repo: string, target: string): string {
  const resolved = resolve(repo, target);
  if (!resolved.startsWith(resolve(repo) + path.sep) && resolved !== resolve(repo)) {
    throw new Error(`path escapes repo: ${target}`);
  }
  return resolved;
}

// ─── File Tools ────────────────────────────────────────────────
export const readTool: TypedTool<{ path: string }, string> = {
  name: 'read',
  risks: ['read'],
  async run(input) {
    const content = await readFile(input.path, 'utf8');
    return { ok: true, output: content, evidence: [input.path] };
  },
};

export const writeTool: TypedTool<{ path: string; content: string }, void> = {
  name: 'write',
  risks: ['write'],
  async run(input) {
    await writeFile(input.path, input.content, 'utf8');
    return { ok: true, evidence: [input.path] };
  },
};

export const patchTool: TypedTool<{ path: string; oldText: string; newText: string }, void> = {
  name: 'patch',
  risks: ['write'],
  async run(input) {
    const content = await readFile(input.path, 'utf8');
    if (!content.includes(input.oldText)) return { ok: false, error: 'Old text not found in file' };
    const patched = content.replace(input.oldText, input.newText);
    await writeFile(input.path, patched, 'utf8');
    return { ok: true, evidence: [input.path] };
  },
};

export const searchTool: TypedTool<{ root: string; query: string }, string[]> = {
  name: 'search',
  risks: ['read'],
  async run(input) {
    try {
      const { stdout } = await execFileAsync('grep', ['-rl', input.query, input.root], { timeout: 10000 });
      const files = stdout.trim().split('\n').filter(Boolean);
      return { ok: true, output: files, evidence: files };
    } catch {
      return { ok: true, output: [], evidence: [] };
    }
  },
};

// ─── Execution Tools ───────────────────────────────────────────
export const runTool: TypedTool<{ command: string; cwd?: string }, { stdout: string; stderr: string; exitCode: number }> = {
  name: 'run',
  risks: ['execute'],
  async run(input) {
    try {
      const { stdout, stderr } = await execFileAsync('bash', ['-c', input.command], {
        cwd: input.cwd,
        timeout: 60000,
        maxBuffer: 1024 * 1024,
      });
      return { ok: true, output: { stdout, stderr, exitCode: 0 }, evidence: [] };
    } catch (err: any) {
      return {
        ok: false,
        output: { stdout: err.stdout ?? '', stderr: err.stderr ?? '', exitCode: err.code ?? 1 },
        error: err.stderr?.slice(0, 500) ?? err.message,
      };
    }
  },
};

export const testTool: TypedTool<{ command?: string; cwd?: string }, { stdout: string; exitCode: number }> = {
  name: 'test',
  risks: ['execute'],
  async run(input) {
    const cmd = input.command ?? 'pnpm test';
    return runTool.run({ command: cmd, cwd: input.cwd }) as Promise<ToolResult & { output?: { stdout: string; exitCode: number } }>;
  },
};

// ─── Git Tools ─────────────────────────────────────────────────
export const gitStatusTool: TypedTool<{ cwd?: string }, string> = {
  name: 'git_status',
  risks: ['git'],
  async run(input) {
    const { stdout } = await execFileAsync('git', ['status', '--short'], { cwd: input.cwd });
    return { ok: true, output: stdout, evidence: [] };
  },
};

export const gitDiffTool: TypedTool<{ cwd?: string; staged?: boolean }, string> = {
  name: 'git_diff',
  risks: ['git'],
  async run(input) {
    const args = input.staged ? ['diff', '--staged'] : ['diff'];
    const { stdout } = await execFileAsync('git', args, { cwd: input.cwd });
    return { ok: true, output: stdout, evidence: [] };
  },
};

export const gitCommitTool: TypedTool<{ message: string; cwd?: string }, string> = {
  name: 'git_commit',
  risks: ['git', 'write'],
  async run(input) {
    const { stdout } = await execFileAsync('git', ['commit', '-m', input.message], { cwd: input.cwd });
    return { ok: true, output: stdout, evidence: [] };
  },
};

export const gitLogTool: TypedTool<{ cwd?: string; count?: number }, string> = {
  name: 'git_log',
  risks: ['git'],
  async run(input) {
    const n = String(input.count ?? 10);
    const { stdout } = await execFileAsync('git', ['log', `--oneline`, `-n`, n], { cwd: input.cwd });
    return { ok: true, output: stdout, evidence: [] };
  },
};

export const gitBranchTool: TypedTool<{ name: string; cwd?: string }, string> = {
  name: 'git_branch',
  risks: ['git', 'write'],
  async run(input) {
    const { stdout } = await execFileAsync('git', ['checkout', '-b', input.name], { cwd: input.cwd });
    return { ok: true, output: stdout, evidence: [] };
  },
};

// ─── Bundle ────────────────────────────────────────────────────
export const localTools: TypedTool[] = [
  readTool, writeTool, patchTool, searchTool,
  runTool, testTool,
  gitStatusTool, gitDiffTool, gitCommitTool, gitLogTool, gitBranchTool,
];

export function getToolByName(name: string): TypedTool | undefined {
  return localTools.find(t => t.name === name);
}
