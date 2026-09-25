import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch, focusOptions } from '../src/engine/game.js';
import { createProject, createThesis, setTarget } from '../src/engine/paper.js';
import { milestoneOf, crunchOf } from '../src/engine/time.js';
import { turnChoices, suggestedTurn } from '../src/engine/play.js';
import { applicationSlate } from '../src/engine/apply.js';
import { schools } from '../src/data/catalog.js';
import { deskApp } from '../src/ui/apps/desk.js';

function student() {
  let s = createRun(8128, { background: 'masters', topic: 'ml', international: false });
  const advisor = s.advisors.find(a => a.schoolId === schools[0].id);
  s.phase = 'admissions'; s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  s.stage = 'plan'; s.event = null; s.eventQueue = []; s.requests = [];
  s.player.stats.energy = 80;
  s.advisorMode = { id: 'checkedOut' };
  return s;
}

test('one research click does work without selecting a plan or pressing Continue', () => {
  const s = student(); createProject(s);
  const before = structuredClone(s);
  const after = dispatch(s, { type: 'PLAY_TURN', id: 'work' });
  assert.ok(after.projects[0].progress > s.projects[0].progress || after.stage === 'summons');
  assert.notEqual(after.stage, 'plan');
  assert.deepEqual(s, before, 'dispatch is still immutable');
});

test('a writing turn includes the available writing session once', () => {
  let s = student(); const p = createProject(s);
  Object.assign(p, { status: 'Drafting', progress: 60, draft: 5 });
  s = dispatch(s, { type: 'PLAY_TURN', id: 'work' });
  assert.equal(s.focus, 'write');
  assert.ok(s.projects[0].draft >= 55, 'ordinary writing no longer requires repeated +5 clicks');
  assert.ok(s.projects[0].draft <= 100);
  assert.throws(() => dispatch(s, { type: 'PLAY_TURN', id: 'work' }), /screen|first/);
});

test('a locked manuscript never offers a wasted research or writing turn', () => {
  for (const status of ['Advisor Review', 'Submitted', 'Rebuttal', 'Rejected', 'Accepted']) {
    const s = student(); const p = createProject(s); p.status = status;
    const before = structuredClone(s);
    assert.ok(!turnChoices(s).some(c => ['research', 'write'].includes(c.focus)), status);
    assert.ok(focusOptions(s).filter(f => ['research', 'write'].includes(f.id)).every(f => f.disabled), status);
    assert.deepEqual(s, before);
  }
});

test('work switches to an editable project when the active paper is waiting', () => {
  const s = student(); const first = createProject(s); first.status = 'Submitted';
  const next = createProject(s); s.activeProjectId = first.id;
  const after = dispatch(s, { type: 'PLAY_TURN', id: 'work' });
  assert.equal(after.activeProjectId, next.id);
  assert.equal(after.projects[0].progress, first.progress);
});

test('recovery stays available at zero energy; recommendations respect every pace', () => {
  for (const tempo of ['month', 'season', 'week', 'day']) {
    const s = student(); createProject(s); s.tempo = tempo;
    if (['week', 'day'].includes(tempo)) s.crunch = { type: 'deadline' };
    s.player.stats.energy = 0;
    const choice = suggestedTurn(s);
    assert.equal(choice.id, 'recover');
    assert.ok(focusOptions(s).some(f => f.id === choice.focus && !f.disabled));
  }
});

test('a publication click preserves approval and venue gates and starts the real review process', () => {
  let s = student(); const p = createProject(s);
  assert.throws(() => dispatch(s, { type: 'SUBMIT_PAPER', id: 'workshop' }), /approved/);
  p.status = 'Ready'; p.progress = 70; p.draft = 80;
  // TMLR is a rolling venue, so this checks the workflow independently of the seed's month.
  const html = deskApp(s, {});
  const match = html.match(/data-id="([^"]+)"[^>]*data-type="SUBMIT_PAPER"/);
  assert.ok(match, 'an approved paper has an actual submit action on the desk');
  s = dispatch(s, { type: 'SUBMIT_PAPER', id: match[1] });
  assert.equal(s.projects[0].status, 'Submitted');
  assert.equal(s.projects[0].submissionHistory.length, 1);
  assert.ok(s.projects[0].timeline);
  assert.throws(() => dispatch(s, { type: 'SUBMIT_PAPER', id: match[1] }), /approved/);
});

test('statement bundles keep the old effort costs and do not overspend', () => {
  const s = createRun(51, { background: 'masters', topic: 'ml' });
  const before = s.player.stats.energy;
  const after = dispatch(s, { type: 'PREP_STATEMENT', id: 'thorough' });
  assert.equal(after.player.stats.energy, before - 18);
  assert.deepEqual(after.prep.sopSteps, ['draft', 'mentor', 'specific', 'cut']);
  s.player.stats.energy = 5;
  assert.throws(() => dispatch(s, { type: 'PREP_STATEMENT', id: 'thorough' }), /Energy/);
  assert.equal(s.player.stats.energy, 5);
});

test('the previewed shortlist is exactly the batch applied to; fee and letter scenes both survive', () => {
  let s = createRun(72, { background: 'masters', topic: 'ml' });
  s = dispatch(s, { type: 'PREP_STATEMENT', id: 'basic' });
  s = dispatch(s, { type: 'PREP', id: 'letter_ask', target: 'rec-0' });
  s = dispatch(s, { type: 'PREP', id: 'proceed' });
  s.player.stats.money = 2000; s.player.stats.energy = 80;
  const slate = applicationSlate(s, 'balanced');
  const after = dispatch(s, { type: 'APPLY_SLATE', id: 'balanced' });
  assert.deepEqual(after.applications.map(a => a.schoolId), slate.selected.map(r => r.school.id));
  assert.equal(after.player.stats.money, 2000 - slate.money);
  assert.equal(after.player.stats.energy, 80 - slate.energy);
  assert.equal(after.event, 'fee');
  assert.ok(after.eventQueue.includes('letter'));
  assert.throws(() => dispatch({ ...s, player: { ...s.player, stats: { ...s.player.stats, money: 0 } } }, { type: 'APPLY_SLATE', id: 'balanced' }), /Money/);
});

test('a late-year paper can still target a future conference deadline', () => {
  const s = student(); s.month = 42;
  const p = createProject(s);
  setTarget(s, p, true);
  assert.ok(p.targetVenueId);
  assert.ok(p.targetMonth >= s.month);
});

test('major defense revisions lead to the promised second defense, not a dead calendar', () => {
  let s = student(); s.month = 57;
  Object.assign(s.milestones, { prelim: 'pass', proposal: 'pass', thesisStarted: true,
    defense: 'revisions', defenseMonth: 57, defenseAttempts: 1 });
  const thesis = createThesis(s); thesis.status = 'Ready'; thesis.draft = 95;
  assert.deepEqual(milestoneOf(s), { kind: 'defense', month: 57 });
  assert.equal(crunchOf(s).kind, 'defense');
  s.stage = 'report'; s.report = { monthsCovered: 1 };
  s = dispatch(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.stage, 'milestone');
  s = dispatch(s, { type: 'MILESTONE', id: 'balanced' });
  s = dispatch(s, { type: 'VIVA', tally: { land: 3, concede: 3, composure: 80 } });
  assert.equal(s.milestones.defenseAttempts, 2);
  assert.equal(s.milestones.defense, 'pass');
  assert.ok(s.thesis.items.length, 'the post-defense revision and deposit process is reachable');
});
