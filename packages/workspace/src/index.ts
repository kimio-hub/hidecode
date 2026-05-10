import { cp, mkdir, rm, readdir } from 'node:fs/promises';
import path from 'node:path';

export type WorkspaceCheckpoint = { checkpointId: string; path: string };

export async function createCheckpoint(repo: string, runId: string): Promise<WorkspaceCheckpoint> {
  const checkpointId = `checkpoint-${runId}`;
  const target = path.join(repo, '.runs', runId, 'checkpoint');
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(repo, { withFileTypes: true })) {
    if (entry.name === '.runs' || entry.name === 'node_modules') continue;
    await cp(path.join(repo, entry.name), path.join(target, entry.name), { recursive: true });
  }
  return { checkpointId, path: target };
}

export async function rollbackFromCheckpoint(repo: string, checkpoint: WorkspaceCheckpoint): Promise<void> {
  for (const entry of await readdir(repo, { withFileTypes: true })) {
    if (entry.name === '.runs') continue;
    await rm(path.join(repo, entry.name), { recursive: true, force: true });
  }
  for (const entry of await readdir(checkpoint.path, { withFileTypes: true })) {
    await cp(path.join(checkpoint.path, entry.name), path.join(repo, entry.name), { recursive: true });
  }
}
