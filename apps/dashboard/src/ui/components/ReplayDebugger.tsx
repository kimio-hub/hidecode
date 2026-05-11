import type { ReplayStep } from '../../data/replay';

interface Props {
  steps: ReplayStep[];
}

const categoryTone: Record<ReplayStep['category'], string> = {
  task: '#60a5fa',
  model: '#a78bfa',
  tool: '#34d399',
  policy: '#facc15',
  security: '#fb7185',
  sandbox: '#f97316',
  diff: '#38bdf8',
  other: '#94a3b8',
};

export default function ReplayDebugger({ steps }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div>
          <div style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 750 }}>Replay Debug</div>
          <div style={{ color: '#71717a', fontSize: '11px', marginTop: '3px' }}>{steps.length} chronological trace steps</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <ActionButton label="Replay" />
          <ActionButton label="Fork" />
          <ActionButton label="Save Eval" />
        </div>
      </div>

      {steps.length === 0 ? (
        <div style={{ border: '1px dashed #27273a', borderRadius: '12px', padding: '14px', color: '#71717a', fontSize: '12px' }}>
          No replay steps
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflow: 'auto' }}>
          {steps.map(step => (
            <div key={step.id} style={{
              display: 'grid',
              gridTemplateColumns: '44px 88px minmax(0, 1fr) 68px',
              gap: '10px',
              alignItems: 'start',
              border: '1px solid #23233a',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.025)',
              padding: '10px',
            }}>
              <div style={{ color: '#71717a', fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>#{step.index}</div>
              <div>
                <div style={{ color: categoryTone[step.category], fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  {step.category}
                </div>
                <div style={{ color: '#71717a', fontSize: '10px', marginTop: '4px' }}>{step.actor}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 650 }}>{step.title}</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', overflowWrap: 'anywhere' }}>{step.summary}</div>
              </div>
              <div style={{ color: '#a1a1aa', fontSize: '11px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                +{formatElapsed(step.elapsedMs)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button
      disabled
      style={{
        border: '1px solid #2d2d44',
        borderRadius: '999px',
        background: 'rgba(255,255,255,0.03)',
        color: '#71717a',
        fontSize: '11px',
        padding: '5px 9px',
        cursor: 'not-allowed',
      }}
    >
      {label}
    </button>
  );
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
