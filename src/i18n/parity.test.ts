import { describe, expect, it } from 'vitest';
import en from '../locales/en.json';
import es from '../locales/es.json';
import ko from '../locales/ko.json';
import { places, weathers } from '../registry';

const locales = { ko, es, en } as Record<string, unknown>;
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/** Flattens a resource tree to dotted keys; arrays are leaves. */
function leaves(node: unknown, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>();
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const [k, v] of Object.entries(node)) {
      for (const [kk, vv] of leaves(v, prefix ? prefix + '.' + k : k)) out.set(kk, vv);
    }
  } else {
    out.set(prefix, node);
  }
  return out;
}

const baseKeys = (tree: unknown) => new Set([...leaves(tree).keys()].map((k) => k.replace(PLURAL_SUFFIX, '')));

describe('locale resources', () => {
  it('have the same keys in every locale (ignoring plural suffixes)', () => {
    const reference = [...baseKeys(en)].sort();
    for (const [name, tree] of Object.entries(locales)) {
      expect([...baseKeys(tree)].sort(), name).toEqual(reference);
    }
  });

  it('give every plural the forms the locale needs (missing "many" falls back to "other")', () => {
    for (const [name, tree] of Object.entries(locales)) {
      const keys = [...leaves(tree).keys()];
      const plurals = new Set(keys.filter((k) => PLURAL_SUFFIX.test(k)).map((k) => k.replace(PLURAL_SUFFIX, '')));
      const needed = new Intl.PluralRules(name).resolvedOptions().pluralCategories.filter((c) => c !== 'many');
      for (const base of plurals) {
        for (const cat of needed) expect(keys, `${name}: ${base}_${cat}`).toContain(`${base}_${cat}`);
      }
    }
  });

  it('have no empty strings or lists, and the same number of Closing lines', () => {
    for (const [name, tree] of Object.entries(locales)) {
      for (const [key, value] of leaves(tree)) {
        if (Array.isArray(value)) expect(value.length, `${name}: ${key}`).toBeGreaterThan(0);
        else expect(String(value).trim(), `${name}: ${key}`).not.toBe('');
      }
      for (const p of places) {
        const count = (leaves(tree).get(`places.${p.id}.closingLines`) as string[]).length;
        expect(count, `${name}: ${p.id} closing lines`).toBe((leaves(en).get(`places.${p.id}.closingLines`) as string[]).length);
      }
    }
  });

  it('name every registered Place and Weather', () => {
    for (const [name, tree] of Object.entries(locales)) {
      const keys = baseKeys(tree);
      for (const p of places) expect(keys.has(`places.${p.id}.name`), `${name}: ${p.id}`).toBe(true);
      for (const w of weathers) expect(keys.has(`weather.${w.id}`), `${name}: ${w.id}`).toBe(true);
    }
  });
});
