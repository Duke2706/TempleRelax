# i18n library and message format for TempleRelax (ko, es, en)

Question (ticket `.scratch/static-react-i18n/issues/01-i18n-format.md`):

> For a static Vite + React + TS site that should later grow into a React monolith with a backend (possibly SSR), which i18n library and message file format should hold the copy for ko, es, en? Compare at least react-i18next (JSON), FormatJS/react-intl (ICU), and Lingui. Criteria: plural/count messages in all three languages (e.g. "태운 생각 N개"), arrays of random phrases (the release notes), lazy loading per locale, type-safe keys in TS, reuse of the same files server-side later, bundle size.

Context: about 30 strings across two Places (forest campfire, beach). Locale resolution: localStorage choice, then browser language, then `en`.

Researched 2026-11-14. Versions are the npm `latest` tags on that date.

## Recommendation

Use **i18next + react-i18next** with **one JSON file per locale** (`src/locales/{en,es,ko}.json`, i18next JSON v4 plural suffixes). Load each locale lazily with `i18next-resources-to-backend` and a dynamic `import()`. Declare `en.json` as the type source in `CustomTypeOptions`.

Why:

- Arrays of phrases are built in: `t('releaseNotes', { returnObjects: true })` returns `string[]`. In ICU-based libraries (react-intl, Lingui), every message must be a string, so you have to work around it.
- Plain JSON with no compile step. The same files and the same `i18next` core run unchanged in Node later, with a documented SSR path (`initialI18nStore` / `useSSR`, `i18next-http-middleware`, `next-i18next`, `remix-i18next`).
- Type-safe keys come straight from the JSON import. You don't need an extraction or codegen step.

