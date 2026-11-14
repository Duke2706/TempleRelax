# Port to Vite + React + TS

Type: task
Status: open
Blocked by: 02, 04, 06

## Question

Scaffold Vite + React + TypeScript (`base` set for GitHub Pages). Port the canvas engine and audio mixer into imperative TS modules following the Place contract, with forest and beach as the two Place definitions; Follow the contract in "What does a Place definition contain?" (Place/Ritual/Weather registries, Presence no-op adapter, per-Place CSS tokens). React renders the UI chrome (Place/Weather toggles, sound button, Thought input, counter, notes) and mounts the engine. Copy still in Korean (i18n comes next). Behaviour parity with the vanilla reference, checked in the browser. The audio mixer adds the loop guard from "Keep MP3 or re-encode the ambient loops?" (loopStart/loopEnd at first/last non-silent sample, random offset inside that range).
