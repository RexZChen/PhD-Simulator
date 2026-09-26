# Story and translation review — September 26

This pass treats a story as **trigger → decision → immediate consequence → later consequence**.
The standard comes from `spec.md`: plausible situations, imperfect information, and decisions
that create connected stories. The institution can be absurd; the narrator should not invent the
player's history, promise an unmodeled reward, or tell the player what their life meant.

English and Simplified Chinese were reviewed together. Chinese should preserve the implied
relationship and uncertainty, rather than merely retain every word. Automated translation coverage
is useful evidence of completeness, not proof of natural prose or a compelling scene.

## Arc review

| Trajectory | Problem found | Revision and consequence |
| --- | --- | --- |
| Outreach → interview → admission | Future paper dates, presumed rejection, and recruiting replies despite no openings. | Replies use actual openings; interview lines fit the application year and leave the result unresolved. |
| Recommendation reminder → submission | A reminder was mostly flavor; later processing could overwrite its result. | Bind the pending writer. Timely, late, and shorter-letter outcomes survive submission; the tradeoff concerns that writer's letter. |
| Early advisor meetings → recurring contact | Repeated cancellations invented long histories and successful responses promised unsupported future behavior. | Immediate, specific responses with more limited promises, in both languages. |
| One-on-one → difficult follow-up | Meetings arrived like any other modal. | A skippable 1.8-second calendar/door entrance, followed by a room reflecting current pressure. A difficult answer can still trigger the existing follow-up. Decision time is held during the entrance. |
| Group meeting → public feedback | Third submissions, years of work, permanent respect and future loyalty were asserted without evidence. | Removed unsupported histories and guarantees across ten group scenes. A projector/table entrance distinguishes the social setting; only active labmates appear. |
| Paper rejection → advisor help → revision | Rejection help could improve another paper; initial reviews referred to an unwritten rebuttal. | Help belongs to the active, fully reviewed rejected submission, once per successful discussion. Refusals remain retryable after cooldown. Initial reviews discuss the manuscript. |
| Fellowship application → result → CV | An unfunded honorable mention could become a funded fellowship, and appear without an application. | Submission schedules an April result. Recognition records $0 under awards and cannot unlock funded-fellowship achievements. |
| Existing partner → deadline strain → repair or separation | Character-creation partners were ignored; one postponement automatically led toward breakup. | Starting household is respected. A later invitation offers a repair decision; repeated postponement can lead to separation. A new relationship does not inherit the former partner's city. |
| Illness or crisis → care/time decision → aftermath | Fixed illness durations, predicted recurrence dates and recovery guarantees; aftermath assumed leave/teaching coverage. | Immediate care, workload and cost choices with uncertain follow-up. No invented teaching duties or guaranteed recovery. |
| Advisor departure → reassignment | The new PI was added to published authors; old requests disappeared; translated history could adopt the new name; authored outcomes were overwritten. | Preserve authors, external reviews, milestones, messages and letters. Withdraw old requests; return pending internal reads to the intact draft. Archive departed identities and prevent them being selected again. |
| Advisor industry leave → internship and remote meetings | The choice awarded cash and described a summer without booking one; the off-campus PI could still appear in the office. | Confirm a real paid research placement for the next available summer, preserve mentor identity, prevent double booking, and keep future work off the completed CV. Remote meetings use a video entrance and a compatible story pool, with three new bilingual scenes. |
| Deposit → deferred ceremony → career | Ceremony attendance and career assumptions leaked into unrelated paths. | Deferred ceremony is optional and does not assume a salary or job. Each of twelve career tracks gets a relevant promised scene. |
| Career → later decisions → final judgment | Several routes shared faculty assumptions; the final answer prescribed a positive verdict. | Career-specific decisions and three equally valid final positions: do it again, choose differently, or describe without deciding for someone else. Advisor news is stage-aware and stable across renders. |
| Twelve career summaries | Guaranteed employment/renewal, universal benefits, and prescribed personal meaning undermined the later choices. | Two short paragraphs per career now describe the first days and the actual tension. Chinese was rewritten with them. Completed postdoc epilogues no longer append an obsolete two-year prediction. |
| Ordinary departure | Leaving guaranteed wealth, recovery, another doctorate, or reapplication. | Eight continuations leave those decisions and outcomes open. Immediate exit text identifies what has actually happened. |

## Examples of the intended register

