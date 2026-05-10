import type { TraceEvent } from '../../data/mock';
import { FileText, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  events: TraceEvent[];
}

export default function EvidencePanel({ events }: Props) {
  const evidence = events.filter(e =>
    e.type === 'tool.result' || e.type === 'model.completed'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {evidence.map(evt => {
        const data = evt.data as Record<string, unknown>;
        const ok = data.ok as boolean | undefined;
        const summary = data.summary as string | undefined;

        return (
          <div key={evt.eventId} style={{
            background: '#0f0f17',
            borderRadius: '6px',
            padding: '8px 10px',
            border: '1px solid #1e1e2e',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              {ok === false ? <AlertCircle size={12} color="#f87171" /> :
               ok === true ? <CheckCircle2 size={12} color="#4ade80" /> :
               <FileText size={12} color="#888" />}
              <span style={{ fontSize: '11px', color: '#aaa' }}>
                {evt.type}
              </span>
              <span style={{ fontSize: '10px', color: '#555', marginLeft: 'auto' }}>
                {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            {summary && (
              <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.4 }}>{summary}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
