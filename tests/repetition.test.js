import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { scheduleTurnEvents, openNext, templateById } from '../src/engine/events.js';
import { monthlyMeetings } from '../src/engine/advisor.js';

function enrolled(seed = 19) {
  const s = createRun(seed, { background: 'masters', topic: 'systems', international: false });
  const advisor = s.advisors[0];
  s.phase = 'admissions';
  s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, status: 'admitted', funding: 'RA', poiId: advisor.id }];
  return dispatch(s, { type: 'ENROLL', id: advisor.id });
}

test('routine group scenes do not repeat at consecutive presentations', () => {
  const s = enrolled();
  let previous;
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    s.month = 12 + i;
    s.event = null;
    s.eventQueue = [];
    scheduleTurnEvents(s, { tempo: 'month', present: true });
    const id = [s.event, ...s.eventQueue].find(id => id?.startsWith('group_'));
    assert.ok(id, 'the meeting still happens');
    assert.notEqual(id, previous, `presentation ${i} repeats ${id}`);
    seen.add(id);
    s.seen[id] = (s.seen[id] || 0) + 1;
    s.cooldowns[id] = s.month;
    previous = id;
  }
  assert.ok(seen.size >= 5, 'a run draws from multiple group scenes');
});

test('a repeated crunch scene rotates its text, including after save and reload', () => {
  let s = enrolled();
  const variants = [];
  const count = templateById.meet_crunch.text.length;
  for (let i = 0; i < count * 8; i++) {
    s.eventQueue = ['meet_crunch'];
    openNext(s);
    variants.push(s.eventVariant);
    if (variants.length >= count) assert.equal(new Set(variants.slice(-count)).size, count,
      'all authored variants appear before repeating');
    s = JSON.parse(JSON.stringify(s));
  }
});

test('monthly group meeting digests avoid consecutive repeated lines', () => {
  const s = enrolled();
  let previous;
  for (let i = 0; i < 24; i++) {
    const { groupLine } = monthlyMeetings(s, { tempo: 'month' });
    assert.notEqual(groupLine, previous);
    previous = groupLine;
  }
});
