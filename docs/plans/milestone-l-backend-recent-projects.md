# Milestone L Slice — Backend recent projects on Home

Objective: make the Home project picker use backend persisted recent projects when available, while preserving mock fallback for demo/offline launches.

Scope:
1. Add frontend `listBackendProjects()` adapter for `GET /api/projects`.
2. Map backend project records into the existing `RecentProject` UI shape.
3. Let `App` load recent projects on mock/default app startup using the configured `api` query param.
4. Pass loaded projects into `HomePage -> RecentProjectsPanel`.
5. On backend list failure or empty results, keep the current mock `recentProjects` so the Home screen remains useful offline.
6. Cover both backend-loaded and fallback behavior with tests.

Out of scope:
- Native folder picker.
- Editing/removing project records.
- Branch detection.
- Background refresh/polling of project records.

Acceptance:
- `GET /api/projects` results appear on Home.
- Clicking a backend-loaded project still opens it and creates chat sessions with that path.
- Offline/mock fallback remains unchanged.
