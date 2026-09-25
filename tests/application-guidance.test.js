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

test('preparation guidance links to the named section instead of describing its position', () => {
  const s = run();
  s.prep.sopSteps.push('draft');
  for (const target of ['letters', 'programs-research', 'gre']) {
    if (target === 'programs-research') s.prep.letters[0].asked = true;
    if (target === 'gre') {
      s.prep.researched = Object.fromEntries(schools.slice(0, 3).map(sc => [sc.id, { notes: [] }]));
      s.prep.sopSteps.push('specific');
      s.prep.letters.slice(0, 3).forEach(letter => { letter.asked = true; });
    }
    const g = nextStep(s);
    assert.equal(g.action, 'application-jump');
    assert.equal(g.id, target);
    assert.doesNotMatch(g.label, /right|left|column|below/i);
    const html = gradApply(s, {});
    assert.match(guide(html), new RegExp(`data-action="application-jump" data-id="${target}"`));
    assert.match(html, new RegExp(`data-application-section="${target}"`));
  }
});

test('reviewing an earlier application tab gives a route back to the current task', () => {
  const s = run();
  s.phase = 'application';
  const html = gradApply(s, { gaTab: 'prep' });
  assert.match(html, /GradApply — Preparation/);
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
    assert.match(html, /GradApply — Preparation/);
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

test('optional preparation is collapsed while draft and letter choices remain visible', () => {
  const html = gradApply(run(), {});
  const optional = html.match(/<details\b[^>]*data-application-section="gre"[^>]*>[\s\S]*?<\/details>/)?.[0];
  assert.ok(optional, 'GRE and fee controls have a disclosure');
  assert.doesNotMatch(optional.split('>')[0], /\bopen\b/);
  assert.match(optional, /data-id="gre"/);
  assert.match(optional, /data-id="waiver"/);
  const visible = html.replace(/<details\b[\s\S]*?<\/details>/g, '');
  assert.match(visible, /data-id="sop_draft"/);
  assert.match(visible, /data-id="letter_ask"/);
  const research = html.match(/<details\b[^>]*data-application-section="programs-research"[^>]*>/)?.[0];
  assert.ok(research, 'the full program directory has a labeled disclosure');
  assert.doesNotMatch(research, /\bopen\b/);
  assert.doesNotMatch(visible, /data-action="ga-school"/);
});
