# hidecode GUI-first Product Plan

> **For Hermes:** Use `subagent-driven-development` to implement this plan task-by-task. Keep tasks small, test-first where practical, and commit after each completed slice.

**Product name:** hidecode

**Goal:** Build hidecode as a GUI-first AI coding workspace: users open the app, choose/open a project, chat with an AI coding agent, watch tool execution in real time, review diffs, approve/reject risky changes, and inspect trace/replay/history without needing to start from CLI commands.

**Architecture:** The current repo already has a useful agent runtime, CLI, trace/run artifacts, Dashboard components, sandbox policy hooks, approval models, and runtime action contracts. The next phase should reframe the frontend from a trace dashboard into an app shell with Home, Chat Workspace, Active Run, and Review modes. CLI remains a power-user/automation layer; the primary UX becomes local GUI + backend session runtime.

**Tech Stack:** TypeScript monorepo, pnpm, React/Vite dashboard, Node.js local backend/CLI, existing `runSingleAgentTask` orchestrator, existing trace/run manifest artifacts, existing dashboard components (`ToolTimeline`, `ApprovalQueue`, `ReplayDebugger`, `AgentBoard`, `DiffPanel`, `PolicyPanel`).

---

## Product Vision

hidecode is not just a CLI harness with a dashboard. It should feel like a local AI coding application:

```text
Open hidecode
→ Open project
→ Start/chat in a coding session
→ Agent plans and runs tools
→ User observes test output / trace / budget / sandbox state
→ Agent proposes patches
→ User reviews diff and approves/rejects
→ Session history and run artifacts stay inspectable
```

The desired feel is closer to OpenCode, Codex App, Claude Code, Linear, and Arc-style dark developer tooling: high-density, visual, interactive, safety-aware.

---

## Four Core Product Screens

The user provided four visual references. Treat these as the product blueprint.

### 1. Home / Project Picker

**Purpose:** First screen after opening hidecode.

**Key UI:**
- Recent Projects panel
- Welcome hero: `Open Folder`, `Clone Repository`, drag folder here
- Quick Start cards:
  - Fix failing tests
  - Review current diff
  - Explain this codebase
  - Plan a new feature
- Model & Safety setup:
  - Model
  - Provider
  - Sandbox
  - Runtime

**Outcome:** User can open a project and start an AI coding session without touching CLI.

### 2. Chat Workspace

**Purpose:** Default screen after opening a project.

**Key UI:**
- Left sidebar:
  - Current project
  - File tree
  - Sessions
  - Settings / Help
  - Model selector
- Center:
  - Chat messages
  - Agent response
  - Plan card
  - Run progress
  - Composer input
  - quick actions: Run / Plan / Review / Stop
- Right inspector:
  - Tabs: Tools / Diff / Approvals / Trace
  - Tool call cards
  - terminal output preview
- Bottom status:
  - git branch
  - sandbox
  - budget
  - model/runtime status

**Outcome:** Chat is the primary way users interact with the model.

### 3. Active Coding Session / Tool Execution

**Purpose:** Show a real task in progress, especially debugging/test-fix loops.

**Key UI:**
- Recent Runs list with statuses: failed/success/waiting/canceled
- Plan steps with status: failed/completed/waiting/not started
- Expanded tool output, e.g. failed `pnpm test` output
- Pending patch/tool cards

**Outcome:** User can understand what the agent is doing and why a step failed.

### 4. Review / Approval / Diff

**Purpose:** Human-in-the-loop review when agent proposes code changes.

**Key UI:**
- Changed files list with `+/-` counts
- Side-by-side and unified diff viewer
- Approval Queue card:
  - risk
  - sandbox
  - affected files
  - Approve / Reject / Ask for changes
- Policy explanation
- Command preview
- bottom status: tests, budget, git, sandbox, runtime

**Outcome:** Agent changes are never opaque. The user reviews and controls risky/mutating actions.

