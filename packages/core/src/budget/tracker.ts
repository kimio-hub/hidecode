// ─── Budget Enforcement ────────────────────────────────────────
// Tracks token usage, cost, and step count against configurable limits.

export interface BudgetConfig {
  maxSteps?: number;
  maxTokens?: number;
  maxCostUsd?: number;
  maxToolCalls?: number;
  maxDurationMs?: number;
  /** Cost per 1K tokens (input/output separately) */
  costPer1kInput?: number;
  costPer1kOutput?: number;
}

export interface BudgetState {
  steps: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  toolCalls: number;
  durationMs: number;
  exceeded: boolean;
  exceededReason?: string;
}

export class BudgetTracker {
  private state: BudgetState;
  private config: Required<BudgetConfig>;
  private startTime: number;

  constructor(config: BudgetConfig = {}) {
    this.config = {
      maxSteps: config.maxSteps ?? 50,
      maxTokens: config.maxTokens ?? 100000,
      maxCostUsd: config.maxCostUsd ?? 10.0,
      maxToolCalls: config.maxToolCalls ?? 100,
      maxDurationMs: config.maxDurationMs ?? 30 * 60 * 1000, // 30 min
      costPer1kInput: config.costPer1kInput ?? 0.002,
      costPer1kOutput: config.costPer1kOutput ?? 0.006,
    };
    this.startTime = Date.now();
    this.state = {
      steps: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      toolCalls: 0,
      durationMs: 0,
      exceeded: false,
    };
  }

  recordModelUsage(inputTokens: number, outputTokens: number): void {
    this.state.inputTokens += inputTokens;
    this.state.outputTokens += outputTokens;
    this.state.totalTokens = this.state.inputTokens + this.state.outputTokens;
    this.state.estimatedCostUsd =
      (this.state.inputTokens / 1000) * this.config.costPer1kInput +
      (this.state.outputTokens / 1000) * this.config.costPer1kOutput;
    this.checkLimits();
  }

  recordStep(): void {
    this.state.steps++;
    this.state.durationMs = Date.now() - this.startTime;
    this.checkLimits();
  }

  recordToolCall(): void {
    this.state.toolCalls++;
    this.checkLimits();
  }

  getState(): BudgetState {
    return { ...this.state, durationMs: Date.now() - this.startTime };
  }

  isExceeded(): boolean {
    return this.state.exceeded;
  }

  private checkLimits(): void {
    if (this.state.exceeded) return;

    if (this.state.steps >= this.config.maxSteps) {
      this.state.exceeded = true;
      this.state.exceededReason = `Step limit reached (${this.config.maxSteps})`;
    } else if (this.state.totalTokens >= this.config.maxTokens) {
      this.state.exceeded = true;
      this.state.exceededReason = `Token limit reached (${this.config.maxTokens})`;
    } else if (this.state.estimatedCostUsd >= this.config.maxCostUsd) {
      this.state.exceeded = true;
      this.state.exceededReason = `Cost limit reached ($${this.config.maxCostUsd})`;
    } else if (this.state.toolCalls >= this.config.maxToolCalls) {
      this.state.exceeded = true;
      this.state.exceededReason = `Tool call limit reached (${this.config.maxToolCalls})`;
    } else if (Date.now() - this.startTime >= this.config.maxDurationMs) {
      this.state.exceeded = true;
      this.state.exceededReason = `Time limit reached (${this.config.maxDurationMs / 1000}s)`;
    }
  }

  formatSummary(): string {
    const s = this.getState();
    return [
      `Steps: ${s.steps}/${this.config.maxSteps}`,
      `Tokens: ${s.totalTokens.toLocaleString()}/${this.config.maxTokens.toLocaleString()}`,
      `Cost: $${s.estimatedCostUsd.toFixed(4)}/$${this.config.maxCostUsd}`,
      `Tools: ${s.toolCalls}/${this.config.maxToolCalls}`,
      `Time: ${(s.durationMs / 1000).toFixed(1)}s/${this.config.maxDurationMs / 1000}s`,
    ].join(' | ');
  }
}
