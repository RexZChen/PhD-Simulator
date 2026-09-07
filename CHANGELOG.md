# Changelog

Notable changes to Academic OS. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html), where a MINOR bump means
new systems or content and a PATCH means fixes and balance.

## [1.9.0] — 2026-09-07

The calendar interrupts you, and the month can be read before it is read.

### Added
- **Unscheduled meetings that actually cost the turn.** Every other event in this game happens
  around your decision; this one happens *to* it. It is raised after you have chosen what the month
  goes to and before the turn resolves, and going costs **42% of the output you planned** (62% in a
  crunch week). Saying you have four days to a deadline recovers most of it when it is heard, and is
  heard as a complaint when it is not. Declining is always available and never free. Five kinds:
  "can you come by?" with no agenda, an idea about your paper four days out, a collaborator whose
  deadline is not yours, mandatory training about a chemical you will never meet, and a labmate in a
  stairwell. About six a run, likelier from a managerial advisor and likelier in a crunch.
- **The interrupt is shown as a calendar, not described as one** — your day in nine blocks, with the
  meeting dropped into the middle of it and the hours it eats shaded red. You can see what it costs
  before you read what it is.
- **The month at a glance.** The monthly report is the screen a player sees seventy-two times a run
  and it was three tables and a wall of prose. It now opens with a face for how the month went, four
  bars that animate from where each number was to where it is, and the month's events as category
  icons. The prose is still underneath; it is no longer the only way in.
- **The advisor's mood is a face.** Their mode is referenced on nearly every screen and was a text
  label; it now has an expression, on the manager card and in the LabChat header.
- 1 achievement, for 104.

### Fixed
- The interrupt initially fired ~10 times a run, which at 42% of a turn each cost four turns of
  output over a run and showed up as diligent players defending and never depositing (6 of 40).
  Tuned to about six a run; `undeposited` back to 1.

## [1.8.0] — 2026-09-07

Two more storylines, and a questionnaire whose optional half decides which one you get.

### Added
- **The year the money went.** Rare, and it happens to somebody in every cohort. The renewal does
  not come through, and the department keeps you whole by teaching you out of a different budget —
  the package is intact, the tuition waiver is intact, the stipend arrives on the same day of the
  month. You are also teaching two sections and grading for two hundred and forty people for two
  semesters, and your research does approximately nothing for a year, and nobody involved has done
  anything wrong. Four beats, and it can extend for a second year if the money does not come back.
  Gated on the advisor's funding: ~19% of runs under a nearly broke advisor, 3% under a marginal
  one, and impossible above 44.
- **An optional half to the applicant questionnaire.** Five fields, collapsed by default, every one
  answerable with "rather not say": why you are actually doing this, who else is in your life, first
  in your family, what you are most afraid of, and what would actually make you leave. They do not
  make the run easier or harder — they decide which conversations you end up in. Seven events exist
  only for a player who answered: the question you came here with and have never worked on, the
  person you were proving it to, two cities, a nursery that closes at six, the call from home, the
  two a.m. certainty that you have been faking it, and the line you drew before you started.
- 2 achievements, for 103.

### Fixed
- **`roll()` floors its chance at 3% and ceilings it at 97%**, so it cannot express a rare event at
  all. A funding collapse computed at "impossible" was firing in a quarter of runs, because a check
  every six months at an enforced 3% floor compounds. Rare things now compare against `random()`
  directly, and the zero case is guarded explicitly rather than passed to `roll`.

## [1.7.0] — 2026-09-07

Storylines rather than events: arcs that run for years, one decision at a time.

### Added
- **The spinout, in six beats.** It starts only if the work justifies it — a real result, published,
  with novelty behind it. Technology Transfer emails. Your advisor raises commercialising, lightly,
  at the end of a meeting about something else: board seat, a day a month, and they would obviously
  stay involved. Then the cap table, on a whiteboard, with everybody smiling: the university takes a
  slice because you assigned it on day one in a stack of enrolment forms, your advisor takes a slice
  roughly the size of the one you kept, and yours is the biggest single number and smaller than the
  three of them together. Nobody is lying. Asking, out loud, in the room, what your advisor's slice
  is *for* is the highest-leverage move in the arc and almost nobody makes it. Ends in a new ending.
