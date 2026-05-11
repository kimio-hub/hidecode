import type { ChangedFileSummary } from '../../data/review';

interface ChangedFilesListProps {
  files: ChangedFileSummary[];
  selectedPath?: string;
}

const statusColors: Record<ChangedFileSummary['status'], string> = {
  added: '#4ade80',
  modified: '#60a5fa',
  deleted: '#f87171',
  renamed: '#c084fc',
};

export default function ChangedFilesList({ files, selectedPath }: ChangedFilesListProps) {
  return (
    <ul aria-label="Changed files" style={styles.list}>
      {files.map(file => {
        const selected = file.path === selectedPath;
        return (
          <li key={file.path} style={{ ...styles.item, ...(selected ? styles.selectedItem : {}) }}>
            <div style={styles.fileMain}>
              <span style={{ ...styles.statusDot, background: statusColors[file.status] }} aria-hidden="true" />
              <div style={styles.fileText}>
                <span style={styles.path}>{file.path}</span>
                <span style={styles.meta}>{file.language ?? 'text'} · {file.status}</span>
              </div>
            </div>
            <div style={styles.counts} aria-label={`${file.additions} additions and ${file.deletions} deletions`}>
              <span style={styles.additions}>+{file.additions}</span>
              <span style={styles.deletions}>-{file.deletions}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const styles = {
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gap: '8px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    border: '1px solid #23283a',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.025)',
    padding: '10px',
  },
  selectedItem: {
    borderColor: '#60a5fa66',
    background: 'rgba(96,165,250,0.08)',
  },
  fileMain: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '999px',
    flex: '0 0 auto',
  },
  fileText: {
    minWidth: 0,
    display: 'grid',
    gap: '3px',
  },
  path: {
    color: '#eef2ff',
    fontSize: '12px',
    fontWeight: 700,
    overflowWrap: 'anywhere',
  },
  meta: {
    color: '#7f879a',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  counts: {
    display: 'flex',
    gap: '7px',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 800,
    flex: '0 0 auto',
  },
  additions: { color: '#4ade80' },
  deletions: { color: '#f87171' },
} satisfies Record<string, React.CSSProperties>;
