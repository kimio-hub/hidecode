import { useEffect, useRef, useState } from 'react';
import { mockChatMessages, type ChatMessage } from '../../data/chat';
import type { TraceEvent } from '../../data/loader';
import {
  getBackendBaseUrl,
  createBackendSession,
  listBackendSessionEvents,
  postBackendMessage,
  sessionEventsToTraceEvents,
  sessionMessagesToChatMessages,
  type BackendCreateMessageResponse,
  type BackendSession,
} from '../../data/backend';
import MessageComposer from './MessageComposer';
import MessageList from './MessageList';
import RunProgress, { type RunProgressStatus } from './RunProgress';

interface ChatPanelProps {
  onReview?: () => void;
  onEventsChange?: (events: TraceEvent[]) => void;
  onSessionChange?: (session: BackendSession) => void;
  projectPath?: string;
  initialMessages?: ChatMessage[];
  initialSession?: BackendSession | null;
  initialDraft?: string;
}

export default function ChatPanel({ onReview, onEventsChange, onSessionChange, projectPath = '', initialMessages, initialSession, initialDraft = '' }: ChatPanelProps) {
  const [session, setSession] = useState<BackendSession | null>(initialSession ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages?.length ? initialMessages : mockChatMessages);
  const [status, setStatus] = useState('Ready');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stopPollingRef = useRef<() => void>(() => {});
  const mountedRef = useRef(true);
  const submitTokenRef = useRef(0);

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages.length ? initialMessages : mockChatMessages);
  }, [initialMessages]);

  useEffect(() => {
    setSession(initialSession ?? null);
  }, [initialSession]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      submitTokenRef.current += 1;
      stopPollingRef.current();
    };
  }, []);

  async function handleSubmitMessage(content: string): Promise<boolean> {
    const submitToken = submitTokenRef.current + 1;
    submitTokenRef.current = submitToken;
    const isCurrentSubmit = () => mountedRef.current && submitTokenRef.current === submitToken;
    setIsSubmitting(true);
    setStatus('Running scripted backend session…');
    let stopPolling = () => {};
    try {
      const baseUrl = getBackendBaseUrl();
      const activeSession = session ?? await createBackendSession(projectPath, baseUrl);
      if (!isCurrentSubmit()) return false;
      setSession(activeSession);
      onSessionChange?.(activeSession);
      stopPollingRef.current();
      stopPolling = startSessionEventPolling(activeSession.id, baseUrl, onEventsChange);
      stopPollingRef.current = stopPolling;
      const result = await postBackendMessage(activeSession.id, content, baseUrl);
      if (!isCurrentSubmit()) return false;
      const updatedSession = sessionWithReturnedRun(result);
      setSession(updatedSession);
      onSessionChange?.(updatedSession);
      setMessages(sessionMessagesToChatMessages(updatedSession.messages));
      onEventsChange?.(sessionEventsToTraceEvents(updatedSession.events));
      const summary = result.run?.summary ?? 'Session updated';
      setStatus(summary);
      return true;
    } catch (error) {
      if (!isCurrentSubmit()) return false;
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      return false;
    } finally {
      stopPolling();
      if (stopPollingRef.current === stopPolling) stopPollingRef.current = () => {};
      if (isCurrentSubmit()) setIsSubmitting(false);
    }
  }

  return (
    <section aria-label="Chat workspace" style={styles.panel}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>hidecode session</div>
          <h1 style={styles.title}>Chat with your coding agent</h1>
        </div>
        <RunProgress meta={getRunProgressMeta(status)} status={getRunProgressStatus(status, isSubmitting)} />
      </div>
      <div aria-live="polite" style={styles.status}>{status}</div>
      <MessageList messages={messages} />
      <MessageComposer
        disabled={isSubmitting}
        initialContent={initialDraft}
        onPlan={() => setStatus('Plan preview is not wired yet.')}
        onReview={onReview}
        onStop={() => setStatus('Stop is not wired yet.')}
        onSubmitMessage={handleSubmitMessage}
      />
    </section>
  );
}

function startSessionEventPolling(sessionId: string, baseUrl: string, onEventsChange?: (events: TraceEvent[]) => void): () => void {
  if (!onEventsChange) return () => {};
  let stopped = false;
  let timeoutId: number | undefined;
  const poll = async () => {
    try {
      const events = await listBackendSessionEvents(sessionId, baseUrl);
      if (!stopped) onEventsChange(sessionEventsToTraceEvents(events));
    } catch {
      // Live updates are best-effort; final POST response still publishes the authoritative event snapshot.
    } finally {
      if (!stopped) timeoutId = window.setTimeout(() => { void poll(); }, 1000);
    }
  };
  void poll();
  return () => {
    stopped = true;
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  };
}

function sessionWithReturnedRun(result: BackendCreateMessageResponse): BackendSession {
  if (!result.run) return result.session;
  if (result.session.runs?.some((run) => run.summary === result.run?.summary && run.tracePath === result.run?.tracePath)) {
    return result.session;
  }

  return {
    ...result.session,
    runs: [
      ...(result.session.runs ?? []),
      {
        ...result.run,
        id: `run-${result.session.runs?.length ?? 0}`,
        createdAt: result.message.createdAt,
      },
    ],
  };
}

function getRunProgressStatus(status: string, isSubmitting: boolean): RunProgressStatus {
  if (isSubmitting) return 'running';
  if (status === 'Ready' || status.endsWith('not wired yet.')) return 'preview';
  if (status.startsWith('Failed to ') || status.toLowerCase().includes('error')) return 'failed';
  return 'completed';
}

function getRunProgressMeta(status: string): string | undefined {
  if (status === 'Ready' || status.endsWith('not wired yet.')) return undefined;
  return status;
}

const styles = {
  panel: {
    minHeight: '100%',
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr auto',
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
  status: {
    color: '#93c5fd',
    fontSize: '12px',
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
