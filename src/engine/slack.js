// Being in the channel: reacting, answering one person rather than the room, and the DMs that
// are not with your advisor.
import { t } from '../i18n/index.js';
import { reactions, reactionById, replyKinds, replyKindById, repliesFor, dmOpeners, DM_NOTE } from '../data/slack.js';
import { random, roll, clamp, pick } from './probability.js';
import { effects, log, chat, award, chatBody, firstName, labmateById, joined } from './state.js';

export const REACT_COST = 0;

// React to one message. Free, quick, and the smallest real thing you can do for someone.
export function react(s, messageId, reactionId) {
  const m = s.chatMessages.find(x => x.id === messageId);
  const r = reactionById(reactionId);
  if (!m || !r) throw new Error(t('That message is gone.'));
  if (m.mine) throw new Error(t('Reacting to your own message is a choice, and not one this game supports.'));
  m.reacts = m.reacts || [];
  if (m.reacts.some(x => x.id === reactionId && x.mine)) {
    m.reacts = m.reacts.filter(x => !(x.id === reactionId && x.mine));
    return { removed: true };
  }
  m.reacts.push({ id: reactionId, mine: true });
  const who = s.labmates.find(l => l.name === m.sender) || s.peers.find(p => p.name === m.sender);
  const key = m.channel === 'cohort' ? 'peerBond' : 'labBond';
  const { labBond, ...rest } = r.effects;
  effects(s, { ...rest, ...(labBond ? { [key]: labBond } : {}) });
  if (r.personality) s.player.personality[r.personality]++;
  // Sometimes someone piles on, which is the whole social physics of a channel.
  if (roll(s, .35)) {
    const others = [...s.labmates, ...s.peers].filter(x => x.name !== m.sender);
    if (others.length) m.reacts.push({ id: reactionId, by: firstName(pick(s, others).name) });
  }
  s.counts.reactions = (s.counts.reactions || 0) + 1;
  if (s.counts.reactions === 25) award(s, 'reactor');
  return { added: true, who: who?.name };
}

// Answer one person. Most messages invite nothing; the ones that do are worth the energy.
export const replyOptionsFor = (s, m) => (m && !m.mine && !m.repliedWith)
  ? repliesFor(chatBody(s, m)).map(id => replyKinds[id]).filter(Boolean) : [];

export function replyTo(s, messageId, kindId, composed = '') {
  const m = s.chatMessages.find(x => x.id === messageId);
  const kind = replyKindById(kindId);
  if (!m || !kind) throw new Error(t('There is nothing to answer there.'));
  if (m.repliedWith) throw new Error(t('You already answered that one.'));
  if (!replyOptionsFor(s, m).some(k => k.id === kindId)) throw new Error(t('That is not something that message invites.'));
  if (s.player.stats.energy < kind.energy) throw new Error(t('Not enough Energy.'));
  m.repliedWith = kindId;

  const key = m.channel === 'cohort' ? 'peerBond' : 'labBond';
  const { labBond, ...rest } = kind.effects;
  effects(s, { ...rest, ...(labBond ? { [key]: labBond } : {}) });
  if (kind.personality) s.player.personality[kind.personality]++;
  chat(s, m.channel, s.player.name, composed || t(pick(s, kind.drafts)), { mine: true, replyTo: m.id });
  const back = t(pick(s, kind.replies));
  chat(s, m.channel, m.sender, back);
  return { line: back };
}

// ── Direct messages with people who are not your advisor ──────────────────────
export const dmChannel = id => `dm:${id}`;
export const dmPeople = s => [...(s.labmates || []), ...(s.peers || [])]
  .filter(p => p.status === 'active' && (dmOpeners[p.role] || dmOpeners[p.fate ? 'peer' : 'peer']))
  .map(p => ({ ...p, channel: dmChannel(p.id), kind: dmOpeners[p.role] ? p.role : 'peer' }));

export function dmOptions(s, personId) {
  const who = labmateById(s, personId);
  if (!who) return [];
  const kind = dmOpeners[who.role] ? who.role : 'peer';
  const used = s.dmUsed?.[personId] || [];
  return (dmOpeners[kind] || []).map(o => ({ ...o, done: used.includes(o.id) }));
}

export function sendDm(s, personId, openerId, composed = '') {
  const who = labmateById(s, personId);
  if (!who) throw new Error(t('You cannot message them.'));
  const opts = dmOptions(s, personId);
  const o = opts.find(x => x.id === openerId);
  if (!o) throw new Error(t('That is not something you would ask them.'));
  if (o.done) throw new Error(t('You have already asked them that.'));
  if (s.player.stats.energy < o.energy) throw new Error(t('Not enough Energy.'));
  s.dmUsed = s.dmUsed || {};
  s.dmUsed[personId] = [...(s.dmUsed[personId] || []), openerId];

  effects(s, { energy: -o.energy });
  const key = s.peers.some(p => p.id === personId) ? 'peerBond' : 'labBond';
  const { labBond, peerBond, ...rest } = o.effects;
  effects(s, { ...rest, ...((labBond || peerBond) ? { [key]: labBond || peerBond } : {}) });
  const ch = dmChannel(personId);
  chat(s, ch, s.player.name, composed || t(o.draft), { mine: true });
  chat(s, ch, who.name, t(o.reply));
  if (!s.flags.firstDm) { s.flags.firstDm = true; log(s, t(DM_NOTE)); award(s, 'sidebar'); }
  return { reply: t(o.reply) };
}
