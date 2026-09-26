import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
function candidate(month) {
  let s = createRun(842, { background: 'masters', topic: 'ml' });
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.month = month; s.stage = 'plan'; s.event = null; s.eventQueue = []; s.scheduled = [];
  s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass';
  s = dispatch(s, { type: 'START_THESIS' });
  s.projects.find(p => p.kind === 'thesis').status = 'Ready';
  s.relationship.dependency = 10; s.player.stats.health = 100; s.player.stats.hope = 90;
  return s;
}
test('the final month cannot promise a defense outside the playable funding window', () => {
  const s = candidate(71); s.relationship.dependency = 90;
  const before = structuredClone(s);
  assert.throws(() => dispatch(s, { type: 'SCHEDULE_DEFENSE' }), /no remaining defense date/);
  assert.deepEqual(s, before);
  assert.equal(s.milestones.defenseMonth, null);
  assert.deepEqual(s.eventQueue, []);
});
test('the preceding month still permits a real last-month defense instead of guaranteeing failure early', () => {
  let s = dispatch(candidate(70), { type: 'SCHEDULE_DEFENSE' });
  assert.equal(s.milestones.defenseMonth, 71);
  s.stage = 'report'; s.report = { monthsCovered: 1 };
  s = dispatch(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.month, 71); assert.equal(s.phase, 'playing');
  s.event = null; s.eventQueue = []; s.stage = 'report'; s.report = { monthsCovered: 1 };
  s = dispatch(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.stage, 'milestone'); assert.equal(s.milestoneKind, 'defense');
  assert.equal(s.ending, null);
});

test('undeposited ending states the actual missing submission without inventing a job or future return', () => {
  for (const taken of [null, { kind: 'product_eng' }]) {
    let s = candidate(71);
    s.jobs.taken = taken; s.milestones.defense = 'pass';
    s.thesis = { deposited: false, defendedMonth: 65, needed: 9, done: 0, items: [] };
    s.stage = 'report'; s.report = { monthsCovered: 1 };
    s = dispatch(s, { type: 'DISMISS_REPORT' });
    assert.equal(s.ending.id, 'undeposited');
    assert.match(s.ending.text, /list is still unfinished/);
    assert.doesNotMatch(s.ending.text, /started the job|three weeks|five years|Tuesday/);
    assert.equal(s.milestones.graduated, false);
  }
});

test('revision guidance offers the actual next action, and recovery when its energy cost cannot be paid', async () => {
  const { managerNextStep } = await import('../src/ui/apps/manager.js');
  let s = candidate(65); s.focus = null;
  s.thesis = { deposited: false, defendedMonth: 64, needed: 2, done: 0,
    items: [{ id: 'limits', label: 'Limitations', line: 'One precise claim.', effort: 2, done: 0 }] };
  s.player.stats.energy = 5;
  let guide = managerNextStep(s);
  assert.match(guide.cta, /data-app="life"/); assert.doesNotMatch(guide.cta, /data-action="revise"/);
  s.player.stats.energy = 6; guide = managerNextStep(s);
  assert.match(guide.cta, /data-action="revise"/); assert.match(guide.cta, /data-id="limits"/);
  s = dispatch(s, { type: 'REVISE', id: 'limits' });
  assert.equal(s.thesis.done, 1); assert.equal(s.player.stats.energy, 0);
});

test('dissertation selection is discoverable after a paper detour but does not displace its live rebuttal', async () => {
  const { managerNextStep } = await import('../src/ui/apps/manager.js');
  let s = candidate(55); s.focus = null; s.requests = [];
  const th = s.projects.find(p => p.kind === 'thesis'); th.status = 'Drafting';
  s.projects.push({ ...structuredClone(th), id: 'other', kind: 'main', status: 'Drafting' });
  s.activeProjectId = 'other'; s.player.stats.energy = 60; s.crunch = null;
  let guide = managerNextStep(s); assert.match(guide.cta, /data-action="select-project"/); assert.match(guide.cta, /data-id="thesis"/);
  s = dispatch(s, { type: 'SELECT_PROJECT', id: 'thesis' }); assert.equal(s.activeProjectId, 'thesis');
  s.activeProjectId = 'other'; s.projects.find(p => p.id === 'other').status = 'Rebuttal'; s.crunch = { type: 'rebuttal' };
  guide = managerNextStep(s); assert.doesNotMatch(guide.cta, /data-action="select-project"/); assert.match(guide.cta, /openregret/);
});
