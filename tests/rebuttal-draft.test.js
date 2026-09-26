import test from 'node:test';
import assert from 'node:assert/strict';
import { responseDraft, reviewView, processPapers, createProject } from '../src/engine/paper.js';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { rebuttals } from '../src/data/catalog.js';
import { browserApp, rebuttalComposeContext, rebuttalComposeMatches } from '../src/ui/apps/browser.js';
import { setAppLanguage } from '../src/i18n/apply.js';

function manuscript() {
  return { id: 'one', title: 'A specific manuscript', status: 'Rebuttal', venueId: 'neuripsy',
    timeline: { submitted: 6, rebuttal: 8, decision: 10 }, submissionHistory: [{}], reviewers: [
      { score: 6, confidence: 4, text: 'The empirical results are interesting; the baselines need work.' },
      { score: 5, confidence: 4, text: 'The theoretical novelty is not yet clear.' },
      { score: 3, confidence: 4, text: 'The code link is a 404, which is itself a result.' },
      { score: 6, confidence: 4, text: 'A promising contribution, with room for clearer framing.' },
    ] };
}

test('all response strategies use actual comments and do not fabricate completed experiments', () => {
  const p = manuscript(); const before = structuredClone(p);
  for (const r of rebuttals) {
    const text = responseDraft(p, r.id);
    for (const [index, reviewer] of p.reviewers.entries()) {
      if (r.id === 'weakest' && index !== 2) continue;
      assert.ok(text.includes(`Reviewer ${index + 1}`)); assert.ok(!text.includes(reviewer.text), 'do not repeat the visible review');
    }
    assert.doesNotMatch(text, /we have rerun|we ran it|added the missing baseline|Table 6|five runs|Section 3 now/i);
  }
  const careful = responseDraft(p, 'careful');
  assert.match(careful, /assumptions and scope/); assert.match(careful, /code, configuration/);
  const weakest = responseDraft(p, 'weakest');
  assert.match(weakest, /Reviewer 3/); assert.doesNotMatch(weakest, /Reviewer [124]/);
  assert.deepEqual(p, before);
});

test('Chinese drafts and stored reviews follow language changes without changing manuscript or RNG', () => {
  const p = manuscript(), before = structuredClone(p);
  setAppLanguage('zh'); const misses = new Set(); globalThis.__I18N_MISS = misses;
  try {
    for (const r of rebuttals) {
      const text = responseDraft(p, r.id);
      assert.match(text, /回复/); assert.doesNotMatch(text, /Reviewer|Response:|We will/);
      if (r.id !== 'weakest') assert.match(text, /评审.*4|审稿.*4/);
    }
    assert.deepEqual([...misses], []);
  } finally { delete globalThis.__I18N_MISS; setAppLanguage('en'); }
  assert.deepEqual(p, before);
});

test('unknown legacy comments get a neutral response; missing comments do not invent reviewers', () => {
  const p = manuscript(); p.reviewers = [{ score: 5, text: 'A custom archived concern.' }];
  assert.match(responseDraft(p, 'careful'), /Reviewer 1/);
  assert.match(responseDraft(p, 'careful'), /Thank you for raising this point/);
  p.reviewers = []; assert.match(responseDraft(p, 'careful'), /No individual reviews are recorded/);
  assert.doesNotMatch(responseDraft(p, 'careful'), /Reviewer 1/);
});

test('warm reviews get an acknowledgment, not an invented defect or internal drafting instructions', () => {
  const p = manuscript(); p.reviewers = [{ score: 8, text: 'The code runs. I ran it. This should not be remarkable and it is.' }];
  const text = responseDraft(p, 'advisor');
  assert.match(text, /encouraging assessment/);
  assert.doesNotMatch(text, /reproducibility issue|availability|draft does not claim|unverified|reported.*issue/i);
});

test('generated reviews persist stable source metadata without consuming randomness during presentation', () => {
  let s = createRun(731, { background: 'masters', topic: 'ml', international: false });
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id }); const p = createProject(s);
  Object.assign(p, { status: 'Submitted', venueId: 'neuripsy', timeline: { submitted: 6, phaseOne: null, rebuttal: 8, decision: 10 }, submissionHistory: [{}] });
  s.month = 8; s.week = 0; processPapers(s);
  assert.ok(p.reviewers.length >= 3); assert.ok(p.reviewers.every(r => r.concern && r.textSource));
  const before = structuredClone(s);
  p.reviewers.forEach((r, i) => reviewView(r, i)); responseDraft(p, 'careful');
  assert.deepEqual(s, before);
  assert.ok(s.inbox.some(m => JSON.stringify(m).includes(`${p.reviewers.length} reviewers`)));
});

test('composer requires the same project and submission attempt, including rendered send guard', () => {
  const p = manuscript(), other = { ...structuredClone(p), id: 'two', title: 'Other paper' };
  const s = { projects: [p, other], activeProjectId: p.id, stage: 'plan', phase: 'playing', month: 8 };
  const compose = { kind: 'rebuttal', optionId: 'careful', done: true, ...rebuttalComposeContext(p) };
  assert.equal(rebuttalComposeMatches(s, compose), true);
  s.activeProjectId = other.id;
  assert.equal(rebuttalComposeMatches(s, compose), false);
  const html = browserApp(s, { browserTab: 'openregret', compose });
  assert.match(html, /data-action="rebut-send"[^>]*disabled|disabled[^>]*data-action="rebut-send"/);
  assert.doesNotMatch(html, /data-compose-text/);
  s.activeProjectId = p.id; p.submissionHistory.push({});
  assert.equal(rebuttalComposeMatches(s, compose), false);
});
