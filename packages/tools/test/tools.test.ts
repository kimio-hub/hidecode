import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRepoTools, patchTool, readTool, resolveInside, runTool } from '../src/index.js';

describe('local typed tools', () => {
  it('reads and patches files with evidence', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'wh-tools-'));
    const file = path.join(dir, 'a.txt');
    await writeFile(file, 'hello old');
    expect((await readTool.run({ path: file })).output).toBe('hello old');
    expect((await patchTool.run({ path: file, oldText: 'old', newText: 'new' })).ok).toBe(true);
    expect((await readTool.run({ path: file })).output).toBe('hello new');
  });

  it('returns evidence on failed patch and failed command results', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'wh-tools-'));
    const file = path.join(dir, 'a.txt');
    await writeFile(file, 'hello');

    const patchResult = await patchTool.run({ path: file, oldText: 'missing', newText: 'new' });
    expect(patchResult.ok).toBe(false);
    expect(patchResult.evidence).toEqual([]);

    const runResult = await runTool.run({ command: 'exit 7', cwd: dir });
    expect(runResult.ok).toBe(false);
    expect(runResult.evidence).toEqual([]);
    expect(runResult.output?.exitCode).toBe(7);
  });

  it('rejects paths outside repo', () => {
    expect(() => resolveInside('/repo', '../etc/passwd')).toThrow('path escapes repo');
  });

  it('creates repo-scoped tools that reject path traversal', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const outside = path.join(await mkdtemp(path.join(tmpdir(), 'wh-outside-')), 'secret.txt');
    await writeFile(outside, 'secret');
    await writeFile(path.join(repo, 'inside.txt'), 'inside');

    const tools = createRepoTools(repo);
    const scopedRead = tools.find(t => t.name === 'read')!;
    const escaped = await scopedRead.run({ path: outside });
    expect(escaped.ok).toBe(false);
    expect(escaped.error).toMatch(/path escapes repo/);
    expect((await scopedRead.run({ path: 'inside.txt' })).output).toBe('inside');
  });

  it('runs repo-scoped commands inside the workspace even if cwd tries to escape', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const tools = createRepoTools(repo);
    const scopedRun = tools.find(t => t.name === 'run')!;

    const result = await scopedRun.run({ command: 'pwd', cwd: '/' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/path escapes repo/);
  });

  it('rejects symlink escapes from repo-scoped file tools', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const outsideDir = await mkdtemp(path.join(tmpdir(), 'wh-outside-'));
    await writeFile(path.join(outsideDir, 'secret.txt'), 'secret');
    await symlink(outsideDir, path.join(repo, 'link'));

    const scopedRead = createRepoTools(repo).find(t => t.name === 'read')!;
    const result = await scopedRead.run({ path: 'link/secret.txt' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/path escapes repo via symlink/);
  });

  it('blocks repo-scoped commands that reference obvious outside paths', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const scopedRun = createRepoTools(repo).find(t => t.name === 'run')!;
    const result = await scopedRun.run({ command: 'cat "/etc/passwd"' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/outside repo/);
  });

  it('allows repo-scoped writes to create new nested directories', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-repo-'));
    const scopedWrite = createRepoTools(repo).find(t => t.name === 'write')!;
    const result = await scopedWrite.run({ path: 'src/new/file.ts', content: 'ok' });
    expect(result.ok).toBe(true);
    await expect(readFile(path.join(repo, 'src/new/file.ts'), 'utf8')).resolves.toBe('ok');
  });
});
