import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { maybePushback, resolveChoice } from '../src/engine/events.js';
import { meetings } from '../src/data/meetings.js';

function student() {
  let s = createRun(4242);
  const a = s.advisors[6];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.eventQueue = []; s.eventReturn = 'plan'; s.stage = 'event';
  s.advisorMode = { id: 'pressed' };
  s.advisor.ambition = 100; s.advisor.toxicity = 100;
  s.relationship.satisfaction = 20;
  return s;
}

test('accepting offered rest or praise finishes without an unrelated confrontation', () => {
  for (const [event, choice] of [['meet_rest', 'take'], ['meet_praise', 'enjoy']]) {
    for (let seed = 1; seed <= 16; seed++) {
      const s = student();
      s.event = event; s.eventVariant = 0; s.rng = seed;
      const hope = s.player.stats.hope;
      resolveChoice(s, choice);
      assert.equal(s.stage, 'plan', `${event}, seed ${seed}`);
      assert.equal(s.pushback ?? null, null);
      assert.ok(s.player.stats.hope > hope, 'the offered benefit still applies');
      if (event === 'meet_rest') assert.equal(s.leaveWeeks, 1);
    }
  }
});

test('every cancellation skips live pushback without spending a random draw', () => {
  for (const event of meetings.filter(e => e.conditions?.cancelled)) {
    const s = student(); s.event = event.id;
    const before = structuredClone(s);
    assert.equal(maybePushback(s, event.choices[0]), false, event.id);
    assert.deepEqual(s, before, 'an absent advisor cannot start another exchange');
  }
});

test('a difficult live meeting can still trigger a second beat', () => {
  const outcomes = new Set();
  for (let seed = 1; seed <= 32; seed++) {
    const s = student(); s.event = 'meet_criticism'; s.rng = seed;
    const result = maybePushback(s, { id: 'specific' });
    outcomes.add(result);
    if (result) {
      assert.equal(s.stage, 'pushback');
      assert.equal(s.pushback.from, 'meet_criticism');
    }
  }
  assert.deepEqual(outcomes, new Set([true, false]));
});
