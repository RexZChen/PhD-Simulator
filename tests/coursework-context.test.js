import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { eligible, templateById } from '../src/engine/events.js';
import { setAppLanguage } from '../src/i18n/apply.js';

function fixture() {
  let s = createRun(42);
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.event = null; s.stage = 'plan'; s.eventQueue = []; s.needsBegin = false;
  s.milestones.prelim = null; s.milestones.prelimMonth = 20;
  return s;
}

test('prelim preparation follows the scheduled sitting, including retakes, and stops after passing', () => {
  const s = fixture();
  for (const [id, window] of [['coursework_qual_syllabus', 6], ['coursework_qual_study_group', 6], ['coursework_qual_morning', 3]]) {
    const e = templateById[id];
    s.month = 20 - window - 1; assert.equal(eligible(s, e), false, `${id}: too early`);
    s.month++; assert.equal(eligible(s, e), true, `${id}: preparation window`);
    s.month = 21; assert.equal(eligible(s, e), false, `${id}: past sitting`);
    s.milestones.prelim = 'retake'; s.milestones.prelimMonth = 28;
    assert.equal(eligible(s, e), false, `${id}: retake not yet near`);
    s.month = 28 - window; assert.equal(eligible(s, e), true, `${id}: approaching retake`);
    s.milestones.prelim = 'pass'; assert.equal(eligible(s, e), false, `${id}: already passed`);
    s.milestones.prelim = null; s.milestones.prelimMonth = 20;
  }
});

test('teaching duties require a current TA assignment and term; student coursework ends after prelim', () => {
  const s = fixture(); s.month = 1;
  for (const id of ['coursework_office_hours', 'coursework_grading_night', 'coursework_student_over_head']) {
    const e = templateById[id]; s.ta = false; assert.equal(eligible(s, e), false, id);
    s.ta = true; assert.equal(eligible(s, e), true, id);
    s.month = 9; assert.equal(eligible(s, e), false, `${id}: summer`); s.month = 1;
  }
  for (const id of ['coursework_midnight_pset', 'coursework_requirement_class']) {
    const e = templateById[id]; assert.equal(eligible(s, e), true, id);
    s.month = 9; assert.equal(eligible(s, e), false, `${id}: summer`); s.month = 1;
    s.milestones.prelim = 'pass'; assert.equal(eligible(s, e), false, `${id}: passed`); s.milestones.prelim = null;
  }
});

test('mock oral spends practice effort without sitting an exam or moving its date, in EN and ZH', () => {
  for (const lang of ['en', 'zh']) {
    setAppLanguage(lang);
    try {
      const s = fixture(); s.month = 18; s.event = 'coursework_qual_morning'; s.stage = 'event'; s.eventReturn = 'plan';
      const milestones = structuredClone(s.milestones), readiness = s.readiness, energy = s.player.stats.energy;
      const after = dispatch(s, { type: 'CHOICE', id: 'honest' });
      assert.deepEqual(after.milestones, milestones);
      assert.equal(after.readiness, readiness + 4); assert.equal(after.player.stats.energy, energy - 8);
      assert.equal(after.stage, 'plan'); assert.equal(after.month, 18);
      const e = templateById.coursework_qual_morning;
      assert.match(e.title, lang === 'zh' ? /模拟/ : /mock/i);
      for (const c of e.choices) assert.match(c.result, lang === 'zh' ? /练习|模拟/ : /practice|mock/i);
    } finally { setAppLanguage('en'); }
  }
});
