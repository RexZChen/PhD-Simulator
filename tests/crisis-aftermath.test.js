import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, chatBody } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject, submit, setTarget } from '../src/engine/paper.js';
import { openCrisis, resolveCrisis } from '../src/engine/life.js';
import { afterCrisis } from '../src/data/crisis.js';
import { crisisAftermathZh } from '../src/i18n/zh/crisis-aftermath.js';
import { replyOptionsFor, replyTo } from '../src/engine/slack.js';
import { replyKinds } from '../src/data/slack.js';

function fixture() {
  let s = createRun(42, { background: 'masters', topic: 'ml', international: false });
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.event = null; s.stage = 'plan'; s.month = 30;
  s.advisor.availability = 100; s.advisor.caring = 100;
  s.advisorMode = { id: 'attentive' };
  s.requests = [
    { id: 'current', advisorId: s.advisor.id, status: 'open', dueWeek: 150 },
    { id: 'former', advisorId: 'former', status: 'open', dueWeek: 150 },
    { id: 'closed', advisorId: s.advisor.id, status: 'done', dueWeek: 150 },
    { id: 'unknown', status: 'open', dueWeek: 150 },
  ];
  s.labmates = [{ id: 'departed', name: 'Former Person', status: 'left' },
    { id: 'local', name: 'Current Person', status: 'active' }];
  const paper = createProject(s);
  s.activeProjectId = paper.id;
  Object.assign(paper, { status: 'Ready', draft: 100, progress: 100, venueId: 'tmlrgh', wizardStep: 4 });
  submit(s);
  const editablePaper = createProject(s, { kind: 'side' });
  setTarget(s, editablePaper, 'top');
  s.activeProjectId = editablePaper.id;
  openCrisis(s, 'collapse');
  s.chatMessages = []; s.rng = 1;
  return s;
}

// Find a deterministic practical reply without coupling the test to chat RNG draws.
function practical(move = 'treat') {
  for (let seed = 0; seed < 30; seed++) {
    const s = fixture(); s.rng = seed;
    resolveCrisis(s, move);
    if (s.crisis.aftermath.response === 'practical') return s;
  }
  assert.fail('expected a practical response among fixed seeds');
}

test('actual crisis resolution extends only current-advisor requests once and preserves papers', () => {
  const s = practical();
  assert.deepEqual(s.requests.map(r => r.dueWeek), [152, 150, 150, 150]);
  assert.equal(s.crisis.aftermath.movedRequests, 1);
  assert.equal(s.crisis.aftermath.advisorId, s.advisor.id);
  assert.deepEqual(s.crisisHistory.at(-1).aftermath, s.crisis.aftermath);
  const before = structuredClone(s);
  assert.throws(() => resolveCrisis(s, 'treat'), /nothing to deal with/);
  assert.deepEqual(s, before);
  const clean = fixture(); clean.rng = before.rng;
  const submitted = s.projects.find(p => p.status === 'Submitted');
  const target = s.projects.find(p => p.targetVenueId);
  assert.ok(submitted && Number.isFinite(submitted.timeline.decision));
  assert.ok(target && Number.isFinite(target.targetMonth));
  assert.deepEqual(submitted.timeline, clean.projects.find(p => p.id === submitted.id).timeline);
  assert.equal(target.targetMonth, clean.projects.find(p => p.id === target.id).targetMonth);
  assert.equal(target.targetVenueId, clean.projects.find(p => p.id === target.id).targetVenueId);
  assert.deepEqual(s.projects, clean.projects);
});

test('postponement does not promise leave or move deadlines', () => {
  const s = practical('ignore');
  assert.equal(s.crisis.weeks, 0);
  assert.deepEqual(s.requests.map(r => r.dueWeek), [150, 150, 150, 150]);
  assert.equal(s.chatMessages.find(m => m.channel === 'advisor').body, afterCrisis.advisor.practical.postponed);
});

test('unavailable advisor sends no fabricated immediate reply; lab offer has one real sender', () => {
  const s = fixture(); s.advisor.availability = 0; s.advisorMode.id = 'checkedOut';
  resolveCrisis(s, 'minimum');
  assert.equal(s.crisis.aftermath.response, 'unavailable');
  assert.equal(s.chatMessages.some(m => m.channel === 'advisor'), false);
  assert.deepEqual(s.requests.map(r => r.dueWeek), [150, 150, 150, 150]);
  const msg = s.chatMessages.find(m => m.channel === 'general');
  assert.equal(msg.sender, 'Current Person'); assert.equal(msg.senderId, 'local');
  assert.ok(afterCrisis.lab.includes(msg.body));
  assert.equal(msg.i18n.s, msg.body);
  assert.equal(chatBody(s, msg), msg.body);
  assert.ok(crisisAftermathZh[msg.i18n.s]);
});

