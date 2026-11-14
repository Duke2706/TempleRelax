export const SUPPORTED_LOCALES = ['ko', 'es', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const FALLBACK_LOCALE: Locale = 'en';

/** Each language named in itself, so visitors recognise their own whatever the current locale. */
export const LOCALE_NAMES: Record<Locale, string> = { ko: '한국어', es: 'Español', en: 'English' };

const STORAGE_KEY = 'templeRelax.locale';

function asLocale(tag: string | null | undefined): Locale | null {
  if (!tag) return null;
  const lang = tag.toLowerCase().split('-')[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(lang) ? (lang as Locale) : null;
}

/** Saved choice first, then the first supported browser language (regional variants collapsed), then English. */
export function resolveLocale(saved: string | null | undefined, browserLanguages: readonly string[]): Locale {
  const fromSaved = saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved) ? (saved as Locale) : null;
  if (fromSaved) return fromSaved;
  for (const tag of browserLanguages) {
    const locale = asLocale(tag);
    if (locale) return locale;
  }
  return FALLBACK_LOCALE;
}

/** Storage can be blocked (private mode, disabled site data): never let that break the page. */
export function readSavedLocale(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Ignore: the choice just won't be remembered.
  }
}

export function browserLanguages(): readonly string[] {
  if (navigator.languages && navigator.languages.length) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}
