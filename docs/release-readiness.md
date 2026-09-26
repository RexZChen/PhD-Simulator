# Release-readiness work

Goal: a polished, replayable browser game hosted on GitHub Pages. “Steam-releasable grade” describes gameplay and presentation quality, not a Steam launch or a native desktop target. This is a working quality checklist, not a claim that the game is finished.

## v1.12.0 checkpoint and pause

Refinement paused at the user's request on September26. This version packages the completed
work below for GitHub Pages; it does not claim the full quality goal is achieved. The last
completed UI addition is a submission receipt that stays visible when planning selects another
project. Its title, venue and dates come from the submitted paper; returning to the plan keeps
the next work target. English/Chinese browser checks cover keyboard focus and saved history.

The next negotiation-mechanics task was stopped before any edits. Open findings for a future
resumption: acceptance baselines are captured too late; the submission condition can count an
old paper; six unrelated advisor requests can satisfy the documentation condition; and the
once-per-run offer move can reappear in a later negotiation. These are existing edge cases,
not partially shipped new mechanics. Do not wire the proposed `TIMELINE_DOCUMENT` action
without implementing and testing it first.

Checkpoint validation: 436 unit tests passed; the full browser run passed 147 scenarios and
timed out in a helper waiting for a removed exam room after the defense had already passed.
After bounding that locator wait, the affected defense-to-deposit scenario passed separately
(1.1 minutes), completing verification of all 148 scenarios. A separate test-clock race was
also corrected. Translation audit: zero reached misses and zero UI literal misses (1,751
literals). Production build passed with the existing bundle-size warning. The 120-run balance
output is unchanged from the preceding checkpoint. The receipt was visually checked at phone
width in Chinese. Logs: `/tmp/phdsim-v1.12.0-final-{unit,browser,i18n,build}.log`,
`/tmp/phdsim-v1.12.0-defense-check.log`, and `/tmp/phdsim-v1.12.0-balance.log`.

September 26 scope clarification: prioritize enjoyable browser play, discoverable choices, lower cognitive load, replay variety, and meaningful advisor interactions. GitHub Pages remains the primary product. Platform packaging and store-release preparation are outside this work.

## Latest gameplay audit: remaining concrete gaps

- Narrative causality still needs deeper work in rare succession, visa, institutional and spinout branches. See [the story review](story-review.md) for the completed pass and specific remaining gaps.
- Long-run freshness and the complete first-time learning curve still need natural playthroughs and outside-player feedback.

Prepared checkpoints and automated runs do not substitute for full natural playthroughs or feedback from players with different attention and sensory preferences.

## Required evidence before declaring ready

- Full manual playthroughs of application, research/publication, all exams, deposit, and post-graduation on representative desktop sizes; narrow-screen checks for the browser edition.
- Clear next actions, meaningful consequences, predictable keyboard controls, no blocked/overlapping controls, and recoverable mistakes.
- Reading/comfort options that address sensory load and timing, with explicit limits; keyboard-only play and screen-reader review of critical flows. Independent player feedback, including different attention and sensory preferences, remains valuable.
- Long-run content variety and pacing: investigate unreachable scenes, repeated interactions, and strategies that become repetitive chores. Automated counts alone cannot prove enjoyment.
- Save durability, backup/export and recovery, compatible upgrades, clear storage failures, and reliable late-game resumes.
- License/asset attribution audit, polished credits/help, accurate feature/support claims, and clean-install testing.
- Full unit/browser/translation/build gates; representative balance/reach runs; no unresolved release-blocking bugs.

## September 25: concrete progress

- Earlier visual pass: readable mobile navigation, clearer dashboard actions, lighter reports, recent-scene rotation. See [visual playtest](ui-playtest.md).
- Reproduced in live Chrome: Enter on a focused Rest button advanced time instead of selecting Rest. Native keyboard activation now takes precedence; focus survives shell rerenders and Tab stays in dialogs.
- Added Reading & comfort controls for visual effects, sound, text size, and untimed conversation choices, accessible from the taskbar and scenes. The subsequent self-paced activity pass below extends timing options to examinations and minigames.
- Played onward through November's meeting, Thanksgiving, tenure-pressure choice, and kitchen encounter into December. Inspected the comfort dialog at desktop and phone sizes. This revealed a notification overlay hiding the phone dialog's Close button; notification balloons are now hidden while a dialog is open.
- Save audit fixes cover storage failures, corrupt data, retry accounting, legacy preservation, and a final-month ending that previously failed reload validation.
- Failed-defense retry repaired and content-reach measurement corrected. See [progression audit](progression-audit.md).

## Next priorities

1. Independently playtest the comfort options and complete keyboard/screen-reader checks across activities.
2. Portable backup/recovery is implemented; audit browser-save compatibility across game updates next.
3. Visually play the publication and examination loops, including failure/retry and final-month paths.
4. Investigate the review scenes that scripted runs never encounter and pacing beyond the first year.
5. Refine the first-run learning curve, advisor interaction choices, and repetition across long runs; validate each through actual browser play.

## Historical validation checkpoint

141 unit tests passed. Full browser suite: 50 passed and one invalid test-checkpoint failure; after correcting that checkpoint, all four targeted keyboard/phone/preferences checks passed. Translation audit printed zero twice. Production build passed with the existing large-bundle warning. See the progression audit for paired 120-run balance evidence.

Visual evidence: [comfort controls on desktop](screens/usability/comfort-desktop.png), [large text on phone](screens/usability/comfort-phone-large.png).

The phone timed-scene inspection also found overlapping caption/meme layers. The caption now has its own row, meme art has explicit grid placement, and meme text uses solid dark lettering. [Untimed conversation at larger text size](screens/usability/untimed-phone.png). Both affected browser checks passed after this visual fix.


## Portable backups

Saved runs now offers a JSON download containing the live run, three manual slots, achievements, and preferences. Import validates a bounded file before presenting a replacement preview. Cancel writes nothing; confirmed restore revalidates and writes once, then reloads through the normal loader. Export can rescue in-memory progress when persistent writes fail. Corrupt existing storage is reported rather than silently excluded from a download.

Played the download → file selection → preview → cancel flow on a phone-sized viewport with large text. [Import preview](screens/usability/backup-preview-phone.png). Automated checks additionally restore a changed player name while preserving a saved slot and reject invalid input without modifying browser storage. Engine checks exercised 18 completed runs through export and preview.

Backup files currently require the supported game/save version. This adds portability, not cross-version migrations or Steam Cloud. Future migration support remains on the release checklist.

## Publication screen follow-up

Continued the existing playtest into January, wrote a paragraph, and opened venue targeting. The phone layout scattered table headers above unlabeled values. Each mobile venue entry now keeps its deadline, selectivity, and fit labels with its values and a larger target control. [Phone venue entry](screens/usability/venues-phone.png). Targeting and the existing paper pipeline passed browser checks after the change.

Latest checks: 147 unit tests passed; full 53-test browser suite passed before the final venue layout change, then both affected venue/paper checks passed. Production build passed with the existing bundle warning. This evidence supersedes the earlier partial-suite counts above.

## Self-paced activity and visual playtest follow-up

Reading & comfort now offers **Self-paced activities**, saved with preferences and portable backups. It replaces reaction timers in literature reading, lectures, debugging, conference talks/questions, and examinations. Results remain visible until Continue. Exam presentation budget, debugging error allowance, reading risks, and lecture attention choices preserve consequences without requiring quick input. Existing timed modes remain available and pause when the tab is hidden. The setting applies when an activity starts.

Played literature reading and a complete preliminary-exam presentation and Q&A in Chrome at 390 × 844 with enlarged text. Inspected the rendered choices and held feedback: [reading choices](screens/usability/selfpaced-reading-phone.png), [exam feedback](screens/usability/selfpaced-exam-phone.png). The exam included successful and unsuccessful answers rather than an automatic pass. Fixed misleading enabled slide buttons during interruptions. Saved reading/debugging activities now initialize correctly on resume, and activity clocks wait until the actual game screen opens.

