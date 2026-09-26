import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, hasPartner } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { eligible, templateById } from '../src/engine/events.js';
import { setAppLanguage } from '../src/i18n/apply.js';

function enrolled(household = 'partnerFar') {
  let s = createRun(4242, { background: 'masters', topic: 'ml', international: false, household });
  const a = s.advisors[6];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, status: 'admitted', funding: 'RA', poiId: a.id }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.month = 16; s.flags.social = true; s.player.hidden.stress = 70;
  return s;
}
function choose(s, event, id) {
  s.event = event; s.eventReturn = 'plan';
  return dispatch(s, { type: 'CHOICE', id });
}

test('the household chosen at the start is respected before any relationship event', () => {
  for (const household of ['partner', 'partnerFar', 'kids']) {
    const s = enrolled(household);
    assert.equal(hasPartner(s), true);
    assert.equal(eligible(s, templateById.relationship_start), false);
    assert.equal(eligible(s, templateById.relationship_strain), true);
  }
  assert.equal(eligible(enrolled('alone'), templateById.relationship_start), true);
});

test('one postponed deadline leads to a repair decision, and keeping it prevents the breakup', () => {
  let s = choose(enrolled(), 'relationship_strain', 'explain');
  assert.ok(s.scheduled.some(e => e.id === 'relationship_checkin'));
  assert.ok(!s.scheduled.some(e => e.id === 'relationship_end'));
  assert.equal(eligible(s, templateById.relationship_checkin), true);
  s = choose(s, 'relationship_checkin', 'keep');
  assert.equal(hasPartner(s), true);
  assert.equal(s.flags.strainIgnored, false);
  assert.equal(eligible(s, templateById.relationship_end), false);
  assert.equal(eligible(s, templateById.relationship_checkin), false);
});

test('repeated postponement reaches the breakup and old long-distance history stays ended', () => {
  let s = choose(enrolled(), 'relationship_strain', 'explain');
  s = choose(s, 'relationship_checkin', 'postpone');
  assert.ok(s.scheduled.some(e => e.id === 'relationship_end'));
  assert.equal(eligible(s, templateById.relationship_end), true);
  s = choose(s, 'relationship_end', 'grieve');
  assert.equal(hasPartner(s), false);
  assert.equal(eligible(s, templateById.opt_partner_far), false);
  assert.equal(eligible(s, templateById.relationship_strain), false);
  s = choose(s, 'relationship_start', 'invest');
  assert.equal(hasPartner(s), true);
  assert.equal(eligible(s, templateById.opt_partner_far), false, 'a new partner does not inherit the former partner’s city');
});

test('the relationship decision and its consequences are translated together', () => {
  setAppLanguage('zh');
  try {
    const checkin = templateById.relationship_checkin;
    assert.equal(checkin.title, '一份没附议程的邀请');
    assert.match(checkin.text, /接受.*导师/);
    assert.match(checkin.choices.find(c => c.id === 'keep').result, /这次你挪的是工作/);
    assert.match(checkin.choices.find(c => c.id === 'postpone').result, /没有另约/);
  } finally { setAppLanguage('en'); }
});
