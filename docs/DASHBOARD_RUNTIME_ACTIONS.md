# Dashboard Runtime Actions

The Dashboard runtime controls are intentionally read-only today. The UI may display action affordances so operators can see where approval, replay, agent, and command workflows will live, but those affordances must not mutate state until a backend runtime action API exists.

## Current action model

`apps/dashboard/src/data/actions.ts` defines pure `DashboardActionIntent` values for the currently planned runtime actions:

- Approval Queue: `approve`, `reject`
- Replay Debug: `replay`, `fork`, `save-eval`
- Multi-Agent Board: `assign`, `handoff`, `unblock`
- Command Dock: `ask-harness`

All current intents have:

- `enabled: false`
- `requiresBackend: true`
- a visible label used by the UI button
- a stable disabled reason exposed through button `title` text
- explicit `target.kind` metadata so future backend requests can distinguish approvals, replay steps, runs, agents, and commands
- optional `targetId` when an action targets a specific approval item, replay step/run, or agent card

## Future backend boundary

When backend support exists, browser controls should submit a `RuntimeActionRequest` derived from the current intent with `toRuntimeActionRequest(intent, clientRequestId)`. The helper is pure and performs no network calls; callers are responsible for generating idempotent `clientRequestId` values before submission.

Base request envelope:

```ts
interface RuntimeActionRequest {
  domain: 'approval' | 'replay' | 'agent' | 'command';
  action: string;
  target?: { kind: 'approval' | 'replay-step' | 'run' | 'agent' | 'command'; id?: string };
  requiresBackend: true;
  clientRequestId?: string;
}
```

A future runtime action backend should provide explicit, auditable endpoints for:

1. Resolving approvals: approve or reject a specific approval queue item.
2. Replay operations: replay a step/run, fork a run, or save an evaluation case.
3. Agent operations: assign, hand off, or unblock an agent/task.
4. Command submission: ask the harness from the command dock.

Until those endpoints exist, the Dashboard must remain a display/control-shell only.

## Security constraints

- Do not expose secrets, tokens, private keys, auth JSON, or model credentials in UI action payloads.
- Do not execute shell commands or write local files directly from the browser UI.
- Do not bypass harness policy, sandbox, approval, budget, or retry checks.
- Mutating and shell-capable actions must require an explicit backend policy/approval path.
- Action attempts should be traceable when backend support is added.
