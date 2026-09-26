import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { resolveChoice } from '../src/engine/events.js';
import { monthlyBudget } from '../src/engine/life.js';

function fixture(seed) {
  let s = createRun(42);
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.event = 'money_trouble'; s.stage = 'event'; s.eventReturn = 'plan';
  s.debt = 1000; s.rng = seed;
  return s;
}

test('hardship approval is immediate eligibility for monthly support, not an advance or time jump', () => {
  let s;
  for (let seed = 0; seed < 30; seed++) {
    const candidate = fixture(seed), money = candidate.player.stats.money;
    const calendar = [candidate.month, candidate.week];
    resolveChoice(candidate, 'hardship');
    if (!candidate.flags.hardship) continue;
    s = candidate;
    assert.deepEqual([s.month, s.week], calendar);
    assert.equal(s.player.stats.money, money);
    assert.equal(s.debt, 1000);
    const budget = monthlyBudget(s);
    assert.equal(budget.support, 400); assert.equal(budget.interest, 0);
    break;
  }
  assert.ok(s, 'a deterministic approval must be exercised');
});
