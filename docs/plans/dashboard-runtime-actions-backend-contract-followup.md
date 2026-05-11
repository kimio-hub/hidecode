# Dashboard Runtime Actions Backend Contract Follow-up

> **For Hermes:** Continue autonomous loop on branch `main`. Start with `git status/log`. Do not create cron/jobs. Do not read secrets. Do not edit implementation files outside the scoped files for the selected slice. Keep all Dashboard runtime action controls disabled/read-only and do not add browser fetch/socket/timer mutations.

## Completed before this follow-up

- Runtime action request, response, readiness, and audit event shapes exist in `apps/dashboard/src/data/actions.ts`.
- Response normalization is the current/just-finished smallest implementation slice: malformed backend payloads should be rejected safely and must not enable controls.
- `docs/plans/dashboard-runtime-actions-backend-contract.md` documents the provisional backend ownership contract for:
  - `GET /api/dashboard/runtime-actions/readiness`
  - `POST /api/dashboard/runtime-actions`
- The contract documents `clientRequestId` idempotency, sanitized audit trace events, no secret exposure, and the Dashboard no-call boundary.

## Current safety boundary

The Dashboard must not call the provisional endpoints yet. There is still no named runtime service owner, no backend route implementation, and no fixture/service coverage proving readiness/response/idempotency/audit behavior. The browser remains preview-only and must not submit runtime mutations.

## Next smallest safe slice after response normalization

### Task 1: Add contract fixtures for normalized backend payloads

**Files:**

- `apps/dashboard/src/data/actions.test.ts`
- Optional new fixture file under the dashboard test/fixture area if an existing convention is found.

**Behavior:**

- Add side-effect-free fixtures for the provisional contract only; do not add fetches or route handlers.
- Cover readiness payloads:
  - valid online contract-compatible readiness
  - preview-only or contract-incompatible online readiness
  - offline/not-configured readiness
  - malformed readiness that normalizes safe
- Cover action responses:
  - accepted requires `accepted: true`
  - rejected with sanitized reason requires `accepted: false`
  - duplicate with stable `commandId`/`traceEventId` requires `accepted: false`
  - malformed response rejected by normalization
- Include explicit secret-redaction examples using fake sentinel strings only, never real secrets.
- Assert fixtures do not enable controls or produce submission side effects.

**TDD:**

1. Add failing tests around the fixture payloads and existing normalization helpers.
2. Add only pure fixture/helper updates required to make the tests pass.
3. Verify no browser mutation path, fetch, socket, timer, storage write, shell call, or backend route was introduced.

### Task 2: Identify runtime service owner candidates without implementing routes

**Files:**

- Update this follow-up plan or create a more specific backend-owner plan under `docs/plans/`.

**Behavior:**

- Inspect repository package boundaries and existing API/server ownership docs.
- Record candidate service/package(s) for owning:
  - readiness endpoint
  - runtime action submission endpoint
  - idempotency persistence keyed by `clientRequestId`
  - authorization, policy, sandbox, and budget checks
  - sanitized audit trace emission
- If no owner is obvious, document that the owner remains unassigned and keep the Dashboard no-call boundary in force.
- Do not create backend routes in this slice.

### Task 3: Read-only review focus

Ask reviewer to check:

- Fixtures are fake/sanitized and contain no secrets.
- Runtime action controls remain disabled and read-only.
- No browser network calls or mutation side effects were added.
- Malformed readiness/responses still normalize safe.
- The no-call boundary remains explicit until fixtures/tests and a runtime service owner exist.

## Verification commands

```bash
pnpm --filter @world-harness/dashboard test -- --run src/data/actions.test.ts src/ui/__tests__/Dashboard.test.tsx
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
- Do not add frontend fetch/socket/timer calls.
- Do not implement backend service routes.
- Do not create persistence tables, queues, jobs, cron tasks, or background workers.
- Do not store or expose secrets in requests, responses, traces, fixtures, tests, or docs.
