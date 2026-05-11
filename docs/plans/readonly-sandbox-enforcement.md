# Read-Only Sandbox Enforcement Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Continue after run manifest model metadata by making the local execution sandbox respect read-only mode for obvious workspace-mutating commands.

**Architecture:** Keep this as a conservative local guard in `LocalSandbox` before shell execution. The first cycle blocks clear write intent (`>`, `>>`, `tee`, file mutation commands, package-manager install/update commands) and reports structured sandbox metadata; it does not claim to be a full kernel/container sandbox yet.

**Tech Stack:** TypeScript, Vitest, pnpm workspaces, existing `@world-harness/tools` sandbox seam.

---

## Evaluation From Previous Cycle

Completed:
- ✅ Dashboard loads real run/trace data.
- ✅ Mission Control v2 shell exists.
- ✅ Read-only Approval Queue, Replay Debug, and Multi-Agent Board exist.
- ✅ CLI artifact/dashboard hints and Dashboard smoke-artifact loading are covered.
- ✅ Run manifests record safe model provider/name metadata.
- ✅ Full repo test/typecheck/build/smoke passed before this plan.

Remaining gap:
- `LocalSandboxOptions.writeMode` is present in types and emitted metadata, but the local backend did not enforce read-only mode.
- This weakens the tool/sandbox/policy/budget/retry/trace loop: policy may label a command read-only, but the execution layer should still provide a defense-in-depth guard for obvious writes.
- The first guard is explicitly best-effort command preflight, not a full read-only filesystem sandbox.

---

## Task 1: Add failing readonly sandbox test

**Objective:** Prove `LocalSandbox({ writeMode: 'readonly' })` blocks an obvious file-write command before execution.

**Files:**
- Modify: `packages/tools/test/sandbox.test.ts`

**Behavior:**
- A command such as `printf blocked > out.txt` returns `ok: false` in readonly mode.
- The error message mentions readonly.
- Returned sandbox metadata includes `writeMode: 'readonly'`.

**TDD steps:**
1. Add the focused failing test.
2. Run: `pnpm --filter @world-harness/tools test -- test/sandbox.test.ts`.
3. Confirm RED because the command currently succeeds.

Status in current cycle:
- ✅ RED confirmed: the new test failed with `expected true to be false`.

---

## Task 2: Implement conservative command guard

**Objective:** Block obvious write-intent commands without changing normal execution semantics.

**Files:**
- Modify: `packages/tools/src/sandbox.ts`

**Behavior:**
- Before spawning the shell, if effective `writeMode` is `readonly`, reject commands matching conservative, best-effort write patterns:
  - shell redirection (`>`, `>>`, `2>`),
  - `tee` including piped `|tee`,
  - `touch`, `mkdir`, `rm`, `rmdir`, `mv`, `cp`, `chmod`, `chown`, `ln`, `install`, `rsync`,
  - common git workspace mutations,
  - package-manager mutation commands and aliases such as `pnpm install`, `pnpm i`, `npm uninstall`, `yarn add`,
  - dynamic eval entry points such as `python -e` and `node --eval`.
- Return a structured `ExecutionResult` with `ok: false`, `exitCode: 1`, readonly error text, and sandbox metadata.
- Do not add credential reads, network calls, or background processes.

**TDD steps:**
1. Implement the smallest helper and preflight check.
2. Run: `pnpm --filter @world-harness/tools test -- test/sandbox.test.ts`.
3. Run: `pnpm --filter @world-harness/tools typecheck`.

Status in current cycle:
- ✅ Focused sandbox test passes.
- ✅ Tools typecheck passes.

---

## Task 3: Full verification and review

**Objective:** Prove the guard does not regress CLI smoke or other workspace packages.

**Commands:**
```bash
pnpm --filter @world-harness/tools test
pnpm --filter @world-harness/tools typecheck
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

**Review:**
- Run an independent read-only `delegate_task` review before commit.

**Commit:**
```bash
git add packages/tools/src/sandbox.ts packages/tools/test/sandbox.test.ts docs/plans/readonly-sandbox-enforcement.md
git commit -m "feat(tools): enforce readonly sandbox commands"
git push origin main
```

---

## Follow-up candidates

- Replace conservative command-string checks with stronger OS/container-level read-only filesystem enforcement.
- Surface sandbox enforcement decisions as explicit trace events in orchestrator runs.
- Add CLI flags to run tasks with readonly command mode for inspect/evaluation workflows.
