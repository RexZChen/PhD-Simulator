import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, fill } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject } from '../src/engine/paper.js';
import { eligible, templateById, chooseActor, resolveChoice } from '../src/engine/events.js';
import { setAppLanguage } from '../src/i18n/apply.js';

function fixture() {
  let s = createRun(42);
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.event = null; s.stage = 'plan'; s.month = 30; s.advisor.toxicity = 70;
  s.projects = []; s.activeProjectId = null;
  s.labmates = [{ id: 'gone', name: 'Former Person', status: 'left', bond: 30 },
    { id: 'present', name: 'Current Person', status: 'active', bond: 30 }];
  return s;
}

test('draft discussion needs actual editable text; presentation checks need developed editable work', () => {
  const s = fixture();
  const ids = ['group_nobody_read', 'group_round_strong', 'group_public_correction'];
  for (const id of ids) assert.equal(eligible(s, templateById[id]), false, id);
  const p = createProject(s); s.activeProjectId = p.id;
  p.progress = 60; p.draft = 0;
  assert.equal(eligible(s, templateById.group_nobody_read), false);
  p.draft = 20;
  for (const id of ids) assert.equal(eligible(s, templateById[id]), true, id);
  for (const status of ['Submitted', 'Rebuttal', 'Accepted', 'Abandoned', 'Advisor Review']) {
    p.status = status;
    for (const id of ids) assert.equal(eligible(s, templateById[id]), false, `${id}: ${status}`);
  }
});

test('strong-round discussion binds a real active labmate and rewards that relationship', () => {
  const s = fixture(), p = createProject(s); s.activeProjectId = p.id; p.progress = 60;
  const e = templateById.group_round_strong;
  s.eventActor = chooseActor(s, e);
  assert.deepEqual(s.eventActor, { type: 'labmate', id: 'present' });
  const c = e.choices.find(c => c.id === 'credit');
  assert.ok(fill(s, c.text).includes('Current Person'));
  s.event = e.id; s.stage = 'event'; s.eventReturn = 'plan';
  resolveChoice(s, 'credit');
  assert.equal(s.labmates[0].bond, 30);
  assert.equal(s.labmates[1].bond, 48);
  s.labmates[1].status = 'left';
  assert.equal(eligible(s, e), false);
});

for (const lang of ['en', 'zh']) {
  test(`deferring a correction or unread draft creates no invented completed work in ${lang}`, () => {
    setAppLanguage(lang);
    try {
      const s = fixture(), p = createProject(s); s.activeProjectId = p.id; p.progress = 60; p.draft = 30;
      for (const [id, choice] of [['group_public_correction', 'note'], ['group_nobody_read', 'rebook']]) {
        const before = structuredClone(p), scheduled = structuredClone(s.scheduled);
        s.event = id; s.stage = 'event'; s.eventReturn = 'plan';
        const text = templateById[id].choices.find(c => c.id === choice).result;
        assert.match(text, lang === 'zh' ? /仍未核实|新的时间还没约/ : /still unverified|No new time is booked/);
        resolveChoice(s, choice);
        assert.deepEqual(p, before); assert.deepEqual(s.scheduled, scheduled);
      }
      assert.match(templateById.group_round_strong.choices.find(c => c.id === 'credit').text,
        lang === 'zh' ? /请\{labmate\}质疑/ : /Invite \{labmate\}/);
    } finally { setAppLanguage('en'); }
  });
}
