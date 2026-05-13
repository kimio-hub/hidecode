import { useState, type CSSProperties, type FormEvent } from 'react';
import type { QuickStartAction } from '../../data/projects';

interface CloneRepositoryPreviewProps {
  onPreviewClone?: (action: QuickStartAction) => void;
}

export default function CloneRepositoryPreview({ onPreviewClone }: CloneRepositoryPreviewProps) {
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [destinationPath, setDestinationPath] = useState('');
  const [previewStatus, setPreviewStatus] = useState('');
  const normalizedRepositoryUrl = repositoryUrl.trim();
  const normalizedDestinationPath = normalizePath(destinationPath);
  const canPreviewClone = Boolean(normalizedRepositoryUrl && normalizedDestinationPath);
  const cloneCommand = canPreviewClone ? buildCloneCommand(normalizedRepositoryUrl, normalizedDestinationPath) : '';

  const previewCloneRepository = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPreviewClone) return;
    setPreviewStatus('Clone preview staged — backend approval is required before any network or filesystem action.');
    onPreviewClone?.({
      id: 'clone-repository',
      title: 'Clone repository',
      description: 'Prepare a backend-approved repository clone request.',
      prompt: `Prepare this clone request for backend approval before any network or filesystem action:\n\n\`${cloneCommand}\`\n\nDo not run the clone until explicit backend approval is granted.`,
    });
  };

  return (
    <form aria-label="Clone repository preview" style={styles.cloneForm} onSubmit={previewCloneRepository}>
      <label style={styles.fieldLabel}>
        Repository URL
        <input
          value={repositoryUrl}
          onChange={(event) => setRepositoryUrl(event.target.value)}
          placeholder="https://example.com/repo.git"
          style={styles.input}
        />
      </label>
      <label style={styles.fieldLabel}>
        Destination path
        <input
          value={destinationPath}
          onChange={(event) => setDestinationPath(event.target.value)}
          placeholder="/path/to/destination"
          style={styles.input}
        />
      </label>
      <button type="submit" style={styles.submitButton} disabled={!canPreviewClone}>Preview Clone</button>
      {canPreviewClone ? (
        <div style={styles.clonePreview}>
          <code>{cloneCommand}</code>
          <span>Preview only — cloning requires explicit backend approval.</span>
        </div>
      ) : null}
      {previewStatus ? <div aria-live="polite" style={styles.previewStatus}>{previewStatus}</div> : null}
    </form>
  );
}

function buildCloneCommand(repositoryUrl: string, destinationPath: string): string {
  return `git clone ${quoteShellArg(repositoryUrl)} ${quoteShellArg(destinationPath)}`;
}

function quoteShellArg(value: string): string {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === '/' || /^[A-Za-z]:\\$/.test(trimmed)) return trimmed;
  return trimmed.replace(/[\\/]+$/, '');
}

const styles = {
  cloneForm: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr) auto',
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
  clonePreview: {
    gridColumn: '1 / -1',
    display: 'grid',
    gap: '6px',
    color: '#a4aec3',
    fontSize: '12px',
  },
  previewStatus: {
    gridColumn: '1 / -1',
    color: '#93c5fd',
    fontSize: '12px',
    fontWeight: 700,
  },
} satisfies Record<string, CSSProperties>;
