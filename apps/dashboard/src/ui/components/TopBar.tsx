export default function TopBar() {
  return (
    <header aria-label="hidecode top bar" style={styles.header}>
      <div style={styles.brandGroup}>
        <div style={styles.logo}>h</div>
        <div>
          <div style={styles.brand}>hidecode</div>
          <div style={styles.subtitle}>GUI-first coding workspace</div>
        </div>
      </div>
      <div style={styles.actions}>
        <span style={styles.pill}>Local workspace</span>
        <span style={styles.pill}>Guarded runtime</span>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    background: 'rgba(8, 10, 16, 0.96)',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    width: '28px',
    height: '28px',
    borderRadius: '9px',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
    color: '#fff',
    fontWeight: 800,
    textTransform: 'uppercase',
    boxShadow: '0 8px 30px rgba(139, 92, 246, 0.28)',
  },
  brand: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.01em',
  },
  subtitle: {
    color: '#7d8497',
    fontSize: '11px',
    marginTop: '1px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  pill: {
    border: '1px solid #252b3c',
    borderRadius: '999px',
    color: '#aab2c8',
    background: '#0d111b',
    padding: '5px 9px',
    fontSize: '11px',
  },
} satisfies Record<string, React.CSSProperties>;
