import type { TraceEvent } from '../../data/loader';
import ChatPanel from '../components/ChatPanel';

interface ChatWorkspaceProps {
  onReview?: () => void;
  onEventsChange?: (events: TraceEvent[]) => void;
}

export default function ChatWorkspace({ onReview, onEventsChange }: ChatWorkspaceProps) {
  return <ChatPanel onEventsChange={onEventsChange} onReview={onReview} />;
}
