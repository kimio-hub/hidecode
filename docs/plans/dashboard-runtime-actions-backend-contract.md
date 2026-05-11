# Dashboard Runtime Actions Backend Contract Next Slice

> **For Hermes:** Continue autonomous loop on branch `main`. Start with `git status/log`. If clean, use up to 3 agents by file boundary: one implementer for pure contract/schema utilities, one test/fixture agent for smoke fixtures/docs, one read-only reviewer. Do not create cron/jobs. Do not read secrets. Do not enable browser-side mutations until the backend contract is covered by tests.

## Completed before this plan

- Runtime action request/response/audit shapes exist in `apps/dashboard/src/data/actions.ts`.
- Dashboard renders runtime readiness as `Offline` / `Preview only` / `Ready` indicators with tone/detail.
- Command Dock shows a readable runtime action preview, e.g. `command.ask-harness → command`.
- Online-but-contract-incompatible readiness is normalized to non-submittable preview-only copy.
- All runtime controls remain disabled/read-only.

## Next small implementation slice

### Task 1: Extract a pure backend contract validator

**Files:**

- `apps/dashboard/src/data/actions.ts`
- `apps/dashboard/src/data/actions.test.ts`

**Behavior:**

- Add pure validation/normalization helpers for runtime action backend responses, without network calls:
  - `normalizeRuntimeActionResponse(input: unknown): RuntimeActionResponse | undefined` or equivalent.
  - Accept only `status: accepted | rejected | duplicate`, boolean `accepted`, non-empty `commandId`, non-empty `traceEventId`.
  - Preserve optional `reason` and `queuedOperationId` only when strings.
  - Reject malformed shapes safely instead of throwing.
- Add tests for accepted/rejected/duplicate responses and malformed payloads.
- Keep helpers browser-safe and side-effect-free.

### Task 2: Document API ownership and no-mutation boundary

**Files:**

- `docs/plans/dashboard-runtime-actions-backend-contract.md` or a follow-up plan file.

**Behavior:**

- Define provisional endpoints:
  - `GET /api/dashboard/runtime-actions/readiness`
  - `POST /api/dashboard/runtime-actions`
- Document idempotency via `clientRequestId`, sanitized audit trace events, and no secret exposure.
- Explicitly state Dashboard must not call these endpoints until fixtures/tests cover the contract and a runtime service owner exists.

## Provisional backend API ownership contract

This section is documentation-only and does not authorize Dashboard network calls. The API owner is still **unassigned**. A future runtime service owner must explicitly accept ownership for authorization, idempotency, policy/sandbox/budget checks, trace emission, persistence, and operational support before the browser can call these endpoints.

### Endpoint: `GET /api/dashboard/runtime-actions/readiness`

Purpose: report whether the runtime action service can accept Dashboard action submissions.

Provisional response shape should normalize into `DashboardRuntimeActionReadiness`:

```ts
{
  state: 'not-configured' | 'offline' | 'online' | 'preview-only';
  canSubmitActions: boolean;
  reason: string;
  checkedAt?: string;
  backendVersion?: string;
  contractVersion?: 'dashboard-runtime-actions.v1';
  lastError?: string;
}
```

Contract rules:

- `canSubmitActions: true` is valid only with `state: 'online'` and `contractVersion: 'dashboard-runtime-actions.v1'`.
- Missing, malformed, stale, or contract-incompatible readiness must normalize to a non-submittable preview/offline state.
- Readiness must not include secrets, credentials, tokens, raw environment values, stack traces with sensitive paths, or policy internals that would aid bypass.

### Endpoint: `POST /api/dashboard/runtime-actions`

Purpose: submit one runtime action command envelope for approval, replay/fork/save-eval, agent, or command domains.

Provisional request shape should align with `RuntimeActionRequest`:

