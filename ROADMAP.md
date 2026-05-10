# World Harness Roadmap

## Done: Phase 1 MVP

- Monorepo package skeleton for core, policy, tools, workspace, models, orchestrator, CLI, fixture app, and web package.
- Typed task/event/tool/policy/change-set schemas.
- JSONL event store and artifact layout for replay-grade traces and final reports.
- Risk-aware policy gate MVP.
- Repo-scoped tools with path escape checks and symlink write safeguards.
- Injectable execution sandbox abstraction with local backend, timeout/max-buffer controls, explicit env allowlist, and structured execution results.
- Single-agent orchestration loop with deterministic scripted adapter and OpenAI-compatible adapter.
- CLI commands: `run`, `smoke`, `inspect`, `replay`.
- Unit/e2e coverage for schemas, policy, tools, sandbox, workspace, model adapters, orchestrator, and CLI help/validation.

## Near-term next steps

1. **Sandbox hardening**
   - Enforce network policy instead of metadata-only reporting.
   - Add real read-only/write-scoped execution mode.
   - Consider containerized backend (`docker`/`bubblewrap`) behind the existing sandbox interface.

2. **Policy + approvals**
   - Make CLI approval decisions explicit and auditable.
   - Add policy fixtures for destructive commands, network access, and git operations.

3. **Patch quality**
   - Replace simple string patching with structured diffs and conflict diagnostics.
   - Add dry-run and preview output before write operations.

4. **Replay and evaluation**
   - Add replay assertions, not only event printing.
   - Add benchmark tasks for fixture repos and regression scoring.

5. **UX**
   - Improve run summaries with changed files, command evidence, and policy decisions.
   - Start integrating the web UI once runtime traces stabilize.