---

## Existing Assets to Reuse

Do not throw away current Dashboard work. Reframe it into the new app modes.

| Existing asset | New product role |
|---|---|
| `ToolTimeline` | Right Inspector / Tools tab |
| `ApprovalQueue` | Review mode / Approvals tab |
| `ReplayDebugger` | Trace / Replay tab |
| `AgentBoard` | Monitor / multi-agent tab |
| `DiffPanel` | Review mode central diff area |
| `PolicyPanel` | Approval policy explanation |
| Runtime action models | Button intents: approve/reject/stop/run/review |
| Trace normalization helpers | Convert real orchestrator trace into UI state |
| CLI run/smoke/inspect/replay | Power-user and backend plumbing |
| `.runs` artifacts | Session/run history backend storage seed |

---

## Milestone A — Product Roadmap + App Mode Model

**Objective:** Stop thinking of the frontend as only a dashboard. Define hidecode as an app with explicit modes.

**Files:**
- Create/modify: `docs/plans/gui-first-hidecode-product-plan.md`
- Create: `apps/dashboard/src/data/appMode.ts`
- Test: `apps/dashboard/src/data/appMode.test.ts`

**Tasks:**
1. Define app modes:
   ```ts
   export type HidecodeAppMode = 'home' | 'chat' | 'review' | 'replay' | 'monitor';
   ```
2. Define minimal navigation state:
   ```ts
   export interface HidecodeAppState {
     mode: HidecodeAppMode;
     projectId?: string;
     sessionId?: string;
     selectedRunId?: string;
     selectedFile?: string;
   }
   ```
3. Add tests for mode parsing/defaults.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test src/data/appMode.test.ts
pnpm --filter @world-harness/dashboard typecheck
```

---

## Milestone B — App Shell Skeleton

**Objective:** Replace the default “dashboard-only” feel with a real application shell.

**Files:**
- Create: `apps/dashboard/src/ui/AppShell.tsx`
- Create: `apps/dashboard/src/ui/components/TopBar.tsx`
- Create: `apps/dashboard/src/ui/components/LeftSidebar.tsx`
- Create: `apps/dashboard/src/ui/components/RightInspector.tsx`
- Create: `apps/dashboard/src/ui/components/BottomStatusBar.tsx`
- Modify: `apps/dashboard/src/ui/App.tsx`
- Test: `apps/dashboard/src/ui/__tests__/AppShell.test.tsx`

**Tasks:**
1. Build a three-column shell:
   - left sidebar fixed width
   - center workspace flexible
   - right inspector fixed width
   - bottom status bar
2. Add mode slots:
   ```tsx
   <AppShell
     sidebar={<ProjectSidebar />}
     workspace={<ChatWorkspace />}
     inspector={<RightInspector />}
     status={<BottomStatusBar />}
   />
   ```
3. Preserve existing query-based run loading for replay/dashboard data, but default empty launch should go to Home or Chat shell, not pure mock dashboard.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test src/ui/__tests__/AppShell.test.tsx
pnpm --filter @world-harness/dashboard typecheck
pnpm --filter @world-harness/dashboard build
```

---

## Milestone C — Home / Project Picker UI

**Objective:** Implement the first-open experience.

**Files:**
- Create: `apps/dashboard/src/ui/modes/HomePage.tsx`
- Create: `apps/dashboard/src/ui/components/RecentProjectsPanel.tsx`
- Create: `apps/dashboard/src/ui/components/QuickStartPanel.tsx`
- Create: `apps/dashboard/src/ui/components/ModelSafetySetup.tsx`
- Create: `apps/dashboard/src/data/projects.ts`
- Test: `apps/dashboard/src/ui/__tests__/HomePage.test.tsx`

**Tasks:**
1. Mock recent projects:
   - hidecode
   - world-harness
   - ljquant
