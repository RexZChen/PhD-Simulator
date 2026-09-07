import { requests as requestTemplates, requestById, pushbackLines, declineLines, expireLines } from '../data/requests.js';
import { t } from '../i18n/index.js';
import { asks, askById } from '../data/asks.js';
import { meetings } from '../data/meetings.js';
import { advisorPings, meetingDigests, logLines } from '../data/chatter.js';
import { venues } from '../data/venues.js';
import { monthOf, isTeachingTerm } from '../data/calendar.js';
import { random, roll, clamp, pick, pickFresh, pickWeighted } from './probability.js';
import { effects, log, chat, award, activeProject, absWeek, meetingsPerMonth, lastName, firstName, fill, labmateById, vars } from './state.js';
import { provenanceOf } from '../i18n/index.js';
import { eligible, freshness, pushEvent } from './events.js';

export const MODES = {
  attentive: { label: 'Unusually attentive', requests: 1.5, cancel: .03, ask: .15, presence: 'Active now' },
  normal: { label: 'Reachable', requests: 1, cancel: 0, ask: 0, presence: 'Active today' },
  pressed: { label: 'Deadline mode', requests: 2.2, cancel: .1, ask: -.15, presence: 'Active now · typing…' },
  grant: { label: 'Grant season', requests: 1.3, cancel: .2, ask: -.1, presence: 'Busy' },
  checkedOut: { label: 'Gone quiet', requests: .2, cancel: .5, ask: -.4, presence: 'Last seen 3 weeks ago' },
  traveling: { label: 'Traveling', requests: .4, cancel: .7, ask: -.5, presence: 'Away · time zone unknown' },
};
export const modeOf = s => MODES[s.advisorMode?.id || 'normal'];
const cadenceSteps = ['whenever', 'monthly', 'biweekly', 'weekly'];


// How long since your advisor last saw anything real. A first term is a grace period; after that,
// silence from a student is the loudest thing in their inbox.
export const GRACE_MONTHS = 4;
export function outputDrought(s) {
  const last = Math.max(
    s.lastOutputMonth ?? -99,
    s.milestones?.prelim === 'pass' ? (s.milestones.prelimMonth ?? -99) : -99,
    s.milestones?.proposal === 'pass' ? (s.milestones.proposalMonth ?? -99) : -99,
    s.lastAcceptMonth ?? -99,          // the month a paper landed, not "any time you have one"
  );
  if (s.month < GRACE_MONTHS) return 0;
  return Math.max(0, s.month - Math.max(last, GRACE_MONTHS - 1));
}
export const droughtBand = s => { const d = outputDrought(s); return d >= 9 ? 'severe' : d >= 5 ? 'real' : d >= 3 ? 'noticed' : 'none'; };