The partner's follow-up uses a calendar invitation with the same Accept button as an advisor's
meeting. The choice is whether the player protects that time; the repair outcome does not claim
that two hours fixes a relationship.

The postdoc scene gives a renewed contract with an unchanged title. The PI wants a paper before
the next job search. The player can set a stopping date or apply while the work continues. Both
choices acknowledge finite time, rather than making one a disguised correct answer.

The unfunded award remains a real line on the CV. It does not become money because the prose
calls it recognition. The satire depends on the difference between those two things.

## Play evidence and limits

Played prepared browser checkpoints, using Chrome at 390 × 844 with enlarged text:

- English one-on-one entrance → ask for specific changes → advisor follow-up → show the evidence.
- Chinese group entrance → public correction → promise to verify and reply.
- Chinese relationship postponement → prepared later invitation → keep the appointment; verified
  the saved relationship remains intact and the strain flag clears.
- Chinese deferred ceremony → coffee invitation → postdoc decision → labmate message → final
  judgment. These are five actual UI choices after a prepared graduation checkpoint.

Additional prepared checkpoints were played for this continuation: Chinese industry leave →
confirmed June–August internship; Chinese remote shared draft → outline decision → pressured
follow-up → a realistic date; English remote group correction → check the evidence live; and
English bereavement → committee handover, plus Chinese continuation of the shared paper.
The old advisor’s LabChat messages keep their name/avatar and are marked archived; they cannot
generate a new reply after the handover. This was found through the actual message controls. The remote scenes were viewed at 390 × 844 and
1280 × 900. The shared-document scene now requires an actual editable draft. Bereavement omits
the inherited generic meeting joke. The large-text sidebar label no longer splits “Confidence.”

Visuals: [remote one-on-one in Chinese](screens/usability/meeting-remote-phone-zh.png),
[remote group meeting](screens/usability/meeting-remote-group-desktop.png),
[bereavement choice in Chinese](screens/usability/advisor-handover-phone-zh.png),
[the archived conversation](screens/usability/advisor-archive-phone-zh.png).

These are branch playtests, not a claim that twelve career paths were each played naturally from
application through graduation. The engine checks all twelve promised career beats and final
choices. The random-run translation audit cannot establish that every rare branch reads well.

Visual examples: [one-on-one](screens/usability/meeting-private-phone.png),
[group meeting in Chinese](screens/usability/meeting-group-phone-zh.png),
[relationship repair](screens/usability/relationship-repair-phone-zh.png),
[postdoc choice](screens/usability/postdoc-choice-phone-zh.png),
[the final verdict](screens/usability/epilogue-verdict-phone-zh.png).

Verification: 242 unit tests, 93 browser tests, translation audit (zero misses in both counts),
and production build pass. Regression checks include real recommendation status, paper-scoped
advice, relationship follow-ups, unfunded recognition, all twelve career beats, stable advisor
news, meeting timing/skip/reduced motion, and nested dialog focus. The production bundle remains
large; the build warning is recorded in the release-readiness log.

## Remaining narrative work

1. Retirement and tenure now have ongoing, dated arrangements (see the review below). Mixed
   succession histories still need more natural play: transfer, replacement, retirement and prior
   internships can all coexist in a long run. Old letter records with ambiguous names cannot be
   assigned an identity safely.
2. The fellowship arc is an authored honorable-mention outcome, not a general fellowship
   competition. The two application choices trade current workload, not different award odds.
3. Crisis advisor responses still draw from a shared pool rather than caring/availability.
4. Some group scenes infer a draft, figure, or debugging episode from broad progress gates.
   Finer manuscript context and follow-up memory would make them more personal.
5. Rare visa, institutional, catastrophic, patent and spinout branches have not all received the
   same bilingual editorial pass. Nothing here verifies real-world policy or deadline accuracy.
6. Full natural runs, repeat-run fatigue, new-player comprehension and feedback from Chinese
   readers remain necessary. Passing tests cannot establish enjoyment.

The game remains a static browser application for GitHub Pages. No service or native runtime is
needed by this pass.

## Recovery, consequences, and time

Reviewed the collapse, repeated untreated-health and high-stress branches in both languages.
Their satire now concerns paperwork and institutional expectations. They do not invent a diagnosis,
an age at death, or a future degree and faculty job. Continued care is an explicit option; medical
withdrawal is labeled as ending the run. Legacy ending IDs still render saved outcomes.

