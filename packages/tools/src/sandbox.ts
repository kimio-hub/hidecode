import { execFile } from 'node:child_process';
import { platform } from 'node:os';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);

const isWindows = platform() === 'win32';

function shellFor(command: string): { file: string; args: string[] } {
  return isWindows
    ? { file: process.env.ComSpec ?? 'cmd.exe', args: ['/d', '/s', '/c', command] }
    : { file: 'bash', args: ['-c', command] };
}

function timeoutMessage(err: any, timeoutMs: number): string | undefined {
  if (err?.killed || err?.signal === 'SIGTERM' || err?.code === 'ETIMEDOUT') return `Command timeout after ${timeoutMs}ms`;
  return undefined;
}

function normalizeShellSyntax(command: string): string {
  let result = '';
  let quote: 'single' | 'double' | undefined;
  let escaped = false;
  let previousNonSpace = '';

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index]!;
    if (escaped) {
      result += ' ';
      escaped = false;
      continue;
    }
    if (char === '\\') {
      result += ' ';
      escaped = true;
      continue;
    }
    if (quote === 'single') {
      if (char === "'") {
        quote = undefined;
        continue;
      }
      result += previousNonSpace === '>' || /\w/.test(previousNonSpace) ? char : ' ';
      continue;
    }
    if (quote === 'double') {
      if (char === '"') {
        quote = undefined;
        continue;
      }
      result += previousNonSpace === '>' || /\w/.test(previousNonSpace) ? char : ' ';
      continue;
    }
    if (char === "'") {
      const nextChar = command[index + 1] ?? '';
      quote = 'single';
      if (/\w/.test(previousNonSpace) && /\w/.test(nextChar)) continue;
      result += previousNonSpace === '>' ? 'q' : ' ';
      continue;
    }
    if (char === '"') {
      const nextChar = command[index + 1] ?? '';
      quote = 'double';
      if (/\w/.test(previousNonSpace) && /\w/.test(nextChar)) continue;
      result += previousNonSpace === '>' ? 'q' : ' ';
      continue;
    }
    result += char;
    if (!/\s/.test(char)) previousNonSpace = char;
  }

  return result;
}

function commandViolatesReadonly(command: string): boolean {
  const normalized = normalizeShellSyntax(command).toLowerCase();
  const boundary = String.raw`(^|[\s|;&($` + '`' + String.raw`])`;
  const redirection = /(^|[^\\\s])\d?>\s*[^\s>&|;]|\s\d?>\s*(?:[\w./-]|q[\w./-])/;
  return [
    redirection,
    new RegExp(`${boundary}(tee|touch|mkdir|rm|rmdir|mv|cp|chmod|chown|ln|install|rsync)\\b`),
    new RegExp(`${boundary}git\\s+(checkout|switch|reset|clean|apply|am|merge|rebase|commit|push|pull|add|restore|stash|tag|branch|worktree)\\b`),
    new RegExp(`${boundary}(npm|pnpm|yarn)\\s+(install|i|add|remove|rm|uninstall|update|upgrade|ci|link|unlink)\\b`),
    new RegExp(`${boundary}(python|python3|node|perl|ruby)\\s+(-c|-e|--eval)\\b`),
  ].some(pattern => pattern.test(normalized));
}

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
      if (sandboxMeta.writeMode === 'readonly' && commandViolatesReadonly(request.command)) {
        return {
          ok: false,
          stdout: '',
          stderr: '',
          exitCode: 1,
          error: 'Readonly sandbox blocked a command that appears to write to the workspace',
          sandbox: sandboxMeta,
        };
      }

      const shell = shellFor(request.command);
      const { stdout, stderr } = await execFileAsync(shell.file, shell.args, {
        cwd: request.cwd,
        timeout: timeoutMs,
        maxBuffer,
        env,
        windowsHide: true,
      });
      return { ok: true, stdout, stderr, exitCode: 0, sandbox: sandboxMeta };
    } catch (err: any) {
      const message = timeoutMessage(err, timeoutMs) ?? (err?.stderr?.slice?.(0, 500) ?? err?.message ?? 'Command failed');
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
