import { describe, expect, it } from 'vitest';
import { createHidecodeAppState, isHidecodeAppMode, parseHidecodeAppState } from './appMode';

describe('hidecode app mode model', () => {
  it('defaults to the home mode when no navigation input is provided', () => {
    expect(createHidecodeAppState()).toEqual({ mode: 'home' });
    expect(parseHidecodeAppState('')).toEqual({ mode: 'home' });
  });

  it('parses supported app modes from query params', () => {
    expect(parseHidecodeAppState('?mode=chat')).toEqual({ mode: 'chat' });
    expect(parseHidecodeAppState('?mode=review')).toEqual({ mode: 'review' });
    expect(parseHidecodeAppState('?mode=replay')).toEqual({ mode: 'replay' });
    expect(parseHidecodeAppState('?mode=monitor')).toEqual({ mode: 'monitor' });
    expect(parseHidecodeAppState('?mode=chat&api=http%3A%2F%2F127.0.0.1%3A8787')).toEqual({ mode: 'chat' });
  });

  it('falls back to home when an unsupported mode is provided', () => {
    expect(parseHidecodeAppState('?mode=dashboard')).toEqual({ mode: 'home' });
  });

  it('preserves minimal navigation state from query params', () => {
    expect(
      parseHidecodeAppState(
        '?mode=chat&project=hidecode&session=session-1&run=run-42&file=apps/dashboard/src/ui/App.tsx',
      ),
    ).toEqual({
      mode: 'chat',
      projectId: 'hidecode',
      sessionId: 'session-1',
      selectedRunId: 'run-42',
      selectedFile: 'apps/dashboard/src/ui/App.tsx',
    });
  });

  it('exposes a type guard for app modes', () => {
    expect(isHidecodeAppMode('home')).toBe(true);
    expect(isHidecodeAppMode('chat')).toBe(true);
    expect(isHidecodeAppMode('review')).toBe(true);
    expect(isHidecodeAppMode('replay')).toBe(true);
    expect(isHidecodeAppMode('monitor')).toBe(true);
    expect(isHidecodeAppMode('dashboard')).toBe(false);
    expect(isHidecodeAppMode(null)).toBe(false);
  });
});
