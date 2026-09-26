import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { eligible, scheduleTurnEvents } from '../src/engine/events.js';
import { eventById } from '../src/data/events.js';
import { addFunding, fundingTotal, fundingScore, fundingLines, hasMajorFunding } from '../src/engine/funding.js';
import { setAppLanguage } from '../src/i18n/apply.js';

function applicant() {
  let s = createRun(4242);
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.month = 1; s.event = 'fund_fellowship_apply'; s.eventQueue = []; s.stage = 'event'; s.eventReturn = 'plan';
  return s;
}

for (const choice of ['write', 'recycle']) {
  test(`${choice} submits the fellowship application and schedules the April result`, () => {
    let s = applicant();
    assert.equal(eligible(s, eventById.fund_fellowship_apply), true);
    s = dispatch(s, { type: 'CHOICE', id: choice });
    assert.equal(s.flags.storyFellowshipApplied, true);
    assert.ok(s.scheduled.some(x => x.id === 'fund_fellowship_result' && x.week === 28));
    assert.equal(eligible(s, eventById.fund_fellowship_result), false, 'no October result');
    s.month = 7; s.week = 0; s.event = null; s.eventQueue = [];
    scheduleTurnEvents(s, { tempo: 'month' });
    assert.equal(s.event, 'fund_fellowship_result');
    const money = s.player.stats.money;
    s = dispatch(s, { type: 'CHOICE', id: 'cv' });
    assert.equal(fundingTotal(s), 0);
    assert.equal(s.player.stats.money, money);
    assert.equal(hasMajorFunding(s), false);
    assert.equal(!!s.flags.fellow, false);
    assert.equal(s.achievements.includes('fundedyourself'), false);
    assert.equal(s.funding.records[0].kind, 'recognition');
    assert.match(fundingLines(s)[0].text, /unfunded/);
    assert.equal(fundingLines(s)[0].section, 'awards', 'the CV lists honors separately from funded grants');
    assert.ok(fundingScore(s) > 0 && fundingScore(s) < 5);
    s.month = 19;
    assert.equal(eligible(s, eventById.fund_fellowship_result), false, 'result cannot recur next April');
  });
}

test('skipping the application cannot produce its result or recognition', () => {
  let s = applicant();
  s = dispatch(s, { type: 'CHOICE', id: 'skip' });
  assert.equal(!!s.flags.storyFellowshipApplied, false);
  assert.ok(!s.scheduled.some(x => x.id === 'fund_fellowship_result'));
  s.month = 7;
  assert.equal(eligible(s, eventById.fund_fellowship_result), false);
  assert.equal(eventById.fund_fellowship_result.scheduledOnly, true);
});

test('unfunded recognition cannot claim money or trigger funding achievements', () => {
  const s = applicant();
  for (let i = 0; i < 3; i++) addFunding(s, 'recognition', { name: 'Honorable mention', amount: 111000 });
  assert.equal(fundingTotal(s), 0);
  assert.ok(s.funding.records.every(x => x.amount === 0));
  assert.equal(s.achievements.includes('thefundedone'), false);
  assert.equal(!!s.flags.fellow, false);
  addFunding(s, 'fellowship', { name: 'Funded fellowship', amount: 111000 });
  assert.equal(fundingTotal(s), 111000);
  assert.equal(s.flags.fellow, true);
  assert.ok(s.achievements.includes('fundedyourself'));
});

test('Chinese fellowship result makes the lack of funding explicit', () => {
  try {
    setAppLanguage('zh');
    const e = eventById.fund_fellowship_result;
    assert.match(e.title, /荣誉提名/);
    assert.match(e.text.join(''), /不提供资助/);
    assert.match(e.choices.find(x => x.id === 'cv').text, /不附资助/);
    const s = applicant(); addFunding(s, 'recognition', { name: '研究生研究奖学金' });
    assert.match(fundingLines(s)[0].text, /不附资助/);
  } finally { setAppLanguage('en'); }
});
