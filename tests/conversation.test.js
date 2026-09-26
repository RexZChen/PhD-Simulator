import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, chat, chatBody, entryText } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { ask } from '../src/engine/advisor.js';
import { asks, askById } from '../src/data/asks.js';
import { advisorPresence, normalizeChatHistory, isConversationNote, isAutomaticReply } from '../src/engine/conversation.js';
import { react, replyTo, replyOptionsFor } from '../src/engine/slack.js';
import { emptyMeta, saveRun, loadSave } from '../src/engine/save.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { asksDialogueZh, askDraftCompatibilityZh } from '../src/i18n/zh/ask-dialogue.js';

function fixture() {
  let s = createRun(42);
  const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.event = null; s.stage = 'plan'; s.month = 16; s.week = 0;
  s.advisorMode = { id: 'normal' }; s.chatMessages = []; s.rng = 1;
  return s;
}
const memory = () => {
  const items = new Map();
  return { getItem: k => items.get(k) ?? null, setItem: (k, v) => items.set(k, v), removeItem: k => items.delete(k) };
};

test('a real two-message exchange cannot display the reply before the question', () => {
  const s = fixture();
  chat(s, 'advisor', s.player.name, 'Could we check in?', { mine: true });
  chat(s, 'advisor', s.advisor.name, 'I can reply now.');
  assert.equal(s.chatMessages[0].month, s.chatMessages[1].month);
  assert.ok(s.chatMessages[1].time > s.chatMessages[0].time);
  assert.equal(s.chatMessages[1].senderId, s.advisor.id);
});

test('supported saved histories repair backwards clocks once without RNG or content changes', () => {
  const s = fixture(), storage = memory();
  const index = asks.findIndex(a => a.id === 'update');
  chat(s, 'advisor', s.player.name, 'An old question', { mine: true });
  chat(s, 'advisor', s.advisor.name, 'An old narrative', { i18n: { p: `asks.${index}.success.text.0` } });
  chat(s, 'general', s.labmates[0].name, 'A separate channel');
  s.chatMessages[0].time = '18:20'; s.chatMessages[1].time = '08:05'; s.chatMessages[2].time = '09:00';
  const rng = s.rng, original = structuredClone(s.chatMessages);
  assert.equal(saveRun(storage, s, emptyMeta()).error, null);
  const loaded = loadSave(storage); assert.equal(loaded.error, null); assert.ok(loaded.run);
  assert.deepEqual(loaded.run.chatMessages.map(m => m.time), ['18:20', '18:21', '18:22']);
  assert.equal(loaded.run.rng, rng);
  assert.deepEqual(loaded.run.chatMessages.map(({ time, ...m }) => m), original.map(({ time, ...m }) => m));
  assert.equal(isConversationNote(loaded.run.chatMessages[1]), true);
  const repaired = structuredClone(loaded.run.chatMessages);
  normalizeChatHistory(loaded.run); assert.deepEqual(loaded.run.chatMessages, repaired);
  saveRun(storage, loaded.run, loaded.meta);
  assert.deepEqual(loadSave(storage).run.chatMessages, repaired);
});

for (const lang of ['en', 'zh']) {
  test(`advisor ask writes direct speech to chat and narrative to history in ${lang}`, () => {
    setAppLanguage(lang);
    try {
      const s = fixture();
      const result = ask(s, 'update');
      assert.equal(result.success, true); assert.equal(result.silent, false);
      const m = s.chatMessages.at(-1), branch = askById.update.success;
      const index = branch.reply.indexOf(m.body);
      assert.ok(index >= 0); assert.equal(m.senderId, s.advisor.id);
      if (lang === 'zh') {
        assert.match(m.body, /\p{Script=Han}/u);
        assert.equal(m.body, asksDialogueZh.update.success.reply[index]);
        assert.equal(s.chatMessages[0].body, asksDialogueZh.update.draft);
        assert.match(s.chatMessages[0].body, /\p{Script=Han}/u);
      }
      assert.equal(isConversationNote(m), false);
      assert.notEqual(m.body, branch.text[index]);
      assert.ok(entryText(s, s.history.at(-1)).includes(branch.text[index]));
      const expectedOther = lang === 'en' ? 'zh' : 'en';
      setAppLanguage(expectedOther);
      assert.equal(chatBody(s, m), askById.update.success.reply[index]);
    } finally { setAppLanguage('en'); }
  });
}

test('checked-out update is delivered and earns its effects without a human acknowledgment', () => {
  const s = fixture(); s.advisorMode.id = 'checkedOut';
  const before = structuredClone(s.relationship), energy = s.player.stats.energy;
  const result = ask(s, 'update');
  assert.equal(result.success, true); assert.equal(result.silent, true);
  assert.equal(s.chatMessages[0].mine, true);
  assert.equal(s.relationship.trust, before.trust + 3);
  assert.equal(s.player.stats.energy, energy - 2);
  assert.equal(s.chatMessages.filter(m => !m.mine && !isConversationNote(m) && !isAutomaticReply(m)).length, 0);
  assert.equal(advisorPresence(s), 'No recent message recorded');
});

