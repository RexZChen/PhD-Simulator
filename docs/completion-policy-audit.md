# Completion policy audit

The authoritative diagnostic baseline was `/tmp/phdsim-atmosphere-final-balance.log`, with 40 seeds per style. Its diligent agent ended six runs defended but undeposited (seeds 4, 10, 16, 27, 28, 29), and five ABD (5, 8, 15, 39, 40).

An instrumented copy of the unchanged harness reproduced these exact seeds. No simulation parameters were altered for the diagnosis.

## What the agent actually did

All six undeposited runs made **zero revision attempts**. Their policy spent Energy on optional contacts, applications, and requests before checking the revision list. Seed 4 defended in month 54, then attempted 270 contact conversations after month 45 while never attempting a revision. The run had no accepted job, despite the old ending claiming employment caused the unfinished dissertation.

A captured, naturally reached month-64 planning state for seed 4 had 49 Energy and six revision sessions remaining. Six real `REVISE` actions and the available format-review retries reached commencement in the same month. Completion was reachable; there was no justification to reduce revision costs or guarantee graduation.

All five ABD runs started their dissertations in month 46. By month 47, a paper deadline, rebuttal, conference, or authored project had changed the active selection. The agent never selected its dissertation again because its only later thesis-selection rule required draft ≥90%. Their final drafts were 30, 42, 50, 24, and 44 respectively. This was an agent-policy dead end, with a related discoverability risk for players.

## Changes and interpretation

The diligent policy now attempts committee revisions/deposit before optional networking and explicitly selects an unfinished dissertation in calm periods outside active internships. Paper crunch periods keep their immediate priorities. Lazy and grinder policies retain their previous completion behavior.

This policy change invalidates a direct difficulty comparison with the old baseline: a higher graduation rate would describe different player decisions, not easier game rules. Graduation odds, revision costs, and funding limits are unchanged.

Player-facing changes expose the next revision action, recovery when its Energy cost cannot be paid, and a way to return to the dissertation after a paper detour. The agenda uses the actual dissertation-start date. The undeposited ending describes the unfinished submission without inventing a job or future actions.

A separate engine boundary was real: scheduling at month 71 promised a defense in month 72, but the funding window ended the run in month 71. Scheduling now rejects that unavailable date with an explanation. Month 70 can still schedule a playable month-71 defense. This prevents a false promise without granting a defense or degree.

Focused regressions live in `tests/defense-boundary.test.js` and exercise real dispatch for the final scheduling boundary, the last legal defense, revision actions, and truthful endings with and without employment.

## Same-rules comparison after the calm-week/story pass

Both policies were rerun against the same updated simulation rules, 40 seeds per style.
The updated diligent policy graduated 35/40 (the other five received no offer). The preserved
original diligent policy graduated 28/40, with five undeposited, two ABD and five no-offer
endings. Lazy and grinder results matched across policies: 14/40 and 11/40 PhD endings.
The difference between policies is therefore attributable to the diligent player's changed
priorities, not a reduction in revision costs or a guaranteed graduation mechanic.

Logs: `/tmp/phdsim-calm-frozen-balance.log` (updated policy),
`/tmp/phdsim-calm-frozen-old-policy.log` (original policy with observational traces).
The old-policy rows omit accepted-paper counts for no-offer runs; aggregate them as zero.
The later change that clears an obsolete dice-result display does not alter simulation
choices, RNG, resources, or these outcomes. Neither comparison replaces natural play.
