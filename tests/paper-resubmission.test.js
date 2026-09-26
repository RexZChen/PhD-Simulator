import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject, submit, rebut, recycle, processPapers, closeRebuttals } from '../src/engine/paper.js';

function submittedPaper() {
  let s = createRun(42, { background: 'masters', topic: 'ml', international: false });
  const advisor = s.advisors[0];
  s.phase = 'admissions';
  s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  const p = s.projects[0] || createProject(s);
  s.activeProjectId = p.id;
  Object.assign(p, { status: 'Ready', draft: 100, progress: 100, venueId: 'tmlrgh', wizardStep: 4 });
  submit(s);
  s.month = p.timeline.rebuttal;
  s.week = 0;
  s.rng = 42; // Avoid the desk rejection so this exercises the review/rebuttal cycle.
  processPapers(s);
  assert.equal(p.status, 'Rebuttal');
  return { s, p };
}

for (const answered of [true, false]) {
  test(`resubmitted paper gets fresh reviews after an ${answered ? 'answered' : 'unanswered'} rebuttal`, () => {
    const { s, p } = submittedPaper();
    if (answered) rebut(s, 'experiments');
    s.month = p.timeline.decision;
    closeRebuttals(s);
    assert.equal(p.afterRebuttal, true);
    assert.equal(p.pendingBonus, answered ? .13 : -.02);
    s.rng = 43; // A genuine rejection, even at the maximum acceptance chance.
    processPapers(s);
    assert.equal(p.status, 'Rejected');
    const previousSubmission = structuredClone(p.submissionHistory[0]);
    recycle(s, 'revise');
    // Research and advisor approval have completed for the revised manuscript.
    Object.assign(p, { status: 'Ready', draft: 100, wizardStep: 4 });
    submit(s);
    assert.deepEqual(p.submissionHistory[0], previousSubmission, 'keep the original reviews and rejection');
    assert.equal(p.submissionHistory.length, 2);
    assert.equal(p.afterRebuttal, false, 'a new submission has not answered its rebuttal');
    assert.equal(p.pendingBonus, 0, 'neither a prior bonus nor a missed-window penalty carries forward');
    s.month = p.timeline.rebuttal;
    s.rng = 42;
    processPapers(s);
    assert.equal(p.status, 'Rebuttal', 'the revised paper must open its own rebuttal window');
    assert.ok(p.reviewers.length >= 3);
    assert.deepEqual(p.submissionHistory[1].reviewers, p.reviewers);
    assert.deepEqual(p.submissionHistory[0], previousSubmission);
    rebut(s, 'experiments');
    s.month = p.timeline.decision;
    s.rng = 43;
    processPapers(s);
    assert.equal(p.submissionHistory[1].outcome, 'Reject', 'the second cycle still reaches a decision');
  });
}
