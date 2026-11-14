# Keep MP3 or re-encode the ambient loops?

Type: research
Status: resolved
Blocked by:

## Question

The four ambient loops (fire, crack, rain, wave) are embedded MP3s totalling ~5.4 MB as base64 (~4 MB binary). They are decoded with `decodeAudioData` and looped seamlessly. Should they stay MP3 as extracted, or be re-encoded (Opus/WebM, AAC/M4A) for size? Check browser support for `decodeAudioData` per format (Safari especially), MP3 encoder padding vs gapless looping, and a sensible bitrate for ambient noise.

## Answer

**Keep MP3; ship as separate files (drops base64: 5.42 MB → 4.06 MB); add a loop guard.** All four are mono libmp3lame files with a LAME/Info tag (delay 576 + padding) that Chrome, Firefox 83+ and Safari (since Monterey) use to trim, so loops should be gapless. Loop guard: after decoding, set `loopStart`/`loopEnd` to the first/last sample above ~1e-4 and pick the random offset inside that range. Opus is optional later, only as separate files with decode-then-fallback-to-MP3 (Safari WebKit bug 327697 still open); skip AAC/M4A. Measured: fire 24 kHz/64 kbps/145 s, crack 32 kHz/64 kbps/114 s, rain 32 kHz/64 kbps/87 s, wave 24 kHz/~48 kbps/215 s.

Findings: branch `research/audio-format`, file `research/audio-format.md` (commit a19be5e).
