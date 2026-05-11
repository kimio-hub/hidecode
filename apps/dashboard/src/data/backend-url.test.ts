import { describe, expect, it } from 'vitest';

import { getBackendBaseUrl } from './backend';

describe('dashboard backend base URL', () => {
  it('uses the api query parameter when the launcher provides one', () => {
    expect(getBackendBaseUrl('?mode=home&api=http%3A%2F%2F127.0.0.1%3A8787')).toBe('http://127.0.0.1:8787');
  });

  it('falls back to same-origin requests without launcher configuration', () => {
    expect(getBackendBaseUrl('?mode=chat')).toBe('');
  });
});
