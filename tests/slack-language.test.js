import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, chat, chatBody, joined, vars } from '../src/engine/state.js';
import { replyOptionsFor, replyTo } from '../src/engine/slack.js';
import { repliesFor, reactions, replyKinds, dmOpeners, DM_NOTE } from '../src/data/slack.js';
import { labLines } from '../src/data/chatter.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { t, readSource, getLanguage } from '../src/i18n/index.js';
import { saveRun, loadSave, emptyMeta } from '../src/engine/save.js';

const ids = (s, m) => replyOptionsFor(s, m).map(x => x.id);
test('every LabChat reaction, reply, DM and role has a Chinese translation', () => {
  const strings = [
    ...reactions.map(reaction => reaction.label),
    ...Object.values(replyKinds).flatMap(reply => [reply.label, ...reply.drafts, ...reply.replies]),
    ...Object.values(dmOpeners).flat().flatMap(opener => [opener.label, opener.draft, opener.reply]),
    ...Object.keys(dmOpeners), DM_NOTE,
  ];
  try {
    setAppLanguage('zh');
    for (const source of strings) {
      assert.notEqual(t(source), source, `Untranslated LabChat text: ${source}`);
      assert.match(t(source), /[\u3400-\u9fff]/, `Missing Chinese text: ${source}`);
    }
  } finally { setAppLanguage('en'); }
});
function run() {
  const s = createRun(4242);
  s.labmates.push({ id: 'lab-test', name: 'A Labmate', status: 'active', bond: 30 });
  return s;
}

test('Chinese-created catalog messages retain reply choices across language switches and saved reloads', () => {
  setAppLanguage('en');
  const source = labLines.any[5];
  const expected = repliesFor(source);
  assert.ok(expected.includes('help'));
  try {
    setAppLanguage('zh');
    const s = run();
    chat(s, 'general', 'A Labmate', labLines.any[5]);
    const m = s.chatMessages.at(-1);
    assert.match(m.body, /[\u3400-\u9fff]/);
    assert.ok(m.i18n.p);
    assert.equal(readSource(m.body, m.i18n), source);
    const data = new Map();
    const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
    assert.equal(saveRun(storage, s, emptyMeta()).error, null);
    const restored = loadSave(storage).run;
    assert.ok(restored);
    const message = restored.chatMessages.at(-1);
    for (const language of ['zh', 'en', 'zh']) {
      setAppLanguage(language);
      const before = JSON.stringify(restored);
      assert.deepEqual(ids(restored, message), expected);
      assert.equal(JSON.stringify(restored), before, 'categorization must not mutate saved state or RNG');
      assert.equal(getLanguage(), language);
    }
    const energy = restored.player.stats.energy;
    replyTo(restored, message.id, 'help');
    assert.equal(restored.player.stats.energy, energy - 4);
    assert.equal(message.repliedWith, 'help');
    assert.deepEqual(ids(restored, message), []);
    assert.throws(() => replyTo(restored, message.id, 'help'), /./);
    assert.deepEqual(ids(restored, { ...message, repliedWith: null, mine: true }), []);
  } finally { setAppLanguage('en'); }
});

test('literal, joined and substituted provenance categorizes source rather than display wording', () => {
  try {
    setAppLanguage('zh');
    const s = run();
    const welcome = 'Welcome {name}! The good printer is on the third floor. The good chair is mine.';
    chat(s, 'general', 'A Labmate', joined(t(welcome, { name: 'Student' }), ' ', vars(labLines.any[9], { venue: 'A Venue' })));
    const m = s.chatMessages.at(-1);
    assert.match(chatBody(s, m), /[\u3400-\u9fff]/);
    const expected = ids(s, m);
    assert.ok(expected.includes('joke'));
    setAppLanguage('en');
    assert.deepEqual(ids(s, m), expected);
    const nested = { s: '{line}', v: { line: { r: { s: 'the printer broke' } } }, x: { s: ' and i am tired' } };
    assert.equal(readSource('', nested), 'the printer broke and i am tired');
    assert.equal(readSource('', { j: [{ r: { s: '{thing}' } }, ' broke'], m: { thing: 'the cluster' }, x: { s: ' again' } }), 'the cluster broke again');
    assert.deepEqual(ids(s, { body: 'the printer broke' }), ['help', 'joke']);
    assert.deepEqual(ids(s, { body: 'No provenance and no invitation.' }), []);
    assert.deepEqual(ids(s, null), []);
  } finally { setAppLanguage('en'); }
});
