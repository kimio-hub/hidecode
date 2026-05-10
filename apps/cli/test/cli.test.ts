import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cliArgs = [join(import.meta.dirname, '..', 'src', 'index.ts')];

function runCli(args: string[]) {
  return spawnSync(process.execPath, ['--import', 'tsx', ...cliArgs, ...args], {
    cwd: join(import.meta.dirname, '..'),
    encoding: 'utf8',
  });
}

describe('cli package', () => {
  it('prints sandbox flags in run help', () => {
    const result = runCli(['run', '--help']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('--sandbox <mode>');
    expect(result.stdout).toContain('--sandbox-timeout-ms <n>');
    expect(result.stdout).toContain('--sandbox-max-buffer <n>');
    expect(result.stdout).toContain('--sandbox-network <mode>');
  });

  it('rejects unsupported sandbox modes before model execution', () => {
    const repo = mkdtempSync(join(tmpdir(), 'wh-cli-'));
    const result = runCli([
      'run',
      '--repo', repo,
      '--goal', 'noop',
      '--sandbox', 'docker',
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Unsupported sandbox mode: docker');
  });

  it('prints artifact and dashboard hints after smoke completion', () => {
    const repo = mkdtempSync(join(tmpdir(), 'wh-cli-'));
    const result = runCli([
      'smoke',
      '--repo', repo,
      '--goal', 'noop',
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[smoke] PASS');
    expect(result.stdout).toContain('[world-harness] Trace:');
    expect(result.stdout).toContain('trace.jsonl');
    expect(result.stdout).toContain('[world-harness] Run manifest:');
    expect(result.stdout).toContain('run.json');
    expect(result.stdout).toContain('[world-harness] Report:');
    expect(result.stdout).toContain('report.md');
    expect(result.stdout).toContain('[world-harness] Dashboard query: ?run=');
    expect(result.stdout).toContain('%2F');
    expect(result.stdout).toContain('Dashboard note: serve or copy .runs output under the dashboard dev server');
  });
});
