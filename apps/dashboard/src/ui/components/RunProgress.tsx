export default function RunProgress() {
  return (
    <section aria-label="Run progress" style={styles.card}>
      <div style={styles.header}>
        <span>Active coding session</span>
        <span style={styles.badge}>preview</span>
      </div>
      <div aria-valuemax={100} aria-valuemin={0} aria-valuenow={42} role="progressbar" style={styles.bar}>
        <div style={styles.fill} />
      </div>
      <div style={styles.meta}>Planning and tool execution will stream here from the local runtime.</div>
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
    color: '#fde68a',
    background: '#713f12',
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
    width: '42%',
    height: '100%',
    background: 'linear-gradient(90deg, #60a5fa, #8b5cf6)',
  },
  meta: {
    color: '#8f98ad',
    fontSize: '12px',
    marginTop: '9px',
  },
} satisfies Record<string, React.CSSProperties>;
