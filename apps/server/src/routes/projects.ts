import type { JsonStore } from '../storage.js';
import { jsonResponse, readJsonObject } from '../http.js';

export interface ProjectRecord {
  id: string;
  name: string;
  path: string;
  openedAt: string;
}

interface ProjectsFile {
  projects: ProjectRecord[];
}

export async function listProjects(store: JsonStore): Promise<ProjectRecord[]> {
  const file = await store.readJson<ProjectsFile>(store.projectFile(), { projects: [] });
  return file.projects;
}

export async function handleListProjects(store: JsonStore): Promise<Response> {
  return jsonResponse({ projects: await listProjects(store) });
}

export async function handleOpenProject(store: JsonStore, request: Request): Promise<Response> {
  const body = await readJsonObject(request);
  const path = typeof body.path === 'string' ? body.path.trim() : '';
  if (!path) {
    return jsonResponse({ error: 'project_path_required' }, { status: 400 });
  }

  const name = typeof body.name === 'string' && body.name.trim().length > 0
    ? body.name.trim()
    : path.split('/').filter(Boolean).at(-1) ?? path;
  const projects = await listProjects(store);
  const openedAt = new Date().toISOString();
  const project: ProjectRecord = {
    id: encodeProjectId(path),
    name,
    path,
    openedAt,
  };
  const nextProjects = [project, ...projects.filter((candidate) => candidate.path !== path)];
  await store.writeJson(store.projectFile(), { projects: nextProjects });

  return jsonResponse({ project }, { status: 201 });
}

function encodeProjectId(path: string): string {
  return Buffer.from(path).toString('base64url');
}
