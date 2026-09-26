import test from 'node:test';
import assert from 'node:assert/strict';
import { venues, venueById, acceptsThisMonth, nextDeadline, timelineFor } from '../src/data/venues.js';
import { calendarOf, monthOf } from '../src/data/calendar.js';

const index = (year, month) => (year - 2028) * 12 + month - 9;
const ym = month => { const c = calendarOf(month); return [c.year, c.month]; };

test('KDD July and following February rounds feed one August meeting with distinct review lengths', () => {
  const v = venueById.kddish;
  for (let year = 2029; year <= 2033; year++) {
    const july = index(year, 7), february = index(year + 1, 2);
    assert.equal(nextDeadline(v, index(year, 6), monthOf), july);
    assert.equal(nextDeadline(v, index(year, 8), monthOf), february);
    assert.equal(acceptsThisMonth(v, july, monthOf), true);
    assert.equal(acceptsThisMonth(v, index(year, 8), monthOf), false);
    const first = timelineFor(v, july, monthOf), second = timelineFor(v, february, monthOf);
    assert.deepEqual(ym(first.rebuttal), [year, 10]);
    assert.deepEqual(ym(first.decision), [year, 11]);
    assert.deepEqual(ym(second.rebuttal), [year + 1, 4]);
    assert.deepEqual(ym(second.decision), [year + 1, 5]);
    assert.deepEqual(ym(first.conference), [year + 1, 8]);
    assert.equal(first.conference, second.conference);
  }
});

test('SODA author response leaves time before October decision and next-year conference', () => {
  const tl = timelineFor(venueById.sodastream, index(2029, 7), monthOf);
  assert.deepEqual(ym(tl.rebuttal), [2029, 9]);
  assert.deepEqual(ym(tl.decision), [2029, 10]);
  assert.deepEqual(ym(tl.conference), [2030, 1]);
  assert.ok(tl.rebuttal < tl.decision);
});

test('previous-year STOC and ICRA submissions keep conference-year chronology', () => {
  for (const [id, submitted, decision, conference] of [
    ['stock', 11, 2, 6], ['icramble', 9, 1, 6],
  ]) {
    const tl = timelineFor(venueById[id], index(2028, submitted), monthOf);
    assert.deepEqual(ym(tl.decision), [2029, decision]);
    assert.deepEqual(ym(tl.conference), [2029, conference]);
  }
});

test('every named archetype has an official reference; fictional workshop does not invent one', () => {
  for (const v of venues.filter(v => v.id !== 'workshop')) {
    assert.ok(v.reference?.cycle, v.id);
    assert.match(v.reference.source, /^https:\/\//, v.id);
    assert.ok(v.reference.submitted, v.id);
  }
  assert.equal(venueById.workshop.reference, null);
  assert.equal(venueById.sospicious.reference.response, '2025-07-01 / 2025-07-03');
  assert.equal(venueById.sospicious.rebuttal, null, 'same-month response is documented, not opened and immediately closed');
});

test('projected journal availability stays rolling without fabricating a conference', () => {
  for (let month = 0; month < 24; month++) {
    const v = venueById.tmlrgh;
    assert.equal(nextDeadline(v, month, monthOf), month);
    assert.equal(acceptsThisMonth(v, month, monthOf), true);
    assert.equal(timelineFor(v, month, monthOf).conference, null);
  }
});
