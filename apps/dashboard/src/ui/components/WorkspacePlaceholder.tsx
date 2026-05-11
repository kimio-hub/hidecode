export default function WorkspacePlaceholder() {
  return (
    <div style={styles.container}>
      <div style={styles.eyebrow}>hidecode app shell</div>
      <h1 style={styles.title}>Chat workspace coming next</h1>
      <p style={styles.copy}>
        This shell is the foundation for Home, Chat, Active Run, and Review modes while preserving trace replay loading.
      </p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100%',
    display: 'grid',
    alignContent: 'center',
    justifyItems: 'center',
    padding: '48px',
    textAlign: 'center',
  },
  eyebrow: {
    color: '#60a5fa',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '12px',
  },
  title: {
    color: '#ffffff',
    fontSize: '34px',
    margin: 0,
  },
  copy: {
    color: '#929bb0',
    fontSize: '14px',
    lineHeight: 1.7,
    maxWidth: '560px',
  },
} satisfies Record<string, React.CSSProperties>;
