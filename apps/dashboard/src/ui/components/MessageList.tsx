import type { ChatMessage } from '../../data/chat';
import AgentPlanCard from './AgentPlanCard';

type MessageListProps = {
  messages: ChatMessage[];
};

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div aria-label="Chat messages" style={styles.list}>
      {messages.map((message) => (
        <article key={message.id} style={message.role === 'user' ? styles.userMessage : styles.message}>
          <div style={styles.role}>{message.role}</div>
          <div style={styles.content}>{message.content}</div>
          {message.plan ? <AgentPlanCard plan={message.plan} /> : null}
        </article>
      ))}
    </div>
  );
}

const baseMessage: React.CSSProperties = {
  border: '1px solid #222b40',
  borderRadius: '16px',
  padding: '14px',
  maxWidth: '780px',
};

const styles = {
  list: {
    display: 'grid',
    gap: '14px',
  },
  message: {
    ...baseMessage,
    background: '#0f1524',
  },
  userMessage: {
    ...baseMessage,
    background: '#162033',
    justifySelf: 'end',
  },
  role: {
    color: '#7f8aa3',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  content: {
    color: '#e8ecf8',
    fontSize: '14px',
    lineHeight: 1.6,
  },
} satisfies Record<string, React.CSSProperties>;
