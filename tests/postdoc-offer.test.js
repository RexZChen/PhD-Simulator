import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { buildCV, generateOffers } from '../src/engine/epilogue.js';

function promisedPostdoc() {
  let s = createRun(42, { background: 'masters', topic: 'ml', international: false });
  const advisor = s.advisors[0];
  s.phase = 'admissions';
  s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  s.event = null;
  s.eventQueue = [];
  s.stage = 'plan';
  s.month = 60;
  s.advisorMode = { id: 'attentive', until: 62, since: 60 };
  s.rng = 1; // Successful response through the ordinary advisor action.
  s = dispatch(s, { type: 'ASK', id: 'postdoc_here' });
  assert.equal(s.flags.postdocOffered, true);
  return s;
}

function choose(s, id) {
  s.stage = 'commencement';
  return dispatch(s, { type: 'TAKE_OFFER', id });
}

test('an advisor-promised postdoc remains available after an unsuccessful search', () => {
  const s = promisedPostdoc();
  s.jobs.apps = Array.from({ length: 5 }, (_, i) => ({ employerId: `unsuccessful-${i}`, stage: 'rejected' }));
  const apps = structuredClone(s.jobs.apps);
  const offers = generateOffers(s, buildCV(s));
  assert.deepEqual(offers.map(o => o.employerId), ['pd_same_lab']);
  assert.deepEqual(s.jobs.apps, apps, 'the failed search is not rerolled');
  const next = choose(s, 'pd_same_lab');
  assert.equal(next.jobs.chosen, 'postdoc');
  assert.equal(next.jobs.taken.employerId, 'pd_same_lab');
  assert.equal(next.stage, 'epilogue');
});

test('local and external postdocs stay distinct and both can be selected', () => {
  const s = promisedPostdoc();
  s.jobs.apps = [{ employerId: 'pd_abroad', stage: 'offer' }];
  const withoutPromise = structuredClone(s);
  withoutPromise.flags.postdocOffered = false;
  const earned = generateOffers(withoutPromise, buildCV(withoutPromise));
  const offers = generateOffers(s, buildCV(s));
  assert.deepEqual(offers.filter(o => o.employerId !== 'pd_same_lab'), earned, 'preserve earned external terms');
  assert.deepEqual(offers.map(o => o.employerId), ['pd_abroad', 'pd_same_lab']);
  assert.equal(choose(structuredClone(s), 'pd_abroad').jobs.taken.employerId, 'pd_abroad');
  assert.equal(choose(structuredClone(s), 'pd_same_lab').jobs.taken.employerId, 'pd_same_lab');
  assert.equal(choose(structuredClone(s), 'postdoc').jobs.taken.employerId, 'pd_abroad', 'legacy track action still works');
});

test('the promised local appointment is not duplicated when already earned in the search', () => {
  const s = promisedPostdoc();
  s.jobs.apps = [{ employerId: 'pd_same_lab', stage: 'offer' }];
  assert.deepEqual(generateOffers(s, buildCV(s)).map(o => o.employerId), ['pd_same_lab']);
});

test('the promised postdoc is included when the player never ran a search', () => {
  const s = promisedPostdoc();
  s.jobs.apps = [];
  const offers = generateOffers(s, buildCV(s));
  assert.equal(offers.filter(o => o.employerId === 'pd_same_lab').length, 1);
  assert.equal(offers.some(o => o.kind === 'unplaced'), false);
});
