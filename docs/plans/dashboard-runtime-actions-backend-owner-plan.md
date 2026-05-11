# Dashboard Runtime Actions Backend Owner Plan

## Scope and boundary

Documentation-only owner discovery for the provisional Dashboard runtime action backend seam:

- `GET /api/dashboard/runtime-actions/readiness`
- `POST /api/dashboard/runtime-actions`

No routes, jobs, workers, queues, persistence, or source implementation changes are authorized by this plan. Dashboard runtime controls remain read-only and must not call these endpoints until a named runtime service owner accepts the full contract and tests cover readiness, submission, idempotency, policy/sandbox/budget checks, and sanitized audit traces.

## Repository boundary findings

Current packages suggest runtime primitives but no obvious HTTP/API service owner:

- `apps/dashboard`: Vite/React UI only. It owns pure browser-side action/readiness models and normalization helpers, but must not own mutations, direct file writes, shell execution, authorization, or runtime state transitions.
- `apps/cli`: command-line entrypoint that wires task execution, policy, budget, sandbox, and trace output for local runs. It is not an HTTP service and should not become the long-lived dashboard API owner without an explicit server package split.
- `packages/orchestrator`: best candidate for runtime action semantics because it already coordinates model/tool execution, policy decisions, budget tracking, approval-required flow, sandbox metadata emission, and trace events. It is a library package, not currently an API server or durable command store.
- `packages/core`: owns shared schemas, event types, `JsonlEventStore`, run artifacts, budget tracker, security scanner exports, and version metadata. Good home for shared contracts/storage abstractions, but not for endpoint ownership.
- `packages/policy`: owns policy decision logic. It should remain an enforcement dependency for the runtime action owner, not the endpoint owner.
- `packages/tools`: owns repo-scoped tools and `LocalSandbox`. It should remain the sandbox execution/enforcement dependency, not the endpoint owner.
- `packages/workspace`: owns workspace checkpoint/rollback primitives. It may be a dependency for replay/fork flows, not the endpoint owner.
- There is no discovered Express/Fastify/Hono/Node HTTP server route boundary in the repo.

## Owner candidates by responsibility

| Responsibility | Candidate owner | Required dependency/collaborators | Plan decision |
| --- | --- | --- | --- |
| `GET /api/dashboard/runtime-actions/readiness` | New explicit runtime API/service package, e.g. future `apps/runtime-api` or `packages/runtime-service` | `@world-harness/core` for contract version/run metadata, orchestrator runtime health if exposed | **Unassigned.** No existing HTTP owner. Do not make Dashboard or CLI own this implicitly. |
| `POST /api/dashboard/runtime-actions` | New explicit runtime API/service package wrapping orchestrator capabilities | `@world-harness/orchestrator`, `@world-harness/policy`, `@world-harness/tools`, `@world-harness/core`, possibly `@world-harness/workspace` | **Unassigned.** `packages/orchestrator` is the closest semantic owner but lacks API/persistence boundary. |
| Idempotency persistence keyed by `clientRequestId` | Future runtime API/service package | Durable store abstraction likely in/near `@world-harness/core`; trace linkage via `JsonlEventStore` initially if accepted | **Unassigned.** Existing JSONL trace store is append-only audit, not sufficient alone as a concurrency-safe idempotency store. |
| Authorization checks | Future runtime API/service package | Future auth/RBAC layer; `packages/policy` handles risk policy but not user auth | **Unassigned.** No current principal/session/RBAC owner discovered. |
| Policy checks | Runtime API/service package calls `@world-harness/policy` | `decide(...)` and policy types | Candidate collaborator is clear; endpoint owner remains unassigned. |
| Sandbox checks | Runtime API/service package calls `@world-harness/tools` sandbox/tool seam | `LocalSandbox`, repo-scoped tool wrappers, sandbox result metadata | Candidate collaborator is clear; endpoint owner remains unassigned. |
| Budget checks | Runtime API/service package or orchestrator runtime calls `@world-harness/core` budget primitives | `BudgetTracker`, per-run/task budget config/state | Candidate collaborator is clear; endpoint owner remains unassigned. |
| Sanitized audit trace emission | Runtime API/service package writes through core event abstractions and/or orchestrator trace seam | `JsonlEventStore`, `TraceEvent` schema, security scanner, runtime action audit contract | Candidate collaborator is clear; endpoint owner remains unassigned until a service owns trace path/run scope and redaction policy. |

## Recommended ownership model

Create a named runtime API/service boundary before implementing routes:

1. Add or nominate a service owner such as `apps/runtime-api` for HTTP transport, auth/session context, request validation, idempotency persistence, and operational support.
2. Keep orchestration semantics in `packages/orchestrator`; the service should call orchestrator-level functions rather than duplicating tool execution or state-transition rules.
3. Keep shared request/response/audit schemas in `packages/core` or a contract module if they need to be consumed by both Dashboard and the runtime service.
4. Keep `packages/policy`, `packages/tools`, and budget/security utilities as dependencies invoked server-side before accepting or queueing a mutation.
5. Treat the CLI as a developer/operator entrypoint only unless a future plan explicitly creates a server mode with persistence, auth, and lifecycle ownership.

## Contract obligations for the future owner

The named owner must implement and test all of the following before Dashboard fetches are enabled:

- Readiness endpoint returns `contractVersion: 'dashboard-runtime-actions.v1'` only when the service can safely accept submissions; malformed/stale/unavailable readiness must keep `canSubmitActions: false`.
- Submission endpoint accepts one runtime action envelope at a time and validates domain/action/target shape before any mutation.
- `clientRequestId` is required or normalized into a server-generated idempotency scope; persisted idempotency records must prevent duplicate execution across retries/restarts.
- Duplicate requests return `status: 'duplicate'`, `accepted: false`, stable/canonical `commandId`, and a traceable `traceEventId` without re-running the mutation.
- Accepted requests require successful authorization, policy, sandbox, and budget checks before queueing/executing work.
- Rejected requests emit sanitized reasons only; policy internals, stack traces, environment values, credentials, raw prompts containing secrets, and private filesystem details must not be exposed.
- Every accepted, rejected, or duplicate attempt emits a sanitized audit trace event linking `eventId`, `traceEventId`, `commandId`, and `clientRequestId` enough for audit/retry debugging.
- Integration tests cover readiness, accepted, rejected, duplicate, malformed payloads, idempotent retry behavior, and trace redaction with fake sentinel secret strings only.

## No-call boundary

Because no runtime service owner is obvious in the current package layout, ownership remains **unassigned**. Dashboard must continue to render runtime actions as preview/read-only and must not call:

- `GET /api/dashboard/runtime-actions/readiness`
- `POST /api/dashboard/runtime-actions`

The next implementation slice should be another plan/contract slice or a dedicated service-boundary proposal; it should not add browser network calls, backend routes, persistence tables, jobs, workers, or command execution paths until ownership is assigned.
