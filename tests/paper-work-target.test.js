import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, effects, editable } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { focusOptions, crunchSnapshot } from '../src/engine/time.js';
import { acceptanceChance } from '../src/engine/paper.js';
import { venues } from '../src/data/venues.js';

function workingRun(status = 'Rebuttal', second = true) {
  let s = createRun(731, { background: 'masters', topic: 'ml', international: false });
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.stage = 'plan'; s.event = null; s.eventQueue = []; s.needsBegin = false;
  s = dispatch(s, { type: 'START_PROJECT' });
  const p = s.projects[0];
  Object.assign(p, { status, progress: 85, draft: 90, evidence: 50, writingQuality: 50, venueId: venues[0].id,
    timeline: { submitted: 38, rebuttal: 40, decision: 42 }, reviewers: [{ score: 5 }], phaseOneDone: true });
  if (second) s.projects.push({ ...structuredClone(p), id: 'other-paper', status: 'Drafting', title: 'A separate paper', timeline: null, venueId: null });
  s.month = 40; s.week = 0; s.dayIndex = 0; s.milestones.prelim = 'pass'; s.milestones.proposalMonth = 48;
  s.crunch = crunchSnapshot(s); s.tempo = s.crunch ? 'week' : 'month';
  s.summons = { answered: true, keep: 1 }; s.player.stats.energy = 80; s.player.stats.health = 90;
  s.player.stats.hope = 80; s.player.hidden.stress = 20; s.requests = []; s.scheduled = [];
  return s;
}
const paperFields = p => Object.fromEntries(['progress', 'draft', 'evidence', 'writingQuality', 'reproducibility'].map(k => [k, p[k]]));

test('normal research and writing reject immutable selected papers before charging time or energy', () => {
  for (const status of ['Submitted', 'Rebuttal', 'Advisor Review', 'Accepted', 'Abandoned']) {
    for (const second of [false, true]) {
      const s = workingRun(status, second); s.crunch = null; s.tempo = 'month';
      for (const id of ['research', 'write']) {
        assert.ok(focusOptions(s).find(f => f.id === id).disabled, `${status} / ${second} / ${id}`);
        const before = structuredClone(s);
        assert.throws(() => dispatch(s, { type: 'PLAN', id }));
        assert.deepEqual(s, before);
      }
      if (second) {
        s.activeProjectId = 'other-paper';
        assert.equal(focusOptions(s).find(f => f.id === 'research').disabled, null);
      }
    }
  }
});

test('rebuttal weekly work improves its own paper and decision odds while another paper is selected', () => {
  for (const id of ['experiments', 'writing', 'feedback']) {
    let s = workingRun(); const targetId = s.projects[0].id;
    s.activeProjectId = 'other-paper';
    const otherBefore = paperFields(s.projects[1]); const targetBefore = paperFields(s.projects[0]);
    const odds = acceptanceChance(s.projects[0], venues[0], s.projects[0].reviewers);
    s = dispatch(s, { type: 'PLAN', id }); s = dispatch(s, { type: 'CONTINUE' });
    const target = s.projects.find(p => p.id === targetId);
    assert.ok(target[id === 'experiments' ? 'evidence' : 'writingQuality'] > targetBefore[id === 'experiments' ? 'evidence' : 'writingQuality']);
    assert.deepEqual(paperFields(s.projects[1]), otherBefore);
    assert.ok(acceptanceChance(target, venues[0], target.reviewers) > odds);
    assert.equal(target.progress, targetBefore.progress); assert.equal(target.draft, targetBefore.draft);
    assert.equal(editable(target), false);
  }
});

test('day rebuttal plans advertise and apply only rebuttal work, scaled to one working day', () => {
  let week = workingRun(), day = structuredClone(week);
  day.tempo = 'day'; day.dayMode = day.month;
  assert.deepEqual(focusOptions(day).map(f => f.id), ['writing', 'experiments', 'feedback', 'sleep']);
  assert.ok(focusOptions(day).every(f => !f.effects.progress && !f.effects.draft));
  for (const s of [week, day]) { s.focus = 'experiments'; s.activeProjectId = 'other-paper'; }
  week = dispatch(week, { type: 'CONTINUE' }); day = dispatch(day, { type: 'CONTINUE' });
  assert.ok(Math.abs((day.projects[0].evidence - 50) * 5 - (week.projects[0].evidence - 50)) < 1e-8);
  assert.equal(day.projects[1].evidence, 50);
});

