# Dashboard Runtime Actions Next Plan

> **For Hermes:** Continue with subagent-driven-development. Keep tasks small, TDD-first, and verify full repo before push.

**Goal:** Move the Dashboard from richer read-only trace display toward safe runtime action readiness without adding mutating backend behavior prematurely.

## Current state

Completed in the previous cycles:
- Shared trace normalization helpers are used by Tool Timeline, Replay Debug, Approval Queue, Agent Board, Evidence, and Diff surfaces where relevant.
- Dashboard has integration coverage for rich orchestrator-style traces and exact current lean orchestrator traces.
- EvidencePanel surfaces current `tool.finished` errors/output/evidence.
- DiffPanel surfaces current `file.changed` events and legacy diff/write-file events.
- Header counts requested-only tool activity without over-counting a normal requested/started/finished lifecycle.
- Full verification passed: `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm smoke`.

Remaining design gap:
- Mission Control actions (Approve/Reject, Replay/Fork/Save Eval, Assign/Handoff/Unblock, Ask Harness) are still disabled placeholders. The next safe step is to define explicit action-intent models and read-only/disabled-state behavior before introducing any backend mutation API.

## Task 1: Extract Dashboard action-intent model

**Files:**
- Create: `apps/dashboard/src/data/actions.ts`
- Create: `apps/dashboard/src/data/actions.test.ts`

**Behavior:**
- Define a pure `DashboardActionIntent` model for current disabled/future actions, including:
  - approval actions: approve/reject an approval queue item,
  - replay actions: replay/fork/save-eval a replay step or run,
  - agent actions: assign/handoff/unblock,
  - command action: ask harness from command dock.
- Include capability/status fields such as `enabled`, `reason`, `requiresBackend`, and optional `targetId`.
- Default all runtime-mutating actions to disabled with clear reasons until a backend API exists.
- Keep helpers pure and browser-safe.

**TDD:**
1. Add failing tests for disabled approval/replay/agent/command intents and reason text.
2. Implement minimal pure helpers.
3. Run `pnpm --filter @world-harness/dashboard test -- src/data/actions.test.ts` and typecheck.

## Task 2: Wire disabled action reasons into UI buttons

**Files:**
- Modify: `apps/dashboard/src/ui/components/ApprovalQueue.tsx`
- Modify: `apps/dashboard/src/ui/components/ReplayDebug.tsx`
- Modify: `apps/dashboard/src/ui/components/MultiAgentBoard.tsx`
- Modify if needed: `apps/dashboard/src/ui/Dashboard.tsx`
- Add/modify focused UI tests.

**Behavior:**
- Preserve all buttons as disabled.
- Add accessible `title` or `aria-label` reason text from the shared action-intent helpers.
- Keep visual layout stable.
- Do not introduce real mutations/network calls.

**TDD:**
1. Add failing UI assertions that disabled action buttons expose reason text.
2. Implement minimal wiring.
3. Run focused UI tests and Dashboard package verification.

## Task 3: Document runtime action API boundary

**Files:**
- Create or modify: `docs/DASHBOARD_RUNTIME_ACTIONS.md`
- Optionally link from existing Dashboard docs.

**Behavior:**
- Document which actions are currently read-only placeholders.
- Define the future backend boundary at a high level: approval resolution, replay/fork, agent assignment/handoff/unblock, command submission.
- Explicitly state security constraints: no secret exposure, no implicit local filesystem writes, approval required for mutating/shell actions.

## Verification

Run before commit:
```bash
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

Review:
- Run an independent read-only code review before commit.

Suggested commit:
```bash
git add apps/dashboard docs
 git commit -m "feat(dashboard): model runtime action intents"
git push origin main
```
