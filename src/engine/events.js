import { events, eventById } from '../data/events.js';
import { exitEndings } from '../data/endings.js';
import { pushbacks, hesitationLines } from '../data/minigames.js';
import { t, provenanceOf } from '../i18n/index.js';
import { meetings, meetingById } from '../data/meetings.js';
import { monthOf, isTeachingTerm, isSummer } from '../data/calendar.js';
import { random, roll, clamp, pickWeighted, pick } from './probability.js';
import { meetContact } from './network.js';
import { HARD_TA } from '../data/hardta.js';
import { effects, log, award, finish, activeProject, absWeek, labmateById, fill, chat, lastName, setTemplateLookup, joined, firstName, draftMail, activeLabmates } from './state.js';

export const templateById = { ...eventById, ...meetingById };
setTemplateLookup(id => templateById[id]);
// Events that do not wait for a probability roll: when their conditions are met the turn stops.
// Derived from the data rather than listed here, so a new one cannot be silently left out.
const URGENT = events.filter(e => e.urgent).map(e => e.id);
const cadenceRank = { whenever: 0, monthly: 1, biweekly: 2, weekly: 3 };
// The scenes that can occupy the weekly group-meeting slot.
const GROUP_POOL = ['group_present', 'group_nobody_read', 'group_someone_else', 'group_derail', 'group_visitor', 'group_reading', 'group_your_turn_again',
  'group_round_thin', 'group_round_strong', 'group_public_correction', 'group_laughed_at', 'group_praise_public'];

