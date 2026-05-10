# Dashboard Trace Loading Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make the dashboard load real `run.json + trace.jsonl` data instead of only rendering hard-coded mock events.

**Architecture:** Keep the current React/Vite dashboard, but introduce a browser-safe loader path driven by query parameters. The dashboard should support mock fallback, `?run=<baseUrl>` for a run directory containing `run.json` and `trace.jsonl`, and `?trace=<traceUrl>&manifest=<runJsonUrl>` for explicit files.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, Testing Library.

---

## Current State

- `apps/dashboard/src/ui/App.tsx` always renders `MOCK_EVENTS` and `MOCK_RUN`.
- `apps/dashboard/src/data/loader.ts` already has URL/file loading helpers, but browser UI does not use them.
- `Dashboard.tsx` expects `RunMeta` from `mock.ts`, while `loader.ts` defines a similar `RunManifest` type.
- Design target is Mission Control v2, but P0 should avoid full UI rewrite. First make the existing UI data-driven.

---

## Phase Plan

### P0: Real Trace Viewer

1. Unify dashboard data types.
2. Add query param parser.
3. Add browser loader state to `App.tsx`.
4. Add loading/error/source indicators.
5. Add tests for mock fallback and URL loading.
6. Verify dashboard tests/typecheck/build.

### P1: Mission Control v2 Layout

Implement the visual structure from the concept image: top status, left nav, task graph, diff, timeline, right inspector, bottom dock.

### P2: Approval Queue

Add approval request model, approval page, policy/risk details, audit trail.

### P3: Replay & Trace Debug

Add replay timeline, selected step inspector, fork-from-step, save-as-eval-case.

### P4: Multi-Agent Board

Add agent state, kanban workflow, ownership, handoffs, blockers.

---

## Task 1: Unify Dashboard Types

**Objective:** Let all dashboard components accept a single shared `TraceEvent` and `RunMeta` shape.

**Files:**
- Modify: `apps/dashboard/src/data/loader.ts`
- Modify: `apps/dashboard/src/data/mock.ts`
- Modify imports in dashboard components if needed.

**Steps:**
1. In `loader.ts`, allow `taskId` to be optional on events because some event schemas may be run-level.
2. Rename or alias `RunManifest` to `RunMeta` for UI use.
3. Keep backward compatibility by exporting `RunManifest = RunMeta` if useful.
4. In `mock.ts`, import types from `loader.ts` instead of declaring duplicate interfaces.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard typecheck
```
Expected: no TS errors.

---

## Task 2: Query Param Parser

**Objective:** Provide deterministic browser query parsing for dashboard data source.

**Files:**
- Create: `apps/dashboard/src/data/query.ts`
- Test: `apps/dashboard/src/data/query.test.ts`

**Behavior:**
- No query params → `{ kind: 'mock' }`
- `?run=/runs/abc` → `{ kind: 'run-url', baseUrl: '/runs/abc' }`
- `?trace=/runs/abc/trace.jsonl&manifest=/runs/abc/run.json` → `{ kind: 'explicit-url', traceUrl, manifestUrl }`
- `?trace=/runs/abc/trace.jsonl` without manifest → load trace and synthesize manifest.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test -- src/data/query.test.ts
```
Expected: tests pass.

---

## Task 3: Browser Loader State in App

**Objective:** Use the parsed query to load real trace data in the browser.

**Files:**
- Modify: `apps/dashboard/src/ui/App.tsx`
- Modify: `apps/dashboard/src/data/loader.ts`
- Test: `apps/dashboard/src/ui/__tests__/App.test.tsx`

**Behavior:**
- On mount, parse `window.location.search`.
- If mock, render mock data immediately.
- If run-url, call `loadRunFromUrl(baseUrl)`.
- If explicit-url, call `loadTraceFromUrl(traceUrl)` and fetch manifest if present.
- Show loading state while fetching.
- Show error state with message and “Using mock data” fallback button or auto fallback.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
```

---

## Task 4: Header Source Indicator

**Objective:** Show whether the dashboard is viewing mock data or a real run source.

**Files:**
- Modify: `apps/dashboard/src/ui/Dashboard.tsx`
- Modify: `apps/dashboard/src/ui/components/Header.tsx`

**Behavior:**
- Display source badge: `Mock`, `Run URL`, or `Trace URL`.
- Display `run.runId` in header in addition to `taskId`.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test
```

---

## Task 5: Full Verification and Commit

**Commands:**
```bash
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

**Commit:**
```bash
git add apps/dashboard docs/DASHBOARD_UI_DESIGN.md docs/plans/dashboard-trace-loading.md
git commit -m "feat(dashboard): load real run traces"
git push origin main
```
