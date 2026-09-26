import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, effects } from '../src/engine/state.js';
import { createProject } from '../src/engine/paper.js';
import { dispatch } from '../src/engine/game.js';
import { resolveChoice, templateById } from '../src/engine/events.js';
import { sceneEffectPills, scenePaperEffectNote } from '../src/ui/helpers.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { sceneEffectsZh } from '../src/i18n/zh/scene-effects.js';

function fixture() {
  let s = createRun(42);
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.stage = 'plan'; s.event = null; s.projects = [];
  const p = createProject(s); s.activeProjectId = p.id;
  s.player.stats.energy = 50; s.player.hidden.stress = 20;
  return { s, p };
}
const pills = html => [...html.matchAll(/<span class="pill [^"]+">([^<]+)<\/span>/g)].map(m => m[1]).join(' ');

test('locked manuscript previews match discarded gains and costs without retargeting another paper', () => {
  for (const status of ['Submitted', 'Rebuttal', 'Accepted', 'Abandoned', 'Advisor Review']) {
    const { s, p } = fixture(); p.status = status;
    createProject(s, { kind: 'side' }); s.activeProjectId = p.id;
    const choice = { effects: { progress: 6, draft: -3, hype: 2, evidence: -4, energy: -4, stress: 3 }, target: 'top' };
    const before = structuredClone(s.projects), rng = s.rng;
    const html = sceneEffectPills(s, choice);
    assert.match(pills(html), /Energy/); assert.match(pills(html), /Stress/);
    assert.doesNotMatch(pills(html), /Progress|Draft|Hype|Evidence/);
    assert.match(html, /Paper unchanged/); assert.ok(scenePaperEffectNote(s, [choice]).includes(status));
    assert.ok(!html.includes(p.title));
    assert.equal(s.rng, rng); assert.deepEqual(s.projects, before);
    effects(s, choice.effects);
    assert.deepEqual(s.projects, before);
    assert.equal(s.player.stats.energy, 46); assert.equal(s.player.hidden.stress, 23);
  }
});

test('winter work visibly retains its real costs while submitted draft remains unchanged', () => {
  const { s, p } = fixture(); p.status = 'Submitted';
  const c = templateById.winter_break.choices.find(c => c.id === 'stay_work');
  const html = sceneEffectPills(s, c), before = structuredClone(p);
  assert.doesNotMatch(pills(html), /Draft|Writing/);
  assert.match(pills(html), /Energy/); assert.match(pills(html), /Advisor/);
  s.event = 'winter_break'; s.stage = 'event'; s.eventReturn = 'plan';
  resolveChoice(s, c.id);
  assert.deepEqual(p, before); assert.equal(s.player.stats.energy, 42);
});

test('editable work keeps paper previews; no paper suppresses them but keeps checks and ending warnings', () => {
  const { s, p } = fixture();
  const c = { effects: { progress: 6, draft: -3, money: -20 }, check: { skill: 'research', difficulty: 50 }, ending: 'quit' };
  assert.match(pills(sceneEffectPills(s, c)), /Progress/);
  assert.doesNotMatch(sceneEffectPills(s, c), /paper-effect-note/);
  s.activeProjectId = null;
  const html = sceneEffectPills(s, c);
  assert.doesNotMatch(pills(html), /Progress|Draft/);
  assert.match(scenePaperEffectNote(s, [c]), /No active paper/); assert.match(html, /Money/);
  assert.match(html, /🎲/); assert.match(html, /Ends the run/);
  assert.ok(s.projects.includes(p));
});

test('conditional outcomes are not previewed as guaranteed or disclosed by locked-paper notes', () => {
  const { s, p } = fixture(); p.status = 'Submitted';
  const html = sceneEffectPills(s, { effects: { energy: -2 }, check: { stat: 'confidence' }, successEffects: { progress: 12 }, failureEffects: { draft: -8 } });
  assert.doesNotMatch(html, /Progress|Draft|paper-effect-note/);
  assert.match(html, /Energy/); assert.match(html, /🎲/);
});

test('locked-paper explanation escapes titles and has a complete Chinese translation', () => {
  const { s, p } = fixture(); p.status = 'Submitted'; p.title = '<img src=x>';
  assert.doesNotMatch(scenePaperEffectNote(s, [{ effects: { progress: 2 } }]), /<img/);
  assert.match(sceneEffectsZh['“{title}” is {status}. Choices below cannot change this paper.'], /\p{Script=Han}/u);
  setAppLanguage('zh');
  try {
    const choice = { effects: { progress: 2, energy: -2 } };
    const html = scenePaperEffectNote(s, [choice, choice]);
    assert.match(sceneEffectPills(s, choice), /论文不变/);
    assert.equal((html.match(/scene-paper-note/g) || []).length, 1);
    assert.match(html, /下方选项不会改变这篇论文/);
    assert.doesNotMatch(html, /Choices below cannot change/);
  } finally { setAppLanguage('en'); }
});
