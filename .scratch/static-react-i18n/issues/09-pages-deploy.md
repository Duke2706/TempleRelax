# Deploy to GitHub Pages with Actions

Type: task
Status: resolved
Blocked by: 05, 07

## Question

Add a GitHub Actions workflow that builds the Vite site and deploys it to Pages on push to `main`. Verify the published URL loads, audio assets resolve under the Pages base path, and the language selector works.

## Answer

Done. `.github/workflows/deploy.yml` (checkout v7, setup-node v7 on Node 24, `npm ci`, `npm test`, `npm run build`, configure-pages v6, upload-pages-artifact v5, deploy-pages v5) runs on push to `main` and by hand. `main` was fast-forwarded to the feature branch (d01a1e2); first run https://github.com/Duke2706/TempleRelax/actions/runs/43649814117 succeeded.

Checked live at https://duke2706.github.io/TempleRelax/: loads in Spanish from the browser language, audio resolves under the `/TempleRelax/` base (fire, crack, wave: 200), switching to 한국어 updates `<html lang>`, title and copy; no console errors. Note: the English chunk always loads too, as i18next's fallback language.
