# Dashboard Runtime Actions API Boundary Follow-up Plan

> **For Hermes:** Continue the autonomous loop: assess current state, implement one small TDD slice, verify dashboard + full repo, run read-only review, commit/push, then update the next plan. Do not create cron/jobs.

**Goal:** Move the Dashboard runtime action model from disabled read-only intents toward a precise future backend API contract without enabling browser-side mutations yet.

## Current state

Completed in recent cycles:
- Shared trace normalization helpers are used across Tool Timeline, Replay Debug, Approval Queue, and real orchestrator dashboard fixtures.
- Runtime controls are modeled as pure disabled `DashboardActionIntent` values.
- UI buttons consume shared action labels/reasons and remain disabled.
- Action intents now include explicit `target.kind` metadata (`approval`, `replay-step`, `run`, `agent`, `command`) so future backend payloads can disambiguate IDs.
- Full verification passed: dashboard test/typecheck/build plus repo `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm smoke`.

## Remaining design gap

`docs/DASHBOARD_RUNTIME_ACTIONS.md` documents the high-level boundary, but the future backend API/event contract is still too vague for implementation. Before adding network calls, define exact request/response/event shapes, idempotency/audit fields, and policy constraints.

## Task 1: Add explicit runtime action request schemas

**Files:**
- Modify: `apps/dashboard/src/data/actions.ts`
- Modify: `apps/dashboard/src/data/actions.test.ts`

**Behavior:**
- Add a pure `toRuntimeActionRequest(intent)` helper or equivalent typed request model.
- For disabled intents, request construction should be explicit and side-effect-free.
- Include fields needed by a future backend: `domain`, `action`, `target`, `requiresBackend`, and optional `clientRequestId` if generated outside the helper.
- Preserve current disabled UI behavior; no fetch/network calls.

**TDD:**
1. Add failing tests for approval/replay/agent/command request shape.
2. Implement minimal pure helper.
3. Run dashboard action tests and typecheck.

## Task 2: Tighten target typing for replay actions

**Files:**
- Modify: `apps/dashboard/src/data/actions.ts`
- Modify: `apps/dashboard/src/data/actions.test.ts`
- Modify if needed: `apps/dashboard/src/ui/components/ReplayDebugger.tsx`

**Behavior:**
- Encode intended target semantics:
  - `replay` may target `replay-step` or `run`.
  - `fork` targets `run`.
  - `save-eval` targets `run`.
- Keep builder ergonomics simple for UI consumers.

**TDD:**
1. Add type-level or runtime tests for target shape.
2. Implement stricter types/builders.
3. Run dashboard tests/typecheck.

## Task 3: Document concrete backend API seam

**Files:**
- Modify: `docs/DASHBOARD_RUNTIME_ACTIONS.md`
- Optional create: `docs/plans/dashboard-runtime-actions-api.md`

**Behavior:**
- Specify proposed endpoints or command/event envelopes for approval resolution, replay/fork/save-eval, agent assignment/handoff/unblock, and ask-harness command submission.
- Include security requirements: no secrets in payloads, policy/sandbox/budget checks server-side, auditable trace events for every accepted/rejected action, idempotency keys for mutating actions.
- State that current browser UI remains read-only until backend support exists.

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