test('remote industry and retired mentor do not replace the current advisor or change caring', () => {
  const s = fixture(), other = structuredClone(s);
  other.flags.remoteAdvisor = true; other.flags.advisorIndustry = true;
  other.supervision = { kind: 'coadvised', mentor: { id: 'retired', name: 'Retired Reader' } };
  resolveCrisis(s, 'treat'); resolveCrisis(other, 'treat');
  assert.deepEqual(other.crisis.aftermath, s.crisis.aftermath);
  assert.deepEqual(other.requests, s.requests);
  assert.equal(other.chatMessages.find(m => m.channel === 'advisor').senderId, other.advisor.id);
});

test('all new response strings have Chinese translations with matching placeholders', () => {
  const lines = [...Object.values(afterCrisis.advisor.practical), afterCrisis.advisor.acknowledge,
    afterCrisis.advisor.work, afterCrisis.advisor.unavailable, ...afterCrisis.lab];
  for (const line of lines) assert.ok(crisisAftermathZh[line], line);
  for (const [en, zh] of Object.entries(crisisAftermathZh)) {
    assert.deepEqual(en.match(/\{\w+\}/g)?.sort() || [], zh.match(/\{\w+\}/g)?.sort() || []);
  }
});

test('caring changes support selection without adding health rewards', () => {
  const caring = fixture(), uncaring = structuredClone(caring);
  uncaring.advisor.caring = 0;
  // Pick the same reproducible response draw: only caring changes the reply.
  for (let seed = 0; seed < 30; seed++) {
    const a = structuredClone(caring), b = structuredClone(uncaring);
    a.rng = b.rng = seed;
    resolveCrisis(a, 'treat'); resolveCrisis(b, 'treat');
    assert.equal(a.player.stats.health, b.player.stats.health);
    assert.notEqual(b.crisis.aftermath.response, 'practical');
    if (a.crisis.aftermath.response === 'practical') return;
  }
  assert.fail('expected caring to enable a practical reply');
});

test('crisis offers invite only one free acknowledgment with the original sender and no stat effects', () => {
  for (const channel of ['advisor', 'general']) {
    const s = practical();
    const message = s.chatMessages.find(m => m.channel === channel);
    assert.deepEqual(replyOptionsFor(s, message).map(k => k.id), ['crisis_ack']);
    const stats = structuredClone({ player: s.player, relationship: s.relationship, projects: s.projects, labmates: s.labmates, peers: s.peers });
    assert.throws(() => replyTo(s, message.id, 'help'), /not something/);
    const result = replyTo(s, message.id, 'crisis_ack');
    assert.equal(result.reacts, 0);
    assert.equal(s.chatMessages.at(-1).sender, message.sender);
    assert.equal(s.chatMessages.at(-1).senderId, message.senderId);
    assert.deepEqual(replyOptionsFor(s, s.chatMessages.at(-1)), []);
    assert.deepEqual(replyOptionsFor(s, message), []);
    assert.deepEqual({ player: s.player, relationship: s.relationship, projects: s.projects, labmates: s.labmates, peers: s.peers }, stats);
    assert.throws(() => replyTo(s, message.id, 'crisis_ack'), /already answered/);
    for (const line of [replyKinds.crisis_ack.label, ...replyKinds.crisis_ack.drafts, ...replyKinds.crisis_ack.replies]) {
      assert.ok(crisisAftermathZh[line]);
    }
  }
});

test('work-focused crisis reply explicitly suppresses generic jokes and thanks', () => {
  for (let seed = 0; seed < 30; seed++) {
    const s = fixture(); s.advisor.caring = 0; s.rng = seed;
    resolveCrisis(s, 'treat');
    if (s.crisis.aftermath.response !== 'work') continue;
    const message = s.chatMessages.find(m => m.channel === 'advisor');
    assert.deepEqual(message.allowedReplyIds, []);
    assert.deepEqual(replyOptionsFor(s, message), []);
    assert.throws(() => replyTo(s, message.id, 'crisis_ack'), /not something/);
    return;
  }
  assert.fail('expected a work-focused response among fixed seeds');
});
