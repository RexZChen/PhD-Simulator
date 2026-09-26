import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { ask } from '../src/engine/advisor.js';
import { chatOptions, chatDraft } from '../src/ui/apps/chat.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { eligible } from '../src/engine/events.js';
import { eventById } from '../src/data/events.js';
import { monthlyLedger } from '../src/engine/life.js';

function student() {
  let s = createRun(4242);
  const advisor = s.advisors[0];
  s.phase = 'admissions';
  s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  s.month = 18; // March of year two.
  s.event = null;
  s.eventQueue = [];
  s.stage = 'plan';
  s.advisor.funding = 100;
  s.advisor.caring = 100;
  s.advisorMode = { id: 'normal' };
  s.player.stats.energy = 100;
  s.rng = 4242;
  return s;
}
const option = s => chatOptions(s, 'advisor').find(x => x.id === 'ask:summer_money');

test('one summer award cannot be collected again after the conversation cooldown', () => {
  const s = student();
  const money = s.player.stats.money;
  assert.equal(ask(s, 'summer_money').success, true);
  assert.equal(s.player.stats.money, money + 1800);
  s.month = 21; // June, twelve weeks later.
  assert.equal(option(s).disabled, true);
  const before = structuredClone(s);
  assert.throws(() => ask(s, 'summer_money'), /already have/);
  assert.deepEqual(s, before, 'a duplicate request spends no energy or RNG');
});

test('funding requests use the same seasonal window in the menu and engine', () => {
  for (const month of [12, 15, 17]) { // September, December, February.
    const s = student();
    s.month = month;
    assert.equal(option(s), undefined);
    assert.throws(() => ask(s, 'summer_money'), /March through August/);
  }
  for (const month of [18, 19, 20, 21, 22, 23]) {
    const s = student();
    s.month = month;
    assert.equal(option(s).disabled, false);
  }
});

test('a refusal preserves the opportunity to retry after eleven weeks', () => {
  const s = student();
  s.advisor.funding = 0;
  s.advisor.caring = 0;
  s.rng = 30000;
  assert.equal(ask(s, 'summer_money').success, false);
  assert.equal(!!s.flags.summerCovered, false);
  assert.equal(option(s).disabled, true);
  assert.throws(() => ask(s, 'summer_money'), /recently/);
  s.month = 21;
  s.advisor.funding = 100;
  s.advisor.caring = 100;
  s.rng = 4242;
  assert.equal(option(s).disabled, false);
  assert.equal(ask(s, 'summer_money').success, true);
});

test('September clears last summer coverage and next spring permits a new award', () => {
  let s = student();
  assert.equal(ask(s, 'summer_money').success, true);
  s.month = 23;
  s.stage = 'report';
  s.report = { monthsCovered: 1 };
  s = dispatch(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.month, 24);
  assert.equal(s.flags.summerCovered, false);
  s.month = 30;
  s.rng = 4242;
  s.advisorMode = { id: 'normal' };
  assert.equal(option(s).disabled, false);
  assert.equal(ask(s, 'summer_money').success, true);
});

test('funding copy is translated and does not claim every request happens in March', () => {
  const s = student();
  try {
    setAppLanguage('zh');
    assert.match(option(s).label, /暑期/);
    assert.match(option(s).sub, /11 周/);
    assert.match(chatDraft(s, 'advisor', 'ask:summer_money'), /房租/);
  } finally { setAppLanguage('en'); }
  assert.doesNotMatch(chatDraft(s, 'advisor', 'ask:summer_money'), /asking in March/);
});

function fundingScene(month = 19) {
  const s = student();
  s.month = month;
  s.ta = true;
  s.internship = null;
  s.event = 'summer_funding';
  s.stage = 'event';
  s.eventReturn = 'plan';
  s.rng = 4242;
  return s;
}

test('covered summers do not announce a new funding crisis', () => {
  const s = fundingScene();
  assert.equal(eligible(s, eventById.summer_funding), true);
  s.flags.summerCovered = true;
  assert.equal(eligible(s, eventById.summer_funding), false);
  s.flags.summerCovered = false;
  s.flags.summerTA = true;
  assert.equal(eligible(s, eventById.summer_funding), false);
  s.flags.summerTA = false;
  s.internship = { start: 21, end: 23 };
  assert.equal(eligible(s, eventById.summer_funding), false);
});

for (const outcome of ['ra', 'fallback_ta', 'chosen_ta']) {
  test(`summer funding scene ${outcome} actually prevents the stipend gap`, () => {
    let s = fundingScene();
    if (outcome === 'fallback_ta') s.advisor.funding = 0;
    s = dispatch(s, { type: 'CHOICE', id: outcome === 'chosen_ta' ? 'summer_ta' : 'advisor' });
    assert.equal(!!s.flags.summerCovered, outcome === 'ra');
    assert.equal(!!s.flags.summerTA, outcome !== 'ra');
    // Exclusion must survive the normal scene cooldown, rather than relying on that timer.
    delete s.cooldowns.summer_funding;
    assert.equal(eligible(s, eventById.summer_funding), false);
    if (outcome === 'ra') {
      s.month = 21;
      assert.equal(option(s).disabled, true, 'the advisor chat cannot award the same summer again');
    }
    s.month = 21;
    monthlyLedger(s);
    assert.equal(s.ledger.stipend, Math.round(s.program.stipend));
  });
}

test('a late internship arranged by the scene exists in years three through six', () => {
  for (const month of [31, 43, 55, 67]) {
    let s = fundingScene(month);
    s.career = 100;
    s = dispatch(s, { type: 'CHOICE', id: 'intern_late' });
    assert.equal(s.internship.start, month + 2);
    assert.equal(s.internship.end, month + 4);
    assert.equal(s.internship.salary, 9000);
    delete s.cooldowns.summer_funding;
    assert.equal(eligible(s, eventById.summer_funding), false);
    s.month = s.internship.start;
    monthlyLedger(s);
    assert.equal(s.ledger.stipend, 9000);
  }
});

test('a failed late internship search does not claim funding or create an internship', () => {
  let s = fundingScene(31);
  s.career = 0;
  s.rng = 30000;
  s = dispatch(s, { type: 'CHOICE', id: 'intern_late' });
  assert.equal(s.internship, null);
  assert.equal(!!s.flags.summerCovered, false);
  assert.equal(!!s.flags.summerTA, false);
});
