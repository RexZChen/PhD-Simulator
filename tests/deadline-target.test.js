import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject, setTarget } from '../src/engine/paper.js';
import { crunchOf, seasonEligible } from '../src/engine/time.js';

function researcher(month, topic = 'ml') {
  let s = createRun(4242, { background: 'masters', topic, international: false });
  const advisor = s.advisors[0];
  s.phase = 'admissions';
  s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  s.month = month;
  s.week = 0;
  s.stage = 'plan';
  s.event = null;
  createProject(s);
  return s;
}

test('a third-year paper can target a conference and enter deadline pacing', () => {
  let s = researcher(31); // April 2031, one month before NeurIPSy.
  s.milestones.prelim = 'pass';
  s.pace = 'auto';
  assert.equal(seasonEligible(s), true, 'the research period can otherwise advance a season');
  s = dispatch(s, { type: 'SET_TARGET', id: 'neuripsy' });
  const p = s.projects.at(-1);
  assert.equal(p.targetVenueId, 'neuripsy');
  assert.equal(p.targetMonth, 32);
  assert.equal(seasonEligible(s), false, 'a targeted deadline prevents skipping the work period');
  s.month = 32;
  assert.equal(crunchOf(s)?.project.id, p.id, 'the target still triggers deadline pacing after year two');
});

test('automatic advisor deadline choices remain available in every research year', () => {
  for (const month of [24, 36, 48, 60]) {
    for (const mode of [true, 'top', 'soon']) {
      const s = researcher(month, 'systems');
      const p = s.projects.at(-1);
      assert.ok(setTarget(s, p, mode), `month ${month}, mode ${mode}`);
      assert.ok(p.targetMonth >= month && p.targetMonth < 72);
    }
  }
});

test('late-month target selection rolls forward without exceeding the six-year run', () => {
  const s = researcher(32); // May 2031.
  s.week = 2;
  const p = s.projects.at(-1);
  assert.ok(setTarget(s, p, 'neuripsy'));
  assert.equal(p.targetMonth, 44, 'a deadline already too close moves to the next annual cycle');

  const last = researcher(71); // August 2034, the last playable month.
  const finalPaper = last.projects.at(-1);
  assert.ok(setTarget(last, finalPaper, 'tmlrgh'));
  assert.equal(finalPaper.targetMonth, 71, 'a deadline in the final month is still usable');
  assert.equal(setTarget(last, finalPaper, 'kddish'), null, 'July has passed and the next February is outside the run');
  assert.equal(setTarget(last, finalPaper, 'iclearn'), null, 'September would be outside the run');
  assert.equal(finalPaper.targetVenueId, 'tmlrgh', 'an unavailable choice preserves the existing target');
});

test('a pending advisor review can retarget without losing its review or draft', () => {
  let s = researcher(32);
  const p = s.projects.at(-1);
  Object.assign(p, { status: 'Advisor Review', draft: 87, reviewDueWeek: 133 });
  s = dispatch(s, { type: 'SET_TARGET', id: 'neuripsy' });
  s = dispatch(s, { type: 'SET_TARGET', id: 'aaaight' });
  const revised = s.projects.at(-1);
  assert.ok(revised.targetMonth > 32);
  assert.equal(revised.reviewDueWeek, 133);
  assert.equal(revised.status, 'Advisor Review');
  assert.equal(revised.draft, 87);
});
