# Extract copy to i18n files and add the language selector

Type: task
Status: open
Blocked by: 01, 07

## Question

Steps 3–4: move every user-visible string (HTML, aria-labels, notes arrays, counters, title) into locale files in the chosen format; Korean is the source, add es and en translations. Add a language selector and locale resolution (saved choice → browser language ko/es/en → en), updating `<html lang>` and `<title>`. Vitest: locale resolution cases and key parity across the three locales.
