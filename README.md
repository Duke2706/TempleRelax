# TempleRelax (한 줄 사색)

A quiet night scene: write one line about something weighing on you and let it go, burned in a forest campfire or carried off by the sea in a bottle. Ambient sound, rain and snow included. Domain terms live in `GLOSSARY.md`.

Static site built with Vite + React + TypeScript.

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm test           # Vitest: locale resolution and translation key parity
```

## Layout

- `src/engine/`: canvas engine, shared types (`Place`, `Ritual`, `Weather`, `Presence`) and the audio mixer.
- `src/places/`, `src/rituals/`, `src/weathers/`: one file per Place, Ritual and Weather. Register new ones in `src/registry.ts`.
- `src/locales/{ko,es,en}.json`: all user-visible text (i18next JSON, one lazy-loaded chunk per language). Add a key to all three; `npm test` fails if they drift.
- `src/i18n/`: i18next setup and locale resolution (saved choice → browser language → English).
- `src/ui/`: React UI around the canvas.
- `public/assets/audio/`: ambient loops (MP3).