Main cost: bundle size. i18next plus react-i18next is about 25.8 kB gzip, against about 4.3 kB for Lingui. If bundle weight becomes the deciding criterion, **Lingui** is the runner-up (see [Tradeoffs](#tradeoffs)).

## Versions and bundle size

Bundlephobia, measured on the npm `latest` versions listed below. Gzip size includes dependencies.

| Package | Version | Min | Gzip |
|---|---|---|---|
| `i18next` | 27.1.1 | 49.0 kB | 15.4 kB |
| `react-i18next` | 18.0.1 | 26.0 kB | 10.4 kB |
| `i18next-resources-to-backend` | 1.2.4 | — | 0.5 kB |
| `i18next-icu` (optional) | 2.7.0 | — | 3.2 kB |
| `react-intl` | 12.1.7 | 52.3 kB | 15.1 kB |
| `@lingui/core` | 6.12.0 | 6.1 kB | 2.5 kB |
| `@lingui/react` | 6.12.0 | 3.8 kB | 1.8 kB |

Sources: `https://bundlephobia.com/api/size?package=<name>` and `https://registry.npmjs.org/<name>/latest`, queried 2026-11-14.

Notes:

- Lingui's runtime "ships no message parser", because catalogs are compiled to JS at build time. Its site claims a runtime of "around 2 kB" ([lingui.dev/introduction](https://lingui.dev/introduction)).
- react-intl includes the ICU parser by default. You can only remove it by precompiling every message with `@formatjs/cli compile --ast` and aliasing `@formatjs/icu-messageformat-parser` to its `no-parser.js` build. After that, any message that is not precompiled throws ([formatjs advanced usage](https://formatjs.github.io/docs/guides/advanced-usage)).

## Criterion by criterion

### 1. Plural/count messages in ko, es, en

CLDR cardinal plural categories ([CLDR plural rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)):

- **ko**: only `other`, covering every number. "태운 생각 N개" needs a single form.
- **en**: `one` (i = 1 and v = 0) and `other`.
- **es**: `one` (n = 1), `many` (exact millions, for example 1000000, and compact-exponent numbers), and `other`.

All three libraries choose the plural form with `Intl.PluralRules`, so all three handle these rules correctly.

- **i18next JSON v4:** the form comes from the key suffix: `_zero`, `_one`, `_two`, `_few`, `_many`, `_other`. The variable must be called `count`, and if `count` is missing, there is "no fallback to the `'key'` value". If a form is missing, i18next has fallen back to `_other` in the same language since v27.1.0, so Spanish works with only `_one` and `_other` ([i18next plurals](https://www.i18next.com/translation-function/plurals)).

  ```json
  // ko.json
  { "burnedThoughts_other": "태운 생각 {{count}}개" }
  // es.json
  { "burnedThoughts_one": "{{count}} pensamiento quemado", "burnedThoughts_other": "{{count}} pensamientos quemados" }
  // en.json
  { "burnedThoughts_one": "{{count}} thought burned", "burnedThoughts_other": "{{count}} thoughts burned" }
  ```

- **ICU (react-intl, Lingui, or i18next with `i18next-icu`):** a single string per locale, for example `{count, plural, other {태운 생각 #개}}`. `other` is mandatory, and FormatJS throws if it is missing. `#` inserts the locale-formatted number. FormatJS warns against using `=1` in place of `one` ([ICU syntax](https://formatjs.github.io/docs/core-concepts/icu-syntax)). ICU keeps all the forms of a message together in one string, which is easier for translators. With about 30 strings and three languages, this advantage is small.

Verdict: all three libraries handle this criterion. ICU is slightly more expressive for translators. i18next suffixes are slightly easier to read in raw JSON.

### 2. Arrays of random phrases (release notes)

- **i18next:** native. `t('array', { returnObjects: true })` returns `['a', 'b', 'c']`, and interpolation, plurals and nesting still work inside the array. In TS, use the selector form `t($ => $.array, { returnObjects: true })` ([i18next objects and arrays](https://www.i18next.com/translation-function/objects-and-arrays)). When `resources` is declared in `CustomTypeOptions`, the return type is inferred. Without it, the result is `$SpecialObject` and has to be cast ([i18next TypeScript](https://www.i18next.com/overview/typescript)).
- **react-intl:** `messages` is typed `Record<string, string> | Record<string, MessageFormatElement[]>`, so every message is one string. The docs don't mention arrays of strings as message values ([react-intl API](https://formatjs.github.io/docs/react-intl/api)). Workarounds are indexed ids (`releaseNotes.0` … `releaseNotes.n`) plus a known count, or a single message with a separator that you split at runtime.
- **Lingui:** catalogs are keyed by message id and compiled per message, which makes this the same constraint as ICU. Workaround: indexed ids, or a list of `msg` descriptors kept in code. Inferred from the catalog model on [lingui.dev/introduction](https://lingui.dev/introduction). The docs show no array-valued message.

Verdict: only i18next supports this without a workaround. The release-notes array is the requirement that most clearly separates the three libraries.

### 3. Lazy loading per locale

- **i18next:** `i18next.use(resourcesToBackend((lng, ns) => import(`./locales/${lng}/${ns}.json`)))`. Vite emits one chunk per locale. Alternatives are `i18next-http-backend` with `loadPath: '/locales/{{lng}}/{{ns}}.json'`, or `partialBundledLanguages` with `addResourceBundle`. Caveat: inline `resources` and a backend are not fallbacks for each other. Use `i18next-chained-backend` if you need that ([add or load translations](https://www.i18next.com/how-to/add-or-load-translations)).
- **Lingui:** `const { messages } = await import(`./locales/${locale}/messages`); i18n.load(locale, messages); i18n.activate(locale);` ([dynamic loading](https://lingui.dev/guides/dynamic-loading-catalogs)). With `@lingui/vite-plugin`, JSON catalogs are imported with a `?lingui` suffix and compiled on the fly ([Vite plugin](https://lingui.dev/ref/vite-plugin)).
- **react-intl:** has no built-in loader. You `import()` the messages yourself and re-render `IntlProvider` with the new `locale` and `messages`.

Verdict: all three libraries can lazy load. i18next and Lingui document it first-class.

The resolution chain (localStorage, then browser language, then `en`) maps directly onto `i18next-browser-languagedetector` with `order: ['localStorage', 'navigator']`, `fallbackLng: 'en'` and `supportedLngs: ['en','es','ko']`. The other two libraries need about 10 lines of custom code for the same chain. That plugin was not part of this research's source set, so verify its options when implementing.

### 4. Type-safe keys in TS

- **i18next:** an `i18next.d.ts` augments `CustomTypeOptions` with `resources: { translation: typeof en }`. The docs call `resources` "the most important option that is used to infer the appropriate keys and return types". Caveats: "JSON files don't support `as const`", so values are typed as `string`, not literals, but keys are still checked. It requires TS 5 and `strict` or `strictNullChecks`. `enableSelector: true` enables `t($ => $.key)` ([i18next TypeScript](https://www.i18next.com/overview/typescript)).
- **react-intl:** `declare global { namespace FormatjsIntl { interface Message { ids: keyof typeof messages } } }` restricts the `id` accepted by `FormattedMessage` and `formatMessage` ([react-intl typing](https://formatjs.github.io/docs/react-intl/)). It can also check message arguments through `FormatjsIntl.MessageArguments` and `MessageArgumentsFromCatalog` ([react-intl API](https://formatjs.github.io/docs/react-intl/api)).
- **Lingui:** augment `Register` with `messageIds: keyof typeof enMessages`, which narrows `i18n._()`, `i18n.t()` and `<Trans>` to give "autocomplete and compile-time errors for invalid IDs". It is opt-in and has no runtime cost ([typed message ids](https://lingui.dev/guides/typed-message-ids)). This only makes sense with explicit ids. Lingui's idiomatic style is source-text messages with generated ids, which doesn't use keys at all.

Verdict: all three libraries can check keys. i18next also types `returnObjects` arrays, and react-intl uniquely type-checks ICU arguments.

### 5. Reusing the same files server-side

- **i18next:** the core is framework-agnostic and the same JSON loads in Node. For SSR, wrap the app in `I18nextProvider` with a per-request instance (the example uses `req.i18n` from `i18next-http-middleware`). Pass `initialLanguage` and `initialI18nStore` to the client and hydrate with `useSSR`, so the client doesn't load translations asynchronously. Integrations exist for Next.js (`next-i18next` v16, App and Pages Router, `getT()` for Server Components), Remix and Gatsby ([react-i18next SSR](https://react.i18next.com/latest/ssr)).
- **react-intl:** `createIntl` plus `createIntlCache` work outside React ("Node, Server API, Redux store, testing..."), and there is a `react-intl/server` entry point ([react-intl API](https://formatjs.github.io/docs/react-intl/api)). Precompiled AST messages are recommended for SSR ([advanced usage](https://formatjs.github.io/docs/guides/advanced-usage)).
- **Lingui:** the core runs "on a Node server". For RSC, call `setI18n(i18n)` server-side per request and pass `i18n.messages` to a client provider that calls `setupI18n` (the `I18n` object is not serializable) ([Lingui RSC tutorial](https://lingui.dev/tutorials/react-rsc)). The server consumes the compiled catalogs, so the backend build also needs the Lingui compile step.

Verdict: all three libraries work server-side. i18next reuses the source JSON with no build step, and it is the only one whose files are directly readable by a non-JS backend if the backend is ever not Node.

### 6. Bundle size

See the [table](#versions-and-bundle-size). Lingui is about 4.3 kB, react-intl about 15.1 kB, and i18next plus react-i18next about 25.8 kB, all gzip. For a ~30-string page the gap is about 21 kB gzip, which is noticeable on a tiny static page but not decisive.

## Summary matrix

| Criterion | react-i18next (JSON) | react-intl (ICU) | Lingui (ICU, compiled) |
|---|---|---|---|
| ko/es/en plurals | Yes (suffixes) | Yes (ICU) | Yes (ICU) |
| Arrays of phrases | **Native** (`returnObjects`) | Workaround | Workaround |
| Lazy per locale | Yes (resources-to-backend) | Manual | Yes (`import` + `load`) |
| Type-safe keys | Yes (from JSON) | Yes (+ arg checking) | Yes (explicit ids only) |
| Server reuse | Same JSON, no build | `createIntl`, precompile advised | Needs compiled catalogs |
| Runtime gzip | ~25.8 kB | ~15.1 kB | **~4.3 kB** |
| Build tooling | None | Optional CLI | Required (Vite plugin / CLI) |

## Tradeoffs

- **i18next costs about 21 kB gzip more than Lingui.** Accept it in exchange for native arrays, zero build tooling, and plain JSON reusable by any backend.
- **The JSON v4 suffix format is i18next-specific.** If ICU becomes desirable later (translators, a TMS), `i18next-icu` (about 3.2 kB gzip) lets the same library read ICU strings. In that case, set `parseInterpolation: false` on versions before 26.5.0 to avoid phantom variable names in types ([i18next TypeScript](https://www.i18next.com/overview/typescript)). Moving the ~30 strings between formats is cheap either way.
- **Choose Lingui instead** if bundle weight is the priority and you accept a compile step plus modelling release notes as indexed ids. Its typed ids are opt-in and require explicit ids.
- **react-intl** offers no criterion where it wins outright for this app. Argument-level type checking is its unique strength, and it doesn't outweigh the lack of arrays and a manual loader.

## Open items not verified here

- `i18next-browser-languagedetector` option names (`order`, `caches`, `lookupLocalStorage`) need to be checked against its README before implementation.
- Bundlephobia measures each package in isolation. Real tree-shaken output in Vite may differ, so measure it with `vite build` once the library is wired in.
