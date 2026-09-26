import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, activePeers, fill, peerAffiliation, effects } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { dmPeople, dmOptions, sendDm, roomReacts } from '../src/engine/slack.js';
import { createProject } from '../src/engine/paper.js';
import { startTrip, spendTripDay } from '../src/engine/trip.js';
import { schools } from '../src/data/catalog.js';
import { setAppLanguage } from '../src/i18n/apply.js';

function moved() {
  let s = createRun(4242);
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  const old = s.program.id;
  s.program = structuredClone(schools.find(x => x.id !== old));
  s.peers = [
    { id: 'former', name: 'Former Friend', labOf: 'Old Professor', schoolId: old, status: 'remote', bond: 40, fate: 'thrive' },
    { id: 'departed', name: 'Departed Friend', labOf: 'Old Professor', schoolId: old, status: 'left', bond: 40, fate: 'leave' },
    { id: 'local', name: 'Local Friend', labOf: 'New Professor', schoolId: s.program.id, status: 'active', bond: 40, fate: 'thrive' },
  ];
  return s;
}

test('physical peer fallback stays local while legacy unaffiliated peers remain compatible', () => {
  const s = moved();
  assert.deepEqual(activePeers(s).map(p => p.id), ['local']);
  assert.equal(fill(s, '{peer}'), 'Local Friend');
  s.peers.push({ id: 'legacy', name: 'Legacy Friend', status: 'active' });
  s.peers.push({ id: 'elsewhere', name: 'Elsewhere Friend', status: 'active', schoolId: s.peers[0].schoolId });
  assert.deepEqual(activePeers(s).map(p => p.id), ['local', 'legacy']);
  s.eventActor = { type: 'peer', id: 'former' };
  assert.equal(fill(s, '{peer}'), 'Former Friend', 'an explicit historical actor is not rewritten');
});

test('remote peers remain messageable and a DM strengthens only the addressed relationship', () => {
  const s = moved();
  assert.ok(dmPeople(s).some(p => p.id === 'former'));
  assert.ok(!dmPeople(s).some(p => p.id === 'departed'));
  const opener = dmOptions(s, 'former')[0];
  assert.ok(opener);
  const before = s.peers.map(p => p.bond);
  sendDm(s, 'former', opener.id);
  assert.ok(s.peers[0].bond > before[0]);
  assert.deepEqual(s.peers.slice(1).map(p => p.bond), before.slice(1));
  assert.equal(s.chatMessages.at(-1).sender, 'Former Friend');
  assert.throws(() => sendDm(s, 'departed', opener.id), /cannot message/);
});

test('physical cohort effects change local bonds without reaching remote or departed peers', () => {
  const s = moved();
  s.peers.push({ id: 'wrong-campus', status: 'active', schoolId: s.peers[0].schoolId, bond: 40 });
  effects(s, { peerBond: 8 });
  assert.deepEqual(s.peers.map(p => p.bond), [40, 40, 48, 40]);
  effects(s, { peerBond: -100 });
  assert.deepEqual(s.peers.map(p => p.bond), [40, 40, 0, 40]);
});

test('remote cohort members can react online without departed people returning', () => {
  const s = moved(); s.labmates = []; s.peers = s.peers.slice(0, 2);
  s.peers[0].bond = 100; s.standing = 100;
  s.chatMessages = [{ id: 'posted', mine: true, channel: 'cohort', sender: s.player.name, body: 'hello' }];
  let reacted = false;
  for (let seed = 1; seed <= 20 && !reacted; seed++) {
    s.rng = seed; roomReacts(s, 'ask', 'cohort');
    reacted = !!s.chatMessages[0].reacts?.length;
  }
  assert.equal(reacted, true);
  assert.ok(s.chatMessages[0].reacts.every(r => r.by !== 'Departed'));
});

test('conference coffee can reunite remote peers but not departed peers', () => {
  const base = moved(); base.peers = base.peers.slice(0, 2);
  const p = createProject(base); p.status = 'Accepted'; p.venueId = 'osdisaster';
  base.player.stats.money = 12000;
  startTrip(base, p, 'boston');
  base.trip.talkDay = 2; base.trip.day = 0;
  let reunited = false;
  for (let seed = 1; seed <= 30; seed++) {
    const s = structuredClone(base); s.rng = seed;
    const note = spendTripDay(s, 'coffee');
    assert.doesNotMatch(note, /Departed/);
    assert.equal(s.peers[1].bond, base.peers[1].bond);
    if (note.includes('Former')) reunited = true;
  }
  assert.equal(reunited, true);
});

test('former-campus affiliation is retained in a concise bilingual label', () => {
  const s = moved();
  const school = schools.find(x => x.id === s.peers[0].schoolId).name;
  assert.equal(peerAffiliation(s, s.peers[0]), `${school} · Remote`);
  try {
    setAppLanguage('zh');
    assert.match(peerAffiliation(s, s.peers[0]), /异地联系/);
  } finally { setAppLanguage('en'); }
});