- **The patent, as a clock rather than an event.** Three back-and-forth meetings with the innovation
  office, who have read the abstract and ask you to describe your own diagram out loud. Then about a
  year to a filing — which appears on your Google Scholar profile, indexed next to your papers as
  though it were one. Then the first office action, which is a rejection of every claim, which is
  completely normal and which nobody warns a first-time inventor about. Then months of argument, and
  a grant or an abandonment. Two and a half years end to end. The inventors' share is 70/30 to the
  senior inventor, in accordance with a policy set by a committee in 1994 and not subject to appeal.
- **Sisyphus, closed.** Every acceptance now produces congratulations in writing (email and chat,
  unambiguously kind) and out loud at the next group meeting — where the compliment is real, is
  deserved, and is simultaneously doing a second job on everybody else in the room. Then, a specific
  number of weeks later, the question: "so what are you actually curious about for the next one?"
  The interval is the design: an Empire Builder asks after one month, an Academic Parent after
  three, and nobody ever names a length of rest. Measured: it reaches 89% of runs.
- 4 achievements, for 100.

### Fixed
- **A scheduled beat that was not eligible on its due week was discarded permanently**, so any
  multi-beat arc could break silently and forever — a follow-up landing during a trip, a crunch, or
  a month when its own conditions happened not to hold was simply lost. Beats retry for eight weeks
  before giving up.

## [1.6.0] — 2026-09-07

Every school is a different place, every interview is a different conversation, and the door you
knock on has somebody different behind it.

### Added
- **32 schools, up from 22.** The archetypes American CS was missing: a tiny elite institute with an
  honour code, a land-grant school where football has a bigger budget than your college, a desert
  campus an hour from a national lab, the cheapest rent in the rankings under ninety inches of snow,
  a nine-campus city university where the commute *is* the degree, a school with a chapel schedule,
  one behind a badge reader, one at eight thousand feet that empties on a powder day, and one nine
  time zones from your co-authors. Five new crests to draw them.
- **Campus culture, for all 32.** Mascot, yell, campus lore, the town, what people there actually
  complain about, and — the one that matters — what six years there will have made you: "you park by
  shade rather than by distance, permanently, in every city." Two programs with the same prestige
  number are no longer the same six years, which is the thing an applicant is really trying to read.
- **Interviews are drawn per advisor, from 15 questions instead of a fixed 3.** Who is asking is the
  entire content of an interview, and it was identical at every school. A Tenured Warlord asks the
  sweaty ones — the gap in your record, the other candidate who already has a paper, how you feel
  about weekends. Some questions are gated on toxicity because they are asked by people who do not
  think they are being anything other than practical: whether you are planning a family, whether you
  are coming to this "a little later than most." Answering the weekend question with a boundary is
  the single most informative thing you can do, and what happens next tells you what the six years
  will be. Measured: 38 distinct interviews out of 40.
- **Twenty-eight things behind the advisor's door**, up from eleven — and the door is now drawn and
  animated, with a stamp: COME IN, MAKE IT QUICK, NOT NOW, AWAY. It is the most-repeated five seconds
  of a deadline week and it was one line of grey text.
- **Achievements land on screen.** They were a line in a log nobody re-reads.
- 400 strings of new prose in Simplified Chinese.

### Fixed
- The interview catalog was translated by array index, which broke silently the moment the pool grew.
  Keyed by id now, falling back to index.
- Two `reveal` keys pointed at advisor traits that had no hint lines, which put `undefined` into
  `advisor.known` and made the save fail its own round-trip test. Added the lines; the array now
  refuses to hold nothing.
- The school list is prestige-ordered by construction and the ten new entries broke that, which
  quietly made the balance harness apply to a much harder set. Sorted.

## [1.5.0] — 2026-09-07

The second organisation chart: the people you meet who are not in your lab.

### Added
- **Contacts are people now, not a number.** `connections` was an integer. A conference produces one
  to three named people with a face, an institution and an opinion of you; a citation occasionally
  arrives with the person attached, which is the valuable half. They live in LabChat under "Outside
  the lab", each with their own card.
- **Four things you can do with a person.** Say something (cheap, and the whole system runs on it).
  Ask for a collaboration. Ask a professor for a letter — outside the lab is worth more than inside
  it, and a lukewarm yes is the classic way to be hurt. Ask for an introduction, which spends *their*
  credit rather than yours and therefore needs real standing.
