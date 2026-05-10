import { readFile, writeFile, readdir, realpath, lstat, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, resolve, sep } from 'node:path';
import type { ToolResult, TypedTool } from '@world-harness/core';
const execFileAsync = promisify(execFile);

// ─── Path Safety ───────────────────────────────────────────────
export function resolveInside(repo: string, target: string): string {
  const resolved = resolve(repo, target);
  if (!resolved.startsWith(resolve(repo) + sep) && resolved !== resolve(repo)) {
    throw new Error(`path escapes repo: ${target}`);
  }
  return resolved;
}

async function assertRealInside(repo: string, target: string): Promise<string> {
  const resolved = resolveInside(repo, target);
  const repoReal = await realpath(repo);
  const targetReal = await realpath(resolved);
  if (!targetReal.startsWith(repoReal + sep) && targetReal !== repoReal) {
    throw new Error(`path escapes repo via symlink: ${target}`);
  }
  return resolved;
}

async function assertWritableInside(repo: string, target: string): Promise<string> {
  const resolved = resolveInside(repo, target);
  const repoReal = await realpath(repo);
  const parentReal = await nearestExistingRealpath(repo, target);
  if (!parentReal.startsWith(repoReal + sep) && parentReal !== repoReal) {
    throw new Error(`path escapes repo via symlink: ${target}`);
  }
  try {
    const stat = await lstat(resolved);
    if (stat.isSymbolicLink()) throw new Error(`refusing to write through symlink: ${target}`);
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return resolved;
}

function evidenceFailure(error: unknown, output?: unknown): ToolResult {
  return {
    ok: false,
    output,
    error: error instanceof Error ? error.message : String(error),
    evidence: [],
  };
}

function commandLooksUnsafe(command: string): boolean {
  const tokens = command.match(/'[^']*'|"[^"]*"|\S+/g) ?? [];
  const normalized = tokens.map(token => token.replace(/^['"]|['"]$/g, ''));
  return normalized.some(token => token.startsWith('/') || token.includes('../') || token === '..');
}

async function nearestExistingRealpath(repo: string, target: string): Promise<string> {
  const resolved = resolveInside(repo, target);
  let current = dirname(resolved);
  while (current.startsWith(resolve(repo) + sep) || current === resolve(repo)) {
    try {
      return await realpath(current);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') throw error;
      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  throw new Error(`path escapes repo: ${target}`);
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
    await mkdir(dirname(input.path), { recursive: true });
    await writeFile(input.path, input.content, { encoding: 'utf8', flag: 'wx' }).catch(async (error: any) => {
      if (error?.code !== 'EEXIST') throw error;
      await writeFile(input.path, input.content, 'utf8');
    });
    return { ok: true, evidence: [input.path] };
  },
};

export const patchTool: TypedTool<{ path: string; oldText: string; newText: string }, void> = {
  name: 'patch',
  risks: ['write'],
  async run(input) {
    const content = await readFile(input.path, 'utf8');
    if (!content.includes(input.oldText)) return { ok: false, error: 'Old text not found in file', evidence: [] };
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
        evidence: [],
      };
    }
  },
};

export const testTool: TypedTool<{ command?: string; cwd?: string }, { stdout: string; stderr: string; exitCode: number }> = {
  name: 'test',
  risks: ['execute'],
  async run(input) {
    const cmd = input.command ?? 'pnpm test';
    return runTool.run({ command: cmd, cwd: input.cwd });
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

// ─── Repo-scoped Wrappers ───────────────────────────────────────
export function createRepoTools(repo: string): TypedTool[] {
  const scopedReadPath = (target: string) => assertRealInside(repo, target);
  const scopedWritePath = (target: string) => assertWritableInside(repo, target);
  const scopedCwd = async (cwd?: string) => cwd ? assertRealInside(repo, cwd) : realpath(repo);

  return [
    {
      ...readTool,
      async run(input: { path: string }) {
        try {
          return await readTool.run({ ...input, path: await scopedReadPath(input.path) });
        } catch (error) {
          return evidenceFailure(error);
        }
      },
    },
    {
      ...writeTool,
      async run(input: { path: string; content: string }) {
        try {
          return await writeTool.run({ ...input, path: await scopedWritePath(input.path) });
        } catch (error) {
          return evidenceFailure(error);
        }
      },
    },
    {
      ...patchTool,
      async run(input: { path: string; oldText: string; newText: string }) {
        try {
          return await patchTool.run({ ...input, path: await scopedReadPath(input.path) });
        } catch (error) {
          return evidenceFailure(error);
        }
      },
    },
    {
      ...searchTool,
      async run(input: { root: string; query: string }) {
        try {
          return await searchTool.run({ ...input, root: await scopedReadPath(input.root) });
        } catch (error) {
          return evidenceFailure(error, []);
        }
      },
    },
    {
      ...runTool,
      async run(input: { command: string; cwd?: string }) {
        try {
          if (commandLooksUnsafe(input.command)) throw new Error('command references paths outside repo');
          return await runTool.run({ ...input, cwd: await scopedCwd(input.cwd) });
        } catch (error) {
          return evidenceFailure(error, { stdout: '', stderr: '', exitCode: 1 });
        }
      },
    },
    {
      ...testTool,
      async run(input: { command?: string; cwd?: string }) {
        try {
          const command = input.command ?? 'pnpm test';
          if (commandLooksUnsafe(command)) throw new Error('command references paths outside repo');
          return await testTool.run({ ...input, command, cwd: await scopedCwd(input.cwd) });
        } catch (error) {
          return evidenceFailure(error, { stdout: '', stderr: '', exitCode: 1 });
        }
      },
    },
    ...[gitStatusTool, gitDiffTool, gitCommitTool, gitLogTool].map(tool => ({
      ...tool,
      async run(input: Record<string, unknown>) {
        try {
          const cwd = typeof input.cwd === 'string' ? await scopedCwd(input.cwd) : await realpath(repo);
          return await tool.run({ ...input, cwd } as never);
        } catch (error) {
          return evidenceFailure(error);
        }
      },
    })),
    {
      ...gitBranchTool,
      async run(input: { name: string; cwd?: string }) {
        try {
          return await gitBranchTool.run({ ...input, cwd: await scopedCwd(input.cwd) });
        } catch (error) {
          return evidenceFailure(error);
        }
      },
    },
  ];
}

// ─── Bundle ────────────────────────────────────────────────────
export const localTools: TypedTool[] = [
  readTool, writeTool, patchTool, searchTool,
  runTool, testTool,
  gitStatusTool, gitDiffTool, gitCommitTool, gitLogTool, gitBranchTool,
];

export function getToolByName(name: string): TypedTool | undefined {
  return localTools.find(t => t.name === name);
}
