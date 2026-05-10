# Mission Control v2 Shell Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Upgrade the current real-trace dashboard from a simple 3-column viewer into the first usable Mission Control v2 shell that matches the visual direction from the generated UI concepts.

**Architecture:** Keep existing data-driven components (`TaskGraph`, `ToolTimeline`, `DiffPanel`, `EvidencePanel`, `PolicyPanel`) and compose them into a richer shell. This cycle is intentionally a UI shell iteration, not a full feature rewrite: left navigation, overview metrics, right inspector, and bottom command dock should be backed by current trace/run data.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, Testing Library, inline styles for now.

---

## Evaluation

Current state:
- ✅ Real run/trace loading exists via query params.
- ✅ Existing panels render trace-derived content.
- ❌ Layout is still old 3-column mock-era structure.
- ❌ No Mission Control navigation / mode concept.
- ❌ No bottom command/terminal dock.
- ❌ No quick overview cards from trace metrics.

Risk:
- Keep this cycle small. Do not implement real approvals/replay/multi-agent behavior yet.
- Prefer presentational components that derive from `events` and `run`.
- Preserve all existing tests and panel names so previous behavior remains visible.

---

## Task 1: Add Mission Control shell tests

**Objective:** Lock in visible UI requirements before implementation.

**Files:**
- Modify: `apps/dashboard/src/ui/__tests__/Dashboard.test.tsx`

**Test expectations:**
- Renders `Mission Control` label.
- Renders navigation entries: `Control`, `Approvals`, `Replay`, `Agents`.
- Renders overview cards: `Events`, `Tools`, `Risk`, `Duration`.
- Renders bottom dock labels: `Command Dock`, `Terminal`, `Ask Harness`.
- Existing panels remain visible: `Task Graph`, `Tool Timeline`, `Diff / Changes`, `Evidence`, `Policy / Risk`.

**Run:**
```bash
pnpm --filter @world-harness/dashboard test -- src/ui/__tests__/Dashboard.test.tsx
```
Expected before implementation: FAIL.

---

## Task 2: Implement Mission Control shell

**Objective:** Recompose `Dashboard.tsx` into a v2 shell without changing data loading.

**Files:**
- Modify: `apps/dashboard/src/ui/Dashboard.tsx`

**Implementation requirements:**
- Use CSS grid:
  - header full width
  - left nav 220px
  - main content 1fr
  - right inspector 340px
  - bottom dock in main area
- Left nav sections:
  - Control
  - Approvals
  - Replay
  - Agents
- Main area:
  - summary/overview cards
  - Task Graph + Tool Timeline
  - Diff / Changes
  - bottom Command Dock
- Right inspector:
  - Evidence
  - Policy / Risk
- No external state required yet.

**Run:**
```bash
pnpm --filter @world-harness/dashboard test -- src/ui/__tests__/Dashboard.test.tsx
```
Expected after implementation: PASS.

---

## Task 3: Verify full dashboard package

**Commands:**
```bash
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
```

Expected: all pass.

---

## Task 4: Review and ship

**Commands:**
```bash
git diff --stat
git diff -- apps/dashboard/src/ui/Dashboard.tsx apps/dashboard/src/ui/__tests__/Dashboard.test.tsx
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

If clean, commit:
```bash
git add apps/dashboard/src/ui/Dashboard.tsx apps/dashboard/src/ui/__tests__/Dashboard.test.tsx docs/plans/mission-control-v2-shell.md
git commit -m "feat(dashboard): add mission control shell"
git push origin main
```

---

## Next Cycle After This

P2 should implement the Approval Queue screen model:
- derive approval/risk items from `policy.*`, `security.finding`, and high-risk `tool.*` events;
- add dedicated approval queue component;
- keep it read-only first;
- later connect real approve/reject APIs.