```ts
{
  domain: 'approval' | 'replay' | 'agent' | 'command';
  action: string;
  target?: { kind: string; id?: string };
  requiresBackend: true;
  clientRequestId?: string;
}
```

Provisional response shape should normalize into `RuntimeActionResponse`:

```ts
{
  status: 'accepted' | 'rejected' | 'duplicate';
  accepted: boolean;
  commandId: string;
  traceEventId: string;
  reason?: string;
  queuedOperationId?: string;
}
```

Contract rules:

- The backend owns all mutations. Dashboard remains a request author only; it must not directly mutate approvals, replay state, agents, command queues, traces, files, or shell state.
- `clientRequestId` is the idempotency key for browser retries. Replaying the same valid request with the same `clientRequestId` must not execute the action twice.
- Duplicate handling should return `status: 'duplicate'`, the original or canonical `commandId`, a traceable `traceEventId`, and `accepted: false`; the canonical command/audit trace can be followed through `commandId` and `traceEventId` if the operator needs the original accepted or rejected outcome.
- Requests without `clientRequestId` may be rejected or accepted under a backend-generated idempotency scope, but the Dashboard should send one before submissions are enabled.
- `accepted: true` is only valid for `status: 'accepted'` outcomes that have passed authorization, policy, sandbox, and budget checks; `status: 'rejected'` and `status: 'duplicate'` must use `accepted: false`.
- `rejected` responses should include only a sanitized, user-safe `reason`.

### Sanitized audit trace events

Every accepted, rejected, or duplicate action attempt should emit a sanitized audit event compatible with `RuntimeActionAuditEvent`:

```ts
{
  eventId: string;
  type: 'dashboard.runtime_action.accepted' | 'dashboard.runtime_action.rejected' | 'dashboard.runtime_action.duplicate';
  commandId: string;
  clientRequestId?: string;
  domain: string;
  action: string;
  target?: { kind: string; id?: string };
  receivedAt: string;
  outcome: {
    status: 'accepted' | 'rejected' | 'duplicate';
    accepted: boolean;
    reason?: string;
    queuedOperationId?: string;
  };
}
```

Trace safety requirements:

- No secrets, credentials, bearer tokens, API keys, cookies, raw prompts containing secrets, environment dumps, filesystem secrets, or command output with sensitive data.
- Target identifiers and reasons must be sanitized and bounded before persistence or display.
- Trace events should link `eventId`, `traceEventId`, `commandId`, and `clientRequestId` enough for audit/retry debugging without exposing private runtime internals.

### Dashboard no-call boundary

Dashboard must **not** call `GET /api/dashboard/runtime-actions/readiness` or `POST /api/dashboard/runtime-actions` until all of the following are true:

1. Contract fixtures cover readiness, accepted, rejected, duplicate, malformed, and secret-redaction cases.
2. Unit tests prove malformed readiness/responses cannot enable controls or trigger submissions.
3. Integration or service tests cover idempotent `clientRequestId` retry behavior and sanitized audit trace emission.
4. A named runtime service owner exists for these endpoints and owns policy/sandbox/budget enforcement.
5. A follow-up implementation plan explicitly scopes browser fetch behavior and preserves disabled controls until the above gates pass.

### Task 3: Read-only review focus

Ask reviewer to check:

- No browser mutation/fetch/timer side effects were added.
- Malformed backend payloads cannot enable controls.
- Contract helpers align with existing `RuntimeActionRequest`, `RuntimeActionResponse`, and `RuntimeActionAuditEvent` shapes.

## Verification commands

```bash
pnpm --filter @world-harness/dashboard test -- --run src/data/actions.test.ts src/ui/__tests__/Dashboard.test.tsx
pnpm --filter @world-harness/dashboard test
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

## Non-goals

- Do not enable runtime action submission buttons.
- Do not add frontend fetch/socket calls yet.
- Do not implement backend service routes in this slice.
- Do not store or expose secrets in requests, responses, traces, fixtures, or docs.
