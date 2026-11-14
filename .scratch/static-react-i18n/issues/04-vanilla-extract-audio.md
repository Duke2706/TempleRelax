# Extract embedded audio to assets (vanilla)

Type: task
Status: open
Blocked by: 03

## Question

Step 2 in vanilla: decode the four base64 MP3s into `assets/audio/{fire,crack,rain,wave}.mp3` and load them with `fetch` + `decodeAudioData` instead of the data URIs, keeping the lazy per-layer decoding. Extract as-is (format decision is "Keep MP3 or re-encode the ambient loops?"). Verify sound in both Places and with rain.
