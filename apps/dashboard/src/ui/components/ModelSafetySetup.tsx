import { modelSafetySetup } from '../../data/projects';

export default function ModelSafetySetup() {
  return (
    <section aria-label="Model and safety setup" style={styles.panel}>
      <div style={styles.heading}>Model & Safety</div>
      <div style={styles.list}>
        {modelSafetySetup.map((item) => (
          <div key={item.id} style={styles.row}>
            <span style={styles.label}>{item.label}</span>
            <span style={{ ...styles.value, ...toneStyles[item.tone] }}>{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles = {
  panel: {
    border: '1px solid #22293a',
    borderRadius: '18px',
    background: '#0c101b',
    padding: '18px',
  },
  heading: {
    color: '#f6f7fb',
    fontSize: '13px',
    fontWeight: 800,
    marginBottom: '12px',
  },
  list: {
    display: 'grid',
    gap: '10px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    color: '#aab2c8',
    fontSize: '12px',
  },
  label: {
    color: '#7f879a',
  },
  value: {
    borderRadius: '999px',
    padding: '5px 8px',
    border: '1px solid transparent',
    fontWeight: 700,
  },
} satisfies Record<string, React.CSSProperties>;

const toneStyles = {
  ready: { color: '#bbf7d0', borderColor: '#14532d', background: '#052e16' },
  guarded: { color: '#fde68a', borderColor: '#713f12', background: '#351f05' },
  offline: { color: '#cbd5e1', borderColor: '#334155', background: '#111827' },
} satisfies Record<string, React.CSSProperties>;
