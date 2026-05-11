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

Until those endpoints exist, the Dashboard must remain a display/control-shell only. The browser UI remains read-only until backend support exists; adding the API contract below does not enable fetches, direct mutation, shell execution, or local file writes from the Dashboard.

## Proposed backend API seam

The concrete seam should be treated as a proposal for backend review, not as an enabled browser integration. Mutating operations may be exposed either as resource-specific HTTP endpoints or as a single command bus. In both forms, every accepted or rejected action must produce an auditable trace event.

### Shared command envelope

All mutating Dashboard runtime actions should use a shared envelope so the backend can enforce idempotency, authorization, policy, sandbox, and budget checks consistently:

```ts
interface DashboardRuntimeCommand<TPayload> {
  commandId: string; // client-generated idempotency key, equivalent to clientRequestId
  domain: 'approval' | 'replay' | 'agent' | 'command';
  action: string;
  target: { kind: 'approval' | 'replay-step' | 'run' | 'agent' | 'command'; id?: string };
  payload: TPayload;
  requestedBy: { principalId: string; displayName?: string };
  requestedAt: string; // ISO 8601 timestamp from the client; server records receivedAt separately
  traceContext?: { runId?: string; taskId?: string; parentTraceEventId?: string };
}
```

The preferred transport is `POST /api/dashboard/runtime-actions` with the envelope above. The endpoint may return synchronously after validation and queuing; long-running work should be reported through trace/runtime event streams rather than by holding the HTTP request open.

```ts
interface DashboardRuntimeActionResponse {
  status: 'accepted' | 'rejected' | 'duplicate';
  commandId: string;
  traceEventId: string;
  reason?: string;
  queuedOperationId?: string;
}
```

Idempotent retries with the same `commandId` must return the original response or a `duplicate` response linked to the original `traceEventId`. A retry must not execute the same mutation twice.

### Approval resolution

Resource-specific option:

- `POST /api/dashboard/approvals/{approvalId}/resolve`

Command-bus option:

```json
{
  "commandId": "uuid-or-client-request-id",
  "domain": "approval",
  "action": "approve",
  "target": { "kind": "approval", "id": "approval-123" },
  "payload": {
    "decision": "approve",
    "comment": "Operator-approved rationale without secrets"
  }
}
```

`action`/`payload.decision` must be either `approve` or `reject`. The backend must verify that the approval exists, is still pending, belongs to the visible run/task scope, and can be resolved by the requesting principal. The response trace event should include the approval id, decision, decision reason, requester, and resulting operation id if downstream execution is queued.

### Replay, fork, and save-eval

Resource-specific options:

- `POST /api/dashboard/runs/{runId}/replay`
- `POST /api/dashboard/runs/{runId}/fork`
- `POST /api/dashboard/runs/{runId}/eval-cases`
- `POST /api/dashboard/replay-steps/{stepId}/replay`

Command-bus examples:

```json
{
  "commandId": "uuid-or-client-request-id",
  "domain": "replay",
  "action": "replay",
  "target": { "kind": "replay-step", "id": "step-456" },
  "payload": {
    "scope": "step",
    "mode": "dry-run-or-queued",
    "parameterOverrides": {}
  }
}
```

```json
{
  "commandId": "uuid-or-client-request-id",
  "domain": "replay",
  "action": "fork",
  "target": { "kind": "run", "id": "run-789" },
  "payload": {
    "forkName": "operator-visible label",
    "startFromStepId": "step-456"
  }
}
```

```json
{
  "commandId": "uuid-or-client-request-id",
  "domain": "replay",
  "action": "save-eval",
  "target": { "kind": "run", "id": "run-789" },
  "payload": {
    "caseName": "operator-visible label",
    "includeTraceEventIds": ["trace-event-id"]
  }
}
```

Replay payloads must never include raw secrets, auth headers, provider tokens, private files, or opaque environment dumps. The backend must reconstruct any privileged execution context from server-side state after policy, sandbox, and budget checks pass. Every accepted replay/fork/save-eval request should emit a trace event linking the source run/step, requester, resulting replay/fork/eval id, and sanitized parameter diff. Every rejected request should emit a trace event with the rejection reason and the failed check category.

