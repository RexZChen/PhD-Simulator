## What this changes

<!-- One or two sentences. If it fixes an issue, say "Fixes #N". -->

## Why

<!-- What was wrong, or what was missing. -->

## Checks

- [ ] `npm test` passes
- [ ] `npm run test:e2e` passes, or does not apply
- [ ] `npm run i18n` prints 0 for both counts
- [ ] `npm run build` succeeds
- [ ] `npm run balance` before/after included, or does not apply

## The rules

- [ ] No real people, institutions, companies or venues
- [ ] No `Math.random()` — randomness goes through `random(s)` / `roll(s, p)` / `pick(s, arr)`
- [ ] Player-visible strings go through `t()`, and concatenations through `joined()`
- [ ] Any English string I edited had its `src/i18n/zh/` key updated to match
- [ ] New content is translated, or listed here as needing translation
