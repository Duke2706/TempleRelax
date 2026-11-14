import i18n from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';
import { browserLanguages, FALLBACK_LOCALE, readSavedLocale, resolveLocale, saveLocale, SUPPORTED_LOCALES, type Locale } from './locale';

/** Keeps the document in step with the language: `<html lang>` and the tab title. */
function syncDocument(lng: string) {
  document.documentElement.lang = lng;
  document.title = i18n.t('title');
}

export const initialLocale: Locale = resolveLocale(readSavedLocale(), browserLanguages());

i18n
  .use(resourcesToBackend((lng: string) => import(`../locales/${lng}.json`)))
  .use(initReactI18next)
  .init({
    lng: initialLocale,
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', syncDocument);
i18n.on('loaded', () => syncDocument(i18n.language));

/** Switches language and remembers the visitor's choice. */
export function changeLocale(locale: Locale): void {
  saveLocale(locale);
  void i18n.changeLanguage(locale);
}

export default i18n;