Latest validation: **150 unit tests and all 59 browser tests passed**, followed by the targeted exam check with assertions for disabled interruption controls. Translation audit: zero reached untranslated strings and zero untranslated UI literals. Production build passed; the large-bundle warning remains. These counts supersede earlier checkpoints. This is an accessibility improvement, not evidence that every autistic or ADHD player will find the game comfortable; direct player feedback and assistive-technology testing remain on the acceptance list.

Completing the manual exam exposed stacked achievement and message overlays on the phone. Reduced-effects mode now suppresses automatic achievement/message popups independently of the sound setting; updates remain in apps and badges, and direct error/action feedback remains available. Preferences and the complete exam browser checks passed after this follow-up, as did the production build.

## September 26: ending and notification playtest

Default notifications now show one compact, dismissible achievement card for simultaneous awards and at most one routine balloon. Narrative notes take priority over the achievement card; either suppresses routine balloons while visible. The achievement's duplicate balloon was removed. Quiet mode keeps automatic notices off even when sound is enabled. Deposit browser checks cover both modes using a first-pass format review that earns two achievements.

Played a prepared late-game checkpoint through deposit, the CV, job selection, five epilogue decisions, and the final transcript. This is evidence for those screens, not a full six-year manual run. [Commencement](screens/usability/commencement-phone.png) and [job offer](screens/usability/job-offer-phone.png) fit a 390 × 844 phone with enlarged text. The final transcript initially filled the screen with one centered block and buried further actions. Replay, achievements and saved runs are now at the top; the complete narrative remains available under Read your ending, with left-aligned paragraphs. [Before](screens/usability/ending-phone-before.png) / [after](screens/usability/ending-phone-after.png).

Validation: 150 unit tests, all 61 browser tests, translation audit and production build passed. After the final transcript layout change, the phone ending/archive browser test, translation audit (zero twice), and production build passed again. The bundle-size warning remains. Deferred-ceremony narrative continuity is an observed remaining issue, listed above.

## Ceremony continuity

The deferred ceremony issue is fixed: the deposit screen says Degree conferred and names the future
ceremony month instead of narrating a ceremony that has not happened. Immediate ceremonies retain
their own narration without assuming every PhD lasted six years. Both paths pass browser checks in
English and Chinese. Visually inspected [English](screens/usability/degree-conferred-phone.png) and
[Chinese](screens/usability/degree-conferred-phone-zh.png) at enlarged text size.

The web build remains the primary product. Native packaging and platform-publishing work are outside the requested scope.

## Gameplay priorities after scope clarification

- Make advisor and lab interactions easy to discover and relevant to the current stage; avoid large menus of repetitive or obsolete choices.
- Make each planning step offer understandable tradeoffs and a visible result, with fewer chores between meaningful events.
- Play full browser runs to evaluate energy, paper progress, deadline pacing, and event variety—not just whether actions execute.
- Keep attention and sensory controls optional and coherent; check narrow screens, enlarged text, keyboard operation, and both languages.
- Preserve browser saves and backups across improvements. GitHub Pages remains the deployment target.

## Advisor choice browsing

Advisor messages now start with compact, expandable categories for requests, meetings, research,
funding, support, and relevant lab changes. The categories begin closed so outstanding requests do
not push everything else off a phone screen. Each advisor ask shows its energy cost, and insufficient
energy disables it with a reason before drafting. Prelim-timeline questions disappear after a pass
or conditional pass. These are presentation/availability fixes; the advisor's response probabilities
and gameplay consequences are unchanged.

Played the leave-request flow through drafting, sending, and a deadline-related refusal. Visually
inspected the menu at 390 × 844 with enlarged text in [English](screens/usability/advisor-categories-phone.png)
and [Chinese](screens/usability/advisor-categories-phone-zh.png), plus the [reply](screens/usability/advisor-leave-phone.png).
The first visual iteration still buried the other categories under open requests; the final version
shows all five current categories at once.

Validation after this change: all 150 unit tests and 62 browser tests pass. The production build
passes, and the translation audit reports zero reached misses and zero missing literals.

## Advisor request clarity

Each pending request now has its own expandable card in the message menu, with the complete text,
task kind, due date, and its three responses together. The category counts requests rather than
response buttons. Insufficient energy disables completion with a visible reason in both the menu
and the original chat message; a previously attempted pushback also explains why it is unavailable.

Played through completing a reading request and successfully pushing back on a teaching request.
Each resolved task left the pending list independently. The first phone inspection revealed that
the old 320-pixel menu hid Decline below the fold even with the improved cards. The menu now uses
more available vertical space, and an expanded-card browser check asserts that Decline is visible.
Inspected the [English low-energy card](screens/usability/request-energy-phone.png) using a prepared
checkpoint and the [Chinese request card](screens/usability/request-phone-zh.png) during play.

Validation: 150 unit tests and the full 63-test browser suite passed. After the final menu-height
adjustment, all three affected phone/advisor checks passed. A final singular/plural wording fix was
visually verified. Translation audit reports zero twice; production build passes with the existing
bundle-size warning. Request costs, probabilities, and outcomes are unchanged.

## Research pacing and late-game deadlines

Deadline targeting incorrectly rejected every absolute run month from 24 onward. The UI still
offered those deadlines, but the action failed after year two. Targeting now uses the full 72-month
run boundary. Regression checks cover manual and automatic targeting in years three through six,
deadline pacing, late-month rollover, and exclusion of targets beyond the run. All three new tests
failed before the fix and passed afterward. Also selected NeurIPSy for May 2031 through the actual
venue picker in a prepared third-year save: [phone view](screens/usability/year3-target-phone.png).

The paper's next-step card now offers one writing session using the current remaining allowance.
It replaces repeated paragraph clicks without changing the draft cap, eligibility, resources,
quality, or time. Engine tests compare the complete resulting state against repeated paragraph
actions for monthly and weekly plans. Once exhausted, the card explains the limit and links back
to planning. A dissertation at 90% now correctly points to committee review.

Continued the existing January run through a self-paced reading session, then used the remaining
15 draft points and returned to planning without advancing time. Visually inspected the
[writing action](screens/usability/writing-session-phone.png), the completed session in
[English](screens/usability/writing-done-phone.png) and
[Chinese](screens/usability/writing-done-phone-zh.png), all at 390 × 844 with enlarged text.

Paired default balance runs (40 seeds per style, 120 runs per revision):

| Style | PhD endings before → after | Mean accepted papers before → after |
| --- | --- | --- |
| Diligent | 22 → 30 / 40 | 1.7 → 2.0 |
| Lazy | 12 → 12 / 40 | 1.5 → 1.9 |
| Grinder | 2 → 6 / 40 | 2.0 → 2.0 |

The harness attempts targets after research reaches 45%; the repaired action changes later pacing
and RNG consumption. These results show the effect on this seed cohort, not calibrated difficulty
or evidence of enjoyment. The writing-session action is separately verified as equivalent to the
existing paragraph actions.

The third-year checkpoint was played onward through writing, the preprint-policy choice, annual
review, and an advisor conversation about committing to the selected deadline. This verifies that
the target participates in the surrounding gameplay, rather than only updating a label.

Final validation for this pass: 155 unit tests and all 65 browser tests passed. Translation audit
reports zero reached misses and zero missing UI literals; production build passes with the existing
bundle-size warning. Paired balance logs were produced at
`/tmp/phdsim-target-balance-before.log` and `/tmp/phdsim-target-balance-after.log`.

## Scene orientation and breaks

