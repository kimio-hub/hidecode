export default function BottomStatusBar() {
  return (
    <div style={styles.statusItems}>
      <span>branch: main</span>
      <span>sandbox: guarded</span>
      <span>runtime: preview-only</span>
      <span>model: not connected</span>
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
