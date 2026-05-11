import type { JsonStore } from '../storage.js';
import { jsonResponse } from '../http.js';

export async function handleHealth(store: JsonStore): Promise<Response> {
  return jsonResponse({
    ok: true,
    service: 'world-harness-server',
    storage: {
      rootDir: store.rootDir,
      stateDir: store.stateDir,
      sessionsDir: store.sessionsDir,
    },
  });
}
