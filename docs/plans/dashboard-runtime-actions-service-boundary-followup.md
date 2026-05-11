# Dashboard Runtime Actions Service Boundary Follow-up

> **For Hermes:** Continue autonomous loop on branch `main`. Start with `git status/log`. Do not create cron/jobs. Do not read secrets. Use up to 3 parallel subagents only when the worktree is clean. Keep Dashboard runtime action controls disabled/read-only and do not add browser fetch/socket/timer/storage mutations until a service owner and backend contract tests exist.

## Completed in the previous cycle

- Added provisional backend contract fixtures in `apps/dashboard/src/data/actions.test.ts` for readiness and action responses.
- Hardened `normalizeRuntimeActionReadiness(...)` to accept unknown backend payloads safely, reject unknown readiness states, drop unknown contract versions, and keep unsafe states non-submittable.
- Hardened `normalizeRuntimeActionResponse(...)` fixture behavior with fake sentinel redaction in response reasons.
- Added fake sentinel redaction coverage for readiness `reason` / `lastError` and response `reason` using only `FAKE_SENTINEL_SECRET_DO_NOT_USE_12345`.
- Confirmed fixture consumption is side-effect-free and does not call `fetch`, timers, sockets, storage, shell, or backend routes.
- Created `docs/plans/dashboard-runtime-actions-backend-owner-plan.md` documenting that backend ownership remains unassigned and the Dashboard no-call boundary remains in force.

## Current safety boundary

The Dashboard still must not call:

- `GET /api/dashboard/runtime-actions/readiness`
- `POST /api/dashboard/runtime-actions`

Runtime controls remain preview/read-only until a named runtime API/service owner exists and backend tests prove readiness, submission validation, idempotency, authorization, policy/sandbox/budget checks, and sanitized audit trace behavior.

## Next small implementation slice

### Task 1: Extract shared runtime action contract fixtures

**Files:**

- `apps/dashboard/src/data/actions.test.ts`
- Optional: `apps/dashboard/src/data/actions.fixtures.ts` or a test fixture file if an existing convention is found.

**Behavior:**

- Move inline provisional readiness/action response fixtures into a small named fixture module or local helper block with clear comments that they are fake, sanitized, and side-effect-free.
- Preserve fake sentinel redaction coverage without exporting secrets or implying real backend data.
- Keep malformed/incompatible payloads typed as `unknown`/`Record<string, unknown>` so runtime normalization remains tested.
- Do not introduce fetches, route handlers, sockets, timers, storage writes, shell execution, or enabled controls.

**TDD:**

1. If extracting to a module, keep tests green by first adding coverage that imports/uses the fixture shape.
2. Refactor only after focused tests pass.
3. Run focused `actions.test.ts`, dashboard tests, typecheck, build.

### Task 2: Draft service-boundary contract tests plan

**Files:**

- New or updated docs under `docs/plans/`.

**Behavior:**

- Define the future test matrix for a named runtime service owner before route implementation:
  - readiness unavailable/offline/online contract-compatible
  - accepted/rejected/duplicate/malformed submissions
  - idempotent retry keyed by `clientRequestId`
  - auth/policy/sandbox/budget rejection paths
  - sanitized audit trace event emission
- Keep owner unassigned unless repository boundaries now clearly provide one.
- Do not implement backend routes or persistence in this slice.

### Task 3: Read-only review focus

Ask reviewer to check:

- Fixture extraction keeps payloads fake/sanitized and side-effect-free.
- Runtime controls remain disabled/read-only.
- No browser network or mutation path was added.
- Backend owner/no-call boundary remains explicit.
- Next backend step is contract-test-first, not route-first.

## Verification commands

```bash
pnpm --filter @world-harness/dashboard test -- --run src/data/actions.test.ts
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

## Non-goals

- Do not enable runtime action submission buttons.
- Do not add frontend fetch/socket/timer/storage calls.
- Do not implement backend service routes.
- Do not create persistence tables, queues, jobs, cron tasks, or background workers.
- Do not use real secrets in fixtures, docs, tests, traces, or reports.
