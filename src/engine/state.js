import { backgrounds, skillNames, advisorArchetypes, traitNames, stageWeights, schools, mutators, personalityTitles, topics } from '../data/catalog.js';
import { priorTitles, priorVenues } from '../data/priorwork.js';
import { t, provenanceOf, rememberSource, readSlot } from '../i18n/index.js';
import { firstNames, surnames, labmateRoles, labmateTraits, companies } from '../data/names.js';
import { dateLabel as calendarLabel, phdYear } from '../data/calendar.js';
import { venueById } from '../data/venues.js';
import { random, pick, jitter, clamp, shuffle, pickWeighted } from './probability.js';

export const VERSION = 3;
export const WEEKS = 4;
export const TOTAL_MONTHS = 72;

// The application season predates the month counter, so its four stages have fixed labels.
export function phaseLabel(phase) {
  if (phase === 'prep') return t('October 2027');
  if (phase === 'application') return t('December 2027');
  if (phase === 'interviews') return t('February 2028');
  if (phase === 'admissions') return t('April 2028');
  return '';
}
export function dateLabel(s) {
  if (s.phase === 'admissions' || s.ending?.id === 'no_offer') return t('April 2028');
  return phaseLabel(s.phase) || calendarLabel(s.month);
}
export const absWeek = s => s.month * WEEKS + s.week;
// Date for a stored log/mail/chat entry, resolved in whatever language is active now.
export function entryDate(e) {
  if (!e) return '';
  if (e.phase && e.phase !== 'playing' && e.phase !== 'ending') return phaseLabel(e.phase);
  return calendarLabel(e.month || 0);
}
export const yearOf = s => phdYear(s.month);

// Unique on the FIRST name, not just the full name: the lab list, the DM rail and most dialogue
// use first names only, so two people called Tobiah is two people you cannot tell apart.
function personName(s, used) {
  const takenFirst = new Set([...used].map(n => n.split(' ')[0]));
  for (let i = 0; i < 30; i++) {
    const first = pick(s, firstNames);
    if (takenFirst.has(first)) continue;
    const name = `${first} ${pick(s, surnames)}`;
    if (!used.has(name)) { used.add(name); return name; }
  }
  for (let i = 0; i < 20; i++) {
    const name = `${pick(s, firstNames)} ${pick(s, surnames)}`;
    if (!used.has(name)) { used.add(name); return name; }
  }
  return `${pick(s, firstNames)} ${pick(s, surnames)}`;
}
export const lastName = name => name.split(' ').at(-1);
export const firstName = name => name.split(' ')[0];

function advisorHints(s, a) {
  const truths = [];
  truths.push(a.caring > 60 ? 'They asked about my family before they asked about my results.' : a.caring < 40 ? 'They asked about my results. Only my results.' : 'They are fine. Fine is underrated.');
  truths.push(a.toxicity > 55 ? 'Ask what happened to the student before you. Then ask again.' : a.toxicity < 25 ? 'I have never seen them raise their voice. Or their eyebrows.' : 'They have moods. Learn the calendar.');
  truths.push(a.management > 65 ? 'Every meeting ends with a written list. Every list ends with a deadline.' : a.management < 35 ? 'Write everything down. They will not.' : 'Meetings have an agenda about half the time.');
  truths.push(a.availability > 65 ? 'Replies within the hour. Sometimes within the minute, which is worse.' : a.availability < 35 ? 'Book a meeting a month out. Then confirm it twice.' : 'Reachable, if you know which app they are in this month.');
  const misleading = ['Best mentor I have ever had.', 'You need to be very independent.', 'The lab moves extremely fast.', 'Run.', 'Honestly? It depends on the year.'];
  const chosen = shuffle(s, truths).slice(0, 3);
  if (random(s) < .3) chosen[Math.floor(random(s) * 3)] = pick(s, misleading);
  return chosen;
}