- **Collaborations are a real trade.** Three sizes, and the big one costs 26 energy, 22 progress and
  8 draft *of your own project*. One open task at a time across everyone, because you cannot owe four
  people a month each — so the question is always whose work you are doing instead of your own. Miss
  the due month and their regard drops hard; deliver the huge one and there is a thing with both your
  names on it. Measured over 120 runs, a player who takes on collaborations reaches ABD about five
  times more often in forty seeds. That is the cost, and it is meant to be felt.
- **They drift.** Regard decays without contact and below a floor they simply stop replying — no
  falling-out, no explanation, an inbox that reordered itself. Talking holds a relationship steady
  and cannot build one past about 73; only doing something for them gets you into the range where
  they will agree to something big. People who faded occasionally come back.
- 6 achievements, for 92. 93 strings of new prose in Simplified Chinese.

### Fixed
- Talking to a contact used to hand out academic capital and hope every month per person, which over
  a six-year run with four contacts was an enormous free faucet. The value of knowing someone is what
  it unlocks, not a drip for clicking on them.

## [1.4.0] — 2026-09-07

Two minigames, and one of them replaces a dice roll on the three most consequential days of a PhD.

### Added
- **Room 214.** The prelim, the proposal and the defense used to be one click and a roll. Now four
  examiners ask you six questions with eleven seconds each, and the mechanic is the lesson: an oral
  exam tests whether you know the *edge* of what you know. Conceding — "I do not know, and here is
  how I would find out" — is safe on the field, the method and the motivation, and is the one thing
  the room cannot forgive on your own chapter. Answering is the only move that rolls, so the risk
  lives in exactly one place. Composure carries between questions, which is unfair and accurate.
  19 questions across the three milestones. The room shifts the odds by at most ±0.2 and never
  replaces them, because six years of record should still outweigh one afternoon.
- **04:12.** The job died. Four logs, one reservation that does not reset between them, and one line
  in each that is actually the problem — never the one that raised, and never the last one. Clicking
  the error message costs you five seconds, which is the correct punishment. Every stage is a real
  failure mode: `$USER` unset on the compute nodes, a gitignored config that silently did not
  override, `grad_norm=inf` one step before the loss went to nan, and a relative output path that
  the scheduler wrote into its own spool and then deleted. Visual search under a dying clock —
  a mechanic none of the other four use.
- 4 achievements, for 86: four-for-four on the logs, debugging without once clicking the error,
  conceding three questions and never being caught, and holding the room for all six.
- 159 strings of new prose in Simplified Chinese. The log lines stay in English, because they are
  machine output and translating a stack trace would be a lie.

## [1.3.0] — 2026-09-07

The run can now end in ways you did not choose, the body is no longer optional, and being here on
paper is its own game running underneath the one about research.

### Added
- **Six endings nobody plans for.** Called home to run the family firm (if you arrived with money);
  a medical withdrawal processed while you are still on the ward; a higher level of care, six weeks,
  a window that opens four inches; the seventh-year form that nobody has ever been refused; removal
  from the country with thirty days and nine used; and the one below the ambulance, for a player who
  signed themselves out. Each is written in the same register as the rest: the system is the absurd
  thing, the person never is.
- **Sustained neglect is now modelled.** Not one bad month — the count of months below 32 health and
  above 72 stress, which is what actually gets people. Measured across 120 runs the grinder reaches
  those endings in about 17% of them and is still mostly fired; diligent never sees them.
- **Being here on paper — 10 events for international players.** Two polite people in the corridor
  and the phrase "national interests," where the wording you choose is the mechanic. A checkpoint on
  a road you take every day. A status record terminated by reason code 05, "OTHER," at 4:52 p.m. on
  a Friday. Secondary inspection with your laptop. 214(b), and your parents watching a defense that
  will not be recorded. An export-control category with a nationality field. And sixty days that are
  not sixty working days.
- **Your advisor can leave before you do — 5 events.** Tenure denied, emeritus in the spring, a
  company you have heard of, a better department in August, and an email that goes out at 7:40 a.m.
  Each has a real move on the other side: follow them, race their clock, inherit the unfinished lab,
  or start the relationship over with somebody new.
- **23 achievements**, for 82 in all, and 11 more endings, for 23.
- **Ten advisor questions that only exist because of your situation** — after a crisis, after a
  rejection, when they have gone quiet, when the project is two papers pretending to be one, when
  the paperwork needs a signature only they can give. The ask list was eleven items for six years;
  across a run it now takes 152 distinct shapes and ranges from 11 to 20 entries.
