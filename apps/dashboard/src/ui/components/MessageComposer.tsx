interface MessageComposerProps {
  onReview?: () => void;
}

export default function MessageComposer({ onReview }: MessageComposerProps) {
  return (
    <form aria-label="Message composer" style={styles.composer}>
      <textarea aria-label="Message hidecode" placeholder="Ask hidecode to fix, explain, review, or plan…" style={styles.textarea} />
      <div style={styles.actions}>
        {['Run', 'Plan', 'Review', 'Stop'].map((action) => (
          <button
            key={action}
            type="button"
            onClick={action === 'Review' ? onReview : undefined}
            style={action === 'Run' ? styles.primaryButton : styles.secondaryButton}
          >
            {action}
          </button>
        ))}
      </div>
    </form>
  );
}

const styles = {
  composer: {
    border: '1px solid #293248',
    borderRadius: '18px',
    background: '#0e1422',
    padding: '12px',
  },
  textarea: {
    width: '100%',
    minHeight: '76px',
    resize: 'vertical',
    boxSizing: 'border-box',
    border: 0,
    background: 'transparent',
    color: '#f8fafc',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  primaryButton: {
    border: 0,
    borderRadius: '10px',
    background: '#f8fafc',
    color: '#080a10',
    padding: '8px 12px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #303a52',
    borderRadius: '10px',
    background: '#121a2b',
    color: '#cbd5e1',
    padding: '8px 12px',
    fontWeight: 800,
    cursor: 'pointer',
  },
} satisfies Record<string, React.CSSProperties>;