function makeAdvisors(s) {
  const used = new Set();
  return schools.flatMap(school => [0, 1].map(n => {
    const weights = advisorArchetypes.map(a => ({ star: 1, ghost: school.prestige > 85 ? 1.4 : .6, parent: school.prestige > 90 ? .6 : 1.2, empire: school.prestige > 80 ? 1.3 : .7, chaos: 1, warlord: school.prestige > 85 ? 1.2 : .8 }[a.id]));
    const archetype = pickWeighted(s, advisorArchetypes, (_, i) => weights[i]);
    const labSize = { star: [5, 12], ghost: [8, 18], parent: [3, 8], empire: [15, 30], chaos: [3, 9], warlord: [8, 16] }[archetype.id];
    const a = {
      id: `${school.id}-${n}`, schoolId: school.id, name: personName(s, used), archetype: archetype.id, topic: school.topics[n] || school.topics[0],
      comment: pick(s, archetype.comments), labSize: labSize[0] + Math.floor(random(s) * (labSize[1] - labSize[0] + 1)),
      ...Object.fromEntries(traitNames.map((t, j) => [t, jitter(s, archetype.traits[j])])),
      // Their own clock, so the pressure standing behind them is a property of every run.
      stage: pickWeighted(s, Object.keys(stageWeights[archetype.id] || stageWeights.parent), k => (stageWeights[archetype.id] || stageWeights.parent)[k]) || 'mid_career',
      fellowship: random(s) < .1, hints: [], revealed: 0,
    };
    a.hints = advisorHints(s, a);
    return a;
  }));
}

