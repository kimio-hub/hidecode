import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir, platform } from 'node:os';
import path from 'node:path';
import { LocalSandbox, type ExecutionSandbox } from '../src/sandbox.js';
import { createRepoTools } from '../src/index.js';

describe('execution sandbox', () => {
  it('runs commands with an explicit environment allowlist', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-sandbox-'));
    const sandbox = new LocalSandbox({ env: { ALLOWED_VALUE: 'visible' } });

    const command = platform() === 'win32' ? 'set ALLOWED_VALUE' : 'printf "$ALLOWED_VALUE:$HOME"';
    const result = await sandbox.execute({ command, repo, cwd: repo });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(platform() === 'win32' ? 'ALLOWED_VALUE=visible' : 'visible:');
  });

  it('enforces timeout with structured result', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-sandbox-'));
    const sandbox = new LocalSandbox({ timeoutMs: 20 });

    const result = await sandbox.execute({ command: 'sleep 1', repo, cwd: repo });

    expect(result.ok).toBe(false);
    expect(result.exitCode).not.toBe(0);
    expect(result.error).toMatch(/timeout/i);
  });

  it('lets repo-scoped run tools use injected sandbox', async () => {
    const repo = await mkdtemp(path.join(tmpdir(), 'wh-sandbox-'));
    const calls: string[] = [];
    const sandbox: ExecutionSandbox = {
      mode: 'mock',
      async execute(request) {
        calls.push(request.command);
        return { ok: true, stdout: 'mocked', stderr: '', exitCode: 0, sandbox: { mode: 'mock', cwd: request.cwd } };
      },
    };

    const run = createRepoTools(repo, { sandbox }).find(t => t.name === 'run')!;
    const result = await run.run({ command: 'echo hi' });

    expect(result.ok).toBe(true);
    expect(result.output?.stdout).toBe('mocked');
    expect(calls).toEqual(['echo hi']);
  });
});
