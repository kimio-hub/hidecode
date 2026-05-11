import { describe, expect, it } from 'vitest';
import { chatMessageRoles, mockChatMessages } from './chat';

describe('chat data model', () => {
  it('defines the required chat message roles', () => {
    expect(chatMessageRoles).toEqual(['user', 'assistant', 'tool', 'system']);
  });

  it('ships mock user and assistant messages for the first chat workspace', () => {
    expect(mockChatMessages.some((message) => message.role === 'user')).toBe(true);
    expect(mockChatMessages.some((message) => message.role === 'assistant')).toBe(true);
  });

  it('includes an assistant plan with all supported step statuses', () => {
    const planSteps = mockChatMessages.flatMap((message) => message.plan?.steps ?? []);
    expect(planSteps.map((step) => step.status)).toEqual(
      expect.arrayContaining(['pending', 'running', 'completed', 'failed', 'waiting']),
    );
  });
});
