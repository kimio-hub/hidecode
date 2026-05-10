import { describe, expect, it } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createCheckpoint } from '../src/index.js';

describe('workspace checkpoints', () => {
  it('creates a checkpoint copy for rollback evidence', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-ws-'));
    await writeFile(path.join(repo, 'file.txt'), 'v1');
    const checkpoint = await createCheckpoint(repo, 'r1');
    expect(checkpoint.checkpointId).toBe('checkpoint-r1');
    expect(checkpoint.path).toContain('.runs');
  });
});
