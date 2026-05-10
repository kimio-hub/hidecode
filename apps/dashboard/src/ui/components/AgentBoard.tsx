import type { AgentBoardItem } from '../../data/agents';

interface Props {
  items: AgentBoardItem[];
}

export default function AgentBoard({ items }: Props) {
  if (items.length === 0) {
    return <div style={{ color: '#71717a', fontSize: '12px' }}>No agent activity</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <FutureAction label="Assign" />
        <FutureAction label="Handoff" />
        <FutureAction label="Unblock" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        {items.map(item => (
          <article key={item.id} style={{ border: '1px solid #23233a', borderRadius: '12px', padding: '10px', background: '#09090f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 750 }}>{item.name}</div>
                {item.taskId && <div style={{ color: '#71717a', fontSize: '11px', marginTop: '3px' }}>{item.taskId}</div>}
              </div>
              <span style={{ border: '1px solid ' + statusColor(item.status), color: statusColor(item.status), borderRadius: '999px', padding: '2px 7px', fontSize: '10px', textTransform: 'uppercase' }}>
                {item.status}
              </span>
            </div>

            <div style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '10px', lineHeight: 1.45 }}>{item.focus}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '10px' }}>
              <MiniStat label="Events" value={String(item.eventCount)} />
              <MiniStat label="Tools" value={String(item.toolCount)} />
              <MiniStat label="Latest" value={item.lastEventType} />
            </div>

            {item.blockers.length > 0 && (
              <ListBlock label="Blockers" values={item.blockers} color="#f87171" />
            )}
            {item.handoffs.length > 0 && (
              <ListBlock label="Handoffs" values={item.handoffs} color="#facc15" />
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function FutureAction({ label }: { label: string }) {
  return (
    <button disabled style={{ border: '1px solid #2d2d44', borderRadius: '999px', padding: '5px 10px', color: '#71717a', background: '#11111a', fontSize: '11px', cursor: 'not-allowed' }}>
      {label}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid #1e1e2e', borderRadius: '8px', padding: '6px', minWidth: 0 }}>
      <div style={{ color: '#71717a', fontSize: '9px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: '#d4d4d8', fontSize: '11px', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

function ListBlock({ label, values, color }: { label: string; values: string[]; color: string }) {
  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ color, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#a1a1aa', fontSize: '11px' }}>
        {values.map(value => <li key={value}>{value}</li>)}
      </ul>
    </div>
  );
}

function statusColor(status: AgentBoardItem['status']): string {
  switch (status) {
    case 'active': return '#4ade80';
    case 'idle': return '#93c5fd';
    case 'blocked': return '#f87171';
    case 'handoff': return '#facc15';
  }
}
