// The second organisation chart.
//
// Contacts are named people with a regard that decays, a clout that decides what they are worth,
// and — if you ask for one — a collaboration task with a due month that competes with your own
// project for the same finite turn. That competition is the point of the system.
import {
  contactKinds, metWhere, talkLines, collabAsks, collabDone, collabMissed,
  fadeLines, rekindleLines, letterAsk, introLines, REGARD_FADE, REGARD_DECAY, NETWORK_MAX,
} from '../data/network.js';
import { firstNames, surnames, companies } from '../data/names.js';
import { schools } from '../data/catalog.js';
import { t } from '../i18n/index.js';
import { random, roll, clamp, pick } from './probability.js';
import { effects, log, message, award, activeProject, lastName, firstName, fill } from './state.js';

export const ensureNetwork = s => (s.contacts = s.contacts || []);
export const activeContacts = s => ensureNetwork(s).filter(c => c.status === 'active');
export const contactById = (s, id) => ensureNetwork(s).find(c => c.id === id);
export const openTasks = s => activeContacts(s).flatMap(c => (c.task ? [{ ...c.task, contactId: c.id, name: c.name }] : []));

// A name nobody else in the run has, so a contact is never confusable with a labmate.
function freshName(s) {
  const used = new Set([
    ...(s.labmates || []).map(x => x.name), ...(s.peers || []).map(x => x.name),
    ...ensureNetwork(s).map(x => x.name), s.advisor?.name, s.player?.name,
  ].filter(Boolean).map(n => String(n).split(' ')[0]));
  for (let i = 0; i < 40; i++) {
    const first = pick(s, firstNames);
    if (used.has(first)) continue;
    return `${first} ${pick(s, surnames)}`;
  }
  return `${pick(s, firstNames)} ${pick(s, surnames)}`;
}

// Where they work. A professor is at a fictional school; industry people are at fictional companies.
function orgFor(s, kind) {
  if (kind === 'researcher') return pick(s, companies);
  const other = schools.filter(x => x.id !== s.program?.id);
  return pick(s, other.length ? other : schools).name;
}

// Someone new. Returns the contact, or null if you already know as many people as you can hold.
export function meetContact(s, { kind, where = 'conference', venue = '', regard = null } = {}) {
  ensureNetwork(s);
  if (activeContacts(s).length >= NETWORK_MAX) return null;
  const k = contactKinds[kind] ? kind : pick(s, ['prof', 'postdoc', 'researcher', 'student']);
  const def = contactKinds[k];
  const w = metWhere[where] || metWhere.conference;
  const [lo, hi] = w.regard;
  const c = {
    id: `net-${s.contacts.length}-${s.month}`,
    name: freshName(s), kind: k, org: orgFor(s, k),
    where, venue, met: s.month, lastContact: s.month,
    regard: regard ?? clamp(lo + random(s) * (hi - lo)),
    clout: clamp(def.clout[0] + random(s) * (def.clout[1] - def.clout[0])),
    warmth: clamp(30 + random(s) * 55),
    topic: s.player.profile.topic,
    status: 'active', task: null, done: 0, missed: 0, letter: null, talks: 0,
  };
  s.contacts.push(c);
  if (activeContacts(s).length >= 5) award(s, 'rolodex');
  return c;
}

const displayName = c => (c.kind === 'prof' ? `Prof. ${lastName(c.name)}` : c.name);
export const contactLabel = c => displayName(c);

// Monthly: regard drifts down without contact, and people stop replying rather than announcing it.
export function networkMonth(s) {
  ensureNetwork(s);
  for (const c of s.contacts) {
    if (c.status !== 'active') {
      // Someone who faded can come back, if they liked you and you were not the problem.
      if (c.status === 'faded' && c.regard > 26 && roll(s, .06)) {
        c.status = 'active'; c.regard = clamp(c.regard + 8); c.lastContact = s.month;
        log(s, fill(s, t(pick(s, rekindleLines))).replace('{name}', displayName(c)));
      }
      continue;
    }
    const quiet = s.month - c.lastContact;
    if (quiet >= 2) c.regard = clamp(c.regard - REGARD_DECAY * (1 - c.warmth / 220));
    if (c.regard <= REGARD_FADE) {
      c.status = 'faded';
      award(s, 'letoneGo');
      log(s, fill(s, t(pick(s, fadeLines))).replace('{name}', displayName(c)));
      continue;
    }
    // A task that came due.
    if (c.task && s.month > c.task.due) {
      c.missed++;
      c.regard = clamp(c.regard - ({ small: 10, real: 20, huge: 32 }[c.task.size] || 12));
      log(s, t(collabMissed[c.task.size] || collabMissed.small));
      effects(s, { hope: -3, stress: 4 });
      c.task = null;
    }
  }
}

// A short conversation. The cheap move the whole system runs on.
export function netTalk(s, id) {
  const c = contactById(s, id);
  if (!c || c.status !== 'active') throw new Error(t('They are not replying at the moment.'));
  if (c.lastTalk === s.month) throw new Error(t('You spoke this month. Twice would be a lot.'));
  if (s.player.stats.energy < 3) throw new Error(t('Not enough Energy.'));
  c.lastTalk = s.month; c.lastContact = s.month; c.talks++;
  // Talking is how you keep a relationship alive, not how you build one. Above about sixty it
  // barely moves; getting further than that takes doing something for them.
  const room = Math.max(.18, 1 - Math.max(0, c.regard - 40) / 45);
  c.regard = clamp(c.regard + (4 + (c.warmth > 60 ? 1.5 : 0)) * room);
  // Talking buys regard and nothing else. The value of knowing someone is what it unlocks — a
  // letter, a collaboration, an introduction — not a drip of capital for clicking on them monthly.
  effects(s, { energy: -3, ...(roll(s, .3) ? { hope: 1 } : {}) });
  const line = t(pick(s, talkLines[c.kind] || talkLines.student));
  log(s, `${displayName(c)}: ${line}`);
  if (c.talks >= 6) award(s, 'keptintouch');
  return line;
}

