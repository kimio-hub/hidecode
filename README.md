# World Harness

Task-centric, policy-driven coding-agent harness runtime.

## Phase 1 MVP

```bash
pnpm install
pnpm test
pnpm cli init --workspace .
pnpm cli run "inspect this repo" --workspace .
```

Core principles:

- task-centric state, not transcript-centric chat
- typed tools with schemas
- policy allow/ask/deny before side effects
- JSONL event trace
- patch-first edits
- verifier-friendly final reports
