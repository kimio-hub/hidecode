import { quickStartActions } from '../../data/projects';

export default function QuickStartPanel() {
  return (
    <section aria-label="Quick start" style={styles.panel}>
      <div style={styles.heading}>Quick Start</div>
      <div style={styles.grid}>
        {quickStartActions.map((action) => (
          <button key={action.id} type="button" style={styles.card}>
            <span style={styles.title}>{action.title}</span>
            <span style={styles.description}>{action.description}</span>
          </button>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
  },
  card: {
    display: 'grid',
    gap: '8px',
    textAlign: 'left',
    border: '1px solid #232b3d',
    borderRadius: '14px',
    background: '#111725',
    padding: '13px',
    cursor: 'pointer',
  },
  title: {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 800,
  },
  description: {
    color: '#8f98ad',
    fontSize: '12px',
    lineHeight: 1.45,
  },
} satisfies Record<string, React.CSSProperties>;
