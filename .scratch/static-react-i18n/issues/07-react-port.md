# Port to Vite + React + TS

Type: task
Status: resolved
Blocked by: 02, 04, 06

## Question

Scaffold Vite + React + TypeScript (`base` set for GitHub Pages). Port the canvas engine and audio mixer into imperative TS modules following the Place contract, with forest and beach as the two Place definitions; Follow the contract in "What does a Place definition contain?" (Place/Ritual/Weather registries, Presence no-op adapter, per-Place CSS tokens). React renders the UI chrome (Place/Weather toggles, sound button, Thought input, counter, notes) and mounts the engine. Copy still in Korean (i18n comes next). Behaviour parity with the vanilla reference, checked in the browser. The audio mixer adds the loop guard from "Keep MP3 or re-encode the ambient loops?" (loopStart/loopEnd at first/last non-silent sample, random offset inside that range).

## Answer

Done: Vite 8 + React 19 + TypeScript 7 (strict), `base: './'`. The vanilla reference was removed from the tree (it stays in history at 165a776); audio moved to `public/assets/audio/`.

- `src/engine/types.ts` holds the contract: `Layout`, `Frame`, `Place`, `Ritual`, `Weather`, `SoundLayer`, `Presence`.
- `src/engine/engine.ts`: canvas, frame loop, stars (dimmed by each Weather's `starDimming`), Weather intensities, Presence stars. No Place ids inside the engine.
- `src/places/{forest,beach}.ts`, `src/rituals/{burn,float}.ts`, `src/weathers/index.ts` (clear, rain, snow), `src/presence/noop.ts`, registered in `src/registry.ts`.
- `src/engine/audio.ts`: lazy fetch + decode per layer, retry on failure, loop guard (loopStart/loopEnd at first/last sample above 1e-4, random offset inside).
- `src/copy/ko.ts`: all Korean copy, grouped per Place (shape ready for i18n).
- `src/ui/App.tsx`: UI chrome; `<body data-place>` drives per-Place CSS tokens in `src/styles.css` (same colours for both Places).

Checked: `npm run build` (tsc + vite) passes. In the browser (production preview): forest Thought burned → counter 1 + Closing line; rain + sound → fire, crack, rain fetched; beach + snow + Enter → bottle floated, counter 1 after ~20 s, wave fetched; switching back keeps the forest count; share checkbox hidden. Dev server (StrictMode double mount): one Thought counts once. No console errors.

New Korean copy written for this port, to be reviewed: generic Weather notes (rain "빗소리가 들려요.", snow "눈이 조용히 내려요.", now shown on the beach instead of fire notes), beach scene label "달빛이 비치는 밤바다", beach input label "띄울 생각 한 줄".
