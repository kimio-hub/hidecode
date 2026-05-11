import ChatPanel from '../components/ChatPanel';

interface ChatWorkspaceProps {
  onReview?: () => void;
}

export default function ChatWorkspace({ onReview }: ChatWorkspaceProps) {
  return <ChatPanel onReview={onReview} />;
}