export function updateAdvisorMode(s) {
  if (s.advisorMode && s.advisorMode.until > s.month) return;
  const a = s.advisor, m = monthOf(s.month);
  const target = s.projects.find(p => p.targetMonth !== null && p.targetMonth !== undefined && p.targetMonth >= s.month && p.targetMonth - s.month <= 2 && p.status !== 'Submitted');
  const conference = venues.some(v => v.tier === 1 && v.topics.includes(a.topic) && v.conference === m);
  const sabbatical = s.mutators.includes('sabbatical') && s.month >= 12 && s.month <= 17;
  const weights = {
    traveling: .1 + (conference ? .3 : 0) + (a.archetype === 'ghost' ? .15 : a.archetype === 'empire' ? .08 : 0) + (a.availability < 40 ? .08 : 0),
    grant: ([10, 11, 1, 2].includes(m) ? .18 : .05) * (a.funding < 60 ? 1.5 : 1),
    pressed: (target ? .5 : .06) + (a.ambition > 70 ? .12 : 0) + (s.mutators.includes('tenure') ? .15 : 0)
      + { none: 0, noticed: .14, real: .32, severe: .5 }[droughtBand(s)],
    checkedOut: (.06 + (a.availability < 35 ? .22 : 0) + (sabbatical ? .55 : 0) + (s.relationship.satisfaction < 35 ? .1 : 0))
      * ({ none: 1, noticed: .85, real: .6, severe: .4 }[droughtBand(s)]),
    attentive: .1 + (a.caring > 65 ? .1 : 0) + (s.relationship.satisfaction > 70 ? .08 : 0) + (s.month <= 1 ? .2 : 0) + (a.availability > 70 ? .08 : 0),
    normal: .45,
  };
  const id = pickWeighted(s, Object.keys(weights), k => weights[k]) || 'normal';
  const duration = id === 'traveling' ? 1 : id === 'checkedOut' ? 1 + Math.floor(random(s) * 3) : id === 'pressed' ? (target ? target.targetMonth - s.month + 1 : 1) : 1 + Math.floor(random(s) * 2);
  const previous = s.advisorMode?.id;
  s.advisorMode = { id, until: s.month + Math.max(1, duration), since: s.month };
  if (id !== previous && id !== 'normal') {
    const n = lastName(a.name);
    const notes = {
      attentive: t('{name} has started replying within minutes. This is not necessarily good.', { name: n }),
      pressed: t('{name} is in deadline mode. Every message ends with a question mark.', { name: n }),
      grant: t('{name} is writing a grant. Your meetings are now their proofreading sessions.', { name: n }),
      checkedOut: t('{name} has gone quiet. Emails go in; nothing comes out.', { name: n }),
      traveling: t('{name} is traveling. The auto-reply names a city, not a date.', { name: n }),
    };
    log(s, notes[id]);
    if (id === 'traveling') chat(s, 'advisor', a.name, pick(s, [t('Traveling this month. Written updates please.'), t('At a workshop, then another workshop. Send slides if urgent.')]));
    if (id === 'pressed') chat(s, 'advisor', a.name, pick(s, [t('Where are we on the draft? Weekly updates from now on.'), t('Deadline is close. I want to see numbers every week.')]));
  }
}

export function shiftCadence(s, dir) {
  const i = cadenceSteps.indexOf(s.cadence.oneOnOne);
  const next = clamp(i + (dir === 'up' ? 1 : -1), 0, 3);
  s.cadence.oneOnOne = cadenceSteps[next];
  log(s, t('One-on-one meetings are now {cadence}.', { cadence: t(s.cadence.oneOnOne) }));
}

export function revealHint(s) {
  const a = s.advisor;
  const pool = [
    a.caring > 60 ? t('they will actually cover for you if life happens') : a.caring < 40 ? t('they do not ask how you are, and they mean it') : null,
    a.toxicity > 55 ? t('two students left the lab last year and nobody says why') : a.toxicity < 25 ? t('nobody has ever left the lab angry, which is suspicious in a good way') : null,
    a.management > 65 ? t('they keep a spreadsheet of every student’s milestones') : a.management < 35 ? t('they have never finished a project on the original plan') : null,
    a.availability > 65 ? t('they read drafts the same day if you send them before noon') : a.availability < 35 ? t('the trick is to catch them in the hallway; email is a void') : null,
    a.ambition > 75 ? t('they count workshop papers. Out loud.') : null,
  ].filter(Boolean);
  const known = s.advisor.known || [];
  const fresh = pool.filter(x => !known.includes(x));
  if (!fresh.length) return t('You already know everything the lab knows. Which is not everything.');
  const line = pick(s, fresh);
  s.advisor.known = [...known, line];
  return t('You learn that {fact}.', { fact: line });
}

export function reviewLatencyWeeks(s, crunch) {
  const a = s.advisor;
  const mode = s.advisorMode?.id;
  let weeks = Math.ceil((110 - a.availability) / 30) + (mode === 'traveling' ? 3 : mode === 'checkedOut' ? 4 : mode === 'attentive' ? -1 : mode === 'pressed' ? -1 : 0) + (s.relationship.conflict > 60 ? 1 : 0) - (crunch ? 1 : 0);
  return clamp(weeks, 1, 8);
}

export function advisorResponds(s) {
  const mode = s.advisorMode?.id;
  const chance = (s.advisor.caring + s.relationship.trust) / 200 + (mode === 'attentive' ? .15 : mode === 'checkedOut' || mode === 'traveling' ? -.35 : mode === 'pressed' ? -.1 : 0);
  return roll(s, chance);
}

