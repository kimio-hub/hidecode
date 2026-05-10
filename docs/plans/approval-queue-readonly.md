# Approval Queue Read-Only Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Continue the evaluate → plan → execute → review loop by adding the first read-only Approval Queue / Policy Risk data model and panel to Mission Control v2.

**Architecture:** Derive approval/risk queue items from existing trace events only. Do not add backend APIs or mutable approve/reject behavior in this cycle. The queue should make policy/security/tool-risk events visible in a dedicated component that can later become interactive.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, Testing Library.

---

## Evaluation From Previous Cycle

Completed:
- ✅ Dashboard loads real run/trace data.
- ✅ Mission Control shell exists with nav, metrics, inspector, and command dock.
- ✅ Full repo test/typecheck/build/smoke passed.

Remaining gap:
- The `Approvals` nav exists but has no dedicated queue surface.
- `PolicyPanel` exists, but approval/risk data is not normalized into actionable review items.

---

## Task 1: Add approval queue derivation utility

**Files:**
- Create: `apps/dashboard/src/data/approvals.ts`
- Test: `apps/dashboard/src/data/approvals.test.ts`

**Behavior:**
- Export `ApprovalQueueItem` with:
  - `id`
  - `title`
  - `kind`: `approval` | `policy` | `security` | `tool-risk`
  - `risk`: `low` | `medium` | `high` | `critical` | `unknown`
  - `status`: `pending` | `allowed` | `denied` | `informational`
  - `timestamp`
  - `summary`
- Export `deriveApprovalQueue(events)`.
- Include policy events: `policy.decision`, `policy.decided`.
- Include security events: `security.finding`.
- Include high/critical-risk tool events from `event.data.risk`.

---

## Task 2: Add read-only ApprovalQueue component

**Files:**
- Create: `apps/dashboard/src/ui/components/ApprovalQueue.tsx`
- Test through dashboard test initially.

**Behavior:**
- Render title `Approval Queue`.
- Empty state: `No approval items`.
- Render queue item title, risk, status, summary.
- Include disabled buttons or labels for future actions: `Approve`, `Reject`.

---

## Task 3: Integrate into Dashboard shell

**Files:**
- Modify: `apps/dashboard/src/ui/Dashboard.tsx`
- Modify: `apps/dashboard/src/ui/__tests__/Dashboard.test.tsx`

**Behavior:**
- Add approval queue section below Command Dock or in inspector.
- Add metric card for queue count if simple.
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
git add apps/dashboard docs/plans/approval-queue-readonly.md
git commit -m "feat(dashboard): add read-only approval queue"
git push origin main
```
