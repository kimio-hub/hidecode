# World Harness 可视化交互界面设计方案

> 目标：把 World Harness 从“CLI + trace 原型”升级成一个可观察、可控制、可回放、可审计的 AI Coding-Agent Mission Control。

## 0. 本轮视觉材料

你一共给了 **4 张概念图**，我已检查：

1. **Agent Mission Control 主界面 A**  
   - 文件：`img_ef167f97a40a.jpg`
   - 内容：运行中 dashboard，包含 top status、left nav、live task graph、diff、tool timeline、multi-agent cards、right inspector、pending approval、bottom chat/terminal。

2. **Approval Queue & Policy Risk**  
   - 文件：`img_1c3eac90c3e2.jpg`
   - 内容：人类审批中心，包含 pending/approved/denied/policy/risk/secret/audit 导航、审批卡片、风险解释、policy matched、evidence、safer alternative、audit trail。

3. **Multi-Agent Board**  
   - 文件：`img_f60d972a172f.jpg`
   - 内容：多 agent 看板，包含 Planning/Coding/Testing/Review/Ready to Merge 多列工作流，Planner/Coder/Test Runner/Reviewer/Security Agent 等卡片，右侧 agent inspector 和底部 team communication log。

4. **Replay & Trace Debug**  
   - 文件：`img_ee3252d9e0de.jpg`
   - 内容：回放与 trace 调试界面，包含 replay timeline、失败 step 高亮、tool input/output、stdout/stderr、before/after snapshot、replay controls、root cause/evidence/policy、fork/retry/eval case。

另外你还给了一张 **Agent Mission Control 主界面 B**：
- 文件：`img_5b3ad41c8bc2.jpg`
- 它不是新模块，而是主界面的另一版/更清晰执行态版本。与主界面 A 高度重合，但文字更具体：展示了 token skew fix、`pnpm test` 失败、terminal 输出、chat 快捷命令和右侧 pending approval。

这 4 类图已经足够支撑完整 UI 方案：

```text
主控台 Mission Control
审批中心 Approval Queue
多 Agent 协作 Board
回放调试 Replay & Trace Debug
```

---

## 1. 调研结论摘要

### Claude Code

**优点**
- CLI/TUI 成熟，终端细节打磨好。
- Plan / Auto / Permission Mode 等模式成熟。
- `/context`、`/cost`、`/usage`、`/compact` 对上下文和成本可见性强。
- Todo、subagent、hooks、MCP、IDE diff、session resume/rewind 都比较完整。

**缺点**
- 黑盒较多，不利于做研究和系统级可观测。
- 权限模式复杂，新用户容易搞混。
- 核心仍是 transcript-centric，不是完全 task-centric。
- Web/dashboard 不是主入口。

**可借鉴**
- 常驻显示 mode/context/cost。
- 权限审批支持 allow once / always allow / deny / edit rule。
- 会话 resume、rewind、compact、fork 必须作为一等能力。

---

### Codex CLI

**优点**
- TUI 工程化程度高。
- diff rendering、approval overlay、bottom pane、session log、file search 等模块值得参考。
- sandbox、network policy、approval queue 结构较清晰。
- JSONL session log 适合 replay/debug。

**缺点**
- 偏终端开发者工具，对普通用户不够直观。
- sandbox / approval / network policy 概念对新手有门槛。
- 成本/usage 展示不如 Claude Code 突出。

**可借鉴**
- 把 diff、approval、context meter、pending actions 放进主 UI，而不是隐藏在聊天流。
- approval 可以排队，避免 agent streaming 时阻塞交互。
- session log 统一结构化记录。

---

### OpenCode

**优点**
- 开源、provider-agnostic。
- client/server 架构适合 TUI/Web/Desktop/IDE 多端共用。
- `opencode web`、`opencode serve` 说明 Web UI 和 HTTP API 可以是一等能力。
- Plan / Build agent 切换简单。
- IDE selection/open tabs/LSP diagnostics 体验值得借鉴。

**缺点**
- 默认权限相对开放，需要用户自己配置。
- Web server 安全默认值需要注意。
- 多端一致性容易割裂。
- diff/replay/observability 深度仍有提升空间。

**可借鉴**
- 后端 runtime + 多客户端架构。
- Plan / Build / Review 等 agent 角色明确化。
- LSP diagnostics 自动回灌给 agent。

