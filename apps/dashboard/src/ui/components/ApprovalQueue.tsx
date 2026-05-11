import type { ApprovalQueueItem } from '../../data/approvals';
import { actionReasonAttributes, buildApprovalActionIntent } from '../../data/actions';

interface Props {
  items: ApprovalQueueItem[];
}

const riskColors: Record<ApprovalQueueItem['risk'], string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#fb923c',
  critical: '#f87171',
  unknown: '#71717a',
};

const statusColors: Record<ApprovalQueueItem['status'], string> = {
  pending: '#facc15',
  allowed: '#4ade80',
  denied: '#f87171',
  informational: '#93c5fd',
};

export default function ApprovalQueue({ items }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#888', fontSize: '11px' }}>{items.length} items</span>
        <span style={{ color: '#555', fontSize: '10px' }}>read-only</span>
      </div>

      {items.length === 0 ? (
        <div style={{ color: '#555', fontSize: '12px', padding: '8px' }}>No approval items</div>
      ) : (
        items.map(item => <ApprovalQueueCard key={item.id} item={item} />)
      )}
    </div>
  );
}

function ApprovalQueueCard({ item }: { item: ApprovalQueueItem }) {
  const approveIntent = buildApprovalActionIntent('approve', item.id);
  const rejectIntent = buildApprovalActionIntent('reject', item.id);

  return (
    <article style={{
      border: '1px solid #23233a',
      borderRadius: '10px',
      background: 'rgba(255,255,255,0.025)',
      padding: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#e5e7eb', fontSize: '12px', fontWeight: 700 }}>{item.title}</div>
          <div style={{ color: '#8b8b95', fontSize: '11px', marginTop: '5px', lineHeight: 1.45, overflowWrap: 'anywhere' }}>
            {item.summary}
          </div>
        </div>
        <Badge label={item.risk} color={riskColors[item.risk]} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Badge label={item.status} color={statusColors[item.status]} />
          <span style={{ color: '#555', fontSize: '10px' }}>{new Date(item.timestamp).toLocaleTimeString()}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <DisabledAction label={approveIntent.label} reasonAttributes={actionReasonAttributes(approveIntent)} />
          <DisabledAction label={rejectIntent.label} reasonAttributes={actionReasonAttributes(rejectIntent)} />
        </div>
      </div>
    </article>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      color,
      border: `1px solid ${color}44`,
      background: `${color}14`,
      borderRadius: '999px',
      padding: '2px 7px',
      fontSize: '10px',
      fontWeight: 700,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function DisabledAction({ label, reasonAttributes }: { label: string; reasonAttributes: ReturnType<typeof actionReasonAttributes> }) {
  return (
    <button disabled {...reasonAttributes} style={{
      border: '1px solid #2d2d44',
      borderRadius: '8px',
      background: '#11111a',
      color: '#666',
      padding: '4px 8px',
      fontSize: '10px',
      cursor: 'not-allowed',
    }}>
      {label}
    </button>
  );
}
