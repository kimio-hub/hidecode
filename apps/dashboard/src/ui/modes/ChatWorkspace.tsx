import type { TraceEvent } from '../../data/loader';
import type { BackendSession } from '../../data/backend';
import ChatPanel from '../components/ChatPanel';

interface ChatWorkspaceProps {
  onReview?: () => void;
  onEventsChange?: (events: TraceEvent[]) => void;
  onSessionChange?: (session: BackendSession) => void;
  projectPath?: string;
}

export default function ChatWorkspace({ onReview, onEventsChange, onSessionChange, projectPath }: ChatWorkspaceProps) {
  return <ChatPanel onEventsChange={onEventsChange} onReview={onReview} onSessionChange={onSessionChange} projectPath={projectPath} />;
}
