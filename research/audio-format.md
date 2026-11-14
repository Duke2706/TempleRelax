# Ambient loop audio format: keep MP3 or re-encode?

Question (ticket `.scratch/static-react-i18n/issues/02-audio-format.md`): the four
ambient loops (fire, crack, rain, wave) are embedded MP3 data URIs (~5.4 MB base64,
~4 MB binary), decoded with `decodeAudioData` and looped with
`AudioBufferSourceNode.loop = true` in an `AudioContext({ sampleRate: 32000 })`,
starting at a random offset. Should they stay MP3 or be re-encoded (Opus/WebM, AAC/M4A)?

## Recommendation

1. **Keep MP3 as extracted.** It is the only format that `decodeAudioData` handles in
   every current engine without caveats, and these files carry the encoder
   delay/padding metadata that all three engines now use to trim decoded output.
2. **Add a format-agnostic loop guard**: after decoding, find the first and last
   non-silent samples and set `loopStart`/`loopEnd` to them. This keeps the loop
   gapless even on an engine that fails to trim, and costs a few lines.
3. **The cheap size win is the container, not the codec.** Base64 adds ~33%
   (5.42 MB inline vs 4.06 MB binary). If the new static build can emit the loops as
   separate files fetched with `fetch()` → `arrayBuffer()`, that saves ~1.36 MB with
   zero quality or compatibility risk.
4. **Opus is optional, only with a fallback.** Opus mono at ~32 kbps would bring the
   set to ~2.3 MB (from 4.06 MB), but Safari's `decodeAudioData` Opus support has a
   bug-ridden history and still has open defects. Only do it if the files become
   separate assets, so the MP3 fallback costs nothing unless it is used. Do not
   inline both formats.
5. **Skip AAC/M4A.** No size advantage over Opus, and gapless trimming of AAC
   depends on edit-list/priming handling that Firefox only added in v111 and that
   Chromium was reported to share the bug on.

## Measured facts about the current files

Taken by base64-decoding the four data URIs in `index.html` (lines 96–99) and parsing
the MPEG frame headers and the first-frame Info/LAME tag (scratch script, not
committed).

| Loop  | Binary size | Sample rate | Channels | Bitrate (CBR)     | Duration | Encoder   | Encoder delay / end padding (samples) |
|-------|------------:|------------:|----------|-------------------|---------:|-----------|---------------------------------------|
| fire  | 1,160,685 B | 24,000 Hz   | mono     | 64 kbps           | 145.1 s  | Lavc60.31 | 576 / 768                             |
| crack |   912,717 B | 32,000 Hz   | mono     | 64 kbps           | 114.0 s  | Lavc60.31 | 576 / 960                             |
| rain  |   697,581 B | 32,000 Hz   | mono     | 64 kbps           |  87.2 s  | Lavc60.31 | 576 / 732                             |
| wave  | 1,290,909 B | 24,000 Hz   | mono     | 48 kbps (mostly)  | 215.1 s  | Lavc60.31 | 576 / 960                             |

- Total: 4,061,892 B binary, 561.4 s of audio, average ~58 kbps.
- All four are FFmpeg/libmp3lame output with an `Info` (CBR Xing) frame plus a LAME
  extension carrying encoder delay and padding. That metadata is what decoders use for
  gapless trimming.
- fire and wave are MPEG-2 (24 kHz, bandwidth below 12 kHz); crack and rain are MPEG-1
  at 32 kHz. With a 32 kHz context the effective bandwidth ceiling is 16 kHz anyway.
- They are already lossy at low bitrates. Re-encoding to Opus would be a lossy-to-lossy
  transcode (generation loss); if Opus is pursued, encode from the original sources if
  they still exist.

## `decodeAudioData` format support

- The Web Audio spec does not list formats: the input may be "in any of the formats
  supported by the audio element"; the type is sniffed, and on failure the promise
  rejects with `EncodingError`. After decoding, PCM is resampled to the context's
  sample rate. [Web Audio API spec, decodeAudioData]
  So the 24 kHz files are resampled to 32 kHz by the browser; that is expected and fine.