// ctx: { tempo, crunch (null|{type}), cancelled, actor }
export function eligible(s, e, ctx = {}) {
  const c = e.conditions || {};
  const p = activeProject(s);
  const a = s.advisor;
  if (c.phase && c.phase !== s.phase && !(c.phase === 'application' && s.phase === 'prep')) return false;
  if (!c.phase && s.phase !== 'playing') return false;
  if (e.once && s.seen[e.id]) return false;
  if (e.prerequisites && !e.prerequisites.every(f => s.flags[f])) return false;
  if (e.excludes && e.excludes.some(f => s.flags[f])) return false;
  if (s.cooldowns[e.id] !== undefined && s.month - s.cooldowns[e.id] < e.cooldown) return false;
  if (c.minMonth !== undefined && s.month < c.minMonth) return false;
  if (c.maxMonth !== undefined && s.month > c.maxMonth) return false;
  if (c.months && !(ctx.monthsList || [monthOf(s.month)]).some(m => c.months.includes(m))) return false;
  if (c.week !== undefined && s.week !== c.week) return false;
  { const tem = ctx.tempo || s.tempo; if (c.tempo && tem !== c.tempo && !(c.tempo === 'week' && tem === 'day')) return false; }
  if (c.crunch && ctx.crunch?.type !== c.crunch) return false;
  if (c.cancelled !== undefined && !!ctx.cancelled !== c.cancelled) return false;
  if (c.season === 'teaching' && !isTeachingTerm(s.month)) return false;
  if (c.season === 'summer' && !isSummer(s.month)) return false;
  if (c.climate && !c.climate.includes(s.program?.climate)) return false;
  if (c.international !== undefined && s.player.profile.international !== c.international) return false;
  if (c.topicsIn && !c.topicsIn.includes(s.player.profile.topic)) return false;
  if (c.hasProject && !p) return false;
  if (c.minProgress !== undefined && !(p && p.progress >= c.minProgress && !['Submitted', 'Rebuttal', 'Accepted', 'Abandoned'].includes(p.status))) return false;
  if (c.maxProgress !== undefined && !(p && p.progress <= c.maxProgress)) return false;
  if (c.maxHealth !== undefined && s.player.stats.health > c.maxHealth) return false;
  if (c.minHealth !== undefined && s.player.stats.health < c.minHealth) return false;
  if (c.background && !c.background.includes(s.player.profile.background)) return false;
  // Optional questionnaire answers. A null answer gates nothing in either direction.
  if (c.whyHere && !c.whyHere.includes(s.player.profile.whyHere)) return false;
  if (c.household && !c.household.includes(s.player.profile.household)) return false;
  if (c.firstGen !== undefined && s.player.profile.firstGen !== c.firstGen) return false;
  if (c.fear && !c.fear.includes(s.player.profile.fear)) return false;
  if (c.dealbreaker && !c.dealbreaker.includes(s.player.profile.dealbreaker)) return false;
  if (c.travelled !== undefined && !!s.lastTrip !== c.travelled) return false;
  if (c.minIgnored !== undefined && (s.counts.crisisIgnored || 0) < c.minIgnored) return false;
  if (c.minLowHealth !== undefined && (s.counts.lowHealthMonths || 0) < c.minLowHealth) return false;
  if (c.minHighStress !== undefined && (s.counts.highStressMonths || 0) < c.minHighStress) return false;
  if (c.minConditions !== undefined && (s.conditions || []).length < c.minConditions) return false;
  if (c.minScope !== undefined && !(p && p.scope >= c.minScope)) return false;
  if (c.mode && !c.mode.includes(s.advisorMode?.id)) return false;
  if (c.maxDraft !== undefined && !(p && p.draft <= c.maxDraft)) return false;
  if (c.minDraft !== undefined && !(p && p.draft >= c.minDraft)) return false;
  if (c.projectStatus && p?.status !== c.projectStatus) return false;
  if (c.minQuality !== undefined && !(p && qualityOf(p) >= c.minQuality)) return false;
  if (c.noTarget && p?.targetVenueId) return false;
  if (c.targetSoon && !(p && p.targetMonth !== null && p.targetMonth !== undefined && p.targetMonth - s.month <= 2 && p.targetMonth >= s.month && p.status !== 'Submitted')) return false;
  if (c.hasSide !== undefined && s.projects.some(x => x.kind === 'side' && !['Accepted', 'Abandoned'].includes(x.status)) !== c.hasSide) return false;
  if (c.hasCollaborator && !(p && p.collaborators.length > 1)) return false;
  if (c.minStress !== undefined && s.player.hidden.stress < c.minStress) return false;
  if (c.maxStress !== undefined && s.player.hidden.stress > c.maxStress) return false;
  if (c.maxEnergy !== undefined && s.player.stats.energy > c.maxEnergy) return false;
  if (c.minHope !== undefined && s.player.stats.hope < c.minHope) return false;
  if (c.maxHope !== undefined && s.player.stats.hope > c.maxHope) return false;
  if (c.minMoney !== undefined && s.player.stats.money < c.minMoney) return false;
  if (c.maxMoney !== undefined && s.player.stats.money > c.maxMoney) return false;
  if (c.minConflict !== undefined && s.relationship.conflict < c.minConflict) return false;
  if (c.minTrust !== undefined && s.relationship.trust < c.minTrust) return false;
  if (c.minSatisfaction !== undefined && s.relationship.satisfaction < c.minSatisfaction) return false;
  if (c.maxSatisfaction !== undefined && s.relationship.satisfaction > c.maxSatisfaction) return false;
  if (c.minCareer !== undefined && s.career < c.minCareer) return false;
  if (c.minCareerOrConnections && !(s.career >= 25 || (a && a.connections >= 70))) return false;
  if (c.minPressure !== undefined && s.pressure < c.minPressure) return false;
  if (c.minAccepted !== undefined && (s.counts?.accepted || 0) < c.minAccepted) return false;
  if (a) {
    if (c.maxFunding !== undefined && a.funding > c.maxFunding) return false;
    if (c.minFunding !== undefined && a.funding < c.minFunding) return false;
    if (c.minToxicity !== undefined && a.toxicity < c.minToxicity) return false;
    if (c.minCaring !== undefined && a.caring < c.minCaring) return false;
    if (c.minAmbition !== undefined && a.ambition < c.minAmbition) return false;
    if (c.minLabSize !== undefined && a.labSize < c.minLabSize) return false;
    if (c.maxAvailability !== undefined && a.availability > c.maxAvailability) return false;
    if (c.archetype && !c.archetype.includes(a.archetype)) return false;
    if (c.stage && !c.stage.includes(a.stage || 'mid_career')) return false;
  }
  if (c.mutator && !s.mutators.includes(c.mutator)) return false;
  if (c.flag && !s.flags[c.flag]) return false;
  // Scenes that prepare you for an exam must stop once you have sat it. meet_prelim fired 55 times
  // across 30 runs after the prelim had been passed — an advisor coaching you for something that
  // already happened, which reads as the game not keeping track.
  if (c.before && s.milestones?.[c.before] === 'pass') return false;
  if (c.notFlag && s.flags[c.notFlag]) return false;
  if (c.ta !== undefined && !!s.ta !== c.ta) return false;
  if (c.internship !== undefined && !!s.internship !== c.internship) return false;
  if (c.minCadence && cadenceRank[s.cadence.oneOnOne] < cadenceRank[c.minCadence]) return false;
  if (c.maxCadence && cadenceRank[s.cadence.oneOnOne] > cadenceRank[c.maxCadence]) return false;
  if (e.actor) {
    const pool = actorPool(s, e);
    if (!pool.length) return false;
    if (c.minBond !== undefined && !pool.some(x => x.bond >= c.minBond)) return false;
    if (c.minPeerBond !== undefined && !pool.some(x => x.bond >= c.minPeerBond)) return false;
  }
  return true;
}
const qualityOf = p => p.novelty * .18 + p.technicalDepth * .15 + p.evidence * .29 + p.writingQuality * .23 + p.reproducibility * .15;

