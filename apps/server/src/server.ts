import type { AppServer, ServerOptions } from './index.js';
import { methodNotAllowed, notFound } from './http.js';
import { handleHealth } from './routes/health.js';
import { handleListProjects, handleOpenProject } from './routes/projects.js';
import {
  handleCreateMessage,
  handleCreateSession,
  handleGetSession,
  handleListEvents,
  handleListSessions,
  handleStreamEvents,
} from './routes/sessions.js';
import { JsonStore } from './storage.js';

export function createServer(options: ServerOptions): AppServer {
  const store = new JsonStore(options);

  return {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const pathname = normalizePath(url.pathname);

      if (pathname === '/api/health') {
        if (request.method !== 'GET') return methodNotAllowed(request.method);
        return handleHealth(store);
      }

      if (pathname === '/api/projects') {
        if (request.method !== 'GET') return methodNotAllowed(request.method);
        return handleListProjects(store);
      }

      if (pathname === '/api/projects/open') {
        if (request.method !== 'POST') return methodNotAllowed(request.method);
        return handleOpenProject(store, request);
      }

      if (pathname === '/api/sessions') {
        if (request.method === 'GET') return handleListSessions(store);
        if (request.method === 'POST') return handleCreateSession(store, request);
        return methodNotAllowed(request.method);
      }

      const sessionMatch = /^\/api\/sessions\/([^/]+)(?:\/(messages|events|stream))?$/.exec(pathname);
      if (sessionMatch) {
        const [, sessionId, child] = sessionMatch;
        if (!sessionId) return notFound(pathname);

        if (!child) {
          if (request.method !== 'GET') return methodNotAllowed(request.method);
          return handleGetSession(store, sessionId);
        }

        if (child === 'messages') {
          if (request.method !== 'POST') return methodNotAllowed(request.method);
          return handleCreateMessage(store, sessionId, request);
        }

        if (child === 'events') {
          if (request.method !== 'GET') return methodNotAllowed(request.method);
          return handleListEvents(store, sessionId);
        }

        if (child === 'stream') {
          if (request.method !== 'GET') return methodNotAllowed(request.method);
          return handleStreamEvents(store, sessionId);
        }
      }

      return notFound(pathname);
    },
  };
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}
