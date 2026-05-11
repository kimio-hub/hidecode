import type { ReviewCommandPreview } from '../../data/review';

interface CommandPreviewProps {
  command: ReviewCommandPreview;
}

const riskColors: Record<ReviewCommandPreview['risk'], string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#fb923c',
  critical: '#f87171',
};

export default function CommandPreview({ command }: CommandPreviewProps) {
  return (
    <section aria-label="Command preview" style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Command preview</div>
          <code style={styles.command}>{command.command}</code>
        </div>
        <span style={{ ...styles.badge, color: riskColors[command.risk], borderColor: `${riskColors[command.risk]}55` }}>{command.risk}</span>
      </div>
      <div style={styles.cwd}>{command.cwd}</div>
      <p style={styles.explanation}>{command.explanation}</p>
    </section>
  );
}

const styles = {
  card: {
    border: '1px solid #23283a',
    borderRadius: '14px',
    background: '#0d111b',
    padding: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  eyebrow: {
    color: '#8b93a7',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '7px',
  },
  command: {
    color: '#e5e7eb',
    fontSize: '12px',
    overflowWrap: 'anywhere',
  },
  cwd: {
    marginTop: '10px',
    color: '#7f879a',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
  explanation: {
    margin: '10px 0 0',
    color: '#aab2c8',
    fontSize: '12px',
    lineHeight: 1.55,
  },
  badge: {
    border: '1px solid',
    borderRadius: '999px',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
} satisfies Record<string, React.CSSProperties>;
