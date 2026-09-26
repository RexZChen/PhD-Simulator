import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject, decide } from '../src/engine/paper.js';
import { chatphdReplies } from '../src/data/chatter.js';

function researcher() {
  let s = createRun(4242);
  const advisor = s.advisors[0];
  s.phase = 'admissions';
  s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  s.phase = 'playing'; s.stage = 'plan'; s.event = null; s.eventQueue = [];
  const p = createProject(s);
  s.activeProjectId = p.id;
  Object.assign(p, { status: 'Drafting', draft: 20, hype: 10, reproducibility: 50 });
  s.player.stats.energy = 50;
  return s;
}
const request = s => dispatch(s, { type: 'CHATPHD', id: 'abstract' });
const resolve = (s, id) => dispatch(s, { type: 'CHATPHD_RESOLVE', id });
const project = s => s.projects.find(p => p.id === s.activeProjectId);

test('request is a persistent preview without gameplay effects and cannot be rerolled', () => {
  const before = researcher();
  const s = request(before);
  assert.deepEqual(s.player.stats, before.player.stats);
  assert.deepEqual(s.projects, before.projects);
  assert.equal(s.actions.chatphd, true);
  assert.equal(s.chatphdPending.projectId, s.activeProjectId);
  assert.ok(s.chatphdPending.text.length);
  assert.deepEqual(JSON.parse(JSON.stringify(s)).chatphdPending, s.chatphdPending);
  assert.throws(() => request(s), /current suggestion/);
  const discarded = resolve(s, 'discard');
  assert.deepEqual(discarded.projects, before.projects);
  assert.deepEqual(discarded.player.stats, before.player.stats);
  assert.throws(() => request(discarded), /already did/);
});

test('checking spends energy, corrects bad advice, and applies the selected benefit once', () => {
  const s = request(researcher());
  s.chatphdPending.wrong = true;
  const checked = resolve(s, 'check');
  assert.equal(checked.player.stats.energy, 51);
  assert.equal(project(checked).draft, 28);
  assert.equal(project(checked).reproducibility, 50);
  assert.equal(project(checked).hype, 10);
  assert.match(checked.chatphd, /caught an error/);
  assert.equal(checked.chatphdPending, null);
  assert.throws(() => resolve(checked, 'check'), /current suggestion/);
  s.player.stats.energy = 1;
  assert.throws(() => resolve(s, 'check'), /2 Energy/);
  assert.ok(s.chatphdPending, 'failed check leaves the suggestion available');
});

test('using unchecked advice accepts its risk and preserves the full output', () => {
  const s = request(researcher());
  s.chatphdPending.wrong = true;
  const text = s.chatphdPending.text;
  const used = resolve(s, 'use');
  assert.equal(used.player.stats.energy, 53);
  assert.equal(project(used).draft, 28);
  assert.equal(project(used).hype, 18);
  assert.equal(project(used).reproducibility, 46);
  assert.ok(used.chatphd.startsWith(text));
  assert.match(used.chatphd, /without checking/);
});

test('a pending suggestion cannot modify another project or a closed draft', () => {
  const s = request(researcher());
  const original = project(s);
  const other = createProject(s, { kind: 'side' });
  s.activeProjectId = other.id;
  assert.throws(() => resolve(s, 'use'), /original project/);
  assert.doesNotThrow(() => resolve(s, 'discard'));
  s.activeProjectId = original.id;
  original.status = 'Submitted';
  assert.throws(() => resolve(s, 'check'), /no longer fits/);
  assert.doesNotThrow(() => resolve(s, 'discard'));
  s.stage = 'report';
  assert.throws(() => resolve(s, 'discard'), /report/);
});

test('rebuttal help stays on its paper when another paper decides first', () => {
  let s = researcher();
  project(s).status = 'Rebuttal';
  s = dispatch(s, { type: 'CHATPHD', id: 'rebuttal' });
  s = resolve(s, 'check');
  const helped = project(s);
  assert.equal(helped.rebuttalBonus, true);
  assert.equal(s.flags.rebuttalBonus, undefined);
  const other = createProject(s, { kind: 'side' });
  for (const p of [helped, other]) Object.assign(p, { venueId: 'tmlrgh', reviewers: [{ score: 3, confidence: 3 }], submissionHistory: [{ outcome: 'Pending' }] });
  decide(s, other, 0);
  assert.equal(helped.rebuttalBonus, true);
  decide(s, helped, 0);
  assert.equal(helped.rebuttalBonus, false);
});

test('translated conversation starters select known topics without changing typed classification', () => {
  const s = researcher();
  const hello = dispatch(s, { type: 'CHATPHD_SAY', topic: 'hello', text: '你好' });
  assert.ok(chatphdReplies.hello.includes(hello.chatphdLog.at(-1).text));
  const typed = dispatch(s, { type: 'CHATPHD_SAY', topic: '__proto__', text: 'hello' });
  assert.ok(chatphdReplies.hello.includes(typed.chatphdLog.at(-1).text));
});
