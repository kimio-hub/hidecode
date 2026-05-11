# Dashboard Runtime Actions Follow-up Plan

> **For Hermes:** Continue the autonomous loop: assess current state, implement one small TDD slice, verify dashboard + full repo, run read-only review, commit/push, then update the next plan.

**Goal:** Move Dashboard read-only runtime controls from well-labeled placeholders toward a safe, typed action boundary while preserving the no-backend/no-mutation behavior in browser-only mode.

**Current state from previous cycles:**
- Real trace normalization helpers are shared by Tool Timeline, Replay, and Approval Queue.
- Dashboard integration fixtures cover orchestrator-style task/tool/approval/sandbox/completion traces.
- Runtime action buttons are disabled with clear backend-unavailable reasons.
- Full repo verification passed after Replay nested output normalization.

---

## Task 1: Extract typed Dashboard action intents

**Objective:** Centralize runtime action semantics behind pure helpers before any backend wiring.

**Files:**
- Create: `apps/dashboard/src/data/runtime-actions.ts`
- Create: `apps/dashboard/src/data/runtime-actions.test.ts`
- Modify if useful: `apps/dashboard/src/data/actions.ts`

**Behavior:**
- Define action intent types for:
  - approval approve/reject
  - replay/fork/save-eval
  - agent assign/handoff/unblock
  - ask-harness command submission
- Export helper(s) that return a disabled action state when no runtime backend is configured:
  - `enabled: false`
  - stable reason matching existing UI copy
  - no side effects
- Preserve current visible disabled behavior.

**TDD:**
1. Add failing unit tests for intent shape and disabled reason.
2. Implement pure helpers.
3. Run dashboard tests/typecheck.

---

## Task 2: Reuse action state in UI buttons

**Objective:** Remove duplicated disabled reason strings and make future backend integration easier.

**Files:**
- Modify: `apps/dashboard/src/ui/components/ApprovalQueue.tsx`
- Modify: `apps/dashboard/src/ui/components/ReplayDebugger.tsx`
- Modify: `apps/dashboard/src/ui/components/AgentBoard.tsx`
- Modify as needed: `apps/dashboard/src/ui/Dashboard.tsx`

**Behavior:**
- Existing buttons remain disabled.
- Titles/aria descriptions remain stable enough for existing tests.
- UI imports central action state instead of hardcoding reason strings in each component.

**TDD:**
1. Existing UI tests should fail only if behavior changes; add focused tests if needed.
2. Implement small refactor.
3. Run dashboard tests/typecheck/build.

---

## Task 3: Document backend action API seam

**Objective:** Make the future runtime backend contract explicit without implementing network calls yet.

**Files:**
- Create or update: `docs/plans/dashboard-runtime-actions-api.md`

**Behavior:**
- Document proposed endpoints or event intents for approvals/replay/agents/ask-harness.
- Note security constraints: no secret exposure, explicit approval for side-effecting runtime calls, trace every action.

---

## Verification

```bash
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

Run an independent read-only review before commit/push.