---

### OpenClaw / Mission Control 类产品

**优点**
- 更像 agent ops 控制台：组织、board、task、approval、activity timeline。
- 适合团队级任务运营。
- 审批、审计、agent lifecycle 作为核心对象。

**缺点 / 不确定**
- 公开资料偏产品愿景，实际成熟度不确定。
- 对个人开发来说可能太重。
- trace/span/token 级可观测不够突出。

**可借鉴**
- 不要只做“聊天窗口”，要做“任务运营中心”。
- agent 状态、阻塞、审批、任务流应该可视化。

---

### Hermes Agent

**优点**
- 多平台 gateway、skills、memory、subagents、cron、MCP、delegation 很强。
- 远程控制能力好，可以从 WeChat/Telegram/Email 等入口使用。
- skills/memory 形成 learning loop。

**缺点**
- 能力太广，coding-specific dashboard 不够聚焦。
- memory/skills/session/task 边界容易模糊。
- 对 trace/diff/replay/eval 的工程闭环还需要专门建设。

**可借鉴**
- Skills/Memory 应在 UI 中可查看、编辑、禁用、回滚。
- 多平台通知和远程审批很重要。
- subagents 要有独立状态和责任边界。

---

### DeepSeek TUI / DeepSeekCode

**优点**
- Plan / Agent / YOLO 三态清晰。
- reasoning blocks、1M context tracking、prefix-cache cost telemetry 对 DeepSeek 友好。
- LSP diagnostics、side-git snapshot、per-turn rollback 很适合 coding agent。
- Durable queue + HTTP/SSE runtime API 适合 headless + UI。

**缺点 / 不确定**
- 较依赖 DeepSeek 模型体验。
- TUI 信息密度高。
- 桌面版成熟度需要验证。

**可借鉴**
- side-git snapshot / per-turn rollback 必须做。
- LSP diagnostics 是质量闭环核心。
- cost 不只显示总 token，还要显示 cache hit/miss、turn/session 级成本。

---

### Phoenix / LangSmith / LangGraph Studio / Helicone 等 Observability UI

**优点**
- Phoenix：trace/span、eval、dataset、experiment 闭环成熟。
- LangGraph Studio：graph/state/time-travel/human-in-loop 适合有状态 agent debug。
- Helicone：gateway 级成本、延迟、fallback、路由、报表很清晰。

**缺点**
- 它们偏 observability，不是 coding workspace。
- 不天然理解 workspace diff、file patch、approval、rollback。

**可借鉴**
- trace → dataset → eval → experiment 的闭环。
- time travel / replay / fork from step。
- gateway 级 cost/latency/provider fallback 监控。

---

## 2. 理想产品定位

World Harness 的 UI 不应该只是“ChatGPT + 工具日志”，而应该是：

> **AI-native Software Delivery Runtime Dashboard**

或者更产品化地说：

> **Agent Mission Control for Software Engineering**

核心目标：

1. 看得见 agent 在做什么。
2. 能暂停、批准、拒绝、重试、回滚。
3. 每个 diff 都有 evidence 和 trace。
4. 每次 run 都能 replay、debug、比较、沉淀成 eval case。
5. 单 agent、multi-agent、CLI、Web、IDE、远程 IM 可以共用同一套 runtime 状态。

---

## 3. 整体信息架构

顶层对象模型：

```text
Workspace / Repo
├── Runs
│   ├── Run Manifest
│   ├── Task Graph
│   ├── Tool Timeline
│   ├── Diff / Changes
│   ├── Evidence
│   ├── Approvals
│   ├── Agents
│   ├── Terminal / Logs
│   └── Replay Bundle
├── Policies
├── Agent Profiles
├── Skills / Memory
├── Eval Cases
└── Settings
```

四个核心页面：

```text
1. Mission Control      —— 当前 run 总控
2. Approval Queue       —— 人类审批与风险控制
3. Multi-Agent Board    —— 多 agent 协作和责任边界
4. Replay & Trace Debug —— 失败诊断、回放、分叉、沉淀 eval
```

---

## 4. Mission Control 主界面设计

来源图：`img_ef167f97a40a.jpg` + `img_5b3ad41c8bc2.jpg`

### 4.1 布局