test('leave and rest do not secretly prepare a rebuttal, and generic effects keep submissions immutable', () => {
  for (const leave of [false, true]) {
    let s = workingRun(); const before = paperFields(s.projects[0]);
    if (leave) s.leaveWeeks = 1;
    s.focus = leave ? 'recovery' : 'sleep';
    s = dispatch(s, { type: 'CONTINUE' });
    assert.deepEqual(paperFields(s.projects[0]), before);
  }
  for (const status of ['Submitted', 'Rebuttal']) {
    const s = workingRun(status); const before = paperFields(s.projects[0]);
    effects(s, { evidence: 5, writingQuality: 5, draft: 5, progress: 5 });
    assert.deepEqual(paperFields(s.projects[0]), before);
  }
});

test('an already submitted response cannot keep buying preparation through a stale crunch snapshot', () => {
  let s = workingRun(); s = dispatch(s, { type: 'REBUT', id: 'careful' });
  assert.equal(s.projects[0].status, 'Submitted');
  assert.equal(s.crunch, null);
  assert.equal(focusOptions(s).find(f => f.id === 'experiments'), undefined);
  const before = structuredClone(s);
  assert.throws(() => dispatch(s, { type: 'PLAN', id: 'experiments' }));
  assert.deepEqual(s, before);
  assert.equal(focusOptions(s).find(f => f.id === 'rest').disabled, null);
  assert.equal(s.activeProjectId, 'other-paper');
});

test('entering a rebuttal month keeps the actual rebuttal paper selected instead of switching to another draft', () => {
  let s = workingRun(); const target = s.projects[0].id;
  s.month = 39; s.week = 4; s.stage = 'report';
  s = dispatch(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.month, 40);
  assert.equal(s.crunch.type, 'rebuttal'); assert.equal(s.crunch.projectId, target);
  assert.equal(s.activeProjectId, target);
});

test('deadline work follows its own target and waits honestly while that draft is with the advisor', () => {
  for (const tempo of ['week', 'day']) {
    let s = workingRun('Drafting');
    s.projects[0].targetMonth = s.month;
    s.crunch = crunchSnapshot(s); s.tempo = tempo; s.activeProjectId = 'other-paper';
    s.focus = tempo === 'day' ? 'deep' : 'experiments';
    const other = paperFields(s.projects[1]);
    s = dispatch(s, { type: 'CONTINUE' });
    assert.ok(s.projects[0].evidence > 50);
    assert.deepEqual(paperFields(s.projects[1]), other);
    const locked = workingRun('Advisor Review');
    locked.projects[0].targetMonth = locked.month;
    locked.crunch = crunchSnapshot(locked); locked.tempo = tempo; locked.activeProjectId = 'other-paper';
    const plans = focusOptions(locked);
    assert.ok(plans.find(f => f.id === (tempo === 'day' ? 'deep' : 'experiments')).disabled);
    assert.equal(plans.find(f => f.id === (tempo === 'day' ? 'rest' : 'sleep')).disabled, null);
  }
});

test('sending a draft clears stale work and invalid saved plans cannot raise a summons or spend time', () => {
  let s = workingRun('Drafting', false); s.focus = 'research'; s.crunch = null; s.tempo = 'month';
  s = dispatch(s, { type: 'SEND_ADVISOR' });
  assert.equal(s.focus, null);
  s.focus = 'research'; s.summons = null;
  const before = structuredClone(s);
  assert.throws(() => dispatch(s, { type: 'CONTINUE' }));
  assert.deepEqual(s, before);
  s.stage = 'summons'; s.summons = { id: 'advisor_now', answered: false, hard: false };
  const month = s.month, week = s.week, energy = s.player.stats.energy;
  s = dispatch(s, { type: 'SUMMONS', id: 'decline' });
  assert.equal(s.stage, 'plan'); assert.equal(s.focus, null);
  assert.equal(s.summons.answered, true);
  assert.equal(s.month, month); assert.equal(s.week, week); assert.equal(s.player.stats.energy, energy);
});
