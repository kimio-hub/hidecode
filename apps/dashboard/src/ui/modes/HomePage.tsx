import { useState, type FormEvent } from 'react';
import ModelSafetySetup from '../components/ModelSafetySetup';
import QuickStartPanel from '../components/QuickStartPanel';
import RecentProjectsPanel from '../components/RecentProjectsPanel';
import type { RecentProject } from '../../data/projects';

interface HomePageProps {
  onOpenProject?: (project: RecentProject) => void;
  projects?: RecentProject[];
}

export default function HomePage({ onOpenProject, projects }: HomePageProps) {
  const [showManualForm, setShowManualForm] = useState(false);
  const [projectPath, setProjectPath] = useState('');
  const [projectName, setProjectName] = useState('');
  const normalizedPath = normalizePath(projectPath);

  const submitManualProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedPath || !onOpenProject) return;

    const name = projectName.trim() || deriveNameFromPath(normalizedPath);
    onOpenProject({
      id: slugProjectId(name || normalizedPath),
      name,
      path: normalizedPath,
      description: 'Manually opened project',
      lastOpened: 'Just now',
    });
  };

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
          <button type="button" style={styles.secondaryButton}>Clone Repository</button>
        </div>
        {showManualForm ? (
          <form aria-label="Open project folder manually" style={styles.manualForm} onSubmit={submitManualProject}>
            <label style={styles.fieldLabel}>
              Project path
              <input
                value={projectPath}
                onChange={(event) => setProjectPath(event.target.value)}
                placeholder="/path/to/project"
                style={styles.input}
              />
            </label>
            <label style={styles.fieldLabel}>
              Project name
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Optional"
                style={styles.input}
              />
            </label>
            <button type="submit" style={styles.submitButton} disabled={!normalizedPath}>Open Project</button>
          </form>
        ) : null}
        <div style={styles.dropZone}>Drag a project folder here</div>
      </div>
      <div style={styles.grid}>
        <RecentProjectsPanel onOpenProject={onOpenProject} projects={projects} />
        <div style={styles.sideStack}>
          <QuickStartPanel />
          <ModelSafetySetup />
        </div>
      </div>
    </div>
  );
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === '/' || /^[A-Za-z]:\\$/.test(trimmed)) return trimmed;
  return trimmed.replace(/[\\/]+$/, '');
}

function deriveNameFromPath(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) || path;
}

function slugProjectId(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'manual-project';
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
  manualForm: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1fr) minmax(180px, 0.7fr) auto',
    gap: '10px',
    alignItems: 'end',
    marginTop: '16px',
    padding: '14px',
    border: '1px solid #263145',
    borderRadius: '16px',
    background: 'rgba(15, 23, 42, 0.7)',
  },
  fieldLabel: {
    display: 'grid',
    gap: '6px',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 800,
  },
  input: {
    border: '1px solid #334155',
    borderRadius: '10px',
    background: '#080b13',
    color: '#f8fafc',
    padding: '9px 10px',
    fontSize: '13px',
  },
  submitButton: {
    border: 0,
    borderRadius: '10px',
    background: '#60a5fa',
    color: '#06111f',
    padding: '10px 12px',
    fontWeight: 900,
    cursor: 'pointer',
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
