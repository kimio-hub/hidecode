export default function RightInspector() {
  return (
    <div style={styles.container}>
      <div style={styles.tabs}>
        <span style={styles.activeTab}>Plan</span>
        <span style={styles.tab}>Tools</span>
        <span style={styles.tab}>Diff</span>
        <span style={styles.tab}>Approvals</span>
        <span style={styles.tab}>Trace</span>
      </div>
      <div style={styles.panel}>
        <div style={styles.title}>Run inspector</div>
        <div style={styles.copy}>Trace, tool calls, diff, and approvals will appear here as the session runs.</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '14px',
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '12px',
  },
  activeTab: {
    borderRadius: '999px',
    background: '#1c2435',
    color: '#ffffff',
    padding: '6px 9px',
    fontSize: '11px',
    fontWeight: 700,
  },
  tab: {
    borderRadius: '999px',
    color: '#8f98ad',
    border: '1px solid #242b3d',
    padding: '6px 9px',
    fontSize: '11px',
  },
  panel: {
    border: '1px solid #242b3d',
    borderRadius: '14px',
    background: '#101421',
    padding: '14px',
  },
  title: {
    color: '#f6f7fb',
    fontWeight: 700,
    fontSize: '13px',
    marginBottom: '6px',
  },
  copy: {
    color: '#8d96aa',
    fontSize: '12px',
    lineHeight: 1.5,
  },
} satisfies Record<string, React.CSSProperties>;
