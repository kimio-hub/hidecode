import { useEffect, useMemo, useState } from 'react';
import { MOCK_EVENTS, MOCK_RUN } from '../data/mock';
import { parseHidecodeAppState } from '../data/appMode';
import {
  loadManifestFromUrl,
  loadRunFromUrl,
  loadTraceFromUrl,
  synthesizeManifest,
  type RunMeta,
  type TraceEvent,
} from '../data/loader';
import { describeDashboardSource, parseDashboardSource, type DashboardSource } from '../data/query';
import AppShell from './AppShell';
import Dashboard from './Dashboard';
import BottomStatusBar from './components/BottomStatusBar';
import LeftSidebar from './components/LeftSidebar';
import RightInspector from './components/RightInspector';
import HomePage from './modes/HomePage';
import ChatWorkspace from './modes/ChatWorkspace';
import ReviewWorkspace from './modes/ReviewWorkspace';
import type { BackendSession } from '../data/backend';
import { getBackendBaseUrl } from '../data/backend';
import type { RecentProject } from '../data/projects';
import { openBackendProject } from '../data/projects-backend';

type LoadState =
  | { status: 'ready'; events: TraceEvent[]; run: RunMeta; source: DashboardSource; sourceLabel: string }
  | { status: 'loading'; source: DashboardSource; sourceLabel: string }
  | { status: 'error'; error: string; source: DashboardSource; sourceLabel: string };

export default function App() {
  const source = useMemo(() => parseDashboardSource(window.location.search), []);
  const [appSearch, setAppSearch] = useState(window.location.search);
  const [chatEvents, setChatEvents] = useState<TraceEvent[]>([]);
  const [chatSession, setChatSession] = useState<BackendSession | null>(null);
  const [selectedProject, setSelectedProject] = useState<RecentProject | null>(null);
  const [projectStatus, setProjectStatus] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>(() => {
    const sourceLabel = describeDashboardSource(source);
    if (source.kind === 'mock') {
      return { status: 'ready', events: MOCK_EVENTS, run: MOCK_RUN, source, sourceLabel };
    }
    return { status: 'loading', source, sourceLabel };
  });

  useEffect(() => {
    const syncSearch = () => setAppSearch(window.location.search);
    window.addEventListener('popstate', syncSearch);
    return () => window.removeEventListener('popstate', syncSearch);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sourceLabel = describeDashboardSource(source);

    async function load() {
      try {
        if (source.kind === 'mock') return;

        if (source.kind === 'run-url') {
          const { events, manifest } = await loadRunFromUrl(source.baseUrl);
          if (!cancelled) setState({ status: 'ready', events, run: manifest, source, sourceLabel });
          return;
        }

        const [events, manifest] = await Promise.all([
          loadTraceFromUrl(source.traceUrl),
          source.manifestUrl ? loadManifestFromUrl(source.manifestUrl) : Promise.resolve(undefined),
        ]);
        if (!cancelled) {
          setState({
            status: 'ready',
            events,
            run: manifest ?? synthesizeManifest(events, source.traceUrl),
            source,
            sourceLabel,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            error: err instanceof Error ? err.message : String(err),
            source,
            sourceLabel,
          });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (state.status === 'loading') {
    return <CenteredState title="Loading run trace…" detail={state.sourceLabel} />;
  }

  if (state.status === 'error') {
    return (
      <CenteredState
        title="Failed to load run trace"
        detail={`${state.error}. Falling back to mock data is available by removing query parameters.`}
      />
    );
  }

  if (state.source.kind !== 'mock') {
    return <Dashboard events={state.events} run={state.run} sourceLabel={state.sourceLabel} />;
  }

  const appState = parseHidecodeAppState(appSearch);
  const shellEvents = appState.mode === 'chat' && chatEvents.length > 0
    ? chatEvents
    : state.status === 'ready' ? state.events : MOCK_EVENTS;
  const navigateToReview = () => {
    window.history.pushState(null, '', '?mode=review');
    setAppSearch('?mode=review');
  };
  const openProject = async (project: RecentProject) => {
    setSelectedProject(null);
    setProjectStatus(`Opening ${project.name}…`);
    try {
      const openedProject = await openBackendProject(project, getBackendBaseUrl());
      setSelectedProject({
        id: openedProject.id,
        name: openedProject.name,
        path: openedProject.path,
        description: project.description,
        lastOpened: 'Just now',
      });
      setProjectStatus(null);
      window.history.pushState(null, '', '?mode=chat');
      setAppSearch('?mode=chat');
    } catch (error) {
      setProjectStatus(error instanceof Error ? error.message : String(error));
    }
  };
  const workspace = appState.mode === 'review'
    ? <ReviewWorkspace session={chatSession} />
    : appState.mode === 'chat'
      ? <ChatWorkspace onEventsChange={setChatEvents} onSessionChange={setChatSession} onReview={navigateToReview} projectPath={selectedProject?.path} />
      : <HomePage onOpenProject={openProject} />;

  return (
    <div style={{ background: '#070a12', minHeight: '100vh' }}>
      <AppShell
        sidebar={<LeftSidebar selectedProject={selectedProject} />}
        workspace={workspace}
        inspector={<RightInspector events={shellEvents} />}
        status={<BottomStatusBar selectedProject={selectedProject} projectStatus={projectStatus} />}
      />
    </div>
  );
}

function CenteredState({ title, detail }: { title: string; detail: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#0a0a0f',
      color: '#e0e0e8',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{
        width: 'min(520px, calc(100vw - 48px))',
        border: '1px solid #1e1e2e',
        borderRadius: '14px',
        background: '#0f0f17',
        padding: '24px',
        boxShadow: '0 20px 80px rgba(0,0,0,0.35)',
      }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>{title}</div>
        <div style={{ color: '#888', fontSize: '13px', lineHeight: 1.6 }}>{detail}</div>
      </div>
    </div>
  );
}
