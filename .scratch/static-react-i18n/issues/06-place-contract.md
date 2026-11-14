# What does a Place definition contain?

Type: grilling
Status: resolved
Blocked by: 03

## Question

Define the TS contract for a Place so a new one (say, a mountain lake) can be added without touching the engine: scenery renderer (static background + per-frame layer), ambient sound layers and their volumes per Weather, the Ritual applied to a Thought, its copy keys (hint, button label, keep note, counter, release notes), and how Weather interacts with it (e.g. snow warming near the fire is forest-specific today). Decide what stays engine-wide (stars, weather, peer stars) vs per-Place, and how the Ritual is modelled (strategy object, plugin, etc.).

## Answer

Grilled with the owner on 2026-11-14 (Q1–Q11, all recommendations accepted).

- **Place** is a strategy object implementing `interface Place`, registered in a `places` array: `id`, `buildScenery()` (static background), `drawFrame()` (per-frame layer, e.g. fire or sea), `ritual`, `sounds`, copy namespace. No class hierarchy, no dynamic plugins. Adding a Place = one new file + one array entry.
- **Ritual** is its own reusable `interface` (`release(thought)`, `draw(now)`, signals completion). A Place points to one and hands it anchor points (fire position, horizon).
- **Weather × Place**: the engine passes Weather intensity to the Place every frame; the Place decides its own reaction (rain dims the fire inside the forest). A Place may expose optional `warmthAt(x, y)` (0..1) that snow uses to tint near heat; the beach does not define it.
- **Sounds**: the Place owns its ambient layers (forest: fire, crack; beach: wave), the Weather owns its own (rain; snow has none). Each layer declares volume per Weather, e.g. wave `{ clear: 0.5, rain: 0.4, snow: 0.5 }`. No central `want()`.
- **Weather** follows the same strategy: `interface Weather` (`id`, `draw(intensity)`, optional sound layer) in a `weathers` registry (clear, rain, snow).
- **Copy**: each Place has its own copy group (hint, button, keep note, counter label, Closing lines). Weather notes become per Place (`forest.weather.rain`) with a generic fallback, fixing fire-specific notes shown on the beach.
- **Counters**: one per Place, session-only, label from the Place's copy.
- **Layout**: the engine computes a shared Layout (W, H, dpr, ground line, horizon, unit scale S) and passes it to Places; each Place derives its own anchors (fire, moon).
- **Switching Place mid-Ritual** cancels in-flight Thoughts silently (no count, no Closing line), as today.
- **Shared stars**: kept behind an `interface Presence` with a no-op static implementation (share checkbox hidden); peer-star drawing stays ready for a realtime backend later.
- **Styles**: UI reads CSS tokens per Place via `<body data-place="…">` overriding `--accent`, `--panel`, etc. In the port both Places keep today's colours; a distinct beach palette is a separate design decision.
