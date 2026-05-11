# Sandbox Enforcement Trace Events Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Continue after local read-only sandbox enforcement by recording sandbox guard decisions as first-class trace events.

**Architecture:** Keep enforcement in `@world-harness/tools`, but make sandbox results observable in orchestration traces. When a tool run is blocked or executed with sandbox metadata, the orchestrator should emit structured trace data that Dashboard/Replay/Multi-Agent views can inspect later. This cycle is observability only; it should not add new mutation APIs or broaden sandbox permissions.

**Tech Stack:** TypeScript, Vitest, pnpm workspaces, existing trace/event-store and orchestrator tool execution seams.

---

## Evaluation From Previous Cycle

Completed:
- ✅ Dashboard loads real run/trace data.
- ✅ Mission Control v2 shell exists.
- ✅ Read-only Approval Queue, Replay Debug, and Multi-Agent Board exist.
- ✅ CLI artifact/dashboard hints and Dashboard smoke-artifact loading are covered.
- ✅ Run manifests record safe model provider/name metadata.
- ✅ LocalSandbox now blocks obvious readonly write-intent commands before shell execution.
- ✅ Full repo test/typecheck/build/smoke passed.

Remaining gap:
- Sandbox enforcement decisions are returned in tool results, but they are not easy to filter as explicit trace events.
- Replay Debug and future safety/audit dashboards should be able to show when a command was blocked by sandbox policy without parsing arbitrary tool output.

---

## Task 1: Add failing orchestrator trace test for sandbox blocked command

**Objective:** Prove a readonly sandbox block produces a structured trace event.

**Files:**
- Modify: `packages/orchestrator/test/orchestrator.test.ts` or `packages/orchestrator/test/e2e.test.ts`

**Behavior:**
- Arrange a run/tool invocation that attempts an obvious write under readonly sandbox mode.
- Assert the trace includes a structured event such as `sandbox.blocked` or a `tool.result` with `data.sandbox.writeMode === 'readonly'` and `data.sandbox.blocked === true`.
- Assert no secrets or raw environment values are emitted.

**TDD steps:**
1. Write the focused failing test first.
2. Run: `pnpm --filter @world-harness/orchestrator test -- test/orchestrator.test.ts`.
3. Confirm RED because no dedicated sandbox trace event exists yet.

---

## Task 2: Emit explicit sandbox observability metadata

**Objective:** Add the minimal trace emission needed to satisfy the test.

**Files:**
- Modify likely orchestrator tool execution seam under `packages/orchestrator/src/`.
- Do not change credential handling or read secret files.

**Behavior:**
- Preserve existing `tool.*` event semantics.
- Add a stable machine-readable marker for sandbox decisions:
  - `mode`, `cwd`, `timeoutMs`, `network`, `writeMode`, and `blocked` boolean.
  - Include readonly error text only if already present in `ExecutionResult.error`.
- Prefer a dedicated `sandbox.blocked` event when blocked, plus existing tool result metadata, if the trace schema supports it.
- Keep event payload compact and safe.

**TDD steps:**
1. Implement the smallest orchestrator trace change.
2. Run the focused orchestrator test.
3. Run: `pnpm --filter @world-harness/orchestrator test` and `pnpm --filter @world-harness/orchestrator typecheck`.

---

## Task 3: Surface sandbox decisions in Dashboard replay/approval data if already available

**Objective:** If the trace event shape is present, make the read-only UI classify sandbox blocks without adding side effects.

**Files:**
- Modify if needed: `apps/dashboard/src/data/replay.ts`
- Modify if needed: `apps/dashboard/src/data/approvals.ts`
- Tests: corresponding `*.test.ts`

**Behavior:**
- Replay Debug should show sandbox blocked events with category `policy` or `security` and a clear title.
- Approval Queue may derive a readonly `blocked`/`security` item for sandbox blocks if risk/status conventions fit existing types.
- Preserve existing Dashboard tests.

**TDD steps:**
1. Add failing data tests for sandbox event classification.
2. Implement minimal classification.
3. Run: `pnpm --filter @world-harness/dashboard test` and dashboard typecheck/build if dashboard files changed.

---

## Verification

```bash
pnpm --filter @world-harness/orchestrator test
pnpm --filter @world-harness/orchestrator typecheck
# If dashboard changed:
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
# Before commit:
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

## Review

Run an independent read-only `delegate_task` review before committing.

## Commit

```bash
git add packages/orchestrator apps/dashboard docs/plans/sandbox-enforcement-trace-events.md
git commit -m "feat(orchestrator): trace sandbox enforcement decisions"
git push origin main
```

---

## Follow-up candidates

- Add Dashboard filters for sandbox blocked events.
- Add smoke coverage for readonly sandbox CLI flows.
- Replace best-effort command preflight with OS/container-level read-only filesystem enforcement.
