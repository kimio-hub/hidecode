# Dashboard Runtime Actions Backend Contract Plan

> **For Hermes:** Continue on `/root/world-harness` branch `main`. Use up to 3 subagents when clean. Keep browser actions disabled until backend contract tests and sanitized audit traces exist. Do not create cron/jobs or read secrets.

## Completed before this plan

- Runtime action intents now carry explicit domain/action/target metadata.
- Runtime action request/response/audit-event TypeScript contract exists in `apps/dashboard/src/data/actions.ts`.
- Runtime action readiness model exists with safe normalization:
  - absent readiness => `not-configured`, `canSubmitActions: false`
  - `not-configured`/`offline`/`preview-only` => forced non-submittable
  - `online` may submit only with `contractVersion: 'dashboard-runtime-actions.v1'`
- Dashboard can render provided readiness fixtures while all controls remain disabled.

## Next small implementation slice

### Task 1: Add backend contract fixture module

**Files:**

- `apps/dashboard/src/data/runtimeContract.ts`
- `apps/dashboard/src/data/runtimeContract.test.ts`

**Behavior:**

- Define exported constants for endpoint paths:
  - `RUNTIME_ACTION_READINESS_ENDPOINT = '/api/dashboard/runtime-actions/readiness'`
  - `RUNTIME_ACTION_SUBMIT_ENDPOINT = '/api/dashboard/runtime-actions'`
- Define pure validators/guards for backend payloads:
  - `isRuntimeActionReadinessPayload(value): value is DashboardRuntimeActionReadiness`
  - `isRuntimeActionResponsePayload(value): value is RuntimeActionResponse`
- Reuse existing types from `actions.ts`; do not duplicate contracts.
- Reject malformed payloads, unknown statuses, missing command/trace ids, or readiness without known states.
- No fetch/browser mutation implementation yet.

**TDD:**

1. Add tests for valid readiness and response payloads.
2. Add tests rejecting malformed/unknown/partial payloads.
3. Run focused tests and dashboard package verification.

### Task 2: Document backend ownership boundary

**Files:**

- `docs/plans/dashboard-runtime-actions-backend-contract.md` (this file)

**Behavior:**

- Keep Dashboard read-only until backend/service package exposes contract-tested endpoints.
- Future implementation owner should add server-side tests before any browser fetch wiring.
- Audit event emission must sanitize reasons/output and never include secrets.

## Verification commands

```bash
pnpm --filter @world-harness/dashboard test -- src/data/runtimeContract.test.ts
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

## Non-goals

- Do not add browser fetch calls.
- Do not enable approval/replay/agent/command buttons.
- Do not implement backend routes in Dashboard.
- Do not include real secrets in fixtures, logs, audit events, or docs.
