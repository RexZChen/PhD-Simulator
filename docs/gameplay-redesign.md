# A desk you can play from

The problem was not just screen density. Progress depended on knowing which app held the next action, repeatedly drafting five points at a time, choosing a plan and then separately advancing time, and acknowledging a report after a queue of conversations. The redesign makes the ordinary loop an intention followed by consequences.

## The interaction

- **Now:** one immediate task, two or three contextual turn choices, the next dated milestone, and a compact result after every day, week, month, or season. A work turn names and selects its project and includes its writing session. Waiting notices stay small; a queued turn is shown above the advisor request that needs an answer.
- **Paper decisions:** send a ready draft, choose among open submission venues, answer reviewers, or recover from rejection directly on the desk. Approval, deadlines, costs, quality, and review randomness still apply.
- **Degree and health:** thesis direction, timeline negotiations, dissertation writing, defense scheduling, revisions, deposit, and treatment become visible when relevant.
- **Applications:** choose a statement approach, ask three real recommenders, then preview a balanced, ambitious, or smaller slate. Fees and late-letter scenes still happen. Program profiles, emails, and individual applications remain available.
- **Conversations:** ordinary reading has no countdown. Scheduled stories and urgent consequences take precedence over additional routine meeting dialogs. Exams and minigames retain their clocks.
- **Extra workspaces:** Research contains all manual plans and project tools; People contains advisor, internship, and letter conversations; Records contains the calendar, readiness, notes, pace, and longer monthly statements.

The satire still lives in the consequences: a request from someone who controls your funding, an approved paper that loses a review lottery, an insurance bill, and a defense that produces another list of work. The player spends less effort finding controls.

## Bugs found through play and longer runs

- Manuscripts in advisor review could still offer a writing/research month that accomplished nothing.
- Conference targeting stopped working after the first two years because future dates were filtered against an absolute month 24.
- A defense requiring major revisions set a truthy status that removed its scheduled retake from the milestone calendar.
- Enter could activate a global default instead of the focused button.
- Duplicate request notifications competed with the same request on the desk.
- Shortlist odds and application tabs overflowed or broke into single letters on narrow screens.
- Revisions and advisor requests advertised actions the player did not have enough energy to perform.
- December coursework used a summer-only explanation, and winter scene art always said December.
- Week and day turns had no visible result; their old monthly statement could remain on screen unchanged. Receipts now include writing and scene consequences, survive a save during a scene, and retranslate their activity label.
- A ready paper waiting for a deadline could obscure another draft that needed an advisor read. The actionable draft now comes first and is named on the desk.
- Different projects could receive identical titles. New titles use the existing pool without repeats, then numbered variants, with exactly one random draw per project.
- Week/day manual plans still advertised work with no editable manuscript. Those plans are disabled while recovery and other useful activities remain available.
- Switching to week pace marked day pace as unavailable for the entire month. Explicitly choosing day pace is available again; automatic deadline pacing still honors the player's decision to leave it.
- On phones, queued-plan feedback could fall below the visible area and a passive waiting card displaced the turn choices. The queue is now visible at the top, waiting is a short notice, and the header takes less room. Desktop choices fill the row even when only two are available.

## Balance sample

`node scripts/balance.mjs 8`, eight seeds for each existing policy. Initial redesign comparison: `5ac2abc` to `65f020a`. The harness now reselects an available plan if sending a manuscript invalidated its earlier selection. This reflects the same disabled action presented to players.

| Policy | Before | After |
| --- | --- | --- |
| Diligent | 3 unplaced PhDs, 1 quant PhD, 2 undeposited, 2 ABD | 4 product engineering PhDs, 2 unplaced PhDs, 1 ABD, 1 fired |
| Lazy | 6 fired, 1 unplaced PhD, 1 master's exit | 6 fired, 1 quant PhD, 1 unplaced PhD |
| Grinder | 4 fired, 2 product engineering PhDs, 1 perpetual, 1 posthumous | 5 fired, 3 posthumous |

This is a regression sample, not an estimate of population win rates. Changing event scheduling changes the seeded random stream. No admission, publication, or examination probability formula was changed.

The subsequent refinement compares `65f020a` with the current behavior using the same eight seeds:

| Policy | Before refinement | After refinement |
| --- | --- | --- |
| Diligent | 4 product engineering PhDs, 2 unplaced PhDs, 1 ABD, 1 fired | 3 product engineering PhDs, 1 unplaced PhD, 2 ABD, 2 perpetual |
| Lazy | 6 fired, 1 quant PhD, 1 unplaced PhD | 6 fired, 1 unplaced PhD, 1 master's exit |
| Grinder | 5 fired, 3 posthumous | 5 fired, 3 posthumous |

Disabling ineffective deadline work changes which valid activity these manual-plan policies choose and therefore their subsequent events. The small sample does not establish an improved graduation rate; the refinement is about feedback and reachable actions. The separate main-desk probe below checks the intended simple interaction directly.

## Verification

[Desktop screenshot](screens/desktop.png) · [Phone screenshot](screens/mobile-desk.png)

- `npm test`: 151 passing engine and workflow tests, including submission gates, atomic application costs, receipts at all four time scales, saving mid-scene, language switching, competing paper tasks, and the defense retake regression.
- `npm run test:e2e`: 58 passing browser tests, including visible phone receipts, reload persistence, queued request handling, a side draft behind a waiting main paper, exams, and minigames.
- `npm run i18n`: 0 missing runtime translations and 0 missing UI literals; 11 of 12 sample runs enrolled and reached graduation, covering 820 planning turns.
- `npm run build`: succeeds. The existing large-bundle advisory remains.
- Initial manual browser play followed the applicant's existing run from December through May, including writing, advisor review, submission, a new project, advisor requests, money, and story choices. The refinement revisited the December save at week and day pace: writing, an advisor interruption, sending the draft, resting, and milestone preparation. Desktop and phone screenshots were inspected, alongside automated checks at 320px with the largest text setting.
- An additional eight-seed engine probe chose the first enabled immediate desk action and otherwise the suggested time choice. All eight reached graduation in months 55–64, with 4–7 accepted papers, without the extra workspaces or refused actions. It used the existing harness for admission setup, story decisions, and simulated exam performance; it is a navigation/reachability check, not eight human playthroughs.