function actorPool(s, e) {
  const list = e.actor.type === 'peer' ? s.peers : activeLabmates(s);
  return list.filter(x => x.status === 'active' && (!e.actor.role || x.role === e.actor.role) && (!e.actor.trait || x.trait === e.actor.trait) && (!e.actor.fate || x.fate === e.actor.fate));
}
export function chooseActor(s, e) {
  if (!e.actor) return null;
  const pool = actorPool(s, e);
  if (!pool.length) return null;
  const c = e.conditions || {};
  const filtered = pool.filter(x => (c.minBond === undefined || x.bond >= c.minBond) && (c.minPeerBond === undefined || x.bond >= c.minPeerBond));
  const who = pick(s, filtered.length ? filtered : pool);
  return { type: e.actor.type, id: who.id };
}

// Weight for random selection: base probability × novelty within the run × frequency
// across all runs. Counts keep rare scenes favored even after every scene has appeared once.
// Whether a scene is about this particular person.
//
// Around eighty events are eligible on a typical month and exactly one is drawn, so under flat
// weighting the hand-written, circumstance-matched scenes — the only ones that land — are the
// least likely to appear, because there are so many of them and each is individually rare.
// Measured: the whole visa storyline fired zero times across twelve international runs while
// generic lab filler repeated.
//
// The first attempt used the *number* of conditions as the proxy, which was wrong and measurably
// so: a player who answered every optional question and played seventy months saw the scenes those
// answers unlock twice, because "the nursery closes at six" is gated on two things — a month and a
// household — and lost to the count. What matters is not how many gates an event has but what kind.
// A gate on the calendar is about the calendar and nearly every event has one. A gate on who you
// said you were, where you are from, what you are afraid of, or who your advisor turned out to be
// is about you, and there is no point writing those at all if the player they were written for
// never sees them.
const ABOUT_YOU = ['whyHere', 'household', 'firstGen', 'fear', 'dealbreaker', 'international',
  'background', 'topicsIn', 'archetype', 'stage', 'mutator', 'climate', 'flag'];
export const aboutYou = e => {
  const c = e.conditions || {};
  return ABOUT_YOU.some(k => c[k] !== undefined) || Object.keys(c).length >= 3;
};
const specificity = e => (aboutYou(e) ? 1.7 : 1) * (1 + .18 * Object.keys(e.conditions || {}).length);

