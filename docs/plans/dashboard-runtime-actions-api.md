# Dashboard Runtime Actions API Next Plan

## Current state

Completed in this documentation slice:

- `docs/DASHBOARD_RUNTIME_ACTIONS.md` now documents a concrete proposed backend seam for Dashboard runtime actions.
- The proposal includes a shared command envelope, optional resource-specific endpoints, response shape, and trace event shape.
- Approval resolution, replay/fork/save-eval, agent assignment/handoff/unblock, and ask-harness command submission each have proposed endpoint and command payload examples.
- Security requirements are explicit: no secrets in payloads, server-side policy/sandbox/budget checks, idempotency keys for mutating actions, and auditable trace events for accepted/rejected/duplicate attempts.
- The current browser UI remains documented as read-only/disabled until backend support exists.

## Remaining gap

The API seam is documentation-only. Implementation still should not enable browser-side mutations until backend contracts, policy enforcement, persistence, and tests exist.

## Task 1: Review and approve runtime command contract

**Files:**

- Modify if needed: `docs/DASHBOARD_RUNTIME_ACTIONS.md`

**Behavior:**

- Decide whether the backend should expose a single `POST /api/dashboard/runtime-actions` command bus, resource-specific endpoints, or both.
- Confirm canonical names for `commandId`, `clientRequestId`, trace event ids, and queued operation ids.
- Confirm accepted/rejected/duplicate response semantics and idempotent retry behavior.

## Task 2: Add side-effect-free TypeScript contract types

**Files:**

- Modify: `apps/dashboard/src/data/actions.ts`
- Modify: `apps/dashboard/src/data/actions.test.ts`

**Behavior:**

- Add pure type definitions for the documented command, response, and trace event envelopes.
- Keep all controls disabled and avoid fetch/network calls.
- Add tests that construct approval, replay, agent, and command envelopes without mutating state.

## Task 3: Backend implementation planning

**Files:**

- Create or update a backend-specific plan under `docs/plans/` once the responsible service/package is identified.

**Behavior:**

- Identify the backend package that will own runtime action authorization, idempotency storage, policy/sandbox/budget checks, and trace event emission.
- Define persistence requirements for command ids and trace event linkage.
- Define integration tests for accepted, rejected, and duplicate action attempts before enabling Dashboard fetches.

## Verification for future implementation slices

```bash
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

Run a read-only review before any commit/push in future implementation tasks.
