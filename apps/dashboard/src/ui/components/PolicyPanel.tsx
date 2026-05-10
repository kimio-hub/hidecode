import type { TraceEvent } from '../../data/mock';
import { ShieldAlert, ShieldCheck, AlertTriangle, Eye } from 'lucide-react';
import { useState } from 'react';

interface Props {
  events: TraceEvent[];
}

export default function PolicyPanel({ events }: Props) {
  const policyEvents = events.filter(e => e.type === 'policy.decided' || e.type === 'policy.decision');
  const securityEvents = events.filter(e => e.type === 'security.finding');

  if (policyEvents.length === 0 && securityEvents.length === 0) {
    return (
      <div style={{ color: '#555', fontSize: '12px', padding: '8px' }}>
        No policy/security events recorded
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {securityEvents.length > 0 && <SecuritySection events={securityEvents} />}
      {policyEvents.map(evt => {
        const data = evt.data as Record<string, unknown>;
        const decision = (data.decision as string) ?? 'unknown';
        const reason = data.reason as string;
        const matchedRule = data.matchedRule as string | undefined;

        const config = getDecisionConfig(decision);

        return (
          <div key={evt.eventId} style={{
            background: config.bg,
            borderRadius: '6px',
            padding: '8px 10px',
            border: `1px solid ${config.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {config.icon}
              <span style={{ fontSize: '12px', fontWeight: 600, color: config.color }}>
                {decision.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>{reason}</div>
            {matchedRule && (
              <div style={{ fontSize: '10px', color: '#555', marginTop: '2px', fontFamily: 'monospace' }}>
                rule: {matchedRule}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SecuritySection({ events }: { events: TraceEvent[] }) {
  const [expanded, setExpanded] = useState(true);
  const findings = events.flatMap(e => ((e.data as Record<string, unknown>).findings as any[]) ?? []);
  const critical = findings.filter(f => f.severity === 'critical').length;
  const high = findings.filter(f => f.severity === 'high').length;

  return (
    <div style={{
      background: 'rgba(248,113,113,0.06)',
      borderRadius: '6px',
      padding: '8px 10px',
      border: '1px solid rgba(248,113,113,0.15)',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
      >
        <ShieldAlert size={14} color="#f87171" />
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#f87171' }}>
          Security Findings
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#888' }}>
          {critical > 0 && <span style={{ color: '#f87171' }}>{critical} critical</span>}
          {critical > 0 && high > 0 && ' · '}
          {high > 0 && <span style={{ color: '#fb923c' }}>{high} high</span>}
        </span>
      </div>
      {expanded && findings.map((f, i) => (
        <div key={i} style={{ fontSize: '11px', color: '#aaa', marginTop: '4px', paddingLeft: '20px' }}>
          <span style={{
            color: f.severity === 'critical' ? '#f87171' : f.severity === 'high' ? '#fb923c' : '#facc15',
            fontWeight: 600,
          }}>
            [{f.severity}]
          </span>{' '}
          {f.message}
          {f.redacted && <span style={{ color: '#555' }}> → {f.redacted}</span>}
        </div>
      ))}
    </div>
  );
}

function getDecisionConfig(decision: string) {
  switch (decision) {
    case 'allow':
      return {
        icon: <ShieldCheck size={14} color="#4ade80" />,
        color: '#4ade80',
        bg: 'rgba(74,222,128,0.06)',
        border: 'rgba(74,222,128,0.15)',
      };
    case 'deny':
      return {
        icon: <ShieldAlert size={14} color="#f87171" />,
        color: '#f87171',
        bg: 'rgba(248,113,113,0.06)',
        border: 'rgba(248,113,113,0.15)',
      };
    default:
      return {
        icon: <AlertTriangle size={14} color="#facc15" />,
        color: '#facc15',
        bg: 'rgba(250,204,21,0.06)',
        border: 'rgba(250,204,21,0.15)',
      };
  }
}