采用经典三栏 + 底部 dock：

```text
┌──────────────────────────────────────────────────────────────┐
│ Top Status Bar                                               │
├────────────┬────────────────────────────────────┬────────────┤
│ Left Nav   │ Main Mission Canvas                │ Inspector  │
│            │                                    │            │
├────────────┴────────────────────────────────────┴────────────┤
│ Bottom Dock: Chat / Terminal / Logs / Events                 │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Top Status Bar

显示全局运行状态：

- Repo：`hidecode`
- Branch：`agent/fix-auth`
- Run Status：`Running`，带运行时长，例如 `00:06:42`
- Model：`gpt-5.5`
- Context：`62%`，带进度条
- Cost：`$1.24 / $5.00`
- Risk：`Medium`
- 控制按钮：`Pause`、`Stop`、`Create PR`

设计原则：用户一眼知道“当前是不是安全、是不是还在跑、花了多少钱、是否可以发 PR”。

### 4.3 Left Nav

导航项：

1. Runs
2. Live Task Graph
3. Files
4. Approvals，带待处理数量 badge
5. Agents
6. Policies
7. Replay
8. Settings

底部显示：

- Run ID
- Started time
- Triggered by
- View Run Summary

### 4.4 Live Task Graph

示例流程：

```text
Understand Bug → Patch Auth Logic → Run Tests → Review Diff
```

节点状态：

- `Understand Bug`：Completed
- `Patch Auth Logic`：Running
- `Run Tests`：Blocked / Waiting for approval
- `Review Diff`：Pending

每个节点显示：

- 状态
- 耗时
- 风险等级
- 所属 agent
- 是否有 diff/evidence/approval

交互：

- 点击节点，右侧 Inspector 显示任务详情。
- blocked 节点显示阻塞原因。
- 从任意节点 fork retry。
- Auto-scroll 跟随当前活动节点。

### 4.5 Code Diff View

这是主界面的核心事实层。

左侧 changed files：

- `src/auth/token.ts`
- `tests/auth/token.test.ts`
- `package.json`

右侧 diff：

- side-by-side / unified 切换。
- 语法高亮。
- 行号。
- 红色 removed、绿色 added。
- hunk 级 `Accept`、`Reject`、`Explain`。
- 可对某个 hunk 评论，让 agent 继续修改。

设计原则：

> Diff 是 coding agent 的中心事实，Chat 只是控制面。

### 4.6 Tool Timeline

展示工具调用链：

```text
read_file src/auth/token.ts  → success, 120ms
patch src/auth/token.ts      → success, 340ms
pnpm test                    → failed, 8.4s
git diff                     → success, 80ms
```

每个 event 显示：

- tool name
- input 摘要
- exit code
- duration
- 状态
- 关联 diff/evidence

交互：

- 点击展开完整输入输出。
- 从失败 command 跳转 terminal log。
- 标记“这里开始错了”，然后进入 Replay/fork。

### 4.7 Right Inspector

右侧根据选中对象动态变化。

当选中 task：

- Task name
- Agent
- Status
- Risk
- Evidence cards
- Policy / Risk decisions
- Pending approval

当选中 diff：

- 为什么改
- 引用哪些 evidence
- 哪些测试覆盖
- 风险解释
- rollback 选项

当选中 tool call：

- input/output
- cwd/env
- duration
- exit code
- generated artifacts

### 4.8 Bottom Dock

包含两个重点：

1. Chat / Command 输入框  
   - 支持自然语言
   - slash command
   - `@file#Lx-Ly`
   - scoped prompt：针对当前 task/diff/tool call 提问

2. Terminal / Logs / Events  
   - 显示 `pnpm test` 输出
   - 显示失败摘要，例如 `1 failed, 42 passed`
   - 命令来源：agent/user/system
   - 支持 rerun / copy / ask agent explain

---

## 5. Approval Queue & Policy Risk 页面

来源图：`img_1c3eac90c3e2.jpg`

### 5.1 页面目标

Approval 页面是 World Harness 的安全控制面：

> 所有高风险 agent 行为都必须在这里被解释、审批、拒绝、替代或记录。

### 5.2 左侧导航

- Pending，带数量 badge
- Approved
- Denied
- Policy Rules
- Risk History
- Secret Scanner
- Audit Log

