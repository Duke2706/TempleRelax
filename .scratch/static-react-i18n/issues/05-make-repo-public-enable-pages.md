# Make the repo public and enable GitHub Pages

Type: task
Status: open
Blocked by:

## Question

HITL: the owner changes repository visibility and Pages settings (an agent must not change account/repo settings). Checklist:
1. GitHub → Duke2706/TempleRelax → Settings → General → Danger Zone → Change visibility → Public.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
Record the resulting Pages URL in the answer.

## Comments

- 2026-11-14: Repo is public (API returns 200). Pages is not enabled yet (`/pages` returns 404): step 2 (Source: GitHub Actions) still pending; it can also be done right before "Deploy to GitHub Pages with Actions".
