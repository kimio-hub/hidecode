export type RunProgressStatus = 'preview' | 'running' | 'completed' | 'failed';

interface RunProgressProps {
  status?: RunProgressStatus;
  meta?: string;
}

const statusDetails: Record<RunProgressStatus, { value: number; meta: string; badgeStyle: React.CSSProperties }> = {
  preview: {
    value: 0,
    meta: 'Runtime output will appear after Run.',
    badgeStyle: {
      color: '#fde68a',
      background: '#713f12',
    },
  },
  running: {
    value: 50,
    meta: 'Running scripted backend session…',
    badgeStyle: {
      color: '#bfdbfe',
      background: '#1e3a8a',
    },
  },
  completed: {
    value: 100,
    meta: 'Run completed.',
    badgeStyle: {
      color: '#bbf7d0',
      background: '#14532d',
    },
  },
  failed: {
    value: 0,
    meta: 'Run failed.',
    badgeStyle: {
      color: '#fecaca',
      background: '#7f1d1d',
    },
  },
};

export default function RunProgress({ status = 'preview', meta }: RunProgressProps) {
  const details = statusDetails[status];
  const value = details.value;

  return (
    <section aria-label="Run progress" style={styles.card}>
      <div style={styles.header}>
        <span>Active coding session</span>
        <span style={{ ...styles.badge, ...details.badgeStyle }}>{status}</span>
      </div>
      <div aria-valuemax={100} aria-valuemin={0} aria-valuenow={value} role="progressbar" style={styles.bar}>
        <div style={{ ...styles.fill, width: `${value}%` }} />
      </div>
      <div style={styles.meta}>{meta ?? details.meta}</div>
    </section>
  );
}

const styles = {
  card: {
    border: '1px solid #25304a',
    borderRadius: '16px',
    background: '#0c1220',
    padding: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#f8fafc',
    fontSize: '13px',
    fontWeight: 800,
    marginBottom: '10px',
  },
  badge: {
    borderRadius: '999px',
    padding: '2px 7px',
    fontSize: '10px',
  },
  bar: {
    height: '8px',
    borderRadius: '999px',
    background: '#1e293b',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    background: 'linear-gradient(90deg, #60a5fa, #8b5cf6)',
  },
  meta: {
    color: '#8f98ad',
    fontSize: '12px',
    marginTop: '9px',
  },
} satisfies Record<string, React.CSSProperties>;
