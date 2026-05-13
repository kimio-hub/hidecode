import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type GitDiffFileStatus = 'added' | 'modified' | 'deleted' | 'renamed';

export interface GitChangedFileSummary {
  path: string;
  oldPath?: string;
  language?: string;
  additions: number;
  deletions: number;
  status: GitDiffFileStatus;
}

export interface GitDiffPatch {
  filePath: string;
  oldPath?: string;
  patch: string;
}

export interface GitDiffSummary {
  fileCount: number;
  additions: number;
  deletions: number;
  byStatus: Record<GitDiffFileStatus, number>;
}

export interface GitDiffSnapshot {
  summary: GitDiffSummary;
  files: GitChangedFileSummary[];
  patches: GitDiffPatch[];
}

export async function captureGitDiff(repo: string): Promise<GitDiffSnapshot> {
  if (!await isGitWorktree(repo)) return emptyGitDiffSnapshot();
  const [numstat, nameStatus, patch, untracked] = await Promise.all([
    git(repo, ['diff', 'HEAD', '--numstat']),
    git(repo, ['diff', 'HEAD', '--name-status']),
    git(repo, ['diff', 'HEAD', '--patch', '--binary']),
    git(repo, ['ls-files', '--others', '--exclude-standard']),
  ]);
  const statusByPath = parseNameStatus(nameStatus.stdout);
  const trackedFiles = parseNumstat(numstat.stdout, statusByPath);
  const trackedPatches = splitPatches(patch.stdout);
  const untrackedFiles = await Promise.all(parseUntrackedPaths(untracked.stdout).map((filePath) => buildUntrackedFile(repo, filePath)));
  const files = [...trackedFiles, ...untrackedFiles.map((file) => file.summary)];
  const patches = [...trackedPatches, ...untrackedFiles.map((file) => file.patch)];
  return { summary: summarizeGitChangedFiles(files), files, patches };
}

export function summarizeGitChangedFiles(files: GitChangedFileSummary[]): GitDiffSummary {
  return files.reduce<GitDiffSummary>((summary, file) => {
    summary.fileCount += 1;
    summary.additions += file.additions;
    summary.deletions += file.deletions;
    summary.byStatus[file.status] += 1;
    return summary;
  }, {
    fileCount: 0,
    additions: 0,
    deletions: 0,
    byStatus: { added: 0, modified: 0, deleted: 0, renamed: 0 },
  });
}

function parseNameStatus(output: string): Map<string, { status: GitDiffFileStatus; oldPath?: string }> {
  const statuses = new Map<string, { status: GitDiffFileStatus; oldPath?: string }>();
  for (const line of output.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    const rawStatus = parts[0] ?? 'M';
    if (rawStatus.startsWith('R')) {
      const oldPath = parts[1];
      const newPath = parts[2];
      if (newPath) statuses.set(newPath, { status: 'renamed', oldPath });
      continue;
    }
    const filePath = parts[1];
    if (!filePath) continue;
    statuses.set(filePath, { status: mapGitStatus(rawStatus) });
  }
  return statuses;
}

function parseNumstat(output: string, statusByPath: Map<string, { status: GitDiffFileStatus; oldPath?: string }>): GitChangedFileSummary[] {
  return output.split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [additionsRaw, deletionsRaw, ...pathParts] = line.split('\t');
      const { filePath, oldPath } = parseNumstatPath(pathParts.join('\t'));
      const statusInfo = statusByPath.get(filePath) ?? { status: 'modified' as GitDiffFileStatus, oldPath };
      return {
        path: filePath,
        oldPath: statusInfo.oldPath ?? oldPath,
        language: inferLanguage(filePath),
        additions: additionsRaw === '-' ? 0 : Number(additionsRaw),
        deletions: deletionsRaw === '-' ? 0 : Number(deletionsRaw),
        status: statusInfo.status,
      };
    });
}

function splitPatches(output: string): GitDiffPatch[] {
  if (!output.trim()) return [];
  return output
    .split(/\n(?=diff --git )/)
    .filter((patch) => patch.trim().length > 0)
    .map((patch) => {
      const firstLine = patch.split('\n')[0] ?? '';
      const match = /^diff --git a\/(.+) b\/(.+)$/.exec(firstLine);
      const oldPath = match?.[1];
      const filePath = match?.[2] ?? oldPath ?? 'unknown';
      return { filePath, oldPath: oldPath === filePath ? undefined : oldPath, patch };
    });
}

function parseUntrackedPaths(output: string): string[] {
  return output.split('\n')
    .map((line) => line.trim())
    .filter((filePath) => filePath.length > 0 && !filePath.startsWith('.runs/'));
}

async function buildUntrackedFile(repo: string, filePath: string): Promise<{ summary: GitChangedFileSummary; patch: GitDiffPatch }> {
  const content = await readFile(`${repo}/${filePath}`, 'utf8').catch(() => '');
  const lines = content.length === 0 ? [] : content.split('\n');
  const additions = lines.at(-1) === '' ? lines.length - 1 : lines.length;
  const patchLines = [
    `diff --git a/${filePath} b/${filePath}`,
    'new file mode 100644',
    'index 0000000..0000000',
    '--- /dev/null',
    `+++ b/${filePath}`,
    `@@ -0,0 +1,${additions} @@`,
    ...lines.slice(0, additions).map((line) => `+${line}`),
  ];
  return {
    summary: {
      path: filePath,
      language: inferLanguage(filePath),
      additions,
      deletions: 0,
      status: 'added',
    },
    patch: { filePath, patch: patchLines.join('\n') },
  };
}

function parseNumstatPath(rawPath: string): { filePath: string; oldPath?: string } {
  const renameMatch = /^(.*) \{(.+) => (.+)\}(.*)$/.exec(rawPath);
  if (!renameMatch) return { filePath: rawPath };
  const [, prefix, oldName, newName, suffix] = renameMatch;
  return { oldPath: `${prefix}${oldName}${suffix}`, filePath: `${prefix}${newName}${suffix}` };
}

function mapGitStatus(status: string): GitDiffFileStatus {
  if (status.startsWith('A')) return 'added';
  if (status.startsWith('D')) return 'deleted';
  if (status.startsWith('R')) return 'renamed';
  return 'modified';
}

function inferLanguage(filePath: string): string | undefined {
  const extension = filePath.split('.').pop();
  return extension && extension !== filePath ? extension : undefined;
}

function emptyGitDiffSnapshot(): GitDiffSnapshot {
  return { summary: summarizeGitChangedFiles([]), files: [], patches: [] };
}

async function isGitWorktree(repo: string): Promise<boolean> {
  try {
    const result = await git(repo, ['rev-parse', '--is-inside-work-tree']);
    return result.stdout.trim() === 'true';
  } catch {
    return false;
  }
}

async function git(repo: string, args: string[]) {
  return execFileAsync('git', args, { cwd: repo, maxBuffer: 10 * 1024 * 1024 });
}