- MDN confirms the resampling and that the promise form is primary while the
  callbacks (used in `index.html`) are legacy but supported. [MDN decodeAudioData]
- **MP3** is supported for media elements in every engine (Safari since 3.1).
  [MDN audio codecs guide]
- **Opus in Safari** (the risky one):
  - caniuse shows Safari macOS as "partial" from 11 onward and iOS fully supported only
    from 18.4; its data covers the `<audio>` element only, not Web Audio. [caniuse opus]
  - Safari 15 added WebM Opus to `<audio>` but not to `decodeAudioData`, breaking sites
    that feature-detected with `canPlayType`. [WebKit bug 226922]
  - WebM Opus support stayed inconsistent between `<audio>`, `canPlayType` and
    `decodeAudioData` across iOS/iPadOS/macOS until the reporter observed consistent
    support at Safari 17.4; the bug is still open. [WebKit bug 238546]
  - Safari 18.4 added the Ogg container for Opus and Vorbis on macOS 15.4 / iOS 18.4.
    [WebKit features in Safari 18.4]
  - Open as of October 2026: Safari's `decodeAudioData` refuses Opus WebM in every
    channel-mapping family except 0, failing with a `null` error. Family 0 stereo
    decodes; family 0 mono was not tested. Reproduced by a WebKit engineer on Safari
    26.6.2 and STP 254. [WebKit bug 327697]
    Encoders normally write mono/stereo as family 0, so a mono loop *should* decode,
    but it is unverified. You would have to test it on real Safari builds.
- **AAC in MP4** decodes everywhere, but trimming its priming samples relies on the
  MP4 edit list. Firefox implemented that in v111; a commenter on that bug said
  Chromium had the same bug and Safari "gets it right". [Mozilla bug 1703812]
  Firefox notes that raw ADTS `.aac` "don't have encoder delay / padding info so we
  can't trim correctly". [Firefox test_decoderDelay.html]

## Encoder padding vs gapless looping

`AudioBufferSourceNode.loop = true` with default `loopStart`/`loopEnd` loops the whole
decoded buffer. Any priming silence at the start or padding at the end of the buffer
becomes an audible gap or click on every pass, so what matters is whether the decoder
trims those samples.

- **MP3** has no sample-exact framing. Encoders add delay at the start and pad the last
  frame; the LAME/Info tag records encoder delay and padding, and decoders add a fixed
  decoder delay (529 samples) that is not stored in the stream.
  - Firefox: `decodeAudioData` ignored the Info frame and delay/padding until Firefox
    83, which parses the LAME values and trims both ends. [Mozilla bug 1566389]
    Firefox's test suite asserts that a 0.5 s libmp3lame file decodes to exactly
    0.5 s. [Firefox test_decoderDelay.html]
  - Safari: `decodeAudioData` added ~52 ms of blank frames to a 0.5 s MP3 (audible when
    looping); the reporter stated "Chrome and Firefox properly parse those MP3 which
    results in a continuous audio stream when looping". Fixed in macOS Monterey (12).
    [WebKit bug 228215]
  - Conclusion: since these files have an Info/LAME tag, modern Chrome, Firefox (83+)
    and Safari (macOS 12+ era) should return a trimmed, gapless buffer.
- **Opus (Ogg)** is gapless by design: the header carries a `pre-skip` count of
  samples to decode and discard, and the final page's granule position tells the
  decoder how many trailing samples to keep. Granule positions are always counted at
  48 kHz. [RFC 7845 §4.3, §4.4, §5.1] WebM uses equivalent `CodecDelay` /
  `DiscardPadding` fields. Opus and WebM Opus files are both in Firefox's
  exact-duration test set. [Firefox test_decoderDelay.html]
- **AAC**: gapless only when the decoder honours the MP4 edit list (see above).