- `npm run i18n` — plays real runs with the language set and prints every string that fell through
  to English. It is at zero.

### Fixed
- **Health crises never once reached a player.** `openCrisis` set the stage and `beginTurn` then
  overwrote it with `plan`, and the CRISIS action sat below the "stage must be plan" guard, so the
  whole subsystem — three crises, three moves, the advisor asking about the draft afterwards — was
  unreachable in every run ever played. An open crisis is now a gate on the turn.
- **Forced events were a hand-maintained list of three ids**, so every urgent event added since was
  silently left out. Derived from the data now.
- **The desktop got brighter as you got worse.** Stress and health both set `filter` on `.desktop`
  at equal specificity; `filter` does not compose, so the later rule won outright and health's tint
  is the milder one. Composed once, and the result is monotonic.
- **The monthly report's baseline was taken after the month-start pass**, so the missed-deadline
  penalty, the standing update and the entire stipend ledger appeared in no report at all — three
  months of them at season pace.
- **The plan list did not fit.** At 1440x900 the fieldset was 946px in a 775px scroller: four of
  eight options visible, and Rest — the option the balance punishes you for never taking — 411px
  below the fold. One row per option now, description kept for the one you are weighing: 48px a row,
  all eight on screen with the Continue button.
- **The vitals vanished below 1120px** with nothing in their place, so you chose a plan unable to
  see what it would cost. A compact copy now lives in the status bar at those widths.
- **Money pills saturated at $15**, so a $250 supplement and a $2,200 internship read identically.
- 131 strings, 5 effect-pill labels, 23 events and 6 endings translated into Simplified Chinese.

## [1.2.0] — 2026-09-06

Written against the author's stated design goals, which are now the acceptance criteria: a PhD is
hard to get into; a junior must be *seen* by their PI; senior milestones are negotiated; a PI job
right after graduation is almost impossible; the system — not the advisor — is the antagonist.

### Added
- **Funding, and the ace it buys.** A record of money you brought in or helped bring in, its own CV
  section, and a market weight that is enormous on an academic search and zero in industry: a
  funded candidate's odds at the most reachable tenure-track job go from 15.3% to 24.6% per
  application, while product engineering and quant do not move at all.
- **Who gets asked.** A mediocre student is never invited to help write a grant — the invitation is
  itself the recognition, and the bar rises with the money at stake. And even heroic help moves a
  large proposal from 17% to 21%: the base rate is the base rate.
- 28 funding events (budget justifications, broader impacts, the panel summary five months later,
  the rare award) and 9 fictional funding bodies.
- **The advisor's own cage** — 24 scenes. Every scene that showed an advisor being squeezed was
  gated on their having LOW funding, and the archetype table anti-correlates money with warmth, so
  the Empire Builder could fire *none* of them and the Tenured Warlord almost none. The two
  archetypes that read as villains were the two the game structurally prevented from having a
  motive. Now every archetype can show one, and a well-funded advisor is not unsqueezed but
  squeezed differently: eleven salaries on grants with different end dates, a subfield that moved,
  a keynote that stopped coming, a former student now more cited than they are.
- **A career clock.** Every advisor has a stage — pre-tenure, newly tenured, mid-career, late —
  weighted by archetype. The game's clearest statement of its own thesis ("They do not say 'or
  else.' The office says it for them") needed a 5% mutator to be reachable; it is now a property of
  who your advisor is.
- The twelve cutting messages a harsh advisor sends were four cardboard lines that said nothing.
  They now carry a visible trace of their cause, plus six "thaw" lines — the same person, tired
  enough to be honest for one message.

### Changed
- **Getting in is no longer a formality.** 98% of applicants were admitted with 3.4 offers each;
  the most selective programme admitted 17% (real CS PhD: roughly 3%). Rebased on prestige, a
  top-six programme is now 38% for a well-prepared applicant across all six, and ~5% individually.
- **Preparation now beats spraying.** Prep and applications drew on the same Energy and volume paid
  better, so the optimal play was to skip the entire preparation phase. Raw starting skill is
  compressed, tailoring is worth much more at selective programmes and wasted on safeties.

### Fixed
- **`jobTrack: 'faculty'` is not a track id.** Choosing "Go on the faculty market" set a track that
  nothing downstream could look up, silently breaking the job search. Same class of bug in two more
  places: an epilogue beat and the faculty achievement, both keyed to ids that never existed.
