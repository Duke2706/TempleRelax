# Extract embedded audio to assets (vanilla)

Type: task
Status: resolved
Blocked by: 03

## Question

Step 2 in vanilla: decode the four base64 MP3s into `assets/audio/{fire,crack,rain,wave}.mp3` and load them with `fetch` + `decodeAudioData` instead of the data URIs, keeping the lazy per-layer decoding. Extract as-is (format decision is "Keep MP3 or re-encode the ambient loops?"). Verify sound in both Places and with rain.

## Answer

Done. The four data URIs were base64-decoded byte-for-byte into `assets/audio/{fire,crack,rain,wave}.mp3` (4.06 MB total, `app.js` drops from 5.4 MB to 28 KB). `app.js` now loads each layer lazily with `fetch` + `decodeAudioData`; a failed load logs a warning and forgets the layer so a later `applySound()` retries it (before, a failure was swallowed and the layer stayed dead forever). Verified over a local HTTP server: sound on in forest, rain, beach requested fire, crack, rain, wave in that order; all four decode (145 s, 114 s, 87 s, 215 s); no console errors.

Consequence: opening `index.html` straight from disk (`file://`) no longer plays sound, because browsers block `fetch` on `file://`. Use a local server (`python -m http.server`) until the Vite dev server arrives with the React port.
