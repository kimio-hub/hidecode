# Dashboard Real Trace Normalization Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Continue after sandbox trace observability by aligning Dashboard read-only panels with real orchestrator trace event shapes.

**Architecture:** Add small normalization helpers and targeted tests around current real trace emissions before changing UI. Preserve legacy/mock compatibility while supporting canonical orchestrator events like `tool.requested`, `tool.started`, `tool.finished`, `approval.requested`, `sandbox.blocked`, and nested sandbox/evidence fields. Keep all Dashboard behavior read-only.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, Testing Library.

---

## Evaluation From Previous Cycle

Completed:
- ✅ Dashboard loads real run/trace data.
- ✅ Mission Control v2 shell exists.
- ✅ Read-only Approval Queue, Replay Debug, and Multi-Agent Board exist.
- ✅ CLI artifact/dashboard hints and smoke-artifact loading are covered.
- ✅ Run manifests record safe model metadata.
- ✅ Read-only sandbox enforcement and sandbox trace events exist.
- ✅ Full repo test/typecheck/build/smoke passed.

Review-discovered gap:
- Dashboard components still mixed legacy mock trace assumptions (`tool.call`, `tool.result`, `data.name`, flat `stdout`) with real orchestrator emissions (`tool.requested`, `tool.finished`, `data.tool`, nested `evidence`/`sandbox`).
- Tool Timeline was the first visible compatibility gap and has started receiving a TDD fix.

---

## Task 1: Normalize Tool Timeline real orchestrator events

**Objective:** Render real `tool.requested` / `tool.finished` traces while preserving legacy mock `tool.call` / `tool.result` behavior.

**Files:**
- Modify: `apps/dashboard/src/ui/components/ToolTimeline.tsx`
- Test: `apps/dashboard/src/ui/__tests__/ToolTimeline.test.tsx`

**Behavior:**
- Pair `tool.requested` with following `tool.finished`.
- Continue pairing legacy `tool.call` with `tool.result` when results omit a tool name.
- Read tool name from `data.tool` or `data.name`.
- Render nested `data.output.stdout/stderr` when present.
- Render sandbox metadata (`mode`, `writeMode`, `blocked`) when present.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test -- ToolTimeline.test.tsx Dashboard.test.tsx
pnpm --filter @world-harness/dashboard typecheck
```

---

## Task 2: Add real approval request derivation

**Objective:** Make Approval Queue show explicit orchestrator approval events instead of only policy decisions.

**Files:**
- Modify: `apps/dashboard/src/data/approvals.ts`
- Test: `apps/dashboard/src/data/approvals.test.ts`

**Behavior:**
- `approval.requested` produces a pending approval item.
- `approval.resolved` produces allowed/denied status if present in imported traces.
- Keep `policy.decision`, `security.finding`, `sandbox.blocked`, and high-risk tool derivation behavior.

**TDD steps:**
1. Add failing tests with real orchestrator-style `approval.requested` data.
2. Implement minimal derivation.
3. Run dashboard data tests.

---

## Task 3: Normalize tool risk and sandbox data for replay/approvals

**Objective:** Avoid per-component drift by adding shared helpers if repeated field normalization becomes visible.

**Files:**
- Create if useful: `apps/dashboard/src/data/trace-normalize.ts`
- Modify if needed: `apps/dashboard/src/data/replay.ts`, `apps/dashboard/src/data/approvals.ts`, `apps/dashboard/src/ui/components/ToolTimeline.tsx`
- Test: focused data/UI tests.

**Behavior:**
- Resolve tool names from `name` or `tool`.
- Resolve risk from `risk` or `risks` array.
- Resolve output from flat `stdout/stderr` or nested `output`/`evidence` fields.
- Keep helpers pure and browser-safe.

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
- Run independent read-only `delegate_task` review before commit.

Commit:
```bash
git add apps/dashboard docs/plans/dashboard-real-trace-normalization.md
git commit -m "fix(dashboard): normalize real tool timeline traces"
git push origin main
```

---

## Follow-up candidates

- Add Dashboard integration tests using trace fixtures produced by `runSingleAgentTask`.
- Add visible single-agent/multi-agent labeling once orchestrator emits real `agentId` / handoff metadata.
- Decide whether `tool.started` belongs as a separate Tool Timeline row or only as execution metadata for a request row.
