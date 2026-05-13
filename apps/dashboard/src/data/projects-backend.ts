import type { RecentProject } from './projects';

export interface BackendProject {
  id: string;
  name: string;
  path: string;
  openedAt: string;
}

export async function listBackendProjects(baseUrl = ''): Promise<BackendProject[]> {
  const response = await fetch(`${baseUrl}/api/projects`, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Failed to list projects: ${response.status}`);
  const body = await response.json() as { projects: BackendProject[] };
  return body.projects;
}

export function backendProjectToRecentProject(project: BackendProject): RecentProject {
  return {
    id: project.id,
    name: project.name,
    path: project.path,
    description: 'Recently opened project',
    lastOpened: formatOpenedAt(project.openedAt),
  };
}

export async function openBackendProject(project: Pick<RecentProject, 'name' | 'path'>, baseUrl = ''): Promise<BackendProject> {
  const response = await fetch(`${baseUrl}/api/projects/open`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: project.name, path: project.path }),
  });
  if (!response.ok) throw new Error(`Failed to open project: ${response.status}`);
  const body = await response.json() as { project: BackendProject };
  return body.project;
}

function formatOpenedAt(openedAt: string): string {
  if (!openedAt) return 'Recently';
  return 'Recently';
}
