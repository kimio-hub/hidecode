import { useState, type CSSProperties, type FormEvent } from 'react';
import type { RecentProject } from '../../data/projects';

interface OpenFolderFormProps {
  onOpenProject?: (project: RecentProject) => void;
}

export default function OpenFolderForm({ onOpenProject }: OpenFolderFormProps) {
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
} satisfies Record<string, CSSProperties>;
