import { createServer as createNodeServer } from 'node:http';
import { Readable } from 'node:stream';

import { createServer } from './server.js';

const rootDir = process.env.WORLD_HARNESS_ROOT ?? process.cwd();
const port = Number.parseInt(process.env.PORT ?? '8787', 10);
const app = createServer({ rootDir });

const nodeServer = createNodeServer(async (incoming, outgoing) => {
  try {
    const url = `http://${incoming.headers.host ?? `127.0.0.1:${port}`}${incoming.url ?? '/'}`;
    const request = new Request(url, {
      method: incoming.method,
      headers: incoming.headers as HeadersInit,
      body: incoming.method === 'GET' || incoming.method === 'HEAD' ? undefined : Readable.toWeb(incoming) as BodyInit,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });
    const response = await app.fetch(request);

    outgoing.statusCode = response.status;
    response.headers.forEach((value, key) => outgoing.setHeader(key, value));
    if (response.body) {
      await Readable.fromWeb(response.body as import('node:stream/web').ReadableStream).pipe(outgoing);
    } else {
      outgoing.end();
    }
  } catch (error) {
    outgoing.statusCode = 500;
    outgoing.setHeader('content-type', 'application/json; charset=utf-8');
    outgoing.end(JSON.stringify({ error: 'internal_server_error', message: (error as Error).message }));
  }
});

nodeServer.listen(port, '127.0.0.1', () => {
  console.log(`world-harness server listening on http://127.0.0.1:${port}`);
  console.log(`storage root: ${rootDir}`);
});
