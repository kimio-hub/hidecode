import { describe, expect, it } from 'vitest';
import { ScriptedModelAdapter } from '../src/index.js';

describe('ScriptedModelAdapter', () => {
  it('returns scripted final step', async () => {
    const model = new ScriptedModelAdapter([{ kind: 'final', summary: 'ok' }]);
    await expect(model.next({} as never, [])).resolves.toEqual({ kind: 'final', summary: 'ok' });
  });
});
