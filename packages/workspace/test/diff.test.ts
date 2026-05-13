import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { captureGitDiff } from '../src/diff.js';

const execFileAsync = promisify(execFile);

async function git(repo: string, args: string[]) {
  return execFileAsync('git', args, { cwd: repo });
}

async function createRepo() {
  const repo = await mkdtemp(path.join(tmpdir(), 'wh-diff-'));
  await git(repo, ['init']);
  await git(repo, ['config', 'user.email', 'test@example.com']);
  await git(repo, ['config', 'user.name', 'Test User']);
  return repo;
}

describe('captureGitDiff', () => {
  it('captures changed file summaries and unified patches from a git worktree', async () => {
    const repo = await createRepo();
    await writeFile(path.join(repo, 'src.ts'), 'export const value = 1;\n');
    await git(repo, ['add', 'src.ts']);
    await git(repo, ['commit', '-m', 'initial']);

    await writeFile(path.join(repo, 'src.ts'), 'export const value = 2;\nexport const next = 3;\n');
    await writeFile(path.join(repo, 'added.md'), '# Added\n');

    const diff = await captureGitDiff(repo);

    expect(diff.summary).toMatchObject({ fileCount: 2, additions: 3, deletions: 1 });
    expect(diff.files).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'src.ts', status: 'modified', additions: 2, deletions: 1, language: 'ts' }),
      expect.objectContaining({ path: 'added.md', status: 'added', additions: 1, deletions: 0, language: 'md' }),
    ]));
    expect(diff.patches).toEqual(expect.arrayContaining([
      expect.objectContaining({ filePath: 'src.ts', patch: expect.stringContaining('export const value = 2;') }),
      expect.objectContaining({ filePath: 'added.md', patch: expect.stringContaining('# Added') }),
    ]));
  });

  it('returns an empty review diff when the worktree is clean', async () => {
    const repo = await createRepo();
    await writeFile(path.join(repo, 'README.md'), '# Clean\n');
    await git(repo, ['add', 'README.md']);
    await git(repo, ['commit', '-m', 'initial']);

    const diff = await captureGitDiff(repo);

    expect(diff.summary).toMatchObject({ fileCount: 0, additions: 0, deletions: 0 });
    expect(diff.files).toEqual([]);
    expect(diff.patches).toEqual([]);
  });
});
