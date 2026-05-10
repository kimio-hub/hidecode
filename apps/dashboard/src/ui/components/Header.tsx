import type { TraceEvent, RunMeta } from '../../data/mock';
import { Cpu, Zap, Clock, DollarSign, Hash } from 'lucide-react';

interface Props {
  run: RunMeta;
  events: TraceEvent[];
  sourceLabel?: string;
}

export default function Header({ run, events, sourceLabel = 'Mock' }: Props) {
  const completed = events.filter(e => e.type === 'task.completed').length > 0;
  const failed = events.filter(e => e.type === 'task.failed').length > 0;
  const statusColor = completed ? '#4ade80' : failed ? '#f87171' : '#facc15';
  const statusText = completed ? 'Completed' : failed ? 'Failed' : 'Running';

  const startTime = events[0]?.timestamp;
  const endTime = events[events.length - 1]?.timestamp;
  const duration = startTime && endTime
    ? ((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000).toFixed(1) + 's'
    : '—';

  // Extract budget info from events
  const budgetEvent = events.find(e => e.data?.budget);
  const budgetStr = budgetEvent?.data?.budget as string | undefined;
  const toolCount = events.filter(e => e.type === 'tool.started' || e.type === 'tool.call').length;
  const securityFindings = events.filter(e => e.type === 'security.finding').length;

  return (
    <header style={{
      gridArea: 'header',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '0 20px',
      background: '#0f0f17',
      borderBottom: '1px solid #1e1e2e',
      fontSize: '13px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={16} color="#a78bfa" />
        <span style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>World Harness</span>
      </div>
      <div style={{ width: '1px', height: '24px', background: '#1e1e2e' }} />
      <span style={{ color: '#aaa' }}>{run.taskId}</span>
      <span style={{ color: '#555', fontSize: '11px' }}>{run.runId}</span>
      <div style={{ width: '1px', height: '24px', background: '#1e1e2e' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor }} />
        <span style={{ color: statusColor }}>{statusText}</span>
      </div>
      <div style={{ flex: 1 }} />

      {/* Budget info */}
      <div style={{
        background: '#111827',
        borderRadius: '999px',
        padding: '4px 10px',
        fontSize: '11px',
        color: '#93c5fd',
        border: '1px solid #1d4ed8',
        maxWidth: '220px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }} title={sourceLabel}>
        {sourceLabel}
      </div>

      {securityFindings > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171', fontSize: '12px' }}>
          <span>⚠ {securityFindings} findings</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888' }}>
        <Hash size={14} />
        <span>{toolCount} tools</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888' }}>
        <Cpu size={14} />
        <span>{run.model.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888' }}>
        <Clock size={14} />
        <span>{duration}</span>
      </div>

      {budgetStr && (
        <div style={{
          background: '#1a1a2e',
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '11px',
          color: '#888',
          border: '1px solid #2d2d44',
          maxWidth: '300px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }} title={budgetStr}>
          {budgetStr}
        </div>
      )}

      <div style={{
        background: '#1a1a2e',
        borderRadius: '6px',
        padding: '4px 10px',
        fontSize: '12px',
        color: '#a78bfa',
        border: '1px solid #2d2d44',
      }}>
        v{run.harnessVersion}
      </div>
    </header>
  );
}
