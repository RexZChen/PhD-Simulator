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

No framework, no build step to learn: vanilla ES modules served by Vite. `npm run dev` opens on
127.0.0.1 and reloads on save.

## The three commands that gate every change

Run all three before opening a PR. They are not redundant; each catches something the others
cannot see.

```bash
npm test          # 118 engine tests, ~12s. Rules, catalogs, endings, saves.
npm run test:e2e  # 45 browser tests. Needs Google Chrome; starts its own dev server on :4173.
npm run i18n      # translation audit. Both counts it prints must be 0.
```

**`npm run reach`** is the one that catches the failure this project keeps having. A unit test asks
whether a function works; this plays whole runs and asks whether a player will ever call it. It
reports every event, achievement and ending that nobody reached, and the state of the systems that
are meant to be rare but real. A name on the "never reached" list is not automatically a bug — some
content is gated on a choice the scripted styles never make — but it is always a question, and the
answer should be a sentence you can say out loud. It is how we found that the whole visa storyline
fired zero times across twelve international runs, and that the patent process could never reach a
decision because it outlasts a PhD.

**`npm test`** is `node --test` over `tests/game.test.js`. It runs the engine headlessly — no DOM,
no rendering — and asserts on outcomes: that a diligent player can graduate, that the twelve
endings are reachable, that every achievement the engine awards exists in the catalog. It is the
one CI runs, and the live site does not deploy if it fails.

**`npm run test:e2e`** is Playwright against the real page. It is the only thing that catches a
click that goes nowhere, a window that will not close, or a minigame that dies on re-render.
Playwright is pinned to the `chrome` channel, so you need Google Chrome installed, not just
Chromium.

**`npm run i18n`** plays twelve real runs with the language set to Chinese and records every string
`t()` could not translate, then statically sweeps every `t('literal')` in `src/ui` and looks each
one up. It prints two numbers and **both must be 0**:

```
untranslated strings reached in 12 played run(s): 0
untranslated t() literals in src/ui (1489 scanned): 0
```

Two more, situational:

```bash
npm run build     # must succeed; this is what deploys
npm run balance   # only if you touched anything the simulation reads
```

## How it is put together

Ten lines, and then you can read the rest:

- **`src/data/`** is content: events, schools, venues, employers, achievements. Plain data, no logic.
- **`src/engine/`** is rules: pure functions over a run object. No DOM, no `document`, no timers.
- **`src/ui/`** is rendering: functions that return HTML strings. No rules, no state mutation.
- **Randomness is seeded.** Every draw goes through `random(s)`, `roll(s, p)`, `pick(s, arr)`,
  `shuffle` or `pickWeighted` from `src/engine/probability.js`, threaded off the run's seed and
  advancing it. A run reproduces exactly from its seed, which is what makes `npm run balance` and
  the i18n audit measurements rather than anecdotes. **`Math.random()` is forbidden in engine code.**
- **Rendering is one `innerHTML` assignment.** `render()` in `src/main.js` rebuilds the entire shell
  on every state change and puts the scroll positions back. There is no diffing and no component
  state; if you want the screen to change, change the run and call `render()`.
- **Which is why real-time things own their own DOM.** The lecture (`src/ui/lecture.js`), the viva
  (`src/ui/viva.js`) and the whiteboard (`src/ui/apps/whiteboard.js`) keep their state in module
  scope, paint by mutating individual nodes, and are started and stopped by `sync*()` helpers that
  deliberately do nothing when the game is already running one. A full re-render must not restart
  them. Their animation loops also run off their own seeded generator, so ticking never consumes the
  run's randomness.

## The rules that actually matter

**1. No real people, institutions, companies or venues.** Everything is fictional or a parody
placeholder. This is not a style preference; it is the line that keeps the project defensible.
Do not write "MIT-like", do not name a city as a university's home, do not invent a quote from a
real person. Real city names are fine as travel settings and nothing more.

**2. Never call `Math.random()`.** See above. This includes UI code that renders on every frame —
see `boardHash` in `src/engine/jobsearch.js` for how to get a stable shuffle without consuming
randomness.

**3. Every player-visible string goes through `t()`.** If you concatenate two translated strings,
use `joined()` from `src/engine/state.js` — a plain template literal produces a string no catalog
knows, and it freezes in whatever language it was built in.

**4. Punch at systems, not people.** Funding gaps, review lotteries, immigration paperwork, the job
market. Not individuals, not identifiable groups, not the player. The endings deliberately refuse
to call anyone a failure; keep that.

**5. Match the register.** See "Tone" below.

## The i18n rule, which is the one that bites

**English source strings are the translation keys.** There is no `welcome.title`; the key for
"Seed {seed}" is the literal text `Seed {seed}`.

The consequence catches everybody once: **editing an English string silently deletes its Chinese
translation.** Nothing throws. The build succeeds. The tests pass. The line just quietly reverts to
English for every Chinese player, and you do not find out until someone opens an issue.

So:

