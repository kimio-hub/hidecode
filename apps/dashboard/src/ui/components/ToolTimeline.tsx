import type { TraceEvent } from '../../data/mock';
import { Terminal, FileText, Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Props {
  events: TraceEvent[];
}

export default function ToolTimeline({ events }: Props) {
  const toolPairs = buildToolPairs(events);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {toolPairs.map((pair, i) => (
        <ToolEntry key={i} call={pair.call} result={pair.result} index={i + 1} />
      ))}
      {toolPairs.length === 0 && (
        <div style={{ color: '#555', fontSize: '12px', padding: '8px' }}>No tool calls yet</div>
      )}
    </div>
  );
}

function buildToolPairs(events: TraceEvent[]) {
  const pairs: { call: TraceEvent; result?: TraceEvent }[] = [];
  const calls = events.filter(e => e.type === 'tool.call');
  const results = events.filter(e => e.type === 'tool.result');

  for (const call of calls) {
    const matchingResult = results.find(r => {
      const callTime = new Date(call.timestamp).getTime();
      const resultTime = new Date(r.timestamp).getTime();
      return resultTime > callTime && resultTime - callTime < 10000;
    });
    pairs.push({ call, result: matchingResult });
  }
  return pairs;
}

function ToolEntry({ call, result, index }: { call: TraceEvent; result?: TraceEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const data = call.data as Record<string, unknown>;
  const toolName = data.name as string;
  const risk = data.risk as string;
  const resultData = result?.data as Record<string, unknown> | undefined;
  const ok = resultData?.ok as boolean | undefined;
  const summary = resultData?.summary as string | undefined;
  const duration = resultData?.durationMs as number | undefined;

  const riskColor = risk === 'critical' ? '#f87171' : risk === 'high' ? '#fb923c' : risk === 'medium' ? '#facc15' : '#4ade80';
  const statusColor = ok === false ? '#f87171' : ok === true ? '#4ade80' : '#555';

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
        <ToolIcon name={toolName} />
        <span style={{ fontWeight: 600, color: '#e0e0e8' }}>{toolName}</span>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: riskColor, flexShrink: 0,
        }} />
        <div style={{ flex: 1 }} />
        {duration !== undefined && (
          <span style={{ color: '#555', fontVariantNumeric: 'tabular-nums' }}>{duration}ms</span>
        )}
        {ok !== undefined && (
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
          {summary && <div style={{ color: '#aaa', marginBottom: '6px' }}>{summary}</div>}
          {data.input && (
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
          {resultData?.stdout && (
            <div style={{
              background: '#0a0a12',
              borderRadius: '4px',
              padding: '8px',
              marginTop: '6px',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: ok === false ? '#f87171' : '#4ade80',
              whiteSpace: 'pre-wrap',
              maxHeight: '120px',
              overflow: 'auto',
            }}>
              {resultData.stdout as string}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
