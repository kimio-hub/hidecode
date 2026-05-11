# Run Manifest Model Metadata Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Continue after Dashboard/CLI usability by making run manifests truthfully record the model adapter used for a run, so traces and Dashboard summaries can distinguish scripted smoke runs from real LLM runs.

**Architecture:** Keep the change local to the orchestrator result/manifest path. Extend `ModelAdapter` with optional provider metadata only if needed; otherwise derive a conservative provider/name from the existing adapter instance. Do not log API keys, base URLs with embedded credentials, headers, prompts, or raw model responses.

**Tech Stack:** TypeScript, Vitest, pnpm workspaces, existing `@world-harness/models` and `@world-harness/orchestrator` packages.

---

## Evaluation From Previous Cycle

Completed:
- ✅ Dashboard loads real run/trace data.
- ✅ Mission Control v2 shell exists.
- ✅ Read-only Approval Queue exists.
- ✅ Read-only Replay Debug exists.
- ✅ Read-only Multi-Agent Board exists.
- ✅ CLI prints artifact/dashboard hints and Dashboard smoke-artifact loading is covered.
- ✅ Full repo test/typecheck/build/smoke passed before this plan.

Remaining gap:
- `run.json` currently writes `model: { provider: 'unknown', name: 'unknown' }` even though `runSingleAgentTask` receives a concrete model adapter.
- This makes Dashboard/run inspection less useful and weakens the design loop around real LLM vs deterministic scripted execution.

---

## Task 1: Add failing orchestrator manifest metadata test

**Objective:** Prove `run.json` records the model name/provider for deterministic and real adapter-compatible runs.

**Files:**
- Modify: `packages/orchestrator/test/orchestrator.test.ts`

**Behavior:**
- A run using `new ScriptedModelAdapter(...)` writes a manifest whose `model.name` is `scripted-local`.
- `model.provider` should be stable and non-empty, preferably `scripted` for the scripted adapter.
- The test must read `run.json` from the emitted run directory, not just inspect the in-memory result.

**TDD steps:**
1. Add the failing test expectation around the manifest JSON.
2. Run: `pnpm --filter @world-harness/orchestrator test -- test/orchestrator.test.ts` and confirm RED because the manifest still says `unknown`.
3. Do not change production code until the failure is confirmed.

---

## Task 2: Implement minimal model metadata propagation

**Objective:** Write truthful non-secret model metadata into the manifest.

**Files:**
- Modify: `packages/models/src/index.ts` if adding an optional `provider` field to `ModelAdapter`.
- Modify: `packages/orchestrator/src/index.ts`.

**Behavior:**
- Manifest model metadata should be derived from safe adapter fields only:
  - `name`: `opts.model.name` or `unknown` fallback.
  - `provider`: optional `opts.model.provider`, or a deterministic fallback such as `scripted` for `scripted-local`, otherwise `unknown`/`openai-compatible` if explicitly added.
- Do not serialize adapter config, API key, base URL, prompt, observations, or headers.
- Preserve existing result shape unless a typed addition is necessary.

**TDD steps:**
1. Implement only enough code to pass the new test.
2. Run the focused orchestrator test.
3. Run `pnpm --filter @world-harness/orchestrator typecheck`.

---

## Task 3: Add adapter-level coverage if provider is explicit

**Objective:** Keep model metadata behavior stable at the model package seam.

**Files:**
- Modify if needed: `packages/models/test/models.test.ts`

**Behavior:**
- If `ModelAdapter` gains `provider`, cover that `ScriptedModelAdapter.provider === 'scripted'` and `OpenAIModelAdapter.provider === 'openai-compatible'` or another chosen stable string.
- Keep tests free of real network calls and credentials.

---

## Verification

```bash
pnpm --filter @world-harness/orchestrator test
pnpm --filter @world-harness/orchestrator typecheck
pnpm --filter @world-harness/models test
pnpm --filter @world-harness/models typecheck
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

Review:
- Run an independent read-only `delegate_task` review before commit.

Commit:
```bash
git add packages/models packages/orchestrator docs/plans/run-manifest-model-metadata.md
git commit -m "feat(orchestrator): record model metadata in run manifest"
git push origin main
```
