// Internships. The application window opens every August; whether you actually go is
// decided by a person who has a concrete reason to want you here this summer.
import { t } from '../i18n/index.js';
import { internTypes, internEmployers, hijackLines, stanceLines, internMoves, labmateVerdicts, returnLines, CPT_NOTE } from '../data/internships.js';
import { firstNames, surnames } from '../data/names.js';
import { monthOf, nextIndexFor, dateLabel } from '../data/calendar.js';
import { venueById, venuesForTopic, nextDeadline } from '../data/venues.js';
import { random, roll, clamp, pick, shuffle } from './probability.js';
import { effects, log, message, chat, award, activeProject, lastName, firstName, fill, vars } from './state.js';
import { milestoneOf } from './time.js';

export const ensureIntern = s => (s.intern = s.intern || { season: null, offers: [], talk: null, history: [], applied: false });

// Applications open in August; the summer they buy is the following June.
export const internWindow = s => [8, 9, 10].includes(monthOf(s.month)) ? 'open' : [11, 12, 1].includes(monthOf(s.month)) ? 'late' : 'closed';
export const canApplyIntern = s => s.phase === 'playing' && !s.internship && s.month >= 6 && s.month < 50
  && internWindow(s) !== 'closed' && !(s.intern && s.intern.season === seasonOf(s));
const seasonOf = s => Math.floor((s.month + 4) / 12);

// How strong you look to a recruiter, which is not how strong you look to a committee.
export function internScore(s) {
  return clamp(s.counts.accepted * 15
    + (s.projects.some(p => p.preprint) ? 5 : 0)
    + s.player.skills.coding * .20
    + s.player.skills.research * .12
    + (s.intern?.history.length ? 12 : 0)
    + (s.flags.collabOffer ? 8 : 0)
    + (s.conferenceConnections || 0) * 1.2
    + s.player.skills.networking * .10
    + s.advisor.connections * .08);
}

// Apply. Most applications produce nothing; the ones that land, land in December.
export function applyInternships(s) {
  ensureIntern(s);
  if (!canApplyIntern(s)) throw new Error(t('Applications are not open, or you have already been through this cycle.'));
  s.intern.season = seasonOf(s);
  s.intern.applied = true;
  effects(s, { energy: -8, stress: 3 });
  const score = internScore(s);
  const start = nextIndexFor(6, s.month + 1);
  const pool = Object.values(internTypes).filter(ty => {
    if (ty.usPersonOnly && s.player.profile.international) return false;
    if (ty.sponsors === false && s.player.profile.international) return false;
    return true;
  });
  const offers = [];
  for (const ty of shuffle(s, pool)) {
    if (offers.length >= 2) break;
    const bar = { research: 62, natlab: 55, quant: 58, mle: 44, sde: 34, startup: 30, teaching: 22 }[ty.id] ?? 45;
    const p = clamp(.10 + (score - bar) / 130, .04, .72);
    if (!roll(s, p)) continue;
    offers.push({
      id: `int-${s.month}-${ty.id}`, typeId: ty.id,
      employer: ty.onCampus ? s.program.name : pick(s, internEmployers[ty.id] || [s.company]),
      mentor: `${pick(s, ['Dr.', 'Dr.', 'Prof.'])} ${pick(s, firstNames)} ${pick(s, surnames)}`,
      salary: Math.round(ty.salary * (.9 + random(s) * .25)), start, end: Math.min(start + 2, 71),
    });
  }
  s.intern.offers = offers;
  if (!offers.length) {
    log(s, t('Nothing came back. Forty applications, six automated rejections, and thirty-four silences. This is the ordinary outcome and nobody posts about it.'));
    effects(s, { hope: -5 });
    return [];
  }
  log(s, t('{n} internship offer(s), for the summer. Now the harder conversation.', { n: offers.length }));
  for (const o of offers) {
    message(s, o.employer, t('Offer — summer internship'),
      t('We would like to offer you the summer internship: {label}. Twelve weeks from {from}, at ${salary} a month. The formal paperwork is attached; it is nineteen pages and four of them matter.', { label: t(internTypes[o.typeId].label), from: dateLabel(o.start), salary: o.salary }),
      'dashboard', 'inbox', null);
  }
  if (s.player.profile.international) log(s, t(CPT_NOTE));
  return offers;
}