// Monthly one-on-one and group meetings. Returns a digest and which scene, if any, to run.
export function monthlyMeetings(s, ctx) {
  const a = s.advisor;
  const expected = meetingsPerMonth(s.cadence.oneOnOne);
  const cancelChance = clamp((100 - a.availability) / 160 + modeOf(s).cancel * (1 - a.availability / 200), 0, .95);
  let held = 0, cancelled = 0;
  const lines = [];
  for (let i = 0; i < expected; i++) {
    if (roll(s, cancelChance)) { cancelled++; lines.push(t('cancelled ({why})', { why: pickFresh(s, 'meet:cancelled', meetingDigests.cancelled) })); }
    else { held++; lines.push(t('held — {how}', { how: pickFresh(s, 'meet:held', meetingDigests.held) })); }
  }
  s.meetingStats.held += held; s.meetingStats.cancelled += cancelled;
  if (s.meetingStats.cancelled >= 5) award(s, 'ghosted');
  const progressed = s.report?.before ? (activeProject(s)?.progress || 0) > (s.report.before.progress || 0) : true;
  effects(s, { satisfaction: held * (progressed ? 1 : -1), trust: -cancelled, dependency: -cancelled });
  const groupPerMonth = { weekly: 4, biweekly: 2, monthly: 1 }[s.cadence.group] || 0;
  const groupLine = groupPerMonth ? t('{n} group meeting(s) — {how}', { n: groupPerMonth, how: pick(s, meetingDigests.group) }) : t('no group meetings');
  const present = groupPerMonth > 0 && roll(s, groupPerMonth / Math.max(a.labSize, 3) * .9);
  let meetingTemplate = null, cancelledScene = false;
  if (held > 0) meetingTemplate = pickMeeting(s, { ...ctx, cancelled: false });
  else if (expected > 0 && roll(s, .8)) { cancelledScene = true; meetingTemplate = pickMeeting(s, { ...ctx, cancelled: true }); }
  else if (expected === 0 && roll(s, .5)) meetingTemplate = pickMeeting(s, { ...ctx, cancelled: false });
  return { expected, held, cancelled, lines, groupLine, present, meetingTemplate, cancelledScene };
}
export function weeklyMeeting(s, ctx) {
  const chance = { weekly: .4, biweekly: .25, monthly: .12, whenever: 0 }[s.cadence.oneOnOne];
  if (!roll(s, chance)) return { meetingTemplate: null, held: 0, cancelled: 0 };
  const cancelChance = clamp((100 - s.advisor.availability) / 160 + modeOf(s).cancel * (1 - s.advisor.availability / 200), 0, .95);
  if (roll(s, cancelChance)) { s.meetingStats.cancelled++; effects(s, { trust: -1 }); return { meetingTemplate: roll(s, .5) ? pickMeeting(s, { ...ctx, cancelled: true }) : null, held: 0, cancelled: 1 }; }
  s.meetingStats.held++;
  return { meetingTemplate: pickMeeting(s, { ...ctx, cancelled: false }), held: 1, cancelled: 0 };
}
function pickMeeting(s, ctx) {
  const pool = meetings.filter(m => eligible(s, m, ctx) && (!ctx.cancelled || m.conditions.cancelled) && (ctx.cancelled || !m.conditions.cancelled));
  const crunchPool = ctx.crunch ? pool.filter(m => m.conditions.crunch === ctx.crunch.type) : [];
  const m = pickWeighted(s, crunchPool.length ? crunchPool : pool, x => freshness(s, x));
  return m ? m.id : null;
}

