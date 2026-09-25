import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { initPrep, nextStep } from '../src/engine/apply.js';
import { gradApply } from '../src/ui/apps/gradapply.js';
import { schools } from '../src/data/catalog.js';

const run = () => {
  const s = createRun(23, { background: 'masters', topic: 'systems', international: false });
  initPrep(s);
  return s;
};
const guide = html => html.match(/<div class="guide">[\s\S]*?<\/div>\s*<\/div>/)?.[0] || '';

test('preparation shows the current decision and advances through statement, letters, and filing', () => {
  const s = run();
  let html = gradApply(s, {});
  assert.match(html, /data-action="prep-statement"/);
  assert.doesNotMatch(html, /data-id="letter_ask"|<details/);
  s.prep.sopSteps.push('draft');
  html = gradApply(s, {});
  assert.match(html, /data-id="letter_ask"/);
  assert.doesNotMatch(html, /data-action="prep-statement"/);
  s.prep.letters.slice(0, 3).forEach(l => { l.asked = true; });
  html = gradApply(s, {});
  assert.match(html, /data-id="proceed"/);
  assert.match(html, /data-id="waiver"/);
  assert.doesNotMatch(html, /data-id="letter_ask"/);
});

test('reviewing an earlier application tab gives a route back to the current task', () => {
  const s = run();
  s.phase = 'application';
  const html = gradApply(s, { gaTab: 'prep' });
  assert.match(html, /Before anybody calls you a student/);
  assert.match(guide(html), /data-action="ga-tab" data-id="application"/);
  assert.match(guide(html), /Return to Programs/);
  assert.doesNotMatch(guide(html), /Apply to your first program/);
});

test('guidance offers progress when there is no budget left for optional preparation or more applications', () => {
  const s = run();
  s.prep.letters[0].asked = true;
  s.player.stats.energy = 0;
  assert.equal(nextStep(s).id, 'proceed');
  s.phase = 'application';
  s.applications.push({ schoolId: schools[0].id });
  assert.equal(nextStep(s).action, 'admissions');
  s.player.stats.energy = 50;
  s.player.stats.money = 0;
  assert.equal(nextStep(s).action, 'admissions');
});

test('unavailable or unknown tab selection resolves both the content and active tab together', () => {
  const s = run();
  for (const gaTab of ['admissions', 'missing']) {
    const html = gradApply(s, { gaTab });
    assert.match(html, /Before anybody calls you a student/);
    assert.match(html, /class="btn active" data-action="ga-tab" data-id="prep"/);
    assert.doesNotMatch(html, /class="btn active" data-action="ga-tab" data-id="admissions"/);
    assert.doesNotMatch(html, /<\/button>,<button[^>]*data-action="ga-tab"/, 'tab markup must not render array separators');
  }
});

test('sealed updates keep Offers disabled and give a direct route to the updates', () => {
  const s = run();
  const school = schools[0];
  s.phase = 'admissions';
  s.applications = [{ schoolId: school.id, poiId: s.advisors.find(a => a.schoolId === school.id).id, status: 'admitted', opened: false }];
  s.offers = [school.id];
  const html = gradApply(s, { gaTab: 'admissions' });
  assert.match(html, /data-action="ga-tab" data-id="admissions" disabled/);
  assert.match(guide(html), /data-action="application-jump" data-id="updates"/);
  assert.match(html, /data-application-section="updates"/);
  assert.doesNotMatch(html, /data-action="decisions"/);
});

test('a legacy preparation save can proceed when it has letters but no energy', () => {
  const s = run();
  s.prep.sopSteps.push('draft'); s.prep.letters[0].asked = true;
  s.player.stats.energy = 0;
  const html = gradApply(s, {});
  assert.match(html, /Continue with the letters you have/);
  assert.match(html, /data-id="proceed"/);
});
