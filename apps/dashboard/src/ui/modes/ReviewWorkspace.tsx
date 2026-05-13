import { buildMockReviewState, buildReviewStateFromBackendSession } from '../../data/review';
import type { BackendSession } from '../../data/backend';
import ChangedFilesList from '../components/ChangedFilesList';
import CommandPreview from '../components/CommandPreview';

interface ReviewWorkspaceProps {
  session?: BackendSession | null;
}

export default function ReviewWorkspace({ session }: ReviewWorkspaceProps = {}) {
  const review = session ? buildReviewStateFromBackendSession(session) : buildMockReviewState();
  const diffBadge = review.source === 'backend' ? 'real git diff' : 'mock side-by-side diff preview';

  return (
    <section aria-label="Review workspace" style={styles.workspace}>
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Review mode</div>
          <h1 style={styles.title}>{review.title}</h1>
          <p style={styles.subtitle}>Inspect file changes, command intent, and approval policy before any apply action runs.</p>
        </div>
        <div style={styles.summaryCards}>
          <Metric label="Files" value={String(review.summary.fileCount)} />
          <Metric label="Added" value={`+${review.summary.additions}`} tone="#4ade80" />
          <Metric label="Deleted" value={`-${review.summary.deletions}`} tone="#f87171" />
        </div>
      </header>

      <div style={styles.body}>
        <aside style={styles.filesPanel}>
          <div style={styles.panelHeader}>Changed files</div>
          <ChangedFilesList files={review.changedFiles} selectedPath={review.selectedFile.path} />
        </aside>

        <main style={styles.diffPanel}>
          <section aria-label="Side-by-side diff preview" style={styles.diffRegion}>
            <div style={styles.diffHeader}>
              <div>
                <div style={styles.panelHeader}>Side-by-side diff</div>
                <div style={styles.filePath}>{review.diff.filePath}</div>
              </div>
              <span style={styles.mockBadge}>{diffBadge}</span>
            </div>
            <div style={styles.diffGrid}>
              <DiffColumn title="Before" content={review.diff.before} />
              <DiffColumn title="After" content={review.diff.after} />
            </div>
          </section>
        </main>

        <aside style={styles.approvalPanel}>
          <section aria-label="Approval request" style={styles.card}>
            <div style={styles.panelHeader}>{review.approval.title}</div>
            <div style={styles.policyRow}>
              <span style={styles.statusBadge}>{review.approval.status}</span>
              <span style={styles.riskBadge}>{review.approval.risk} risk</span>
            </div>
            <p style={styles.policyText}>{review.approval.policyExplanation}</p>
            <div style={styles.actions}>
              <button disabled style={styles.primaryButton}>Approve changes</button>
              <button disabled style={styles.secondaryButton}>Reject changes</button>
            </div>
          </section>
          <CommandPreview command={review.command} />
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value, tone = '#e5e7eb' }: { label: string; value: string; tone?: string }) {
  return (
    <div style={styles.metric}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: tone }}>{value}</div>
    </div>
  );
}

function DiffColumn({ title, content }: { title: string; content: string }) {
  return (
    <div style={styles.diffColumn}>
      <div style={styles.diffColumnTitle}>{title}</div>
      <pre style={styles.diffPre}>{content}</pre>
    </div>
  );
}

const styles = {
  workspace: {
    minHeight: '100%',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    gap: '18px',
    padding: '24px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '18px',
    alignItems: 'start',
  },
  eyebrow: {
    color: '#a78bfa',
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
  subtitle: {
    color: '#9ca3af',
    fontSize: '13px',
    margin: '10px 0 0',
    maxWidth: '680px',
    lineHeight: 1.6,
  },
  summaryCards: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  metric: {
    minWidth: '84px',
    border: '1px solid #23283a',
    borderRadius: '14px',
    background: '#0d111b',
    padding: '10px 12px',
  },
  metricLabel: { color: '#7f879a', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' },
  metricValue: { fontSize: '20px', fontWeight: 900, marginTop: '4px' },
  body: {
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: 'minmax(230px, 300px) minmax(360px, 1fr) minmax(260px, 340px)',
    gap: '16px',
  },
  filesPanel: {
    border: '1px solid #1f2636',
    borderRadius: '16px',
    background: '#0a0d14',
    padding: '14px',
    minWidth: 0,
  },
  diffPanel: { minWidth: 0 },
  diffRegion: {
    height: '100%',
    minHeight: '420px',
    border: '1px solid #1f2636',
    borderRadius: '16px',
    background: '#0a0d14',
    padding: '14px',
    boxSizing: 'border-box',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    gap: '12px',
  },
  diffHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'start',
  },
  panelHeader: {
    color: '#eef2ff',
    fontSize: '13px',
    fontWeight: 800,
    marginBottom: '10px',
  },
  filePath: { color: '#8b93a7', fontSize: '12px', overflowWrap: 'anywhere' },
  mockBadge: {
    color: '#93c5fd',
    border: '1px solid #60a5fa55',
    borderRadius: '999px',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  diffGrid: {
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  diffColumn: {
    minWidth: 0,
    border: '1px solid #23283a',
    borderRadius: '12px',
    background: '#070a12',
    overflow: 'hidden',
  },
  diffColumnTitle: {
    borderBottom: '1px solid #23283a',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 800,
    padding: '9px 10px',
  },
  diffPre: {
    margin: 0,
    padding: '12px',
    color: '#aab2c8',
    fontSize: '12px',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  approvalPanel: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    border: '1px solid #23283a',
    borderRadius: '14px',
    background: '#0d111b',
    padding: '14px',
  },
  policyRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  statusBadge: {
    color: '#facc15',
    border: '1px solid #facc1555',
    borderRadius: '999px',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  riskBadge: {
    color: '#facc15',
    border: '1px solid #facc1555',
    borderRadius: '999px',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  policyText: { color: '#aab2c8', fontSize: '12px', lineHeight: 1.6, margin: '12px 0' },
  actions: { display: 'flex', gap: '8px' },
  primaryButton: {
    border: '1px solid #22c55e55',
    borderRadius: '9px',
    background: '#102018',
    color: '#64706a',
    padding: '7px 10px',
    fontSize: '12px',
    cursor: 'not-allowed',
  },
  secondaryButton: {
    border: '1px solid #ef444455',
    borderRadius: '9px',
    background: '#201012',
    color: '#746569',
    padding: '7px 10px',
    fontSize: '12px',
    cursor: 'not-allowed',
  },
} satisfies Record<string, React.CSSProperties>;