### 5.3 顶部上下文

- Repo：`hidecode`
- Branch：`agent/fix-auth`
- Pending approvals：`3`
- Risk level：`High`
- 操作：`Approve Low Risk`、`Pause Agent`、`Edit Policies`

### 5.4 Approval Card

审批卡片包含：

- 风险等级：Medium / High / Critical
- Action：agent 要执行的动作
- Reason：为什么要做
- Impact：会影响什么文件、命令、网络、secret、成本
- Policy：命中了哪条规则
- 操作按钮：
  - `Approve once`
  - `Approve for this run`
  - `Deny`
  - `Ask safer alternative`
  - `View diff`
  - `Explain risk`

示例：

```text
High Risk
Action: Run command "pnpm install jsonwebtoken@latest"
Reason: update auth token dependency
Impact: modifies package.json and lockfile
```

```text
Critical Risk
Action: Read ".env"
Policy: blocked by secret access rule
```

### 5.5 Right Inspector

展示选中 approval 的：

- Policy matched
- Evidence
- Risk breakdown
- Safer alternative suggestion
- Audit context

### 5.6 Audit Trail

底部记录：

```text
agent requested command
policy engine evaluated risk
approval requested
waiting for human decision
```

设计原则：

> Approval 不只是弹窗，而是可搜索、可审计、可解释的队列。

---

## 6. Multi-Agent Board 页面

来源图：`img_f60d972a172f.jpg`

### 6.1 页面目标

Multi-Agent Board 用来表达多 agent 的分工，而不是显示多个聊天窗口。

核心问题：

1. 谁负责什么？
2. 当前进行到哪一步？
3. 谁被谁阻塞？
4. 哪些文件归谁处理？
5. 哪个 agent 需要人类或其他 agent 的输入？

### 6.2 顶部状态

- Repo：`hidecode`
- Run：`auth bugfix`
- Active agents：`4`
- Status：`Running`
- Total cost：`$1.84`
- Risk：`Medium`
- 操作：`Add Agent`、`Pause All`、`Merge Results`

### 6.3 左侧 Agent Roles

- Agents
- Planner
- Coder
- Reviewer
- Test Runner
- Security Agent
- Docs Agent
- Runs
- Reports
- Settings

### 6.4 Main Kanban Board

列：

```text
Planning → Coding → Testing → Review → Ready to Merge
```

卡片：

- Planner Agent
  - Task：Decompose auth bug
  - Status：Done
  - Output：4 subtasks created

- Coder Agent
  - Task：Patch token refresh logic
  - Status：Running
  - Files owned：`src/auth/token.ts`
  - Progress：68%

- Test Runner
  - Task：Run affected tests
  - Status：Blocked
  - Blocker：waiting for approval to execute `pnpm test`

- Reviewer Agent
  - Task：Review auth diff
  - Status：Waiting
  - Depends on：Coder complete

- Security Agent
  - Task：Check secret exposure and auth risks
  - Status：Queued

### 6.5 Right Agent Inspector

展示选中 agent 的：

- Agent role
- Model
- Permissions
- Current task
- Files touched
- Last tool call
- Cost
- Risk
- Handoff notes
- 操作：
  - Reassign task
  - Restrict permissions
  - Ask for status
  - Stop agent

### 6.6 Team Communication Log

底部日志：

```text
Planner → Coder: Patch refresh token expiry path
Coder → Test Runner: Need affected tests
Test Runner → Human: Approval required for pnpm test
Reviewer: Waiting for final diff
```

设计原则：

> 多 agent UI 的重点不是“很多 agent 很热闹”，而是 ownership、dependency、handoff、blocker 和 permission。

---

## 7. Replay & Trace Debug 页面

来源图：`img_ee3252d9e0de.jpg`

### 7.1 页面目标

Replay 页面是 World Harness 和普通 coding agent 最大的差异化之一。

它要回答：

1. agent 是从哪一步开始错的？
2. 它看到了哪些信息？
3. 它调用了哪些工具？
4. 它为什么做这个修改？
5. 我能不能从失败步骤分叉重试？
6. 这个失败能不能沉淀成 eval case？

### 7.2 顶部状态

