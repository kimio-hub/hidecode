import type { TraceEvent } from '../../data/mock';
import { Circle, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface Props {
  events: TraceEvent[];
}

export default function TaskGraph({ events }: Props) {
  const taskEvents = events.filter(e =>
    ['task.created', 'task.completed', 'task.failed', 'model.requested', 'model.completed'].includes(e.type)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {taskEvents.map((evt, i) => (
        <EventNode key={evt.eventId} event={evt} isLast={i === taskEvents.length - 1} />
      ))}
    </div>
  );
}

function EventNode({ event, isLast }: { event: TraceEvent; isLast: boolean }) {
  const config = getEventConfig(event.type);
  const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
      {/* Timeline line */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '20px',
        flexShrink: 0,
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: config.color,
          border: `2px solid ${config.color}`,
          zIndex: 1,
        }} />
        {!isLast && (
          <div style={{
            width: '2px',
            flex: 1,
            background: '#1e1e2e',
            minHeight: '24px',
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '4px 8px',
        borderRadius: '6px',
        marginBottom: '2px',
        background: config.bg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {config.icon}
          <span style={{ fontSize: '12px', fontWeight: 600, color: config.color }}>
            {config.label}
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
          {time} · {event.actor}
        </div>
      </div>
    </div>
  );
}

function getEventConfig(type: string) {
  switch (type) {
    case 'task.created':
      return {
        icon: <Circle size={12} color="#60a5fa" />,
        color: '#60a5fa',
        label: 'Task Created',
        bg: 'rgba(96,165,250,0.08)',
      };
    case 'task.completed':
      return {
        icon: <CheckCircle2 size={12} color="#4ade80" />,
        color: '#4ade80',
        label: 'Task Completed',
        bg: 'rgba(74,222,128,0.08)',
      };
    case 'task.failed':
      return {
        icon: <AlertCircle size={12} color="#f87171" />,
        color: '#f87171',
        label: 'Task Failed',
        bg: 'rgba(248,113,113,0.08)',
      };
    case 'model.requested':
      return {
        icon: <Clock size={12} color="#a78bfa" />,
        color: '#a78bfa',
        label: 'Model Requested',
        bg: 'rgba(167,139,250,0.08)',
      };
    case 'model.completed':
      return {
        icon: <CheckCircle2 size={12} color="#c084fc" />,
        color: '#c084fc',
        label: 'Model Completed',
        bg: 'rgba(192,132,252,0.08)',
      };
    default:
      return {
        icon: <Circle size={12} color="#555" />,
        color: '#555',
        label: type,
        bg: 'transparent',
      };
  }
}