// Advisor requests. `weeks` is how much time this turn covers.
export function generateRequests(s, weeks, ctx) {
  const a = s.advisor;
  const open = s.requests.filter(r => r.status === 'open');
  if (open.length >= 3) return;
  const base = .55 * (a.ambition / 60) * (1 + a.toxicity / 150) * modeOf(s).requests * (ctx.crunch ? 1.8 : 1) * (s.pressure > 60 ? 1.4 : 1) * (s.cadence.oneOnOne === 'whenever' ? .6 : 1);
  const chance = clamp(base * weeks / 4, 0, .95);
  if (!roll(s, chance)) return;
  const pool = requestTemplates.filter(t => eligible(s, { id: `req_${t.id}`, conditions: t.conditions, cooldown: 0, prerequisites: null }, ctx) && !open.some(r => r.templateId === t.id) && !(t.conditions.season === 'teaching' && !isTeachingTerm(s.month)));
  const tpl = pickWeighted(s, pool, x => x.weight * (1 / (1 + (s.seen[`req_${x.id}`] || 0))));
  if (!tpl) return;
  s.seen[`req_${tpl.id}`] = (s.seen[`req_${tpl.id}`] || 0) + 1;
  const tone = a.toxicity > 55 ? 'sharp' : s.pressure > 65 ? 'pressed' : 'plain';
  const suffix = tone === 'sharp' ? pick(s, [t(' This is not optional.'), t(' Today.'), '']) : tone === 'pressed' ? pick(s, [t(' Thanks!!'), t(' ASAP.'), '']) : pick(s, ['', t(' Thanks.'), t(' No rush (some rush).')]);
  const body = fill(s, pick(s, tpl.text));
  // Keep the template reference and the tone suffix separately so the ask reads in
  // whatever language is current, not the one it was written in.
  const bodyRef = provenanceOf(body);
  const i18n = bodyRef ? { ...bodyRef, ...(suffix ? { x: provenanceOf(suffix) || undefined } : {}) } : null;
  const req = { id: `req-${absWeek(s)}-${s.requests.length}`, templateId: tpl.id, kind: tpl.kind, text: body + suffix, createdWeek: absWeek(s), dueWeek: absWeek(s) + tpl.due, status: 'open', tone, ...(i18n ? { i18n } : {}) };
  s.requests.push(req);
  chat(s, 'advisor', a.name, req.text, { request: req.id, ...(i18n ? { i18n } : {}) });
  log(s, vars(t(pickFresh(s, 'log:reqNew', logLines.requestArrived)), { name: lastName(a.name), kind: t(tpl.kind), n: tpl.due }));
}
const scaled = (obj, k) => Object.fromEntries(Object.entries(obj || {}).filter(([key]) => key !== 'skill' && key !== 'labBond').map(([key, v]) => [key, Math.round(v * k)]));
function applyReward(s, tpl, k = 1) {
  effects(s, scaled(tpl.reward, k));
  if (tpl.reward?.skill) effects(s, { skill: tpl.reward.skill });
  if (tpl.reward?.labBond) effects(s, { labBond: Math.round(tpl.reward.labBond * k) });
}
function applyPenalty(s, tpl, k = 1) {
  const pen = s.advisor.toxicity > 55 && tpl.toxicPenalty ? tpl.toxicPenalty : tpl.penalty;
  effects(s, scaled(pen, k));
  if (pen?.labBond) effects(s, { labBond: pen.labBond });
}
export function doRequest(s, id, composed = '') {
  const r = s.requests.find(x => x.id === id);
  if (!r || r.status !== 'open') throw new Error(t('That request is no longer open.'));
  const tpl = requestById[r.templateId];
  if (s.player.stats.energy < (tpl.cost.energy || 0)) throw new Error(t('You need {n} Energy for that.', { n: tpl.cost.energy }));
  effects(s, Object.fromEntries(Object.entries(tpl.cost).map(([k, v]) => [k, -v])));
  applyReward(s, tpl);
  r.status = 'done'; s.counts.requestsDone++;
  s.player.personality.peoplePleaser++;
  effects(s, { pressure: -3 });
  chat(s, 'advisor', s.player.name, composed || pick(s, [t('Done — sent.'), t('Sent. Let me know if you want changes (you will).'), t('Attached. Sleeping now.')]), { mine: true });
  chat(s, 'advisor', s.advisor.name, pick(s, [t('Thanks.'), t('Great.'), t('Got it.'), '👍', t('Perfect, one more thing later.')]));
  log(s, t('Did the {kind} request. {name} said thanks, in a way.', { kind: t(r.kind), name: lastName(s.advisor.name) }));
}
export function pushbackRequest(s, id, composed = '') {
  const r = s.requests.find(x => x.id === id);
  if (!r || r.status !== 'open') throw new Error(t('That request is no longer open.'));
  if (r.pushed) throw new Error(t('You already pushed back on this one.'));
  const tpl = requestById[r.templateId];
  const chance = clamp(.45 + (s.player.stats.confidence - 50) * .004 + (s.relationship.trust - 50) * .003 - s.advisor.toxicity * .003 - (s.pressure - 50) * .002, .08, .9);
  r.pushed = true;
  chat(s, 'advisor', s.player.name, composed || pick(s, [t('Could this wait until after the deadline?'), t('I’m at capacity this week — can it be next week?'), t('Is this needed before the meeting, or is it a nice-to-have?')]), { mine: true });
  if (roll(s, chance)) {
    r.status = 'deferred'; applyReward(s, tpl, .5); effects(s, { trust: 3, pressure: -2 });
    s.player.personality.boundarySetter++;
    chat(s, 'advisor', s.advisor.name, t(pick(s, pushbackLines.success)));
    log(s, t('Pushed back on the {kind} request. It worked.', { kind: t(r.kind) }));
  } else {
    effects(s, { conflict: 3, stress: 3 });
    chat(s, 'advisor', s.advisor.name, t(pick(s, pushbackLines.failure)));
    log(s, t('Pushed back on the {kind} request. It did not work. It is still due.', { kind: t(r.kind) }));
  }
}
export function declineRequest(s, id, composed = '') {
  const r = s.requests.find(x => x.id === id);
  if (!r || r.status !== 'open') throw new Error(t('That request is no longer open.'));
  const tpl = requestById[r.templateId];
  r.status = 'declined'; s.counts.requestsDeclined++;
  applyPenalty(s, tpl); s.player.personality.boundarySetter++;
  chat(s, 'advisor', s.player.name, composed || pick(s, [t('I can’t take this on right now.'), t('I’m going to say no to this one — I need the time for the draft.')]), { mine: true });
  chat(s, 'advisor', s.advisor.name, t(pick(s, s.advisor.toxicity > 55 ? declineLines.sharp : declineLines.mild)));
  log(s, t('Declined the {kind} request. {name} noted it.', { kind: t(r.kind), name: lastName(s.advisor.name) }));
}
export function expireRequests(s) {
  const now = absWeek(s);
  for (const r of s.requests) {
    if (r.status !== 'open' || r.dueWeek >= now) continue;
    const tpl = requestById[r.templateId];
    r.status = 'expired'; s.counts.requestsExpired++;
    applyPenalty(s, tpl, 1.3); effects(s, { trust: -3, pressure: 4 });
    if (modeOf(s) !== MODES.checkedOut && modeOf(s) !== MODES.traveling) chat(s, 'advisor', s.advisor.name, t(pick(s, expireLines)));
    log(s, vars(t(pickFresh(s, 'log:reqExpired', logLines.requestExpired)), { kind: t(r.kind) }));
  }
  s.requests = s.requests.filter(r => r.status === 'open' || now - r.createdWeek < 12);
}

