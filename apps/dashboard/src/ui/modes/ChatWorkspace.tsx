import type { TraceEvent } from '../../data/loader';
import type { BackendSession } from '../../data/backend';
import type { ChatMessage } from '../../data/chat';
import ChatPanel from '../components/ChatPanel';

interface ChatWorkspaceProps {
  onReview?: () => void;
  onEventsChange?: (events: TraceEvent[]) => void;
  onSessionChange?: (session: BackendSession) => void;
  projectPath?: string;
  initialMessages?: ChatMessage[];
  initialSession?: BackendSession | null;
}

export default function ChatWorkspace({ onReview, onEventsChange, onSessionChange, projectPath, initialMessages, initialSession }: ChatWorkspaceProps) {
  return <ChatPanel initialMessages={initialMessages} initialSession={initialSession} onEventsChange={onEventsChange} onReview={onReview} onSessionChange={onSessionChange} projectPath={projectPath} />;
}