Scenes and advisor follow-ups now display the number of other scenes currently queued, using
“queued” because choices can create additional follow-ups. Pause is visible above the scene art.
It freezes conversation timers, identifies the current scene, and offers Resume and Saved runs.
Opening and closing Saved runs preserves the paused state. Repainting a timed conversation now
also preserves the visible timer bar instead of temporarily drawing it full again.

Played Pause → save slot → close saves → resume → finish the scene → monthly report. The scene
count correctly showed no further queued scenes before the report. Loaded that saved scene in
Chinese and inspected Pause at 390 × 844 with enlarged text. Screenshots:
[scene count](screens/usability/scene-queue-phone.png),
[Pause in English](screens/usability/scene-pause-phone.png),
[Pause in Chinese](screens/usability/scene-pause-phone-zh.png).

The browser regression advances a running timer, pauses for 30 simulated seconds, presses a choice
shortcut while paused, saves the current event and queue, resumes, and verifies the timer advances
again. This is a conversation pause; it does not introduce a new global pause for every minigame.

Loading a slot or abandoning a run clears the old pause state. Loading also starts the restored
conversation's timer afresh. Escape closes the foremost save/confirmation dialog without silently
resuming the paused conversation behind it.

Validation: 155 unit tests, all 66 browser tests, translation audit (zero twice), and production
build passed. After the final load/Escape cleanup, the three affected pause/keyboard/backup browser
checks and the production build were rerun.

## Connected workspace and consequential tools

