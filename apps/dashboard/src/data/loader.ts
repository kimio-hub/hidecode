// ─── Trace Loader ──────────────────────────────────────────────
// Loads trace.jsonl files and run manifests from the .runs directory.

export interface TraceEvent {
  eventId: string;
  runId: string;
  taskId: string;
  type: string;
  timestamp: string;
  actor: string;
  data: Record<string, unknown>;
}

export interface RunManifest {
  runId: string;
  taskId: string;
  harnessVersion: string;
  model: { provider: string; name: string };
  summary: string;
  steps?: number;
  durationMs?: number;
  budget?: Record<string, unknown>;
  artifacts?: Record<string, string>;
}

// ─── Load from file (Node.js / CLI context) ────────────────────
export async function loadTraceFromFile(filePath: string): Promise<TraceEvent[]> {
  const { readFile } = await import('node:fs/promises');
  const content = await readFile(filePath, 'utf8');
  return content
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as TraceEvent);
}

export async function loadRunManifest(filePath: string): Promise<RunManifest> {
  const { readFile } = await import('node:fs/promises');
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content) as RunManifest;
}

export async function loadRunDir(runDir: string): Promise<{ events: TraceEvent[]; manifest: RunManifest }> {
  const { join } = await import('node:path');
  const events = await loadTraceFromFile(join(runDir, 'trace.jsonl'));
  const manifest = await loadRunManifest(join(runDir, 'run.json'));
  return { events, manifest };
}

// ─── Load from URL (browser context) ───────────────────────────
export async function loadTraceFromUrl(url: string): Promise<TraceEvent[]> {
  const res = await fetch(url);
  const text = await res.text();
  return text
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as TraceEvent);
}

export async function loadRunFromUrl(baseUrl: string): Promise<{ events: TraceEvent[]; manifest: RunManifest }> {
  const [events, manifest] = await Promise.all([
    loadTraceFromUrl(`${baseUrl}/trace.jsonl`),
    fetch(`${baseUrl}/run.json`).then(r => r.json() as Promise<RunManifest>),
  ]);
  return { events, manifest };
}

// ─── Event utilities ───────────────────────────────────────────
export function filterEvents(events: TraceEvent[], ...types: string[]): TraceEvent[] {
  return events.filter(e => types.includes(e.type));
}

export function getToolCalls(events: TraceEvent[]): { call: TraceEvent; result?: TraceEvent }[] {
  const calls = events.filter(e => e.type === 'tool.requested' || e.type === 'tool.call');
  const results = events.filter(e => e.type === 'tool.finished' || e.type === 'tool.result');

  return calls.map(call => {
    const callTime = new Date(call.timestamp).getTime();
    const result = results.find(r => {
      const t = new Date(r.timestamp).getTime();
      return t > callTime && t - callTime < 30000;
    });
    return { call, result };
  });
}

export function getSecurityFindings(events: TraceEvent[]): TraceEvent[] {
  return events.filter(e => e.type === 'security.finding');
}

export function getPolicyDecisions(events: TraceEvent[]): TraceEvent[] {
  return events.filter(e => e.type === 'policy.decided');
}

export function getSnapshots(events: TraceEvent[]): TraceEvent[] {
  return events.filter(e => e.type === 'snapshot.created');
}

export function calculateDuration(events: TraceEvent[]): number {
  if (events.length < 2) return 0;
  const start = new Date(events[0].timestamp).getTime();
  const end = new Date(events[events.length - 1].timestamp).getTime();
  return end - start;
}
