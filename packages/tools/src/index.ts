import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import type { ToolResult, TypedTool } from '@world-harness/core';
const execFileAsync = promisify(execFile);

export const readTool: TypedTool<{ path: string }, string> = {
  name: 'read', risks: ['read'],
  async run(input) { return { ok: true, output: await readFile(input.path, 'utf8'), evidence: [input.path] }; }
};

export const searchTool: TypedTool<{ root: string; query: string }, string[]> = {
  name: 'search', risks: ['read'],
  async run(input) {
    const { stdout } = await execFileAsync('python3', ['-c', `import pathlib,sys\nroot=pathlib.Path(sys.argv[1]); q=sys.argv[2]\nfor p in root.rglob('*'):\n    if p.is_file() and q in p.read_text(errors='ignore'):\n        print(p)` , input.root, input.query]);
    return { ok: true, output: stdout.trim() ? stdout.trim().split('\n') : [], evidence: [`search:${input.query}`] };
  }
};

export const patchTool: TypedTool<{ path: string; oldText: string; newText: string }, { changed: boolean }> = {
  name: 'patch', risks: ['write'],
  async run(input) {
    const content = await readFile(input.path, 'utf8');
    if (!content.includes(input.oldText)) return { ok: false, error: 'oldText not found', evidence: [input.path] };
    await writeFile(input.path, content.replace(input.oldText, input.newText), 'utf8');
    return { ok: true, output: { changed: true }, evidence: [input.path] };
  }
};

async function runCmd(command: string, args: string[], cwd: string): Promise<ToolResult> {
  try { const { stdout, stderr } = await execFileAsync(command, args, { cwd, timeout: 120_000 }); return { ok: true, output: { stdout, stderr }, evidence: [`${command} ${args.join(' ')}`] }; }
  catch (error: any) { return { ok: false, error: `${error.message}\n${error.stdout ?? ''}\n${error.stderr ?? ''}`, evidence: [`${command} ${args.join(' ')}`] }; }
}
export const runTool: TypedTool<{ command: string; args?: string[]; cwd: string }> = { name: 'run', risks: ['execute'], run: i => runCmd(i.command, i.args ?? [], i.cwd) };
export const gitTool: TypedTool<{ args: string[]; cwd: string }> = { name: 'git', risks: ['git'], run: i => runCmd('git', i.args, i.cwd) };
export const testTool: TypedTool<{ command?: string; args?: string[]; cwd: string }> = { name: 'test', risks: ['execute'], run: i => runCmd(i.command ?? 'pnpm', i.args ?? ['test'], i.cwd) };

export const localTools = [readTool, searchTool, patchTool, runTool, gitTool, testTool];
export function resolveInside(repo: string, relative: string): string {
  const resolved = path.resolve(repo, relative);
  if (!resolved.startsWith(path.resolve(repo))) throw new Error('path escapes repo');
  return resolved;
}
