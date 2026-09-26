import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject, sendAdvisor, skipApproval, processPapers } from '../src/engine/paper.js';
import { eligible, templateById, openNext } from '../src/engine/events.js';

function student(month = 8) {
  let s = createRun(731, { background: 'masters', topic: 'ml', international: false });
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  Object.assign(s, { month, week: 0, stage: 'plan', event: null, eventReturn: 'plan', eventQueue: [], scheduled: [], needsBegin: false, requests: [], projects: [] });
  const p = createProject(s); Object.assign(p, { progress: 60, draft: 80, status: 'Drafting' });
  return { s, p };
}
const allowed = (s, id) => eligible(s, templateById[id]);

test('reviewer revision scene follows the active paper actual full-review rejection', () => {
  const { s, p } = student();
  assert.equal(allowed(s, 'midphd_reviewer_misread'), false);
  p.submissionHistory = [{ outcome: 'Desk Reject', reviewers: [] }];
  assert.equal(allowed(s, 'midphd_reviewer_misread'), false);
  p.submissionHistory = [{ outcome: 'Reject', reviewers: [{ score: 4, text: 'The comparison is unclear.' }] }];
  assert.equal(allowed(s, 'midphd_reviewer_misread'), true);
  createProject(s, { kind: 'side' });
  assert.equal(allowed(s, 'midphd_reviewer_misread'), false);
  s.activeProjectId = p.id; p.status = 'Rebuttal';
  assert.equal(allowed(s, 'midphd_reviewer_misread'), false);
});

test('returned-draft scene requires a real completed advisor read, not just sending or skipping it', () => {
  const { s, p } = student();
  assert.equal(allowed(s, 'firstyear_advisor_first_draft_returned'), false);
  sendAdvisor(s, 0);
  assert.equal(allowed(s, 'firstyear_advisor_first_draft_returned'), false);
  const bypass = structuredClone(s); bypass.advisorMode = { id: 'checkedOut' }; skipApproval(bypass);
  assert.equal(allowed(bypass, 'firstyear_advisor_first_draft_returned'), false);
  processPapers(s);
  assert.equal(allowed(s, 'firstyear_advisor_first_draft_returned'), true);
  assert.equal(p.advisorFeedback.cycle, 1); assert.equal(p.advisorFeedback.month, 8);
  const originalAdvisor = s.advisor;
  s.advisor = { ...s.advisor, id: 'replacement-advisor' };
  assert.equal(allowed(s, 'firstyear_advisor_first_draft_returned'), false, 'a new PI has not read this draft');
  s.advisor = originalAdvisor;
  p.status = 'Submitted'; assert.equal(allowed(s, 'firstyear_advisor_first_draft_returned'), false);
});

test('old-project stories follow manuscript age rather than program age', () => {
  const { s, p } = student(36);
  for (const id of ['midphd_dead_branch', 'midphd_old_repository']) assert.equal(allowed(s, id), false);
  p.startedMonth = 0;
  for (const id of ['midphd_dead_branch', 'midphd_old_repository']) assert.equal(allowed(s, id), true);
  createProject(s, { kind: 'side' });
  for (const id of ['midphd_dead_branch', 'midphd_old_repository']) assert.equal(allowed(s, id), false);
});

test('a queued or saved manuscript scene cannot spend work on an unrelated new project', () => {
  const { s } = student(36); s.eventQueue = ['midphd_old_repository'];
  const rng = s.rng; openNext(s);
  assert.equal(s.event, null); assert.equal(s.rng, rng);
  s.event = 'midphd_old_repository'; s.stage = 'event';
  const before = structuredClone(s); const after = dispatch(s, { type: 'CHOICE', id: 'rewrite' });
  assert.equal(after.stage, 'plan'); assert.equal(after.event, null);
  for (const key of ['player', 'projects', 'rng', 'month', 'week', 'seen']) assert.deepEqual(after[key], before[key]);
});
