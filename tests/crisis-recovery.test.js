import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { openCrisis } from '../src/engine/life.js';
import { CRISIS_COOLDOWN } from '../src/data/crisis.js';

function student() {
  let s = createRun(4242, { background: 'masters', topic: 'ml', international: false });
  const a = s.advisors[6];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.month = 16; s.player.stats.health = 20;
  s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass';
  s.standing = 90; s.player.stats.hope = 90;
  s.advisor.funding = 90;
  return s;
}

test('a resolved crisis does not suppress a later crisis after the cooldown', () => {
  let s = student();
  openCrisis(s, 'collapse');
  s = dispatch(s, { type: 'CRISIS', id: 'treat' });
  assert.equal(s.crisis.resolved, true);
  s.month = 16 + CRISIS_COOLDOWN - 1;
  s.player.stats.health = 20;
  s.stage = 'report'; s.event = null; s.eventQueue = [];
  s.report.monthsCovered = 1;
  s = dispatch(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.month, 16 + CRISIS_COOLDOWN);
  assert.equal(s.stage, 'crisis');
  assert.equal(s.crisis.resolved, false);
  assert.equal(s.crisis.month, s.month);
});

test('care is charged once, counts toward the deductible, and supersedes an old refusal', async () => {
  const { resolveCrisis } = await import('../src/engine/life.js');
  const s = student(); s.flags.signedOut = true;
  s.insurance.deductibleLeft = 300; s.insurance.coinsurance = .2;
  openCrisis(s, 'collapse');
  resolveCrisis(s, 'minimum');
  assert.equal(s.crisis.bill, 240);
  assert.equal(s.insurance.deductibleLeft, 60);
  assert.equal(s.flags.signedOut, undefined);
  const resolved = structuredClone(s);
  assert.throws(() => resolveCrisis(s, 'treat'), /nothing to deal/);
  assert.deepEqual(s, resolved);
  s.month += CRISIS_COOLDOWN;
  openCrisis(s, 'collapse'); resolveCrisis(s, 'treat');
  assert.equal(s.crisis.bill, 96);
  assert.equal(s.counts.crises, 2);
  assert.equal(s.crisisHistory.length, 2);
});

test('urgent conditions select the urgent-care crisis without an unreachable severity threshold', async () => {
  const { addCondition, crisisDue } = await import('../src/engine/life.js');
  const { conditions } = await import('../src/data/life.js');
  const s = student();
  const [urgent] = Object.entries(conditions).find(([, c]) => c.clinic === 'urgent');
  addCondition(s, urgent);
  assert.equal(crisisDue(s), 'infection');
});

test('recovery resets consecutive strain without erasing lifetime history', async () => {
  const { monthlyLife } = await import('../src/engine/life.js');
  const s = student();
  s.player.stats.health = 20; s.player.hidden.stress = 95;
  monthlyLife(s);
  assert.equal(s.counts.lowHealthStreak, 1);
  assert.equal(s.counts.highStressStreak, 1);
  s.player.stats.health = 80; s.player.hidden.stress = 20;
  monthlyLife(s);
  assert.equal(s.counts.lowHealthStreak, 0);
  assert.equal(s.counts.highStressStreak, 0);
  assert.equal(s.counts.lowHealthMonths, 1);
  assert.equal(s.counts.highStressMonths, 1);
});

test('each health story offers continuing care with a real bill, leave and request extension', () => {
  for (const event of ['ambulance', 'flatline', 'special_care']) {
    let s = student(); s.flags.signedOut = true;
    s.player.stats.money = 40; s.debt = 0; s.insurance.deductibleLeft = 300;
    s.counts.lowHealthStreak = 24; s.counts.highStressStreak = 24;
    s.event = event; s.stage = 'event'; s.eventReturn = 'plan';
    s.eventQueue = ['flatline', 'special_care', 'meet_criticism'];
    s.requests = [{ id: 'open', status: 'open', dueWeek: 66 }, { id: 'done', status: 'done', dueWeek: 60 }];
    s = dispatch(s, { type: 'CHOICE', id: 'recover' });
    assert.equal(s.phase, 'playing'); assert.equal(s.stage, 'plan');
    assert.equal(s.event, null, 'care supersedes stale queued health scenes and meetings');
    assert.equal(s.player.stats.money, 0); assert.equal(s.debt, 200);
    assert.equal(s.leaveWeeks, 4);
    assert.equal(s.requests[0].dueWeek, 70); assert.equal(s.requests[1].dueWeek, 60);
    assert.equal(s.flags.signedOut, undefined);
    assert.equal(s.counts.lowHealthStreak, 0); assert.equal(s.counts.highStressStreak, 0);
  }
});

test('a support plan resolves a concurrent crisis instead of presenting a second care bill', () => {
  let s = student(); openCrisis(s, 'collapse');
  s.event = 'ambulance'; s.stage = 'event'; s.eventReturn = 'plan';
  s.eventQueue = [];
  s = dispatch(s, { type: 'CHOICE', id: 'recover' });
  assert.equal(s.stage, 'plan'); assert.equal(s.crisis.resolved, true);
  assert.equal(s.crisisHistory.length, 1);
});

test('a past difficult year is not treated as a current uninterrupted episode', async () => {
  const { eligible, templateById } = await import('../src/engine/events.js');
  const s = student(); s.month = 40;
  s.player.stats.health = 10; s.player.hidden.stress = 95; s.player.stats.hope = 5;
  s.counts.lowHealthMonths = 30; s.counts.highStressMonths = 30;
  s.flags.signedOut = true;
  for (const id of ['ambulance', 'flatline', 'special_care']) assert.equal(eligible(s, templateById[id]), false);
  s.counts.lowHealthStreak = 4; s.counts.highStressStreak = 6;
  for (const id of ['ambulance', 'flatline', 'special_care']) assert.equal(eligible(s, templateById[id]), true);
});

test('withdrawal is an explicit choice, and no health scene scripts a death outcome', async () => {
  const { templateById } = await import('../src/engine/events.js');
  for (const [event, choice, ending] of [['ambulance', 'withdraw', 'hospital'], ['flatline', 'withdraw', 'hospital'], ['special_care', 'go', 'institution']]) {
    let s = student(); s.event = event; s.stage = 'event'; s.eventReturn = 'plan'; s.eventQueue = [];
    s = dispatch(s, { type: 'CHOICE', id: choice });
    assert.equal(s.phase, 'ending'); assert.equal(s.ending.id, ending);
    assert.ok(templateById[event].choices.every(c => c.ending !== 'posthumous'));
  }
});

test('whole-turn leave excuses meetings and classes while urgent decisions remain eligible', async () => {
  const { eligible, templateById } = await import('../src/engine/events.js');
  const s = student();
  const office = Object.values(templateById).filter(e => e.scene === 'office' && !e.urgent);
  assert.ok(office.length > 0);
  for (const e of office) assert.equal(eligible(s, e, { fullLeave: true }), false);
  for (const id of ['lecture_dodge', 'lecture_ta', 'lecture_seminar', 'lecture_ethics', 'firstyear_lab_first_group_meeting']) {
    assert.equal(eligible(s, templateById[id], { fullLeave: true }), false);
  }
  s.counts.lowHealthStreak = 4;
  assert.equal(eligible(s, templateById.ambulance, { fullLeave: true }), true);
});
