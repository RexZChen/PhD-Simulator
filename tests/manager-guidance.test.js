import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, absWeek } from '../src/engine/state.js';
import { dispatch, focusOptions } from '../src/engine/game.js';
import { createProject } from '../src/engine/paper.js';
import { schools } from '../src/data/catalog.js';
import { requests } from '../src/data/requests.js';
import { managerApp, managerNextStep, recommendedPlan } from '../src/ui/apps/manager.js';

function planningRun() {
  let s = createRun(8128, { background: 'masters', topic: 'ml', international: false });
  const advisor = s.advisors.find(a => a.schoolId === schools[0].id);
  s.phase = 'admissions';
  s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  s.stage = 'plan'; s.event = null; s.queue = []; s.requests = [];
  s.player.stats.energy = 80;
  return s;
}

test('a project with no plan always has an actionable next step', () => {
  const s = planningRun();
  createProject(s);
  const before = structuredClone(s);
  const step = managerNextStep(s);
  assert.ok(step, 'Continue is disabled, so the player needs guidance');
  assert.match(step.title, /Research/);
  assert.match(step.cta, /data-action="plan"/);
  assert.match(step.cta, /data-id="research"/);
  assert.deepEqual(s, before, 'choosing guidance must not change the run');
  const html = managerApp(s, {});
  assert.match(html, /id="manager-plans"/);
  assert.match(html, /Choose a plan to enable Continue/);
});

test('suggestions favor recovery when energy or health is low and never choose a disabled plan', () => {
  for (const stat of ['energy', 'health']) {
    const s = planningRun();
    createProject(s);
    s.player.stats[stat] = 20;
    const before = structuredClone(s);
    const suggestion = recommendedPlan(s);
    assert.equal(suggestion.plan.id, 'rest');
    assert.ok(suggestion.plan.effects.energy > 0);
    assert.deepEqual(s, before, 'recommendations do not spend time or alter the run');
  }
  for (const month of [0, 8, 11, 22, 30, 54]) {
    const s = planningRun();
    s.month = month;
    const suggestion = recommendedPlan(s);
    assert.ok(focusOptions(s).some(f => f.id === suggestion.plan.id && !f.disabled), `month ${month}: suggested plan must be available`);
    assert.ok(!['research', 'write'].includes(suggestion.plan.id), 'do not recommend research without a project');
  }
});

test('suggestions match current work and preserve a chosen alternative', () => {
  const s = planningRun();
  const p = createProject(s);
  assert.equal(recommendedPlan(s).plan.id, 'research');
  Object.assign(p, { progress: 60, draft: 20, status: 'Drafting' });
  assert.equal(recommendedPlan(s).plan.id, 'write');
  s.month = s.milestones.prelimMonth - 4;
  s.coursework = 20;
  assert.equal(recommendedPlan(s).plan.id, 'coursework');
  s.focus = 'rest';
  const html = managerApp(s, {});
  assert.equal(s.focus, 'rest');
  assert.match(html, /manager-plan-summary[\s\S]*?Rest/);
  assert.doesNotMatch(html, /data-plan-suggestion/);
});

test('selecting a plan names it and makes the next time step explicit', () => {
  const s = planningRun();
  createProject(s);
  s.focus = 'research';
  const step = managerNextStep(s);
  assert.match(step.title, /Research/);
  assert.match(step.cta, /data-action="continue"/);
  assert.match(step.cta, /October 2028/);
  const html = managerApp(s, {});
  for (const f of focusOptions(s)) assert.ok(html.includes(`data-id="${f.id}"`), `${f.id} remains available to inspect`);
  assert.match(html, /data-action="plan" data-id="research"[^>]*aria-pressed="true"/);
});

test('a rebuttal deadline outranks starting another project and routine requests', () => {
  const s = planningRun();
  const p = createProject(s);
  p.status = 'Rebuttal';
  s.requests = [{ id: 'routine', status: 'open', dueWeek: absWeek(s) + 4 }];
  const step = managerNextStep(s);
  assert.match(step.title, /rebuttal/i);
  assert.match(step.detail, /this month/i);
  assert.match(step.cta, /data-page="openregret"/);
});

test('a rebuttal on another paper names it and opens that project for review', () => {
  const s = planningRun();
  const submitted = createProject(s);
  submitted.status = 'Rebuttal';
  const current = createProject(s);
  s.focus = 'research';
  const step = managerNextStep(s);
  assert.match(step.title, /rebuttal/i);
  assert.ok(step.detail.includes(submitted.title), 'identify the paper whose window is closing');
  assert.ok(step.cta.includes(`data-project="${submitted.id}"`), 'navigate to the paper needing a response');
  assert.match(step.cta, /data-page="openregret"/);
  assert.equal(s.activeProjectId, current.id, 'guidance must not silently change the active project');
});

test('a finished draft links to the editor that can send it for review', () => {
  const s = planningRun();
  const p = createProject(s);
  Object.assign(p, { status: 'Drafting', draft: 100, progress: 80 });
  assert.match(managerNextStep(s).cta, /data-page="overgrief"/);
});

test('a selected recovery plan can continue when energy is low', () => {
  const s = planningRun();
  createProject(s);
  s.player.stats.energy = 10;
  s.focus = 'rest';
  const step = managerNextStep(s);
  assert.match(step.title, /Rest/);
  assert.match(step.cta, /data-action="continue"/);
});

test('requests that expire on the next turn stay visible and get a direct jump', () => {
  const s = planningRun();
  s.requests = [{ id: 'due', templateId: requests[0].id, kind: requests[0].kind, status: 'open', dueWeek: absWeek(s) }];
  const step = managerNextStep(s);
  assert.match(step.cta, /data-action="manager-jump"/);
  assert.match(step.cta, /data-id="requests"/);
  const html = managerApp(s, {});
  assert.match(html, /id="manager-requests"/);
  assert.match(html, /data-action="req-do"/);
});

test('secondary context is collapsed while plans and projects remain in the main workspace', () => {
  const s = planningRun();
  const html = managerApp(s, {});
  for (const key of ['manager-advisor', 'manager-support', 'manager-notes']) {
    assert.match(html, new RegExp(`<details[^>]*data-detail="${key}"[^>]*>`));
    assert.doesNotMatch(html, new RegExp(`<details[^>]*data-detail="${key}"[^>]*\\bopen\\b`));
  }
  assert.ok(html.indexOf('manager-plan-summary') < html.indexOf('data-detail="manager-calendar"'), 'the core turn comes before optional context');
  assert.match(html, /<details[^>]*id="manager-plans"[^>]*data-detail="manager-plans-choice"/);
  assert.match(html, /id="manager-projects"/);
  assert.match(html, /data-action="start-project"/);
});