export function freshness(s, e) {
  const inRun = s.seen[e.id] || 0;
  const acrossRuns = Number(s.seenBefore?.[e.id]) || 0;
  const historyWeight = acrossRuns ? 1 / (1 + .12 * acrossRuns) : 1.8;
  // A repeat inside one run is a strong signal of staleness: penalise it hard, not gently.
  return (e.weight || 1) * (e.probability || .5) * specificity(e) * (1 / (1 + 1.5 * inRun * inRun)) * historyWeight;
}

export function pushEvent(s, id, actor = null) {
  if (!templateById[id] || s.eventQueue.includes(id) || s.event === id) return;
  s.eventQueue.push(id);
  if (actor) s.actorFor = { ...(s.actorFor || {}), [id]: actor };
}

// Build the queue for this turn. ctx = { tempo, crunch, meetingTemplate, cancelledMeeting, present, monthEnd }
export function scheduleTurnEvents(s, ctx) {
  const now = absWeek(s);
  const due = s.scheduled.filter(x => x.week <= now);
  s.scheduled = s.scheduled.filter(x => x.week > now);
  const queue = [];
  // A scheduled beat that is not eligible on its due week used to be thrown away, which meant any
  // multi-beat storyline could break silently and permanently — a follow-up landing during a trip,
  // a crunch, or a month when its own conditions happened not to hold was simply lost. Retry it for
  // a few weeks before giving up, so an arc survives an inconvenient calendar.
  for (const x of due) {
    if (!templateById[x.id]) continue;
    if (eligible(s, templateById[x.id], ctx) && !queue.includes(x.id)) { queue.push(x.id); if (x.actor) s.actorFor = { ...(s.actorFor || {}), [x.id]: x.actor }; continue; }
    const tries = (x.tries || 0) + 1;
    if (tries <= 8) s.scheduled.push({ ...x, week: now + 1, tries });
  }
  for (const id of URGENT) if (eligible(s, eventById[id], ctx) && !queue.includes(id)) queue.push(id);
  for (const e of events) if (e.forced && !queue.includes(e.id) && eligible(s, e, ctx)) queue.push(e.id);
  for (const id of s.eventQueue) if (!queue.includes(id)) queue.push(id);
  if (ctx.meetingTemplate && !queue.includes(ctx.meetingTemplate)) queue.push(ctx.meetingTemplate);
  // Group meeting is the most-repeated slot in the game — measured at 7.8 firings per run in the
  // middle years, up to 17. It is a pool now: your turn, somebody else's turn, and the weeks where
  // the meeting is about something other than what it was supposed to be about.
  if (ctx.present) {
    const pool = GROUP_POOL.filter(id => eventById[id] && eligible(s, eventById[id], ctx));
    if (pool.length) queue.push(pickWeighted(s, pool, id => (id === 'group_praise_public' ? 9 : id === 'group_present' ? 1.3 : 1)));
  }
  const isDay = ctx.tempo === 'day';
  const isMonth = ctx.tempo === 'month' || ctx.tempo === 'season';
  const cap = ctx.tempo === 'season' ? 5 : isMonth ? 4 : isDay ? 1 : 2;
  const soft = queue.filter(id => !URGENT.includes(id)).length;
  if (isMonth && soft < cap) {
    const rounds = ctx.monthsList ? 2 : 1;
    for (let r = 0; r < rounds; r++) {
      const holidays = events.filter(e => e.category === 'holiday' && !queue.includes(e.id) && eligible(s, e, ctx));
      const h = pickWeighted(s, holidays, e => freshness(s, e));
      if (h && roll(s, Math.min(.9, (h.probability || .5) + .2))) queue.push(h.id);
    }
  }
  const lastCount = s.lastEventCount || 0;
  const randomChance = isMonth ? (lastCount >= 3 ? .6 : .9) : isDay ? .55 : .5;
  if (queue.filter(id => !URGENT.includes(id)).length < cap && roll(s, randomChance)) {
    const pool = events.filter(e => !e.scheduledOnly && !URGENT.includes(e.id) && e.category !== 'holiday' && e.category !== 'meeting' && !queue.includes(e.id) && eligible(s, e, ctx)
      && (isMonth ? e.category !== 'crunch' : (e.category === 'crunch' || random(s) < (isDay ? .25 : .15))));
    // A third of the time, only the scenes written about this player are in the running. Weighting
    // alone was not enough: a once-only event gated on who you are has a window of maybe twenty
    // months, and against eighty competitors that is a coin flip on whether the player it was
    // written for ever sees it. Nobody writes "the nursery closes at six" for a coin flip.
    // This does not add events — the draw is still one — it changes which one you get.
    const mine = pool.filter(aboutYou);
    const from = mine.length && roll(s, .34) ? mine : pool;
    const e = pickWeighted(s, from, x => freshness(s, x));
    if (e) queue.push(e.id);
  }
  if (isMonth && queue.filter(id => !URGENT.includes(id)).length < cap && roll(s, .65)) {
    const pool = events.filter(e => !e.scheduledOnly && !URGENT.includes(e.id) && ['lab', 'peer'].includes(e.category) && !queue.includes(e.id) && eligible(s, e, ctx));
    const e = pickWeighted(s, pool, x => freshness(s, x));
    if (e) queue.push(e.id);
  }
  s.eventQueue = queue;
  s.lastEventCount = queue.length;
  // The advisor does not always accept the first answer.
  openNext(s);
}