**Format-agnostic guard (recommended regardless of codec).** Once the buffer is
decoded, scan channel 0 from each end for the first and last sample whose absolute
value is above a small threshold (e.g. 1e-4). Set `src.loopStart`/`src.loopEnd` to
those times, and pick the random start offset inside that range. If the engine already
trimmed, the scan finds nothing and changes nothing. If it did not, the gap disappears.
This guards against older engines and a future codec swap. Leave the threshold small,
because these are noise beds without deliberate silence.

## Sensible bitrate for ambient noise

- Current MP3s average ~58 kbps mono. That is reasonable for MP3 at 24/32 kHz; going
  lower in MP3 starts to smear noise-like content (rain, surf) audibly.
- MDN's stereo "recommended minimum" figures (Opus 96 kbps, AAC 96 kbps, MP3 128 kbps
  at 48 kHz) are for music. [MDN audio codecs guide] Mono ambient beds need far less.
- Judgement, not from a cited source: Opus mono VBR at **32 kbps** is a safe target for
  rain/fire/surf, and 24 kbps is likely acceptable for the low-bandwidth fire/wave
  beds. Validate by listening on headphones. Estimated set size: ~2.25 MB at 32 kbps,
  ~1.7 MB at 24 kbps, vs 4.06 MB now (plus 33% if base64-inlined).

## Fallback strategy (only if Opus is adopted)

1. Ship each loop as `name.opus` (Ogg) or `name.webm` (Opus, mono, mapping family 0)
   **and** the current `name.mp3` as separate static files. Do not inline them.
2. `fetch` the Opus file and `decodeAudioData` it. On rejection or `null`-error
   callback (the Safari failure mode in WebKit bug 327697), fetch and decode the MP3.
   Do not gate on `canPlayType`: Safari has disagreed with `decodeAudioData` before
   (WebKit bugs 226922, 238546).
3. Apply the loop guard above to whichever buffer results.

## Sources

- Web Audio API spec, `decodeAudioData`: https://webaudio.github.io/web-audio-api/#dom-baseaudiocontext-decodeaudiodata
- MDN, `BaseAudioContext.decodeAudioData()`: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData
- MDN, Web audio codec guide: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs
- caniuse, Opus: https://caniuse.com/opus
- WebKit bug 226922 (Safari 15 breaks Web Audio WebM Opus): https://bugs.webkit.org/show_bug.cgi?id=226922
- WebKit bug 238546 (WebM Opus inconsistent in Safari 15.4, consistent by 17.4): https://bugs.webkit.org/show_bug.cgi?id=238546
- WebKit bug 327697 (decodeAudioData refuses Opus WebM except mapping family 0, 2026): https://bugs.webkit.org/show_bug.cgi?id=327697
- WebKit bug 228215 (MP3 decoder ignoring encoder delay/padding; fixed in macOS Monterey): https://bugs.webkit.org/show_bug.cgi?id=228215
- WebKit Features in Safari 18.4 (Ogg container for Opus/Vorbis): https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
- Mozilla bug 1566389 (decodeAudioData doesn't skip MP3 info frames; fixed Firefox 83): https://bugzilla.mozilla.org/show_bug.cgi?id=1566389
- Mozilla bug 1703812 (AAC edit-list trimming; fixed Firefox 111): https://bugzilla.mozilla.org/show_bug.cgi?id=1703812
- Firefox `test_decoderDelay.html`: https://searchfox.org/firefox-main/source/dom/media/webaudio/test/test_decoderDelay.html
- RFC 7845, Ogg Encapsulation for the Opus Audio Codec: https://www.rfc-editor.org/rfc/rfc7845

## Gaps

- Chromium's MP3 trimming was not traced to its source code. The evidence is the
  WebKit 228215 reporter's statement plus Chrome's use of FFmpeg, which reads LAME tags.
- Safari decoding of mono Opus (mapping family 0) via `decodeAudioData` was not
  tested on hardware.