export function updatePressure(s) {
  const a = s.advisor;
  const target = s.projects.find(p => p.targetMonth !== null && p.targetMonth !== undefined && p.targetMonth >= s.month && p.targetMonth - s.month <= 2 && p.status !== 'Submitted');
  const open = s.requests.filter(r => r.status === 'open').length;
  const modeDelta = { pressed: 6, attentive: 2, checkedOut: -6, traveling: -4, grant: 1, normal: -2 }[s.advisorMode?.id || 'normal'];
  const delta = (target ? 8 : -3) + (a.ambition - 50) / 10 + open * 2 + modeDelta + (s.mutators.includes('tenure') ? 3 : 0);
  s.pressure = clamp(s.pressure + delta);
  if (s.pressure > 60 && s.report?.before && (activeProject(s)?.progress || 0) <= (s.report.before.progress || 0)) effects(s, { satisfaction: -Math.round((s.pressure - 60) / 10) });
}


// Same memory as the lab channels: an advisor who says the same four things for six years is
// not characterful, only short.
const PING_RECENT = 10;
function freshPing(s, pool) {
  s.saidRecently = s.saidRecently || {};
  const recent = s.saidRecently.advisor || [];
  const unsaid = pool.filter(x => !recent.includes(x));
  const line = pick(s, unsaid.length ? unsaid : pool);
  s.saidRecently.advisor = [...recent, line].slice(-PING_RECENT);
  return line;
}


// A project mature enough to aim, with nothing to aim at. The absence of a deadline is its own
// pressure, and an advisor who keeps asking which venue is a large part of where it comes from.
export function untargetedMonths(s) {
  const p = activeProject(s);
  if (!p || p.kind === 'thesis') return 0;
  if (p.targetVenueId || ['Submitted', 'Rebuttal', 'Accepted', 'Abandoned', 'Ready'].includes(p.status)) { s.untargetedSince = null; return 0; }
  if (p.progress < 35) { s.untargetedSince = null; return 0; }
  if (s.untargetedSince === null || s.untargetedSince === undefined) { s.untargetedSince = s.month; return 0; }
  return Math.max(0, s.month - s.untargetedSince);
}

