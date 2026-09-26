# Visual playtest — September 25, 2026

Played locally in Chrome at 1365 × 900 and 390 × 844, clicking through the rendered UI and inspecting screenshots. Application play covered preparation, recommendation requests, prospective-advisor outreach, and the programs page. An enrolled seed-4242 checkpoint covered September and October, research, meetings, event choices, advisor messaging, recovery navigation, and desk/whiteboard interactions. This was not a complete manual playthrough of admission through graduation.

## Findings and changes

- Phone app icons shrank into unreadable labels and the dock overlapped the app window. Icons now retain their width in a horizontally scrolling dock, with space reserved below the window. Application phase tabs use a readable two-column layout on phones; stray commas between tabs are removed.
- The dashboard presented too many competing panels and pushed Rest below the initial desktop view. A two-column layout keeps plans together. Selecting a plan reveals its trade-offs without advancing time. Supplementary panels expand on demand and retain their open state during interaction.
- Advisor messages, paper work, recovery, and desk interactions were easy to miss. Labeled dashboard shortcuts lead directly to these pages. The chat composer now says “Choose a message”; Life lists the clickable desk objects as buttons. The thesis decision appears in next-step guidance when eligible.
- Preparation instructions referred to spatial locations that did not hold on every screen. Section shortcuts and guide buttons now take the player directly to the relevant controls.
- Monthly reports repeated dense accounting after every turn. The initial view emphasizes stat changes and project progress; event, meeting, and financial details remain available to expand.
- Routine group scenes and alternate scene wording could repeat immediately. Seeded selection now remembers recent choices, including across saves; acceptance praise retains priority. This improves selection variety within the existing content pool, rather than adding new storylines.

## Screenshots

| View | Before | After |
| --- | --- | --- |
| Desktop dashboard | [Before](screens/usability/manager-before.png) | [After](screens/usability/manager-after.png) |
| Phone application | [Before](screens/usability/mobile-before.png) | [After](screens/usability/mobile-after.png) |
| Monthly report | — | [After](screens/usability/report-after.png) |

## Validation and limits

- 133 unit tests passed, including three new regression tests for repeated selections and save continuity.
- The 47-test browser suite initially had four failures. Three expectations needed to expand the newly collapsible panels; the fourth coincided with a development-server reload. All four passed on rerun. After adding another phone/language check, the five affected navigation/application tests passed. These results are from the suite plus targeted reruns, not one uninterrupted final 48-test run.
- Translation audit: zero untranslated strings in 12 simulated runs and zero untranslated UI literals among 1,528 scanned.
- Production build passed; the existing bundle-size warning remains.
- The 120-run balance smoke test completed. A smaller paired before/after run also completed; outcome distributions changed with the random-selection changes. These checks do not establish unchanged balance or freshness over 100 human playthroughs.

Further play feedback should focus on whether the first ten minutes feel clearer and whether repeated content remains noticeable over longer runs. Later milestones were covered by automated checks, not a full manual visual playthrough in this pass.