The story previously promised leave while daily turns still credited work, and a resolved crisis
record prevented any subsequent crisis from opening. Both contradictions are fixed. Acute scenes
use the current continuous episode rather than a lifetime total of difficult months. Taking care
clears an earlier refusal; a past refusal is no longer a permanent route to a scripted death.

The four-week plan displays the actual insurance-adjusted bill, cash/debt split and advisor-request
extension. External dates stay fixed. A recovery plan is selected automatically while leave covers
the turn. Routine meetings and compulsory lecture scenes are excused, and the remaining time is
visible after reload. Personal choices and administrative news can still occur during leave.

Manual Chrome play used prepared checkpoints, then ordinary choices through recovery and into the
next month, an interrupted season, and a healthy January–March season. It exposed a compulsory-class
contradiction and unreadable report columns that code-only checks had missed. Both were corrected.
This is branch validation, not evidence that every story or a complete natural run has been reviewed.
The ordinary crisis dialog still describes its treatment costs qualitatively; the precise quote is
currently on the four-week support-plan scenes. Crisis-advisor response personalization remains open.


## Retirement agreements and one tenure clock

Reviewed the retirement, tenure result, denial and eventual departure choices in English and
Simplified Chinese. Each retirement route now appoints a successor. The co-advising choice asks
whether the retiring advisor will remain a second reader; failure still gives the student a new
primary advisor. Success exposes an optional monthly consultation: 4 Energy for readiness and
stress relief, plus research/evidence on an editable active paper. Submitted work is not rewritten.
The emeritus mentor remains a distinct recommendation writer. Trouble with the successor cannot
change the former mentor’s letter.

The funded handover identifies a project and three future payroll months, shortened if the program
ends sooner. It guarantees the base RA stipend and excuses TA work, in exchange for monthly
maintenance. Leave excuses the work without extending the funding dates. Ordinary funding returns
on the first uncovered payroll, including a year-six shortfall. No student becomes a faculty PI by
selecting “inherit the lab.”

A tenure outcome is committed when its announcement opens, before the player answers. It survives
save/reload without rerolling, belongs to a particular advisor at a particular school, and cannot
compete with another tenure outcome. Denial creates twelve months of notice. Expressing interest in
following is not a signed transfer and costs no moving deposit. The departure decision offers
actual terms at the end of the notice. A new advisor or an actual campus arrival closes the prior
record; the next appointment gets its own grace period.

Legacy flag-only retirement with no attributable former advisor queues a review of the concrete
arrangement. It does not invent a historical successor or back-pay. Legacy denial without a dated
record receives a new twelve-month notice instead of forcing an immediate departure. Ambiguous
older histories remain a compatibility limit; global event history is not treated as proof of a
particular person’s identity.

Manual Chrome play used prepared checkpoints, then actual choices, consultation and reloads at
320/390 px and a desktop meeting at 1280 px. The first retirement and denial layouts hid their
choices beneath duplicated paperwork. They now show a short setup, terms beside the retirement
option and a compact tenure date; the manager retains the full record. A generic meeting meme was
removed from tenure announcements because it contradicted the scene. The ongoing cards disclose
costs and dates in both languages.

Examples: [retirement in English](screens/usability/retirement-choice-phone-en.png),
[retirement in Chinese](screens/usability/retirement-choice-phone-zh.png),
[an emeritus consultation](screens/usability/emeritus-mentor-phone-en.png),
[the funded agreement](screens/usability/handover-agreement-phone-zh.png),
[the denial choice](screens/usability/tenure-choice-phone-zh.png) and
[the persistent notice](screens/usability/tenure-notice-phone-zh.png).

Re-inspected the meeting entrance from its [calendar card](screens/usability/meeting-arrival-card-phone.png)
to the [office](screens/usability/meeting-arrival-room-phone.png), and the
[Chinese group meeting](screens/usability/meeting-arrival-group-desktop-zh.png).
These remain brief, skippable scenes; reduced motion shows the room immediately. The decision timer
does not run during the entrance. This is visual branch testing, not a claim of full natural-run
coverage or proof of replay value.

Verification for this pass: 303 unit tests and 109 browser tests passed; the translation audit had
zero reached misses and zero missing UI literals, and the production build passed. The full browser
suite includes entrance timing, pause, keyboard skip, reduced motion and bilingual supervision
reloads. Balance comparisons and remaining limitations are recorded in the release-readiness log.

## Fresh admissions play and support after a crisis

