# Venue calendar source review

Checked 2026-09-26. This bounded review fills the seven missing archetype references in
`src/data/venues.js`; it does not reverify every previously cited venue. Dates below are
the full research-paper deadlines for the named real edition, not abstract registration,
workshop proposals, camera-ready deadlines, or dates promised for a future edition.

The game's September 2028 onward calendar repeats approximate month-level patterns under
fictional venue names. Its 2028–2034 dates are extrapolations, **not published CFPs**.
Real submission years often precede the conference year. Existing README and in-game
reference warnings remain applicable.

| Archetype / edition | Official full-paper deadline | Official later stages | Game treatment |
| --- | --- | --- | --- |
| [KDD 2026 research track](https://kdd2026.kdd.org/research-track-call-for-papers/) | July 31, 2025 and February 8, 2026 | Responses October 4–18 / April 4–17; decisions November 23 / May 16; conference August 2026 | July and February rounds, respectively four and three months to decision; both feed the same following August meeting. |
| [SOSP 2025](https://www.sigops.org/s/conferences/sosp/2025/cfp.html) | April 17, 2025 | Response July 1–3; decision July 15; conference October 2025 | April → July → October; same-month response remains omitted (see limitation below). |
| [STOC 2026](https://acm-stoc.org/stoc2026/stoc2026-cfp.html) | November 4, 2025 | Notification by February 1, 2026; conference June 22–26 | November → February → June; the game correctly crosses the year boundary. |
| [SODA 2026 submissions](https://www.siam.org/conferences-events/past-event-archive/soda26/submissions/) | July 14, 2025 | Initial reviews September 8; response September 11; decisions October 2025 | Adds a September response month before October decision. [Conference January 11–14, 2026](https://www.siam.org/conferences-events/siam-conferences/soda26/) belongs to the following calendar year. |
| [ICRA 2026 papers](https://2026.ieee-icra.org/contribute/) | September 15, 2025 | [Notification January 31, 2026](https://2026.ieee-icra.org/contribute/call-for-icra-2026-papers-now-accepting-submissions/); conference June 1–5, 2026 | September → January → June. Main-paper notification must not be confused with workshop notification. |
| [CoRL 2026 authors](https://2026.corl.org/contributions/instruction-for-authors) | May 28, 2026 | [Demo instructions](https://2026.corl.org/contributions/call-for-demos) identify paper acceptance September 4; [conference](https://2026.corl.org/) November 9–12 | May → September → November. Existing July rebuttal remains a gameplay approximation: this review did not establish its exact official dates. |
| [TMLR](https://www.jmlr.org/tmlr/) | Rolling submissions | Discussion/review timing varies; the official site records a December 2025–January 2026 submission pause | Rolling, no conference. Three-month decisions and second-month responses are pacing assumptions, not a service guarantee; historic holiday pauses are not forecast into future years. |

## Corrections and boundaries

- **KDD:** the source still contains an “August” cycle label, but its explicit full-paper
  deadline is July 31. Use the actual deadline rather than that label. The first round's
  notification is November, not October. `timelineFor` now accounts for its longer review
  period; February retains its existing three-month review period. Previously submitted
  papers keep their stored timelines rather than having dates retroactively moved.
- **SODA:** the official response stage is meaningful and fits the engine's month-sized
  stages, so it is now modeled. Conference-year arithmetic is tested explicitly.
- **SOSP:** July response and July decision cannot both be playable in the current engine's
  monthly paper processing. Setting both offsets to three would open and close the
  response in a single update. This pass records the real response in reference metadata
  and retains the simplified gameplay timeline; `rebuttal: null` does not assert that the
  real conference has no author response. A finer-grained review scheduler is separate work.
- **No invented exactness:** SODA's source specifies an October notification month, so
  metadata does not invent a day. No new historical source is labeled as a verified
  2028–2034 deadline. The generic fictional workshop has no real CFP to cite.

Regression tests cover both KDD rounds, cross-year conference placement, SODA's playable
response interval, rolling-journal behavior, and linked source coverage for named archetypes.
