import { useEffect, useMemo, useState } from 'react';
import { MOCK_EVENTS, MOCK_RUN } from '../data/mock';
import {
  loadManifestFromUrl,
  loadRunFromUrl,
  loadTraceFromUrl,
  synthesizeManifest,
  type RunMeta,
  type TraceEvent,
} from '../data/loader';
import { describeDashboardSource, parseDashboardSource, type DashboardSource } from '../data/query';
import Dashboard from './Dashboard';

type LoadState =
  | { status: 'ready'; events: TraceEvent[]; run: RunMeta; source: DashboardSource; sourceLabel: string }
  | { status: 'loading'; source: DashboardSource; sourceLabel: string }
  | { status: 'error'; error: string; source: DashboardSource; sourceLabel: string };

export default function App() {
  const source = useMemo(() => parseDashboardSource(window.location.search), []);
  const [state, setState] = useState<LoadState>(() => {
    const sourceLabel = describeDashboardSource(source);
    if (source.kind === 'mock') {
      return { status: 'ready', events: MOCK_EVENTS, run: MOCK_RUN, source, sourceLabel };
    }
    return { status: 'loading', source, sourceLabel };
  });

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

  return <Dashboard events={state.events} run={state.run} sourceLabel={state.sourceLabel} />;
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
