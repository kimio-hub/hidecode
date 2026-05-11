# Dashboard Runtime Actions Readiness/Offline Indicator Follow-up

> **For Hermes:** Continue the autonomous loop on branch `main`: assess current state, use up to 3 subagents when the worktree is clean, implement one small TDD slice, verify dashboard + full repo, run read-only review, commit/push, then update the next plan. Do not create cron/jobs. Do not enable browser-side mutations until backend contract tests exist.

## Completed in this cycle

- Added a pure Dashboard runtime action readiness model in `apps/dashboard/src/data/actions.ts`.
- Added safe default readiness: `not-configured`, `canSubmitActions: false`.
- Added shared copy helper `runtimeActionReadinessMessage(...)`.
- Surfaced a read-only Mission Control/Command Dock readiness status with `role="status"` and `aria-label="Runtime action readiness"`.
- Kept all runtime action controls disabled: approvals, replay/fork/save-eval, agent controls, and Ask Harness.
- Added focused data and dashboard UI tests for readiness/offline behavior.

## Current safety boundary

The Dashboard still has no runtime action fetches, sockets, timers, shell execution, or browser-side mutations. Readiness is a fixture/default model only. `online` readiness is modeled for the future contract but must not enable buttons until backend contract tests pass.

## Next small implementation slice

### Task 1: Add a pure readiness normalization helper

**Files:**

- `apps/dashboard/src/data/actions.ts`
- `apps/dashboard/src/data/actions.test.ts`

**Behavior:**

- Add `normalizeRuntimeActionReadiness(input?: Partial<DashboardRuntimeActionReadiness>): DashboardRuntimeActionReadiness`.
- Preserve safe default when input is absent.
- Force `canSubmitActions: false` for `not-configured`, `offline`, and `preview-only` even if a fixture accidentally sets it true.
- Permit `canSubmitActions: true` only for `online` with `contractVersion: 'dashboard-runtime-actions.v1'`.
- Keep the helper pure: no network, storage, timers, shell, or mutation side effects.

**TDD:**

1. Add tests for unsafe incoherent states being normalized safe.
2. Add tests for contract-compatible online readiness staying submit-capable.
3. Run focused actions tests, dashboard test suite, typecheck, build.

### Task 2: Thread readiness through Dashboard props without enabling actions

**Files:**

- `apps/dashboard/src/ui/Dashboard.tsx`
- `apps/dashboard/src/ui/__tests__/Dashboard.test.tsx`

**Behavior:**

- Add optional `runtimeActionReadiness?: DashboardRuntimeActionReadiness` prop to `Dashboard`.
- Default to normalized safe readiness.
- Render shared `runtimeActionReadinessMessage(...)` for the provided fixture.
- Add a test with `preview-only` readiness showing preview copy while `Ask Harness` remains disabled.
- Do not make readiness influence button disabled state yet.

### Task 3: Plan backend contract ownership

Before enabling fetches, identify the backend/service package for:

- `GET /api/dashboard/runtime-actions/readiness`
- `POST /api/dashboard/runtime-actions`
- accepted/rejected/duplicate/idempotent responses
- sanitized audit trace events with no secrets

Create/update a plan only; do not implement browser mutations in this slice.

## Verification commands

```bash
pnpm --filter @world-harness/dashboard test -- src/data/actions.test.ts
pnpm --filter @world-harness/dashboard test -- src/ui/__tests__/Dashboard.test.tsx
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

## Non-goals

- Do not enable runtime action submission from the browser.
- Do not add backend mutations before contract tests exist.
- Do not read secrets or include secrets in fixtures.
- Do not let `online` fixture state enable UI controls yet.
