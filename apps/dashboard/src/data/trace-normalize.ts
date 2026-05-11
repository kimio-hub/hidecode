import type { TraceEvent } from './loader';

export type NormalizedRisk = 'low' | 'medium' | 'high' | 'critical';

const severityOrder: Record<NormalizedRisk, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function numberField(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function nestedRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

export function toolNameForEvent(event: TraceEvent | undefined, fallback?: string): string | undefined {
  const data = event ? nestedRecord(event.data) : undefined;
  return stringField(data?.name) ?? stringField(data?.tool) ?? fallback;
}

export function riskForEvent(event: TraceEvent | undefined): NormalizedRisk | undefined {
  return event ? riskForData(event.data) : undefined;
}

export function riskForData(data: Record<string, unknown> | undefined): NormalizedRisk | undefined {
  if (!data) return undefined;

  const explicit = normalizeRiskToken(data.risk);
  if (explicit) return explicit;

  const risks = Array.isArray(data.risks) ? data.risks : [];
  const normalized = risks
    .map(riskFromCapability)
    .filter((risk): risk is NormalizedRisk => risk !== undefined);

  return highestRisk(normalized);
}

function normalizeRiskToken(value: unknown): NormalizedRisk | undefined {
  const risk = stringField(value)?.toLowerCase();
  if (risk === 'low' || risk === 'medium' || risk === 'high' || risk === 'critical') return risk;
  return undefined;
}

function riskFromCapability(value: unknown): NormalizedRisk | undefined {
  const risk = stringField(value)?.toLowerCase();
  if (!risk) return undefined;
  if (risk.includes('critical')) return 'critical';
  if (/high|write|network|shell|exec|execute|delete|danger|git/.test(risk)) return 'high';
  if (risk.includes('medium')) return 'medium';
  if (/low|read|view|list|inspect/.test(risk)) return 'low';
  return 'medium';
}

function highestRisk(risks: NormalizedRisk[]): NormalizedRisk | undefined {
  return risks.reduce<NormalizedRisk | undefined>((highest, risk) => {
    if (!highest) return risk;
    return severityOrder[risk] > severityOrder[highest] ? risk : highest;
  }, undefined);
}

export interface NormalizedOutput {
  stdout?: string;
  stderr?: string;
  summary?: string;
  ok?: boolean;
}

function outputString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function outputForData(data: Record<string, unknown> | undefined): NormalizedOutput {
  const nestedOutput = nestedRecord(data?.output);
  return {
    stdout: outputString(data?.stdout) ?? outputString(nestedOutput?.stdout),
    stderr: outputString(data?.stderr) ?? outputString(nestedOutput?.stderr),
    summary: stringField(data?.summary) ?? stringField(nestedOutput?.summary),
    ok: typeof data?.ok === 'boolean' ? data.ok : typeof nestedOutput?.ok === 'boolean' ? nestedOutput.ok : undefined,
  };
}

export function sandboxForData(data: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  return nestedRecord(data?.sandbox);
}

export function sandboxSummaryForData(data: Record<string, unknown> | undefined): string | undefined {
  const sandbox = sandboxForData(data);
  if (!sandbox) return undefined;

  const mode = stringField(sandbox.mode);
  const writeMode = stringField(sandbox.writeMode);
  const blocked = typeof sandbox.blocked === 'boolean' ? `blocked=${sandbox.blocked}` : undefined;
  const summary = [mode ? `mode=${mode}` : undefined, writeMode ? `writeMode=${writeMode}` : undefined, blocked]
    .filter(Boolean)
    .join(' · ');
  return summary || undefined;
}

export function stringifySummary(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
