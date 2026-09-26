import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { advisorInternshipAvailable, acceptAdvisorInternship, endInternship } from '../src/engine/internship.js';
import { monthlyLedger } from '../src/engine/life.js';
import { focusOptions } from '../src/engine/time.js';

function student(international = false) {
  let s = createRun(4242, { background: 'masters', topic: 'ml', international });
  const a = s.advisors[0];
  s.phase = 'admissions';
  s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.month = 18;
  s.stage = 'plan';
  s.event = null;
  s.eventQueue = [];
  s.scheduled = [];
  return s;
}
const referral = s => ({ advisorId: s.advisor.id, advisorName: s.advisor.name, company: 'Cloudvale' });

test('advisor referral guarantees a paid research summer without rerolling or paying upfront', () => {
  const s = student();
  const history = [{ typeId: 'sde', employer: 'Earlier employer', how: 'blessed' }];
  s.intern = { season: 1, applied: true, history, offers: [{ id: 'unrelated' }], talk: { outcome: 'forbidden' } };
  const before = { rng: s.rng, money: s.player.stats.money, career: s.career };
  assert.equal(advisorInternshipAvailable(s), true);
  assert.equal(acceptAdvisorInternship(s, referral(s)), true);
  assert.deepEqual(s.internship, { start: 21, end: 23, company: 'Cloudvale', typeId: 'research', mentor: s.advisor.name, mentorAdvisorId: s.advisor.id, salary: 8500 });
  assert.deepEqual({ rng: s.rng, money: s.player.stats.money, career: s.career }, before);
  assert.deepEqual(s.intern.history, history);
  assert.equal(s.intern.talk, null);
  assert.deepEqual(s.intern.offers, []);
  assert.equal(s.scheduled.some(x => x.id === 'cpt'), false);
  s.month = 21;
  s.tempo = 'month';
  assert.deepEqual(focusOptions(s).map(x => x.id), ['internship']);
  monthlyLedger(s);
  assert.equal(s.ledger.stipend, 8500);
  s.month = 24;
  endInternship(s);
  assert.equal(s.internship, null);
  assert.equal(s.counts.internships, 1);
  assert.equal(s.intern.history.at(-1).how, 'blessed');
  assert.equal(s.intern.history.at(-1).mentorAdvisorId, s.advisor.id);
  assert.equal(s.intern.history.at(-1).mentor, s.advisor.name);
  assert.equal(s.lastInternship.mentorAdvisorId, s.advisor.id);
  assert.equal(s.lastInternship.mentor, s.advisor.name);
});

test('existing placement and insufficient time reject without changing the run', () => {
  for (const change of [s => { s.internship = { start: 21, end: 23, company: 'Existing employer' }; }, s => { s.month = 57; }, s => { s.phase = 'ended'; }]) {
    const s = student();
    change(s);
    const before = structuredClone(s);
    assert.equal(advisorInternshipAvailable(s), false);
    assert.equal(acceptAdvisorInternship(s, referral(s)), false);
    assert.deepEqual(s, before);
  }
  const s = student();
  s.month = 56;
  assert.equal(acceptAdvisorInternship(s, referral(s)), true);
  assert.equal(s.internship.end, 59);
});

test('international referral queues paperwork once, respecting an existing active or queued case', () => {
  for (const existing of ['none', 'scheduled', 'active', 'queued']) {
    const s = student(true);
    if (existing === 'scheduled') s.scheduled.push({ id: 'cpt', week: 76 });
    if (existing === 'active') s.event = 'cpt';
    if (existing === 'queued') s.eventQueue.push('cpt_late');
    assert.equal(acceptAdvisorInternship(s, referral(s)), true);
    assert.equal(s.scheduled.filter(x => x.id === 'cpt').length, ['none', 'scheduled'].includes(existing) ? 1 : 0);
    const before = structuredClone(s);
    assert.equal(acceptAdvisorInternship(s, referral(s)), false);
    assert.deepEqual(s, before);
  }
});
