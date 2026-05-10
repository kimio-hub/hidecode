// ─── Trace Loader ──────────────────────────────────────────────
// Loads trace.jsonl files and run manifests from the .runs directory or browser URLs.

export interface TraceEvent {
  eventId: string;
  runId: string;
  taskId?: string;
  type: string;
  timestamp: string;
  actor: string;
  data: Record<string, unknown>;
}

export interface RunMeta {
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

export type RunManifest = RunMeta;

// ─── Load from file (Node.js / CLI context) ────────────────────
export async function loadTraceFromFile(filePath: string): Promise<TraceEvent[]> {
  const { readFile } = await import('node:fs/promises');
  const content = await readFile(filePath, 'utf8');
  return parseTraceJsonl(content);
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
  if (!res.ok) throw new Error(`Failed to load trace ${url}: HTTP ${res.status}`);
  const text = await res.text();
  return parseTraceJsonl(text);
}

export async function loadManifestFromUrl(url: string): Promise<RunManifest> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load manifest ${url}: HTTP ${res.status}`);
  return res.json() as Promise<RunManifest>;
}

export async function loadRunFromUrl(baseUrl: string): Promise<{ events: TraceEvent[]; manifest: RunManifest }> {
  const normalized = baseUrl.replace(/\/$/, '');
  const [events, manifest] = await Promise.all([
    loadTraceFromUrl(`${normalized}/trace.jsonl`),
    loadManifestFromUrl(`${normalized}/run.json`),
  ]);
  return { events, manifest };
}

export function parseTraceJsonl(content: string): TraceEvent[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as TraceEvent);
}

export function synthesizeManifest(events: TraceEvent[], source = 'trace'): RunManifest {
  const first = events[0];
  const last = events[events.length - 1];
  return {
    runId: first?.runId ?? 'unknown-run',
    taskId: first?.taskId ?? last?.taskId ?? 'unknown-task',
    harnessVersion: 'unknown',
    model: { provider: 'unknown', name: 'unknown' },
    summary: `Loaded ${events.length} events from ${source}`,
    steps: events.filter(e => e.type.startsWith('tool.') || e.type.startsWith('model.')).length,
    durationMs: events.length > 1 ? calculateDuration(events) : 0,
  };
}

// ─── Event utilities ───────────────────────────────────────────
export function filterEvents(events: TraceEvent[], ...types: string[]): TraceEvent[] {
  return events.filter(e => types.includes(e.type));
}

export function getToolCalls(events: TraceEvent[]): { call: TraceEvent; result?: TraceEvent }[] {
  const calls = events.filter(e => e.type === 'tool.requested' || e.type === 'tool.started' || e.type === 'tool.call');
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
  return events.filter(e => e.type === 'policy.decided' || e.type === 'policy.decision');
}

export function getSnapshots(events: TraceEvent[]): TraceEvent[] {
  return events.filter(e => e.type === 'snapshot.created');
}

export function calculateDuration(events: TraceEvent[]): number {
  if (events.length < 2) return 0;
  const start = new Date(events[0].timestamp).getTime();
  const end = new Date(events[events.length - 1].timestamp).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, end - start);
}
