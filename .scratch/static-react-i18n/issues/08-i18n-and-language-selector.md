# Extract copy to i18n files and add the language selector

Type: task
Status: resolved
Blocked by: 01, 07

## Question

Steps 3–4: move every user-visible string (HTML, aria-labels, notes arrays, counters, title) into locale files in the chosen format; Korean is the source, add es and en translations. Add a language selector and locale resolution (saved choice → browser language ko/es/en → en), updating `<html lang>` and `<title>`. Vitest: locale resolution cases and key parity across the three locales.

## Answer

Done with i18next 27 + react-i18next 18, per "Which i18n library and message format?".

- `src/locales/{ko,es,en}.json`: every user-visible string, grouped per Place; plurals as `counter_one`/`counter_other` (Korean: `_other` only); Closing lines and hint as arrays. Each locale is its own lazy chunk (`i18next-resources-to-backend`), first render waits in `<Suspense>`.
- Typed keys against `en.json` (`src/i18n/i18next.d.ts`). Keys built from registry ids (Place, Weather) go through a small cast and are covered by the parity test instead.
- Locale resolution is our own pure function (`src/i18n/locale.ts`), not `i18next-browser-languagedetector`: saved choice in `localStorage` → first supported browser language (regional variants collapsed) → `en`. Storage failures are swallowed.
- Language selector: three endonym buttons (한국어 / Español / English) top right; switching updates `<html lang>`, `<title>`, and saves the choice. `index.html` ships with `lang="en"` and the English title until JS runs.
- Visible notes now store a copy key, so a note on screen follows a language switch.

Checks: Vitest 9/9 (5 locale-resolution cases written first and seen RED; 4 parity checks: same keys across locales, plural forms per `Intl.PluralRules`, no empty entries, same number of Closing lines, every registered Place/Weather named). The parity test was probed by deleting two Spanish keys: it failed, then passed once restored. `npm run build` passes. In the browser (production preview, browser languages es, es-ES, ko, en-US): first load in Spanish; switch to English persisted across reload; "1 thought burned" singular; Korean beach + rain shows the generic note; a visible Closing line switches language; mobile 375 px has no overlap or horizontal scroll; no console errors.

Not done: the es/en copy is a first draft by the agent and has not been reviewed by a native speaker (see Not yet specified).
