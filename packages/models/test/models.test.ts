import { describe, expect, it } from 'vitest';
import { OpenAIModelAdapter, ScriptedModelAdapter } from '../src/index.js';

describe('model adapters', () => {
  it('returns scripted final step', async () => {
    const model = new ScriptedModelAdapter([{ kind: 'final', summary: 'ok' }]);
    await expect(model.next({} as never, [])).resolves.toEqual({ kind: 'final', summary: 'ok' });
  });

  it('exposes safe provider and model names for manifests', () => {
    const scripted = new ScriptedModelAdapter([]);
    const openai = new OpenAIModelAdapter({ baseUrl: 'https://example.invalid/v1', apiKey: 'not-used', model: 'gpt-test' });

    expect(scripted.provider).toBe('scripted');
    expect(scripted.name).toBe('scripted-local');
    expect(openai.provider).toBe('openai-compatible');
    expect(openai.name).toBe('gpt-test');
  });
});
