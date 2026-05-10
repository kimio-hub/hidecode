import { describe, expect, it } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readTool, patchTool, resolveInside } from '../src/index.js';

describe('local typed tools', () => {
  it('reads and patches files with evidence', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'wh-tools-'));
    const file = path.join(dir, 'a.txt');
    await writeFile(file, 'hello old');
    expect((await readTool.run({ path: file })).output).toBe('hello old');
    expect((await patchTool.run({ path: file, oldText: 'old', newText: 'new' })).ok).toBe(true);
    expect((await readTool.run({ path: file })).output).toBe('hello new');
  });
  it('rejects paths outside repo', () => {
    expect(() => resolveInside('/repo', '../etc/passwd')).toThrow('path escapes repo');
  });
});
