import { describe, expect, it } from 'vitest';
import { resolveLocale } from './locale';

describe('resolveLocale', () => {
  it('prefers the saved choice over the browser language', () => {
    expect(resolveLocale('es', ['ko-KR', 'en'])).toBe('es');
  });

  it('ignores a saved value that is not a supported locale', () => {
    expect(resolveLocale('fr', ['ko'])).toBe('ko');
  });

  it('uses the first supported browser language', () => {
    expect(resolveLocale(null, ['fr-FR', 'es', 'en'])).toBe('es');
  });

  it('collapses regional variants to their language', () => {
    expect(resolveLocale(null, ['es-AR'])).toBe('es');
    expect(resolveLocale(null, ['ko-KR'])).toBe('ko');
    expect(resolveLocale(null, ['EN-gb'])).toBe('en');
  });

  it('falls back to English when nothing matches', () => {
    expect(resolveLocale(null, ['fr-FR', 'de'])).toBe('en');
    expect(resolveLocale(undefined, [])).toBe('en');
  });
});