A fresh Chrome context followed only visible choices from applicant setup through enrollment and
the first research project. Seed 3733285486: Alex Chen, research master's, extensive experience,
one prior publication and international status. The run prepared a statement and three letters,
contacted Applewhite and a current student, then submitted five tailored applications. The fee
waiver and late-letter scenes both appeared. Stanfurd and UT Awesome offered interviews; neither
admitted the applicant. Aloha State offered an RA place with Wexford. The player asked about a
stalled project and funding, consulted a student, accepted and started a project in September 2028.

This was not a timed uninterrupted run: development reloads required resuming the same autosave.
No engine shortcuts were used to advance this natural run. The downloaded continuation checkpoint
is `/tmp/phdsim-natural-3733285486-first-project.json`. Six-year pacing and repeat-run enjoyment
remain unverified by this playthrough.

The play exposed a meeting-frequency question answered with draft turnaround. That answer now
uses the same advisor availability, ambition and lab-size rules as the enrollment schedule, in
English and Chinese. The status page's three-question claim now agrees with the four-question
interview. Offers no longer repeat their guidance in a second notice. One rejection observation
now describes the player's calculator and unchanged portal letter, rather than telling the player
that rejection is a judgment of them.

Setup now starts with a short fictionality/advice notice and an optional full disclaimer. The
acknowledgment still gates progression. Checked keyboard disclosure and checkbox operation at
320 px with enlarged Chinese text. Examples: [desktop setup](screens/usability/setup-refined-en.png),
[Chinese phone setup](screens/usability/setup-refined-zh-phone.png) and the natural run's
[first project](screens/usability/natural-first-project.png).

Separate prepared crisis checkpoints checked causality rather than natural event frequency.
Advisor availability and current mode decide whether a reply arrives; caring affects what that
reply offers. Practical support actually moves only the current advisor's open request deadlines
by the chosen leave duration. Submitted-paper decisions, venue deadlines and former-advisor
requests stay intact. An unavailable advisor produces no fabricated reply. Offers of help come
from an active, identified labmate and do not claim a task was already completed.

Playing that exchange revealed another mismatch: the generic chat classifier offered to help
the person who had just offered help. Crisis messages now have explicit contextual responses.
Support can receive a free thank-you without a work update; the same person acknowledges it.
There is no hidden health reward, invented task completion or looping reply chain. Demanding
advisor messages do not offer incongruous gratitude. Reactions remain available. Inspected the
[English exchange](screens/usability/crisis-support-reply-en.png) and
[Chinese labmate offer](screens/usability/crisis-support-zh-phone.png).

Remaining editorial observations include generic interview trait hints that can dodge the precise
question, acceptance copy claiming there is no button beside a visible Begin button, and chat
display timestamps that can put a reply before its parent. Ordinary crisis options still quote
costs qualitatively. These are recorded findings, not claims of completed story coverage.

Saved runs now distinguishes a resumable backup from an unsupported original. Exact-original
download remains available even when backup wrapping would exceed the size limit. The
[Chinese phone layout](screens/usability/archive-raw-zh-phone.png) was visually inspected; English
and Chinese browser checks exercise the download, preview, cancellation and reload paths.

Final verification: 318 unit checks and 118 browser checks passed, including the complete meeting
entrance, pause and reduced-motion suite. Both translation-audit counts were zero and the build
passed. The release-readiness log records the balance comparison and remaining limits.

## Recorded company terms and grounded group scenes

The spinout arc now carries a persistent agreement rather than independent flags. A disclosure
binds an accepted paper from this run, its advisor and its institution. The selected unfinished
manuscript cannot silently become the invention, and changing labs cannot rewrite the founders.
The cap-table choices say that negotiation is followed by signing: a failed check retains 40%,
a successful advisory negotiation gives 50%, and a successful university negotiation gives 42%.
All four allocations are visible and sum to 100%. Patent royalties remain separate.

The company route has explicit limits. Protecting degree work suppresses company workload;
a successful request for a temporary pause lasts four actual months. Keeping a board role does
not supply an academic job or $1,800. Leaving immediately ends the doctorate unfinished. Choosing
to finish first adds an optional, unpaid founding choice only after a real thesis deposit and
completed degree. With no job offers, continuing the search remains a selectable alternative.
The unrelated Nightjar employer no longer claims the player's patent or advisor. Older saves
with company flags can review a new proposal; missing ownership records are never invented.

