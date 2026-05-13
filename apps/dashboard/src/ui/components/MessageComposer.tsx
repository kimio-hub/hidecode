import { useEffect, useState } from 'react';

interface MessageComposerProps {
  onPlan?: () => void;
  onReview?: () => void;
  onStop?: () => void;
  onSubmitMessage?: (content: string) => Promise<void> | void;
  disabled?: boolean;
  initialContent?: string;
}

export default function MessageComposer({ onPlan, onReview, onStop, onSubmitMessage, disabled = false, initialContent = '' }: MessageComposerProps) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    await onSubmitMessage?.(trimmed);
    setContent('');
  }

  return (
    <form aria-label="Message composer" onSubmit={handleSubmit} style={styles.composer}>
      <textarea
        aria-label="Message hidecode"
        disabled={disabled}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Ask hidecode to fix, explain, review, or plan…"
        style={styles.textarea}
        value={content}
      />
      <div style={styles.actions}>
        <button disabled={disabled} type="submit" style={styles.primaryButton}>
          Run
        </button>
        <button type="button" onClick={onPlan} style={styles.secondaryButton}>
          Plan
        </button>
        <button type="button" onClick={onReview} style={styles.secondaryButton}>
          Review
        </button>
        <button type="button" onClick={onStop} style={styles.secondaryButton}>
          Stop
        </button>
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
