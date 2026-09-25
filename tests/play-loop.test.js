import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, say } from '../src/engine/state.js';
import { dispatch, focusOptions } from '../src/engine/game.js';
import { createProject, createThesis, setTarget } from '../src/engine/paper.js';
import { milestoneOf, crunchOf } from '../src/engine/time.js';
import { turnChoices, suggestedTurn } from '../src/engine/play.js';
import { applicationSlate } from '../src/engine/apply.js';
import { schools } from '../src/data/catalog.js';
import { deskApp } from '../src/ui/apps/desk.js';
import { templateById } from '../src/engine/events.js';
import { pushbacks } from '../src/data/minigames.js';
import { projectTitle } from '../src/engine/paper.js';
import { random } from '../src/engine/probability.js';
import { loadSave, saveRun, emptyMeta } from '../src/engine/save.js';
import { setAppLanguage } from '../src/i18n/apply.js';

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

function finishScenes(s) {
  for (let i = 0; i < 30 && !['plan', 'report'].includes(s.stage); i++) {
    if (s.stage === 'summons') s = dispatch(s, { type: 'SUMMONS', id: 'go' });
    else if (s.stage === 'pushback') s = dispatch(s, { type: 'PUSHBACK', id: pushbacks.find(p => p.id === s.pushback.id).options[0].id });
    else if (s.minigame === 'lecture') s = dispatch(s, { type: 'LECTURE', worked: 9, attention: 5, caught: 1 });
    else s = dispatch(s, { type: 'CHOICE', id: templateById[s.event].choices.find(c => !c.ending).id });
  }
  assert.ok(['plan', 'report'].includes(s.stage));
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

test('locked papers cannot consume a manual work day or deadline week', () => {
  for (const tempo of ['week', 'day']) for (const status of ['Advisor Review', 'Submitted', 'Rejected', 'Accepted']) {
    const s = student(); createProject(s).status = status;
    s.tempo = tempo; s.crunch = { type: 'deadline' };
    const work = focusOptions(s).filter(f => ['deep', 'writing', 'debug', 'figures', 'experiments', 'polish', 'coordinate'].includes(f.id));
    assert.ok(work.length && work.every(f => f.disabled), `${tempo}: ${status}`);
    assert.throws(() => dispatch(s, { type: 'PLAN', id: work[0].id }), /No project/);
    assert.ok(turnChoices(s).some(c => c.id === 'recover'));
  }
});

test('every pace gets one accurate receipt and opening other apps cannot change it', () => {
  for (const tempo of ['day', 'week', 'month', 'season']) {
    let s = student(); createProject(s);
    if (tempo === 'season') {
      s.month = 30; s.milestones.prelim = 'pass'; s.milestones.proposalMonth = 44;
    } else if (tempo === 'week' || tempo === 'day') {
      s = dispatch(s, { type: 'SET_PACE', id: 'week' });
      if (tempo === 'day') s = dispatch(s, { type: 'SET_PACE', id: 'day' });
    }
    s.tempo = tempo;
    const before = structuredClone(s);
    s = finishScenes(dispatch(s, { type: 'PLAY_TURN', id: 'work' }));
    const r = s.turnReceipt;
    assert.equal(r.tempo, tempo);
    assert.equal(r.month, before.month);
    assert.equal(r.energy, Math.round(s.player.stats.energy - before.player.stats.energy));
    assert.equal(r.projects[0].progress, Math.round(s.projects[0].progress - before.projects[0].progress));
    assert.equal(r.sequence, 1);
    assert.equal(s.pendingReceipt, undefined);
    assert.deepEqual(dispatch(s, { type: 'READ_MAIL_ALL' }).turnReceipt, r);
    if (s.stage === 'report') assert.deepEqual(dispatch(s, { type: 'DISMISS_REPORT' }).turnReceipt, r);
  }
});

test('a receipt survives saving mid-scene and includes the writing session and the choice', () => {
  let s = student(); Object.assign(createProject(s), { progress: 60, draft: 5, status: 'Drafting' });
  const before = structuredClone(s);
  // A guaranteed story at the end of this turn exercises the real save boundary.
  s.scheduled.push({ id: 'labmate_help', week: s.month * 4 });
  s = dispatch(s, { type: 'PLAY_TURN', id: 'work' });
  assert.ok(s.pendingReceipt);
  assert.equal(s.turnReceipt, undefined, 'the result waits for the player to answer');
  const storage = new Map();
  const adapter = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  saveRun(adapter, s, emptyMeta());
  s = finishScenes(loadSave(adapter).run);
  assert.equal(s.turnReceipt.projects[0].draft, Math.round(s.projects[0].draft - before.projects[0].draft));
  assert.ok(s.turnReceipt.projects[0].draft >= 50, 'writing done before the scenes is included');
  assert.equal(s.turnReceipt.hope, Math.round(s.player.stats.hope - before.player.stats.hope));
  setAppLanguage('zh');
  try { assert.notEqual(say(s, s.turnReceipt.focus, s.turnReceipt.i18nFocus), s.turnReceipt.focus); }
  finally { setAppLanguage('en'); }
});

test('a finished side draft is actionable while another paper waits for a deadline', () => {
  let s = student(); const main = createProject(s);
  Object.assign(main, { status: 'Ready', targetMonth: s.month + 4 });
  const side = createProject(s, { kind: 'side' });
  Object.assign(side, { status: 'Drafting', progress: 50, draft: 70 });
  s.activeProjectId = main.id;
  const html = deskApp(s, {});
  assert.match(html, new RegExp(`data-type="SEND_ADVISOR" data-project="${side.id}"`));
  assert.ok(html.indexOf(side.title) < html.indexOf('data-type="SEND_ADVISOR"'));
  assert.ok(turnChoices(s).find(c => c.id === 'work').detail.includes(main.title));
  s = dispatch(s, { type: 'SELECT_PROJECT', id: side.id });
  s = dispatch(s, { type: 'SEND_ADVISOR' });
  assert.equal(s.projects[1].status, 'Advisor Review');
});

test('project titles remain distinct without advancing the random stream differently', () => {
  const s = student();
  for (let i = 0; i < 20; i++) {
    const before = structuredClone(s); random(before);
    const title = projectTitle(s, 'ml', 'main');
    assert.equal(s.rng, before.rng, 'one draw, including when all base titles have been used');
    assert.ok(!s.projects.some(p => p.title === title));
    s.projects.push({ title });
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
