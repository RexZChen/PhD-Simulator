import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { submit } from '../src/engine/paper.js';
import { monthlyMeetings } from '../src/engine/advisor.js';
import { crunchSnapshot, focusOptions, remainingWeeks, turnWeeks, leaveCoversTurn, seasonEligible, paceOptions } from '../src/engine/time.js';
import { managerNextStep } from '../src/ui/apps/manager.js';

function ready(week = 1, dayIndex = 0) {
  let s = createRun(731, { background: 'masters', topic: 'ml', international: false });
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  Object.assign(s, { stage: 'plan', event: null, eventQueue: [], needsBegin: false, month: 4, week, dayIndex });
  s = dispatch(s, { type: 'START_PROJECT' });
  Object.assign(s.projects[0], { status: 'Ready', progress: 100, draft: 100, venueId: 'icmlater', wizardStep: 4,
    targetVenueId: 'icmlater', targetVenue: 'ICMLater', targetMonth: s.month });
  s.crunch = crunchSnapshot(s); s.tempo = dayIndex ? 'day' : 'week';
  s.summons = { answered: true, keep: 1 }; s.scheduled = []; s.requests = [];
  return s;
}
const budget = s => structuredClone({ month: s.month, week: s.week, dayIndex: s.dayIndex, typed: s.typed,
  actions: s.actions, dayActions: s.dayActions, dayMeals: s.dayMeals, caffeine: s.caffeine,
  report: s.report, ledger: s.ledger, money: s.player.stats.money, leaveWeeks: s.leaveWeeks });

test('real submission immediately removes stale deadline without replaying initialization or RNG', () => {
  let s = ready(); s.actions = { chatphd: true }; s.typed = 11; s.dayActions = { coffee: true };
  const before = budget(s), raw = structuredClone(s); submit(raw);
  s = dispatch(s, { type: 'SUBMIT' });
  assert.equal(s.crunch, null); assert.equal(s.tempo, 'month');
  assert.deepEqual(budget(s), before); assert.equal(s.rng, raw.rng);
  assert.ok(!focusOptions(s).find(f => f.id === 'coursework').disabled);
  assert.ok(focusOptions(s).find(f => f.id === 'research').disabled);
  const submitted = structuredClone(s.projects[0]);
  s = dispatch(s, { type: 'START_PROJECT' });
  assert.equal(focusOptions(s).find(f => f.id === 'research').disabled, null);
  assert.deepEqual(s.projects[0], submitted);
});

test('submission rebinds another deadline or rebuttal rather than working on the submitted paper', () => {
  for (const status of ['Drafting', 'Rebuttal']) {
    let s = ready(2, 2);
    s.projects.push({ ...structuredClone(s.projects[0]), id: 'other', status,
      timeline: status === 'Rebuttal' ? { submitted: 2, rebuttal: 4, decision: 6 } : null });
    s = dispatch(s, { type: 'SUBMIT' });
    assert.equal(s.crunch.projectId, 'other'); assert.equal(s.activeProjectId, 'other');
    assert.equal(s.crunch.type, status === 'Rebuttal' ? 'rebuttal' : 'deadline');
    assert.equal(s.dayIndex, 2); assert.equal(s.tempo, 'week');
    assert.equal(turnWeeks(s), .6);
  }
});

test('post-submission guidance surfaces unanswered requests before suggesting another project', () => {
  let s = dispatch(ready(), { type: 'SUBMIT' });
  s.requests = [{ id: 'waiting', status: 'open' }];
  assert.equal(managerNextStep(s).title, 'Your advisor asked for something');
  s.requests[0].status = 'done';
  assert.equal(managerNextStep(s).title, 'While the paper is under review');
});

test('leaving a partial day for a calm month spends exactly the remaining leave without early payroll', () => {
  let s = ready(3, 2); s.leaveWeeks = .6;
  s = dispatch(s, { type: 'SUBMIT' });
  assert.equal(remainingWeeks(s), .6); assert.equal(leaveCoversTurn(s), true);
  const money = s.player.stats.money, ledger = structuredClone(s.ledger), before = s.projects[0].evidence;
  s = dispatch(s, { type: 'CONTINUE' });
  assert.equal(s.month, 4); assert.equal(s.week, 4); assert.equal(s.dayIndex, 0);
  assert.equal(s.leaveWeeks, 0); assert.equal(s.player.stats.money, money);
  assert.deepEqual(s.ledger, ledger); assert.equal(s.projects[0].evidence, before);
  assert.equal(s.report.meetings.held, 0);
  assert.throws(() => dispatch(s, { type: 'CONTINUE' }));
  // Drain presentation-only interruptions to inspect the actual report/ledger boundary.
  s.event = null; s.eventQueue = []; s.stage = 'report'; s.crisis = null;
  s = dispatch(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.month, 5); assert.equal(s.ledger.month, 5);
  const paid = s.player.stats.money;
  assert.throws(() => dispatch(s, { type: 'DISMISS_REPORT' }));
  assert.equal(s.player.stats.money, paid);
});

