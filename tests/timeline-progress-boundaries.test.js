import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatch } from '../src/engine/game.js';
import { canAskTimeline } from '../src/engine/timeline.js';
import { candidate } from './timeline-fixtures.js';

function agreement(s, condition) {
  s.grad = {
    asked: true, askedMonth: 38, rounds: 1, stance: 'conditional', condition,
    settled: false, used: [], acceptedAt: s.counts.accepted,
    conditionBaseline: { accepted: s.counts.accepted, submitted: 1 },
  };
  return s;
}

test('a decision arriving after report dismissal fulfills the acceptance condition before it can be renegotiated', () => {
  let s = agreement(candidate(1), 'onepaper');
  s.advisor.caring = 35;
  const paper = s.projects.at(-1);
  Object.assign(paper, {
    progress: 100, draft: 100, status: 'Submitted', venueId: 'tmlrgh',
    reviewers: [{ score: 10 }], pendingBonus: 1,
    submissionHistory: [{ venueId: 'tmlrgh', venue: 'TMLRgh', month: 38, outcome: 'Under review', reviewers: [] }],
    timeline: { submitted: 38, decision: 42, rebuttal: null, phaseOne: null, conference: null },
  });
  s.month = 41; s.week = 4; s.stage = 'report'; s.report = { monthsCovered: 1 };
  s = dispatch(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.month, 42);
  assert.equal(s.counts.accepted, 3, 'a real review decision accepted the pending paper');
  assert.equal(s.grad.settled, true, 'the earned condition settles in the same action as the decision');
  assert.ok(s.achievements.includes('metthebar'));
  assert.equal(canAskTimeline(s), false, 'a redundant conversation cannot reset the earned condition');
  const before = structuredClone(s);
  assert.throws(() => dispatch(s, { type: 'ASK_TIMELINE' }), /already settled/);
  assert.deepEqual(s, before);
});

function draftCandidate() {
  const s = agreement(candidate(1), 'draft');
  s.month = 49;
  Object.assign(s.projects.at(-1), { kind: 'thesis', status: 'Drafting', draft: 88, progress: 100 });
  return s;
}

test('a writing turn fulfills the draft condition before another planning action is needed', () => {
  let s = draftCandidate();
  s.tempo = 'week'; s.week = 0; s.flags.zoomMonth = s.month;
  s.crunch = { type: 'zoom' }; s.focus = 'write';
  s = dispatch(s, { type: 'CONTINUE' });
  assert.ok(s.projects.at(-1).draft >= 90, 'the selected writing plan completes enough draft work');
  assert.equal(s.grad.settled, true);
  assert.ok(s.achievements.includes('metthebar'));
  assert.equal(s.milestones.defenseMonth, null, 'a completed condition still does not book the defense');
});

test('draft work completed during a lecture fulfills the condition on leaving the activity', () => {
  let s = draftCandidate();
  s.stage = 'minigame'; s.minigame = 'lecture'; s.eventReturn = 'plan'; s.needsBegin = false;
  s = dispatch(s, { type: 'LECTURE', worked: 4, caught: 0, attention: 0 });
  assert.ok(s.projects.at(-1).draft >= 90, 'the lecture activity contributes real draft progress');
  assert.equal(s.grad.settled, true);
  assert.ok(s.achievements.includes('metthebar'));
});
