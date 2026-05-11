import type { TraceEvent } from '../../data/mock';
import { Terminal, FileText, Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Props {
  events: TraceEvent[];
}

interface ToolPair {
  call: TraceEvent;
  result?: TraceEvent;
}

interface NormalizedToolDetails {
  toolName: string;
  risk?: string;
  ok?: boolean;
  summary?: string;
  duration?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
  sandboxSummary?: string;
}

export default function ToolTimeline({ events }: Props) {
  const toolPairs = buildToolPairs(events);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {toolPairs.map((pair, i) => (
        <ToolEntry key={pair.call.eventId || i} call={pair.call} result={pair.result} index={i + 1} />
      ))}
      {toolPairs.length === 0 && (
        <div style={{ color: '#555', fontSize: '12px', padding: '8px' }}>No tool calls yet</div>
      )}
    </div>
  );
}

function buildToolPairs(events: TraceEvent[]): ToolPair[] {
  const pairs: ToolPair[] = [];
  const calls = events.filter(e => e.type === 'tool.call' || e.type === 'tool.requested');
  const results = events.filter(e => e.type === 'tool.result' || e.type === 'tool.finished');
  const usedResults = new Set<string>();

  for (const call of calls) {
    const matchingResult = results.find(result => {
      if (usedResults.has(result.eventId)) return false;

      const callToolName = explicitToolNameFor(call);
      const resultToolName = explicitToolNameFor(result);
      if (callToolName && resultToolName && callToolName !== resultToolName) return false;

      const callTime = parseTimestampMs(call.timestamp);
      const resultTime = parseTimestampMs(result.timestamp);
      if (callTime === null || resultTime === null) return true;
      return resultTime >= callTime && resultTime - callTime < 60000;
    });

    if (matchingResult) usedResults.add(matchingResult.eventId);
    pairs.push({ call, result: matchingResult });
  }

  return pairs;
}

function ToolEntry({ call, result, index }: { call: TraceEvent; result?: TraceEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const data = call.data as Record<string, unknown>;
  const details = normalizeToolDetails(call, result);

  const riskColor = details.risk === 'critical' ? '#f87171' : details.risk === 'high' ? '#fb923c' : details.risk === 'medium' ? '#facc15' : '#4ade80';
  const statusColor = details.ok === false ? '#f87171' : details.ok === true ? '#4ade80' : '#555';

  return (
    <div style={{
      background: '#0f0f17',
      borderRadius: '6px',
      border: '1px solid #1e1e2e',
      overflow: 'hidden',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        {expanded ? <ChevronDown size={14} color="#555" /> : <ChevronRight size={14} color="#555" />}
        <span style={{ color: '#555', fontVariantNumeric: 'tabular-nums', minWidth: '20px' }}>#{index}</span>
        <ToolIcon name={details.toolName} />
        <span style={{ fontWeight: 600, color: '#e0e0e8' }}>{details.toolName}</span>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: riskColor, flexShrink: 0,
        }} />
        <div style={{ flex: 1 }} />
        {details.duration !== undefined && (
          <span style={{ color: '#555', fontVariantNumeric: 'tabular-nums' }}>{details.duration}ms</span>
        )}
        {details.ok !== undefined && (
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: statusColor,
          }} />
        )}
      </div>

      {expanded && (
        <div style={{
          padding: '8px 12px 12px 44px',
          borderTop: '1px solid #1a1a2a',
          fontSize: '11px',
        }}>
          {details.summary && <div style={{ color: '#aaa', marginBottom: '6px' }}>{details.summary}</div>}
          {details.error && <div style={{ color: '#f87171', marginBottom: '6px' }}>{details.error}</div>}
          {details.sandboxSummary && <div style={{ color: '#fbbf24', marginBottom: '6px' }}>{details.sandboxSummary}</div>}
          {data.input !== undefined && (
            <div style={{
              background: '#0a0a12',
              borderRadius: '4px',
              padding: '8px',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#888',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {JSON.stringify(data.input, null, 2)}
            </div>
          )}
          {(details.stdout || details.stderr) && (
            <div style={{
              background: '#0a0a12',
              borderRadius: '4px',
              padding: '8px',
              marginTop: '6px',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: details.ok === false ? '#f87171' : '#4ade80',
              whiteSpace: 'pre-wrap',
              maxHeight: '120px',
              overflow: 'auto',
            }}>
              {[details.stdout, details.stderr].filter(Boolean).join('\n')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function normalizeToolDetails(call: TraceEvent, result?: TraceEvent): NormalizedToolDetails {
  const callData = call.data as Record<string, unknown>;
  const resultData = result?.data as Record<string, unknown> | undefined;
  const output = typeof resultData?.output === 'object' && resultData.output !== null ? resultData.output as Record<string, unknown> : {};
  const sandbox = typeof resultData?.sandbox === 'object' && resultData.sandbox !== null ? resultData.sandbox as Record<string, unknown> : undefined;

  return {
    toolName: toolNameFor(call) || toolNameFor(result) || 'tool',
    risk: riskFor(callData),
    ok: typeof resultData?.ok === 'boolean' ? resultData.ok : undefined,
    summary: stringField(resultData?.summary),
    duration: numberField(resultData?.durationMs),
    stdout: stringField(resultData?.stdout) ?? stringField(output.stdout),
    stderr: stringField(resultData?.stderr) ?? stringField(output.stderr),
    error: stringField(resultData?.error),
    sandboxSummary: sandbox ? sandboxSummary(sandbox) : undefined,
  };
}

function toolNameFor(event?: TraceEvent): string {
  return explicitToolNameFor(event) ?? 'tool';
}

function explicitToolNameFor(event?: TraceEvent): string | undefined {
  const data = event?.data as Record<string, unknown> | undefined;
  return stringField(data?.name) ?? stringField(data?.tool);
}

function riskFor(data: Record<string, unknown>): string | undefined {
  const risk = stringField(data.risk);
  if (risk) return risk;
  const risks = Array.isArray(data.risks) ? data.risks.filter((item): item is string => typeof item === 'string') : [];
  if (risks.some(item => /critical/i.test(item))) return 'critical';
  if (risks.some(item => /write|network|shell|exec|delete|danger/i.test(item))) return 'high';
  return risks.length > 0 ? 'medium' : undefined;
}

function sandboxSummary(sandbox: Record<string, unknown>): string {
  const mode = stringField(sandbox.mode);
  const writeMode = stringField(sandbox.writeMode);
  const blocked = typeof sandbox.blocked === 'boolean' ? `blocked=${sandbox.blocked}` : undefined;
  return [mode ? `mode=${mode}` : undefined, writeMode ? `writeMode=${writeMode}` : undefined, blocked].filter(Boolean).join(' · ');
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberField(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function parseTimestampMs(timestamp: string): number | null {
  const value = new Date(timestamp).getTime();
  return Number.isFinite(value) ? value : null;
}

function ToolIcon({ name }: { name: string }) {
  switch (name) {
    case 'terminal':
      return <Terminal size={14} color="#60a5fa" />;
    case 'read_file':
    case 'write_file':
      return <FileText size={14} color="#a78bfa" />;
    default:
      return <Wrench size={14} color="#888" />;
  }
}
