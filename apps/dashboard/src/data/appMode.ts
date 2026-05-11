export const hidecodeAppModes = ['home', 'chat', 'review', 'replay', 'monitor'] as const;

export type HidecodeAppMode = (typeof hidecodeAppModes)[number];

export interface HidecodeAppState {
  mode: HidecodeAppMode;
  projectId?: string;
  sessionId?: string;
  selectedRunId?: string;
  selectedFile?: string;
}

export function isHidecodeAppMode(value: unknown): value is HidecodeAppMode {
  return typeof value === 'string' && hidecodeAppModes.includes(value as HidecodeAppMode);
}

export function createHidecodeAppState(overrides: Partial<HidecodeAppState> = {}): HidecodeAppState {
  const mode = isHidecodeAppMode(overrides.mode) ? overrides.mode : 'home';

  return {
    ...overrides,
    mode,
  };
}

export function parseHidecodeAppState(search: string): HidecodeAppState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const mode = params.get('mode');

  return createHidecodeAppState({
    mode: isHidecodeAppMode(mode) ? mode : 'home',
    projectId: readOptionalParam(params, 'project'),
    sessionId: readOptionalParam(params, 'session'),
    selectedRunId: readOptionalParam(params, 'run'),
    selectedFile: readOptionalParam(params, 'file'),
  });
}

function readOptionalParam(params: URLSearchParams, key: string): string | undefined {
  return params.get(key) || undefined;
}