- Repo：`hidecode`
- Run：`run_01JYXZ8E6T7Q`
- Status：`Failed then Recovered`
- Model：`gpt-5.5`
- Duration：`12m 48s`
- 操作：
  - Export Replay
  - Fork from Step
  - Create Eval Case

### 7.3 Replay Timeline

左侧按时间列出 steps：

```text
00:00 User request
00:18 Plan created
01:04 read_file src/auth/token.ts
02:20 patch auth logic
03:14 pnpm test failed
04:03 inspect failure log
05:10 patch tests
06:32 pnpm test passed
07:00 final report
```

失败 step 用红色高亮，例如：

```text
03:14 pnpm test failed tests/auth/token.test.ts
```

### 7.4 Main Replay Canvas

展示当前选中 step：

- tool input
- tool output
- stdout/stderr preview
- before/after file snapshot
- linked diff preview
- status badges：exit code、duration、risk

### 7.5 Replay Controls

底部像视频播放器：

- play/pause
- step backward
- step forward
- scrubber timeline
- speed selector：1x / 2x
- current time marker

### 7.6 Right Debug Inspector

展示：

- Step details
- Root cause analysis
- Evidence links
- Related files
- Policy decisions
- 操作：
  - Fork from this step
  - Retry with another model
  - Save as regression case
  - Mark root cause

设计原则：

> Replay 不是“看日志”，而是“可定位、可分叉、可复现、可评测”的调试系统。

---

## 8. 核心交互流程

### 8.1 从需求到 PR

```text
用户输入需求
→ agent 生成 plan
→ UI 展示 task graph
→ 用户批准计划或修改约束
→ agent patch
→ UI 展示 diff + evidence
→ agent run tests
→ reviewer/security agent 审查
→ 用户 approve
→ create PR
```

### 8.2 出错恢复

```text
测试失败
→ timeline 标红失败 step
→ 用户点击失败节点
→ 查看 terminal/evidence
→ 进入 Replay 页面
→ 选择 fork from step
→ 换模型或补充约束
→ 只重跑受影响子任务
```

### 8.3 高风险审批

```text
agent 要改 auth/payment/migration/package-lock/.env
→ policy 标记 Medium/High/Critical
→ task 暂停
→ approval queue 出现审批卡片
→ inspector 展示 evidence/diff/risk
→ 用户 approve once / deny / safer alternative
→ audit trail 记录决策
```

### 8.4 多 agent 协作

```text
Planner 拆任务
→ Coder 实现
→ Test Runner 验证
→ Reviewer 审查 diff
→ Security agent 检查敏感区域
→ Human approve
→ Merge Results / Create PR
```

---

## 9. 数据模型建议

### 9.1 RunManifest

```ts
interface RunManifest {
  runId: string;
  repo: string;
  branch: string;
  status: 'running' | 'blocked' | 'failed' | 'recovered' | 'complete';
  model: { provider: string; name: string };
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  cost: CostSummary;
  context: ContextSummary;
  risk: RiskSummary;
  artifacts: Record<string, string>;
}
```

### 9.2 TaskNode

```ts
interface TaskNode {
  taskId: string;
  title: string;
  status: 'pending' | 'running' | 'blocked' | 'failed' | 'completed';
  agentId?: string;
  dependsOn: string[];
  evidenceIds: string[];
  diffIds: string[];
  approvalIds: string[];
  startedAt?: string;
  finishedAt?: string;
}
```

### 9.3 AgentState

```ts
interface AgentState {
  agentId: string;
  role: 'planner' | 'coder' | 'reviewer' | 'test-runner' | 'security' | 'docs';
  model: { provider: string; name: string };
  status: 'idle' | 'running' | 'blocked' | 'waiting' | 'done' | 'failed';
  permissions: string[];
  currentTaskId?: string;
  ownedFiles: string[];
  lastToolCallId?: string;
  cost?: CostSummary;
  risk?: RiskSummary;
  handoffNotes?: string[];
}
```

### 9.4 ApprovalRequest

```ts
interface ApprovalRequest {
  approvalId: string;
  runId: string;
  taskId?: string;
  agentId?: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  actionType: 'file_write' | 'shell_command' | 'network' | 'secret_access' | 'git' | 'cost_overrun';
  actionSummary: string;
  reason: string;
  impact: string;
  policyMatches: string[];
  evidenceIds: string[];
  status: 'pending' | 'approved' | 'denied' | 'blocked';
  decision?: {
    by: string;
    at: string;
    type: 'approve_once' | 'approve_for_run' | 'deny' | 'ask_alternative';
    reason?: string;
  };
}
```

