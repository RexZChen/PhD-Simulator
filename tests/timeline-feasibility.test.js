import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { timelinePanel } from '../src/ui/apps/manager.js';
import { canAskTimeline } from '../src/engine/timeline.js';
function candidate(month) {
  let s = createRun(842, { background: 'masters', topic: 'ml' });
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.month = month; s.week = 0; s.stage = 'plan'; s.event = null; s.eventQueue = []; s.scheduled = [];
  s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass'; s.counts.accepted = 3; s.readiness = 90;
  Object.assign(s.advisor, { caring: 100, toxicity: 0, ambition: 0 });
  Object.assign(s.relationship, { trust: 100, satisfaction: 100 });
  return s;
}
test('a late first agreement cannot promise year five after year six has begun', () => {
  const s = dispatch(candidate(64), { type: 'ASK_TIMELINE' });
  assert.equal(s.grad.stance, 'yes'); assert.equal(s.grad.targetYear, 6);
  assert.equal(s.milestones.plannedDefense, 66); assert.equal(s.grad.targetMonth, 66);
  assert.doesNotMatch(timelinePanel(s), /Finishing in year 5|month 55/);
});

test('early year-four agreement keeps the existing year-five target and degree requirements', () => {
  const s = dispatch(candidate(38), { type: 'ASK_TIMELINE' });
  assert.equal(s.grad.targetYear, 5); assert.equal(s.grad.targetMonth, 57);
  assert.equal(s.milestones.defenseMonth, null); assert.equal(s.milestones.graduated, false);
  assert.match(timelinePanel(s), /planning target, not a booking/);
});

test('a missed legacy target is honestly labelled and may be renegotiated without a past promise', () => {
  let s = candidate(64);
  s.grad = { settled: true, asked: true, askedMonth: 38, targetYear: 5, rounds: 1 };
  s.milestones.plannedDefense = 57; s.milestones.targetGradYear = 5;
  const before = structuredClone(s);
  assert.match(timelinePanel(s), /earlier target has passed/);
  assert.match(timelinePanel(s), /data-action="ask-timeline"/);
  assert.deepEqual(s, before, 'rendering does not silently rewrite the earlier agreement');
  assert.equal(canAskTimeline(s), true);
  s = dispatch(s, { type: 'ASK_TIMELINE' });
  assert.equal(s.grad.targetMonth, 66); assert.equal(s.grad.targetYear, 6); assert.equal(s.grad.rounds, 2);
  assert.equal(s.milestones.defenseMonth, null);
});

test('the last feasible target stays inside the funding window and the final month refuses before costs', () => {
  let s = dispatch(candidate(70), { type: 'ASK_TIMELINE' });
  assert.equal(s.grad.targetMonth, 71); assert.equal(s.grad.targetYear, 6);
  s = candidate(71); const before = structuredClone(s);
  assert.equal(canAskTimeline(s), false);
  assert.throws(() => dispatch(s, { type: 'ASK_TIMELINE' }), /No new defense target/);
  assert.deepEqual(s, before);
});

test('accepting a later date in year six preserves the concession cost without inventing a seventh year', () => {
  let s = candidate(64); s.advisor.caring = 0; s.advisor.ambition = 100; s.advisor.toxicity = 100;
  s = dispatch(s, { type: 'ASK_TIMELINE' });
  assert.equal(s.grad.settled, false); const hope = s.player.stats.hope;
  s = dispatch(s, { type: 'TIMELINE_MOVE', id: 'accept' });
  assert.equal(s.grad.targetMonth, 69); assert.equal(s.grad.targetYear, 6);
  assert.equal(s.player.stats.hope, Math.max(0, hope - 8));
  assert.equal(s.milestones.graduated, false);
});

test('English and Chinese panels distinguish a feasible target from a booking and a missed date', async () => {
  const { setAppLanguage } = await import('../src/i18n/apply.js');
  try {
    for (const lang of ['en', 'zh']) {
      setAppLanguage(lang);
      const s = dispatch(candidate(64), { type: 'ASK_TIMELINE' });
      const html = timelinePanel(s);
      assert.match(html, lang === 'zh' ? /约定的答辩目标/ : /Agreed defense target/);
      assert.match(html, lang === 'zh' ? /2034年3月/ : /March 2034/);
      assert.match(html, lang === 'zh' ? /并非正式预约/ : /not a booking/);
      s.month = 67;
      assert.match(timelinePanel(s), lang === 'zh' ? /此前的目标日期已过/ : /earlier target has passed/);
      assert.match(timelinePanel(s), /data-action="ask-timeline"/);
      const final = candidate(71);
      assert.match(timelinePanel(final), lang === 'zh' ? /资助结束前/ : /before funding ends/);
      assert.doesNotMatch(timelinePanel(final), /data-action="ask-timeline"/);
    }
  } finally { setAppLanguage('en'); }
});
