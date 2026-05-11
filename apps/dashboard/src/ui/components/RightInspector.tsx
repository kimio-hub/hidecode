import { useState } from 'react';
import type { TraceEvent } from '../../data/loader';
import { deriveAgentBoard } from '../../data/agents';
import { deriveApprovalQueue } from '../../data/approvals';
import { deriveReplaySteps } from '../../data/replay';
import DiffPanel from './DiffPanel';
import ApprovalQueue from './ApprovalQueue';
import ReplayDebugger from './ReplayDebugger';
import ToolTimeline from './ToolTimeline';
import AgentBoard from './AgentBoard';

interface Props {
  events?: TraceEvent[];
}

const tabs = ['Plan', 'Tools', 'Diff', 'Approvals', 'Trace'] as const;
type InspectorTab = (typeof tabs)[number];

export default function RightInspector({ events = [] }: Props) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('Plan');
  const toolEvents = events.filter(event => event.type.startsWith('tool.'));
  const approvalQueue = deriveApprovalQueue(events);
  const replaySteps = deriveReplaySteps(events);
  const agentBoard = deriveAgentBoard(events);

  return (
    <aside aria-label="Run inspector" style={styles.container}>
      <div role="tablist" aria-label="Inspector views" style={styles.tabs}>
        {tabs.map(tab => {
          const selected = tab === activeTab;
          const tabId = `inspector-tab-${tab.toLowerCase()}`;
          const panelId = `inspector-panel-${tab.toLowerCase()}`;
          return (
            <button
              key={tab}
              id={tabId}
              role="tab"
              aria-controls={panelId}
              aria-selected={selected}
              onClick={() => setActiveTab(tab)}
              style={selected ? styles.activeTab : styles.tab}
              type="button"
            >
              {tab}
            </button>
          );
        })}
      </div>

      <section aria-label="Inspector summary" style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <div style={styles.title}>Read-only runtime inspector</div>
            <div style={styles.copy}>Plan, tools, diff, approvals, and trace are visible but actions stay disabled until the local backend is wired.</div>
          </div>
          <span style={styles.modePill}>preview-only</span>
        </div>

        <div style={styles.metricsGrid}>
          <Metric label="Events" value={formatCount(events.length, 'event')} />
          <Metric label="Tools" value={formatCount(toolEvents.filter(event => event.type === 'tool.call' || event.type === 'tool.requested').length, 'tool call')} />
          <Metric label="Approvals" value={formatCount(approvalQueue.length, 'approval')} />
        </div>
      </section>

      <TabPanel activeTab={activeTab} title="Plan">
        <AgentBoard items={agentBoard} />
      </TabPanel>
      <TabPanel activeTab={activeTab} title="Tools">
        <ToolTimeline events={events} />
      </TabPanel>
      <TabPanel activeTab={activeTab} title="Diff">
        <DiffPanel events={events} />
      </TabPanel>
      <TabPanel activeTab={activeTab} title="Approvals">
        <ApprovalQueue items={approvalQueue} />
      </TabPanel>
      <TabPanel activeTab={activeTab} title="Trace">
        <ReplayDebugger steps={replaySteps} />
      </TabPanel>
    </aside>
  );
}

function TabPanel({ activeTab, title, children }: { activeTab: InspectorTab; title: InspectorTab; children: React.ReactNode }) {
  if (activeTab !== title) return null;

  return (
    <section
      aria-label={title}
      aria-labelledby={`inspector-tab-${title.toLowerCase()}`}
      id={`inspector-panel-${title.toLowerCase()}`}
      role="tabpanel"
      style={styles.panel}
    >
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metric}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

function formatCount(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

const styles = {
  container: {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  activeTab: {
    borderRadius: '999px',
    border: '1px solid #3b82f6',
    background: '#1c2435',
    color: '#ffffff',
    padding: '6px 9px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  tab: {
    borderRadius: '999px',
    color: '#8f98ad',
    background: 'transparent',
    border: '1px solid #242b3d',
    padding: '6px 9px',
    fontSize: '11px',
    cursor: 'pointer',
  },
  panel: {
    border: '1px solid #242b3d',
    borderRadius: '14px',
    background: '#101421',
    padding: '14px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
  },
  title: {
    color: '#f6f7fb',
    fontWeight: 700,
    fontSize: '13px',
    marginBottom: '6px',
  },
  sectionTitle: {
    color: '#f6f7fb',
    fontWeight: 700,
    fontSize: '12px',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  copy: {
    color: '#8d96aa',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  modePill: {
    color: '#93c5fd',
    border: '1px solid #1d4ed8',
    borderRadius: '999px',
    padding: '3px 7px',
    fontSize: '10px',
    whiteSpace: 'nowrap',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '8px',
    marginTop: '12px',
  },
  metric: {
    border: '1px solid #242b3d',
    borderRadius: '10px',
    padding: '8px',
    background: '#0b0f1a',
  },
  metricLabel: {
    color: '#717b91',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  metricValue: {
    color: '#e7eaf2',
    fontSize: '12px',
    fontWeight: 700,
    marginTop: '5px',
  },
} satisfies Record<string, React.CSSProperties>;
