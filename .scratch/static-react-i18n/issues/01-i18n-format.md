# Which i18n library and message format?

Type: research
Status: resolved
Blocked by:

## Question

For a static Vite + React + TS site that should later grow into a React monolith with a backend (possibly SSR), which i18n library and message file format should hold the copy for ko, es, en? Compare at least react-i18next (JSON), FormatJS/react-intl (ICU), and Lingui. Criteria: plural/count messages in all three languages (e.g. "태운 생각 N개"), arrays of random phrases (the release notes), lazy loading per locale, type-safe keys in TS, reuse of the same files server-side later, bundle size.

## Answer

**i18next + react-i18next, one JSON (i18next v4 format) file per locale** (`src/locales/{en,es,ko}.json`). Only option with native string arrays for the release notes (`returnObjects: true`); plurals via `_one`/`_other` (Korean needs `_other` only; Spanish `_many` falls back to `_other` since i18next v27.1.0); lazy per-locale chunks via `i18next-resources-to-backend`; type-safe keys via `CustomTypeOptions` with `en.json`; same JSON reusable server-side/SSR later. Cost: ~25.8 kB gzip vs ~4.3 kB for Lingui (runner-up). `i18next-browser-languagedetector` option names still unverified.

Findings: branch `research/i18n-format`, file `research/i18n-format.md` (commit a686eaa).