Reviewed and translated all seven company scenes, including success/failure outcomes and the
legacy review. Group scenes now require the editable draft or developed research they discuss;
the strong round binds an actual labmate. Deferring a discussion does not narrate a completed
check or a booked meeting. The orientation hint no longer exposes an implementation flag.

Manual prepared play: failed negotiation in English, expanded persisted agreement, and Chinese
career choices at 320px. The Chinese play caught stored English offer copy outside the company
card too. Offer wording now follows catalog identity without rerolling pay, terms or the market;
new CV lines retain translation provenance. The no-job option no longer invents an April defense
or May outcomes for the entire cohort. See [agreement](screens/usability/venture-agreement-en.png),
[career choices](screens/usability/venture-choice-zh-phone.png) and
[chosen founder](screens/usability/venture-joined-zh-phone.png).

Continued the natural UI-only seed 3733285486 from enrollment through September and into October:
coursework, the international-arrival scene, one-on-one, reading group, orientation and the monthly
statement. These natural meetings were supportive/routine, as expected for this advisor, rather
than using pressure visuals for every encounter. Inspected the
[one-on-one](screens/usability/natural-first-meeting.png),
[group](screens/usability/natural-first-group.png) and
[advisor message picker](screens/usability/natural-advisor-message-picker.png).
The October checkpoint is `/tmp/phdsim-natural-3733285486-october.json`.

This is still partial natural play, interrupted by development reloads. The long international-
arrival scene and the existing interview/timestamp observations remain editorial follow-ups;
no complete natural PhD run or hundred-run freshness claim is established here.

Final verification for this pass: 340 unit tests, 122 browser tests, both translation audit
counts zero, production build passed. No stuck runs in the 120-run balance comparison.

The October advisor check-in reproduced the earlier timestamp finding: the player sends at
17:04 but the immediate reply displays 14:33. That reply is also narration ("They tell you…")
rendered under the advisor’s name, and presence still reads "Last seen 3 weeks ago". The
[screenshot](screens/usability/natural-advisor-checkin.png) records this unresolved continuity
problem for the next conversation pass. The saved checkpoint includes this actual UI exchange.

## Advisor speech, silence and work that reaches the paper

Reviewed all 21 advisor asks and their 41 outcomes in English and simplified Chinese. Each
outcome now separates a spoken reply from the narrative history entry. Silence and automatic
replies appear as noninteractive conversation notes, without the advisor's avatar or reaction
buttons. A written update still earns its stated trust benefit when the advisor is away, but
does not manufacture an acknowledgment. Rewrites remove unsupported claims about progress,
booked appointments, adjusted deadlines, family circumstances and promised meeting frequency.

The October clock repro is fixed at message creation: replies cannot precede questions.
Supported old saves repair the decorative timestamps without changing conversation order or
consuming randomness. The transition into an ending preserves the same calendar period.
Advisor recency follows messages from the current advisor, excluding automated replies and
narrative notes; it no longer repeats a fixed “last seen three weeks ago” description.

The Chinese visual pass caught a gap the earlier equality-based test missed: the language
switch translated outcome narration but omitted the new reply fields and message drafts.
It now applies both, with all 21 drafts translated explicitly. Stronger checks require actual
Chinese text against independent translations. A compatibility dictionary also translates
older saved outgoing drafts. See the natural run's
[English exchange](screens/usability/natural-advisor-update-en.png) and
[Chinese phone history](screens/usability/natural-advisor-update-phone-zh.png).

The parallel causal review found an apparent “work” choice that spent resources while the
submitted manuscript rejected its effects. Rebuttal preparation now improves the specific
paper under review; deadline work remains attached to its selected deadline paper. Locked
manuscripts explain why ordinary research/writing is unavailable. Sending a draft away clears
an invalid plan before a summons can begin. Generic manuscript immutability remains intact.

Natural UI-only seed 3733285486 continued through October into November: a written update,
research, teaching screening, the napkin one-on-one, cluster discussion at group meeting,
Halloween and the monthly statement. Screenshots of the
[one-on-one](screens/usability/natural-october-meeting.png),
[group meeting](screens/usability/natural-october-group.png), and
[actual November budget](screens/usability/natural-portal-budget-en.png) were visually reviewed.
The portal now reports the same recurring expenses and income as payroll, including its deficit.
This remains a partial natural playthrough; the lengthy first-year administrative scenes and
full-run pacing still need editorial attention.

