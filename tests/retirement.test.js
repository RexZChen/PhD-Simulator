import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, activeProject } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { newAdvisor } from '../src/engine/advisor.js';
import { monthlyLedger } from '../src/engine/life.js';
import { availableWriters, askLetter } from '../src/engine/letters.js';
import { maintainSupervision, handoverSupportActive, handoverCoversRemainingSummer, canConsultEmeritus } from '../src/engine/supervision.js';
import { saveRun, loadSave, emptyMeta, validRun } from '../src/engine/save.js';
import { eligible, templateById, choiceUnavailable, openNext } from '../src/engine/events.js';

function student(month = 28) {
  let s = createRun(842, { background: 'masters', topic: 'ml' });
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s = dispatch(s, { type: 'START_PROJECT' });
  s.month = month; s.eventQueue = []; s.scheduled = []; s.eventReturn = 'plan';
  s.event = 'advisor_retires'; s.stage = 'event'; s.rng = 1;
  s.player.stats.energy = 90; s.player.stats.money = 10000;
  s.relationship.satisfaction = 100; s.relationship.trust = 80;
  return s;
}
const choice = (s, id) => dispatch(s, { type: 'CHOICE', id });
const memory = () => { const data = new Map(); return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) }; };

test('co-advising appoints a successor and retains a distinct, usable emeritus mentor', () => {
  const s = student(), old = s.advisor.id;
  const authors = structuredClone(activeProject(s).collaborators);
  s.milestones.prelim = 'pass'; s.coursework = 80;
  let next = choice(s, 'coadvise');
  assert.notEqual(next.advisor.id, old);
  assert.equal(next.formerAdvisors.at(-1).reason, 'retired');
  assert.equal(next.supervision.mentor.id, old);
  assert.equal(next.supervision.advisorId, next.advisor.id);
  assert.equal(next.supervision.kind, 'coadvised');
  assert.equal(next.milestones.prelim, 'pass'); assert.equal(next.coursework, 80);
  assert.deepEqual(activeProject(next).collaborators, authors);
  const before = structuredClone(next);
  next = dispatch(next, { type: 'EMERITUS_CONSULT' });
  assert.equal(next.player.stats.energy, before.player.stats.energy - 4);
  assert.equal(activeProject(next).progress, activeProject(before).progress + 4);
  assert.equal(next.readiness, before.readiness + 3);
  assert.throws(() => dispatch(next, { type: 'EMERITUS_CONSULT' }));
  const storage = memory(); assert.equal(saveRun(storage, next, emptyMeta()).error, null);
  const resumed = loadSave(storage).run;
  assert.equal(canConsultEmeritus(resumed).ok, false);
  resumed.month++; assert.equal(canConsultEmeritus(resumed).ok, true);
  resumed.leaveWeeks = 1; assert.equal(canConsultEmeritus(resumed).ok, false);
});

test('a declined emeritus arrangement still installs a local primary, without imaginary support', () => {
  const s = student(); s.relationship.satisfaction = 0;
  const old = s.advisor.id, next = choice(s, 'coadvise');
  assert.notEqual(next.advisor.id, old); assert.equal(next.supervision, undefined);
  assert.equal(next.achievements.includes('keptemeritus'), false);
  assert.equal(canConsultEmeritus(next).ok, false);
});

test('emeritus and primary writers have separate identities; replacement cannot inherit the agreement', () => {
  const s = choice(student(), 'coadvise'), mentor = s.supervision.mentor.id;
  const writers = availableWriters(s).filter(w => w.kind === 'advisor');
  assert.deepEqual(new Set(writers.map(w => w.advisorId)), new Set([mentor, s.advisor.id]));
  askLetter(s, writers.find(w => w.advisorId === mentor).id);
  assert.equal(s.letters.asked[0].advisorId, mentor);
  newAdvisor(s, 'reassigned');
  assert.equal(s.supervision, null); assert.equal(s.flags.coadvised, undefined);
  assert.equal(s.supervisionHistory.at(-1).mentor.id, mentor);
  assert.equal(s.letters.asked[0].advisorId, mentor);
});

