import type { ReactNode } from 'react';
import TopBar from './components/TopBar';

type AppShellProps = {
  sidebar: ReactNode;
  workspace: ReactNode;
  inspector: ReactNode;
  status: ReactNode;
};

export default function AppShell({ sidebar, workspace, inspector, status }: AppShellProps) {
  return (
    <div style={styles.shell}>
      <TopBar />
      <div style={styles.body}>
        <nav aria-label="Project sidebar" style={styles.sidebar}>
          {sidebar}
        </nav>
        <main aria-label="Workspace" style={styles.workspace}>
          {workspace}
        </main>
        <div aria-label="Run inspector panel" style={styles.inspector}>
          {inspector}
        </div>
      </div>
      <footer aria-label="Workspace status" style={styles.status}>
        {status}
      </footer>
    </div>
  );
}

const styles = {
  shell: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateRows: '52px 1fr 34px',
    background: '#07080d',
    color: '#e7e9f3',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  body: {
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: '260px minmax(0, 1fr) 360px',
    borderTop: '1px solid #1b2030',
    borderBottom: '1px solid #1b2030',
  },
  sidebar: {
    minWidth: 0,
    overflow: 'auto',
    borderRight: '1px solid #1b2030',
    background: '#0a0d14',
  },
  workspace: {
    minWidth: 0,
    overflow: 'auto',
    background: 'linear-gradient(180deg, #090b12 0%, #07080d 100%)',
  },
  inspector: {
    minWidth: 0,
    overflow: 'auto',
    borderLeft: '1px solid #1b2030',
    background: '#0b0e16',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    background: '#080a10',
    color: '#8b93a7',
    fontSize: '12px',
  },
} satisfies Record<string, React.CSSProperties>;