- Changing an English string means changing the matching key in `src/i18n/zh/` in the same commit.
- Adding content means adding the Chinese in the same change. Not a follow-up PR — the same change.
- Then run `npm run i18n` and check it prints 0 twice.

Where the Chinese lives:

- **`src/i18n/zh/ui.js`** — a flat map, English → Chinese, for anything passed to `t()` as a literal.
- **`src/i18n/zh/events-*.js`, `misc.js`, and friends** — catalogs keyed **by id**, for content
  translated in place. If a string reaches `t()` through a variable, it belongs here, not in
  `ui.js`. This is the single most common mistake, and the symptom is text that stays English while
  everything around it changes.

`src/i18n/zh/index.js` is where the pieces are assembled; a new file has to be imported there.
If you do not read Chinese, say so in the PR and leave the strings untranslated — someone will
take them. An honest gap is fine; a silent regression is not.

## Writing content

### Adding an event

Events live in `src/data/events/*.js`, grouped loosely by subject. Each file default-exports an
array. The shape:

```js
{ id: 'unique_snake_case', title: 'A concrete noun phrase', category: 'advisor',
  scene: 'office', speaker: 'advisor', probability: .4, cooldown: 5, once: true,
  conditions: { minMonth: 26, maxMonth: 52, minProgress: 55 },
  text: ['One telling.', 'A different telling of the same situation.'],
  choices: [
    c('agree', 'What you do', 'What it trades, in six words', { energy: -10, stress: 8 },
      { achievement: 'experiment', personality: 'peoplePleaser' }),
    c('push', 'The other thing you could do', 'Confidence check; a boundary', {},
      { check: { stat: 'confidence', difficulty: 55 },
        successEffects: { trust: 6 }, failureEffects: { conflict: 8 },
        successText: '“…Fine. But the next one gets the full treatment.”',
        failureText: '“I don’t think you understand how competitive this venue is.” You do.' }) ] }
```

`c(id, text, hint, effects, extra)` is a small helper defined at the top of each events file.

Four things that are easy to get wrong:

1. **Register it.** A new file must be imported *and* spread into the `events` array in
   `src/data/events.js`. An unregistered file is dead content that nothing will tell you about.
2. **Gate it to the right months.** `conditions: { minMonth, maxMonth }` is what stops a
   job-market event firing in year one and a first-week event firing in year six. Also available:
   `minProgress`, `maxFunding`, `minStress`, `minToxicity`, `archetype`, `mutator`, `household`,
   `fear`, `whyHere` and others — read `src/engine/events.js` for the full set, and do not invent
   a key, because an unrecognised condition is simply ignored and your event fires everywhere.
3. **Give every choice a real trade-off.** No choice should be strictly best. `stress` is inverted:
   a positive number means more stress, which is bad. Effect keys are the ones in `pillMeta` in
   `src/ui/helpers.js`.
4. **Use only the tokens that exist:** `{advisor} {advisorFirst} {labmate} {labmateFirst} {peer}
   {peerLab} {school} {company} {project} {venue} {name} {first}`. Never invent one; it will render
   as literal braces.

### Adding an achievement

Two unit tests exist precisely to catch the two ways this goes wrong, and both will fail loudly:

- Every `award('id')` in the engine must resolve to an entry in `achievements` in
  `src/data/catalog.js`, or the player unlocks a blank.
- Every catalog entry must have a Chinese `name` and `desc`, or the unlock arrives half in English.

So a new achievement is three edits, not one: the `award()` call, the catalog entry, the
translation.

## Adding a language

`src/i18n/zh/` is the worked example — copy its shape. `src/i18n/index.js` explains the two
mechanisms (flat lookup for `t()` literals, by-id catalogs for content translated in place, plus
the provenance buffer that lets stored mail and chat re-translate instead of freezing). Register
`applyLanguage` handling in `src/i18n/apply.js` and add the dictionary in `src/i18n/index.js`.

## Tone

The register is dry, specific, unsentimental dark comedy. It works like this:

- **Concrete details, not jokes.** A number, an hour, a sentence someone actually said. The comedy
  is in the accuracy.
- **Never explain why it is funny,** never add a punchline, never land on a moral.
- **Never sentimental, never editorialising about academia.** The game does not have opinions about
  whether a PhD is worth it. It shows you a Tuesday.
- **No emoji in prose. No exclamation marks** unless a character would really use one.

One real line, from the event that fires when you pass your quals
(`src/data/events/late.js`):

> A candidate, officially. The department changes one field in a database. Your rent does not change.

Three sentences, no joke in any of them, and nobody is told how to feel. That is the target.

## A note on the satire

Every person, university, company, conference, journal and funding agency in this game is
fictional. Resemblances are structural, not personal: the systems are real, the names are not.
Contributions must keep it that way — see rule 1.

## Pull requests

Small and focused beats large and comprehensive. Say what you changed and why; if it touches the
simulation, include before/after `npm run balance` output. If you are unsure whether an idea fits,
open an issue first — that is cheaper for both of us than a rejected PR.

By contributing you agree your work is released under the MIT licence in [LICENSE](LICENSE).