export function createRun(seed = Date.now() >>> 0, answers = {}) {
  const s = {
    version: VERSION, seed: seed >>> 0, rng: seed >>> 0, phase: 'prep', month: 0, week: 0, stage: 'plan', tempo: 'month',
    focus: null, actions: {}, typed: 0, applications: [], offers: [], advisors: [], program: null, advisor: null,
    labmates: [], peers: [], projects: [], activeProjectId: null, requests: [], askCooldowns: {}, pressure: 20,
    flags: {}, scheduled: [], cooldowns: {}, seen: {}, persistedSeen: {}, event: null, eventActor: null, eventReturn: null, eventQueue: [],
    history: [], inbox: [], chatMessages: [], achievements: [],
    coursework: 0, readiness: 0, career: 0, burnoutMonths: 0, exhaustedMonths: 0, leaveWeeks: 0,
    relationship: { trust: 50, satisfaction: 60, dependency: 10, conflict: 0 }, housing: { rentDelta: 0, commute: 0 },
    cadence: { oneOnOne: 'biweekly', group: 'weekly' }, meetingStats: { held: 0, cancelled: 0, presented: 0, skipped: 0 },
    ta: false, internship: null, mutators: [], report: null, weekLog: [], ending: null, pace: 'auto',
    // Month 20 is May of the second academic year, which is when a US CS prelim is actually sat:
    // two years of coursework, then the exam, in the window before everyone scatters for the
    // summer. It used to be 23, which is August — a month this game's own calendar labels "New
    // students arrive" and "Lease turnover", and in which no committee of four faculty has ever
    // sat for anybody's prelim. The other honest slot is November; May is the commoner one and it
    // gives the run back the three months that finishing actually needs.
    milestones: { prelim: null, prelimMonth: 20, prelimAttempts: 0, proposal: null, proposalMonth: 44, proposalAttempts: 0, defense: null, defenseMonth: null, defenseAttempts: 0, thesisStarted: false, graduated: false },
    jobs: { track: null, offers: [], chosen: null },
    counts: { accepted: 0, rejected: 0, deadlinesMade: 0, deadlinesMissed: 0, requestsDone: 0, requestsDeclined: 0, requestsExpired: 0, holidaysTaken: 0, preprints: 0, taSemesters: 0, internships: 0 },
    budget: 'normal', debt: 0, conditions: [], bills: [], lifeCooldowns: {}, spend: { care: 0, fees: 0, interest: 0, sent: 0 },
    caffeine: { day: 0, week: 0, month: 0, lastCrash: -99 }, meals: { skipped: 0, skippedMonth: 0 },
    standing: 60, warnings: 0, probation: null, quitPressure: 0, citations: {}, day: 0, dayPlan: null,
    notice: 'Your future is pending committee review.',
  };
  const background = backgrounds[answers.background] ? answers.background : pick(s, Object.keys(backgrounds));
  const base = backgrounds[background];
  const profile = {
    background,
    international: typeof answers.international === 'boolean' ? answers.international : random(s) > .5,
    topic: topics[answers.topic] ? answers.topic : pick(s, Object.keys(topics)),
    ambition: answers.ambition || pick(s, ['academic', 'industry', 'undecided']),
    style: answers.style || pick(s, ['independent', 'collaborative']),
    experience: answers.experience || pick(s, ['none', 'some', 'extensive']),
    publications: answers.publications || 'none',
    // Optional answers. `skip` (or absent) means the field gates nothing — the run is identical
    // except that a handful of conversations never come up.
    whyHere: answers.whyHere && answers.whyHere !== 'skip' ? answers.whyHere : null,
    household: answers.household && answers.household !== 'skip' ? answers.household : null,
    firstGen: answers.firstGen && answers.firstGen !== 'skip' ? answers.firstGen : null,
    fear: answers.fear && answers.fear !== 'skip' ? answers.fear : null,
    dealbreaker: answers.dealbreaker && answers.dealbreaker !== 'skip' ? answers.dealbreaker : null,
  };
  s.player = {
    name: String(answers.name || 'Alex Student').trim().slice(0, 40) || 'Alex Student',
    profile,
    stats: { hope: jitter(s, base.hope, 5), confidence: jitter(s, 60, 12), energy: base.energy, health: jitter(s, 84, 7), money: base.money + (answers.buffer === 'comfortable' ? 2000 : answers.buffer === 'tight' ? -1000 : 0), academicCapital: answers.publications === 'yes' ? 8 : 0 },
    hidden: { stress: 18, burnoutRisk: 0, loneliness: profile.international ? 34 : 22 },
    skills: Object.fromEntries(skillNames.map((name, i) => [name, jitter(s, base.skills[i], 6)])),
    personality: { grinder: 0, peoplePleaser: 0, perfectionist: 0, riskTaker: 0, networker: 0, cynic: 0, boundarySetter: 0, independent: 0 },
  };
  s.insurance = { premium: profile.international ? 165 : 118, deductible: 1500, deductibleLeft: 1500, coinsurance: .2, planYear: 0 };
  if (answers.strength && skillNames.includes(answers.strength)) s.player.skills[answers.strength] = clamp(s.player.skills[answers.strength] + 12);
  if (profile.experience === 'extensive') s.player.skills.research = clamp(s.player.skills.research + 8);
  if (profile.experience === 'none') s.player.skills.research = clamp(s.player.skills.research - 5);
  s.advisors = makeAdvisors(s);
  s.prep = null; s.threads = {};
  seedPriorWork(s);
  log(s, t('Created an applicant. An optimistic use of a form.'));
  return s;
}

// Called at enrollment: everything that depends on the chosen program and advisor.
// The paper you arrived with. See src/data/priorwork.js — the questionnaire asked and nothing
// read the answer, which made it a question about nothing.
export function seedPriorWork(s) {
  if (s.player.profile.publications !== 'yes') return;
  if (s.projects.some(p => p.id === 'prior-0')) return;      // already have it; enroll() calls this too
  const topic = s.player.profile.topic;
  const pool = priorTitles[topic] || priorTitles.ml;
  const title = pick(s, pool);
  const venue = pick(s, priorVenues);
  // Two to four years old on arrival, which is why it is the top of your profile for a while.
  const age = 24 + Math.floor(random(s) * 24);
  s.projects.push({
    id: 'prior-0', title, kind: 'prior', status: 'Accepted', prior: true,
    progress: 100, draft: 100, scope: 30, evidence: 55, writingQuality: 55, novelty: 40,
    reproducibility: 45, hype: 12, collaborators: [], startedMonth: -age,
    venueId: null, venue, priorVenue: venue,
    submissionHistory: [{ venueId: null, venue, month: -age, outcome: 'Accept', reviewers: [], quality: 52, diamonds: 2 }],
  });
  s.citations = s.citations || {};
  // It has been out for years, so it already has a few. Small numbers, honestly distributed.
  s.citations['prior-0'] = Math.floor(random(s) * 5) + (age > 40 ? 2 : 0);
}