export function advisorPing(s) {
  const mode = s.advisorMode?.id || 'normal';
  const a = s.advisor;
  let pool = advisorPings.calm;
  let chance = .45;
  // Nagging about a venue takes priority over nagging about silence: there is work, it just has
  // nowhere to go, and that is the more useful conversation.
  const adrift = untargetedMonths(s);
  if (adrift >= 2 && advisorPings.untargeted?.length && roll(s, clamp(.3 + adrift * .1, .3, .8))) {
    chat(s, 'advisor', a.name, fill(s, freshPing(s, advisorPings.untargeted)));
    // Nagging is pressure, not damage. The cost of drifting is that the deadline gets closer,
    // not that the student is ground down by being asked.
    effects(s, { stress: Math.min(4, 1 + adrift), pressure: 3 });
    if (adrift >= 6) effects(s, { satisfaction: -2 });
    return;
  }
  const band = droughtBand(s);
  if (band !== 'none' && advisorPings.drought?.length) {
    // Nothing has arrived in months. They notice, and they say so before they say anything else.
    const droughtChance = { noticed: .45, real: .7, severe: .88 }[band];
    if (roll(s, droughtChance)) {
      chat(s, 'advisor', a.name, fill(s, freshPing(s, band === 'severe' && a.toxicity > 55 ? [...advisorPings.drought, ...advisorPings.toxic] : advisorPings.drought)));
      if (band !== 'noticed') effects(s, { stress: band === 'severe' ? 5 : 3 });
      return;
    }
  }
  // Even a warlord has a tired Tuesday. Without this the harsh archetypes are one note for six
  // years, and the ironic gratitude the game is aiming for has nothing to attach to.
  if (a.toxicity > 55 && advisorPings.thaw?.length && roll(s, .12)) {
    chat(s, 'advisor', a.name, fill(s, freshPing(s, advisorPings.thaw)));
    effects(s, { hope: 4, satisfaction: 2, stress: -3 });
    return;
  }
  if (mode === 'pressed') { pool = a.toxicity > 55 ? [...advisorPings.pressed, ...advisorPings.toxic] : advisorPings.pressed; chance = .8; }
  else if (mode === 'attentive') { pool = advisorPings.calm; chance = .85; }
  else if (mode === 'grant') { pool = advisorPings.busy; chance = .55; }
  else if (mode === 'checkedOut' || mode === 'traveling') { chance = .05; pool = advisorPings.busy; }
  else if (s.pressure > 60) { pool = advisorPings.pressed; chance = .5; }
  if ([12].includes(monthOf(s.month)) && roll(s, .6)) { chat(s, 'advisor', a.name, pick(s, advisorPings.holiday)); return; }
  if (roll(s, chance)) chat(s, 'advisor', a.name, fill(s, freshPing(s, pool)));
}