The same player then continued November in Chinese: emergency support from the portal, another
research month, the extra-baseline meeting, Friendsgiving and helping the struggling labmate.
The next checkpoint is `/tmp/phdsim-natural-3733285486-december.json` (month 3, planning).
The new project reached 41 research progress; Energy was 38, Hope 82 and Health 92. This is a
concrete next-turn recovery/finance decision, not evidence of finished whole-run balance.
Editorial follow-ups observed on screen: the project-kind label remains “main project”, the
next-milestone label uses the awkward “下一份”, and “argue 这超出范围” is an unfinished translation.
The default flu meme is a poor match for `firstyear_lab_quiet_struggle`; review its art/tone.

Closed a final response mismatch introduced by treating authored answers as generic chatter:
a postdoc rejection containing “offer” no longer invites celebration or boasting. Advisor ask
answers end their authored exchange; the message picker remains available for further asks.


## Calendar, first-year scenes, and the first submission

Continued natural UI-only seed 3733285486 on a fixed production build, from December through
February and into the March review window. Moving the exact December save to a separate local
origin prevented development reloads from interrupting scenes. December included rest, writing,
a narrow question at group meeting, holiday work and a paperwork choice. The timed deadline
conversation expired during inspection; untimed choices and self-paced activities were then
enabled through Reading & comfort in January. That timeout is not a fair human pacing measure.

January's target slowed time to weeks. The player completed a related-work request, revised a
figure, sent a 66%-draft/41%-research manuscript to an unavailable advisor, chose to skip the
final read, and submitted to ICMLater through the actual wizard. A forced sleep turn exposed
a stale deadline snapshot. After the next scene queue, time returned to the monthly view.
February coursework led into March reviews (5 / 5 / 5 / 8) and a successful hardship-support
request. The natural checkpoint is `/tmp/phdsim-natural-3733285486-march-planning.json`.
The paper has not yet been accepted; this is still a partial run, not full-degree evidence.

Observed presentation: [December group](screens/usability/natural-december-group.png),
[first submission](screens/usability/natural-first-submission.png), and the exact March save
opened in the updated build at [390px in Chinese](screens/usability/natural-reviews-phone-zh.png).
The updated dashboard prioritizes the open rebuttal. It no longer calls a submitted paper finished.

The follow-up fixes release completed submission/rebuttal deadlines immediately, preserve spent
days and action allowances, and count only remaining meeting slots. Coursework, recovery and
another project become available without a compulsory sleep turn. Partial months explicitly
name the remaining working days. Locked drafts explain their real state rather than demanding
35% research again. Skipping advisor review is labeled as skipped, including in the progress rail;
it does not become approval in the next screen.

Editorial review shortened the arrival checklist and teaching screening, bound the struggling
student to an active labmate, and removed the unrelated flu meme. Seven holiday scenes now avoid
contradictory heating, invented travel/time jumps, unsupported tax-letter schedules and imaginary
labmate careers. The post-deadline choice now practices explaining an idea, earning presentation
readiness instead of silently discarding progress on a locked submission. The renewal and clinic
scenes describe their actual one-time charges, records and effort, without pretending the engine
changed rent, moved the player or scheduled future medical care. All changes have paired Chinese.

The [holiday review](holiday-calendar-review.md) records year-aware movable holidays and the
closure-mail locale/RNG fix. The [venue review](venue-calendar-review.md) records seven additional
official references and the distinct KDD summer/winter schedules. Both deadline displays and
the simulation use the same timeline calculation. Future in-game dates remain projections.

Two explicitly mild middle-year meetings now keep a routine entrance and no decision countdown,
even when the advisor is otherwise pressed. Threatening scenes retain their tension. Separate
prepared-scene visual checks captured real elapsed-time frames at 390px: [calendar](screens/usability/meeting-live-calendar-phone.png),
[opening door](screens/usability/meeting-live-door-phone.png),
[room](screens/usability/meeting-live-room-phone.png). The choice text stays stationary. These prepared
frames are presentation evidence, separate from the natural playthrough above.

Remaining observed editorial work includes the hardship-support outcome claiming nine elapsed
weeks during an immediate choice, and generic meeting/event paper-progress pills when no editable
manuscript exists. The publication wizard also retains several confirmation-only steps; assess
their repetition across more submissions. These findings are not cleared by passing tests.