2. Add `Open Folder`, `Clone Repository`, and drag-folder placeholder UI.
3. Add Quick Start cards:
   - Fix failing tests
   - Review current diff
   - Explain this codebase
   - Plan a new feature
4. Add Model/Safety cards:
   - GPT-5.5
   - Local CPA
   - Guarded sandbox
   - Runtime connected/offline

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test src/ui/__tests__/HomePage.test.tsx
pnpm --filter @world-harness/dashboard typecheck
```

**Acceptance:** Opening the app with no project/session should look like a real product home screen.

---

## Milestone D — Chat Workspace UI

**Objective:** Make chat the primary interaction surface.

**Files:**
- Create: `apps/dashboard/src/ui/modes/ChatWorkspace.tsx`
- Create: `apps/dashboard/src/ui/components/ChatPanel.tsx`
- Create: `apps/dashboard/src/ui/components/MessageList.tsx`
- Create: `apps/dashboard/src/ui/components/MessageComposer.tsx`
- Create: `apps/dashboard/src/ui/components/AgentPlanCard.tsx`
- Create: `apps/dashboard/src/ui/components/RunProgress.tsx`
- Create: `apps/dashboard/src/data/chat.ts`
- Test: `apps/dashboard/src/ui/__tests__/ChatWorkspace.test.tsx`
- Test: `apps/dashboard/src/data/chat.test.ts`

**Tasks:**
1. Define chat data model:
   ```ts
   export type ChatMessageRole = 'user' | 'assistant' | 'tool' | 'system';
   export interface ChatMessage {
     id: string;
     role: ChatMessageRole;
     createdAt: string;
     content: string;
     plan?: AgentPlan;
   }
   export interface AgentPlanStep {
     id: string;
     label: string;
     status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting';
   }
   export interface AgentPlan {
     title: string;
     steps: AgentPlanStep[];
   }
   ```
2. Render user and assistant messages.
3. Render plan card with step statuses.
4. Render composer with quick actions: Run / Plan / Review / Stop.
5. Start with mock messages matching the visual reference.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test src/data/chat.test.ts src/ui/__tests__/ChatWorkspace.test.tsx
pnpm --filter @world-harness/dashboard typecheck
```

**Acceptance:** The default project screen feels like an AI coding app, not a trace dashboard.

---

## Milestone E — Right Inspector Integration

**Objective:** Reuse existing dashboard components in the new right-side inspector.

**Files:**
- Modify: `apps/dashboard/src/ui/components/RightInspector.tsx`
- Modify/reuse: `apps/dashboard/src/ui/components/ToolTimeline.tsx`
- Modify/reuse: `apps/dashboard/src/ui/components/ApprovalQueue.tsx`
- Modify/reuse: `apps/dashboard/src/ui/components/ReplayDebugger.tsx`
- Modify/reuse: `apps/dashboard/src/ui/components/AgentBoard.tsx`
- Test: `apps/dashboard/src/ui/__tests__/RightInspector.test.tsx`

**Tasks:**
1. Add tabs:
   - Plan
   - Tools
   - Diff
   - Approvals
   - Trace
