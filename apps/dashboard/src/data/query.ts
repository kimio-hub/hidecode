export type DashboardSource =
  | { kind: 'mock' }
  | { kind: 'run-url'; baseUrl: string }
  | { kind: 'explicit-url'; traceUrl: string; manifestUrl?: string };

export function parseDashboardSource(search: string): DashboardSource {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const run = params.get('run')?.trim();
  if (run) return { kind: 'run-url', baseUrl: run };

  const trace = params.get('trace')?.trim();
  if (trace) {
    const manifest = params.get('manifest')?.trim() || params.get('runJson')?.trim() || undefined;
    return { kind: 'explicit-url', traceUrl: trace, manifestUrl: manifest };
  }

  return { kind: 'mock' };
}

export function describeDashboardSource(source: DashboardSource): string {
  switch (source.kind) {
    case 'mock':
      return 'Mock';
    case 'run-url':
      return `Run URL: ${source.baseUrl}`;
    case 'explicit-url':
      return source.manifestUrl ? 'Trace URL + Manifest' : 'Trace URL';
  }
}
