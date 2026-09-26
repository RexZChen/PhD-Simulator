import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { startTrip, scoreTalk } from '../src/engine/trip.js';
import { questioners } from '../src/data/conference.js';
import { zh } from '../src/i18n/zh/index.js';

function conference() {
  let s = createRun(4242, { background: 'masters', topic: 'ml', international: false });
  const a = s.advisors[6];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s = dispatch(s, { type: 'START_PROJECT' });
  const p = s.projects[0];
  Object.assign(p, { status: 'Accepted', venueId: 'osdisaster', submissionHistory: [{ venueId: 'osdisaster', venue: 'OSDIsaster', month: 2, outcome: 'Accept', reviewers: [], quality: 72, diamonds: 4 }] });
  s.player.stats.money = 12000;
  startTrip(s, p, 'boston');
  scoreTalk(s, { hits: 4, hype: 1, misses: 1 });
  return s;
}

test('every conference question accepts a timeout, records silence and advances without rewarding it', () => {
  for (const q of questioners) {
    let s = conference();
    s.trip.qa = [q.id, q.id, q.id];
    s.player.stats.confidence = 60; s.player.stats.stress = 20;
    const { cites, connections } = s.trip;
    s = dispatch(s, { type: 'TRIP_QA', id: 'timeout' });
    assert.equal(s.trip.qaIndex, 1);
    assert.equal(s.trip.qaResults[0].choiceId, 'timeout');
    assert.equal(s.trip.qaResults[0].good, false);
    assert.equal(s.player.stats.confidence, 57);
    assert.equal(s.player.stats.stress, 24);
    assert.equal(s.trip.cites, cites);
    assert.equal(s.trip.connections, connections);
    assert.ok(zh.ui[s.trip.qaResults[0].line], 'timeout feedback has a Chinese translation');
    s = dispatch(s, { type: 'TRIP_QA', id: q.best });
    assert.equal(s.trip.qaIndex, 2, 'a normal answer still works after the timeout');
    assert.equal(s.trip.qaResults[1].good, true);
  }
});

test('three conference timeouts finish Q&A and leave day activities playable', () => {
  let s = conference();
  s.trip.day = s.trip.talkDay;
  for (let i = 0; i < 3; i++) s = dispatch(s, { type: 'TRIP_QA', id: 'timeout' });
  assert.equal(s.trip.qaDone, true);
  assert.equal(s.trip.qaResults.length, 3);
  assert.ok(s.trip.qaResults.every(r => !r.good));
  assert.ok(!s.achievements.includes('qa'));
  const day = s.trip.day;
  s = dispatch(s, { type: 'TRIP_DAY', id: 'coffee' });
  assert.equal(s.trip.day, day + 1);
});
