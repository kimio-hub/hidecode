import { recentProjects, type RecentProject } from '../../data/projects';

interface RecentProjectsPanelProps {
  onOpenProject?: (project: RecentProject) => void;
}

export default function RecentProjectsPanel({ onOpenProject }: RecentProjectsPanelProps) {
  return (
    <section aria-label="Recent projects" style={styles.panel}>
      <div style={styles.heading}>Recent Projects</div>
      <div style={styles.list}>
        {recentProjects.map((project) => (
          <button
            key={project.id}
            type="button"
            style={styles.projectCard}
            onClick={() => onOpenProject?.(project)}
          >
            <span style={styles.projectName}>{project.name}</span>
            <span style={styles.projectPath}>{project.path}</span>
            <span style={styles.projectDescription}>{project.description}</span>
            <span style={styles.lastOpened}>{project.lastOpened}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

const styles = {
  panel: {
    border: '1px solid #22293a',
    borderRadius: '18px',
    background: '#0c101b',
    padding: '18px',
  },
  heading: {
    color: '#f6f7fb',
    fontSize: '13px',
    fontWeight: 800,
    marginBottom: '12px',
  },
  list: {
    display: 'grid',
    gap: '10px',
  },
  projectCard: {
    display: 'grid',
    gap: '4px',
    width: '100%',
    textAlign: 'left',
    border: '1px solid #232b3d',
    borderRadius: '14px',
    background: '#111725',
    padding: '12px',
    cursor: 'pointer',
  },
  projectName: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 800,
  },
  projectPath: {
    color: '#6b7284',
    fontSize: '11px',
  },
  projectDescription: {
    color: '#a7afc2',
    fontSize: '12px',
  },
  lastOpened: {
    color: '#60a5fa',
    fontSize: '11px',
    marginTop: '3px',
  },
} satisfies Record<string, React.CSSProperties>;
