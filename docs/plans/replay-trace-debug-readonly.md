# Replay Trace Debug Read-Only Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Continue the loop after Approval Queue by adding the first read-only Replay & Trace Debug surface to Mission Control v2.

**Architecture:** Derive replay steps from existing trace events only. Do not implement time playback, fork APIs, or mutation yet. The component should provide a compact chronological view that later becomes interactive replay/fork tooling.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, Testing Library.

---

## Evaluation From Previous Cycle

Completed:
- ✅ Dashboard loads real run/trace data.
- ✅ Mission Control v2 shell exists.
- ✅ Read-only Approval Queue derives policy/security/high-risk tool items.
- ✅ Full repo test/typecheck/build/smoke passed.

Remaining gap:
- The `Replay` nav exists but has no dedicated trace-debug surface.
- Existing `ToolTimeline` is tool-focused; it does not normalize all events into replay steps with categories and elapsed time.

---

## Task 1: Add replay step derivation utility

**Files:**
- Create: `apps/dashboard/src/data/replay.ts`
- Test: `apps/dashboard/src/data/replay.test.ts`

**Behavior:**
- Export `ReplayStep` with:
  - `id`
  - `index`
  - `type`
  - `actor`
  - `timestamp`
  - `elapsedMs`
  - `category`: `task` | `model` | `tool` | `policy` | `security` | `diff` | `other`
  - `title`
  - `summary`
- Export `deriveReplaySteps(events)`.
- Sort events by timestamp ascending.
- Compute elapsed from first event.
- Normalize obvious categories by event type prefix.

---

## Task 2: Add read-only ReplayDebugger component

**Files:**
- Create: `apps/dashboard/src/ui/components/ReplayDebugger.tsx`

**Behavior:**
- Render title through wrapping panel: `Replay Debug`.
- Empty state: `No replay steps`.
- Render chronological steps with index, category, title, elapsed time, summary.
- Show future disabled actions: `Replay`, `Fork`, `Save Eval`.

---

## Task 3: Integrate into Dashboard shell

**Files:**
- Modify: `apps/dashboard/src/ui/Dashboard.tsx`
- Modify: `apps/dashboard/src/ui/__tests__/Dashboard.test.tsx`

**Behavior:**
- Add Replay Debug section in main area or inspector.
- Preserve existing panels/tests.

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

Commit:
```bash
git add apps/dashboard docs/plans/replay-trace-debug-readonly.md
git commit -m "feat(dashboard): add replay trace debug view"
git push origin main
```
