import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject, writeBudget } from '../src/engine/paper.js';
import { focusOptions } from '../src/engine/time.js';
import { managerApp } from '../src/ui/apps/manager.js';
import { saveRun, loadSave, emptyMeta, writeSlot, readSlot } from '../src/engine/save.js';

function waiting(status = 'Advisor Review') {
  let s = createRun(731, { background: 'masters', topic: 'ml', international: false });
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  const p = createProject(s);
  Object.assign(p, { status, reviewDueWeek: 40, targetMonth: 10, targetVenueId: 'aaaight', targetVenue: 'AAAIght' });
  Object.assign(s, { month: 7, week: 0, stage: 'plan', event: null, eventQueue: [], scheduled: [], needsBegin: false, requests: [] });
  s.summons = { answered: true };
  return dispatch(s, { type: 'SET_PACE', id: 'week' });
}

test('choosing a calm week retains courses, career, networking and recovery while the paper is locked', () => {
  for (const status of ['Advisor Review', 'Submitted', 'Accepted']) {
    const s = waiting(status), available = focusOptions(s).filter(f => !f.disabled).map(f => f.id);
    assert.equal(s.crunch.type, 'zoom');
    for (const id of ['coursework', 'network', 'career', 'life', 'rest']) assert.ok(available.includes(id), `${status}: ${id}`);
    assert.ok(!available.includes('research'));
    assert.doesNotMatch(managerApp(s, {}), /DEADLINE MONTH|Deadline weeks pass one at a time/);
  }
});

test('one ordinary week spends one quarter of a monthly career plan, without paying another stipend', () => {
  let s = waiting(); const before = structuredClone(s);
  s = dispatch(s, { type: 'PLAN', id: 'career' });
  s = dispatch(s, { type: 'CONTINUE' });
  assert.equal(s.month, before.month); assert.equal(s.week, 1);
  assert.equal(s.career - before.career, 17 / 4);
  assert.equal(s.player.stats.money, before.player.stats.money);
  assert.deepEqual(s.projects, before.projects);
});

test('a real paper deadline still offers the intensive experiment and writing plans', () => {
  let s = waiting('Drafting');
  s.projects.find(p => p.id === s.activeProjectId).targetMonth = s.month;
  s = dispatch(s, { type: 'SET_PACE', id: 'week' });
  assert.equal(s.crunch.type, 'deadline');
  const ids = focusOptions(s).filter(f => !f.disabled).map(f => f.id);
  assert.ok(ids.includes('experiments')); assert.ok(ids.includes('writing'));
});

test('a calm working day scales an ordinary plan to one twentieth of a month', () => {
  let s = dispatch(waiting(), { type: 'SET_PACE', id: 'day' });
  const before = structuredClone(s);
  s = dispatch(s, { type: 'PLAN', id: 'career' });
  s = dispatch(s, { type: 'CONTINUE' });
  assert.equal(s.month, before.month); assert.equal(s.week, 0); assert.equal(s.dayIndex, 1);
  assert.ok(Math.abs(s.career - before.career - 17 / 20) < 1e-9);
  assert.equal(s.player.stats.money, before.player.stats.money);
});

test('weekly rest does not count as an entire rested month', () => {
  let s = waiting();
  const before = s.counts.rested || 0;
  s = dispatch(s, { type: 'PLAN', id: 'rest' });
  s = dispatch(s, { type: 'CONTINUE' });
  assert.equal(s.counts.rested - before, .25);
});

test('explicitly returning to day pace preserves elapsed time and spent action budgets', () => {
  let s = dispatch(waiting(), { type: 'SET_PACE', id: 'day' });
  s.dayIndex = 2; s.typed = 1; s.dayActions = { coffee: true }; s.actions = { chatphd: true };
  const before = structuredClone(s);
  s = dispatch(s, { type: 'SET_PACE', id: 'week' });
  s = dispatch(s, { type: 'SET_PACE', id: 'day' });
  for (const key of ['month', 'week', 'dayIndex', 'typed', 'dayActions', 'actions', 'rng']) assert.deepEqual(s[key], before[key]);
});

test('ordinary writing allowance scales with calm weeks and days', () => {
  for (const focus of ['research', 'write']) {
    let s = waiting('Drafting'); s.projects.find(p => p.id === s.activeProjectId).progress = 50; s.focus = focus;
    const monthly = focus === 'write' ? 50 : 20;
    assert.equal(writeBudget(s), monthly / 4);
    s = dispatch(s, { type: 'SET_PACE', id: 'day' });
    s = dispatch(s, { type: 'PLAN', id: focus });
    assert.equal(writeBudget(s), monthly / 20);
  }
});

test('old calm-week saves discard an obsolete sprint selection without replaying the turn', () => {
  const s = waiting(); s.focus = 'sleep'; s.typed = 3; s.dayActions = { coffee: true };
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(saveRun(storage, s, emptyMeta()).error, null);
  writeSlot(storage, 1, s);
  for (const resumed of [loadSave(storage).run, readSlot(storage, 1)]) {
    assert.equal(resumed.focus, null);
    for (const key of ['month', 'week', 'dayIndex', 'typed', 'dayActions', 'actions', 'rng', 'ledger', 'projects']) assert.deepEqual(resumed[key], s[key]);
  }
});
