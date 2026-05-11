export interface ServerOptions {
  rootDir: string;
}

export interface AppServer {
  fetch(request: Request): Promise<Response>;
}

export { createServer } from './server.js';
export type { ProjectRecord } from './routes/projects.js';
export type { SessionEvent, SessionRecord, SessionMessage } from './routes/sessions.js';
