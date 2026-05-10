# CLI Usability Baseline Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Continue after the read-only Multi-Agent Board by tightening the CLI entry points so users can discover, run, and inspect harness outputs comfortably from the terminal.

**Architecture:** Improve the existing `@world-harness/cli` package without changing orchestrator semantics. Add tests first around help output and output artifact discoverability, then make the smallest CLI/documentation changes needed. Keep commands local-only and avoid reading secrets.

**Tech Stack:** TypeScript, Vitest, pnpm workspaces, existing `apps/cli` command runner.

---

## Evaluation From Previous Cycle

Completed:
- ✅ Dashboard loads real run/trace data.
- ✅ Mission Control v2 shell exists.
- ✅ Read-only Approval Queue derives policy/security/high-risk tool items.
- ✅ Read-only Replay Debug derives chronological trace steps and disabled future actions.
- ✅ Read-only Multi-Agent Board now has pure derivation plus UI integration.
- ✅ Full repo test/typecheck/build/smoke passed after Multi-Agent Board UI work.

Remaining gap:
- The long-term completion criteria include CLI usability. The CLI already has smoke/help coverage, but the user experience for discovering run artifacts and dashboard handoff should be made explicit and tested.
- Dashboard now has useful trace views; the CLI should clearly tell users where traces/reports land and how to open them in the dashboard.

---

## Task 1: Inspect current CLI command surface

**Objective:** Establish the current command/help/output behavior before changing it.

**Files:**
- Read: `apps/cli/src/index.ts`
- Read: `apps/cli/test/cli.test.ts`
- Read: `package.json`

**Steps:**
1. Run: `pnpm --filter @world-harness/cli test`.
2. Run: `pnpm --filter @world-harness/cli start -- --help` or the repo-supported equivalent.
3. Run: `pnpm smoke` and note emitted output wording.
4. Document the exact behavior that needs a CLI usability improvement.

---

## Task 2: Add failing CLI help/output tests

**Objective:** Capture the desired usability guarantees before implementation.

**Files:**
- Modify: `apps/cli/test/cli.test.ts`

**Behavior:**
- Help output mentions key sandbox flags already covered today.
- Help or run/smoke output should mention trace/report artifacts in human-readable terms.
- If a dashboard URL/query can be derived without starting a server, output should include a copyable hint such as `?run=...` or `?trace=...&manifest=...`.

**TDD steps:**
1. Add one focused failing test for artifact discoverability.
2. Run: `pnpm --filter @world-harness/cli test` and confirm RED for the new expectation.
3. Do not change production code until the failure is confirmed.

---

## Task 3: Implement minimal CLI usability improvement

**Objective:** Make the CLI print artifact/dashboard hints without changing execution semantics.

**Files:**
- Modify: `apps/cli/src/index.ts` or the actual command module found in Task 1.

**Behavior:**
- After successful run/smoke completion, print trace/report paths or dashboard query hints if those values already exist in the run result.
- Keep output stable enough for tests.
- Do not add network calls, background servers, or credential reads.

**TDD steps:**
1. Implement only enough output formatting to pass the failing test.
2. Run: `pnpm --filter @world-harness/cli test`.
3. Run: `pnpm smoke` to verify real smoke output remains successful.

---

## Task 4: Document CLI-to-dashboard workflow

**Objective:** Make the improved workflow discoverable in docs.

**Files:**
- Modify existing README/docs if present, or create: `docs/plans/cli-usability-baseline.md` follow-up notes section only if no better docs location exists.

**Behavior:**
- Show a minimal command sequence:
  - run/smoke harness,
  - locate `trace.jsonl` and `run.json`,
  - open Dashboard with `?run=...` or explicit `?trace=...&manifest=...`.

---

## Verification

```bash
pnpm --filter @world-harness/cli test
pnpm --filter @world-harness/cli typecheck
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

Review:
- Run an independent read-only `delegate_task` review before commit.

Commit:
```bash
git add apps/cli docs README.md package.json
# adjust paths to actual changed files
git commit -m "feat(cli): surface run artifact hints"
git push origin main
```
