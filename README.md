# World Harness

World Harness is an AI-native software delivery runtime: task-centric state, typed tools, policy gates, workspace checkpoints, replay-grade JSONL traces, and verifiable final reports.

## Current status

Phase 1 MVP is implemented and testable as a TypeScript/pnpm monorepo:

- `@world-harness/core`: Task/Event/Tool/Policy/ChangeSet schemas, budget helpers, retry helpers, JSONL event store, artifact layout.
- `@world-harness/policy`: risk-aware policy engine MVP.
- `@world-harness/tools`: repo-scoped typed local tools for read/search/patch/run/git/test, path escape checks, symlink write protections, and injectable `LocalSandbox` execution metadata/timeouts/env allowlist.
- `@world-harness/workspace`: checkpoint and rollback primitives.
- `@world-harness/models`: model adapter interface, deterministic scripted adapter, and OpenAI-compatible chat adapter.
- `@world-harness/orchestrator`: single-agent task loop with traces and final reports.
- `@world-harness/cli`: `run`, `inspect`, `replay`, and deterministic `smoke` commands.

## CLI examples

```bash
# Deterministic no-network smoke run
pnpm smoke

# Real model run through an OpenAI-compatible endpoint
pnpm --filter @world-harness/cli start -- run \
  --repo ./fixtures/bugfix-ts \
  --goal "fix failing add test" \
  --model gpt-5.5 \
  --base-url http://127.0.0.1:3000/v1 \
  --sandbox local \
  --sandbox-timeout-ms 60000 \
  --sandbox-max-buffer 1048576 \
  --sandbox-network enabled

# Inspect/replay traces
pnpm --filter @world-harness/cli start -- inspect ./artifacts/<task-id>/trace.jsonl
pnpm --filter @world-harness/cli start -- replay ./artifacts/<task-id>/trace.jsonl
```

After a successful `run` or `smoke`, the CLI prints the generated trace, `run.json` manifest, report, and a Dashboard query hint:

```text
[world-harness] Trace: /path/to/repo/.runs/run-.../trace.jsonl
[world-harness] Run manifest: /path/to/repo/.runs/run-.../run.json
[world-harness] Report: /path/to/repo/.runs/run-.../report.md
[world-harness] Dashboard query: ?run=%2Fpath%2Fto%2Frepo%2F.runs%2Frun-...
[world-harness] Dashboard note: serve or copy .runs output under the dashboard dev server before opening this query.
```

The Dashboard fetches browser-accessible URLs, not arbitrary local filesystem files. To inspect the same run, serve or copy the `.runs/run-...` directory under a path the dashboard dev server can fetch, then open it with the printed query form (or explicit trace/manifest URLs):

```bash
pnpm --filter @world-harness/dashboard dev
# then open http://localhost:5173/?run=<browser-accessible-run-directory-url>
# or http://localhost:5173/?trace=<browser-accessible-trace.jsonl-url>&manifest=<browser-accessible-run.json-url>
```

Notes:

- `--sandbox local` is currently the only supported execution backend.
- `--sandbox-network enabled|disabled` is metadata for trace/report policy visibility; the local backend does not yet enforce network isolation.
- Sandbox commands run with an explicit environment allowlist (`env: {}` by default in CLI paths).

## Verify

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

For focused checks:

```bash
pnpm --filter @world-harness/tools exec vitest run test/sandbox.test.ts
pnpm --filter @world-harness/cli test
pnpm --filter @world-harness/cli typecheck
```
