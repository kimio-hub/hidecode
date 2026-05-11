# Dashboard Real Trace Normalization Follow-up Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Finish aligning Dashboard read-only panels with canonical orchestrator trace event shapes after the first Tool Timeline and Approval Queue normalization fixes.

**Architecture:** Keep changes small, pure, and browser-safe. Prefer focused data helpers/tests before UI updates. Preserve mock/legacy trace compatibility while adding coverage for real events emitted by the orchestrator (`tool.requested`, `tool.finished`, `approval.requested`, `sandbox.blocked`, nested `output`/`sandbox`, `data.tool`, and `data.risks`).

**Tech Stack:** React 19, Vite, TypeScript, Vitest, Testing Library.

---

## Evaluation From Current Cycle

Completed:
- ✅ Replay Debug, Multi-Agent Board, CLI artifact hints, model metadata, sandbox enforcement, and sandbox trace events are already on `main`.
- ✅ Tool Timeline now handles real `tool.requested` / `tool.finished` shapes.
- ✅ Approval Queue now derives explicit `approval.requested` and `approval.resolved` events.
- ✅ Replay step summaries now understand `data.tool` and `data.risks` for real tool events.
- ✅ Full repo verification passed before the approval normalization commit; focused Dashboard verification passed after the replay normalization step.

Remaining gaps:
- Normalization logic for tool name/risk/output is duplicated between Tool Timeline, Replay, and Approval Queue.
- Approval status matching uses substring matching; exact token handling would avoid edge cases such as `disallowed` matching `allow` first.
- Dashboard needs a real trace fixture/integration test covering orchestrator-style mixed events across Tool Timeline, Approval Queue, Replay Debug, and Multi-Agent Board together.

---

## Task 1: Extract shared trace normalization helpers

**Objective:** Reduce component drift by centralizing safe field extraction for real and legacy trace events.

**Files:**
- Create: `apps/dashboard/src/data/trace-normalize.ts`
- Create: `apps/dashboard/src/data/trace-normalize.test.ts`
- Modify: `apps/dashboard/src/data/replay.ts`
- Modify: `apps/dashboard/src/data/approvals.ts`
- Modify: `apps/dashboard/src/ui/components/ToolTimeline.tsx`

**Behavior:**
- Export helpers such as:
  - `stringField(value)`
  - `toolNameForEvent(event, fallback?)`
  - `riskForData(data)` / `riskForEvent(event)`
  - `nestedRecord(value)`
  - `outputForData(data)`
- Support legacy and real shapes:
  - tool name from `data.name` or `data.tool`
  - risk from `data.risk` or `data.risks[]`
  - output from flat `stdout/stderr` or nested `output.stdout/stderr`
  - sandbox from nested `data.sandbox`
- Keep helpers pure and browser-safe.

**TDD steps:**
1. Add failing tests in `trace-normalize.test.ts` for name/risk/output/sandbox extraction.
2. Run: `pnpm --filter @world-harness/dashboard test -- src/data/trace-normalize.test.ts` and confirm RED.
3. Implement minimal helpers.
4. Refactor Replay/Approval/ToolTimeline to consume helpers without changing visible behavior.
5. Re-run targeted tests and full Dashboard tests.

---

## Task 2: Harden approval resolved status matching

**Objective:** Avoid substring misclassification in approval resolution status.

**Files:**
- Modify: `apps/dashboard/src/data/approvals.ts`
- Modify: `apps/dashboard/src/data/approvals.test.ts`

**Behavior:**
- Exact/normalized allowed values: `allow`, `allowed`, `approve`, `approved`, `grant`, `granted`.
- Exact/normalized denied values: `deny`, `denied`, `reject`, `rejected`, `block`, `blocked`.
- Unknown resolved values remain `informational`.
- Add a regression test that `disallowed` does not become `allowed`.

**TDD steps:**
1. Add failing regression test for `decision: 'disallowed'` returning `informational`.
2. Implement token/exact matching.
3. Run approval tests and Dashboard typecheck.

---

## Task 3: Add orchestrator-style Dashboard integration fixture

**Objective:** Prove the Dashboard panels work together on a canonical real trace shape, not just isolated units.

**Files:**
- Modify: `apps/dashboard/src/ui/__tests__/Dashboard.test.tsx`
- Optional create: `apps/dashboard/src/data/real-trace-fixture.test.ts` or inline fixture helper.

**Behavior:**
- Build an in-test event array containing:
  - `task.created`
  - `tool.requested` with `data.tool` and `data.risks`
  - `approval.requested`
  - `tool.finished` with nested `output` and `sandbox`
  - `sandbox.blocked`
  - `task.completed`
- Assert visible rendering across:
  - Tool Timeline tool name/output/sandbox metadata
  - Approval Queue approval/sandbox item
  - Replay Debug tool summary
  - Multi-Agent Board runtime/agent status
- Preserve existing mock dashboard tests.

**TDD steps:**
1. Add failing integration assertions before changing production code.
2. Reuse helpers from Task 1 if assertions expose drift.
3. Run Dashboard tests and typecheck.

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
git add apps/dashboard docs/plans/dashboard-real-trace-normalization-followup.md
git commit -m "fix(dashboard): share real trace normalization helpers"
git push origin main
```