2. In Tools tab, render tool call cards from normalized trace.
3. In Approvals tab, render existing `ApprovalQueue`.
4. In Trace tab, render `ReplayDebugger` or compact trace list.
5. Keep everything read-only until backend actions are wired.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test src/ui/__tests__/RightInspector.test.tsx
pnpm --filter @world-harness/dashboard typecheck
```

---

## Milestone F — Review Workspace

**Objective:** Implement the approval/diff review screen from the visual reference.

**Files:**
- Create: `apps/dashboard/src/ui/modes/ReviewWorkspace.tsx`
- Create: `apps/dashboard/src/ui/components/ChangedFilesList.tsx`
- Modify/reuse: `apps/dashboard/src/ui/components/DiffPanel.tsx`
- Modify/reuse: `apps/dashboard/src/ui/components/ApprovalQueue.tsx`
- Create: `apps/dashboard/src/ui/components/CommandPreview.tsx`
- Create: `apps/dashboard/src/data/review.ts`
- Test: `apps/dashboard/src/ui/__tests__/ReviewWorkspace.test.tsx`
- Test: `apps/dashboard/src/data/review.test.ts`

**Tasks:**
1. Define changed-file model:
   ```ts
   export interface ChangedFileSummary {
     path: string;
     language?: string;
     additions: number;
     deletions: number;
     status: 'added' | 'modified' | 'deleted' | 'renamed';
   }
   ```
2. Render changed files list with `+/-` counts.
3. Render side-by-side diff placeholder first; later wire real diff.
4. Render approval card, policy explanation, and command preview.
5. Add mode switch from Chat `Review` action into Review mode.

**Verification:**
```bash
pnpm --filter @world-harness/dashboard test src/data/review.test.ts src/ui/__tests__/ReviewWorkspace.test.tsx
pnpm --filter @world-harness/dashboard typecheck
```

**Acceptance:** The UI can reproduce the Review/Approval visual reference using mock data.

---

## Milestone G — Local Backend Skeleton

**Objective:** Add a local backend so the GUI can become interactive without CLI-first workflows.

**Files:**
- Create package: `apps/server/package.json`
- Create: `apps/server/src/index.ts`
- Create: `apps/server/src/routes/health.ts`
- Create: `apps/server/src/routes/projects.ts`
- Create: `apps/server/src/routes/sessions.ts`
- Create: `apps/server/test/server.test.ts`
- Modify: `pnpm-workspace.yaml` if needed
- Modify: root `package.json` scripts

**Initial API:**
```http
GET /api/health
GET /api/projects
POST /api/projects/open
GET /api/sessions
POST /api/sessions
GET /api/sessions/:id
POST /api/sessions/:id/messages
GET /api/sessions/:id/events
```

**Storage:**
- `.world-harness/projects.json`
- `.world-harness/sessions/<sessionId>.json`
- existing `.runs/<runId>/trace.jsonl`
- existing `.runs/<runId>/run.json`

**Verification:**
```bash
pnpm --filter @world-harness/server test
pnpm --filter @world-harness/server typecheck
```

**Acceptance:** Frontend can create a session and send a message to local backend.

---

## Milestone H — Chat → Orchestrator Bridge

**Objective:** A chat message should start a real agent task.

**Files:**
- Modify: `apps/server/src/routes/sessions.ts`
- Create: `apps/server/src/runtime/run-session-task.ts`
- Create: `apps/server/src/runtime/session-events.ts`
- Test: `apps/server/test/run-session-task.test.ts`

**Tasks:**
1. Convert user message into `TaskSchema` input.
2. Call existing `runSingleAgentTask`.
3. Persist chat messages and run metadata.
4. Stream events via SSE:
   ```http
   GET /api/sessions/:id/stream
   ```
5. Frontend consumes SSE and updates Chat + Inspector.

**Verification:**
```bash
pnpm --filter @world-harness/server test
pnpm --filter @world-harness/dashboard test
pnpm typecheck
```

**Acceptance:** User can enter a task in Chat and see real tool execution events without using CLI.

---

## Milestone I — One-command App Startup

**Objective:** Hide startup complexity.

**Command targets:**
```bash
pnpm app
# later:
hidecode
hidecode app
```

**Behavior:**
1. Start local backend.
2. Start frontend dev/preview server.
3. Print one URL.
4. Optionally open browser.

**Files:**
- Create: `apps/cli/src/app-command.ts`
- Modify: `apps/cli/src/index.ts`
- Modify: root `package.json`
- Test: `apps/cli/test/app-command.test.ts`

**Acceptance:** User can run one command and start the full GUI.

---

## Milestone J — Real Diff and Approval Loop

**Objective:** When the agent proposes changes, show real changed files and approval UI.

**Files:**
- Create: `packages/workspace/src/diff.ts`
- Create: `packages/workspace/test/diff.test.ts`
- Modify: `apps/server/src/runtime/run-session-task.ts`
- Modify: `apps/dashboard/src/ui/modes/ReviewWorkspace.tsx`

**Tasks:**
1. Capture `git diff --numstat` and file patches.
2. Convert diff into `ChangedFileSummary` and diff hunks.
3. Surface pending mutation/patch approval in UI.
4. Approve/reject initially writes an audit event only; actual mutation execution can remain guarded.

**Verification:**
```bash
pnpm --filter @world-harness/workspace test
pnpm --filter @world-harness/server test
pnpm --filter @world-harness/dashboard test
pnpm test && pnpm typecheck && pnpm build && pnpm smoke
```

---

## Milestone K — Packaging Direction

**Objective:** Move from developer dev server to real app distribution.

**Short term:**
```bash
hidecode app
```
local web app.

**Medium term candidates:**
- Tauri desktop wrapper
- Electron desktop wrapper
- local web + tray helper

**Do not start packaging before:**
- Home / Chat / Review UI exists
- local backend exists
- one-command startup exists

---

## Immediate Next 5 Tasks

### Task 1 — Commit this product plan

**Files:**
- `docs/plans/gui-first-hidecode-product-plan.md`

**Commit:**
```bash
git add docs/plans/gui-first-hidecode-product-plan.md
git commit -m "docs: add gui-first hidecode product plan"
```

### Task 2 — Implement app mode model

**Files:**
- `apps/dashboard/src/data/appMode.ts`
- `apps/dashboard/src/data/appMode.test.ts`

**Commit:**
```bash
git commit -m "feat(dashboard): define hidecode app modes"
```

### Task 3 — Add AppShell skeleton

**Files:**
- `apps/dashboard/src/ui/AppShell.tsx`
- `apps/dashboard/src/ui/components/TopBar.tsx`
- `apps/dashboard/src/ui/components/LeftSidebar.tsx`
- `apps/dashboard/src/ui/components/RightInspector.tsx`
- `apps/dashboard/src/ui/components/BottomStatusBar.tsx`

**Commit:**
```bash
git commit -m "feat(dashboard): add hidecode app shell"
```

### Task 4 — Add ChatWorkspace mock

**Files:**
- `apps/dashboard/src/data/chat.ts`
- `apps/dashboard/src/ui/modes/ChatWorkspace.tsx`
- `apps/dashboard/src/ui/components/ChatPanel.tsx`
- `apps/dashboard/src/ui/components/AgentPlanCard.tsx`

**Commit:**
```bash
git commit -m "feat(dashboard): add chat workspace mock"
```

### Task 5 — Add HomePage mock

**Files:**
- `apps/dashboard/src/ui/modes/HomePage.tsx`
- `apps/dashboard/src/ui/components/RecentProjectsPanel.tsx`
- `apps/dashboard/src/ui/components/QuickStartPanel.tsx`
- `apps/dashboard/src/ui/components/ModelSafetySetup.tsx`

**Commit:**
```bash
git commit -m "feat(dashboard): add hidecode home screen"
```

---

## Non-goals for the Next Phase

Avoid these until the GUI-first shell is real:

- Full desktop packaging
- Real approve/apply mutation flow
- Advanced multi-agent orchestration
- Large redesign of runtime internals
- More dashboard-only trace polish disconnected from the chat workflow

---

## Definition of Success for the Next Phase

A new user should be able to run:

```bash
pnpm install
pnpm app
```

Then see hidecode as a real interactive AI coding workspace:

1. Home page opens.
2. User selects or opens a project.
3. Chat workspace appears.
4. User sends a coding request.
5. Agent produces a plan.
6. Tool execution appears in the right inspector.
7. Proposed changes appear in Review mode.

That is the product shape to optimize for.