test('every Chinese advisor draft and reply is translated against the independent dictionary', () => {
  const englishDrafts = Object.fromEntries(asks.map(a => [a.id, a.draft]));
  setAppLanguage('zh');
  try {
    for (const a of asks) {
      const z = asksDialogueZh[a.id];
      assert.match(a.draft, /\p{Script=Han}/u, `${a.id}.draft`);
      assert.equal(a.draft, z.draft, `${a.id}.draft dictionary`);
      assert.equal(askDraftCompatibilityZh[englishDrafts[a.id]], z.draft);
      for (const branch of ['success', 'failure']) {
        if (!a[branch]) continue;
        assert.deepEqual(a[branch].reply, z[branch].reply, `${a.id}.${branch}.reply dictionary`);
        if (a[branch].reply === null) continue;
        assert.equal(a[branch].reply.length, a[branch].text.length);
        for (const reply of a[branch].reply) assert.match(reply, /\p{Script=Han}/u, `${a.id}.${branch}`);
      }
    }
    const oldDraft = 'I have not heard from you in a few weeks and I would rather ask than guess. Is everything all right on your end?';
    assert.match(askDraftCompatibilityZh[oldDraft], /\p{Script=Han}/u);
  } finally { setAppLanguage('en'); }
});

test('conversation notes and automatic responses reject reactions and all reply routes', () => {
  const s = fixture();
  for (const [body, extra] of [
    ['Narrative only', { kind: 'conversation-note' }],
    ['Away', { kind: 'automatic-reply' }],
    ['(no reply)', {}],
    ['Auto-reply: I am currently away with limited access to email.', {}],
  ]) {
    chat(s, 'advisor', s.advisor.name, body, { ...extra, allowedReplyIds: ['crisis_ack'] });
    const m = s.chatMessages.at(-1), before = structuredClone(s);
    assert.deepEqual(replyOptionsFor(s, m), []);
    assert.throws(() => react(s, m.id, 'heart'), /conversation note/);
    assert.throws(() => replyTo(s, m.id, 'crisis_ack'), /not something/);
    assert.deepEqual(s, before);
  }
});

test('an advisor declining a job does not invite generic celebration or an offer of help', () => {
  const s = fixture(); s.month = 55; s.advisor.funding = 0;
  const result = ask(s, 'postdoc_here');
  assert.equal(result.success, false);
  const message = s.chatMessages.at(-1);
  assert.match(message.body, /cannot offer you a position/);
  assert.deepEqual(replyOptionsFor(s, message), []);
  const before = structuredClone(s);
  assert.throws(() => replyTo(s, message.id, 'boast'), /not something/);
  assert.deepEqual(s, before);
});

test('advisor recency comes from a real current advisor message, ignoring notes, auto and former identity', () => {
  const s = fixture(); s.month = 15; s.week = 3;
  chat(s, 'advisor', s.advisor.name, 'A real reply');
  s.month = 16; s.week = 1;
  chat(s, 'advisor', s.advisor.name, 'A note', { kind: 'conversation-note' });
  chat(s, 'advisor', s.advisor.name, 'Away', { kind: 'automatic-reply' });
  chat(s, 'advisor', s.advisor.name, 'Same name, former person', { senderId: 'former-advisor' });
  chat(s, 'advisor', s.player.name, 'A new question', { mine: true });
  assert.equal(advisorPresence(s), 'Last message 2 weeks ago');
  s.advisor.id = 'replacement'; s.advisor.name = 'New Advisor';
  assert.equal(advisorPresence(s), 'No recent message recorded');
  chat(s, 'advisor', s.advisor.name, 'Here now');
  assert.equal(advisorPresence(s), 'Message received this turn');
});

test('finishing the run keeps same-month conversation chronology and advisor recency', () => {
  const s = fixture();
  chat(s, 'advisor', s.advisor.name, 'We can discuss the next step.');
  s.chatMessages.at(-1).time = '22:30';
  s.phase = 'ending';
  assert.equal(advisorPresence(s), 'Message received this turn');
  chat(s, 'advisor', s.player.name, 'Thank you for the discussion.', { mine: true });
  assert.ok(s.chatMessages.at(-1).time > s.chatMessages[0].time);
  assert.equal(advisorPresence(s), 'Message received this turn');
  // Loading an older ending must use the same repair period as the preceding play.
  s.chatMessages.at(-1).time = '08:05';
  normalizeChatHistory(s);
  assert.equal(s.chatMessages.at(-1).time, '22:31');
});

test('a saved reply before the first daily index still belongs to day zero', () => {
  const s = fixture(), storage = memory();
  s.tempo = 'day'; delete s.dayIndex;
  chat(s, 'advisor', s.advisor.name, 'Ready when you are.');
  delete s.chatMessages.at(-1).dayIndex;
  s.dayIndex = 0;
  assert.equal(saveRun(storage, s, emptyMeta()).error, null);
  const loaded = loadSave(storage).run;
  assert.ok(loaded);
  assert.equal(advisorPresence(loaded), 'Message received this turn');
  loaded.dayIndex = 1;
  assert.equal(advisorPresence(loaded), 'Last message this week');
  loaded.week = 1;
  assert.equal(advisorPresence(loaded), 'Last message 1 week ago');
});
