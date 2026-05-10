import type { TraceEvent, RunMeta } from '../data/mock';
import TaskGraph from './components/TaskGraph';
import ToolTimeline from './components/ToolTimeline';
import EvidencePanel from './components/EvidencePanel';
import PolicyPanel from './components/PolicyPanel';
import DiffPanel from './components/DiffPanel';
import Header from './components/Header';

interface Props {
  events: TraceEvent[];
  run: RunMeta;
}

export default function Dashboard({ events, run }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '56px 1fr',
      gridTemplateColumns: '280px 1fr 320px',
      gridTemplateAreas: `
        "header header header"
        "left   center right"
      `,
      height: '100vh',
      background: '#0a0a0f',
      color: '#e0e0e8',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <Header run={run} events={events} />

      {/* Left: Task Graph */}
      <div style={{ gridArea: 'left', borderRight: '1px solid #1e1e2e', overflow: 'auto', padding: '12px' }}>
        <PanelTitle title="Task Graph" />
        <TaskGraph events={events} />
      </div>

      {/* Center: Tool Timeline + Diff */}
      <div style={{ gridArea: 'center', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: '12px', borderBottom: '1px solid #1e1e2e' }}>
          <PanelTitle title="Tool Timeline" />
          <ToolTimeline events={events} />
        </div>
        <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
          <PanelTitle title="Diff / Changes" />
          <DiffPanel events={events} />
        </div>
      </div>

      {/* Right: Evidence + Policy */}
      <div style={{ gridArea: 'right', borderLeft: '1px solid #1e1e2e', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: '12px', borderBottom: '1px solid #1e1e2e' }}>
          <PanelTitle title="Evidence" />
          <EvidencePanel events={events} />
        </div>
        <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
          <PanelTitle title="Policy / Risk" />
          <PolicyPanel events={events} />
        </div>
      </div>
    </div>
  );
}

function PanelTitle({ title }: { title: string }) {
  return (
    <h3 style={{
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#888',
      marginBottom: '8px',
    }}>
      {title}
    </h3>
  );
}
