import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { milestoneOf, crunchOf, seasonEligible } from '../src/engine/time.js';

function defenseRun(month = 60) {
  let s = createRun(7, { background: 'masters', topic: 'ml', international: false });
  const advisor = s.advisors[0];
  s.phase = 'admissions';
  s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  s.month = month;
  s.stage = 'milestone';
  s.milestoneKind = 'defense';
  Object.assign(s.milestones, { prelim: 'pass', proposal: 'pass', defenseMonth: month });
  s = dispatch(s, { type: 'MILESTONE', id: 'balanced' });
  // A fixed failed first defense, through the same result action the room sends.
  s.rng = 43;
  return dispatch(s, { type: 'VIVA', tally: { land: 0, concede: 0, caught: 6, silent: 0, composure: 0 } });
}

test('major defense revisions lead to the promised second defense and deposit work', () => {
  let s = defenseRun();
  assert.equal(s.milestones.defense, 'revisions');
  assert.equal(s.milestones.defenseAttempts, 1);
  assert.deepEqual(milestoneOf(s), { kind: 'defense', month: 63 });
  s.week = 0;
  s.pace = 'auto';
  assert.equal(seasonEligible(s), false, 'season pace must not skip the repeat defense');
  s.month = 63;
  assert.equal(crunchOf(s)?.kind, 'defense');
  s.stage = 'report';
  s = dispatch(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.stage, 'milestone');
  s = dispatch(s, { type: 'MILESTONE', id: 'honest' });
  s = dispatch(s, { type: 'VIVA', tally: { land: 4, concede: 2, caught: 0, silent: 0, composure: 90 } });
  assert.equal(s.milestones.defenseAttempts, 2);
  assert.equal(s.milestones.defense, 'pass');
  assert.ok(s.thesis?.needed > 0, 'passing opens the deposit revision checklist');
  assert.equal(milestoneOf(s), null, 'a passed defense must not repeat');
});

test('a repeat defense at the funding deadline still reaches commencement', () => {
  let s = defenseRun(68);
  assert.equal(s.milestones.defenseMonth, 71);
  s.month = 71;
  s.stage = 'report';
  s = dispatch(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.stage, 'milestone');
  s = dispatch(s, { type: 'MILESTONE', id: 'balanced' });
  s = dispatch(s, { type: 'VIVA', tally: { land: 4, concede: 2, caught: 0, silent: 0, composure: 90 } });
  assert.equal(s.stage, 'commencement');
  assert.equal(s.milestones.graduated, true);
  assert.equal(s.thesis.deferred, true, 'the existing late-deposit route applies');
  assert.ok(s.jobs.market.length > 0, 'the player receives a post-PhD choice');
});
