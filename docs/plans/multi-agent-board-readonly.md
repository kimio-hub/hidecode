# Multi-Agent Board Read-Only Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Continue the Dashboard loop after Replay Debug by adding a read-only Multi-Agent Board that summarizes agent status, handoffs, blockers, and current focus from trace events.

**Architecture:** Derive agent board cards from existing trace events only. Treat `actor`, `taskId`, event family, failed tool results, policy/security events, and optional `data.agentId`/`data.handoffTo`/`data.blocker` fields as inputs. Do not add backend APIs, live commands, or mutations in this cycle.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, Testing Library.

---

## Evaluation From Previous Cycle

Completed:
- ✅ Dashboard loads real run/trace data.
- ✅ Mission Control v2 shell exists.
- ✅ Read-only Approval Queue derives policy/security/high-risk tool items.
- ✅ Read-only Replay Debug derives chronological trace steps and disabled future actions.
- ✅ Full repo test/typecheck/build/smoke passed for Cycle 3.

Remaining gap:
- The `Agents` nav exists but has no board showing which agent/runtime actors are active, blocked, handing off, or responsible for recent work.
- Current panels show chronological events, approvals, and replay, but not an agent-centric operational view.

---

## Task 1: Add agent board derivation utility

**Objective:** Create a pure data utility that converts trace events into read-only agent cards.

**Files:**
- Create: `apps/dashboard/src/data/agents.ts`
- Test: `apps/dashboard/src/data/agents.test.ts`

**Behavior:**
- Export `AgentBoardItem` with:
  - `id`
  - `name`
  - `status`: `active` | `idle` | `blocked` | `handoff`
  - `taskId?: string`
  - `lastEventType`
  - `lastSeen`
  - `eventCount`
  - `toolCount`
  - `blockers: string[]`
  - `handoffs: string[]`
  - `focus`
- Export `deriveAgentBoard(events)`.
- Group by `data.agentId` when string, otherwise `actor`, otherwise `unknown`.
- Ignore purely systemless empty actor names by normalizing to `unknown`.
- Sort cards by most recent valid timestamp descending; invalid timestamps sort last.
- Mark `blocked` when recent events include:
  - failed `tool.result` (`data.ok === false`),
  - `security.finding`,
  - policy decision with `decision` containing `deny`, `block`, or `needs_approval`,
  - string `data.blocker`.
- Mark `handoff` when `data.handoffTo` or `data.handoffFrom` is a string and no blocker is present.
- Mark `active` when the latest valid event is not terminal (`task.completed`) and no blocker/handoff is present; otherwise `idle`.
- Keep summaries short and deterministic.

**TDD steps:**
1. Write failing tests for grouping, status derivation, blocker/handoff extraction, and timestamp sorting.
2. Run: `pnpm --filter @world-harness/dashboard test -- src/data/agents.test.ts` and confirm RED.
3. Implement the smallest pure utility.
4. Re-run the targeted test and then dashboard tests.

---

## Task 2: Add read-only AgentBoard component

**Objective:** Render the derived cards in Mission Control without side effects.

**Files:**
- Create: `apps/dashboard/src/ui/components/AgentBoard.tsx`

**Behavior:**
- Render title/content through the Dashboard panel: `Multi-Agent Board`.
- Empty state: `No agent activity`.
- Render card fields: name, status, focus, task id, counts, latest event, blockers, handoffs.
- Show disabled future actions: `Assign`, `Handoff`, `Unblock`.
- No click handlers or mutation APIs.

**TDD steps:**
1. Add/extend Dashboard integration test expectations before implementation.
2. Run the test and confirm RED.
3. Implement component rendering.
4. Re-run Dashboard tests and dashboard typecheck.

---

## Task 3: Integrate into Dashboard shell

**Objective:** Add the board to the main Mission Control surface while preserving existing panels.

**Files:**
- Modify: `apps/dashboard/src/ui/Dashboard.tsx`
- Modify: `apps/dashboard/src/ui/__tests__/Dashboard.test.tsx`

**Behavior:**
- Derive `agentBoard = deriveAgentBoard(events)`.
- Add a `Multi-Agent Board` panel near Replay Debug or in the main surface under the `Agents` nav concept.
- Add an `Agents` metric using the derived item count if layout remains readable.
- Preserve: `Task Graph`, `Tool Timeline`, `Replay Debug`, `Diff / Changes`, `Approval Queue`, `Evidence`, `Policy / Risk`, and `Command Dock`.

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
git add apps/dashboard/src/data/agents.ts apps/dashboard/src/data/agents.test.ts apps/dashboard/src/ui/components/AgentBoard.tsx apps/dashboard/src/ui/Dashboard.tsx apps/dashboard/src/ui/__tests__/Dashboard.test.tsx docs/plans/multi-agent-board-readonly.md
git commit -m "feat(dashboard): add multi-agent board"
git push origin main
```