export function ask(s, id, composed = '') {
  const spec = askById[id];
  if (!spec) throw new Error(t('Unknown request.'));
  if ((s.askCooldowns[id] || 0) > absWeek(s)) throw new Error(t('You asked recently. Give it a few weeks.'));
  const c = spec.conditions || {};
  const p = activeProject(s);
  if (c.maxEnergy !== undefined && s.player.stats.energy > c.maxEnergy) throw new Error(t('You are not sick enough for that, medically speaking.'));
  if (c.notFlag && s.flags[c.notFlag]) throw new Error(t('You already have that.'));
  if (c.hasProject && !p) throw new Error(t('Start a project first.'));
  if (c.noCollaborator && p && p.collaborators.length > 1) throw new Error(t('The project already has a collaborator.'));
  if (c.minCadence && cadenceSteps.indexOf(s.cadence.oneOnOne) < cadenceSteps.indexOf(c.minCadence)) throw new Error(t('Meetings are already rare.'));
  if (c.maxCadence && cadenceSteps.indexOf(s.cadence.oneOnOne) > cadenceSteps.indexOf(c.maxCadence)) throw new Error(t('Meetings are already frequent.'));
  if (s.player.stats.energy < (spec.cost.energy || 0)) throw new Error(t('Not enough Energy.'));
  effects(s, Object.fromEntries(Object.entries(spec.cost).map(([k, v]) => [k, -v])));
  s.askCooldowns[id] = absWeek(s) + spec.cooldown;
  const a = s.advisor, ch = spec.chance;
  let chance = ch.base + (ch.caring || 0) * a.caring + (ch.trust || 0) * s.relationship.trust + (ch.pressure || 0) * s.pressure + (ch.toxicity || 0) * a.toxicity + (ch.funding || 0) * a.funding + (ch.availability || 0) * a.availability + (ch.management || 0) * a.management + (ch.ambition || 0) * a.ambition + (ch.dependency || 0) * s.relationship.dependency + (ch.crunch && s.tempo === 'week' ? ch.crunch : 0) + (ch.freeze && s.mutators.includes('freeze') ? ch.freeze : 0) + modeOf(s).ask;
  chance = ch.base >= 1 ? 1 : clamp(chance, .05, .95);
  chat(s, 'advisor', s.player.name, composed || fill(s, spec.draft || t('Hi — {ask}?', { ask: spec.name })), { mine: true });
  const mode = s.advisorMode?.id;
  const silent = (mode === 'checkedOut' || mode === 'traveling') && spec.id !== 'update' && roll(s, .6);
  const success = !silent && roll(s, chance);
  const branch = success ? spec.success : (spec.failure || spec.success);
  effects(s, branch.effects || {});
  Object.assign(s.flags, branch.flags || {});
  if (branch.award) award(s, branch.award);
  if (Object.keys(s.askCooldowns).filter(k => !k.startsWith('soc:')).length >= 12) award(s, 'askedeverything');
  if (branch.leave) s.leaveWeeks += branch.leave;
  if (branch.cadence) shiftCadence(s, branch.cadence);
  if (branch.personality) s.player.personality[branch.personality]++;
  if (branch.meeting) pushEvent(s, pickMeeting(s, { tempo: s.tempo, crunch: null, cancelled: false }) || 'meet_progress');
  if (branch.collaborator && p) { const mate = pick(s, s.labmates); if (mate && !p.collaborators.includes(mate.name)) { p.collaborators.push(mate.name); mate.bond = clamp(mate.bond + 8); } }
  const reply = silent ? pick(s, [t('(no reply)'), t('(read, no reply)'), t('Auto-reply: I am currently away with limited access to email.')]) : fill(s, pick(s, branch.text));
  chat(s, 'advisor', a.name, reply);
  log(s, `${spec.name}: ${silent ? t('no reply.') : success ? t('yes.') : t('no.')} ${reply}`);
  if (!success && spec.id !== 'update') s.player.personality.boundarySetter++;
  return { success, silent, reply };
}
export const askList = () => asks;

// Replace the advisor with another professor at the same school (the old one left).
export function newAdvisor(s) {
  const candidates = s.advisors.filter(a => a.schoolId === s.program.id && a.id !== s.advisor.id);
  const next = candidates[0] ? structuredClone(candidates[0]) : { ...s.advisor, name: `${firstName(s.advisor.name)} Replacement`, archetype: 'parent', caring: 80, toxicity: 15, availability: 70, ambition: 50, management: 60 };
  const old = s.advisor.name;
  s.advisor = { ...next, known: [] };
  s.relationship = { trust: 40, satisfaction: 55, dependency: 5, conflict: 0 };
  s.advisorMode = { id: 'attentive', until: s.month + 2, since: s.month };
  s.pressure = 25;
  s.requests = s.requests.filter(r => r.status !== 'open');
  s.cadence = { oneOnOne: ['weekly', 'biweekly', 'monthly', 'whenever'][3 - Math.min(3, Math.round(s.advisor.availability / 25))], group: 'weekly' };
  for (const p of s.projects) if (!p.collaborators.includes(s.advisor.name)) p.collaborators.push(s.advisor.name);
  award(s, 'orphaned');
  log(s, t('{old} left. Prof. {name} is your advisor now. The relationship starts over, which is both the bad news and the good news.', { old: lastName(old), name: s.advisor.name }));
  chat(s, 'advisor', s.advisor.name, t('Hi — I know this is a transition. Let’s meet this week and figure out where things are. I have read one of your papers, which is one more than most people.'));
  return t('Your new advisor is Prof. {name}.', { name: s.advisor.name });
}
