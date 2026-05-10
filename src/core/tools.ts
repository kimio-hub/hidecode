import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fg from 'fast-glob';
import { execa } from 'execa';
import { simpleGit } from 'simple-git';
import type { PolicyEngine } from './policy.js';
import type { ToolResult } from './schemas.js';

export interface ToolContext {
  workspace: string;
  policy: PolicyEngine;
}

export async function readFileTool(ctx: ToolContext, path: string): Promise<ToolResult> {
  const start = Date.now();
  const decision = ctx.policy.decideFile('read', path);
  if (decision.decision !== 'allow') return blocked(decision.reason, start);
  const content = await readFile(resolve(ctx.workspace, path), 'utf8');
  return { ok: true, summary: `Read ${path}`, data: { path, content }, changedFiles: [], durationMs: Date.now() - start };
}

export async function searchFilesTool(ctx: ToolContext, pattern: string): Promise<ToolResult> {
  const start = Date.now();
  const files = await fg(pattern, {
    cwd: ctx.workspace,
    dot: false,
    onlyFiles: true,
    ignore: ['node_modules/**', 'dist/**', '.git/**', '.world-harness/**'],
  });
  return { ok: true, summary: `Found ${files.length} files`, data: { files }, changedFiles: [], durationMs: Date.now() - start };
}

export async function writeFileTool(ctx: ToolContext, path: string, content: string, reason = 'write file'): Promise<ToolResult> {
  const start = Date.now();
  const decision = ctx.policy.decideFile('write', path);
  if (decision.decision !== 'allow') return blocked(decision.reason, start);
  await writeFile(resolve(ctx.workspace, path), content, 'utf8');
  return { ok: true, summary: `${reason}: ${path}`, changedFiles: [path], durationMs: Date.now() - start };
}

export async function runCommandTool(ctx: ToolContext, command: string): Promise<ToolResult> {
  const start = Date.now();
  const decision = ctx.policy.decideCommand(command);
  if (decision.decision !== 'allow') return blocked(decision.reason, start);
  const result = await execa(command, { shell: true, cwd: ctx.workspace, reject: false, timeout: 120_000 });
  return {
    ok: result.exitCode === 0,
    summary: `Command exited ${result.exitCode}: ${command}`,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode ?? undefined,
    changedFiles: [],
    durationMs: Date.now() - start,
  };
}

export async function gitStatusTool(ctx: ToolContext): Promise<ToolResult> {
  const start = Date.now();
  const git = simpleGit(ctx.workspace);
  const status = await git.status();
  return { ok: true, summary: 'Git status collected', data: status, changedFiles: [], durationMs: Date.now() - start };
}

export async function gitDiffTool(ctx: ToolContext): Promise<ToolResult> {
  const start = Date.now();
  const git = simpleGit(ctx.workspace);
  const diff = await git.diff();
  return { ok: true, summary: 'Git diff collected', data: { diff }, changedFiles: [], durationMs: Date.now() - start };
}

function blocked(summary: string, start: number): ToolResult {
  return { ok: false, summary, changedFiles: [], durationMs: Date.now() - start };
}
