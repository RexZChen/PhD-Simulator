# Contributing

Contributions are welcome — genuinely, including small ones.

This is a satirical game about doing a CS PhD. The most valuable contributions are usually not
code: they are **things that ring true**. If you did a PhD and something in here is wrong, or
something real is missing, that is worth an issue.

## Good first contributions

- **Content.** A new event, a chat line, an insider note about a program, an achievement. These
  live in `src/data/` and need no engine knowledge. See "Writing content" below.
- **Translation.** Fixes to the Chinese, or a new language. See "Adding a language".
- **Balance reports.** Run `npm run balance`, paste the output and the seed, and say what felt
  wrong. Numbers beat impressions, and impressions are still useful.
- **Bugs.** Especially anything where the game refuses an action without saying why.

## Getting set up

```bash
git clone https://github.com/RexZChen/PhD-Simulator.git
cd PhD-Simulator
npm install
npm run dev
```

Then, before opening a PR:

```bash
npm test          # engine tests, fast
npm run build     # must succeed
npm run test:e2e  # browser flows; needs Google Chrome installed
npm run balance   # only if you touched anything the simulation reads
```

CI runs the engine tests on every push, and the live site only deploys if they pass.

## The rules that actually matter

**1. No real people, institutions, companies or venues.** Everything is fictional or a parody
placeholder. This is not a style preference; it is the line that keeps the project defensible.
Do not write "MIT-like", do not name a city as a university's home, do not invent a quote from a
real person. Real city names are fine as travel settings and nothing more.

**2. Never call `Math.random()`.** Every draw goes through `random(s)`, `roll(s, p)`, `pick(s, arr)`
or `pickWeighted` from `src/engine/probability.js`, threaded off the run's seed. A run must
reproduce exactly from its seed, or the balance harness measures nothing. This includes UI code
that renders on every frame — see `boardHash` in `src/engine/jobsearch.js` for how to get a stable
shuffle without consuming randomness.

**3. Every player-visible string goes through `t()`.** If you concatenate two translated strings,
use `joined()` from `src/engine/state.js` — a plain template literal produces a string no catalog
knows, and it freezes in whatever language it was built in.

**4. Punch at systems, not people.** Funding gaps, review lotteries, immigration paperwork, the job
market. Not individuals, not identifiable groups, not the player. The endings deliberately refuse
to call anyone a failure; keep that.

**5. Match the register.** Dry, literary, deadpan, specific. Never zany. No emoji in prose, no
exclamation marks unless a character would really use one. The satire lands because it is true.

## Writing content

Events live in `src/data/events/`. The shape:

```js
{ id: 'unique_snake_case', title: 'A concrete noun phrase', category: 'life',
  scene: 'home', probability: .5, cooldown: 12,
  text: ['One telling.', 'A different telling of the same situation.'],
  choices: [ c('id', 'What you do', 'What it trades, in six words', { energy: -4, hope: 3 }) ] }
```

Give every choice a real trade-off; no choice should be strictly best. Available tokens are
`{advisor} {advisorFirst} {labmate} {labmateFirst} {peer} {peerLab} {school} {company} {project}
{venue} {name} {first}` — never invent one. Effect keys are the ones in `pillMeta` in
`src/ui/helpers.js`; `stress` is inverted, so a positive number means more stress, which is bad.

Two tests will catch most mistakes: every `award()` must resolve to a catalog entry, and every
achievement must have a Chinese description.

## Adding a language

English source strings are the keys. `src/i18n/zh/` is the worked example:

- `ui.js` — a flat map, for anything passed to `t()` as a literal.
- `events-*.js`, `misc.js` — catalogs keyed **by id**, for content translated in place. If a string
  reaches `t()` through a variable, it belongs here, not in `ui.js`. This is the single most common
  mistake, and the symptom is text that stays English while everything around it changes.

Register `applyLanguage` handling in `src/i18n/apply.js` and `src/i18n/index.js`.

## Pull requests

Small and focused beats large and comprehensive. Say what you changed and why; if it touches the
simulation, include before/after `npm run balance` output. If you are unsure whether an idea fits,
open an issue first — that is cheaper for both of us than a rejected PR.

By contributing you agree your work is released under the MIT licence in [LICENSE](LICENSE).