// The excuses, drawn from the actual calendar rather than invented.
export function collisions(s, offer) {
  const win = [offer.start, offer.start + 1, offer.start + 2];
  const out = [];
  for (const p of s.projects) {
    if (['Accepted', 'Abandoned'].includes(p.status)) continue;
    if (p.targetMonth !== null && p.targetMonth !== undefined && win.includes(p.targetMonth))
      out.push({ kind: 'deadline', venue: p.targetVenue, project: p.title });
    if (p.status === 'Submitted' && p.timeline && win.includes(p.timeline.rebuttal))
      out.push({ kind: 'rebuttal', venue: venueById[p.venueId]?.name, project: p.title });
    if (['Rebuttal', 'Advisor Review'].includes(p.status))
      out.push({ kind: 'owed', project: p.title, venue: p.targetVenue || venueById[p.venueId]?.name });
  }
  if (!out.some(o => o.kind === 'deadline')) {
    const free = venuesForTopic(s.player.profile.topic).filter(v => !v.rolling && win.includes(nextDeadline(v, s.month, monthOf)));
    if (free.length) { const v = pick(s, free); out.push({ kind: 'venue', venue: v.name }); }
  }
  const ms = milestoneOf(s);
  if (ms && win.includes(ms.month)) out.push({ kind: 'milestone', milestone: t(ms.kind) });
  return out;
}
export const collisionWeight = (s, offer) => Math.min(3, collisions(s, offer).length);

// Sibling of the graduation negotiation: shorter, and about twelve weeks rather than a year.
export function internWillingness(s, offer) {
  const a = s.advisor, r = s.relationship, ty = internTypes[offer.typeId];
  return clamp(48
    + (a.caring - 50) * .40 + (r.trust - 50) * .30 + (r.satisfaction - 50) * .22
    - (a.ambition - 50) * .42 - (a.toxicity - 40) * .50
    - (a.funding >= 45 ? 8 : 0) + (a.connections > 70 ? 6 : 0)
    + ty.advisorLike
    - collisionWeight(s, offer) * 9
    + s.counts.accepted * 5
    - (s.month < 20 ? 8 : 0)
    - ((s.intern?.history.length || 0) ? 6 : 0));
}
export const internObjectionIsFair = (s, offer) => collisionWeight(s, offer) >= 2 || internWillingness(s, offer) >= 40;

// Open the conversation about the summer.
export function openInternTalk(s, offerId) {
  ensureIntern(s);
  const offer = s.intern.offers.find(o => o.id === offerId);
  if (!offer) throw new Error(t('That offer is not on the table.'));
  const willing = internWillingness(s, offer);
  const stance = willing >= 62 ? 'bless' : willing >= 40 ? 'trade' : willing >= 18 ? 'hijack' : 'forbid';
  const cols = collisions(s, offer);
  const col = cols.length ? pick(s, cols) : null;
  const ty = internTypes[offer.typeId];
  let line;
  if (stance === 'hijack' || stance === 'forbid') {
    const pool = col ? hijackLines[col.kind] : hijackLines.none;
    line = vars(t(pick(s, pool || hijackLines.none)), { venue: col?.venue || '', project: col?.project || '', milestone: col?.milestone || '' });
    if (stance === 'forbid') line = `${line} ${t(pick(s, stanceLines.forbid))}`;
  } else {
    line = vars(t(pick(s, stanceLines[stance])), { condition: activeProject(s)?.title || t('the draft') });
  }
  s.intern.talk = { offerId, stance, line, used: [], settled: stance === 'bless', collisions: cols.map(c => c.kind) };
  effects(s, { energy: -3, stress: stance === 'bless' ? -4 : 6 });
  log(s, `${t('You told them about the internship.')} ${line}`);
  if (stance === 'bless') { s.intern.talk.outcome = 'blessed'; award(s, 'blessedsummer'); }
  return s.intern.talk;
}

export function internTalkMoves(s) {
  const talk = s.intern?.talk;
  if (!talk || talk.settled) return [];
  const used = talk.used || [];
  const list = [];
  if (talk.stance !== 'bless') {
    list.push({ ...internMoves.plan, done: used.includes('plan') });
    list.push({ ...internMoves.money, done: used.includes('money') });
    list.push({ ...internMoves.connection, done: used.includes('connection') });
    list.push({ ...internMoves.ask_labmate, done: used.includes('ask_labmate') });
  }
  list.push({ ...internMoves.go, done: false });
  list.push({ ...internMoves.decline, done: false });
  return list;
}

