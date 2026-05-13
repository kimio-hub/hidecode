import type { RecentProject } from '../../data/projects';
import type { BackendSession } from '../../data/backend';

interface LeftSidebarProps {
  selectedProject?: RecentProject | null;
  currentSession?: BackendSession | null;
}

export default function LeftSidebar({ selectedProject, currentSession }: LeftSidebarProps) {
  const latestRun = currentSession?.runs?.at(-1);

  return (
    <div style={styles.container}>
      <section>
        <div style={styles.label}>Project</div>
        <div style={styles.projectCard}>
          {selectedProject ? (
            <>
              <div style={styles.projectName}>{selectedProject.name}</div>
              <div style={styles.projectPath}>{selectedProject.path}</div>
            </>
          ) : 'No project selected'}
        </div>
      </section>
      <section>
        <div style={styles.label}>Sessions</div>
        {currentSession ? (
          <div style={styles.sessionCard}>
            <div style={styles.sessionTitle}>{currentSession.title}</div>
            <div style={styles.sessionMeta}>{currentSession.id}</div>
            <div style={styles.sessionMeta}>{formatMessageCount(currentSession.messages.length)}</div>
            {latestRun ? (
              <div style={styles.runSummary}>
                <span style={latestRun.ok ? styles.runStatusCompleted : styles.runStatusFailed}>
                  {latestRun.ok ? 'completed' : 'failed'}
                </span>
                <span>{latestRun.summary}</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={styles.empty}>Open a folder to start a hidecode session.</div>
        )}
      </section>
    </div>
  );
}

function formatMessageCount(count: number): string {
  return `${count} ${count === 1 ? 'message' : 'messages'}`;
}

const styles = {
  container: {
    padding: '16px',
    display: 'grid',
    gap: '18px',
  },
  label: {
    color: '#6f778b',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  projectCard: {
    border: '1px solid #242a3a',
    borderRadius: '12px',
    padding: '12px',
    color: '#d8dcef',
    background: '#0f1320',
    fontSize: '13px',
  },
  projectName: {
    color: '#ffffff',
    fontWeight: 800,
    marginBottom: '4px',
  },
  projectPath: {
    color: '#8b95aa',
    fontSize: '11px',
    wordBreak: 'break-all',
  },
  empty: {
    color: '#7f879a',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  sessionCard: {
    border: '1px solid #24304a',
    borderRadius: '12px',
    padding: '12px',
    color: '#d8dcef',
    background: '#0d1424',
    fontSize: '12px',
    display: 'grid',
    gap: '6px',
  },
  sessionTitle: {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 800,
  },
  sessionMeta: {
    color: '#8b95aa',
    fontSize: '11px',
    wordBreak: 'break-all',
  },
  runSummary: {
    display: 'grid',
    gap: '4px',
    color: '#c7d2fe',
    lineHeight: 1.4,
  },
  runStatusCompleted: {
    color: '#86efac',
    fontSize: '11px',
    fontWeight: 800,
  },
  runStatusFailed: {
    color: '#fca5a5',
    fontSize: '11px',
    fontWeight: 800,
  },
} satisfies Record<string, React.CSSProperties>;