// What they will let you ask for, given where you stand with them.
export function collabOptions(s, id) {
  const c = contactById(s, id);
  if (!c || c.status !== 'active' || c.task || openTasks(s).length) return [];
  return Object.values(collabAsks).map(a => {
    const bar = { small: 30, real: 52, huge: 76 }[a.id];
    return { ...a, blocked: c.regard < bar ? t('They would not say yes to that yet.') : null };
  });
}

export function netCollab(s, id, size) {
  const c = contactById(s, id);
  const ask = collabAsks[size];
  if (!c || c.status !== 'active') throw new Error(t('They are not replying at the moment.'));
  if (c.task) throw new Error(t('You already owe them something.'));
  const owed = openTasks(s)[0];
  if (owed) throw new Error(t('You already owe {who} something. One at a time.', { who: owed.name }));
  if (!ask) throw new Error(t('That is not one of the options.'));
  const bar = { small: 30, real: 52, huge: 76 }[size];
  if (c.regard < bar) throw new Error(t('They would not say yes to that yet.'));
  c.task = { size, text: pick(s, ask.tasks), due: s.month + ask.weeks, started: s.month };
  c.lastContact = s.month;
  effects(s, { hope: 3 });
  log(s, t('{who} takes you up on it: “{task}” Due in {n} month(s), which is their deadline and not yours.', { who: displayName(c), task: t(c.task.text), n: ask.weeks }));
  return c.task;
}

// Doing the work. This is where their project competes with yours for the same month.
export function doCollab(s, id) {
  const c = contactById(s, id);
  if (!c || !c.task) throw new Error(t('There is nothing owed.'));
  const ask = collabAsks[c.task.size];
  if (s.player.stats.energy < -ask.cost.energy) throw new Error(t('Not enough Energy.'));
  const p = activeProject(s);
  // effects() already routes progress/draft/evidence to the active project, so the cost of their
  // work coming out of yours is applied exactly once, here.
  effects(s, ask.cost);
  const { regard, ...rest } = ask.reward;
  c.regard = clamp(c.regard + regard);
  c.lastContact = s.month;
  c.done++;
  effects(s, rest);
  log(s, `${displayName(c)}: ${t(collabDone[c.task.size])}`);
  // The big one occasionally turns into a real line on the record.
  if (c.task.size === 'huge') {
    s.counts.collabPapers = (s.counts.collabPapers || 0) + 1;
    s.pendingCites = [...(s.pendingCites || []), { projectId: p?.id, n: 2 + Math.round(c.clout / 25), from: 'collaboration', due: s.month + 3 }];
    award(s, 'themonth');
  }
  c.task = null;
  if (c.done >= 3) award(s, 'thesecondchart');
  return c;
}

// Professors only, and their regard is the gate. A lukewarm yes is the classic way to be hurt.
export function askNetLetter(s, id) {
  const c = contactById(s, id);
  if (!c || c.status !== 'active') throw new Error(t('They are not replying at the moment.'));
  if (!contactKinds[c.kind].letters) throw new Error(t('They are not in a position to write one.'));
  if (c.letter) throw new Error(t('You have already asked them.'));
  c.lastContact = s.month;
  const strong = c.regard > 62 && (c.done > 0 || c.talks >= 3);
  const outcome = strong ? 'yes' : c.regard > 42 ? 'lukewarm' : 'no';
  c.letter = outcome;
  log(s, `${displayName(c)}: ${t(letterAsk[outcome])}`);
  if (outcome === 'no') { c.regard = clamp(c.regard + 4); award(s, 'saidno'); }   // honesty is a kindness
  return outcome;
}

// Ask them to introduce you to someone. Spends their credit, not yours, so it needs real regard.
export function netIntro(s, id) {
  const c = contactById(s, id);
  if (!c || c.status !== 'active') throw new Error(t('They are not replying at the moment.'));
  if (s.player.stats.energy < 4) throw new Error(t('Not enough Energy.'));
  c.lastContact = s.month;
  effects(s, { energy: -4 });
  if (c.regard < 55 || !roll(s, clamp(.25 + (c.regard - 55) * .012 + c.warmth * .004, .1, .8))) {
    log(s, `${displayName(c)}: ${t(introLines.no)}`);
    return null;
  }
  const made = meetContact(s, { kind: c.kind === 'student' ? 'postdoc' : 'prof', where: 'intro', regard: clamp(34 + c.clout * .18) });
  if (!made) { log(s, `${displayName(c)}: ${t(introLines.no)}`); return null; }
  log(s, `${displayName(c)}: ${t(introLines.yes).replace('{who}', displayName(made))}`);
  effects(s, { academicCapital: 3, hope: 3 });
  award(s, 'introduced');
  return made;
}

// What the letters system can draw on: a professor who said a real yes is a writer from outside
// the lab, which is worth more than one from inside it.
export const netWriters = s => activeContacts(s)
  .filter(c => c.letter === 'yes' || (contactKinds[c.kind].letters && c.regard > 62))
  .map(c => ({ id: `net-${c.id}`, name: displayName(c), clout: c.clout, lukewarm: c.letter === 'lukewarm' }));