### 9.5 TraceEvent

```ts
interface TraceEvent {
  eventId: string;
  runId: string;
  taskId?: string;
  agentId?: string;
  type:
    | 'task.created'
    | 'task.updated'
    | 'agent.started'
    | 'agent.handoff'
    | 'model.requested'
    | 'tool.requested'
    | 'tool.finished'
    | 'diff.created'
    | 'evidence.created'
    | 'policy.decided'
    | 'approval.requested'
    | 'approval.resolved'
    | 'snapshot.created'
    | 'replay.marker'
    | 'eval.case_created';
  timestamp: string;
  actor: 'user' | 'agent' | 'runtime' | 'policy' | 'verifier' | 'system';
  data: Record<string, unknown>;
}
```

---

## 10. MVP 实现路线

### P0：真实 Trace Viewer

目标：让当前 dashboard 不再只看 mock 数据。

必须实现：

1. 读取真实 `.runs/<runId>/run.json`。
2. 读取真实 `.runs/<runId>/trace.jsonl`。
3. URL 参数加载：
   ```text
   /?run=/path/or/url
   ```
4. 展示真实：
   - run status
   - task events
   - tool timeline
   - policy decisions
   - evidence
   - changed files
5. CLI run 结束输出：
   ```text
   Dashboard: http://localhost:5173?run=...
   ```

### P1：Mission Control v2

实现概念图主界面：

1. Top Status Bar。
2. Left Nav。
3. Live Task Graph。
4. Diff viewer。
5. Tool Timeline。
6. Right Inspector。
7. Bottom Dock。
8. 基于真实 trace 更新 UI。

### P2：Approval Queue & Policy Risk

实现：

1. approval request 数据结构。
2. pending/approved/denied 页面。
3. policy matched 展示。
4. risk breakdown。
5. approve/deny/ask alternative API。
6. audit trail。
7. secret access / dangerous command / network / package change 特殊卡片。

### P3：Replay & Trace Debug

实现：

1. replay timeline。
2. step detail inspector。
3. tool input/output 展示。
4. before/after snapshot。
5. fork from step。
6. retry with another model。
7. save as eval case。
8. compare runs。

### P4：Multi-Agent Board

实现：

1. agent state store。
2. role-based agent cards。
3. ownership / dependency / blocker。
4. handoff event。
5. permission isolation。
6. merge results。
7. security/reviewer/test agents。

### P5：IDE / Gateway / Team 化

实现：

1. VS Code/Cursor 插件。
2. WeChat/Telegram/Email 远程 approval。
3. team audit log。
4. org/project/workspace 权限。
5. trace → dataset → eval → experiment。

---

## 11. 当前 World Harness 应该立刻做的下一步

优先级最高的是：

> **把 dashboard 接入真实 run trace。**

建议下一步任务：

1. 修改 `apps/dashboard/src/ui/App.tsx`，去掉固定 mock。
2. 支持 query string：
   ```text
   ?run=<runId or path>
   ?trace=<trace.jsonl url>
   ```
3. CLI `run/smoke` 生成标准：
   ```text
   .runs/<runId>/run.json
   .runs/<runId>/trace.jsonl
   .runs/<runId>/report.md
   ```
4. dashboard 解析真实 event types。
5. 页面先实现 Mission Control v2 的信息结构。
6. 补测试：loader、event grouping、rendering。

这一步完成后，World Harness 就从“静态 UI 原型”进入“真实 agent run 可视化”。

---

## 12. 设计原则总结

1. **Task-first，不是 chat-first。**
2. **Diff 是核心事实。**
3. **Timeline/Evidence 是信任基础。**
4. **Approval/Policy 是安全边界。**
5. **Replay 是高级 harness 的护城河。**
6. **Context/Cost 必须常驻可见。**
7. **多 agent 要强调责任边界，而不是聊天热闹。**
8. **所有自动化都必须可暂停、可解释、可回滚。**
9. **Approval 不是弹窗，而是可审计队列。**
10. **失败不是结束，而是 replay/fork/eval 的入口。**
