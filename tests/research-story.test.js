import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { ask, canDiscussRejection } from '../src/engine/advisor.js';
import { createProject, submit, processPapers } from '../src/engine/paper.js';
import { askById } from '../src/data/asks.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { t } from '../src/i18n/index.js';

function researcher() {
  let s = createRun(42, { background: 'masters', topic: 'ml', international: false });
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.event = null; s.stage = 'plan'; s.month = 30;
  s.advisorMode = { id: 'normal' }; s.relationship.trust = 100;
  const p = createProject(s); p.status = 'Rejected';
  p.submissionHistory = [{ venueId: 'tmlrgh', outcome: 'Reject' }];
  s.activeProjectId = p.id;
  s.flags.recentReject = true;
  return { s, p };
}

test('rejection advice requires the actual rejected paper and helps its current decision once', () => {
  const { s, p } = researcher();
  const other = createProject(s, { kind: 'side' });
  s.activeProjectId = other.id;
  assert.equal(canDiscussRejection(s), false);
  const before = structuredClone(s);
  assert.throws(() => ask(s, 'after_reject'), /Open a rejected paper/);
  assert.deepEqual(s, before);
  s.activeProjectId = p.id;
  s.rng = 10000;
  assert.equal(canDiscussRejection(s), true);
  const evidence = p.evidence, otherEvidence = other.evidence;
  assert.equal(ask(s, 'after_reject').success, true);
  assert.equal(p.evidence, evidence + 4);
  assert.equal(other.evidence, otherEvidence);
  assert.equal(p.submissionHistory[0].rejectionDiscussed, true);
  s.month += 3;
  assert.equal(canDiscussRejection(JSON.parse(JSON.stringify(s))), false);
  assert.throws(() => ask(s, 'after_reject'), /Open a rejected paper/);
  p.submissionHistory.push({ venueId: 'tmlrgh', outcome: 'Reject' });
  assert.equal(canDiscussRejection(s), true, 'a later rejection permits a new conversation');
});

test('an unhelpful rejection discussion can be retried after its cooldown', () => {
  const { s, p } = researcher();
  s.relationship.trust = 0; s.rng = 30000;
  assert.equal(ask(s, 'after_reject').success, false);
  assert.equal(canDiscussRejection(s), true);
  assert.equal(p.submissionHistory[0].rejectionDiscussed, undefined);
  assert.throws(() => ask(s, 'after_reject'), /recently/);
  s.month += 2; s.relationship.trust = 100; s.rng = 10000;
  assert.equal(ask(s, 'after_reject').success, true);
});

test('a desk rejection does not invent reviewer reports to discuss', () => {
  const { s, p } = researcher();
  for (const outcome of ['Desk Reject', 'Phase-One Reject']) {
    p.submissionHistory.at(-1).outcome = outcome;
    assert.equal(canDiscussRejection(s), false);
    assert.throws(() => ask(s, 'after_reject'), /Open a rejected paper/);
  }
});

test('initial reviews do not claim to have read an unwritten rebuttal', () => {
  const { s, p } = researcher();
  s.month = 0;
  Object.assign(p, { status: 'Ready', draft: 100, progress: 100, venueId: 'tmlrgh', wizardStep: 4, novelty: 15, technicalDepth: 15, evidence: 15, writingQuality: 15, reproducibility: 15 });
  submit(s);
  s.month = p.timeline.rebuttal; s.week = 0; s.rng = 5;
  processPapers(s);
  assert.equal(p.status, 'Rebuttal');
  assert.equal(p.rebuttalDone, false);
  assert.ok(p.reviewers.some(r => r.text.includes('direct comparison')));
  assert.ok(p.reviewers.every(r => !r.text.includes('I have read the rebuttal')));
});

test('research advisor labels, drafts and outcomes are available in Simplified Chinese', () => {
  try {
    setAppLanguage('zh');
    for (const id of ['after_reject', 'authorship', 'cut_scope']) {
      const spec = askById[id];
      for (const text of [spec.name, spec.desc, t(spec.draft), ...spec.success.text, ...spec.failure.text]) assert.match(text, /[\u3400-\u9fff]/u, `${id}: ${text}`);
    }
  } finally { setAppLanguage('en'); }
});