// Whether this meeting gets a second, harder beat — and which one.
export function maybePushback(s, choice) {
  const a = s.advisor;
  const mode = s.advisorMode?.id;
  const odds = clamp(.14 + (a.ambition - 50) / 260 + (a.toxicity - 30) / 300 + (mode === 'pressed' ? .18 : mode === 'attentive' ? .1 : 0)
    + (s.relationship.satisfaction < 40 ? .12 : 0) + (s.crunch ? .1 : 0) - (choice.personality === 'peoplePleaser' ? .06 : 0), 0, .62);
  if (!roll(s, odds)) return false;
  const pool = pushbacks.filter(x => x.id !== s.lastPushback);
  const pb = pick(s, pool.length ? pool : pushbacks);
  s.pushback = { id: pb.id, from: e_id(s), seconds: s.crunch ? 9 : 12 };
  s.lastPushback = pb.id;
  s.stage = 'pushback';
  return true;
}
const e_id = s => s.event || null;

export function resolvePushback(s, id) {
  const pb = pushbacks.find(x => x.id === s.pushback?.id);
  if (!pb) throw new Error(t('Nobody is waiting for an answer.'));
  const opt = pb.options.find(o => o.id === id) || pb.options.at(-1);
  effects(s, opt.effects || {});
  const line = fill(s, t(opt.line));
  log(s, joined(t('They push back.'), ' ', line));
  if (s.report) s.report.events.push({ title: t('They push back'), choice: t(opt.label), result: line, category: 'meeting' });
  s.pushbackResult = line;
  s.pushback = null;
  openNext(s);
  return line;
}

// Saying nothing is also an answer, and a worse one.
export function hesitate(s) {
  const line = t(pick(s, hesitationLines));
  if (s.pushback) {
    const pb = pushbacks.find(x => x.id === s.pushback.id);
    const worst = pb.options.at(-1);
    effects(s, { ...(worst.effects || {}), stress: 4, confidence: -3 });
    s.pushback = null;
    s.pushbackResult = line;
    log(s, line);
    openNext(s);
    return line;
  }
  const e = templateById[s.event];
  if (!e) return line;
  effects(s, { stress: 5, confidence: -4, satisfaction: -3 });
  log(s, line);
  resolveChoice(s, e.choices.at(-1).id);
  return line;
}

export function openNext(s) {
  s.event = s.eventQueue.shift() || null;
  s.eventActor = null;
  if (s.event) {
    const e = templateById[s.event];
    s.eventActor = (s.actorFor && s.actorFor[s.event]) || chooseActor(s, e);
    if (s.actorFor) delete s.actorFor[s.event];
    s.eventVariant = Array.isArray(e.text) ? Math.floor(random(s) * e.text.length) : 0;
    s.stage = 'event';
  } else s.stage = s.crisis && !s.crisis.resolved ? 'crisis' : (s.eventReturn || 'plan');
}
export const eventText = (s, e) => fill(s, Array.isArray(e.text) ? e.text[s.eventVariant % e.text.length] : e.text).replace('{draft}', String(Math.round(activeProject(s)?.draft || 0))).replace('{monthsIn}', String(s.month + 1));

