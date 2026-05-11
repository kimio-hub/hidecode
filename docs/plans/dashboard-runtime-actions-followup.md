# Dashboard Runtime Actions Follow-up Plan

**Goal:** Move the Dashboard control shell from purely visible disabled affordances toward a safe, auditable runtime-action contract without enabling browser-side mutation prematurely.

## Current state

Completed in the previous cycle:
- Dashboard runtime actions are modeled as pure disabled `DashboardActionIntent` values.
- Approval Queue, Replay Debug, Multi-Agent Board, and Command Dock buttons expose disabled reasons via `title` and `aria-description`.
- `docs/DASHBOARD_RUNTIME_ACTIONS.md` documents the current read-only boundary and future backend constraints.
- Full repo verification passed before commit.

## Task 1: Define runtime action request/response contract types

**Objective:** Add a typed contract for future backend runtime actions while keeping execution disabled.

**Files:**
- Modify: `apps/dashboard/src/data/actions.ts`
- Modify: `apps/dashboard/src/data/actions.test.ts`
- Modify: `docs/DASHBOARD_RUNTIME_ACTIONS.md`

**Behavior:**
- Define serializable request types for approval, replay, agent, and command actions.
- Include `actionId`, `domain`, `action`, optional `targetId`, and optional operator-provided text for command-style actions.
- Define response/status types such as `queued`, `accepted`, `rejected`, `failed` without wiring any network calls.
- Add tests that requests are derived only from explicit `DashboardActionIntent` values and never include secrets or trace payload blobs.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test -- src/data/actions.test.ts
pnpm --filter @world-harness/dashboard typecheck
```

## Task 2: Add read-only action event preview helpers

**Objective:** Prepare an auditable preview of what would be traced when an action is eventually submitted.

**Files:**
- Modify: `apps/dashboard/src/data/actions.ts`
- Modify: `apps/dashboard/src/data/actions.test.ts`
- Optional modify: `docs/DASHBOARD_RUNTIME_ACTIONS.md`

**Behavior:**
- Add a pure helper that produces a redacted trace preview for a disabled action attempt, e.g. `dashboard.action.preview`.
- Include only domain/action/target id and disabled reason.
- Exclude credentials, full command text unless explicitly sanitized, and full trace payloads.

## Task 3: UI readiness indicators for action backend absence

**Objective:** Make the disabled backend boundary clearer without adding mutation.

**Files:**
- Modify: `apps/dashboard/src/ui/Dashboard.tsx`
- Modify: `apps/dashboard/src/ui/__tests__/Dashboard.test.tsx`
- Optional component-level tests if useful.

**Behavior:**
- Add a small read-only “Runtime backend: offline/not connected” indicator near Command Dock or header.
- It should be static for now and not probe network endpoints.
- Tests assert the indicator and that action buttons remain disabled.

## Full verification

```bash
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

## Review

Before commit, run an independent read-only reviewer focused on:
- no browser-side mutation or shell execution,
- no secret-bearing payloads,
- contract consistency with docs,
- tests proving disabled/read-only behavior.
