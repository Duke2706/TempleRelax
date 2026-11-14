# Map: TempleRelax as a static, multilingual React site

Label: wayfinder:map

## Destination

**Reached 2026-11-14.** Remaining items below are follow-ups, not blockers.

Steps 1–4 done and working: the single-file mockup is split (CSS, JS, audio assets), ported to a static Vite + React + TypeScript site where adding a new Place is cheap, all copy lives in i18n files (ko, es, en) with a language selector and browser-language detection (default en), deployed to GitHub Pages.

## Notes

- **Execution is in scope**: unlike a planning-only map, this effort carries execution. `task` tickets are executed by an agent, one per session.
- Domain language: see `GLOSSARY.md` (Thought, Place, Ritual, Weather, Closing line, Presence). Use those terms in code and copy.
- Generated artifacts (code, comments, keys, docs) in English. Korean is the current source copy.
- Stack: Vite + React + TypeScript, static build. React owns the UI chrome only; canvas drawing and Web Audio stay imperative TS modules mounted from a component.
- Steps 1–2 are first done in vanilla as a working reference before the React port.
- Tests: Vitest for pure logic only (locale resolution, translation key parity). Canvas and audio verified by eye in the browser.
- Locale resolution order: saved choice in `localStorage` → browser language (`ko`/`es`/`en`, regional variants collapsed) → `en`. Switching updates `<html lang>` and `<title>`.
- Hosting: GitHub Pages from `Duke2706/TempleRelax`, which will be made public (free tier).
- Skills to consult: `grilling` + `domain-modeling` for grilling tickets; `tdd` for the Vitest pieces.

## Decisions so far

- Destination & stack (charting session, 2026-11-14): static React + TS SPA via Vite; vanilla extraction first; Thought (not "wish") is the canonical term; Place / Ritual / Weather vocabulary adopted; GitHub Pages on a public repo.
- [Which i18n library and message format?](issues/01-i18n-format.md): i18next + react-i18next, one JSON file per locale; native arrays for release notes, reusable server-side.
- [Keep MP3 or re-encode the ambient loops?](issues/02-audio-format.md): keep MP3 as separate files (no base64), add a silence-trimming loop guard; Opus deferred.
- [Split CSS and JS out of index.html (vanilla)](issues/03-vanilla-split-css-js.md): done; styles.css + app.js, byte-identical reassembly, verified in browser.
- [Extract embedded audio to assets (vanilla)](issues/04-vanilla-extract-audio.md): done; MP3s in assets/audio, fetched lazily; needs a local server (no sound on file://).
- [What does a Place definition contain?](issues/06-place-contract.md): Place, Ritual and Weather as strategy objects in registries; Place owns ambient sounds and copy, Weather owns its own; shared Layout; Presence as no-op adapter; per-Place CSS tokens.
- [Port to Vite + React + TS](issues/07-react-port.md): done; engine/Places/Rituals/Weathers per the contract, React UI chrome, Korean copy centralised in src/copy/ko.ts; parity checked in the browser.
- [Extract copy to i18n files and add the language selector](issues/08-i18n-and-language-selector.md): done; ko/es/en JSON, own locale resolver with tests, endonym selector, html lang/title synced.
- [Make the repo public and enable GitHub Pages](issues/05-make-repo-public-enable-pages.md): done by the owner; site at https://duke2706.github.io/TempleRelax/.
- [Deploy to GitHub Pages with Actions](issues/09-pages-deploy.md): done; deploy on push to main (test + build + Pages), first run green, live site checked.

## Not yet specified

- Who reviews the Spanish/English copy so it keeps the calm, gentle tone of the Korean original: drafts are in `src/locales/`, plus three new Korean lines added in the port (generic Weather notes, beach scene and input labels).
- Fonts for Latin scripts: Gowun Batang/Dodum cover Latin, but whether they read well for es/en is unchecked.
- Whether the React stack choice deserves an ADR once the port lands.

## Out of scope

- Dynamic web with backend (monolith React + simple back): later effort.
- Making shared stars actually work across visitors (needs realtime backend).
- A sound for snow: snow stays silent, animation only.
