import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);

export type SandboxMode = string;

export type ExecutionRequest = {
  command: string;
  repo: string;
  cwd: string;
  timeoutMs?: number;
  maxBuffer?: number;
  env?: Record<string, string>;
  network?: 'enabled' | 'disabled';
  writeMode?: 'repo' | 'readonly';
};

export type ExecutionResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
  sandbox: {
    mode: SandboxMode;
    cwd: string;
    timeoutMs?: number;
    network?: 'enabled' | 'disabled';
    writeMode?: 'repo' | 'readonly';
  };
};

export interface ExecutionSandbox {
  mode: SandboxMode;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}

export type LocalSandboxOptions = {
  timeoutMs?: number;
  maxBuffer?: number;
  env?: Record<string, string>;
  network?: 'enabled' | 'disabled';
  writeMode?: 'repo' | 'readonly';
};

export class LocalSandbox implements ExecutionSandbox {
  readonly mode = 'local';

  constructor(private readonly defaults: LocalSandboxOptions = {}) {}

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const timeoutMs = request.timeoutMs ?? this.defaults.timeoutMs ?? 60000;
    const maxBuffer = request.maxBuffer ?? this.defaults.maxBuffer ?? 1024 * 1024;
    const env = { ...(this.defaults.env ?? {}), ...(request.env ?? {}) };
    const sandboxMeta = {
      mode: this.mode,
      cwd: request.cwd,
      timeoutMs,
      network: request.network ?? this.defaults.network ?? 'enabled' as const,
      writeMode: request.writeMode ?? this.defaults.writeMode ?? 'repo' as const,
    };

    try {
      const { stdout, stderr } = await execFileAsync('bash', ['-c', request.command], {
        cwd: request.cwd,
        timeout: timeoutMs,
        maxBuffer,
        env,
      });
      return { ok: true, stdout, stderr, exitCode: 0, sandbox: sandboxMeta };
    } catch (err: any) {
      const timedOut = err?.killed && err?.signal === 'SIGTERM';
      const message = timedOut ? `Command timeout after ${timeoutMs}ms` : (err?.stderr?.slice?.(0, 500) ?? err?.message ?? 'Command failed');
      return {
        ok: false,
        stdout: err?.stdout ?? '',
        stderr: err?.stderr ?? '',
        exitCode: typeof err?.code === 'number' ? err.code : 1,
        error: message,
        sandbox: sandboxMeta,
      };
    }
  }
}
