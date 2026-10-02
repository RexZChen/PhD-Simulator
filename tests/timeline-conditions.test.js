import test from 'node:test';
import assert from 'node:assert/strict';
import { candidate, conditional } from './timeline-fixtures.js';
import { dispatch } from '../src/engine/game.js';
import { openTimeline, checkCondition, timelineMoves, playTimelineMove, timelineCondition } from '../src/engine/timeline.js';
import { emptyMeta, saveRun, loadSave } from '../src/engine/save.js';
import { timelinePanel } from '../src/ui/apps/manager.js';

test('the first acceptance after the conversation counts without an intervening month', () => {
  const s = conditional('onepaper');
  s.counts.accepted++;
  checkCondition(s);
  assert.equal(s.grad.settled, true);
});

test('a submission made before the conversation cannot meet the new submission condition', () => {
  const s = conditional('submitted', run => {
    Object.assign(run.projects.at(-1), { status: 'Submitted', submissionHistory: [{ month: run.month - 1, outcome: 'Under review' }] });
  });
  checkCondition(s); checkCondition(s);
  assert.equal(s.grad.settled, false);
});

test('six unrelated advisor requests are not a project handover', () => {
  const s = conditional('handover');
  s.counts.requestsDone = 6;
  checkCondition(s); checkCondition(s);
  assert.equal(s.grad.settled, false);
});

test('an offer remains spent when a later graduation conversation opens', () => {
  const s = candidate();
  s.flags.usedOfferAsLeverage = true;
  s.grad = { asked: true, askedMonth: 32, rounds: 1, used: ['offer'], stance: 'deflect' };
  s.jobs.apps = [{ stage: 'offer', deadlineMonth: 60, track: 'industry_research' }];
  openTimeline(s);
  assert.equal(timelineMoves(s).some(m => m.id === 'offer'), false);
  const before = structuredClone(s);
  assert.throws(() => playTimelineMove(s, 'offer'), /already|tried|earlier/i);
  assert.deepEqual(s, before);
});

test('a cooled-off conversation can resume after a burned offer discussion', () => {
  const s = candidate();
  s.grad = { asked: true, askedMonth: 32, rounds: 1, burned: true, used: ['offer'], stance: 'deflect' };
  s.flags.usedOfferAsLeverage = true;
  openTimeline(s);
  assert.doesNotThrow(() => playTimelineMove(s, 'second'));
});

test('a new submission fulfills the condition immediately, including a revised manuscript', () => {
  let s = conditional('submitted', run => {
    run.projects.at(-1).submissionHistory = [{ venueId: 'icmlater', month: 30, outcome: 'Reject' }];
  });
  s.month = 46; s.week = 0;
  Object.assign(s.projects.at(-1), { status: 'Ready', progress: 60, draft: 80, venueId: 'aaaight', wizardStep: 4 });
  s = dispatch(s, { type: 'SUBMIT' });
  assert.equal(s.projects.at(-1).submissionHistory.length, 2);
  assert.equal(s.grad.settled, true);
  assert.ok(s.achievements.includes('metthebar'));
  assert.equal(s.milestones.defenseMonth, null, 'meeting a condition does not book the exam');
});

test('handover belongs to the agreed project, records its recipient, and costs energy only once', () => {
  let s = conditional('handover');
  const c = timelineCondition(s), energy = s.player.stats.energy;
  const projects = structuredClone(s.projects), requests = s.counts.requestsDone;
  s.activeProjectId = s.projects.find(p => p.id !== c.projectId)?.id || null;
  s = dispatch(s, { type: 'TIMELINE_DOCUMENT', id: c.projectId, recipientId: c.recipientId });
  assert.equal(s.grad.settled, true);
  assert.equal(s.player.stats.energy, energy - 6);
  assert.deepEqual(s.projects, projects, 'handover does not rewrite manuscript contents or review results');
  assert.equal(s.counts.requestsDone, requests);
  assert.equal(s.grad.conditionHandover.projectId, c.projectId);
  assert.equal(s.grad.conditionHandover.recipientName, c.recipientName);
  assert.ok(s.chatMessages.some(m => m.channel === `dm:${c.recipientId}` && m.body.includes(c.projectTitle)));
  assert.throws(() => dispatch(s, { type: 'TIMELINE_DOCUMENT', id: c.projectId, recipientId: c.recipientId }), /no unfinished/i);
});

