import type { TraceEvent } from '../../data/mock';
import { FileDiff } from 'lucide-react';
import { useState } from 'react';
import { nestedRecord, stringField, toolNameForEvent } from '../../data/trace-normalize';

interface Props {
  events: TraceEvent[];
}

export default function DiffPanel({ events }: Props) {
  const diffEvents = events.filter(e => e.type === 'diff.applied' || e.type === 'file.changed');
  const writeEvents = events.filter(e => {
    if (e.type !== 'tool.call') return false;
    return toolNameForEvent(e) === 'write_file';
  });

  const allChanges = [...diffEvents, ...writeEvents];

  if (allChanges.length === 0) {
    return (
      <div style={{ color: '#555', fontSize: '12px', padding: '8px' }}>
        No file changes recorded
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {allChanges.map((evt, i) => (
        <DiffEntry key={evt.eventId} event={evt} index={i} />
      ))}
    </div>
  );
}

function DiffEntry({ event, index }: { event: TraceEvent; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const data = event.data as Record<string, unknown>;
  const input = nestedRecord(data.input);
  const files = filesForData(data);
  const diff = stringField(data.diff);
  const content = stringField(input?.content);

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
        <FileDiff size={14} color="#a78bfa" />
        <span style={{ fontWeight: 600 }}>
          {files.length > 0 ? files.join(', ') : 'unknown'}
        </span>
        <span style={{ marginLeft: 'auto', color: '#555', fontSize: '11px' }}>
          {event.type}
        </span>
      </div>

      {expanded && (
        <div style={{
          padding: '0 12px 12px',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: 1.6,
        }}>
          {(diff || content || '').split('\n').map((line, i) => {
            const color = line.startsWith('+') ? '#4ade80'
              : line.startsWith('-') ? '#f87171'
              : '#888';
            const bg = line.startsWith('+') ? 'rgba(74,222,128,0.06)'
              : line.startsWith('-') ? 'rgba(248,113,113,0.06)'
              : 'transparent';

            return (
              <div key={i} style={{
                color,
                background: bg,
                padding: '1px 6px',
                borderRadius: '2px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {line || '\u00A0'}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function filesForData(data: Record<string, unknown>): string[] {
  const input = nestedRecord(data.input);
  const candidates = data.files ?? data.changedFiles ?? input?.files;
  if (Array.isArray(candidates)) return candidates.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  const path = stringField(data.path) ?? stringField(input?.path);
  return path ? [path] : [];
}
