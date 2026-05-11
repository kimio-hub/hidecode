import { mockChatMessages } from '../../data/chat';
import MessageComposer from './MessageComposer';
import MessageList from './MessageList';
import RunProgress from './RunProgress';

interface ChatPanelProps {
  onReview?: () => void;
}

export default function ChatPanel({ onReview }: ChatPanelProps) {
  return (
    <section aria-label="Chat workspace" style={styles.panel}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>hidecode session</div>
          <h1 style={styles.title}>Chat with your coding agent</h1>
        </div>
        <RunProgress />
      </div>
      <MessageList messages={mockChatMessages} />
      <MessageComposer onReview={onReview} />
    </section>
  );
}

const styles = {
  panel: {
    minHeight: '100%',
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    gap: '18px',
    padding: '24px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 360px)',
    gap: '18px',
    alignItems: 'start',
  },
  eyebrow: {
    color: '#60a5fa',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  title: {
    color: '#ffffff',
    fontSize: '32px',
    lineHeight: 1.1,
    margin: 0,
  },
} satisfies Record<string, React.CSSProperties>;