export function populateLab(s) {
  const used = new Set([s.advisor.name]);
  const count = clamp(Math.round(s.advisor.labSize / 5), 2, 4);
  const roles = shuffle(s, ['postdoc', 'peer', 'phantom', 'peer']).slice(0, count - 1);
  const traits = shuffle(s, labmateTraits.map(t => t.id));
  s.labmates = ['senior', ...roles].map((role, i) => ({ id: `lab-${i}`, name: personName(s, used), role, trait: traits[i], bond: 30 + Math.floor(random(s) * 20), status: 'active' }));
  const others = shuffle(s, s.advisors.filter(a => a.schoolId === s.program.id && a.id !== s.advisor.id).concat(shuffle(s, advisorArchetypes).slice(0, 2).map(a => ({ name: personName(s, used), archetype: a.id }))));
  const fates = shuffle(s, ['thrive', 'struggle', 'leave']);
  s.peers = [0, 1, 2].map(i => ({ id: `peer-${i}`, name: personName(s, used), labOf: others[i]?.name || personName(s, used), archetype: others[i]?.archetype || pick(s, advisorArchetypes).id, fate: fates[i], bond: 35 + Math.floor(random(s) * 15), status: 'active' }));
  s.committee = [0, 1].map(() => `Prof. ${personName(s, used)}`).concat([`Prof. ${s.peers[0].labOf}`]);
  s.company = pick(s, companies);
  const eligible = mutators.filter(m => (!m.international || s.player.profile.international) && (!m.topics || m.topics.includes(s.player.profile.topic)) && (!m.archetypes || m.archetypes.includes(s.advisor.archetype)));
  const first = pickWeighted(s, eligible, m => m.weight);
  const second = pickWeighted(s, eligible.filter(m => m.id !== first.id && !(first.id === 'tenure' && m.id === 'sabbatical') && !(first.id === 'sabbatical' && m.id === 'tenure')), m => m.weight);
  s.mutators = [first.id, second?.id].filter(Boolean);
  if (s.mutators.includes('rentspike')) s.housing.rentDelta += Math.round(s.program.rent * .08);
  if (s.mutators.includes('tenure')) s.advisor.ambition = clamp(s.advisor.ambition + 10);
  s.cadence = cadenceFor(s.advisor);
  s.ta = true;                       // year one teaches; see the note in game.js
}

export function cadenceFor(a) {
  const steps = ['whenever', 'monthly', 'biweekly', 'weekly'];
  let i = a.availability >= 70 ? 3 : a.availability >= 45 ? 2 : a.availability >= 25 ? 1 : 0;
  if (a.ambition > 75) i = Math.min(3, i + 1);
  if (a.labSize > 14) i = Math.max(0, i - 1);
  const group = a.labSize < 4 ? 'biweekly' : a.availability < 25 && a.labSize < 8 ? 'monthly' : 'weekly';
  return { oneOnOne: steps[i], group };
}
export const meetingsPerMonth = cadence => ({ weekly: 4, biweekly: 2, monthly: 1, whenever: 0 }[cadence] ?? 0);

export const activeProject = s => s.projects.find(p => p.id === s.activeProjectId) || null;
export const editable = p => p && !['Submitted', 'Rebuttal', 'Accepted', 'Abandoned', 'Advisor Review'].includes(p.status);
// Who is actually still in the lab.
//
// `status` was only ever 'active' until somebody could be pushed out, so about half the read paths
// never filtered on it — and the result was that the person who had just been made to leave was the
// only name in the #general sidebar, with a live green dot next to it. Everything that means "the
// people in this lab, now" goes through here.
export const activeLabmates = s => (s.labmates || []).filter(l => l.status === 'active');
export const labmateById = (s, id) => s.labmates.find(l => l.id === id) || s.peers.find(p => p.id === id) || null;

