# Changelog

Notable changes to Academic OS. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html), where a MINOR bump means
new systems or content and a PATCH means fixes and balance.

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
