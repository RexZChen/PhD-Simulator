import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dmOptions, sendDm } from '../src/engine/slack.js';
import { dmOpeners } from '../src/data/slack.js';
import { dmZh } from '../src/i18n/zh/dm.js';

function enrolled() {
  const s = createRun(4242, { background: 'masters', topic: 'ml', international: false });
  s.phase = 'playing';
  const person = { id: 'lab-senior', name: 'Senior Student', role: 'senior', status: 'active', bond: 30 };
  s.labmates.push(person);
  return { s, person };
}

test('senior advice follows milestones and retains earlier conversations and used markers', () => {
  const { s, person } = enrolled();
  sendDm(s, person.id, 'how_did_you');
  const history = structuredClone(s.chatMessages);
  assert.equal(dmOptions(s, person.id).find(o => o.id === 'how_did_you').done, true);
  for (const result of ['pass', 'conditional']) {
    s.milestones.prelim = result;
    assert.deepEqual(dmOptions(s, person.id).map(o => o.id), ['proposal_scope', 'advisor_read']);
    assert.throws(() => sendDm(s, person.id, 'how_did_you'));
  }
  const energy = s.player.stats.energy;
  sendDm(s, person.id, 'proposal_scope');
  assert.equal(s.player.stats.energy, energy - 2);
  assert.equal(dmOptions(s, person.id).find(o => o.id === 'proposal_scope').done, true);
  assert.throws(() => sendDm(s, person.id, 'proposal_scope'));
  s.milestones.proposal = 'conditional';
  assert.equal(dmOptions(s, person.id).some(o => o.id === 'defense_edges'), false);
  s.milestones.proposal = 'pass';
  assert.deepEqual(dmOptions(s, person.id).map(o => o.id), ['defense_edges', 'advisor_read']);
  sendDm(s, person.id, 'defense_edges');
  assert.deepEqual(s.dmUsed[person.id], ['how_did_you', 'proposal_scope', 'defense_edges']);
  assert.deepEqual(s.chatMessages.slice(0, history.length), history);
  s.milestones.defense = 'pass';
  assert.deepEqual(dmOptions(s, person.id).map(o => o.id), ['advisor_read']);
});

test('future-stage and departed-person DMs cannot consume energy or change the log', () => {
  const { s, person } = enrolled();
  const before = structuredClone(s);
  assert.throws(() => sendDm(s, person.id, 'proposal_scope'));
  assert.throws(() => sendDm(s, person.id, 'defense_edges'));
  assert.deepEqual(s, before);
  person.status = 'graduated';
  assert.deepEqual(dmOptions(s, person.id), []);
  const departed = structuredClone(s);
  assert.throws(() => sendDm(s, person.id, 'advisor_read'), /cannot message/);
  assert.deepEqual(s, departed);
});

test('new senior advice remains once per person, energy gated, and fully translated', () => {
  const { s, person } = enrolled();
  s.milestones.prelim = 'pass';
  s.player.stats.energy = 1;
  assert.throws(() => sendDm(s, person.id, 'proposal_scope'), /Energy/);
  assert.equal(s.dmUsed?.[person.id], undefined);
  s.player.stats.energy = 30;
  sendDm(s, person.id, 'proposal_scope');
  const second = { ...person, id: 'second-senior', name: 'Another Student' };
  s.labmates.push(second);
  assert.equal(dmOptions(s, second.id).find(o => o.id === 'proposal_scope').done, false);
  for (const option of dmOpeners.senior.filter(o => ['proposal', 'defense'].includes(o.stage))) {
    for (const key of ['label', 'draft', 'reply']) assert.ok(dmZh[option[key]], `Missing Chinese for ${option.id}.${key}`);
  }
});
