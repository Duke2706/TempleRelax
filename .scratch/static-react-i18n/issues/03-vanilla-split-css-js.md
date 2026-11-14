# Split CSS and JS out of index.html (vanilla)

Type: task
Status: resolved
Blocked by:

## Question

Step 1 of the user's plan, done in vanilla as the working reference: move the `<style>` block to `styles.css` and the `<script>` block to `app.js`, referenced from `index.html`. Behaviour must be unchanged (verify both Places, all three Weathers, sound on/off, a Thought released in each Place). The base64 audio may stay inside `app.js` for now.

## Answer

Done. `<style>` → `styles.css`, `<script>` → `app.js` (base64 audio still inside), `index.html` now 2 KB and references both at the original positions. Reassembling the three pieces reproduces the original file byte for byte. Checked in the browser over a local HTTP server: forest + Thought burned, rain, sound on, beach + bottle released, snow; no console errors.
