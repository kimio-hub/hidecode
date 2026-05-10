import { describe, expect, it } from 'vitest';
import { PolicyEngine } from '../src/core/policy.js';

describe('PolicyEngine', () => {
  it('denies reading outside workspace', () => {
    const policy = new PolicyEngine({ workspace: '/tmp/project' });
    const decision = policy.decideFile('read', '../secret.txt');
    expect(decision.decision).toBe('deny');
    expect(decision.risk).toBe('critical');
  });

  it('denies likely secret paths', () => {
    const policy = new PolicyEngine({ workspace: '/tmp/project' });
    const decision = policy.decideFile('read', '.env');
    expect(decision.decision).toBe('deny');
  });

  it('allows safe git status command', () => {
    const policy = new PolicyEngine({ workspace: '/tmp/project' });
    const decision = policy.decideCommand('git status --short');
    expect(decision.decision).toBe('allow');
  });

  it('denies dangerous commands', () => {
    const policy = new PolicyEngine({ workspace: '/tmp/project' });
    const decision = policy.decideCommand('rm -rf /');
    expect(decision.decision).toBe('deny');
    expect(decision.risk).toBe('critical');
  });
});