### Agent assignment, handoff, and unblock

Resource-specific options:

- `POST /api/dashboard/agents/{agentId}/assign`
- `POST /api/dashboard/agents/{agentId}/handoff`
- `POST /api/dashboard/agents/{agentId}/unblock`

Command-bus examples:

```json
{
  "commandId": "uuid-or-client-request-id",
  "domain": "agent",
  "action": "assign",
  "target": { "kind": "agent", "id": "agent-123" },
  "payload": {
    "taskId": "task-456",
    "role": "reviewer"
  }
}
```

```json
{
  "commandId": "uuid-or-client-request-id",
  "domain": "agent",
  "action": "handoff",
  "target": { "kind": "agent", "id": "agent-123" },
  "payload": {
    "toAgentId": "agent-789",
    "taskId": "task-456",
    "handoffNote": "Sanitized operator note"
  }
}
```

```json
{
  "commandId": "uuid-or-client-request-id",
  "domain": "agent",
  "action": "unblock",
  "target": { "kind": "agent", "id": "agent-123" },
  "payload": {
    "taskId": "task-456",
    "resolution": "Sanitized unblock reason"
  }
}
```

The backend must verify that agent/task transitions are valid, visible to the requester, and permitted by current orchestration policy. It should reject stale assignments and conflicting handoffs with traceable reasons rather than letting the browser infer state transitions locally.

### Ask-harness command submission

Resource-specific option:

- `POST /api/dashboard/harness/commands`

Command-bus example:

```json
{
  "commandId": "uuid-or-client-request-id",
  "domain": "command",
  "action": "ask-harness",
  "target": { "kind": "command" },
  "payload": {
    "prompt": "Operator request text with no embedded secrets",
    "runId": "run-789",
    "taskId": "task-456",
    "attachments": []
  }
}
```

The backend must treat `ask-harness` as a privileged command submission path. It must run the same server-side policy, sandbox, approval, and budget gates used by non-Dashboard harness requests before enqueueing or executing anything. Browser-submitted prompts must be sanitized and logged without secrets. Attachments, if later supported, must be references to previously authorized server-side artifacts rather than raw file contents or credentials.

### Runtime action trace events

Every accepted, rejected, and duplicate mutating command must emit or reference a durable trace event. A proposed event shape:

```ts
interface RuntimeActionTraceEvent {
  eventId: string;
  type: 'dashboard.runtime_action.accepted' | 'dashboard.runtime_action.rejected' | 'dashboard.runtime_action.duplicate';
  commandId: string;
  domain: 'approval' | 'replay' | 'agent' | 'command';
  action: string;
  target: { kind: 'approval' | 'replay-step' | 'run' | 'agent' | 'command'; id?: string };
  requestedBy: { principalId: string; displayName?: string };
  receivedAt: string;
  outcome: {
    status: 'accepted' | 'rejected' | 'duplicate';
    reason?: string;
    policyCheckId?: string;
    sandboxCheckId?: string;
    budgetCheckId?: string;
    queuedOperationId?: string;
  };
}
```

Trace events must contain sanitized metadata only. They should be sufficient for audit, replay debugging, and UI status updates without leaking secrets or embedding raw tool inputs that may contain credentials.

## Security constraints

- Do not expose secrets, tokens, private keys, auth JSON, environment files, auth headers, provider credentials, or model credentials in UI action payloads.
- Do not execute shell commands or write local files directly from the browser UI.
- Do not bypass harness policy, sandbox, approval, budget, or retry checks.
- Mutating and shell-capable actions must require an explicit backend policy/approval path.
- The server, not the browser, must enforce authorization, policy, sandbox, budget, concurrency, state freshness, and allowed-transition checks.
- Every mutating action must include an idempotency key (`clientRequestId`/`commandId`), and backend retries must not double-apply mutations.
- Every accepted, rejected, or duplicate action attempt must be represented by an auditable trace event with sanitized metadata.
- Browser code must continue to render Dashboard runtime controls as read-only/disabled until backend support and integration tests exist.
