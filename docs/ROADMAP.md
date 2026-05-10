# World Harness — Roadmap to World-Class

## 当前状态 (Phase 1 MVP)
- ✅ core: schemas, event store, artifact layout
- ✅ policy: risk-aware policy engine
- ✅ tools: read, search, patch, run, test
- ✅ workspace: checkpoint/rollback
- ✅ models: 只有 scripted adapter（无真实 LLM）
- ✅ orchestrator: 单 agent 循环（基础）
- ✅ cli: inspect/replay/smoke
- ✅ dashboard: Linear 风格前端（刚建）

## Phase 2 — 真实 LLM 集成 + 智能编排
- [ ] models: OpenAI-compatible adapter（流式+非流式）
- [ ] models: Tool-calling protocol（function calling）
- [ ] orchestrator: ReAct loop（reason → act → observe）
- [ ] orchestrator: Subtask decomposition（目标拆解为 DAG）
- [ ] tools: git integration（branch, commit, diff, PR）

## Phase 3 — 安全 + 可靠性
- [ ] policy: RBAC + 自定义规则引擎
- [ ] policy: Secret detection + PII filter
- [ ] workspace: Snapshot + rollback on failure
- [ ] orchestrator: Retry + error recovery
- [ ] orchestrator: Budget enforcement（token/step/cost）

## Phase 4 — 多 Agent + 协作
- [ ] orchestrator: Multi-agent with delegation
- [ ] orchestrator: Agent-to-agent messaging
- [ ] tools: Inter-agent file sharing
- [ ] dashboard: Multi-agent view

## Phase 5 — 生产级
- [ ] Replay from trace（确定性重放）
- [ ] A/B model comparison
- [ ] Cost tracking + optimization
- [ ] Plugin system for custom tools
- [ ] CI/CD integration
