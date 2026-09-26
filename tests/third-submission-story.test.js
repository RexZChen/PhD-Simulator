import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject } from '../src/engine/paper.js';
import { eligible, openNext, templateById } from '../src/engine/events.js';
import { setAppLanguage } from '../src/i18n/apply.js';

const id = 'midphd_third_submission';
function fixture() {
  let s = createRun(42);
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.event = null; s.stage = 'plan'; s.eventQueue = []; s.needsBegin = false; s.month = 8;
  s.projects = [];
  const main = createProject(s); main.status = 'Rejected';
  main.submissionHistory = [{ venueId: 'tmlrgh', outcome: 'Reject', month: 5 }];
  const side = createProject(s, { kind: 'side' }); s.activeProjectId = side.id;
  return { s, main, side };
}

test('third attempt follows the active editable manuscript, never the run-wide rejection count', () => {
  const { s, main, side } = fixture();
  assert.equal(eligible(s, templateById[id]), false);
  main.submissionHistory.push({ venueId: 'tmlrgh', outcome: 'Desk Reject', month: 7 });
  assert.equal(eligible(s, templateById[id]), false);
  s.activeProjectId = main.id;
  assert.equal(eligible(s, templateById[id]), true);
  for (const status of ['Submitted', 'Rebuttal', 'Accepted', 'Advisor Review', 'Abandoned']) {
    main.status = status; assert.equal(eligible(s, templateById[id]), false, status);
  }
  main.status = 'Drafting'; main.submissionHistory[1].outcome = 'Under review';
  assert.equal(eligible(s, templateById[id]), false);
  main.submissionHistory[1].outcome = 'Phase-One Reject';
  assert.equal(eligible(s, templateById[id]), true);
  main.submissionHistory.push({ outcome: 'Reject' });
  assert.equal(eligible(s, templateById[id]), false);
  assert.equal(side.submissionHistory.length, 0);
});

test('queued discussion is discarded when the selected manuscript no longer qualifies', () => {
  const { s } = fixture(); s.eventQueue = [id]; s.actorFor = { [id]: { type: 'labmate', id: 'stale' } };
  const rng = s.rng; openNext(s);
  assert.equal(s.event, null); assert.equal(s.stage, 'plan');
  assert.equal(s.rng, rng); assert.equal(s.actorFor[id], undefined);
});

for (const choice of ['reframe', 'reformat', 'shelve']) {
  test(`stale saved open scene ${choice} dismisses through CHOICE without costs, rewards, or paper mutation`, () => {
    const { s } = fixture(); s.event = id; s.stage = 'event'; s.eventReturn = 'plan';
    s.lastRoll = { label: 'Communication', value: 60, difficulty: 50, odds: 59, draw: 20, success: true };
    const before = structuredClone(s);
    const after = dispatch(JSON.parse(JSON.stringify(s)), { type: 'CHOICE', id: choice });
    assert.equal(after.event, null); assert.equal(after.stage, 'plan');
    assert.equal(after.lastRoll, null, 'stale dismissal must not replay an earlier dice result');
    for (const key of ['player', 'projects', 'relationship', 'counts', 'seen', 'cooldowns', 'achievements', 'rng', 'month', 'week']) {
      assert.deepEqual(after[key], before[key], key);
    }
    assert.equal(after.history.length, before.history.length + 1);
  });
}

test('valid third-attempt revision changes only the selected manuscript and has Chinese copy', () => {
  const { s, main, side } = fixture();
  main.submissionHistory.push({ venueId: 'tmlrgh', outcome: 'Reject', month: 7 });
  s.activeProjectId = main.id; main.writingQuality = 30; main.draft = 50;
  s.event = id; s.stage = 'event'; s.eventReturn = 'plan';
  const other = structuredClone(side);
  const after = dispatch(s, { type: 'CHOICE', id: 'reframe' });
  assert.equal(after.projects.find(p => p.id === main.id).writingQuality, 40);
  assert.equal(after.projects.find(p => p.id === main.id).draft, 56);
  assert.deepEqual(after.projects.find(p => p.id === side.id), other);
  setAppLanguage('zh');
  try {
    const e = templateById[id]; assert.equal(e.title, '准备第三次投稿');
    for (const c of e.choices) for (const key of ['text', 'hint', 'result']) assert.match(c[key], /\p{Script=Han}/u);
  } finally { setAppLanguage('en'); }
});

test('stale scene finishes deferred planning initialization once without spending the turn', () => {
  const { s } = fixture();
  s.event = id; s.stage = 'event'; s.eventReturn = 'plan'; s.needsBegin = true;
  s.actions = { oldAction: true }; s.typed = 5;
  const stats = structuredClone(s.player.stats), papers = structuredClone(s.projects);
  const after = dispatch(JSON.parse(JSON.stringify(s)), { type: 'CHOICE', id: 'reframe' });
  assert.equal(after.needsBegin, false); assert.equal(after.stage, 'plan'); assert.equal(after.event, null);
  assert.deepEqual(after.actions, {}); assert.equal(after.typed, 0);
  assert.equal(after.month, s.month); assert.equal(after.week, s.week);
  assert.deepEqual(after.player.stats, stats); assert.deepEqual(after.projects, papers);
  assert.throws(() => dispatch(after, { type: 'CHOICE', id: 'reframe' }), /no event/i);
});
