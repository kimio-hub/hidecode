# Dashboard Runtime Actions Readiness/Offline Indicator Next Plan

> **For Hermes:** Continue the autonomous loop on branch `main`: assess current state, use up to 3 subagents when the worktree is clean, implement one small TDD slice, verify dashboard + full repo, run read-only review, commit/push, then update the next plan. Do not create cron/jobs.

## Goal

Advance Dashboard runtime actions from a documented request/response/audit contract toward a safe operator-facing readiness signal, without enabling browser-side mutations. The next implementable slice should make it obvious when runtime actions are unavailable because the backend is missing, offline, or preview-only, while keeping all action buttons disabled until backend contract tests exist.

## Current state

Completed in recent cycles:

- Runtime controls are modeled as pure disabled `DashboardActionIntent` values in `apps/dashboard/src/data/actions.ts`.
- Intents include explicit target metadata for approval, replay-step/run, agent, and command targets.
- `toRuntimeActionRequest(intent, clientRequestId)` projects disabled intents into a pure future backend request envelope without network calls and always emits `requiresBackend: true`.
- `RuntimeActionResponse` and `toRuntimeActionAuditEvent(...)` model side-effect-free accepted/rejected/duplicate backend responses and sanitized dashboard runtime action audit events.
- Runtime response statuses are canonicalized to `accepted | rejected | duplicate`; queued work is represented with optional `queuedOperationId`, not a separate `queued` status.
- `docs/DASHBOARD_RUNTIME_ACTIONS.md` documents the proposed backend API seam, shared command envelope, response shape, trace/audit event shape, idempotency expectations, and security constraints.
- The browser UI remains read-only/disabled until backend support and integration tests exist.

## Remaining gap

Operators currently see disabled action controls, but there is no explicit Dashboard-level runtime readiness/offline model that explains whether action execution is unavailable because:

1. No runtime action backend is configured.
2. A configured backend is offline or unhealthy.
3. The backend is online but action execution is still policy-gated or preview-only.

Before wiring mutating requests, add a small, side-effect-free readiness/preview layer that can be fixture-tested and later backed by a real health endpoint.

## Task 1: Add a pure runtime action readiness model

**Files:**

- Modify: `apps/dashboard/src/data/actions.ts`
- Modify: `apps/dashboard/src/data/actions.test.ts`

**Behavior:**

- Add a typed readiness/status model, for example:
  - `state: 'not-configured' | 'offline' | 'online' | 'preview-only'`
  - `canSubmitActions: boolean`
  - `reason: string`
  - optional `checkedAt`, `backendVersion`, `contractVersion`, and `lastError` fields.
- Keep the default state safe: no backend configured, `canSubmitActions: false`.
- Expose a pure helper that converts readiness into operator copy for disabled controls or a banner, e.g. `runtimeActionReadinessMessage(status)`.
- Do not add `fetch`, sockets, mutation calls, timers, local file writes, or shell execution.
- Preserve existing disabled button behavior.

**TDD:**

1. Add failing unit tests for default/not-configured, offline, online-but-preview-only, and online/contract-compatible readiness states.
2. Implement the minimal pure types/helpers.
3. Verify the existing action intent/request/response/audit tests still pass.

## Task 2: Surface readiness in Dashboard UI without enabling actions

**Files:**

- Modify only if needed: Dashboard UI component(s) that already render runtime controls.
- Prefer a small display-only banner/component over changing button behavior.

**Behavior:**

- Render a clear read-only status such as "Runtime actions unavailable: backend not configured" or "Runtime actions preview only".
- Keep all current action controls disabled regardless of an `online` readiness fixture until backend submission tests exist.
- Reuse shared readiness copy so Approval Queue, Replay Debug, Agent Board, and Command Dock do not drift.
- Avoid introducing real network calls in this slice.

**TDD / smoke coverage:**

1. Add or update a focused dashboard unit/component test that asserts the status copy appears.
2. Add fixture-only coverage if a non-conflicting dashboard fixture file already exists; otherwise keep the slice in unit tests.
3. Run dashboard tests/typecheck/build.

## Task 3: Backend contract test plan before enabling fetches

**Files:**

- Create or update under `docs/plans/` only if backend package ownership is still unclear.
- Later implementation files should be limited to the identified backend service/package and dashboard tests.

**Behavior:**

Before browser fetches are enabled, add backend contract tests for:

- `GET /api/dashboard/runtime-actions/readiness` or equivalent health/contract endpoint.
- `POST /api/dashboard/runtime-actions` accepted response with trace event linkage.
- Rejected response for authorization/policy/sandbox/budget failure with sanitized reason.
- Duplicate/idempotent retry response for repeated `commandId`/`clientRequestId`.
- No-secret payload validation for approval, replay/fork/save-eval, agent, and ask-harness domains.

Suggested readiness endpoint response:

```ts
interface DashboardRuntimeActionReadiness {
  state: 'not-configured' | 'offline' | 'online' | 'preview-only';
  canSubmitActions: boolean;
  contractVersion: 'dashboard-runtime-actions.v1';
  reason?: string;
  checkedAt: string;
  backendVersion?: string;
}
```

`canSubmitActions` must remain `false` unless the backend has passed auth, policy, sandbox, budget, idempotency, and trace/audit contract tests.

## Verification for the next implementation slice

```bash
pnpm --filter @world-harness/dashboard test -- src/data/actions.test.ts
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

Run a read-only review before any commit/push in future implementation tasks.

## Non-goals for the next slice

- Do not enable runtime action submission from the browser.
- Do not add backend mutations before contract tests exist.
- Do not read secrets or include secrets in fixtures.
- Do not modify unrelated implementation files while completing the readiness/offline planning slice.