// `routine` marks per-turn bookkeeping lines so the ending transcript can drop them
// without pattern-matching English prose.
// Text stored in the run keeps a note of what produced it, so it can be re-translated
// when the language changes rather than freezing in the language it was written in.
// `src()` returns null for anything assembled by hand — those entries keep their text.
const src = text => provenanceOf(text);
// Substitute {tokens} into a catalog line while keeping the reference, so the line can be
// re-read in another language and re-substituted rather than freezing.
// Concatenating two translated strings produces a third that no catalog knows, so the result
// would freeze in whatever language it was built in. Join through here instead: each piece keeps
// its own provenance and the line is rebuilt, in order, on a language switch.
export function joined(...parts) {
  const out = parts.join('');
  const j = parts.map(p => { const pv = typeof p === 'string' ? provenanceOf(p) : null; return pv ? { r: pv } : String(p); });
  if (j.some(x => x && x.r)) rememberSource(out, { j });
  return out;
}
export function vars(text, map) {
  let out = text;
  for (const [k, v] of Object.entries(map)) out = out.split(`{${k}}`).join(String(v));
  if (out !== text) {
    const p = provenanceOf(text);
    if (p) {
      const m = Object.fromEntries(Object.entries(map).map(([k, v]) => {
        const inner = typeof v === 'string' ? provenanceOf(v) : null;
        return [k, inner ? { r: inner } : v];
      }));
      rememberSource(out, { ...p, m });
    }
  }
  return out;
}
// Event and meeting scenes live in catalogs that are translated by id, so the log line a
// choice produced is rebuilt from its ids rather than stored as prose. events.js installs
// the lookup at load time to avoid an import cycle.
let templateLookup = null;
export const setTemplateLookup = fn => { templateLookup = fn; };

// Read a stored field back in the language that is active now. `meta` is one of:
//   { s, v }      a t() source and its variables
//   { p }         a slot in a catalog that is translated in place
//   { ev, ch, r } an event id, a choice id, and which result line was shown
// plus an optional `f` flag meaning the text was passed through fill().
export function say(s, text, meta) {
  if (!meta) return text ?? '';
  let out = null;
  if (meta.ev && templateLookup) {
    const e = templateLookup(meta.ev);
    const c = e && e.choices.find(x => x.id === meta.ch);
    if (e && c) {
      // A plain `result` has no provenance of its own — it never passes through t() — so it is
      // marked at write time and read off the (translated) choice here. Without this branch the
      // outcome sentence of every non-check choice was dropped from the report, the timeline and
      // the field notes, in English as well as Chinese.
      const tail = meta.r === 'success' ? c.successText : meta.r === 'failure' ? c.failureText
        : meta.r === 'result' ? c.result : say(s, '', meta.rt) || '';
      return t('{title} — {choice}. {result}', { title: fill(s, e.title), choice: fill(s, c.text), result: fill(s, tail || '') }).trim();
    }
  }
  // A line built by concatenating translated pieces: rebuild it piece by piece.
  if (meta.j) return meta.j.map(x => (x && x.r) ? say(s, '', x.r) : String(x)).join('');
  if (meta.d !== undefined) return calendarLabel(meta.d);
  if (meta.s) out = t(meta.s, meta.v ? Object.fromEntries(Object.entries(meta.v).map(([k, v]) => [k, v && v.r ? say(s, '', v.r) : v])) : undefined);
  else if (meta.p) out = readSlot(meta.p);
  if (out === null || out === undefined) return text ?? '';
  if (meta.f) out = fill(s, out);
  if (meta.m) for (const [k, v] of Object.entries(meta.m)) out = out.split(`{${k}}`).join(String(v && v.r ? say(s, '', v.r) : v));
  if (meta.x) out += say(s, '', meta.x);   // a translated suffix appended at build time
  return out;
}
export const requestText = (s, r) => say(s, r?.text, r?.i18n);
export const entryText = (s, e) => say(s, e?.text, e?.i18n);
export const mailSubject = (s, m) => say(s, m?.subject, m?.i18nSubject);
export const mailBody = (s, m) => say(s, m?.body, m?.i18nBody);
export const mailSender = (s, m) => say(s, m?.sender, m?.i18nSender);
export const chatBody = (s, m) => say(s, m?.body, m?.i18n);
export const noticeText = s => say(s, s?.notice, s?.noticeI18n);