test('handover checks energy and stale identities before spending or changing the agreement', () => {
  const s = conditional('handover'), c = timelineCondition(s);
  for (const change of [run => { run.player.stats.energy = 5; }, run => { run.labmates.find(l => l.id === c.recipientId).status = 'graduated'; }]) {
    const run = structuredClone(s); change(run); const before = structuredClone(run);
    assert.throws(() => dispatch(run, { type: 'TIMELINE_DOCUMENT', id: c.projectId, recipientId: c.recipientId }), /Energy|details changed|no active labmate/);
    assert.deepEqual(run, before);
  }
  s.flags.documented = true;
  checkCondition(s);
  assert.equal(s.grad.settled, false, 'an unscoped legacy flag cannot document this project');
});

test('agreement baselines and completed handovers survive save and reload', () => {
  const entries = new Map();
  const storage = { getItem: k => entries.get(k) ?? null, setItem: (k, v) => entries.set(k, v) };
  let s = conditional('onepaper');
  assert.equal(saveRun(storage, s, emptyMeta()).error, null);
  s = loadSave(storage).run;
  s.counts.accepted++;
  checkCondition(s);
  assert.equal(s.grad.settled, true);
  s = conditional('handover'); const c = timelineCondition(s);
  s = dispatch(s, { type: 'TIMELINE_DOCUMENT', id: c.projectId, recipientId: c.recipientId });
  saveRun(storage, s, emptyMeta());
  const loaded = loadSave(storage).run;
  assert.deepEqual(loaded.grad, s.grad);
  assert.match(timelinePanel(loaded), /Handover recorded/);
});

test('legacy agreements establish missing baselines on resume without silently claiming old work', () => {
  const entries = new Map();
  const storage = { getItem: k => entries.get(k) ?? null, setItem: (k, v) => entries.set(k, v) };
  const original = conditional('submitted');
  delete original.grad.conditionBaseline;
  original.projects.at(-1).submissionHistory = [{ month: 30, outcome: 'Under review' }];
  saveRun(storage, original, emptyMeta());
  const s = loadSave(storage).run;
  const before = structuredClone(s);
  timelinePanel(s); timelinePanel(s);
  assert.deepEqual(s, before, 'rendering must be read-only');
  assert.equal(timelineCondition(s).legacy, true);
  checkCondition(s);
  assert.equal(s.grad.settled, false);
  s.projects.at(-1).submissionHistory.push({ month: s.month, outcome: 'Under review' });
  checkCondition(s);
  assert.equal(s.grad.settled, true);
});

test('reopening honors a fulfilled legacy acceptance before charging or replacing its condition', () => {
  let s = conditional('onepaper');
  delete s.grad.conditionBaseline;
  s.counts.accepted++;
  s.month += 3;
  const energy = s.player.stats.energy, rounds = s.grad.rounds;
  s = dispatch(s, { type: 'ASK_TIMELINE' });
  assert.equal(s.grad.settled, true);
  assert.equal(s.grad.condition, 'onepaper');
  assert.equal(s.grad.rounds, rounds);
  assert.equal(s.player.stats.energy, energy);
  assert.ok(s.achievements.includes('metthebar'));
});

test('a successful argument establishes the condition when the advisor first names it', () => {
  let found = false;
  for (let seed = 1; seed <= 80 && !found; seed++) {
    const s = candidate(seed);
    Object.assign(s.advisor, { caring: 0, toxicity: 70, ambition: 100 });
    openTimeline(s);
    if (s.grad.stance !== 'deflect') continue;
    const result = playTimelineMove(s, 'evidence');
    if (!result.won || s.grad.condition !== 'onepaper') continue;
    found = true;
    assert.match(s.grad.line, /finally name the remaining work/);
    s.counts.accepted++;
    checkCondition(s);
    assert.equal(s.grad.settled, true);
  }
  assert.equal(found, true);
});

test('a committee-ready draft meets the disclosed 90-point threshold', () => {
  const s = conditional('draft');
  s.projects.push({ id: 'dissertation', kind: 'thesis', draft: 89 });
  checkCondition(s);
  assert.equal(s.grad.settled, false);
  assert.equal(timelineCondition(s).required, 90);
  s.projects.at(-1).draft = 90;
  checkCondition(s);
  assert.equal(s.grad.settled, true);
});
