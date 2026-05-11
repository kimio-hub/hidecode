import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface JsonStoreOptions {
  rootDir: string;
}

export class UnsafeSessionIdError extends Error {
  constructor(sessionId: string) {
    super(`Invalid session id: ${sessionId}`);
    this.name = 'UnsafeSessionIdError';
  }
}

export class JsonStore {
  readonly rootDir: string;
  readonly stateDir: string;
  readonly sessionsDir: string;

  constructor(options: JsonStoreOptions) {
    this.rootDir = options.rootDir;
    this.stateDir = join(options.rootDir, '.world-harness');
    this.sessionsDir = join(this.stateDir, 'sessions');
  }

  projectFile(): string {
    return join(this.stateDir, 'projects.json');
  }

  sessionFile(sessionId: string): string {
    assertSafeSessionId(sessionId);
    return join(this.sessionsDir, `${sessionId}.json`);
  }

  async readJson<T>(file: string, fallback: T): Promise<T> {
    try {
      return JSON.parse(await readFile(file, 'utf8')) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return fallback;
      }
      throw error;
    }
  }

  async writeJson(file: string, value: unknown): Promise<void> {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  }
}

function assertSafeSessionId(sessionId: string): void {
  if (!/^sess_[a-z0-9]+_[a-z0-9]+$/.test(sessionId)) {
    throw new UnsafeSessionIdError(sessionId);
  }
}
