# Dashboard Runtime Trace Surface Next Plan

> **For Hermes:** Continue with subagent-driven-development. Keep tasks small, TDD-first, and verify full repo before push.

**Goal:** After adding exact-current orchestrator Dashboard fixture coverage, improve the remaining low-friction real trace surfaces that the fixture/review exposed without changing the orchestrator trace contract prematurely.

## Current state

Completed in the previous cycles:
- Shared trace normalization helpers exist for Dashboard Tool Timeline, Replay Debug, and Approval Queue.
- Dashboard integration coverage includes both a rich orchestrator-style trace and an exact-current lean orchestrator trace.
- Full verification passed: `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm smoke`.

Remaining polish gaps:
- Agent Board tool focus still uses `data.name` directly instead of shared `toolNameForEvent`, so a latest real `tool.*` event with `data.tool` can display generic `tool`.
- Evidence and Diff panels have partial legacy assumptions (`tool.result`, `diff.applied`, write-file calls) and could surface current `tool.finished.evidence` / `file.changed` events better.
- Header tool count currently counts `tool.started` / `tool.call`; traces with requested-but-not-started tools may under-report tool activity.

## Task 1: Reuse shared tool-name normalization in Agent Board

**Files:**
- Modify: `apps/dashboard/src/data/agents.ts`
- Modify: `apps/dashboard/src/data/agents.test.ts`

**Behavior:**
- When the latest event is `tool.requested`, `tool.started`, or `tool.finished` with `data.tool`, Agent Board focus should show that real tool name instead of generic `tool`.
- Preserve existing `data.name` compatibility.

**TDD:**
1. Add failing agents test for latest `tool.finished` with `{ tool: 'run', ok: false }` expecting focus `run · failed`.
2. Implement by using `toolNameForEvent()` from `trace-normalize.ts`.
3. Run dashboard data tests and typecheck.

## Task 2: Surface current runtime evidence/file changes in inspector panels

**Files:**
- Inspect/modify: `apps/dashboard/src/ui/components/EvidencePanel.tsx`
- Inspect/modify: `apps/dashboard/src/ui/components/DiffPanel.tsx`
- Add/modify focused tests if existing coverage is absent.

**Behavior:**
- EvidencePanel should include current `tool.finished` evidence/error/ok summaries where available, not only legacy `tool.result`.
- DiffPanel should render current `file.changed` events with `data.files`.
- Keep legacy `tool.result`, `diff.applied`, and `write_file` behavior working.

**TDD:**
1. Add failing UI/component test or Dashboard integration assertion for `file.changed` and `tool.finished.evidence`.
2. Implement minimal rendering support.
3. Run focused tests plus dashboard package verification.

## Task 3: Header tool activity count for requested-only traces

**Files:**
- Modify: `apps/dashboard/src/ui/components/Header.tsx`
- Add/modify Dashboard/Header coverage.

**Behavior:**
- Count tool activity when a trace has `tool.requested` but no `tool.started` (e.g. approval-needed/denied path).
- Avoid double-counting normal request/start/finish lifecycle too much; prefer a simple unique event or unique request count if practical.

## Verification

Run before commit:
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
- Run independent read-only code review before commit.

Suggested commit:
```bash
git add apps/dashboard docs/plans/dashboard-runtime-trace-surface.md
git commit -m "fix(dashboard): surface current runtime trace details"
git push origin main
```
