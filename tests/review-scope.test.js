import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject, submit, processPapers, decide } from '../src/engine/paper.js';
import { resolveChoice } from '../src/engine/events.js';

function manuscripts() {
  let s = createRun(42, { background: 'masters', topic: 'ml', international: false });
  const advisor = s.advisors[0];
  s.phase = 'admissions'; s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  s.projects = [];
  const first = createProject(s), second = createProject(s);
  for (const p of [first, second]) {
    s.activeProjectId = p.id;
    Object.assign(p, { status: 'Ready', venueId: 'tmlrgh', wizardStep: 4, draft: 100 });
    submit(s);
  }
  s.activeProjectId = second.id;
  s.eventQueue = []; s.eventReturn = 'plan'; s.needsBegin = false;
  return { s, first, second };
}
function choose(s, event, choice) { s.event = event; s.stage = 'event'; resolveChoice(s, choice); }

test('a margin warning affects its paper only and expires on resubmission', () => {
  const { s, first, second } = manuscripts();
  choose(s, 'margins', 'ignore');
  assert.equal(second.marginRisk, true);
  assert.equal(first.marginRisk, false);
  assert.equal(s.flags.marginRisk, undefined);
  s.month = first.timeline.rebuttal;
  second.timeline.rebuttal = s.month + 1;
  second.timeline.decision = s.month + 2;
  s.week = 0; s.rng = 19; // .0585: safe at normal 4%, desk reject with the erroneous global 8%.
  processPapers(s);
  assert.equal(first.status, 'Rebuttal', 'another paper does not inherit the margin penalty');
  Object.assign(second, { status: 'Ready', wizardStep: 4 });
  submit(s);
  assert.equal(second.marginRisk, false);
  assert.equal(second.submissionHistory.length, 2);
});

test('review help stays with the manuscript even when another paper decides first', () => {
  const { s, first, second } = manuscripts();
  second.status = 'Rebuttal';
  choose(s, 'conflicting', 'cite');
  assert.equal(second.rebuttalBonus, true);
  assert.equal(s.flags.rebuttalBonus, undefined);
  first.reviewers = [{ score: 5 }]; s.rng = 43;
  decide(s, first, 0);
  assert.equal(second.rebuttalBonus, true, 'an unrelated decision cannot consume the help');
  second.reviewers = [{ score: 5 }]; s.rng = 43;
  decide(s, second, 0);
  assert.equal(second.rebuttalBonus, false, 'the relevant decision consumes it once');
  Object.assign(second, { status: 'Ready', wizardStep: 4, rebuttalBonus: true });
  submit(s);
  assert.equal(second.rebuttalBonus, false, 'a new review cycle requires new help');
});

test('legacy global review flags migrate once to the identifiable active submission', () => {
  const { s, first, second } = manuscripts();
  first.afterRebuttal = true; second.afterRebuttal = true;
  s.flags.rebuttalBonus = true; s.flags.marginRisk = true;
  processPapers(s);
  assert.equal(second.rebuttalBonus, true);
  assert.equal(second.marginRisk, true);
  assert.equal(first.rebuttalBonus, false);
  assert.equal(first.marginRisk, false);
  assert.equal(s.flags.rebuttalBonus, undefined);
  assert.equal(s.flags.marginRisk, undefined);
});

test('unowned legacy flags expire instead of affecting later submissions', () => {
  const { s, first, second } = manuscripts();
  first.status = 'Accepted'; second.status = 'Rejected';
  s.flags.rebuttalBonus = true; s.flags.marginRisk = true;
  processPapers(s);
  Object.assign(second, { status: 'Ready', wizardStep: 4 });
  submit(s);
  assert.equal(second.marginRisk, false);
  assert.equal(second.rebuttalBonus, false);
  assert.equal(s.flags.marginRisk, undefined);
  assert.equal(s.flags.rebuttalBonus, undefined);
});

test('older meeting templates also attach their review help to the active paper', () => {
  const { s, first, second } = manuscripts();
  second.status = 'Rebuttal';
  choose(s, 'meet_rebuttal', 'strategy');
  assert.equal(second.rebuttalBonus, true);
  assert.equal(first.rebuttalBonus, false);
  assert.equal(s.flags.rebuttalBonus, undefined);
});

function reviewsWithMail() {
  const setup = manuscripts();
  setup.s.event = null;
  setup.s.stage = 'plan';
  setup.s.month = setup.first.timeline.rebuttal;
  setup.s.week = 0;
  setup.s.rng = 42;
  processPapers(setup.s);
  assert.equal(setup.first.status, 'Rebuttal');
  assert.equal(setup.second.status, 'Rebuttal');
  return setup;
}

test('replying to review mail out of order helps the original paper, not the selected one', () => {
  let { s, first, second } = reviewsWithMail();
  const mail = s.inbox.find(m => m.kind === 'reviewsIn' && m.projectId === first.id);
  assert.equal(mail.submissionMonth, first.timeline.submitted);
  assert.equal(mail.submissionAttempt, 1);
  s.activeProjectId = second.id;
  s = dispatch(s, { type: 'MAIL_REPLY', mailId: mail.id, id: 'plan' });
  assert.equal(s.projects.find(p => p.id === first.id).rebuttalBonus, true);
  assert.equal(s.projects.find(p => p.id === second.id).rebuttalBonus, false);
  assert.equal(s.flags.rebuttalBonus, undefined);
});

test('an old review email cannot help a revised submission', () => {
  let { s, first, second } = reviewsWithMail();
  const oldMail = s.inbox.find(m => m.kind === 'reviewsIn' && m.projectId === first.id);
  s.activeProjectId = first.id;
  s.rng = 43;
  decide(s, first, 0);
  assert.equal(first.status, 'Rejected');
  // The revision has subsequently completed advisor approval.
  Object.assign(first, { status: 'Ready', wizardStep: 4 });
  submit(s);
  // Both an unrelated open review and a new cycle are present when the old email is answered.
  first.status = 'Rebuttal';
  s = dispatch(s, { type: 'MAIL_REPLY', mailId: oldMail.id, id: 'plan' });
  assert.equal(s.projects.find(p => p.id === first.id).rebuttalBonus, false);
  assert.equal(s.projects.find(p => p.id === second.id).rebuttalBonus, false);
  assert.equal(s.flags.rebuttalBonus, undefined);
});

test('legacy review mail only helps a sole matching live submission', () => {
  let { s, first, second } = reviewsWithMail();
  const mail = s.inbox.find(m => m.kind === 'reviewsIn');
  delete mail.projectId; delete mail.submissionMonth; delete mail.submissionAttempt;
  const ambiguous = dispatch(s, { type: 'MAIL_REPLY', mailId: mail.id, id: 'plan' });
  assert.ok(ambiguous.projects.every(p => !p.rebuttalBonus));
  second.status = 'Rejected';
  s.activeProjectId = second.id;
  s = dispatch(s, { type: 'MAIL_REPLY', mailId: mail.id, id: 'plan' });
  assert.equal(s.projects.find(p => p.id === first.id).rebuttalBonus, true);
  assert.equal(s.projects.find(p => p.id === second.id).rebuttalBonus, false);
});
