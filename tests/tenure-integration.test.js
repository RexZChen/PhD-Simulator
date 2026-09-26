import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { focusOptions } from '../src/engine/time.js';
import { dispatch } from '../src/engine/game.js';
import { openNext, eligible, templateById, choiceUnavailable } from '../src/engine/events.js';
import { saveRun, loadSave, emptyMeta, writeSlot, readSlot } from '../src/engine/save.js';

function student(seed = 842) {
  let s = createRun(seed, { background: 'masters', topic: 'ml' });
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.month = 27; s.week = 0; s.stage = 'plan'; s.event = null; s.eventQueue = []; s.scheduled = [];
  s.advisor.stage = 'pre_tenure'; s.advisor.prestige = 55;
  s.player.stats.health = 100; s.player.stats.energy = 100; s.player.stats.hope = 90;
  s.player.hidden.stress = 10; s.standing = 90; s.quitPressure = 0;
  s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass';
  s.pace = 'month'; s.focus = null;
  return s;
}
const storage = () => {
  const values = new Map();
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
};
function open(s, id, next = []) {
  s.eventReturn = 'plan'; s.eventQueue = [id, ...next]; openNext(s);
  assert.equal(s.event, id); return s;
}
function reportBoundary(s) {
  assert.equal(s.event, null);
  s.stage = 'report'; s.report = { monthsCovered: 1 };
  return dispatch(s, { type: 'DISMISS_REPORT' });
}
function answerRoutine(s) {
  const c = templateById[s.event].choices.find(c => !c.ending && !c.newAdvisor && !c.relocate && !choiceUnavailable(s, c));
  assert.ok(c, `routine scene ${s.event} has an available response`);
  return dispatch(s, { type: 'CHOICE', id: c.id });
}

test('an opened announcement survives autosave and slot reload with its exact decision and RNG', () => {
  for (const id of ['tenure_result', 'advisor_tenure_denied']) {
    const s = open(student(), id), saved = structuredClone(s.advisorTenure), rng = s.rng;
    const disk = storage();
    assert.equal(saveRun(disk, s, emptyMeta()).error, null);
    assert.equal(writeSlot(disk, 1, s), null);
    for (let loaded of [loadSave(disk).run, readSlot(disk, 1)]) {
      assert.ok(loaded); assert.equal(loaded.event, id);
      assert.deepEqual(loaded.advisorTenure, saved); assert.equal(loaded.rng, rng);
      loaded = dispatch(loaded, { type: 'CHOICE', id: id === 'tenure_result' ? 'support' : 'follow' });
      assert.equal(loaded.advisorTenure.outcome, saved.outcome);
      assert.equal(loaded.advisorTenure.announcedMonth, 27);
      assert.equal(loaded.rng, rng, 'answering the announcement does not roll a second decision');
    }
  }
});

test('a real local reassignment permits a successor decision despite predecessor once and cooldown records', () => {
  let s = open(student(), 'advisor_tenure_denied');
  const oldId = s.advisor.id;
  s.seen.tenure_result = 1; s.seen.advisor_leaves = 1;
  for (const id of ['tenure_result', 'advisor_tenure_denied', 'advisor_leaves']) s.cooldowns[id] = 99;
  s = dispatch(s, { type: 'CHOICE', id: 'stay' });
  assert.notEqual(s.advisor.id, oldId); assert.equal(s.advisorTenure, undefined);
  assert.equal(s.advisorTenureHistory[0].resolution, 'advisor_tenure_denied');
  s.advisor.stage = 'pre_tenure';
  assert.equal(eligible(s, templateById.tenure_result), false);
  s.month = 39;
  assert.equal(eligible(s, templateById.tenure_result), true);
  assert.equal(eligible(s, templateById.advisor_tenure_denied), true);
  open(s, 'tenure_result'); assert.equal(s.advisorTenure.advisorId, s.advisor.id);
  assert.notEqual(s.advisorTenure.advisorId, oldId);
});

test('grant rejects a queued contradictory denial and departure before either can open', () => {
  let s;
  for (let seed = 1; seed < 100; seed++) {
    s = open(student(seed), 'tenure_result', ['advisor_tenure_denied', 'advisor_leaves']);
    if (s.advisorTenure.outcome === 'granted') break;
  }
  assert.equal(s.advisorTenure.outcome, 'granted');
  s = dispatch(s, { type: 'CHOICE', id: 'support' });
  assert.equal(s.event, null); assert.deepEqual(s.eventQueue, []);
  assert.equal(s.advisor.stage, 'mid_career'); assert.equal(s.mutators.includes('tenure'), false);
  assert.equal(s.seen.advisor_tenure_denied, undefined); assert.equal(s.seen.advisor_leaves, undefined);
});

test('denial at month27 reaches its forced departure at39 through the normal report and turn boundaries', () => {
  let s = open(student(), 'advisor_tenure_denied');
  s = dispatch(s, { type: 'CHOICE', id: 'follow' });
  assert.equal(s.advisorTenure.departureMonth, 39);
  for (const id of ['advisor_moves', 'advisor_retires', 'advisor_industry']) assert.equal(eligible(s, templateById[id]), false, id);
  s.month = 38;
  assert.equal(eligible(s, templateById.advisor_leaves), false);
  s = reportBoundary(s); assert.equal(s.month, 39);
  assert.equal(eligible(s, templateById.advisor_leaves), true);
  for (let i = 0; i < 30 && s.event !== 'advisor_leaves'; i++) {
    if (s.event) s = answerRoutine(s);
    else { s = dispatch(s, { type: 'PLAN', id: focusOptions(s).find(f => !f.disabled).id }); s = dispatch(s, { type: 'CONTINUE' }); }
  }
  assert.equal(s.event, 'advisor_leaves'); assert.equal(s.month, 39);
  assert.equal(s.advisorTenure.announcedMonth, 27);
});

test('accepting the departure transfers only on arrival and gives the same advisor twelve months at the new campus', () => {
  let s = open(student(), 'advisor_tenure_denied');
  s = dispatch(s, { type: 'CHOICE', id: 'follow' }); s.month = 39;
  open(s, 'advisor_leaves');
  const oldSchool = s.program.id, advisorId = s.advisor.id, before = s.player.stats.money - s.debt;
  s = dispatch(s, { type: 'CHOICE', id: 'follow' });
  assert.equal(s.program.id, oldSchool); assert.equal(s.advisorTenure.status, 'notice');
  assert.equal(s.player.stats.money - s.debt, before - 1600);
  const destination = s.pendingRelocation.schoolId;
  s = reportBoundary(s);
  assert.equal(s.month, 40); assert.equal(s.program.id, destination); assert.equal(s.advisor.id, advisorId);
  assert.equal(s.advisorTenure, undefined); assert.equal(s.flags.tenureDenied, undefined);
  assert.equal(s.advisorTenureHistory[0].resolution, 'relocated');
  assert.equal(s.relocationHistory.length, 1);
  assert.equal(eligible(s, templateById.tenure_result), false);
  s.month = 51; assert.equal(eligible(s, templateById.advisor_tenure_denied), false);
  s.month = 52; assert.equal(eligible(s, templateById.tenure_result), true);
  assert.equal(eligible(s, templateById.advisor_leaves), false);
});
