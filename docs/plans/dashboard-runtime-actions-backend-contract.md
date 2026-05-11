# Dashboard Runtime Actions Backend Contract Next Slice

> **For Hermes:** Continue autonomous loop on branch `main`. Start with `git status/log`. If clean, use up to 3 agents by file boundary: one implementer for pure contract/schema utilities, one test/fixture agent for smoke fixtures/docs, one read-only reviewer. Do not create cron/jobs. Do not read secrets. Do not enable browser-side mutations until the backend contract is covered by tests.

## Completed before this plan

- Runtime action request/response/audit shapes exist in `apps/dashboard/src/data/actions.ts`.
- Dashboard renders runtime readiness as `Offline` / `Preview only` / `Ready` indicators with tone/detail.
- Command Dock shows a readable runtime action preview, e.g. `command.ask-harness → command`.
- Online-but-contract-incompatible readiness is normalized to non-submittable preview-only copy.
- All runtime controls remain disabled/read-only.

## Next small implementation slice

### Task 1: Extract a pure backend contract validator

**Files:**

- `apps/dashboard/src/data/actions.ts`
- `apps/dashboard/src/data/actions.test.ts`

**Behavior:**

- Add pure validation/normalization helpers for runtime action backend responses, without network calls:
  - `normalizeRuntimeActionResponse(input: unknown): RuntimeActionResponse | undefined` or equivalent.
  - Accept only `status: accepted | rejected | duplicate`, boolean `accepted`, non-empty `commandId`, non-empty `traceEventId`.
  - Preserve optional `reason` and `queuedOperationId` only when strings.
  - Reject malformed shapes safely instead of throwing.
- Add tests for accepted/rejected/duplicate responses and malformed payloads.
- Keep helpers browser-safe and side-effect-free.

### Task 2: Document API ownership and no-mutation boundary

**Files:**

- `docs/plans/dashboard-runtime-actions-backend-contract.md` or a follow-up plan file.

**Behavior:**

- Define provisional endpoints:
  - `GET /api/dashboard/runtime-actions/readiness`
  - `POST /api/dashboard/runtime-actions`
- Document idempotency via `clientRequestId`, sanitized audit trace events, and no secret exposure.
- Explicitly state Dashboard must not call these endpoints until fixtures/tests cover the contract and a runtime service owner exists.

### Task 3: Read-only review focus

Ask reviewer to check:

- No browser mutation/fetch/timer side effects were added.
- Malformed backend payloads cannot enable controls.
- Contract helpers align with existing `RuntimeActionRequest`, `RuntimeActionResponse`, and `RuntimeActionAuditEvent` shapes.

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
- Do not add frontend fetch/socket calls yet.
- Do not implement backend service routes in this slice.
- Do not store or expose secrets in requests, responses, traces, fixtures, or docs.
