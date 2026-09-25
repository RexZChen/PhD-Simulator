# A desk you can play from

The problem was not just screen density. Progress depended on knowing which app held the next action, repeatedly drafting five points at a time, choosing a plan and then separately advancing time, and acknowledging a report after a queue of conversations. The redesign makes the ordinary loop an intention followed by consequences.

## The interaction

- **Now:** one immediate task, two or three contextual turn choices, the next dated milestone, and an inline statement of the last completed period. A work turn selects an editable project and includes its writing session.
- **Paper decisions:** send a ready draft, choose among open submission venues, answer reviewers, or recover from rejection directly on the desk. Approval, deadlines, costs, quality, and review randomness still apply.
- **Degree and health:** thesis direction, timeline negotiations, dissertation writing, defense scheduling, revisions, deposit, and treatment become visible when relevant.
- **Applications:** choose a statement approach, ask three real recommenders, then preview a balanced, ambitious, or smaller slate. Fees and late-letter scenes still happen. Program profiles, emails, and individual applications remain available.
- **Conversations:** ordinary reading has no countdown. Scheduled stories and urgent consequences take precedence over additional routine meeting dialogs. Exams and minigames retain their clocks.
- **Extra workspaces:** Research contains all manual plans and project tools; People contains advisor, internship, and letter conversations; Records contains the calendar, readiness, notes, and pace.

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

## Balance sample

`node scripts/balance.mjs 8`, eight seeds for each existing policy. Before: `5ac2abc`; after: this redesign. The harness now reselects an available plan if sending a manuscript invalidated its earlier selection. This reflects the same disabled action presented to players.

| Policy | Before | After |
| --- | --- | --- |
| Diligent | 3 unplaced PhDs, 1 quant PhD, 2 undeposited, 2 ABD | 4 product engineering PhDs, 2 unplaced PhDs, 1 ABD, 1 fired |
| Lazy | 6 fired, 1 unplaced PhD, 1 master's exit | 6 fired, 1 quant PhD, 1 unplaced PhD |
| Grinder | 4 fired, 2 product engineering PhDs, 1 perpetual, 1 posthumous | 5 fired, 3 posthumous |

This is a regression sample, not an estimate of population win rates. Changing event scheduling changes the seeded random stream. No admission, publication, or examination probability formula was changed.

## Verification

[Desktop screenshot](screens/desktop.png) · [Phone screenshot](screens/mobile-desk.png)

- `npm test`: 146 passing engine and workflow tests, including submission gates, atomic application costs, all four time scales, and the defense retake regression.
- `npm run test:e2e`: 55 passing browser tests. The exam, deadline, and redesigned desk cases were also rerun after the final calendar fix.
- `npm run i18n`: 0 missing runtime translations and 0 missing UI literals; 11 of 12 sample runs enrolled and reached graduation, covering 819 planning turns.
- `npm run build`: succeeds. The existing large-bundle advisory remains.
- Manual browser play followed the applicant's existing run from December through May, including writing, advisor review, submission, a new project, advisor requests, money, and story choices. Desktop and phone screenshots were inspected, alongside automated checks at 320px with the largest text setting.
- An additional eight-seed engine probe chose the first enabled immediate desk action and otherwise the suggested time choice. All eight reached graduation in months 55–59, without the extra workspaces or refused actions. It used the existing harness for admission setup, story decisions, and simulated exam performance; it is a navigation/reachability check, not eight human playthroughs.
