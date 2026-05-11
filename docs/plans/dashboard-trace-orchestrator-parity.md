# Dashboard Trace–Orchestrator Parity Next Plan

> **For Hermes:** Continue with subagent-driven-development. Keep changes small, TDD-first, and verify full repo before push.

**Goal:** Close the remaining gap between Dashboard “orchestrator-style” fixture coverage and the exact trace emitted by the current orchestrator runtime.

## Current state

Completed in the previous cycle:
- Shared dashboard trace normalization helpers were extracted in `apps/dashboard/src/data/trace-normalize.ts`.
- Tool Timeline, Replay, and Approval Queue now share parsing for `data.name` / `data.tool`, `data.risk` / `data.risks[]`, nested `output`, and nested `sandbox` metadata.
- Dashboard integration coverage now includes a mixed orchestrator-style trace across Tool Timeline, Approval Queue, Replay Debug, and Multi-Agent Board.
- Full verification passed: `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm smoke`.

Remaining design gap:
- The Dashboard fixture is intentionally rich (`data.risks`, `durationMs`, nested `output`), but the current orchestrator may emit a leaner trace shape. Next cycle should either enrich orchestrator trace emission or add a separate exact-current-fixture test so Dashboard compatibility is proven against both.

## Task 1: Capture current orchestrator trace contract as a Dashboard fixture

**Files:**
- Modify: `apps/dashboard/src/ui/__tests__/Dashboard.test.tsx`
- Optional create: `apps/dashboard/src/data/orchestrator-fixtures.test.ts` or `apps/dashboard/src/data/orchestrator-fixtures.ts`

**Behavior:**
- Add a second fixture that mirrors the current real smoke/orchestrator trace shape as emitted today.
- Include only fields currently present in real trace output; avoid optimistic fields unless they are in the runtime.
- Assert Dashboard renders without dropping core events:
  - tool request/finish entries,
  - approval/sandbox/policy items if present,
  - replay chronological summaries,
  - task completion status.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test -- src/ui/__tests__/Dashboard.test.tsx
pnpm --filter @world-harness/dashboard typecheck
```

## Task 2: Consider enriching orchestrator tool events with normalized metadata

**Files:**
- Inspect first: `packages/orchestrator/src/index.ts`, related core trace schemas.
- Modify only if low-risk and covered by tests.

**Behavior options:**
- Add `durationMs` to `tool.finished` events if timing is available.
- Include structured `output` if the tool result already exposes stdout/stderr/summary/ok.
- Include `risks` on `tool.requested` if the policy/tool classification layer can provide it safely.

**Constraints:**
- Do not invent unavailable metadata.
- Preserve backward compatibility for existing traces.
- Add orchestrator unit tests before implementation.

## Task 3: Tighten Dashboard fixture organization

**Files:**
- `apps/dashboard/src/ui/__tests__/Dashboard.test.tsx`
- Optional: fixture helper under `apps/dashboard/src/data/`

**Behavior:**
- If Dashboard tests become too large, extract reusable fixture builders.
- Keep test strings unique enough to avoid brittle Testing Library queries.

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
- Run an independent read-only code review before commit.

Suggested commit:
```bash
git add apps/dashboard packages/orchestrator docs/plans/dashboard-trace-orchestrator-parity.md
git commit -m "test(dashboard): cover current orchestrator trace shape"
git push origin main
```