Continued the exact March checkpoint in the updated build: read the four reviews, chose the careful
response, reviewed the composed text and submitted it. The manager returned immediately to
monthly planning, with the manuscript still locked and the May decision still pending.
[After rebuttal, phone](screens/usability/natural-after-rebuttal-phone-zh.png). Latest natural
checkpoint: `/tmp/phdsim-natural-3733285486-march-after-rebuttal.json`. This interaction also
exposed a priority for the next editorial pass: the canned careful response refers to three
reviewers, a table and extra experiments that do not match these four actual reviews. The
response must be grounded in the received concerns rather than inventing completed work.


## March → May: actual meetings and the first rejection

Continued the natural Chinese run from the March response without outcome manipulation.
Answered two writing requests, studied in March and April, made time for dating, presented
preliminary work, took partial spring-break rest, completed training, responded to a missed
appointment, explained a reading-group paper, answered prospective students honestly and
asked for clarification in a group meeting. ICMLater rejected the paper in May (the earlier
scores were 5 / 5 / 5 / 8). Answered a review request and chose “Revise evidence.” Draft
reopened at 55%, research remained 41%, and the January submission record remained visible.
The updated production build resumed the exact May checkpoint before that revision.

Visual findings led to two direct meeting fixes: the wrapping advisor name escaped the old
24px title bar, and cancelled appointments retained a LIVE office portrait. Both are corrected.
The “Group meeting, week two” title appeared seven months after enrollment; it now describes
learning the lab's language without claiming a date. The Chinese hint for asking a question
now says “当众提问；更早弄懂” rather than declaring the player embarrassed.

Prepared tense-meeting frames, observed at real elapsed time on a 390px phone:
[calendar](screens/usability/meeting-final-calendar-phone.png),
[opening door](screens/usability/meeting-final-door-phone.png),
[settled room](screens/usability/meeting-final-room-phone.png).
The exact April checkpoint was also viewed in the latest build:
[reading group](screens/usability/meeting-reading-phone-zh.png).
A separate prepared cancellation verifies the absence of a live advisor:
[missed meeting](screens/usability/meeting-cancelled-phone-zh.png).
These are explicitly presentation checks, separate from the natural sequence.

Replayed the exact March review checkpoint in an isolated browser context to inspect the new
[Chinese response](screens/usability/grounded-rebuttal-phone-zh.png). It addresses all four
reviewers, distinguishes the positive fourth review, and no longer invents a table or five
completed runs. Its submission returns to usable monthly planning; the
[phone plan list](screens/usability/planning-available-first-phone-zh.png) now shows available
choices before shared unavailable reasons. The disclosure works by keyboard, and the advisor
request is the next-step prompt. This replay did not replace the natural May trajectory.

Natural [May rejection screen](screens/usability/natural-may-rejection-desktop.png).
Latest natural save: `/tmp/phdsim-natural-3733285486-may-revision.json`.

Remaining concrete editorial/UI observations: two mild reviewer concerns can still receive
identical response wording; “confidence” remains English in the Chinese review card; rejected
paper narration repeats a limp metaphor; generic effect pills can promise manuscript progress
when the current paper is locked. Assess confirmation-only submission steps and scene-queue
length across further submissions. Natural full-degree pacing and independent-player feedback
remain open, irrespective of the passing automated gates.

Continued from the May revision: completed the remaining writing allowance (+20 draft),
selected July AAAIght as the next target, and sent the manuscript for advisor review. Waiting
plans now offer networking, career work, life admin and rest, with research/writing reasons
available in the disclosure. Latest save:
`/tmp/phdsim-natural-3733285486-may-advisor-review.json`. No resubmission or acceptance yet.

## Calm weeks, actual pressure, and manuscript history

Natural seed 3733285486 continued from the May advisor-review checkpoint through the real UI.
The player chose a closer weekly view, rested, attended an unscheduled summons, and asked
Wexford's permission to collaborate with Quintero. That check succeeded. The main paper became
Ready (69% draft, 41% research) while the new side project became active (15% research).
No acceptance or resubmission was forced. The exact checkpoint is
`/tmp/phdsim-natural-3733285486-may-week-one.json`.

This exposed a pacing bug: manual weekly zoom reused deadline sprint plans, shortened advisor
review, raised summons pressure and called the month a deadline. While the manuscript was
locked, this left only Sleep available. A closer calendar view now retains ordinary activities
with duration-scaled plan effects and writing allowances. Genuine deadlines still use sprints.
Returning explicitly to day pace preserves spent days and action budgets. Old saves clear an
obsolete plan selection without replaying payroll, RNG or work. Rest achievements count time,
not the number of small turns. Pressure captions and timers follow actual context.

