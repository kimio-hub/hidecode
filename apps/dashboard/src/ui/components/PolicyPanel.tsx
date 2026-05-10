import type { TraceEvent } from '../../data/mock';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface Props {
  events: TraceEvent[];
}

export default function PolicyPanel({ events }: Props) {
  const policyEvents = events.filter(e => e.type === 'policy.decision');

  if (policyEvents.length === 0) {
    return (
      <div style={{ color: '#555', fontSize: '12px', padding: '8px' }}>
        No policy decisions recorded
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {policyEvents.map(evt => {
        const data = evt.data as Record<string, unknown>;
        const decision = data.decision as string;
        const reason = data.reason as string;
        const risk = data.risk as string;
        const ruleId = data.ruleId as string | undefined;

        const config = getDecisionConfig(decision);
        const riskConfig = getRiskConfig(risk);

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
              <div style={{
                marginLeft: 'auto',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: riskConfig.bg,
                color: riskConfig.color,
                fontWeight: 600,
              }}>
                {risk}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>{reason}</div>
            {ruleId && (
              <div style={{ fontSize: '10px', color: '#555', marginTop: '2px', fontFamily: 'monospace' }}>
                rule: {ruleId}
              </div>
            )}
          </div>
        );
      })}
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
        icon: <Shield size={14} color="#facc15" />,
        color: '#facc15',
        bg: 'rgba(250,204,21,0.06)',
        border: 'rgba(250,204,21,0.15)',
      };
  }
}

function getRiskConfig(risk: string) {
  switch (risk) {
    case 'critical': return { color: '#f87171', bg: 'rgba(248,113,113,0.15)' };
    case 'high': return { color: '#fb923c', bg: 'rgba(251,146,60,0.15)' };
    case 'medium': return { color: '#facc15', bg: 'rgba(250,204,21,0.15)' };
    default: return { color: '#4ade80', bg: 'rgba(74,222,128,0.15)' };
  }
}
