import type { RecentProject } from './projects';

export interface BackendProject {
  id: string;
  name: string;
  path: string;
  openedAt: string;
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