The updated production build resumed the exact save. The player chose a week of Rest and
Energy rose from 29 to 39. The [phone planning screen](screens/usability/natural-calm-week-phone-zh.png)
shows ordinary activities and the chosen one-week duration. The following random scene exposed
another concrete inconsistency: `midphd_third_submission` had no conditions and narrated a
third submission for the active side project, which had no submission history. The main paper
had only one rejected attempt. The saved diagnostic scene is
`/tmp/phdsim-natural-3733285486-may-third-venue.json`; it is not evidence of three submissions.

Scene previews now omit manuscript deltas that the engine would discard for the selected
locked paper. A compact “Paper unchanged” indicator and one shared explanation replace
repeated long warnings. A separately prepared [Chinese group meeting](screens/usability/meeting-group-room-phone-zh.png)
was visually inspected with this explanation. This screenshot verifies presentation, not a
naturally encountered meeting or a new story outcome. Review-card confidence and rebuttal
plan descriptions were also corrected in Chinese/English without inventing a reviewer count.

The third-submission scene now requires an editable active manuscript with exactly two
completed rejected attempts. Queue opening rechecks that history. An already-open invalid
scene from an older save dismisses without costs or paper mutation. Its paired English/Chinese
copy describes preparing another submission, without inventing an April review, a third venue,
a six-day time jump, or the next reviewers' verdict. Seven focused regressions cover selection,
queue invalidation, all three stale choices, real revision effects and deferred turn startup.

The exact invalid natural checkpoint was resumed in the updated production build and dismissed
through the UI: month/week, player stats and both papers were unchanged. Continued naturally:
researched the side project to 21%, corrected a number with the generating script after a
meeting, fulfilled a figure request, rested, read the May report and entered June. A new request
to move the meeting is still open. Main paper remains Ready, awaiting July AAAIght. Current
natural save: `/tmp/phdsim-natural-3733285486-june-plan.json`. No browser errors recorded.
A stale dice-result popup observed on the no-cost dismissal prompted a separate regression;
it must clear the previous roll rather than presenting an unrelated result again.

A naturally encountered [June advisor conversation](screens/usability/natural-june-meeting-phone-zh.png)
shows the warmer room during a venue discussion, without deadline pressure being imposed by
manual pacing. Choosing a nearer target set the side paper's July target; the main paper's
existing target remained intact. The subsequent `coursework_qual_morning` scene incorrectly
narrated an exam eleven months before the scheduled prelim. This scene has not been resolved;
its exact checkpoint is `/tmp/phdsim-natural-3733285486-june-oral-scene.json`. This is the next
concrete narrative eligibility issue, not a completed preliminary examination.

Final verification after clearing the stale dice result: 418 unit tests and 142 full browser
tests passed; EN/ZH reached/UI translation misses remain zero. These checks establish the
specific behavior covered, not the coherence of every authored event or every natural run.

## Follow-through from the premature oral scene

The 19-scene [context audit](story-eligibility-audit.md) is implemented in both languages.
The mock oral now says it is practice before presenting choices, appears only near the scheduled
prelim, and never decides the real exam. Teaching, relationship, pet, climate and manuscript
history now gate their respective scenes. Rewrites retain concrete satire without assigning
the player untracked debt, a diagnosis, a prior rejection, or someone else's project history.

Resumed the exact saved June scene in the updated production build. Choosing the honest answer
dismissed its stale context without changing Energy43.07, readiness65.5, month9/week4 or the
scheduled month20 prelim. Then asked labmates about the inherited evaluation harness, read the
June report, entered July, fulfilled the reading request, and submitted the revised main paper
through every OpenRegret wizard step. The January ICMLater rejection remains in its history;
the July AAAIght attempt is pending. No natural acceptance, exam or degree completion is claimed.

The receipt was initially hidden by automatic selection of the side project. Selecting the
submitted manuscript exposed its actual September review / October decision schedule. This
is the next observed submission UX issue, not a submission failure. Latest natural checkpoint:
`/tmp/phdsim-natural-3733285486-july-submitted.json`.

Prepared production-build phone fixtures also showed the tense private and group entrances,
and a January2034 finishing conversation that correctly agreed March2034. Their screenshots
are separate from the natural playthrough. Validation passed 436 unit / 146 browser checks,
with zero reached/UI translation misses. The 90-run content probe still has unsampled scenes;
see the eligibility audit for the limits of that evidence.
