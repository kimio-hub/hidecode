import { describe, expect, it } from 'vitest';
import type { TraceEvent } from './loader';
import {
  nestedRecord,
  outputForData,
  riskForData,
  riskForEvent,
  sandboxSummaryForData,
  stringField,
  toolNameForEvent,
} from './trace-normalize';

function event(data: Record<string, unknown>, type = 'tool.requested'): TraceEvent {
  return {
    eventId: 'event-1',
    runId: 'run-1',
    taskId: 'task-1',
    timestamp: '2026-05-11T00:00:00.000Z',
    actor: 'test',
    type,
    data,
  };
}

describe('trace normalization helpers', () => {
  it('extracts trimmed non-empty strings only', () => {
    expect(stringField(' terminal ')).toBe('terminal');
    expect(stringField('   ')).toBeUndefined();
    expect(stringField(42)).toBeUndefined();
  });

  it('extracts object records safely', () => {
    expect(nestedRecord({ mode: 'ephemeral' })).toEqual({ mode: 'ephemeral' });
    expect(nestedRecord(null)).toBeUndefined();
    expect(nestedRecord(['not-record'])).toBeUndefined();
    expect(nestedRecord('not-record')).toBeUndefined();
  });

  it('normalizes tool names from legacy name and real tool fields with fallback control', () => {
    expect(toolNameForEvent(event({ name: 'read_file' }))).toBe('read_file');
    expect(toolNameForEvent(event({ tool: 'execute_shell' }))).toBe('execute_shell');
    expect(toolNameForEvent(event({}), 'tool')).toBe('tool');
    expect(toolNameForEvent(undefined)).toBeUndefined();
  });

  it('normalizes risk from explicit severity or capability risks array', () => {
    expect(riskForData({ risk: 'critical', risks: ['write'] })).toBe('critical');
    expect(riskForData({ risks: ['filesystem-write', 'network'] })).toBe('high');
    expect(riskForData({ risks: ['critical-capability'] })).toBe('critical');
    expect(riskForData({ risks: ['read-only'] })).toBe('low');
    expect(riskForData({ risks: ['git'] })).toBe('high');
    expect(riskForData({ risk: 'nonsense', risks: [false, null] })).toBeUndefined();
  });

  it('normalizes risk from trace events', () => {
    expect(riskForEvent(event({ risks: ['exec'] }))).toBe('high');
    expect(riskForEvent(undefined)).toBeUndefined();
  });

  it('extracts flat and nested stdout/stderr output', () => {
    expect(outputForData({ stdout: 'flat out', stderr: 'flat err' })).toEqual({ stdout: 'flat out', stderr: 'flat err', summary: undefined, ok: undefined });
    expect(outputForData({ output: { stdout: 'nested out', stderr: 'nested err', summary: 'nested summary', ok: true } })).toEqual({ stdout: 'nested out', stderr: 'nested err', summary: 'nested summary', ok: true });
    expect(outputForData({ stdout: '  flat wins\n', output: { stdout: 'nested out' } })).toEqual({ stdout: '  flat wins\n', stderr: undefined, summary: undefined, ok: undefined });
    expect(outputForData({ output: 'not-object' })).toEqual({ stdout: undefined, stderr: undefined, summary: undefined, ok: undefined });
  });

  it('summarizes nested sandbox metadata safely', () => {
    expect(sandboxSummaryForData({ sandbox: { mode: 'ephemeral', writeMode: 'workspace', blocked: false } }))
      .toBe('mode=ephemeral · writeMode=workspace · blocked=false');
    expect(sandboxSummaryForData({ sandbox: { writeMode: 'readonly' } })).toBe('writeMode=readonly');
    expect(sandboxSummaryForData({ sandbox: 'not-object' })).toBeUndefined();
  });
});
