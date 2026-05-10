import { describe, expect, it } from 'vitest';
import { decide, defaultPolicy } from '../src/index.js';

describe('policy engine', () => {
  it('allows explicit read risk and asks for write risk by default', () => {
    expect(decide(defaultPolicy, { tool: 'read', input: {}, risks: ['read'] }).decision).toBe('allow');
    expect(decide(defaultPolicy, { tool: 'patch', input: {}, risks: ['write'] }).decision).toBe('ask');
  });
});
