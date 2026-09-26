import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { dispatch } from '../src/engine/game.js';
import { buildCV, generateOffers, startEpilogue, offerView } from '../src/engine/epilogue.js';

function graduate() {
  let s = createRun(42, { background: 'masters', topic: 'ml', international: false });
  const advisor = s.advisors[0];
  s.phase = 'admissions'; s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  s.event = null; s.eventQueue = []; s.stage = 'commencement'; s.month = 60;
  s.thesis = { deposited: true }; s.milestones.graduated = true;
  s.venture = {
    id: 'venture-test', project: { id: 'research-test', title: 'A reproducible result' },
    school: { id: s.program.id, name: s.program.name }, advisor: { id: s.advisor.id, name: s.advisor.name },
    startedMonth: 48, status: 'agreed', policyRead: true,
    terms: { agreedMonth: 49, outcome: 'advisor-reduced', shares: { you: 50, advisor: 10, university: 15, cofounder: 25 } },
    commitment: 'thesis-first', workloadPausedUntil: null, joinedMonth: null,
  };
  return s;
}

for (const branch of ['landed', 'unsuccessful', 'no-search']) test(`thesis-first spinout adds a distinct optional role after ${branch} market generation`, () => {
  const s = graduate();
  s.jobs.apps = branch === 'landed' ? [{ employerId: 'pd_abroad', stage: 'offer' }]
    : branch === 'unsuccessful' ? Array.from({ length: 5 }, (_, i) => ({ employerId: `rejected-${i}`, stage: 'rejected' })) : [];
  s.flags.postdocOffered = true;
  const withoutVenture = structuredClone(s); delete withoutVenture.venture;
  const earned = generateOffers(withoutVenture, buildCV(withoutVenture));
  const offers = generateOffers(s, buildCV(s));
  assert.deepEqual(offers.filter(o => !o.venture), earned.filter(o => o.kind !== 'unplaced'));
  assert.equal(offers.filter(o => o.venture).length, 1);
  const venture = offers.find(o => o.venture);
  assert.equal(venture.kind, 'founder'); assert.equal(venture.salary, 0);
  assert.match(venture.equity, /50/);
  assert.equal(offers.some(o => o.kind === 'unplaced'), false);
  assert.equal(s.venture.commitment, 'thesis-first', 'presenting the option never commits the player');
});

test('spinout offer needs actual deposit and graduation; board commitments are not founder commitments', () => {
  for (const mutate of [s => { s.thesis.deposited = false; }, s => { s.milestones.graduated = false; }, s => { s.venture.terms = null; }, s => { s.venture.status = 'considering'; }, s => { s.venture.commitment = 'board'; }]) {
    const s = graduate(); mutate(s);
    s.jobs.apps = Array.from({ length: 5 }, () => ({ stage: 'rejected' }));
    assert.equal(generateOffers(s, buildCV(s)).some(o => o.venture), false);
  }
});

test('choosing the spinout records voluntary unfunded founding rather than a failed search', () => {
  const s = graduate();
  s.jobs.apps = Array.from({ length: 5 }, () => ({ stage: 'rejected' }));
  const offer = generateOffers(s, buildCV(s)).find(o => o.venture);
  startEpilogue(s, offer.employerId);
  assert.equal(s.venture.commitment, 'joined');
  assert.equal(s.venture.joinedMonth, s.month);
  assert.equal(s.jobs.taken.employerId, offer.employerId);
  assert.equal(s.jobs.taken.salary, 0);
  assert.match(s.history.at(-1).text, /salary is \$0/);
  assert.doesNotMatch(s.history.at(-1).text, /without an offer/);
});

test('choosing another employer declines active founding without disturbing that employer', () => {
  const s = graduate();
  s.jobs.apps = [{ employerId: 'pd_abroad', stage: 'offer' }];
  generateOffers(s, buildCV(s));
  startEpilogue(s, 'pd_abroad');
  assert.equal(s.venture.commitment, 'declined');
  assert.equal(s.jobs.taken.employerId, 'pd_abroad');
  assert.equal(s.jobs.chosen, 'postdoc');
  assert.equal(s.venture.joinedMonth, null);
});

test('board membership is a factual zero-point CV role independent of the chosen career', () => {
  const s = graduate(); s.venture.commitment = 'board';
  const baseline = structuredClone(s); delete baseline.venture;
  const cv = buildCV(s), without = buildCV(baseline);
  assert.equal(cv.score, without.score);
  assert.deepEqual(cv.axes, without.axes);
  const role = cv.lines.find(line => line.text.includes('Board member'));
  assert.equal(role.points, 0); assert.match(role.text, /A reproducible result/);
  s.jobs.apps = [{ employerId: 'pd_abroad', stage: 'offer' }];
  generateOffers(s, cv); startEpilogue(s, 'pd_abroad');
  assert.equal(s.venture.commitment, 'board');
  assert.equal(s.jobs.chosen, 'postdoc');
});

test('a generic founder offer remains distinct from the recorded spinout', () => {
  const s = graduate();
  s.jobs.apps = [{ employerId: 'klarion_labs', stage: 'offer' }];
  const offers = generateOffers(s, buildCV(s));
  const founder = offers.find(o => o.employerId === 'klarion_labs');
  const spinout = offers.find(o => o.venture);
  assert.equal(founder.kind, 'founder');
  assert.notEqual(spinout.employerId, founder.employerId);
  startEpilogue(s, founder.employerId);
  assert.equal(s.jobs.taken.employerId, 'klarion_labs');
  assert.equal(s.venture.commitment, 'declined');
  assert.equal(s.venture.joinedMonth, null);
});


test('an unsuccessful search keeps a nonjoining alternative beside the unfunded spinout', () => {
  const s = graduate();
  s.jobs.apps = Array.from({ length: 5 }, () => ({ stage: 'rejected' }));
  const offers = generateOffers(s, buildCV(s));
  const alternative = offers.find(o => o.kind === 'unplaced');
  assert.ok(alternative, 'the player can decline unpaid founding without another job');
  assert.equal(offers.filter(o => o.venture).length, 1);
  startEpilogue(s, alternative.employerId);
  assert.equal(s.jobs.chosen, 'unplaced');
  assert.equal(s.venture.commitment, 'declined');
});


test('offer wording follows language after reload without changing identity, pay, saved terms or RNG', () => {
  setAppLanguage('en');
  const s = graduate();
  s.jobs.apps = [{ employerId: 'pd_abroad', stage: 'offer' }];
  generateOffers(s, buildCV(s));
  const saved = JSON.parse(JSON.stringify(s));
  try {
    setAppLanguage('zh');
    for (const offer of saved.jobs.market) {
      const view = offerView(saved, offer);
      assert.equal(view.employerId, offer.employerId);
      assert.equal(view.salary, offer.salary);
      assert.equal(view.months, offer.months);
      assert.notEqual(view.catch, offer.catch);
    }
    assert.deepEqual(saved, JSON.parse(JSON.stringify(s)));
    setAppLanguage('en');
    for (const offer of saved.jobs.market) assert.equal(offerView(saved, offer).catch, offer.catch);
  } finally { setAppLanguage('en'); }
});
