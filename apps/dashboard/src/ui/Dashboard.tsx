import type { TraceEvent, RunMeta } from '../data/mock';
import {
  actionReasonAttributes,
  buildCommandActionIntent,
  DEFAULT_RUNTIME_ACTION_READINESS,
  type DashboardRuntimeActionReadiness,
  runtimeActionPreview,
  runtimeActionReadinessIndicator,
  toRuntimeActionRequest,
} from '../data/actions';
import { deriveApprovalQueue } from '../data/approvals';
import { deriveReplaySteps } from '../data/replay';
import { deriveAgentBoard } from '../data/agents';
import TaskGraph from './components/TaskGraph';
import ToolTimeline from './components/ToolTimeline';
import EvidencePanel from './components/EvidencePanel';
import PolicyPanel from './components/PolicyPanel';
import DiffPanel from './components/DiffPanel';
import ApprovalQueue from './components/ApprovalQueue';
import ReplayDebugger from './components/ReplayDebugger';
import AgentBoard from './components/AgentBoard';
import Header from './components/Header';

interface Props {
  events: TraceEvent[];
  run: RunMeta;
  sourceLabel?: string;
  runtimeActionReadiness?: DashboardRuntimeActionReadiness;
}

const navItems = [
  { label: 'Control', status: 'Live' },
  { label: 'Approvals', status: 'Queue' },
  { label: 'Replay', status: 'Trace' },
  { label: 'Agents', status: 'Board' },
];

