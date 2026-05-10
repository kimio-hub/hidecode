# Dashboard Smoke E2E Baseline Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a lightweight end-to-end baseline proving real CLI run artifacts can be served to the Dashboard and rendered by the read-only trace views.

**Architecture:** Keep the first E2E baseline deterministic and local-only. Reuse the CLI smoke fixture to produce `.runs/run-.../{trace.jsonl,run.json,report.md}`, then add a small script/test that serves the run directory as browser-accessible files and validates the dashboard loader/render path without requiring credentials or a long-lived server.

**Tech Stack:** TypeScript, pnpm workspaces, Vitest, Vite/React Dashboard, existing CLI smoke command.

---

## Evaluation From Previous Cycle

Completed:
- ✅ Dashboard loads real run/trace data.
- ✅ Mission Control v2 shell exists.
- ✅ Read-only Approval Queue exists.
- ✅ Read-only Replay Debug exists.
- ✅ Read-only Multi-Agent Board exists.
- ✅ CLI prints run artifact/dashboard hints after `run` and `smoke`.
- ✅ CLI `inspect`/`replay` now surface Dashboard query hints when a sibling `run.json` exists.
- ✅ Full repo test/typecheck/build/smoke passed before this plan.

Remaining gap:
- `pnpm smoke` proves runtime trace/report generation, but does not yet prove the generated artifacts can flow into the Dashboard real-loader path end-to-end.
- The README documents that the Dashboard needs browser-accessible artifact URLs, but there is no automated baseline covering that workflow.

---

## Task 1: Inspect existing smoke artifact shape and dashboard loader tests

**Objective:** Confirm the exact artifact fields and the most stable test seam before adding E2E coverage.

**Files:**
- Read: `apps/cli/src/index.ts`
- Read: `apps/cli/test/cli.test.ts`
- Read: `apps/dashboard/src/ui/App.tsx`
- Read: `apps/dashboard/src/ui/__tests__/App.test.tsx`
- Read: `packages/core/src/run/artifacts.ts` if needed

**Steps:**
1. Run: `pnpm smoke`.
2. Note the printed `.runs/run-...` directory.
3. Inspect only non-secret generated files under that run directory: `trace.jsonl`, `run.json`, `report.md`.
4. Decide whether the first baseline belongs in an app-level Vitest test or a root smoke script.

---

## Task 2: Add failing E2E-style dashboard artifact loading test

**Objective:** Capture the desired CLI-artifact-to-Dashboard guarantee before implementation.

**Files:**
- Prefer modify: `apps/dashboard/src/ui/__tests__/App.test.tsx`
- Or create: `apps/dashboard/src/ui/__tests__/smoke-artifacts.test.tsx`

**Behavior:**
- Given a `?run=/runs/smoke` query and fetch responses matching real smoke `trace.jsonl` + `run.json`, the Dashboard renders:
  - source label `Run URL: /runs/smoke`,
  - task/run identity from the manifest,
  - `Replay Debug`,
  - `Agent Board`,
  - at least one real trace-derived item.

**TDD steps:**
1. Add the focused failing test first.
2. Run: `pnpm --filter @world-harness/dashboard test -- App.test.tsx` or the repo-supported equivalent.
3. Confirm RED for a missing assertion or missing fixture behavior before changing production code.

---

## Task 3: Implement the smallest loader/UI fix if the test exposes a gap

**Objective:** Make real smoke-shaped artifacts render without introducing mutation or server assumptions.

**Files:**
- Modify only if needed:
  - `apps/dashboard/src/data/loader.ts`
  - `apps/dashboard/src/ui/App.tsx`
  - `apps/dashboard/src/ui/Dashboard.tsx`

**Behavior:**
- Preserve the existing query convention:
  - `?run=/runs/demo` loads `/runs/demo/trace.jsonl` and `/runs/demo/run.json`.
  - `?trace=...&manifest=...` remains supported.
- If real smoke artifacts have missing optional fields, normalize safely rather than crashing.
- Do not add Node-only filesystem access to browser runtime paths.

**TDD steps:**
1. Implement only enough code to pass the failing test.
2. Run the focused Dashboard test.
3. Run `pnpm --filter @world-harness/dashboard test && pnpm --filter @world-harness/dashboard typecheck && pnpm --filter @world-harness/dashboard build`.

---

## Task 4: Consider a root smoke-dashboard script only after the unit/integration seam is green

**Objective:** Decide whether a separate script is needed for true artifact handoff.

**Files:**
- Optional create: `scripts/smoke-dashboard-artifacts.mjs`
- Optional modify: `package.json`

**Behavior:**
- Script should run locally and deterministically.
- It may call `pnpm smoke`, locate the printed run directory, start a temporary static server, and request dashboard-accessible artifacts.
- Avoid long-lived background processes; clean up any child process.
- Do not create cron jobs.

**TDD steps:**
1. Add this only if Task 2/3 still leave an important untested seam.
2. Keep it fast enough for regular pre-commit verification.

---

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

Review:
- Run an independent read-only `delegate_task` review before commit.

Commit:
```bash
git add apps/dashboard scripts package.json docs/plans/dashboard-smoke-e2e-baseline.md
# adjust paths to actual changed files
git commit -m "test(dashboard): cover smoke artifact loading"
git push origin main
```