export function playInternMove(s, id) {
  const talk = s.intern?.talk;
  if (!talk || talk.settled) throw new Error(t('That conversation is over.'));
  const offer = s.intern.offers.find(o => o.id === talk.offerId);
  const ty = internTypes[offer.typeId];
  const move = internMoves[id];
  if (!move) throw new Error(t('That is not something you could say.'));
  if ((talk.used || []).includes(id) && !['go', 'decline'].includes(id)) throw new Error(t('You have tried that.'));
  talk.used = [...(talk.used || []), id];

  if (id === 'decline') {
    talk.settled = true; talk.outcome = 'declined';
    s.flags.internDeclined = true;
    effects(s, { satisfaction: 8, trust: 4, hope: -6 });
    log(s, t(move.line));
    return { id, line: t(move.line), outcome: 'declined' };
  }

  if (id === 'go') {
    // Always available. Always works. Never free.
    const cost = { bless: 0, trade: 1, hijack: 2, forbid: 3 }[talk.stance];
    talk.settled = true; talk.outcome = talk.stance === 'bless' ? 'blessed' : talk.stance === 'forbid' ? 'forbidden' : 'hijacked';
    effects(s, { satisfaction: -6 * cost, trust: -3 * cost, conflict: 4 * cost, stress: 3 * cost, confidence: 4 });
    if (cost >= 2) { s.flags.internWentAnyway = true; s.letterDrag = (s.letterDrag || 0) + cost; }
    s.player.personality.boundarySetter++;
    accept(s, offer);
    const line = `${t(move.line)}${cost >= 2 ? ' ' + t('They say “fine.” The word does no work at all.') : ''}`;
    log(s, line);
    if (cost >= 2) award(s, 'wentanyway');
    return { id, line, outcome: talk.outcome };
  }

  if (id === 'ask_labmate') {
    const fair = internObjectionIsFair(s, offer);
    const who = s.labmates.find(l => l.status === 'active') || s.peers[0];
    const verdict = t(pick(s, fair ? labmateVerdicts.fair : labmateVerdicts.unfair));
    talk.knowsTruth = fair ? 'fair' : 'unfair';
    const line = `${vars(t(move.line), { labmate: firstName(who?.name || t('a labmate')) })} ${verdict}`;
    effects(s, { hope: fair ? -2 : 5 });
    log(s, line);
    return { id, line, outcome: 'informed', fair };
  }

  const willing = internWillingness(s, offer);
  const base = {
    plan: .24 + (s.player.skills.writing + s.player.skills.communication) / 700,
    money: .20 + (s.advisor.caring - 45) / 220,
    connection: .18 + s.player.skills.networking / 500 + ty.mentorSenior / 500,
  }[id];
  const odds = clamp(base + (willing - 40) / 240 - collisionWeight(s, offer) * .05, .08, .85);
  const won = roll(s, odds);
  const line = `${vars(t(move.line), { salary: offer.salary, stipend: Math.round(s.program.stipend), mentor: offer.mentor })} ${t(won ? move.good : move.bad)}`;
  log(s, line);
  if (won) {
    talk.stance = talk.stance === 'forbid' ? 'hijack' : talk.stance === 'hijack' ? 'trade' : 'bless';
    if (talk.stance === 'bless') { talk.settled = true; talk.outcome = 'blessed'; accept(s, offer); effects(s, { hope: 8 }); award(s, 'talkedthemround'); }
  } else {
    effects(s, { satisfaction: -3, stress: 4 });
  }
  return { id, line, outcome: talk.settled ? talk.outcome : 'open', won };
}

function accept(s, offer) {
  const ty = internTypes[offer.typeId];
  s.internship = { start: offer.start, end: offer.end, company: offer.employer, typeId: offer.typeId, mentor: offer.mentor, salary: offer.salary };
  if (s.player.profile.international) s.scheduled.push({ id: 'cpt', week: (s.month + 1) * 4 });
  log(s, t('Internship confirmed at {company} for {from}–{to}. Summer has a salary now.', { company: offer.employer, from: dateLabel(offer.start), to: dateLabel(offer.end) }));
}

// The end of the summer, where the deltas land and one of them takes research away.
export function endInternship(s) {
  const spent = s.internship;
  if (!spent) return null;
  const ty = internTypes[spent.typeId] || internTypes.research;
  const talk = s.intern?.talk;
  const how = talk?.outcome || 'blessed';
  for (const [k, v] of Object.entries(ty.skills)) s.player.skills[k] = clamp(s.player.skills[k] + v);
  effects(s, { career: ty.career, academicCapital: ty.capital, hope: 6, energy: 8 });
  const paper = roll(s, ty.paperChance);
  if (paper) { effects(s, { academicCapital: 4 }); s.flags.internPaper = true; }
  const returned = ty.returnBias !== null && roll(s, clamp(.25 + ty.returnBias, .05, .6));
  if (returned && !s.scheduled.some(x => x.id === 'internship_end')) s.scheduled.push({ id: 'internship_end', week: s.month * 4 + s.week + 1 });
  s.flags.internDone = true; s.flags.internCompany = spent.company;
  s.counts.internships = (s.counts.internships || 0) + 1;
  s.intern = s.intern || {};
  s.intern.history = [...(s.intern.history || []), { typeId: spent.typeId, employer: spent.company, how, paper, returned }];
  s.lastInternship = { company: spent.company, end: spent.end };
  const rough = !returned && ['sde', 'quant', 'startup'].includes(spent.typeId) && roll(s, .3);
  const key = rough ? 'rough' : how === 'forbidden' ? 'forbidden' : how === 'hijacked' ? (paper ? 'hijackedPaper' : 'hijackedNothing') : (paper ? 'blessedPaper' : 'blessedNothing');
  const line = t(returnLines[key]);
  log(s, line);
  chat(s, 'advisor', s.advisor.name, line.slice(0, 160));
  if (ty.skills.research < 0) log(s, t('The research skill you had in May is not the research skill you have in September. It comes back. It takes until about February.'));
  s.internship = null;
  s.intern.talk = null;
  s.intern.offers = [];
  return { line, paper, returned };
}
