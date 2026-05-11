export default function LeftSidebar() {
  return (
    <div style={styles.container}>
      <section>
        <div style={styles.label}>Project</div>
        <div style={styles.projectCard}>No project selected</div>
      </section>
      <section>
        <div style={styles.label}>Sessions</div>
        <div style={styles.empty}>Open a folder to start a hidecode session.</div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: '16px',
    display: 'grid',
    gap: '18px',
  },
  label: {
    color: '#6f778b',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  projectCard: {
    border: '1px solid #242a3a',
    borderRadius: '12px',
    padding: '12px',
    color: '#d8dcef',
    background: '#0f1320',
    fontSize: '13px',
  },
  empty: {
    color: '#7f879a',
    fontSize: '12px',
    lineHeight: 1.5,
  },
} satisfies Record<string, React.CSSProperties>;