test('day-to-week controls preserve spent days and consume only the rest of that week', () => {
  let s = ready(3, 2); s.leaveWeeks = .6; s.dayActions = { coffee: true }; s.typed = 7;
  const before = budget(s), rng = s.rng;
  s = dispatch(s, { type: 'SET_PACE', id: 'week' });
  assert.deepEqual(budget(s), before); assert.equal(s.rng, rng); assert.equal(turnWeeks(s), .6);
  s = dispatch(s, { type: 'CONTINUE' });
  assert.equal(s.week, 4); assert.equal(s.dayIndex, 0); assert.equal(s.leaveWeeks, 0);
  assert.equal(s.month, 4); assert.equal(s.player.stats.money, before.money);
});

test('clearing a target and finishing a response refresh immediately without restoring days', () => {
  let s = ready(1, 2); const before = budget(s), rng = s.rng;
  s = dispatch(s, { type: 'CLEAR_TARGET' });
  assert.equal(s.crunch, null); assert.equal(s.tempo, 'month');
  assert.deepEqual(budget(s), before); assert.equal(s.rng, rng); assert.equal(remainingWeeks(s), 2.6);
  s.projects[0].status = 'Rebuttal'; s.projects[0].timeline = { submitted: 2, rebuttal: 4, decision: 6 };
  s.crunch = crunchSnapshot(s); s.tempo = 'day';
  s = dispatch(s, { type: 'REBUT', id: 'careful' });
  assert.equal(s.crunch, null); assert.equal(s.tempo, 'month'); assert.equal(s.dayIndex, 2);
  assert.equal(s.projects[0].status, 'Submitted');
});

test('toggling day mode off and back on cannot restore days or daily action budgets', () => {
  let s = ready(2, 2); s.dayMode = s.month; s.dayActions = { coffee: true };
  s = dispatch(s, { type: 'DAY_MODE' });
  assert.equal(s.tempo, 'week'); assert.equal(s.dayIndex, 2);
  s = dispatch(s, { type: 'DAY_MODE' });
  assert.equal(s.tempo, 'day'); assert.equal(s.dayIndex, 2);
  assert.deepEqual(s.dayActions, { coffee: true });
});

test('a partial first week cannot become a fresh season after a target clears or a paper submits', () => {
  for (const type of ['CLEAR_TARGET', 'SUBMIT']) {
    let s = ready(0, 2); s.month = 28; s.milestones.prelim = 'pass'; s.pace = 'auto';
    s.projects[0].targetMonth = s.month; s.crunch = crunchSnapshot(s);
    s = dispatch(s, { type });
    assert.equal(s.crunch, null); assert.equal(s.tempo, 'month'); assert.equal(s.dayIndex, 2);
    assert.equal(remainingWeeks(s), 3.6); assert.equal(seasonEligible(s), false);
    assert.equal(paceOptions(s).find(p => p.id === 'season').disabled, 'Only at the start of a month.');
    assert.throws(() => dispatch(s, { type: 'SET_PACE', id: 'season' }));
  }
});

test('monthly meeting digest counts only cadence slots in the remaining work interval', () => {
  for (const [cadence, start, expected] of [['weekly', 1, 3], ['weekly', 3.4, 1], ['biweekly', 2, 1], ['monthly', 4, 0]]) {
    const s = ready(); s.cadence.oneOnOne = cadence; s.cadence.group = cadence;
    const before = s.meetingStats.held + s.meetingStats.cancelled;
    const result = monthlyMeetings(s, { meetingStart: start, meetingEnd: 4, workWeeks: 4 - start });
    assert.equal(result.expected, expected);
    assert.equal(s.meetingStats.held + s.meetingStats.cancelled - before, expected);
  }
});