test('handover protects exactly three future payroll months and charges maintenance once per month', () => {
  const s = choice(student(32), 'inherit_lab');
  const p = activeProject(s);
  assert.equal(s.supervision.projectId, p.id);
  assert.deepEqual([s.supervision.from, s.supervision.until], [33, 36]);
  assert.equal(handoverSupportActive(s), false);
  assert.equal(handoverCoversRemainingSummer(s), true);
  s.advisor.funding = 0; s.flags.fundingGap = true; s.flags.hardTA = true; s.raLost = { until: 80 };
  s.month = 33;
  const energy = s.player.stats.energy, stress = s.player.hidden.stress;
  maintainSupervision(s); maintainSupervision(s);
  assert.equal(s.player.stats.energy, energy - 4); assert.equal(s.player.hidden.stress, stress + 2);
  assert.equal(s.ta, false); assert.equal(handoverSupportActive(s), true);
  monthlyLedger(s); assert.equal(s.ledger.stipend, s.program.stipend);
  assert.equal(eligible(s, templateById.ra_lost), false);
  s.month = 34; s.leaveWeeks = 4; const rested = s.player.stats.energy;
  maintainSupervision(s); assert.equal(s.player.stats.energy, rested);
  s.month = 35; s.leaveWeeks = 0; maintainSupervision(s); assert.equal(handoverSupportActive(s), true);
  s.month = 36; maintainSupervision(s);
  assert.equal(s.supervision, null); assert.equal(handoverSupportActive(s), false); assert.equal(s.ta, true);
  assert.equal(s.supervisionHistory.at(-1).reason, 'completed');
});

test('handover is unavailable without editable work or remaining funded months', () => {
  const s = student(); activeProject(s).status = 'Submitted';
  assert.ok(choiceUnavailable(s, templateById.advisor_retires.choices.find(c => c.id === 'inherit_lab')));
  const last = student(71);
  assert.ok(choiceUnavailable(last, templateById.advisor_retires.choices.find(c => c.id === 'inherit_lab')));
  assert.equal(choiceUnavailable(last, templateById.advisor_retires.choices.find(c => c.id === 'transfer')), null);
});

test('the first payroll after a year-six handover uses ordinary funding again', () => {
  let s = choice(student(59), 'inherit_lab');
  s.advisor.funding = 55; s.flags = { labInheritor: true };
  s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass';
  s.player.stats.health = 90; s.player.stats.hope = 90;
  for (let month = 60; month <= 63; month++) {
    s.stage = 'report'; s.event = null; s.eventQueue = []; s.report = { monthsCovered: 1 };
    s = dispatch(s, { type: 'DISMISS_REPORT' });
    assert.equal(s.month, month);
    assert.equal(s.ledger.stipend, month < 63 ? s.program.stipend : Math.round(s.program.stipend * .7));
  }
  assert.equal(s.supervision, null);
});

test('trouble with the current advisor cannot poison an emeritus mentor’s letter', () => {
  const s = choice(student(), 'coadvise');
  const writer = availableWriters(s).find(w => w.advisorId === s.supervision.mentor.id);
  for (let rng = 1; rng <= 30; rng++) {
    const calm = structuredClone(s), conflict = structuredClone(s);
    calm.rng = conflict.rng = rng; calm.letterDrag = 0; conflict.letterDrag = 8;
    askLetter(calm, writer.id); askLetter(conflict, writer.id);
    assert.deepEqual(conflict.letters.asked, calm.letters.asked);
  }
});

test('old flag-only retirement is reviewed before identity or funding changes', () => {
  const s = student(); s.event = null; s.stage = 'plan'; s.flags.coadvised = true;
  const old = s.advisor.id, storage = memory(); saveRun(storage, s, emptyMeta());
  const loaded = loadSave(storage).run;
  assert.equal(loaded.advisor.id, old); assert.equal(loaded.supervision, undefined);
  assert(loaded.eventQueue.includes('advisor_retires'));
  openNext(loaded); assert.equal(loaded.event, 'advisor_retires');
  const resolved = choice(loaded, 'transfer');
  assert.notEqual(resolved.advisor.id, old); assert.equal(resolved.supervisionReview, undefined);
});

test('malformed supervision cannot reach the renderer through a portable save', () => {
  const s = choice(student(), 'coadvise'); assert.equal(validRun(s), true);
  s.supervision.mentor = null; assert.equal(validRun(s), false);
});
