import path from 'node:path';

export type RunArtifacts = { root: string; task: string; run: string; trace: string; patch: string; report: string; artifactsDir: string };

export function runArtifactLayout(repo: string, runId: string): RunArtifacts {
  const root = path.join(repo, '.runs', runId);
  return {
    root,
    task: path.join(root, 'task.json'),
    run: path.join(root, 'run.json'),
    trace: path.join(root, 'trace.jsonl'),
    patch: path.join(root, 'final.patch'),
    report: path.join(root, 'report.md'),
    artifactsDir: path.join(root, 'artifacts')
  };
}
