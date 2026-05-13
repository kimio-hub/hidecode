# Stable Daily-Use Roadmap after Real Diff Review

Goal: move hidecode from GUI-first MVP toward a stable daily-use local AI coding workspace.

## Current baseline

Completed through Milestone J real diff review:
- Chat sessions run through the local backend/orchestrator.
- Server captures real git diff after a run and persists `session.review`.
- Review Workspace can render real backend review data from the latest chat session.
- Review remains safety-first: approve/reject controls are disabled/audit-only.
- One-command local app startup exists through `pnpm app`.

## Next Milestone L — Real project opening and project context persistence

Objective: make the Home/Project Picker stop feeling mock-only and ensure every chat/review session runs against the selected project.

Tasks:
1. Add backend project open/list endpoints coverage for recent project persistence.
2. Wire Home project selection into App state.
3. Pass selected `projectPath` into ChatWorkspace/ChatPanel session creation.
4. Show selected project/branch in sidebar/status bar.
5. Add tests for `Open project -> Chat -> backend session projectPath`.

Acceptance:
- A user can choose/open a project in the GUI and subsequent chat sessions use that path.
- The selected project survives mode switches into Review.

## Next Milestone M — Live run updates via polling/SSE

Objective: make tool execution feel live instead of request/response snapshot-only.

Tasks:
1. Add a frontend session-event subscription adapter with SSE if available and polling fallback.
2. Update ChatPanel status and RightInspector as events arrive.
3. Keep composer disabled during active run and expose a safe disabled Stop placeholder until cancellation exists.
4. Add tests for incremental event updates.

Acceptance:
- During a run, the right inspector updates with tool/runtime events before the final response completes.

## Next Milestone N — Approval audit API before apply

Objective: make approve/reject real audit actions while still not applying mutations automatically.

Tasks:
1. Add server endpoints: `POST /api/sessions/:id/approvals/:approvalId/approve|reject`.
2. Persist approval status and append `approval.resolved` event.
3. Enable Review approve/reject buttons only when a backend approval is pending.
4. Keep actual apply/commit/test gated for the following milestone.

Acceptance:
- User can approve/reject a pending review and see the audit trail update.

## Later Milestone O — Apply/test/finalize loop

Objective: after approval, run tests/finalization safely and report final status.

Tasks:
1. Define explicit apply/finalize command policy.
2. Run configured test command after approval.
3. Persist final result and show it in Review/Chat.
4. Keep git commit optional and explicit.

Acceptance:
- Approved changes can be validated, with test results visible in the GUI.

## Verification standard

Before every commit:
```bash
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

For UI/backend milestones, run a read-only reviewer before commit and fix REQUEST_CHANGES blockers.
