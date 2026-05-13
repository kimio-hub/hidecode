# Milestone L Slice — Selected project context into chat sessions

Objective: make the Home project picker drive the project context used by new Chat sessions.

Scope for this slice:
1. Keep existing backend project endpoints as the persistence foundation.
2. Add frontend project open/list adapters for `/api/projects`.
3. Let Home recent-project cards select/open a project and move into Chat mode.
4. Store the selected project in App state, show it in sidebar/status bar, and pass its `path` into `ChatWorkspace -> ChatPanel -> createBackendSession`.
5. Add regression coverage for `Home project click -> Chat submit -> POST /api/projects/open -> POST /api/sessions` using the selected `projectPath`.

Out of scope for this slice:
- Native folder picker / file dialog.
- Branch detection from git.
- Live recent-project loading from backend on initial app load.
- Approval/apply mutations.

Acceptance:
- Clicking a recent project opens Chat with that project selected.
- The first backend session creation receives the selected project path.
- Sidebar/status bar display selected project context.