- **Output drought was pinned at 1 forever** after a player's first accepted paper, silently
  disabling the entire system added the same day — the balance harness was reporting a dead system,
  not a diligent player.
- `week_after`, the best-written beat about what the loop costs, was scheduled on every submission
  and capped at one firing per six-year run.

### Content repetition
Measured across full six-year runs, then fixed where it was worst:
- **Mail went from 50% repeated to 4%.** Three templates had exactly one variant and were
  hardcoded to index `[0]`, so the payroll email arrived byte-identical twelve times in a run and
  the same predatory-journal subject line arrived seven times.
- **Log lines went from 31% to 21%.** The highest-frequency lines — a request arriving, a request
  expiring, burnout, a missed deadline — were single fixed strings for things that happen a dozen
  times. They have pools now.
- Six new deadline-week meetings, because the crunch pool was three scenes for six years.
- A shared `pickFresh` picker that refuses what was used recently, applied to mail, meeting
  digests, advisor messages and log lines.

Everything is in both languages: 4,774 dictionary entries, and every event body, meeting body and
message pool now resolves in Chinese — including ten that had never been translated.

95 engine tests, 25 Playwright flows.

## [1.1.0] — 2026-09-06

### Added
- **Job search.** Three seasonal boards (LinkedOut year-round, CRAB for the short faculty season,
  The Pipeline for postdocs) over 48 employers across 12 tracks. Applications freeze their odds
  *and the committee's mood* at submit, so volume cannot average away a bad draw.
- **Recommendation letters.** Four minimum for faculty and postdocs; industry asks for referees it
  never calls. Seven writer kinds drawn from people the run produced, and one may quietly write a
  lukewarm letter you never see.
- **The sponsorship checkbox.** Answer honestly and roughly half the industry board closes inside
  the hour.
- **Applying quietly**, being found out four different ways, and using an offer to move your
  graduation date — once per run, with a shadow you are never shown.
- **Internships.** Applications every August; whether you go is decided by your advisor, whose
  objections come from your real calendar.
- **The bench** — a five-round timing minigame for research.
- **A six-year journey bar**: year bands, shaded teaching terms, milestones filling in, a pin on a
  deadline you chose, and the next dated thing.
- **Slack you can be in**: reactions, replies to one person rather than the room, and DMs with
  labmates and peers.
- **Guidance for new players**: phase-aware startup tips and a strip naming the next thing to do.
- 52 new events weighted to the early game, 114 insider notes about programs, 74 new chat lines.
- Text size is a five-step scale in the tray, and it persists.
- Published to GitHub Pages, MIT licensed, and open for contributions.

### Changed
- **Hope has gravity.** 121 choices grant it and 65 cost it, with no decay, so a long run could only
  climb. It now converges on what your circumstances support, with diminishing returns above that.
  Quit-pressure thresholds were recalibrated to the new distribution.
- **The advisor notices silence.** Output drought feeds their mode and their messages.
- **Missing a deadline costs trust**, not only goodwill, and the second costs more than the first.
- **An untargeted project is its own pressure** — the advisor asks which venue, and keeps asking.
- Event repeats within a run are penalised much harder; the early-game pool was as small as eight.
- Group chat drew from three lines per labmate trait; now a shared pool with a recently-said memory.
- The statement of purpose can be worked past its old ceiling of 63.
- Three recommenders became a bench of seven, each with an honest hint.

### Fixed
- **Every negative effect in the game read as a gain**: `effectPills` printed magnitude as `+++`
  regardless of sign, so a plan costing $60 displayed as "Money +++".
- **Could not send a draft with both bars met**: a project at progress 40–44 with a finished draft
  had a status the gate rejected, and was refused with a reason that was not the real one.
- **Concatenated strings froze in one language.** Added `joined()`, which keeps each piece's
  provenance; applied to all sixteen sites.
- Three internship achievements unlocked blank, having no catalog entry.
- The achievements screen had no way back to a running game.
- Notification badges counted messages already on screen, and added open advisor requests to the
  unread-message count.
- A layout bug where content 2129px wide overflowed a 1082px window, sliding two columns under the
  sidebar.
- The "41-minute" sponsorship rejection was unreachable: the gate blocked the application before it
  could ever be sent.

## [1.0.0] — 2026-09-06

First public release. Applications through prelims, papers, conferences, the proposal, the
dissertation, the defense and the years after. English and Simplified Chinese.
