import { describe, expect, it } from 'vitest';
import { parseDashboardSource } from './query';

describe('parseDashboardSource', () => {
  it('uses mock data when search is empty', () => {
    expect(parseDashboardSource('')).toEqual({ kind: 'mock' });
  });

  it('uses a run directory URL when run is provided', () => {
    expect(parseDashboardSource('?run=/runs/demo')).toEqual({ kind: 'run-url', baseUrl: '/runs/demo' });
  });

  it('uses explicit trace and manifest URLs when both are provided', () => {
    expect(parseDashboardSource('?trace=/runs/demo/trace.jsonl&manifest=/runs/demo/run.json')).toEqual({
      kind: 'explicit-url',
      traceUrl: '/runs/demo/trace.jsonl',
      manifestUrl: '/runs/demo/run.json',
    });
  });

  it('allows trace-only explicit URL loading', () => {
    expect(parseDashboardSource('?trace=/runs/demo/trace.jsonl')).toEqual({
      kind: 'explicit-url',
      traceUrl: '/runs/demo/trace.jsonl',
      manifestUrl: undefined,
    });
  });
});
