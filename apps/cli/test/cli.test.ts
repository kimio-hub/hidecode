import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cliArgs = ['tsx', 'src/index.ts'];

describe('cli package', () => {
  it('prints sandbox flags in run help', () => {
    const result = spawnSync('pnpm', [...cliArgs, 'run', '--help'], {
      cwd: join(import.meta.dirname, '..'),
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('--sandbox <mode>');
    expect(result.stdout).toContain('--sandbox-timeout-ms <n>');
    expect(result.stdout).toContain('--sandbox-max-buffer <n>');
    expect(result.stdout).toContain('--sandbox-network <mode>');
  });

  it('rejects unsupported sandbox modes before model execution', () => {
    const repo = mkdtempSync(join(tmpdir(), 'wh-cli-'));
    const result = spawnSync('pnpm', [
      ...cliArgs,
      'run',
      '--repo', repo,
      '--goal', 'noop',
      '--sandbox', 'docker',
    ], {
      cwd: join(import.meta.dirname, '..'),
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Unsupported sandbox mode: docker');
  });
});
