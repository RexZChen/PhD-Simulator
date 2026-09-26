# Authored scene eligibility: review and implementation

The review began with natural seed3733285486, June2029. Diagnostic save:
`/tmp/phdsim-natural-3733285486-june-oral-scene.json`. The open event is
`coursework_qual_morning`, month9, while the scheduled prelim is month20. The table below
preserves the issues found before implementation; the follow-up records what changed.

All IDs below are in `src/data/events/more.js`.

| Priority | Event IDs | Required story/mechanics alignment |
| --- | --- | --- |
| First | `coursework_qual_morning`, `coursework_qual_syllabus`, `coursework_qual_study_group` | No conditions. Make the oral explicitly a mock; keep the real exam in its milestone workflow. Require an unpassed prelim and a preparation window relative to `milestones.prelimMonth`, including retakes. Remove invented nine-month countdown and October–January group history. |
| First | `midphd_reviewer_misread` | Require actual completed full-review rejection of the active editable paper. Current rebuttal wording promises work that generic effects discard on Rebuttal papers. Frame choices as revision/response notes; remove invented score, table, metareview and quotations unless supplied by that paper's record. |
| Next | `firstyear_advisor_first_draft_returned` | Current maxMonth15 does not establish returned advisor feedback. Require actual returned-review history and an editable draft. |
| Next | `firstyear_advisor_inherited_project` | Cannot assign another author's two years/two rejections to whichever paper is selected. Establish provenance or offer an external repository without rewriting current project history. |
| Next | `midphd_dead_branch`, `midphd_old_repository` | Use active-project age and editable-work eligibility; remove untracked eleven/eighteen-month branch/repository claims. |
| Next | `coursework_office_hours`, `coursework_grading_night`, `coursework_student_over_head` | Require TA assignment and teaching term. |
| Next | `coursework_midnight_pset`, `coursework_requirement_class` | Require coursework stage and teaching term. Committee invitation should be exploratory unless it actually adds a member. |
| Next | `firstyear_life_first_check` | maxMonth15 permits first-pay/orientation scenes after many paychecks. Restrict to arrival, once. Credit/advance choices currently add cash without the promised debt/repayment; implement accounting or describe truthful support. |
| Later | `firstyear_life_first_winter` | Needs winter and cold-climate context; a teaching variant also assumes a TA assignment. |
| Later | `life_ongoing_hobby_return` | Remove invented post-second-year history or establish a sufficiently late stage. |
| Later | `life_ongoing_partner_ledger` | Require a partner; do not invent cancelled occasions. |
| Later | `life_ongoing_health_deferred` | Remove hardcoded October, age29 and a specific clinical reading unsupported by the run. |
| Later | `life_ongoing_pet_schedule` | Establish pet ownership/context before describing its treatment regimen. |

Ordinary scene-setting humor and another labmate being in year six do not inherently contradict
a first-year player. Preserve satire where it does not assert nonexistent player history.
Pair every revised choice/outcome with Chinese copy and verify actual costs, target manuscript,
calendar timing and follow-up. Keep this audit distinct from automated code correctness.

## Implemented follow-up

All 19 scenes in this inventory now have paired English/Chinese revisions. Prelim preparation
uses the scheduled sitting, including retakes; the oral is explicitly practice. Teaching scenes
require a TA assignment in term, and student coursework stops after passing the prelim. The
practice scene cannot award an exam pass or change its date.

Paper stories follow the selected editable manuscript's age, rejection history, and actual
returned advisor feedback. Feedback records its advisor and review cycle. Sending a draft,
skipping approval, or changing advisors does not count as a completed read. The inherited
repository is offered as a lab resource without inventing the current paper's authorship.

Arrival support is a one-time grant with the actual cost shown, not an untracked advance or
credit balance. Winter requires a cold climate and the relevant season. Partner and pet scenes
require the corresponding relationship/ownership. Hobby and wellbeing scenes no longer invent
medical measurements, equipment ownership, player age, or years of backstory.

These scenes recheck context when queued and when resolving a saved open scene. A stale scene
does not spend resources or replay a dice result. The original June save was resumed through
the UI: dismissing the out-of-window practice left Energy 43.07, readiness 65.5, month9/week4,
and the real prelim at month20. The remaining lab scene and June report then completed normally.

The 90-run reachability probe saw 319/360 events. Of these 19 revised scenes, returned-draft,
prelim study-group and pet-care were not sampled. Returned-draft has a short first-year window
requiring a completed read and an editable paper; study-group competes for events in the six
months before the exam; pet-care requires adopting a cat, which these policies do not target.
Unit checks establish those conditions can be met, not that their appearance rates are ideal.
The probe exits nonzero for 41 unsampled events and 52 unsampled achievements; it is not a clean
reachability gate or proof of hundred-run freshness.

Remaining observed UX issue: submitting the main paper while a side project has an imminent
deadline automatically selects the side project. The receipt exists but is easily missed. A
future pass should preserve a clear submission confirmation without losing the next work target.
