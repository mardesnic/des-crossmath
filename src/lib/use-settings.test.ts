import { describe, expect, it } from 'vitest';

import { parseLanguage } from './use-settings';

describe('shared language', () => {
  it('reads a saved language', () => {
    expect(parseLanguage('"auto"')).toBe('auto');
    expect(parseLanguage('"en"')).toBe('en');
    expect(parseLanguage('"hr"')).toBe('hr');
  });

  it('ignores anything else', () => {
    expect(parseLanguage(null)).toBeUndefined();
    expect(parseLanguage('')).toBeUndefined();
    expect(parseLanguage('hr')).toBeUndefined();
    expect(parseLanguage('"de"')).toBeUndefined();
    expect(parseLanguage('{"language":"hr"}')).toBeUndefined();
  });
});