The left navigation is now a continuous workspace rail with clear Work, People, Campus, and Personal groups. Mobile navigation retains readable labels and horizontal scrolling. Scholar uses a sparse profile/publication layout, blue expandable paper titles, citation columns and a citation chart, with a direct working manuscript shortcut. Its visual reference was [Google Scholar's official help](https://scholar.google.com/intl/en/scholar/help.html).

LabChat has a connected purple channel rail, clearer conversation hierarchy, visible message controls, and an outstanding-request shortcut that opens the relevant choices. Its message picker isolates keyboard focus and closes with Escape. A final independent audit caught Enter reopening the picker and discarding a draft; selecting a line now focuses the draft, then Send when typing completes, provided the player has not moved focus elsewhere.

ChatPHD exposes all five research tools beside the conversation, labels the current paper, and offers conversation starters. Research suggestions are previews: check for two Energy, accept the risk, or discard. Pending suggestions survive reload, and their effects apply only after a decision. Rebuttal assistance belongs to its paper. Result links return to the manuscript. Played the Chinese abstract-check flow and the English experiment-preview → Use as-is → manuscript flow through the actual UI; the displayed +5 Research was applied. The LabChat keyboard-send flow was also replayed in Chrome, completing an advisor request and deducting its displayed six Energy.

Deadline warnings now explain when advisor review would miss the target and expose available trade-offs. Players can change a target while review continues; skipping review respects advisor availability and the week. A promised local postdoc now becomes a selectable offer with the correct employer. Resubmitting a paper resets the prior review-cycle state, and summer-funding requests respect season and existing coverage.

Visual evidence, including prepared checkpoints for later-year screens:

- Scholar: [desktop](screens/usability/scholar-populated-desktop.png), [phone](screens/usability/scholar-populated-phone.png).
- LabChat: [desktop](screens/usability/labchat-desktop-final.png), [phone request picker](screens/usability/labchat-request-phone-final.png).
- ChatPHD: [desktop tools](screens/usability/chatphd-desktop-final.png), [Chinese phone suggestion](screens/usability/chatphd-preview-phone-zh.png).

Validation: 173 unit tests pass. The paired 120-run balance results before and after the deadline-target changes are identical; that harness does not exercise the new ChatPHD decisions. All 71 browser tests pass, including the keyboard-send regression, Scholar rankings and patent rendering, phone layouts, saved ChatPHD previews, and English/Chinese navigation. The translation audit reports zero reached misses and zero missing UI literals (1,638 scanned). The production build passes with the existing bundle-size warning.

## Conversations that follow the run

Cohort actions now follow prelim, proposal, dissertation, and post-defense stages. A conditional prelim pass moves the conversation forward too. Repeated commiseration, cluster and coffee exchanges rotate through authored pairs without consuming RNG while browsing; progression is saved. Study groups become proposal swaps and mock defenses, with effects that fit that stage. The shared cooldown remains across milestone changes. Senior labmate advice also unlocks by stage and remains once per person.

Channel menus show Energy costs and concise benefits. They reject the same unavailable actions in the engine as the UI; reviewer advice appears only for an editable paper with rejection history. Played a proposal swap in the ongoing May 2031 checkpoint, sent it with Enter, and verified the conversation history in English and Chinese. [Enlarged-text phone choices](screens/usability/story-cohort-phone.png).

The same playtest found Chinese menu titles splitting into vertical characters and gray dropdowns inheriting white text from the hovered menu title. Titles now stay intact, the date wraps when necessary, dropdowns stay inside narrow windows, and menu text has explicit contrast. Escape closes a menu and returns focus to its title. [320-pixel Chinese menu](screens/usability/story-menu-phone-zh-final.png).

The summer-funding event now respects existing RA/TA coverage, grants the funding promised in its outcome, and creates real late internships in years three through six. Margin risk and review help belong to the relevant manuscript/submission. Review emails identify the original submission, so replying after selecting another project cannot help the wrong paper, and stale emails do not boost a later resubmission.

Paired 120-run simulation comparison: PhD endings changed from 31/15/3 to 29/14/3 for diligent/lazy/grinder styles; average accepted papers changed from 2.0/1.8/1.7 to 1.9/1.7/1.6. Diligent average ending debt fell from $10,386 to $9,253. These are consequences of correcting funding and review behavior across seeded runs, not evidence of better enjoyment. The scripted styles do not exercise the new cohort conversations.


LabChat reply availability now resolves the saved message's original source text rather than running English matching rules against a Chinese translation. Chinese-created catalog messages retain the same choices after saving, reloading, and switching languages. Added the previously missing reaction, reply and DM translations; a direct catalog check covers all 68 content strings and four role labels, which the random-run translation audit did not previously exercise.

Completed DM topics now collapse below unanswered choices. The new senior proposal discussion was played in Chinese, and the remaining advisor question stays visible: [compact DM](screens/usability/story-senior-phone-zh-final.png). Also answered an existing cohort message in Chinese and verified Energy fell from 32 to 28, with a translated reply: [conversation result](screens/usability/story-reply-phone-zh-final.png).

Validation after the conversation and translation changes: 199 unit tests pass; the translation audit reports zero reached misses and zero missing UI literals (1,637 scanned); production build passes with the existing bundle-size warning. The final full browser suite passes all 74 tests, including the compact-DM visibility check, stage-aware choices, Chinese menus, and actual Chinese replies.

## Activity pacing and readable feedback

Reading, lecture, debugging, exams, conference presentations and Q&A now have reachable Pause and
Reading & comfort controls. Pausing, opening comfort settings, hiding the tab, and returning to the
activity preserve the current work. Self-paced feedback remains available before advancing; exam
focus moves to the new question or interruption, and repeated repaints do not repeat announcements.

Conference talk choices explain their contribution and label the score. Each Q&A question restarts
its timer correctly; timeout is a real engine outcome instead of an unknown action. The final
answer remains readable with the Q&A result. Inspected the
[Chinese talk feedback](screens/usability/talk-feedback-phone-zh.png) and
[Q&A result](screens/usability/qa-result-phone-zh.png).

Activity dialogs use a constrained grid column on narrow screens. The exam's room-setting prose
is an optional disclosure instead of an automatic popup over the controls. The paired 120-run
simulation results before/after the activity changes were identical; the harness does not measure
the experience of using these controls.

## Story continuity and meeting entrances

Reviewed major arcs in English and Simplified Chinese: admissions and recommendations, advisor
and group meetings, rejected papers, fellowship recognition, relationships, health crises,
succession, twelve careers, and ordinary exits. The concrete changes and remaining causal gaps
are in [the story review](story-review.md). This is not a claim of complete editorial coverage.

Meetings now have a 1.8-second entrance within the illustration: calendar → office door for a
one-on-one, calendar → projector/table for a group meeting. The room's mood follows the scene and
advisor pressure, with warmer treatment for supportive meetings. Choices remain available; the
decision timer waits during the entrance. Skip, Pause, quiet mode and system reduced motion are
supported. Cancellation scenes do not animate an advisor arriving. Entrances neither consume
simulation randomness nor change meeting costs.

Actual phone play revealed horizontal overflow from a long advisor title. Constraining the dialog
grid column fixes it. A nested Pause → Saved runs → Resume regression revealed that transient
animation classes were being used as dialog identity; excluding those classes preserves the
opener and restores keyboard focus. Visual evidence:
[calendar entrance](screens/usability/meeting-arrival-phone.png),
[one-on-one](screens/usability/meeting-private-phone.png),
[group meeting on desktop](screens/usability/meeting-group-desktop.png),
[group meeting in Chinese](screens/usability/meeting-group-phone-zh.png).

Paired default simulation results for the narrative/mechanical corrections (40 seeds per style):

| Style | PhD endings before → after | Mean accepted papers before → after |
| --- | --- | --- |
| Diligent | 29 → 31 / 40 | 1.9 → 1.7 |
| Lazy | 14 → 8 / 40 | 1.7 → 1.1 |
| Grinder | 3 → 3 / 40 | 1.6 → 1.6 |

Recommendation timing and funding/story eligibility change state and the sequence of seeded
draws. No-offer outcomes rose from one to five seeds in each cohort. This is a consequence of the
corrections, not evidence that admissions difficulty is calibrated or that runs are more enjoyable.
The grinder cohort still has thirteen posthumous endings in forty seeds; the severity of that
trajectory merits a separate balance/editorial judgment. Logs:
`/tmp/phdsim-activity-balance-after.log` and `/tmp/phdsim-story-final-balance.log`.

Final verification: **225 unit tests and all 90 browser tests pass**. Translation audit reports
zero reached untranslated strings and zero missing UI literals (1,643 scanned); production build
passes. The existing bundle warning remains: approximately 2.77 MB of JavaScript before gzip,
1.05 MB after gzip. No deployment was performed.


## Advisor handover and remote continuity

Advisor changes now archive the predecessor and preserve published/submitted authorship, external
reviews, completed milestones, recommendation letters, and the cast of translated history. Old private messages remain readable with an archive label; their reply controls cannot summon
a departed advisor. Open requests are withdrawn in place. Pending internal advisor reads return to the intact draft for an
explicit new invitation. A successor has a distinct identity and can receive a separate letter
request; an advisor who later mentors an internship is still one person in the packet.

The industry-departure choice books a real paid research internship. Salary arrives through the
normal monthly ledger, and completion feeds the internship history and CV. Existing internships
cannot be overwritten. The simulation drivers now use the same unavailable-choice reason as the
UI, so a disabled internship option no longer stalls a scripted run.

Remote one-on-ones use a waiting-room → video-screen entrance, retaining the existing timer hold,
skip, pause and reduced-motion behavior. Three new bilingual conversations and fourteen compatible
existing scenes avoid treating the PI as physically present. Office pop-ins redirect visibly to
LabChat. A shared-document discussion requires an editable draft. The bereavement scene no longer
inherits the generic meeting meme. Enlarged desktop stat labels stay on one line.

Prepared branch play and inspected screenshots are recorded in [the story review](story-review.md).
These checks do not replace full natural runs or feedback from players.

Paired 40-seed-per-style results against the preceding narrative pass:

| Style | PhD endings before → after | Mean accepted papers before → after |
| --- | --- | --- |
| Diligent | 31 → 28 / 40 | 1.7 → 1.6 |
| Lazy | 8 → 8 / 40 | 1.1 → 1.1 |
| Grinder | 3 → 3 / 40 | 1.6 → 1.6 |

No-offer outcomes remain five per cohort; the final run has no stuck outcomes. The grinder cohort
has fourteen posthumous endings (previously thirteen), so the existing severity concern remains.
These are seeded trajectory changes, not evidence that the game is calibrated or enjoyable.
Logs: `/tmp/phdsim-story-final-balance.log` and `/tmp/phdsim-succession-final-balance.log`.

Verification for this continuation: 242 engine tests, 93 browser tests, zero translation misses
in 12 scripted runs and zero missing UI literals (1,644 scanned), plus a passing production build.
The bundle warning remains: about 2.79 MB JavaScript before gzip, 1.06 MB after gzip. No deployment.
Relocation, retirement arrangements, a unified tenure-departure clock and rare narrative branches
remain open work.

## Meeting pressure: visual and story follow-through

The entrance now uses a restrained approach and closing shadows for difficult private meetings,
with a projector/audience reveal for group meetings. Motion stays inside the illustration. The
caption has its own layout row, so enlarged English and Chinese text cannot cover the room.
Room avatars no longer inherit profile-card borders. Skip, pause, reduced effects, system reduced
motion, and the decision-clock hold remain available.

Explicit offers of rest and praise override an advisor's general pressure mode. These scenes and
cancellations no longer produce unrelated live pushback. Actual browser play found the original
contradiction: accepting “take a few days off” immediately generated “When.” The corrected branch
returns to planning with the leave intact. Demanding meetings can still produce follow-up exchanges.
The camera-off variant of the quiet meeting now shows a dark video tile, with matching captions;
the first-meeting entrance no longer assumes the player has a draft.

Played prepared English and Chinese checkpoints through choices and follow-ups in Chrome, including
320-pixel largest-text private meetings and desktop group meetings. Evidence:
[largest-text phone room](screens/usability/meeting-pressure-largest-phone.png),
[group meeting](screens/usability/meeting-pressure-group-desktop.png),
[camera-off meeting](screens/usability/meeting-camera-off-phone-zh.png),
[supportive meeting](screens/usability/meeting-supportive-desktop-zh.png).
These are branch checks, not full natural playthroughs.

Removing impossible pushback also removes its random draws. In paired 40-seed-per-style simulations,
PhD endings changed from 28/8/3 to 26/7/1 for diligent/lazy/grinder styles; mean accepted papers changed
from 1.6/1.1/1.6 to 1.5/1.2/1.5. Neither run got stuck. The grinder's posthumous outcomes changed from
14 to 15; the previously recorded balance concern remains. These seed shifts do not establish improved
enjoyment. Logs: `/tmp/phdsim-meeting-polish-balance-before.log` and
`/tmp/phdsim-meeting-final-balance.log`.

Final checks: 248 engine tests and the full 95-test browser suite passed; translation audit printed
zero reached misses and zero missing UI literals (1,646 scanned). A sampled animation frame revealed
the door's incorrect layering and outward perspective. After correcting those and using the actual
scene occurrence counter for entrance identity, all 10 meeting browser tests passed again and the
production build passed. [Sampled door transition](screens/usability/meeting-door-transition.png).
The existing bundle-size warning remains (about 2.79 MB JavaScript, 1.06 MB gzip).

## Advisor relocation: a transfer the game actually carries out

Following a departing PI now signs a visible offer, pays a $1,600 deposit once, and moves the
student at the next month boundary before payroll. The offer names the destination, the cash/debt
split, new gross stipend, base rent and exact guaranteed funding period. Coursework, milestones,
projects, authorship and the continuing committee survive. Housing adjustments and the old TA/RA
assignment do not. The guarantee belongs to the department, so changing local supervisors does not
silently revoke it. A cancelled transfer refunds its cash/debt split once.

Funding normally covers twelve months, capped to the remaining program months for late transfers.
It suppresses contradictory RA-loss/TA scenes, summer reductions and year-six funding gaps during
that interval. Ordinary rules resume before the expiry month's payroll. A summer-funding request
is disabled only if the guarantee covers the remaining summer through August; partial coverage
still permits asking. A real internship salary takes precedence over the RA stipend.

Existing labmates move with the lab. Former cohort members retain their names, bonds, message
histories and original affiliation, and remain reachable remotely in LabChat and at conferences.
Local encounters use the new campus cohort; queued physical encounters with an old peer are
removed instead of recasting that person. Peer-bond effects now apply to the actual eligible peers;
a private message changes the addressed person's bond rather than silently doing nothing.

Manual Chrome play used a prepared Chinese transfer checkpoint, then normal choices through the
remaining month's meeting, New Year and relationship events, monthly report, arrival and a remote
classmate DM. The offer was shortened after enlarged phone text revealed repeated legal prose and
an unnecessarily tall layout. Inspected evidence:
[English desktop offer](screens/usability/relocation-offer-desktop-en.png),
[Chinese arrival](screens/usability/relocation-arrival-phone-zh.png),
[remote classmate conversation](screens/usability/relocation-remote-peer-phone-zh.png).
Browser regressions exercise both departure events, save/reload before arrival, borrowed deposits,
new payroll, retained exams/committee and remote affiliation at 320px with enlarged English/Chinese
text. These prepared branch checks are not full natural playthroughs.

Paired 40-seed-per-style results against the meeting pass:

| Style | PhD endings before → after | Mean accepted papers before → after |
| --- | --- | --- |
| Diligent | 26 → 24 / 40 | 1.5 → 1.4 |
| Lazy | 7 → 3 / 40 | 1.2 → 1.0 |
| Grinder | 1 → 1 / 40 | 1.5 → 1.6 |

No stuck outcomes; five no-offer outcomes per cohort. Grinder posthumous endings rose from 15 to 17.
The new campus, changed event eligibility and repaired peer-bond effects change subsequent seeded
trajectories. These figures do not establish improved balance. Severity remains unresolved.
Logs: `/tmp/phdsim-meeting-final-balance.log` and `/tmp/phdsim-relocation-final-balance.log`.

Engine checks: 264 passed. Translation audit: zero reached misses in 12 scripted runs and zero missing
UI literals (1,659 scanned). Production build passed; the existing large-bundle warning remains
(2,801.42 kB JavaScript, 1,063.92 kB gzip). No deployment. Retirement/co-advising, the competing tenure
clocks, natural-run pacing, replay fatigue and player feedback remain open release-quality work.

The final full browser suite passed all 97 tests (3.3 minutes), including the ten meeting-transition
checks and both new relocation checks. Source was unchanged during that suite. Re-inspected the
finished [private meeting](screens/usability/meeting-pressure-current-desktop.png) and
[Chinese group meeting](screens/usability/meeting-group-current-desktop-zh.png) in Chrome.
Final whitespace check passed. This remains progress toward release quality, not a release-ready claim.

## Recovery leave and interrupted fast-forward

A resolved crisis used to block every later crisis, even after its cooldown. Daily turns also ignored
leave, and seasonal work was credited before the intervening months were processed. Regressions now
cover repeated crises, one-time charges, deductible consumption, urgent conditions, fractional daily
leave, partial turns, and interruptions before future work is applied.

Fast-forward processes actual months in sequence, retaining one report for a calm season. Urgent
care, scheduled decisions, new advisor requests and milestone boundaries interrupt it. A paused season records only the
completed months. Report dates and the next-month button match the calendar; the phone report now
uses readable project summaries and a wrapping date range instead of a squeezed four-column table.

Health escalation uses consecutive difficulty rather than lifetime counters. All three health-support
scenes offer a four-week continuing-care plan with an explicit bill, cash/debt split and request
extension. Withdrawal is a separate ending choice. Taking care clears the prior refusal flag; there
is no longer an active health-scene route that forces a posthumous ending. Legacy ending display is
retained. Medical leave preselects recovery, consumes the correct time at every pace, and excuses
routine meetings and compulsory classes. External deadlines retain their dates.

Played prepared checkpoints in Chrome at enlarged phone text, including save/reload, support-plan
choices, the remaining month's events, continuing to February, a January fast-forward interrupted
in February, and a healthy January–March report continuing into April. Visual inspection found and
corrected a compulsory lecture during leave, a hardcoded December winter caption in January, and
the report's unreadable columns. Evidence:
[Chinese care offer](screens/usability/recovery-offer-phone-zh.png),
[Chinese recovery plan](screens/usability/recovery-plan-phone-zh.png),
[interrupted season](screens/usability/season-paused-for-care-phone-en.png),
[readable season report](screens/usability/season-report-phone-en.png).

Paired 40-seed-per-style results against the relocation pass:

| Style | PhD endings before → after | Mean accepted papers before → after |
| --- | --- | --- |
| Diligent | 24 → 27 / 40 | 1.4 → 1.9 |
| Lazy | 3 → 6 / 40 | 1.0 → 1.1 |
| Grinder | 1 → 10 / 40 | 1.6 → 1.8 |

No stuck outcomes; five no-offer outcomes per cohort. Grinder posthumous endings changed from 17 to
zero because the forced branch was removed. This is a deliberate narrative/mechanical change, not
statistical proof of better balance. The harness chooses the first available continuing event choice:
previously that could mean discharge; now it can mean arranging care. Changed event eligibility and
month ordering also alter seeded trajectories. Average crisis counts now include actual repeated
episodes rather than a boolean. Logs: `/tmp/phdsim-relocation-final-balance.log` and
`/tmp/phdsim-recovery-final-balance.log`.

The final read-only review reproduced a request created and expired inside one seasonal action.
Batching now stops when a request arrives; an open request also prevents starting another season.
The regression first failed with one unattended expiration, then passed through the report and
successfully answered the still-open request. Calm-season fixtures explicitly suppress new requests
so that calendar and request interruptions are tested separately.

Engine checks: 283 passed. Translation audit: zero reached misses and zero missing UI literals
(1,668 scanned). Production build passed with the existing bundle warning (2,812.94 kB JavaScript,
1,067.84 kB gzip). Retirement/co-advising, competing tenure clocks, natural-run pacing and replay
fatigue remain open. No deployment or release-ready claim.

Final full browser suite: 101 passed in 3.3 minutes, including meeting entrances, pause/skip/reduced
motion, both recovery languages, interrupted fast-forward and report dates. Source was unchanged
during this final suite. Final whitespace check passed.

## Retirement support and advisor tenure continuity

Retirement now replaces the primary advisor in every continuing branch. Successful co-advising
retains the former PI as a separately identified mentor with an optional monthly consultation and
recommendation letter. The funded handover identifies a project, three future payroll months (or
only those left before the program limit), and monthly maintenance. Leave excuses maintenance;
expiry restores regular TA and year-six funding before payroll. A review caught an extra full
stipend in the first month after expiry; a report-advance regression now covers that boundary.
Current-advisor letter trouble no longer leaks into the emeritus mentor’s letter.

Tenure outcomes commit once on announcement and are bound to advisor and institution. Denial gives
a dated twelve-month notice, prevents competing departure announcements and interrupts a season
before the departure boundary. An expression of interest does not relocate the student or charge
a deposit. Actual departure offers the existing transfer agreement or a local replacement. Old
flag-only saves receive a review or a fresh notice, not retroactively invented people and funding.
A bounded independent review confirmed the payroll fix and found no release-blocking save
normalization issue; this is not an exhaustive review of all historical saves.

Manual Chrome play used prepared checkpoints in both languages, with 320/390 px phone layouts,
large text, real choices, consultation and reloads. It exposed duplicated terms hiding the choices;
retirement now puts specific terms alongside each option and tenure shows a compact date. The full
ongoing record remains in the manager. Re-inspected the animated one-on-one and Chinese group-room
entrances. Screenshots and the editorial review are in [story-review.md](story-review.md).

Balance, same harness and 40 seeds per style:

| Style | Before: PhD endings / 40 | After: PhD endings / 40 | Before → after accepted papers |
| --- | ---: | ---: | ---: |
| Diligent | 27 | 27 | 1.9 → 2.1 |
| Lazy | 6 | 6 | 1.1 → 0.9 |
| Grinder | 10 | 13 | 1.8 → 1.8 |

After-pass endings:

- Diligent: product engineer 8, unplaced PhD 7, industry research 6, no offer 5, ABD 4,
  undeposited 3, founder 2, soft money 2, quant 1, fired 1, postdoc 1.
- Lazy: fired 27, no offer 5, product engineer 3, industry research 2, failed exam 2,
  unplaced PhD 1.
- Grinder: fired 19, no offer 5, unplaced PhD 5, product engineer 3, quant 3, founder 1,
  teaching faculty 1, perpetual student 1, ABD 1, failed exam 1.

No stuck results. These small cohorts do not establish improved balance. Reassignment and the
single tenure decision change both eligibility and the subsequent RNG stream; the harness also
selects the first continuing choice rather than exploring retirement strategies equally.
Logs: `/tmp/phdsim-recovery-final-balance.log` and `/tmp/phdsim-supervision-final-balance.log`.

Engine checks: 303 passed. Translation audit: zero reached misses in twelve scripted runs and
zero missing UI literals (1,691 scanned). Production build passed with the existing bundle warning
(2,834.50 kB JavaScript, 1,075.33 kB gzip). No deployment. Natural-run pacing, repeat-run fatigue,
rare bilingual branches and feedback from new players remain release-quality work.

Final full browser suite: 109 passed in 3.4 minutes, including all meeting-transition checks and
eight new bilingual supervision/tenure checks. Source was unchanged during the suite. The initial
sandboxed attempt could not bind localhost; the approved rerun used the same command successfully.
Final whitespace check passed. This remains progress toward release quality, not a release-ready claim.

## Fresh-player flow, crisis conversations and preserved saves
Played seed 3733285486 from a clean browser context through setup, preparation, five applications,
two interviews, a single offer, visit questions, enrollment and the first research project. Actions
were taken through the UI. Development reloads interrupted the session, so it is not evidence for
the spec's 15–30 minute completion target. The continuation backup is
`/tmp/phdsim-natural-3733285486-first-project.json`. Story findings, screenshots and the exact route
are recorded in [story-review.md](story-review.md).

Setup presents a shorter notice with the full disclaimer available by keyboard disclosure. Removed
duplicated offer guidance. A student's meeting-frequency answer now uses the actual enrollment
cadence, and both interview descriptions say four questions. English and Chinese changed together.

Crisis aftermath now depends on the current advisor's availability, mode and caring. Practical
support moves only that advisor's open requests by the actual leave duration; unavailable advisors
do not send fabricated responses. Lab offers retain a real active person's identity. Manual play
caught generic help/joke replies that contradicted those offers. Explicit contextual replies now
allow a free acknowledgment without a work update or a hidden gameplay reward.

Unsupported saves are retained as exact inert originals through settings writes, new runs and
slot operations. Unknown activity stages are no longer treated as resumable. A subsequent
incompatibility retains one exact snapshot chain rather than duplicating older archives alongside
the snapshot containing them. Ordinary backup preview discloses preserved files and replacement;
cancellation leaves storage unchanged. Size/quota failures preserve the previous storage value.

A separate exact-original download remains available from initial Saved runs even when escaping
a large original would exceed the ordinary backup's 5 MiB limit. The file is recovery data, not a
promise that this build can resume it. The large-file test uses a quote-heavy 2.8 MB original and
checks exact bytes after a failed settings write. Visually inspected the
[Chinese phone controls](screens/usability/archive-raw-zh-phone.png).

Balance, same harness and 40 seeds per style, compared with the previous supervision pass:

| Style | Before → after PhD endings / 40 | Before → after accepted papers |
| --- | ---: | ---: |
| Diligent | 27 → 24 | 2.1 → 2.0 |
| Lazy | 6 → 9 | 0.9 → 1.2 |
| Grinder | 13 → 15 | 1.8 → 1.9 |

After-pass endings:

- Diligent: product engineer 7, unplaced PhD 7, undeposited 5, ABD 5, no offer 5,
  industry research 4, founder 2, soft money 2, policy 1, fired 1, postdoc 1.
- Lazy: fired 24, no offer 5, unplaced PhD 4, product engineer 2, industry research 2,
  ABD 1, failed exam 1, founder 1.
- Grinder: fired 20, product engineer 8, no offer 5, founder 3, quant 2, unplaced PhD 1,
  soft money 1.

No stuck results. These mixed, small cohorts do not establish better balance. Contextual crisis
responses alter seeded draws and subsequent event paths as well as some request deadlines. Logs:
`/tmp/phdsim-supervision-final-balance.log` and `/tmp/phdsim-care-final-balance.log`.

Final engine checks: 318 passed. Translation audit: zero reached misses in twelve scripted runs
and zero missing UI literals (1,696 scanned). Production build passed with the existing bundle
warning (2,842.01 kB JavaScript, 1,078.35 kB gzip). Final full browser suite: 118 passed in
3.4 minutes. Source was unchanged throughout that run. Final whitespace check passed.
No deployment and no release-ready claim.

Remaining release work includes full natural-run pacing and repeat-run fatigue; spinout terms
whose failure flags and deferred promises need causal review; group scenes that assume drafts or
plots without a suitable project; complete official-source coverage for venue-cycle references;
and keyboard/screen-reader review beyond automated coverage. The fresh-play editorial observations
remain in the story log. Passing tests does not settle those gameplay questions.

The full gate exposed two stale-test problems: the previous Chinese disclaimer heading and an
exact-state pause assertion that allowed the fake clock to keep following wall time after Resume.
The setup assertion now matches the visible short notice. The pause test freezes its clock while
the activity is paused, keeps exact-state assertions, then explicitly advances time to verify
resumption. All five focused pause tests passed after that correction; no gameplay timing was
weakened to satisfy the test.

## Company agreements, group context and saved career language

Closed the prior spinout/group causal findings. Company shares now follow the actual check,
retain their project and founding people across lab changes, and appear in a compact expandable
Manager record. Thesis-first and four-month pauses suppress company tasks; deposit is required
for the optional founder career. Declining unpaid founding remains possible when no other offer
exists. Board membership is independent of employment. Legacy flags receive an explicit review
path rather than reconstructed shares. Group scenes gate their draft/progress assumptions and
remember the actual participating labmate.

Manually played prepared English company terms and Chinese postdeposit career choices at 320px,
including entry into the founder epilogue. Screenshots were opened and visually inspected.
The play caught English wording left in saved noncompany offers: presentation now re-reads the
catalog while preserving identities, pay, equity, saved market and RNG. New CV text stores its
translation reference. The full story review records the revised satire and its limits.

Natural UI-only seed 3733285486 reached October 2028 after coursework and four first-month scenes.
The meeting rooms, stationary choices and advisor-message discovery were inspected in that run.
The checkpoint is preserved outside the repo; this remains a partial run, not a timed full-play
pacing result. Dedicated prepared tests cover stressful entrances, pause/skip and reduced motion.

Balance comparison, 40 seeds per style:

| Style | Before → after PhD endings / 40 | Before → after accepted papers |
| --- | ---: | ---: |
| Diligent | 24 → 27 | 2.0 → 2.4 |
| Lazy | 9 → 7 | 1.2 → 1.4 |
| Grinder | 15 → 13 | 1.9 → 1.9 |

No stuck runs. Event eligibility changes alter subsequent seeded paths; these mixed small cohorts
are not evidence of a statistically established balance improvement. The detailed ending counts
are in `/tmp/phdsim-venture-balance.log`, compared with `/tmp/phdsim-care-final-balance.log`.

Final unit suite: 340 passed. Translation audit: zero reached misses in twelve scripted runs,
zero missing UI literals among 1,707 scanned. Build passed with the existing large-bundle warning
(2,864.37 kB JavaScript; 1,087.15 kB gzip). Full browser suite: 122 passed in 3.3 minutes with source unchanged during the run.

Still open: full natural-run pacing and repeat-run fatigue, the recorded editorial follow-ups,
remaining official venue-cycle source coverage, keyboard/screen-reader review beyond automated
checks, and initial payload size. No deployment or release-ready claim.

## Conversation continuity, manuscript targets and trustworthy previews

Closed the recorded backwards-clock/narrator-as-advisor finding. New conversations separate
speech, narration and automatic replies; old supported histories repair clock order without
rerolling the run. Advisor recency uses actual current-advisor messages and survives the
transition to an ending. All 21 asks have reviewed bilingual drafts and 41 outcome variants.
The visual Chinese pass exposed untranslated new draft/reply fields; the translation adapter
now applies them, and tests require actual Chinese content rather than matching two equally
untranslated values. Older saved draft sources have compatibility translations.

Paper-work plans now honor manuscript locks. Rebuttal and deadline improvements reach the
paper identified by the current window, even if another document is selected. Invalid plans
clear after submission/review actions and cannot start a summons or spend a turn. The scripted
players were corrected to reselect a legal plan after sending a manuscript away; the i18n
audit still requires meaningful full-run coverage before accepting zero missing strings.

Student Portal forecasts share payroll's calculation, including withholding, insurance,
scheduled fees, interest, hardship support and refunds. Settled amounts are labeled separately
from forecasts. Exam dates follow the actual milestone, including retakes. Ctrl/Cmd/Alt-digit
browser shortcuts and composition events no longer select game choices.

Natural seed 3733285486 reached November through the visible UI. Both meeting types and the
new chat/history and finance presentation were visually inspected in local Chrome. The in-app
browser execution tool was unavailable, so the existing local Playwright/Chrome session was
used. Prepared checks cover pressure scenes, phone layouts, Chinese, pause, skip and reduced
motion; natural play is not yet a complete doctorate or a timed pacing measurement.

Balance comparison against the preceding company pass, 40 seeds per style:

| Style | Before → after PhD endings / 40 | Before → after accepted papers |
| --- | ---: | ---: |
| Diligent | 27 → 20 | 2.4 → 1.9 |
| Lazy | 7 → 9 | 1.4 → 1.6 |
| Grinder | 13 → 9 | 1.9 → 1.4 |

All 120 runs completed without stuck states or exceptions. These results include corrected
work targets and scripted plan selection; they establish neither improved balance nor a
final difficulty target. Diligent ABD outcomes increased from 5 to 9, which remains a pacing
and completion follow-up. Full output: `/tmp/phdsim-paper-work-balance.log`.

Final verification: **361 unit tests passed; 127 full browser tests passed in 3.3 minutes**.
Translation audit: zero reached misses across twelve scripted runs (eleven graduates, eleven
beyond month 40) and zero missing UI literals among 1,710 scanned. Build passed; JavaScript is
2,889.39 kB, 1,095.58 kB gzip, with the existing large-bundle warning. `git diff --check` passed.
One earlier browser run was invalidated by a development reload during Room 214: its failure
snapshot showed the setup wizard while the test awaited the exam. The final full run held
source unchanged; the same exam passed in 29.2 seconds. No timeout or gameplay assertion was
relaxed. Logs: `/tmp/phdsim-conversation-final-{unit,i18n,build}.log` and
`/tmp/phdsim-conversation-frozen-browser.log`.

The natural player continued another month in Chinese and now starts December (month 3).
Checkpoint: `/tmp/phdsim-natural-3733285486-december.json`. See the story review for concrete
remaining early-game language/art findings. Full-run pacing, repetition, venue-source coverage,
screen-reader review and payload size remain open. No deployment or release-ready claim.


## Meeting atmosphere, calendar accuracy, and post-submission pacing

Natural seed 3733285486 now reaches the March review window after a January ICMLater submission.
The exact save continued in the updated build through reading the reviews and submitting a
careful response. It returns to normal planning immediately. See [the story review](story-review.md)
for choices, screenshots, the timed-choice inspection caveat, and the latest saved checkpoint.
This remains partial natural-play evidence; full natural degree and post-graduation play is pending.

One-on-one and group entrances use distinct rooms, with calendar, door/projector and room beats.
Real elapsed-time phone frames were visually inspected. The scene text and choices stay stationary;
skip, pause, reduced motion and untimed decisions remain available. Explicitly mild conversations
now retain a routine tone even under background pressure.

Immediate planning refresh after submissions and completed rebuttals does not replay turn setup.
Fractional weeks, daily action allowances, remaining meetings and payroll boundaries are preserved,
including leaving day pace during the first week. The dashboard prioritizes an open rebuttal and
distinguishes under-review work from a completed project. The editor explains its actual lock state
and marks skipped advisor review honestly.

Year-aware holidays and source-backed venue timing are documented in [holiday review](holiday-calendar-review.md)
and [venue review](venue-calendar-review.md). English and Chinese now take the same closure-mail RNG
path. First-year and seasonal prose was revised to avoid unsupported future events, rent changes,
medical outcomes and manuscript gains. New UI wording has paired Chinese.

Final frozen-source validation: **380 unit tests and all 131 browser tests passed**. Both translation
audit counts are zero (12 simulated runs, 11 enrolled/graduated/endings, 1,031 planning turns,
1,723 UI literals scanned). Production build passed; the existing large-bundle warning remains
(2,895.80 kB JavaScript, 1,098.02 kB gzip). The two new browser checks initially hit an ambiguous
selector matching both a tab and a shortcut; narrowing it to the tab fixed the test. The final full
suite above passed uninterrupted.

Balance comparison, 40 seeds per strategy (120 runs each), completed without exceptions:

| Strategy | Before pacing fix: PhD endings / 40 | After: PhD endings / 40 | Mean accepted papers before → after |
| --- | ---: | ---: | ---: |
| Diligent | 22 | 23 | 2.0 → 2.5 |
| Lazy | 8 | 9 | 1.7 → 1.8 |
| Grinder | 13 | 7 | 1.6 → 1.6 |

These are mixed trajectory changes after timing and RNG-consumption corrections, not proof of
improved overall balance. Diligent undeposited endings increased from 2 to 6; grinder outcomes
need further review. Logs: `/tmp/phdsim-venue-balance.log` and `/tmp/phdsim-tempo-balance.log`.

Next concrete editorial issue: rebuttal templates invent specific experiments/table numbers and
assume three reviewers even when the received report contains four. The phone planning screen
also spends substantial space explaining two disabled manuscript plans after submission. These,
the remaining natural degree loop, independent player feedback and assistive-technology review
remain open. No release-ready or hundred-run-freshness claim is made here.


## Meeting continuity and grounded responses

Meeting entrances retain the 1.8-second calendar → door/projector → room sequence, with
stronger shadows and an approach for tense one-on-ones, a separate group-room composition,
and video-call staging. Reading groups, round-table updates, draft discussions and another
student's presentation now have contextual captions. Round-table updates leave the projector
off rather than contradicting the scene's “no slides.” Cancelled appointments show an absent
meeting notice instead of the legacy LIVE office and advisor portrait. Phone title bars grow
to contain the advisor name and put the date on a separate line. Pausing, keyboard skipping,
reduced motion and holding the decision clock during arrival remain intact.

Rebuttal drafts use the actual reviewer count and concern category, acknowledge warm reviews,
and omit fabricated experiments/table numbers. The composer belongs to one manuscript and
submission attempt; changing papers clears it. A review can no longer claim to have read a
response before the response window opened. New review notices report the actual reviewer count.

The manager puts usable plans first, names unavailable plans in an accessible disclosure,
and groups identical reasons. Pending advisor requests outrank the optional next-project
suggestion. Hardship approval now describes $400 on subsequent monthly statements and waived
interest without a fictional nine-week time jump. An early group event no longer calls itself
“week two” in the eighth month. English and Chinese were updated together.

Frozen-source validation: **388 unit tests; 134 full browser tests passed in 3.5 minutes**.
Translation: **0 reached misses; 0 UI misses** across the same 12 runs/1,031 planning turns,
with 1,727 UI literals scanned. Build passed (2,903.17 kB JS, 1,100.92 kB gzip); the existing
bundle-size warning remains. The entire 120-run balance output is byte-for-byte identical to
`/tmp/phdsim-tempo-balance.log`; these changes did not shift the measured trajectories.
Logs: `/tmp/phdsim-atmosphere-final-{unit,i18n,build,balance}.log` and
`/tmp/phdsim-atmosphere-frozen-browser.log`. No browser errors were observed in the natural run.

Natural seed 3733285486 now reaches the first May decision: ICMLater rejected the paper.
The player answered the advisor request and chose to revise evidence through the actual UI.
The manuscript reopened and retained its submission history. Latest checkpoint:
`/tmp/phdsim-natural-3733285486-may-revision.json`. This remains a partial playthrough;
a natural publication, exams, deposit and post-graduation path remain to be verified.

The final visual pass extended the phone title-bar fix to missed meetings as well; the full
browser suite was rerun after that CSS/markup adjustment. Natural play then used the remaining
writing allowance (draft 55 → 75), selected AAAIght in July, and sent the revised manuscript to
the advisor. The UI estimates a one-week reply. Latest exact natural checkpoint:
`/tmp/phdsim-natural-3733285486-may-advisor-review.json`.

## Calm-week and completion follow-up

Manual calendar zoom is now distinct from deadline urgency. Normal activities remain available
while papers are in review, their plan effects and writing allowances scale with the selected
interval, and the meeting/summons atmosphere does not become tense merely because the player
chose Week. Explicit day re-entry preserves spent time. Old saved sprint selections clear
without replaying initialization, payroll, work, or RNG. Genuine paper/exam crunch keeps its
intensive plans. Rest achievements accumulate elapsed rest time.

The completion audit found a flawed automated policy: it spent its revision Energy on optional
networking and left its dissertation selected elsewhere after a paper detour. The player UI
now offers the actual next revision, recovery when needed, and a return-to-dissertation action.
The final funding month cannot promise a defense outside the playable calendar. Revision costs
and graduation criteria were not reduced. See [completion policy audit](completion-policy-audit.md)
for the same-rules comparison and its limitations.

Choice previews now explain when the active manuscript cannot receive advertised effects.
Third-submission narration requires two real rejections of the selected paper; stale queued
or already-open versions cannot charge the player or modify a different manuscript. Dismissal
also clears an old dice result. Paired EN/ZH prose describes the actual decisions without
inventing prior reviewer comments or predicting the next review.

Natural play reached June 2029, including weekly recovery/research and a real advisor venue
conversation. A separately prepared group room and the natural June one-on-one were visually
inspected at phone width. A further ungated oral-exam story appeared eleven months before the
scheduled prelim (`coursework_qual_morning`); it is captured for the next editorial pass, not
counted as an actual exam. The current natural checkpoint is
`/tmp/phdsim-natural-3733285486-june-oral-scene.json`. Full natural degree pacing, more authored
story eligibility, independent-player feedback and assistive-technology review remain open.

Final source validation for this pass: **418 unit tests; 142 full browser tests passed**
(the browser suite completed in 3.5 minutes). Translation audit found **0 reached misses and
0 UI literal misses**, across 12 runs/966 planning turns and 1,740 UI literals. Build passed:
217 modules, 2,912.33 kB JS / 1,104.16 kB gzip; the existing bundle-size warning remains.
`git diff --check` passed. Logs: `/tmp/phdsim-meetings-final-{unit,browser,i18n,build}.log`.
The 240-run same-rules policy comparison is documented separately above. No release-ready or
hundred-run-freshness claim is made, and no deployment was performed.

## Story context and feasible graduation targets

The next pass revised 19 authored scenes in English and Chinese and added context checks at
selection, queue opening, and saved-scene resolution. See [the scene audit](story-eligibility-audit.md)
for the original findings and implemented behavior. An actual advisor read now records the
review cycle and advisor; old feedback cannot be attributed to a replacement PI.

Graduation negotiation now agrees a feasible future month inside the playable funding window.
An early agreement retains the normal year-five target. Asking in month64 gives month66/year6,
not the already-past month57/year5. Missed legacy agreements can be reopened after cooldown;
the final month refuses a new date before charging resources. A planning agreement remains
separate from dissertation approval, defense booking, revisions and deposit. The later-date
concession still costs hope. Fixed-season and invented previous-conversation claims were removed
from the affected dialogue; stored translated concatenations use `joined()`.

Validation: **436 unit tests and 146 full browser tests passed** (browser suite: 3.3 minutes).
Translation: **0 reached misses / 0 UI literal misses**, 12 runs / 1,013 planning turns /
1,744 UI literals. Production build passed: 218 modules, JS 2,921.85 kB / gzip 1,107.03 kB;
the existing size warning remains. Logs: `/tmp/phdsim-context-final-{unit,browser,i18n,build}.log`.

Balance sampled the same 40 seeds per policy: diligent 33 PhDs, 2 dismissals, 5 admission
failures; lazy 9 PhDs, 24 dismissals, 2 exam failures, 5 admission failures; grinder 10 PhDs,
25 dismissals, 5 admission failures. Earlier totals were 35/14/11 PhDs respectively. Eligibility
changes alter the event pool and subsequent seeded draws; this comparison does not isolate
which edit caused an individual outcome. No new balance or hundred-run-enjoyment claim follows.
The reachability probe sampled 319/360 events and 66/118 achievements across 90 runs and exited
nonzero for unsampled content. Its gaps and the three revised scenes not sampled are recorded
in the scene audit. Logs: `/tmp/phdsim-context-final-{balance,reach}.log`.

Natural UI-only seed3733285486 resumed the exact June checkpoint, dismissed the now-invalid
practice without cost, finished June, fulfilled the reading request, and resubmitted the revised
main paper to AAAIght in July. September reviews and an October decision are pending. Save:
`/tmp/phdsim-natural-3733285486-july-submitted.json`. No page errors were observed.
The immediate switch to a side project after submission is a recorded discoverability issue.

The built artifact was served locally at `/PhD-Simulator/`: a clean context loaded the fresh
setup with no saved run and no failed asset responses; the natural save survived reload.
Separate prepared fixtures exercised a late graduation agreement and the 1.8-second meeting
entrances. The calendar, door, final private room, group room and Chinese late-target panel
were visually inspected at 390px. These fixtures are visual evidence, not natural progression.
Screenshots: `production-fresh-desktop.png`, `meeting-context-{calendar,door,room,group}-phone-zh.png`,
`timeline-late-target-phone-zh.png`, and `natural-july-submitted-phone-zh.png` under
`docs/screens/usability/`. Portable restore on the production artifact, a complete natural
degree trajectory, independent-player feedback and spoken assistive-technology review remain
open. Nothing was deployed.