export function log(s, text, routine = false, ref = null) {
  const i18n = ref || src(text);
  s.history.push({ month: s.month, week: s.week, phase: s.phase, text, routine, ...(i18n ? { i18n } : {}) });
  s.notice = text;
  s.noticeI18n = i18n || null;
}
export function message(s, sender, subject, body, action = null, folder = 'inbox', kind = null) {
  const i18nSender = src(sender), i18nSubject = src(subject), i18nBody = src(body);
  s.inbox.unshift({ id: `mail-${s.inbox.length}-${absWeek(s)}`, month: s.month, phase: s.phase, sender, subject, body, action, read: false, folder, kind, replied: null,
    ...(i18nSender ? { i18nSender } : {}), ...(i18nSubject ? { i18nSubject } : {}), ...(i18nBody ? { i18nBody } : {}) });
}
// A mail the player wrote. Lands in Sent and is never unread.
export function sentMail(s, to, subject, body) {
  const i18nSender = src(to), i18nSubject = src(subject), i18nBody = src(body);
  s.inbox.unshift({ id: `sent-${s.inbox.length}-${absWeek(s)}`, month: s.month, phase: s.phase, sender: to, subject, body, action: null, read: true, folder: 'sent', kind: null, replied: null, mine: true,
    ...(i18nSender ? { i18nSender } : {}), ...(i18nSubject ? { i18nSubject } : {}), ...(i18nBody ? { i18nBody } : {}) });
}
// A mail the player wrote and did not send.
//
// Everybody has this folder. The messages in it are the ones that mattered most and cost the most
// to write, and they are all one keystroke from having been sent, and none of them was. It is
// never unread, because you have read it many times.
export function draftMail(s, to, subject, body) {
  const i18nSender = src(to), i18nSubject = src(subject), i18nBody = src(body);
  s.inbox.unshift({ id: `draft-${s.inbox.length}-${absWeek(s)}`, month: s.month, phase: s.phase, sender: to, subject, body, action: null, read: true, folder: 'drafts', kind: null, replied: null, mine: true, draft: true,
    ...(i18nSender ? { i18nSender } : {}), ...(i18nSubject ? { i18nSubject } : {}), ...(i18nBody ? { i18nBody } : {}) });
  s.counts.drafts = (s.counts.drafts || 0) + 1;
  if ((s.counts.drafts || 0) >= 4) award(s, 'draftsfolder');
}

export function chat(s, channel, sender, body, extra = {}) {
  const hour = 8 + Math.floor(random(s) * 12), minute = Math.floor(random(s) * 60);
  const i18n = src(body);
  s.chatMessages.push({ id: `chat-${s.chatMessages.length}`, channel, month: s.month, week: s.week, phase: s.phase, time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, sender, body, read: false, ...(i18n ? { i18n } : {}), ...extra });
}
export function award(s, id) { if (!s.achievements.includes(id)) { s.achievements.push(id); log(s, t('Achievement unlocked: {id}.', { id }), true); } }