// What the check was reading, in words, so the readout can say it.
function checkLabel(s, check) {
  if (check.skill) return t(check.skill);
  if (check.stat === 'career') return t('career');
  if (check.stat) return t(check.stat);
  if (check.rel) return t(check.rel);
  if (check.advisor) return t('their {trait}', { trait: t(check.advisor) });
  if (check.bond) { const who = s.eventActor && labmateById(s, s.eventActor.id); return who ? t('your bond with {name}', { name: firstName(who.name) }) : t('a bond'); }
  return t('the odds');
}

function checkValue(s, check) {
  if (check.skill) return s.player.skills[check.skill];
  if (check.stat === 'career') return s.career;
  if (check.stat) return s.player.stats[check.stat];
  if (check.rel) return s.relationship[check.rel];
  if (check.advisor) return s.advisor[check.advisor];
  if (check.bond) { const who = s.eventActor && labmateById(s, s.eventActor.id); return who ? who.bond : 30; }
  return 50;
}

// hooks: functions injected by game.js to avoid circular imports { setTarget, startSide, startMain, shiftCadence, revealHint, addCollaborator, acceptInternship, advisorResponds, queueMeeting }
export const hooks = {};

export function resolveChoice(s, id) {
  const e = templateById[s.event];
  if (!e) throw new Error('There is no event to resolve.');
  const c = e.choices.find(x => x.id === id);
  if (!c) throw new Error('That choice is not available.');
  if (c.requiresCoursework && s.coursework < c.requiresCoursework) throw new Error(`That path needs ${c.requiresCoursework} coursework progress.`);
  if (c.requiresMoney && s.player.stats.money < c.requiresMoney) throw new Error('You cannot afford that.');
  effects(s, c.effects);
  let result = '';
  let success = null;
  let rolled = null;
  if (!c.check && (c.result || c.successText)) result = c.result || c.successText;
  if (c.check) {
    // Rolled inline rather than through roll(), so the draw itself can be shown. Same single
    // random(s) draw and the same clamp, so the stream and the odds are byte-identical to before:
    // a dice game that hides the dice is just a game that sometimes says no.
    const val = checkValue(s, c.check);
    const odds = clamp(clamp(.5 + (val - c.check.difficulty) / 110, .1, .9), .03, .97);
    const draw = random(s);
    success = draw < odds;
    rolled = { label: checkLabel(s, c.check), value: Math.round(val), difficulty: c.check.difficulty,
      odds: Math.round(odds * 100), draw: Math.round(draw * 100), success };
    effects(s, success ? c.successEffects : c.failureEffects);
    result = success ? (c.successText || t('The conversation goes better than you feared.')) : (c.failureText || t('The system has other plans.'));
  }
  if (c.advisorResponse) {
    const supported = hooks.advisorResponds ? hooks.advisorResponds(s) : roll(s, (s.advisor.caring + s.relationship.trust) / 200);
    effects(s, supported ? { stress: -8, hope: 5, trust: 4 } : { stress: 7, satisfaction: -5 });
    result = supported ? t('Your advisor makes room for you to be human.') : (s.advisorMode?.id === 'checkedOut' || s.advisorMode?.id === 'traveling' ? t('Your advisor does not reply for nine days. Then: “Sounds good.”') : t('Your advisor asks how this affects the deadline.'));
  }
  // The one who does not finish. Pinned by name on the run rather than left to the actor picker,
  // because the arc runs across years and it has to still be the same person in the last beat.
  // The year the money went. This scene had two entry points — a monthly check in life.js and its
  // own conditions here — and only the first of them set any state, so 27% of runs were told their
  // funding had gone and then taught nothing, lost nothing and finished on time.
  if (c.hardTa && !s.raLost) {
    s.raLost = { since: s.month, until: s.month + HARD_TA.semesters * 5, years: 1 };
    s.ta = true;
    s.flags.hardTA = true;
    // A durable record that this happened. `flags.hardTA` is cleared the month the year ends, so
    // anything reading it afterwards — an epilogue beat, a CV line, `npm run reach` — concluded
    // the year had never happened to anybody.
    s.counts.hardTaYears = (s.counts.hardTaYears || 0) + 1;
    // And the three scenes about what the year is actually like are scheduled rather than left to
    // the pool. Their window is the ten months the flag is up, against eighty other eligible
    // events, which worked out to well under one run in a hundred ever seeing one. A year you
    // were told about and then never shown is the same bug this scene was written to fix.
    s.scheduled.push({ id: 'ta_hell_grading', week: absWeek(s) + 6 });
    s.scheduled.push({ id: 'ta_hell_research', week: absWeek(s) + 13 });
    s.scheduled.push({ id: 'ta_hell_seen', week: absWeek(s) + 21 });
  }
  if (c.watchFired && s.eventActor) {
    const who = labmateById(s, s.eventActor.id);
    if (who) s.fired = { id: who.id, name: who.name, month: s.month, kept: false, pending: true };
  }
  if (c.firesLabmate) {
    const watched = s.fired?.id ? labmateById(s, s.fired.id) : null;
    const who = watched || (s.eventActor && labmateById(s, s.eventActor.id));
    const target = who || (s.labmates || []).filter(l => l.status === 'active').sort((x, y) => y.bond - x.bond)[0];
    if (target) {
      s.fired = { id: target.id, name: target.name, month: s.month, kept: false };
      target.status = 'left';
      s.flags.labmateFired = true;
    }
  }
  // Four words, fourteen months late. They become a real contact with a real trajectory, and
  // the network they are now in is better than the one that let them go.
  if (c.keepsFired && s.fired) {
    // meetContact returns null at NETWORK_MAX. Marking the payoff done anyway promised a contact
    // that is not there — the achievement fired and the person never appeared in the network.
    const made = meetContact(s, { kind: 'researcher', where: 'lab', regard: 78, name: s.fired.name });
    if (made) { made.warmth = clamp(made.warmth + 25); made.met = s.fired.month; s.fired.kept = true; }
    else result = t('You send it, and they reply, and you have nobody left in the week to reply back to. The thread sits there, warm and unanswered, which is its own kind of answer.');
  }
  // The one you typed and did not send. It goes to Drafts, where it stays.
  if (c.draft) draftMail(s, fill(s, t(c.draft.to)), fill(s, t(c.draft.subject)), fill(s, t(c.draft.body)));
  const conditional = v => v === 'onSuccess' ? success === true : v === 'onFail' ? success === false : !!v;
  for (const [flag, value] of Object.entries(c.flags || {})) {
    if (value === 'onSuccess' || value === 'onFail') { if (conditional(value)) s.flags[flag] = true; }
    else s.flags[flag] = value;
  }
  for (const f of c.followUps || []) if (!s.scheduled.some(x => x.id === f.id)) s.scheduled.push({ id: f.id, week: absWeek(s) + f.delay * 4, ...(s.eventActor ? { actor: s.eventActor } : {}) });
  if (c.standing) s.standing = clamp((s.standing || 60) + c.standing);
  if (c.personality) s.player.personality[c.personality]++;
  if (c.achievement) award(s, c.achievement);
  if (c.successAchievement && success === true) award(s, c.successAchievement);
  if (c.skill) effects(s, { skill: c.skill });
  if (c.bond) effects(s, { bond: c.bond });
  if (c.labBond) effects(s, { labBond: c.labBond });
  if (c.peerBond) for (const p of s.peers) p.bond = clamp(p.bond + c.peerBond);
  if (c.leave && conditional(c.leave)) s.leaveWeeks += typeof c.leave === 'number' ? c.leave : 1;
  if (c.holiday) {
    s.counts.holidaysTaken++;
    const year = Math.floor(s.month / 12);
    s.flags[`${c.holiday}Off${year}`] = true;
    if (s.flags[`thanksgivingOff${year}`] && s.flags[`winterOff${year}`]) award(s, 'rested');
  }
  if (c.presented) { s.meetingStats.presented++; if (s.meetingStats.presented >= 6) award(s, 'presenter'); }
  if (c.ta === true || (c.ta === 'onFail' && success === false)) s.ta = true;
  if (c.fellowship && success) { s.flags.fellow = true; s.ta = false; }
  if (c.internship && (c.internship === 'accept' || conditional(c.internship)) && hooks.acceptInternship) hooks.acceptInternship(s);
  if (c.funding && hooks.funding) hooks.funding(s, c.funding);
  if (c.target && hooks.setTarget && activeProject(s)) hooks.setTarget(s, activeProject(s), c.target);
  if (c.startMain && hooks.startMain) hooks.startMain(s);
  if (c.startSide && hooks.startSide) hooks.startSide(s, c.startSide.with === 'actor' && s.eventActor ? labmateById(s, s.eventActor.id)?.name : null);
  if (c.cadence && hooks.shiftCadence) hooks.shiftCadence(s, c.cadence);
  if (c.reveal && hooks.revealHint) result = hooks.revealHint(s) || result;
  if (c.collaborator && hooks.addCollaborator) hooks.addCollaborator(s);
  if (c.jobTrack !== undefined && hooks.jobTrack) hooks.jobTrack(s, c.jobTrack);
  if (c.jobOffers && hooks.jobOffers) result = hooks.jobOffers(s) || result;
  if (c.newAdvisor && hooks.newAdvisor) result = hooks.newAdvisor(s) || result;
  if (c.patent && hooks.openPatent) hooks.openPatent(s);
  if (c.travel) { if (s.flags.travelFunded) { s.flags.travelFunded = false; log(s, t('Travel covered by the lab. You still bring granola bars.')); } else effects(s, { money: -900 }); if (s.player.stats.money < 700) award(s, 'cuisine'); }
  s.cooldowns[e.id] = s.month;
  s.seen[e.id] = (s.seen[e.id] || 0) + 1;
  if (c.minigame) { s.minigame = c.minigame; s.stage = 'minigame'; s.event = null; return; }
  const line = t('{title} — {choice}. {result}', { title: fill(s, e.title), choice: fill(s, c.text), result: fill(s, result) }).trim();
  // Store the ids rather than the prose: the scene catalogs are translated by id, so the
  // line can be rebuilt in whatever language is current when it is read back.
  const ref = { ev: e.id, ch: c.id, r: result && result === c.successText ? 'success' : result && result === c.failureText ? 'failure' : result && result === c.result ? 'result' : null };
  if (!ref.r && result) ref.rt = provenanceOf(result) || undefined;
  log(s, line, false, ref);
  if (s.report) s.report.events.push({ title: fill(s, e.title), choice: fill(s, c.text), result: fill(s, result), category: e.category, i18n: ref, ...(rolled ? { rolled } : {}) });
  s.lastRoll = rolled;
  if (c.appeal) {
    if (success) { s.probation = { since: s.month, until: s.month + 4, acceptedAt: s.counts.accepted, terms: s.probation?.terms || [] }; s.warnings = 2; log(s, t('One more term. The document goes back in the folder, face-down.')); }
    else if (hooks.fired) { hooks.fired(s); return; }
  }
  // A check that can lose the run outright — the removal hearing, and nothing else so far.
  if (c.endingOnFail && success === false) { const en = exitEndings()[c.endingOnFail]; if (en) { finish(s, c.endingOnFail, en[0], en[1]); return; } }
  if (c.ending && c.ending.startsWith('quit_') && hooks.quit) { hooks.quit(s, c.ending.slice(5)); return; }
  if (c.ending === 'fired' && hooks.fired) { hooks.fired(s); return; }
  if (c.ending) {
    const en = exitEndings()[c.ending];
    if (en) { finish(s, c.ending, ...en); return; }
    return;
  }
  // The advisor does not always accept the first answer.
  if (e.category === 'meeting' && !s.pushback && maybePushback(s, c)) return;
  openNext(s);
}
