export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body, null, 2), { ...init, headers });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return {};
  }

  const value = await request.json();
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function notFound(pathname: string): Response {
  return jsonResponse({ error: 'not_found', path: pathname }, { status: 404 });
}

export function methodNotAllowed(method: string): Response {
  return jsonResponse({ error: 'method_not_allowed', method }, { status: 405 });
}
