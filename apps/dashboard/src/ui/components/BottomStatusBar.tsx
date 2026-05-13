import type { RecentProject } from '../../data/projects';

interface BottomStatusBarProps {
  selectedProject?: RecentProject | null;
  projectStatus?: string | null;
}

export default function BottomStatusBar({ selectedProject, projectStatus }: BottomStatusBarProps) {
  return (
    <div style={styles.statusItems}>
      <span>{selectedProject ? `project: ${selectedProject.path}` : 'project: none'}</span>
      <span>branch: main</span>
      <span>sandbox: guarded</span>
      <span>runtime: preview-only</span>
      <span>model: not connected</span>
      {projectStatus ? <span>{projectStatus}</span> : null}
    </div>
  );
}

const styles = {
  statusItems: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, React.CSSProperties>;
