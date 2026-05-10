import { describe, expect, it } from 'vitest';
import { BudgetTracker } from '../src/budget/tracker.js';

describe('BudgetTracker', () => {
  it('tracks steps', () => {
    const budget = new BudgetTracker({ maxSteps: 5 });
    budget.recordStep();
    budget.recordStep();
    expect(budget.getState().steps).toBe(2);
    expect(budget.isExceeded()).toBe(false);
  });

  it('exceeds step limit', () => {
    const budget = new BudgetTracker({ maxSteps: 2 });
    budget.recordStep();
    budget.recordStep();
    expect(budget.isExceeded()).toBe(true);
    expect(budget.getState().exceededReason).toContain('Step limit');
  });

  it('tracks token usage and cost', () => {
    const budget = new BudgetTracker({ maxTokens: 1000, maxCostUsd: 1.0 });
    budget.recordModelUsage(500, 200);
    const state = budget.getState();
    expect(state.inputTokens).toBe(500);
    expect(state.outputTokens).toBe(200);
    expect(state.totalTokens).toBe(700);
    expect(state.estimatedCostUsd).toBeGreaterThan(0);
  });

  it('exceeds token limit', () => {
    const budget = new BudgetTracker({ maxTokens: 100 });
    budget.recordModelUsage(60, 50);
    expect(budget.isExceeded()).toBe(true);
    expect(budget.getState().exceededReason).toContain('Token limit');
  });

  it('exceeds cost limit', () => {
    const budget = new BudgetTracker({ maxCostUsd: 0.001, costPer1kInput: 1.0, costPer1kOutput: 1.0 });
    budget.recordModelUsage(1000, 1000); // $2.00
    expect(budget.isExceeded()).toBe(true);
  });

  it('tracks tool calls', () => {
    const budget = new BudgetTracker({ maxToolCalls: 3 });
    budget.recordToolCall();
    budget.recordToolCall();
    expect(budget.isExceeded()).toBe(false);
    budget.recordToolCall();
    expect(budget.isExceeded()).toBe(true);
  });

  it('formats summary', () => {
    const budget = new BudgetTracker({ maxSteps: 10, maxTokens: 50000 });
    budget.recordStep();
    budget.recordModelUsage(100, 50);
    const summary = budget.formatSummary();
    expect(summary).toContain('Steps: 1/10');
    expect(summary).toContain('Tokens:');
  });
});
