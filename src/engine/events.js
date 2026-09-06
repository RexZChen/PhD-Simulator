import { events, eventById } from '../data/events.js';
import { pushbacks, hesitationLines } from '../data/minigames.js';
import { t, provenanceOf } from '../i18n/index.js';
import { meetings, meetingById } from '../data/meetings.js';
import { monthOf, isTeachingTerm, isSummer } from '../data/calendar.js';
import { random, roll, clamp, pickWeighted, pick } from './probability.js';
import { effects, log, award, finish, activeProject, absWeek, labmateById, fill, chat, lastName, setTemplateLookup, joined } from './state.js';

export const templateById = { ...eventById, ...meetingById };
setTemplateLookup(id => templateById[id]);
const URGENT = ['burnout', 'conflict', 'industry'];
const cadenceRank = { whenever: 0, monthly: 1, biweekly: 2, weekly: 3 };

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
  }
  if (c.mutator && !s.mutators.includes(c.mutator)) return false;
  if (c.flag && !s.flags[c.flag]) return false;
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
  const list = e.actor.type === 'peer' ? s.peers : s.labmates;
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
export function freshness(s, e) {
  const inRun = s.seen[e.id] || 0;
  const acrossRuns = Number(s.seenBefore?.[e.id]) || 0;
  const historyWeight = acrossRuns ? 1 / (1 + .12 * acrossRuns) : 1.8;
  return (e.weight || 1) * (e.probability || .5) * (1 / (1 + 1.5 * inRun)) * historyWeight;
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
  for (const x of due) if (templateById[x.id] && eligible(s, templateById[x.id], ctx) && !queue.includes(x.id)) queue.push(x.id);
  for (const id of URGENT) if (eligible(s, eventById[id], ctx) && !queue.includes(id)) queue.push(id);
  for (const e of events) if (e.forced && !queue.includes(e.id) && eligible(s, e, ctx)) queue.push(e.id);
  for (const id of s.eventQueue) if (!queue.includes(id)) queue.push(id);
  if (ctx.meetingTemplate && !queue.includes(ctx.meetingTemplate)) queue.push(ctx.meetingTemplate);
  if (ctx.present && eligible(s, eventById.group_present, ctx)) queue.push('group_present');
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
    const e = pickWeighted(s, pool, x => freshness(s, x));
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
  } else s.stage = s.eventReturn || 'plan';
}
export const eventText = (s, e) => fill(s, Array.isArray(e.text) ? e.text[s.eventVariant % e.text.length] : e.text).replace('{draft}', String(Math.round(activeProject(s)?.draft || 0))).replace('{monthsIn}', String(s.month + 1));

