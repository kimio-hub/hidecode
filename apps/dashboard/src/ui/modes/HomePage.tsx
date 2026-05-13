import { useState } from 'react';
import CloneRepositoryPreview from '../components/CloneRepositoryPreview';
import ModelSafetySetup from '../components/ModelSafetySetup';
import OpenFolderForm from '../components/OpenFolderForm';
import QuickStartPanel from '../components/QuickStartPanel';
import RecentProjectsPanel from '../components/RecentProjectsPanel';
import type { QuickStartAction, RecentProject } from '../../data/projects';

interface HomePageProps {
  onOpenProject?: (project: RecentProject) => void;
  onQuickStart?: (action: QuickStartAction) => void;
  projects?: RecentProject[];
}

export default function HomePage({ onOpenProject, onQuickStart, projects }: HomePageProps) {
  const [showManualForm, setShowManualForm] = useState(false);
  const [showCloneForm, setShowCloneForm] = useState(false);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.eyebrow}>Welcome to hidecode</div>
        <h1 style={styles.title}>Build with hidecode</h1>
        <p style={styles.copy}>
          Open a project, start a chat session, and let the coding agent plan, run tools, and prepare reviewable diffs.
        </p>
        <div style={styles.actions}>
          <button type="button" style={styles.primaryButton} onClick={() => setShowManualForm(true)}>Open Folder</button>
          <button type="button" style={styles.secondaryButton} onClick={() => setShowCloneForm(true)}>Clone Repository</button>
        </div>
        {showManualForm ? <OpenFolderForm onOpenProject={onOpenProject} /> : null}
        {showCloneForm ? <CloneRepositoryPreview /> : null}
        <div style={styles.dropZone}>Drag a project folder here</div>
      </div>
      <div style={styles.grid}>
        <RecentProjectsPanel onOpenProject={onOpenProject} projects={projects} />
        <div style={styles.sideStack}>
          <QuickStartPanel onSelectAction={onQuickStart} />
          <ModelSafetySetup />
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'grid',
    gap: '22px',
    padding: '30px',
  },
  hero: {
    border: '1px solid #22293a',
    borderRadius: '24px',
    background: 'radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 36%), #0c101b',
    padding: '32px',
  },
  eyebrow: {
    color: '#60a5fa',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '10px',
  },
  title: {
    color: '#ffffff',
    fontSize: '42px',
    lineHeight: 1.05,
    margin: 0,
  },
  copy: {
    color: '#a4aec3',
    maxWidth: '680px',
    fontSize: '15px',
    lineHeight: 1.7,
    margin: '14px 0 0',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '22px',
  },
  primaryButton: {
    border: 0,
    borderRadius: '12px',
    background: '#f8fafc',
    color: '#080a10',
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #2b3347',
    borderRadius: '12px',
    background: '#111827',
    color: '#dbe4f5',
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  dropZone: {
    marginTop: '18px',
    border: '1px dashed #334155',
    borderRadius: '16px',
    color: '#7f879a',
    padding: '14px',
    fontSize: '13px',
    textAlign: 'center',
    background: 'rgba(15, 23, 42, 0.55)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 0.9fr) minmax(360px, 1.1fr)',
    gap: '22px',
  },
  sideStack: {
    display: 'grid',
    gap: '22px',
  },
} satisfies Record<string, React.CSSProperties>;
