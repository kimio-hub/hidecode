# World Harness

World Harness is an AI-native software delivery runtime: task-centric state, typed tools, policy gates, workspace checkpoints, replay-grade JSONL traces, and verifiable final reports.

## Phase 1 MVP

- `@world-harness/core`: Task/Event/Tool/Policy/ChangeSet schemas, JSONL event store, artifact layout.
- `@world-harness/policy`: risk-aware policy engine MVP.
- `@world-harness/tools`: typed local tools for read/search/patch/run/git/test.
- `@world-harness/workspace`: checkpoint and rollback primitives.
- `@world-harness/models`: model adapter interface plus deterministic scripted adapter.
- `@world-harness/orchestrator`: single-agent task loop.
- `@world-harness/cli`: inspect/replay/smoke commands.

## Verify

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @world-harness/cli start -- smoke --repo ./fixtures/bugfix-ts --goal "fix failing add test"
```