export default function Dashboard({ events, run, sourceLabel = 'Mock', runtimeActionReadiness: runtimeActionReadinessInput }: Props) {
  const toolEvents = events.filter(e => e.type.startsWith('tool.'));
  const approvalQueue = deriveApprovalQueue(events);
  const replaySteps = deriveReplaySteps(events);
  const agentBoard = deriveAgentBoard(events);
  const askHarnessIntent = buildCommandActionIntent('ask-harness');
  const runtimeActionReadiness = runtimeActionReadinessIndicator(runtimeActionReadinessInput ?? DEFAULT_RUNTIME_ACTION_READINESS);
  const askHarnessPreview = runtimeActionPreview(toRuntimeActionRequest(askHarnessIntent));
  const riskEvents = events.filter(e => e.type.includes('policy') || e.type === 'security.finding');
  const duration = formatDuration(events);

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '56px 1fr',
      gridTemplateColumns: '220px minmax(560px, 1fr) 340px',
      gridTemplateAreas: `
        "header header header"
        "nav    main   inspector"
      `,
      height: '100vh',
      background: 'radial-gradient(circle at top left, rgba(124,58,237,0.12), transparent 30%), #0a0a0f',
      color: '#e0e0e8',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <Header run={run} events={events} sourceLabel={sourceLabel} />

      <aside style={{
        gridArea: 'nav',
        borderRight: '1px solid #1e1e2e',
        background: 'rgba(15, 15, 23, 0.82)',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div>
          <div style={{ color: '#fff', fontSize: '15px', fontWeight: 800 }}>Mission Control</div>
          <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>Agent runtime cockpit</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item, index) => (
            <div key={item.label} style={{
              border: '1px solid ' + (index === 0 ? '#4c1d95' : '#23233a'),
              background: index === 0 ? 'rgba(124, 58, 237, 0.16)' : 'rgba(255,255,255,0.02)',
              borderRadius: '12px',
              padding: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: index === 0 ? '#ddd6fe' : '#cbd5e1', fontSize: '13px', fontWeight: 650 }}>{item.label}</span>
                <span style={{ color: '#71717a', fontSize: '10px' }}>{item.status}</span>
              </div>
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', border: '1px solid #23233a', borderRadius: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Run</div>
          <div style={{ color: '#e5e7eb', fontSize: '12px', marginTop: '8px', overflowWrap: 'anywhere' }}>{run.runId}</div>
        </div>
      </aside>

      <main style={{ gridArea: 'main', overflow: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(100px, 1fr))', gap: '10px' }}>
          <MetricCard label="Events" value={String(events.length)} tone="#93c5fd" />
          <MetricCard label="Tools" value={String(toolEvents.length)} tone="#a78bfa" />
          <MetricCard label="Risk" value={riskEvents.length > 0 ? `${riskEvents.length} signals` : 'Clear'} tone={riskEvents.length > 0 ? '#fbbf24' : '#4ade80'} />
          <MetricCard label="Approvals" value={String(approvalQueue.length)} tone={approvalQueue.length > 0 ? '#facc15' : '#4ade80'} />
          <MetricCard label="Agents" value={String(agentBoard.length)} tone="#38bdf8" />
          <MetricCard label="Duration" value={duration} tone="#f0abfc" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 0.9fr) minmax(320px, 1.2fr)', gap: '12px', minHeight: '310px' }}>
          <Panel title="Task Graph">
            <TaskGraph events={events} />
          </Panel>
          <Panel title="Tool Timeline">
            <ToolTimeline events={events} />
          </Panel>
        </section>

        <section style={{ minHeight: '320px' }}>
          <Panel title="Replay Debug">
            <ReplayDebugger steps={replaySteps} />
          </Panel>
        </section>

        <section style={{ minHeight: '280px' }}>
          <Panel title="Multi-Agent Board">
            <AgentBoard items={agentBoard} />
          </Panel>
        </section>

        <section style={{ minHeight: '260px' }}>
          <Panel title="Diff / Changes">
            <DiffPanel events={events} />
          </Panel>
        </section>

        <section style={{ border: '1px solid #1e1e2e', borderRadius: '14px', background: '#0f0f17', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <PanelTitle title="Command Dock" />
            <div style={{ display: 'flex', gap: '8px' }}>
              <DockPill label="Terminal" />
              <DockAction label={askHarnessIntent.label} reasonAttributes={actionReasonAttributes(askHarnessIntent)} />
            </div>
          </div>
          <div
            role="status"
            aria-label="Runtime action readiness"
            style={{
              border: `1px solid ${readinessToneStyles[runtimeActionReadiness.tone].border}`,
              borderRadius: '10px',
              background: readinessToneStyles[runtimeActionReadiness.tone].background,
              padding: '10px 12px',
              color: readinessToneStyles[runtimeActionReadiness.tone].color,
              fontSize: '12px',
              marginBottom: '10px',
            }}
          >
            <strong>{runtimeActionReadiness.label}</strong> — {runtimeActionReadiness.detail}
          </div>
          <div style={{
            border: '1px solid #23233a',
            borderRadius: '10px',
            background: '#09090f',
            padding: '12px',
            color: '#71717a',
            fontSize: '12px',
          }}>
            <div style={{ color: '#9ca3af', marginBottom: '6px' }}>Preview: {askHarnessPreview}</div>
            Read-only dock placeholder. Next cycles will connect approvals, replay controls, and live agent commands.
          </div>
        </section>
      </main>

      <aside style={{ gridArea: 'inspector', borderLeft: '1px solid #1e1e2e', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', background: 'rgba(15, 15, 23, 0.72)' }}>
        <Panel title="Approval Queue">
          <ApprovalQueue items={approvalQueue} />
        </Panel>
        <Panel title="Evidence">
          <EvidencePanel events={events} />
        </Panel>
        <Panel title="Policy / Risk">
          <PolicyPanel events={events} />
        </Panel>
      </aside>
    </div>
  );
}

const readinessToneStyles = {
  muted: { border: '#27272a', background: 'rgba(63, 63, 70, 0.18)', color: '#a1a1aa' },
  danger: { border: '#7f1d1d', background: 'rgba(127, 29, 29, 0.2)', color: '#fca5a5' },
  warning: { border: '#3f2a14', background: 'rgba(120, 53, 15, 0.18)', color: '#fbbf24' },
  success: { border: '#14532d', background: 'rgba(20, 83, 45, 0.18)', color: '#86efac' },
} as const;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      height: '100%',
      border: '1px solid #1e1e2e',
      borderRadius: '14px',
      background: 'rgba(15, 15, 23, 0.92)',
      padding: '12px',
      overflow: 'auto',
    }}>
      <PanelTitle title={title} />
      {children}
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ border: '1px solid #1e1e2e', borderRadius: '14px', background: 'rgba(15, 15, 23, 0.92)', padding: '12px' }}>
      <div style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ color: tone, fontSize: '20px', fontWeight: 800, marginTop: '8px' }}>{value}</div>
    </div>
  );
}

function DockPill({ label }: { label: string }) {
  return (
    <span style={{ border: '1px solid #2d2d44', borderRadius: '999px', padding: '4px 9px', color: '#a1a1aa', fontSize: '11px' }}>{label}</span>
  );
}

function DockAction({ label, reasonAttributes }: { label: string; reasonAttributes: ReturnType<typeof actionReasonAttributes> }) {
  return (
    <button disabled {...reasonAttributes} style={{ border: '1px solid #2d2d44', borderRadius: '999px', padding: '4px 9px', color: '#71717a', background: '#11111a', fontSize: '11px', cursor: 'not-allowed' }}>
      {label}
    </button>
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
      margin: '0 0 8px 0',
    }}>
      {title}
    </h3>
  );
}

function formatDuration(events: TraceEvent[]): string {
  if (events.length < 2) return '—';
  const start = new Date(events[0].timestamp).getTime();
  const end = new Date(events[events.length - 1].timestamp).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return '—';
  return `${((end - start) / 1000).toFixed(1)}s`;
}
