# Dashboard Runtime Actions Backend Contract Follow-up Plan

> **For Hermes:** Continue the autonomous loop: assess current state, implement one small TDD slice, verify dashboard + full repo, run read-only review, commit/push, then update the next plan. Do not create cron/jobs.

## Current state

Completed in recent cycles:
- Shared trace normalization helpers are used across Tool Timeline, Replay Debug, Approval Queue, and real orchestrator dashboard fixtures.
- Runtime controls are modeled as pure disabled `DashboardActionIntent` values.
- Action intents include explicit `target.kind` metadata (`approval`, `replay-step`, `run`, `agent`, `command`).
- `toRuntimeActionRequest(intent, clientRequestId)` now projects disabled intents into a pure future backend request envelope without network calls.
- `docs/DASHBOARD_RUNTIME_ACTIONS.md` documents the base request envelope and current read-only boundary.
- Full verification passed after the request helper: dashboard test/typecheck/build plus repo `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm smoke`.

## Remaining design gap

The request envelope now exists, but backend response/event shapes and endpoint-specific payload semantics are still high-level. The next step should make the contract precise enough that a future backend implementation can be tested without changing browser behavior.

## Task 1: Add typed runtime action response/event contracts

**Files:**
- Modify: `apps/dashboard/src/data/actions.ts`
- Modify: `apps/dashboard/src/data/actions.test.ts`

**Behavior:**
- Add pure TypeScript interfaces for a future backend response, e.g. `RuntimeActionResponse` with:
  - `accepted: boolean`
  - `status: 'accepted' | 'rejected' | 'queued'`
  - `traceEventId?: string`
  - `reason?: string`
- Add a trace/audit event envelope type or helper describing accepted/rejected action attempts.
- Keep everything side-effect-free; no fetch/network calls.

**TDD:**
1. Add failing tests for accepted and rejected response/audit shapes.
2. Implement minimal types/helpers.
3. Run `pnpm --filter @world-harness/dashboard test -- src/data/actions.test.ts` and dashboard typecheck.

## Task 2: Tighten request target semantics

**Files:**
- Modify: `apps/dashboard/src/data/actions.ts`
- Modify: `apps/dashboard/src/data/actions.test.ts`

**Behavior:**
- Consider making `RuntimeActionRequest` a discriminated union keyed by `domain` to mirror `DashboardActionIntent`.
- Preserve current builder ergonomics.
- Add coverage for target omission where intended, such as run-level replay actions.

## Task 3: Document endpoint-level backend seam

**Files:**
- Modify: `docs/DASHBOARD_RUNTIME_ACTIONS.md`

**Behavior:**
- Specify proposed endpoints or command/event envelopes for:
  - approval approve/reject
  - replay/fork/save-eval
  - agent assign/handoff/unblock
  - ask-harness command submission
- Include idempotency, no-secret payload requirement, server-side policy/sandbox/budget checks, and trace event emission for accepted/rejected attempts.
- State again that current browser UI remains read-only until backend support exists.

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