function checkValue(s, check) {
  if (check.skill) return s.player.skills[check.skill];
  if (check.stat === 'career') return s.career;
  if (check.stat) return s.player.stats[check.stat];
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
  if (c.check) {
    const val = checkValue(s, c.check);
    success = roll(s, clamp(.5 + (val - c.check.difficulty) / 110, .1, .9));
    effects(s, success ? c.successEffects : c.failureEffects);
    result = success ? (c.successText || t('The conversation goes better than you feared.')) : (c.failureText || t('The system has other plans.'));
  }
  if (c.advisorResponse) {
    const supported = hooks.advisorResponds ? hooks.advisorResponds(s) : roll(s, (s.advisor.caring + s.relationship.trust) / 200);
    effects(s, supported ? { stress: -8, hope: 5, trust: 4 } : { stress: 7, satisfaction: -5 });
    result = supported ? t('Your advisor makes room for you to be human.') : (s.advisorMode?.id === 'checkedOut' || s.advisorMode?.id === 'traveling' ? t('Your advisor does not reply for nine days. Then: “Sounds good.”') : t('Your advisor asks how this affects the deadline.'));
  }
  const conditional = v => v === 'onSuccess' ? success === true : v === 'onFail' ? success === false : !!v;
  for (const [flag, value] of Object.entries(c.flags || {})) {
    if (value === 'onSuccess' || value === 'onFail') { if (conditional(value)) s.flags[flag] = true; }
    else s.flags[flag] = value;
  }
  for (const f of c.followUps || []) if (!s.scheduled.some(x => x.id === f.id)) s.scheduled.push({ id: f.id, week: absWeek(s) + f.delay * 4 });
  if (c.standing) s.standing = clamp((s.standing || 60) + c.standing);
  if (c.personality) s.player.personality[c.personality]++;
  if (c.achievement) award(s, c.achievement);
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
  if (c.target && hooks.setTarget && activeProject(s)) hooks.setTarget(s, activeProject(s), c.target);
  if (c.startMain && hooks.startMain) hooks.startMain(s);
  if (c.startSide && hooks.startSide) hooks.startSide(s, c.startSide.with === 'actor' && s.eventActor ? labmateById(s, s.eventActor.id)?.name : null);
  if (c.cadence && hooks.shiftCadence) hooks.shiftCadence(s, c.cadence);
  if (c.reveal && hooks.revealHint) result = hooks.revealHint(s) || result;
  if (c.collaborator && hooks.addCollaborator) hooks.addCollaborator(s);
  if (c.jobTrack !== undefined && hooks.jobTrack) hooks.jobTrack(s, c.jobTrack);
  if (c.jobOffers && hooks.jobOffers) result = hooks.jobOffers(s) || result;
  if (c.newAdvisor && hooks.newAdvisor) result = hooks.newAdvisor(s) || result;
  if (c.travel) { if (s.flags.travelFunded) { s.flags.travelFunded = false; log(s, t('Travel covered by the lab. You still bring granola bars.')); } else effects(s, { money: -900 }); if (s.player.stats.money < 700) award(s, 'cuisine'); }
  s.cooldowns[e.id] = s.month;
  s.seen[e.id] = (s.seen[e.id] || 0) + 1;
  if (c.minigame) { s.minigame = c.minigame; s.stage = 'minigame'; s.event = null; return; }
  const line = t('{title} — {choice}. {result}', { title: fill(s, e.title), choice: fill(s, c.text), result: fill(s, result) }).trim();
  // Store the ids rather than the prose: the scene catalogs are translated by id, so the
  // line can be rebuilt in whatever language is current when it is read back.
  const ref = { ev: e.id, ch: c.id, r: result && result === c.successText ? 'success' : result && result === c.failureText ? 'failure' : null };
  if (!ref.r && result) ref.rt = provenanceOf(result) || undefined;
  log(s, line, false, ref);
  if (s.report) s.report.events.push({ title: fill(s, e.title), choice: fill(s, c.text), result: fill(s, result), category: e.category, i18n: ref });
  if (c.appeal) {
    if (success) { s.probation = { since: s.month, until: s.month + 4, acceptedAt: s.counts.accepted, terms: s.probation?.terms || [] }; s.warnings = 2; log(s, t('One more term. The document goes back in the folder, face-down.')); }
    else if (hooks.fired) { hooks.fired(s); return; }
  }
  if (c.ending && c.ending.startsWith('quit_') && hooks.quit) { hooks.quit(s, c.ending.slice(5)); return; }
  if (c.ending === 'fired' && hooks.fired) { hooks.fired(s); return; }
  if (c.ending) {
    const endings = { burnout: [t('Burnout Exit'), t('You leave to recover. A life does not need a dissertation to be complete.')], startup: [t('Startup Escape'), t('You leave to build the thing. The pitch deck has your figure on slide 3, uncredited.')], advisor: [t('Advisor Breakdown'), t('The arrangement ended. Your ability did not.')], industry: [t('Industry Escape'), t('Your new employer calls a deadline a deadline. Refreshing.')], master: [t('Mastered Out'), t('You leave with an MS and a different plan. This can be a good ending.')] };
    finish(s, c.ending, ...endings[c.ending]);
    return;
  }
  // The advisor does not always accept the first answer.
  if (e.category === 'meeting' && !s.pushback && maybePushback(s, c)) return;
  openNext(s);
}