// Apply a delta to stats, hidden values, relationship, misc counters, or the active project.
export function effects(s, delta = {}, actor = null) {
  const p = activeProject(s);
  for (const [key, rawValue] of Object.entries(delta)) {
    // Hope has diminishing returns above what your circumstances support. Content grants far
    // more hope than it costs, so without this a long run only ever climbs. Below the line a
    // good day is worth its full value; well above it, another good day moves you very little.
    let value = rawValue;
    if (key === 'hope' && rawValue > 0 && s.hopeTarget !== undefined) {
      const over = Math.max(0, (s.player.stats.hope ?? 50) - s.hopeTarget);
      value = rawValue * Math.max(.2, 1 - over / 38);
    }
    if (key === 'money') {
      // Losses that outrun the balance become card debt, not a negative number.
      if (value >= 0) s.player.stats.money = Math.round(s.player.stats.money + value);
      else {
        const owed = -value;
        const paid = Math.max(0, Math.min(s.player.stats.money, owed));
        s.player.stats.money = Math.round(s.player.stats.money - paid);
        const short = Math.round(owed - paid);
        if (short > 0) s.debt = Math.round((s.debt || 0) + short);
      }
    }
    else if (key in s.player.stats) s.player.stats[key] = clamp(s.player.stats[key] + value);
    else if (key in s.player.hidden) s.player.hidden[key] = clamp(s.player.hidden[key] + value);
    else if (key in s.relationship) s.relationship[key] = clamp(s.relationship[key] + value);
    else if (['coursework', 'readiness', 'career', 'pressure', 'standing', 'quitPressure'].includes(key)) s[key] = clamp((s[key] || 0) + value);
    else if (key === 'rentDelta' || key === 'commute') s.housing[key] += value;
    else if (key === 'bond') { const who = actor || s.eventActor; const target = who && labmateById(s, who.id); if (target) target.bond = clamp(target.bond + value); }
    else if (key === 'labBond') for (const l of activeLabmates(s)) l.bond = clamp(l.bond + value);
    else if (key === 'leaveWeeks') s.leaveWeeks = Math.max(0, s.leaveWeeks + value);
    else if (key === 'skill') for (const [skill, amount] of Object.entries(value)) s.player.skills[skill] = clamp(s.player.skills[skill] + amount);
    else if (p && key in p && typeof p[key] === 'number' && editable(p)) p[key] = clamp(p[key] + value);
  }
}

export function finish(s, id, title, text) {
  s.ending = { id, title, text }; s.phase = 'ending'; s.event = null; s.eventQueue = []; s.stage = 'plan';
  log(s, title);
  if (id === 'pass') award(s, 'prelim');
  if (id.startsWith('phd_')) award(s, 'doctor');
  if (['phd_tenure_track', 'phd_teaching_faculty', 'phd_abroad'].includes(id)) award(s, 'cycle');
  if (id === 'master' && s.career >= 50) award(s, 'escape');
  const forEnding = { hospital: 'tookthebed', institution: 'fourinches', perpetual: 'furniture', inherit: 'heirapparent', deported: 'removed' };
  if (forEnding[id]) award(s, forEnding[id]);
}

export function personality(s) {
  const top = Object.entries(s.player.personality).sort((a, b) => b[1] - a[1])[0];
  return top[1] ? personalityTitles[top[0]] : ['The Eternal Optimist', 'You began with a plan. That still counts.'];
}

// Replace {tokens} in event text with names from the current run.
export function fill(s, text) {
  if (!text) return '';
  const actor = s.eventActor ? labmateById(s, s.eventActor.id) : null;
  const p = activeProject(s);
  const map = {
    advisor: s.advisor ? t('Prof. {name}', { name: lastName(s.advisor.name) }) : t('your advisor'),
    advisorFirst: s.advisor ? firstName(s.advisor.name) : t('your advisor'),
    labmate: actor?.name || activeLabmates(s)[0]?.name || t('a labmate'),
    fired: s.fired?.name || actor?.name || t('the one who left'),
    firedFirst: firstName(s.fired?.name || actor?.name || t('the one who left')),
    labmateFirst: firstName(actor?.name || activeLabmates(s)[0]?.name || t('a labmate')),
    peer: actor?.name || s.peers[0]?.name || t('a friend from the cohort'),
    peerLab: actor?.labOf ? t('Prof. {name}', { name: lastName(actor.labOf) }) : t('another lab'),
    school: s.program?.name || t('the department'),
    company: s.company || t('a company'),
    project: p?.title || t('your project'),
    venue: p?.targetVenue || (p?.venueId && venueById[p.venueId]?.name) || s.lastMissed || t('the deadline'),
    name: s.player.name,
    first: firstName(s.player.name),
  };
  const out = text.replace(/\{(\w+)\}/g, (m, k) => map[k] ?? m);
  // A filled string is still translatable: keep the source and re-fill after translating.
  if (out !== text) { const p = provenanceOf(text); if (p) rememberSource(out, { ...p, f: 1 }); }
  return out;
}
