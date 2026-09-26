import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { eligible, resolveChoice, templateById } from '../src/engine/events.js';
import { schools } from '../src/data/catalog.js';
import { setAppLanguage } from '../src/i18n/apply.js';

const ids = ['firstyear_life_first_check', 'firstyear_life_first_winter', 'life_ongoing_hobby_return',
  'life_ongoing_partner_ledger', 'life_ongoing_health_deferred', 'life_ongoing_pet_schedule'];
function student() {
  let s = createRun(4242, { background: 'masters', topic: 'ml', international: false, household: 'alone' });
  const a = s.advisors[6]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  Object.assign(s, { month: 0, stage: 'plan', event: null, eventQueue: [], eventReturn: 'plan' });
  s.player.stats.energy = 70; s.player.stats.money = 1000; s.debt = 300;
  return s;
}

test('arrival support is one-time and limited to arrival, with explicit paperwork costs and no invented loan', () => {
  const e = templateById.firstyear_life_first_check;
  for (const [id, grant, energy] of [['credit', 200, -5], ['advance', 80, -2], ['thin', 0, 5]]) {
    const s = student(), ledger = structuredClone(s.ledger);
    assert.ok(eligible(s, e)); s.event = e.id; s.stage = 'event';
    resolveChoice(s, id);
    assert.equal(s.player.stats.money, 1000 + grant); assert.equal(s.player.stats.energy, 70 + energy);
    assert.equal(s.debt, 300); assert.deepEqual(s.ledger, ledger, 'arrival grant does not move or replay monthly payroll');
    s.seen[e.id] = 1; assert.equal(eligible(s, e), false);
  }
  const late = student(); late.month = 2;
  assert.equal(eligible(late, e), false);
  assert.doesNotMatch(JSON.stringify(e), /seven weeks|stipend advance|credit card|hungry September/);
});

test('first winter uses real cold-climate catalog values and winter months, without presuming TA work', () => {
  const s = student(), e = templateById.firstyear_life_first_winter;
  for (const climate of [...new Set(schools.map(school => school.climate))]) {
    s.program = { ...s.program, climate }; s.month = 2; // November, first year.
    assert.equal(eligible(s, e), climate === 'cold', climate);
  }
  s.program.climate = 'cold'; s.month = 0; assert.equal(eligible(s, e), false);
  s.month = 5; s.ta = false; assert.equal(eligible(s, e), true);
  s.month = 14; assert.equal(eligible(s, e), false, 'a second winter is not the first');
  assert.doesNotMatch(e.text.join(' '), /teach|section|Nineteen degrees/);
});

test('partner and pet stories require the relationship or animal actually present', () => {
  const s = student(); s.month = 12;
  const partner = templateById.life_ongoing_partner_ledger, cat = templateById.life_ongoing_pet_schedule;
  assert.equal(eligible(s, partner), false); assert.equal(eligible(s, cat), false);
  s.player.profile.household = 'partnerFar'; assert.equal(eligible(s, partner), true);
  s.flags.partner = false; assert.equal(eligible(s, partner), false, 'recorded breakup overrides initial household');
  s.flags.partner = true; assert.equal(eligible(s, partner), true);
  s.flags.cat = true; assert.equal(eligible(s, cat), true);
  s.flags.cat = false; assert.equal(eligible(s, cat), false);
  assert.doesNotMatch(JSON.stringify(cat), /diabet|insulin|units|dose|per month|a month/);
});

test('hobby and wellbeing choices do not sell invented possessions or assert clinical facts', () => {
  const hobby = templateById.life_ongoing_hobby_return, health = templateById.life_ongoing_health_deferred;
  assert.ok(hobby.choices.every(choice => !(choice.effects.money > 0)));
  assert.doesNotMatch(JSON.stringify(hobby), /since second year|several springs|Sell the amp|It has been years/);
  assert.doesNotMatch(JSON.stringify(health), /148|ninety|twenty-nine|blood pressure|since March|treatment|October/);
  for (const e of [hobby, health]) {
    for (const choice of e.choices) {
      const s = student(); s.event = e.id; s.stage = 'event';
      const stats = structuredClone(s.player.stats);
      resolveChoice(s, choice.id);
      assert.notDeepEqual(s.player.stats, stats, 'choices have actual costs or benefits without needing an editable paper');
    }
  }
});

test('all six scenes request context rechecking and Chinese preserves gates, costs and corrected premises', () => {
  const mechanics = id => {
    const e = templateById[id];
    return { conditions: e.conditions, prerequisites: e.prerequisites, once: e.once, recheckContext: e.recheckContext,
      choices: e.choices.map(c => ({ id: c.id, effects: c.effects })) };
  };
  const before = ids.map(id => structuredClone(mechanics(id)));
  setAppLanguage('zh');
  try {
    assert.deepEqual(ids.map(mechanics), before);
    for (const id of ids) assert.equal(templateById[id].recheckContext, true);
    assert.match(templateById.firstyear_life_first_check.text[0], /无需偿还/);
    assert.doesNotMatch(JSON.stringify(templateById.life_ongoing_pet_schedule), /胰岛素|糖尿病|两单位/);
    assert.doesNotMatch(JSON.stringify(templateById.life_ongoing_health_deferred), /148|二十九|血压/);
    assert.doesNotMatch(JSON.stringify(templateById.life_ongoing_hobby_return), /卖.*音箱|第二年|好几个春天/);
  } finally { setAppLanguage('en'); }
});
