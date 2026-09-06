# Changelog

Notable changes to Academic OS. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html), where a MINOR bump means
new systems or content and a PATCH means fixes and balance.

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
