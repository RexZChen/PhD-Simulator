// The job search. One application row, one stage enum, and the funnel that already exists in
// market.js made sequential: you find out in March what you did in October.
import { t } from '../i18n/index.js';
import { portals, portalFor, efforts, rejections, stageLines, tells, reactions, DISCLOSE_LINE, SPONSOR_NOTE } from '../data/portals.js';
import { employers, employerById, slateOdds, gateFor, drawWeather } from './market.js';
import { ACADEMIC } from '../data/tracks.js';
import { monthOf } from '../data/calendar.js';
import { random, roll, clamp, pick, shuffle, pickWeighted } from './probability.js';
import { effects, log, message, chat, award, absWeek, lastName, firstName, joined } from './state.js';
import { buildCV } from './epilogue.js';
import { letterGate, needsLetters, letterCount } from './letters.js';

export const STAGES = ['submitted', 'screen', 'onsite', 'offer'];
const TERMINAL = ['rejected', 'ghosted', 'withdrawn'];

export const ensureJobs = s => {
  s.jobs = s.jobs || { track: null, offers: [], chosen: null };
  s.jobs.apps = s.jobs.apps || [];
  if (s.jobs.heat === undefined) s.jobs.heat = 0;
  s.jobs.secret = s.jobs.secret || { disclosed: false, discovered: false, tell: null, reaction: null };
  s.jobs.form = s.jobs.form || { sponsorship: s.player.profile.international ? 'yes' : 'no', touched: false };
  return s.jobs;
};

export const portalOpen = (s, id) => {
  const p = portals[id];
  return !!p && s.phase === 'playing' && s.month >= p.minMonth && p.opens.includes(monthOf(s.month)) && !s.milestones.graduated;
};
export const openPortals = s => Object.keys(portals).filter(id => portalOpen(s, id));



// gateFor() treats "does not sponsor" as a hard block, which is right for the end-of-run
// summary and wrong here: the whole point is that you may apply and be told inside the hour.
export function boardGate(s, e) {
  const g = gateFor(s, e);
  if (g.blocked && sponsorBlocked(s, e) && e.gate !== 'citizen') return { blocked: false, why: '' };
  return g;
}

// A pure, deterministic shuffle key: listingsFor runs on every render and must not consume RNG.
function boardHash(s, id) {
  let h = (s.seed ^ (s.month * 2654435761)) >>> 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h ^ id.charCodeAt(i), 16777619)) >>> 0;
  return h;
}

// What is on a board right now: employers on that portal's tracks you have not already applied to.
export function listingsFor(s, portalId) {
  ensureJobs(s);
  const p = portals[portalId];
  if (!p) return [];
  const applied = new Set(s.jobs.apps.map(a => a.employerId));
  return employers
    .filter(e => p.tracks.includes(e.track) && !e.noSelection && (e.cap ?? 1) > 0 && !applied.has(e.id))
    .map(e => ({ ...e, gate: boardGate(s, e), sponsorBlocked: sponsorBlocked(s, e) }))
    // A board is not sorted by prestige. Order it stably from the seed and the month so it
    // reshuffles as the season moves, without touching the RNG the rest of the run depends on.
    .sort((a, b) => boardHash(s, a.id) - boardHash(s, b.id));
}

// Most postings do not sponsor, and the catalog only marks the handful that say so out loud.
// Derive the rest per employer, per run, deterministically — a posture, not a dice roll.
const SPONSOR_NO_RATE = {
  product_eng: .52, quant: .46, founder: .78, industry_research: .30,
  tenure_track: .26, teaching_faculty: .58, abroad: .20,
  postdoc: .18, soft_money: .28, policy: .55, national_lab: .90, unplaced: 0,
};
export function sponsorPosture(s, e) {
  if (e.gate === 'citizen') return 'federal';       // a different door, closed for a different reason
  if (e.sponsors === false) return 'no';
  const h = boardHash({ seed: s.seed, month: 0 }, e.id) / 4294967296;
  return h < (SPONSOR_NO_RATE[e.track] ?? .4) ? 'no' : 'yes';
}

// The checkbox. If you answer honestly and they do not sponsor, the rest of the file is never read.
export const sponsorBlocked = (s, e) =>
  s.player.profile.international && !s.flags.permanentResident
  && sponsorPosture(s, e) === 'no' && s.jobs?.form?.sponsorship !== 'no';

export function setWorkAuth(s, value) {
  ensureJobs(s);
  if (!s.player.profile.international) throw new Error(t('The question does not apply to you, which is itself the point.'));
  s.jobs.form.sponsorship = value;
  s.jobs.form.touched = true;
  if (value === 'no' && !s.flags.sawTheBox) {
    s.flags.sawTheBox = true;
    log(s, t('You considered answering no. The offer letter has an I-9 clause and the clause is not decorative — it would surface on your first day, in a room, with a folder.'));
  }
  return s.jobs.form;
}

// Apply. The odds are frozen now; the outcome arrives later, which is the only honest way to model it.
export function applyJob(s, employerId, effort = 'standard', quiet = null) {
  ensureJobs(s);
  const e = employerById(employerId);
  if (!e) throw new Error(t('That posting is gone.'));
  const p = portalFor(e.track);
  if (!p || !portalOpen(s, p.id)) throw new Error(t('That board is not open this month.'));
  if (s.jobs.apps.some(a => a.employerId === employerId)) throw new Error(t('You have already applied there.'));
  const eff = efforts[effort] || efforts.standard;
  if (s.player.stats.energy < eff.energy) throw new Error(t('Not enough Energy for an application worth sending.'));
  if (p.needsLetters) {
    const lg = letterGate(s, e.track);
    if (lg.blocked) throw new Error(lg.why);
  }
  const gate = boardGate(s, e);
  if (gate.blocked) throw new Error(gate.why);

  effects(s, { energy: -eff.energy, stress: 1 });
  if (!s.jobs.weather) drawWeather(s);
  const cv = buildCV(s);
  const odds = slateOdds(s, cv, e, 1, effort, 0);
  const isQuiet = quiet === null ? !s.jobs.secret.disclosed : quiet;
  const app = {
    id: `app-${employerId}-${s.month}`, employerId, track: e.track, portal: p.id,
    name: e.name, stage: 'submitted', why: null, month: s.month, effort,
    quiet: isQuiet,
    // The committee draw, made once, frozen, and multiplying every stage. Volume cannot average
    // it away — which is why a perfect file sends thirty applications and lands nothing.
    mood: .35 + random(s) * 1.5,
    odds: { screen: odds.screen, invite: odds.invite, offer: odds.offer },
    nextAt: absWeek(s) + 2 + Math.floor(random(s) * 6),
    history: [{ stage: 'submitted', month: s.month }],
  };

  // The sponsorship rejection is not a delay. It is the same afternoon.
  if (sponsorBlocked(s, e)) {
    app.stage = 'rejected'; app.why = 'sponsorship'; app.nextAt = absWeek(s);
    app.history.push({ stage: 'rejected', month: s.month, why: 'sponsorship' });
    s.jobs.apps.push(app);
    message(s, e.name, t('Regarding your application'), t(pick(s, rejections.sponsorship)), 'browser', 'inbox', null);
    effects(s, { hope: -2 });
    s.jobs.autoRejects = (s.jobs.autoRejects || 0) + 1;
    if (s.jobs.autoRejects === 4) log(s, t('Four of them now, all the same length, all inside the hour. You have started to recognise the shape of the paragraph before you read it.'));
    return app;
  }
  s.jobs.apps.push(app);
  if (isQuiet) s.jobs.heat = clamp(s.jobs.heat + (ACADEMIC.includes(e.track) ? 8 : 3));
  else if (!s.jobs.secret.disclosed) s.jobs.secret.disclosed = true;
  log(s, t('Applied: {name}. {note}', { name: e.name, note: t(p.applyNote) }));
  if (s.jobs.apps.length === 10) award(s, 'tenapps');
  return app;
}

// Every month: advance what is due, accrue heat, and roll for being found out.
export function jobsMonth(s) {
  if (s.phase !== 'playing') return;
  ensureJobs(s);
  const now = absWeek(s);
  for (const a of s.jobs.apps) {
    if (TERMINAL.includes(a.stage) || a.stage === 'offer' || a.nextAt > now) continue;
    advanceApp(s, a);
  }
  // Heat is what your absence adds up to. It decays when there is nothing to notice.
  const openQuiet = s.jobs.apps.filter(a => a.quiet && !TERMINAL.includes(a.stage));
  const live = openQuiet.filter(a => ['screen', 'onsite'].includes(a.stage));
  const target = clamp(openQuiet.length * 3 + live.length * 10
    + (s.advisor.connections > 70 ? 9 : s.advisor.connections > 45 ? 4 : 0)
    + ({ attentive: 7, pressed: 3, normal: 0, grant: -2, traveling: -7, checkedOut: -9 }[s.advisorMode?.id || 'normal'] ?? 0)
    - (s.player.skills.communication - 50) * .06);
  s.jobs.heat = clamp(s.jobs.heat * .72 + target * .28);
  if (!s.jobs.secret.disclosed && !s.jobs.secret.discovered && openQuiet.length && roll(s, clamp(s.jobs.heat / 240, 0, .40))) discovered(s);
}

function advanceApp(s, a) {
  const e = employerById(a.employerId);
  const stage = a.stage;
  const key = stage === 'submitted' ? 'screen' : stage === 'screen' ? 'invite' : 'offer';
  // Later stages are the expensive ones: a campus visit converts far less often than the
  // invitation implies, and the committee's mood applies at every gate, not just the first.
  const narrow = { screen: .85, invite: .80, offer: .75 }[key];
  const p = clamp(a.odds[key] * (a.mood ?? 1) * narrow, .01, .82);

  // Ghosting is not a rejection. It is the absence of one, and it never resolves.
  if (stage === 'submitted' && roll(s, a.effort === 'easy' ? .55 : ACADEMIC.includes(a.track) ? .34 : .30)) {
    if (!roll(s, p)) { a.stage = 'ghosted'; a.history.push({ stage: 'ghosted', month: s.month }); return; }
  }
  if (!roll(s, p)) {
    a.stage = 'rejected';
    a.why = stage === 'submitted' ? (roll(s, .12) ? 'cancelled' : 'form') : stage === 'screen' ? (roll(s, .10) ? 'internal' : 'screen') : 'onsite';
    a.history.push({ stage: 'rejected', month: s.month, why: a.why });
    const body = t(pick(s, rejections[a.why] || rejections.form));
    message(s, e.name, t('Your application'), body, 'browser', 'inbox', null);
    sting(s, a.why);
    return;
  }
  a.stage = stage === 'submitted' ? 'screen' : stage === 'screen' ? 'onsite' : 'offer';
  a.history.push({ stage: a.stage, month: s.month });
  a.nextAt = absWeek(s) + (a.stage === 'onsite' ? 4 + Math.floor(random(s) * 5) : 3 + Math.floor(random(s) * 4));
  if (a.stage === 'offer') {
    a.deadlineMonth = s.month + 1 + Math.floor(random(s) * 2);
    message(s, e.name, t('An offer'), t('We are delighted to offer you the position. {hook} We would like an answer by the end of next month, which is less time than we took to reply to your last email.', { hook: t(e.hook) }), 'browser', 'inbox', null);
    effects(s, { hope: 14, confidence: 10, stress: -4 });
    log(s, t('An offer from {name}. You read it standing up.', { name: e.name }));
    award(s, 'anoffer');
  } else {
    message(s, e.name, t(a.stage === 'screen' ? 'Scheduling a conversation' : 'An invitation to visit'),
      t(pick(s, stageLines[a.stage])), 'browser', 'inbox', null);
    effects(s, { hope: 6, confidence: 4 });
    log(s, t('{name}: through to {stage}.', { name: e.name, stage: t(a.stage === 'screen' ? 'a screen' : 'a campus visit') }));
    if (a.stage === 'onsite') { effects(s, { energy: -14, money: -Math.round(900 + random(s) * 700) }); if (a.quiet) s.jobs.heat = clamp(s.jobs.heat + 14); }
  }
}

// Rejections numb. That is not resilience and the game should not pretend it is.
function sting(s, why) {
  s.jobs.rejects = (s.jobs.rejects || 0) + 1;
  const base = { form: 2, sponsorship: 5, screen: 5, internal: 9, cancelled: 8, onsite: 12 }[why] ?? 4;
  const numb = Math.max(.35, 1 - s.jobs.rejects * .06);
  effects(s, { hope: -Math.round(base * numb), stress: Math.round(base * .5 * numb), confidence: -Math.round(base * .4 * numb) });
  if (s.jobs.rejects === 10) { log(s, t('Ten. You have stopped reading past the first line, which is the line that tells you.')); award(s, 'tenrejections'); }
  if (s.jobs.rejects === 25) log(s, t('Twenty-five. You keep them in a folder now. You are not sure why and you are not going to stop.'));
}

// Being found out. Four reactions, and the one you get is mostly about who they already were.
function discovered(s) {
  const sec = s.jobs.secret;
  sec.discovered = true; sec.discoveredMonth = s.month;
  sec.tell = pickWeighted(s, Object.keys(tells), id => ({
    recruiter: s.jobs.apps.filter(a => ['screen', 'onsite'].includes(a.stage)).length * 3 + s.advisor.connections / 25,
    seminar: s.jobs.apps.filter(a => ACADEMIC.includes(a.track)).length * 3.5,
    labmate: 1 + Math.max(0, 50 - Math.min(60, ...(s.labmates || []).map(l => l.bond), 60)) / 10,
    referee: s.jobs.apps.filter(a => a.stage === 'onsite').length * 2.5,
    calendar: s.meetingStats.cancelled * .5,
    slip: 1,
  }[id] || 1));
  const a = s.advisor, r = s.relationship;
  const score = clamp(50 + (a.caring - 50) * .6 + (r.trust - 50) * .45 + (r.satisfaction - 50) * .25
    - (a.toxicity - 40) * .7 - (a.ambition - 50) * .35 - r.dependency * .25
    + (s.jobs.apps.some(x => x.stage === 'offer') ? 12 : -6)
    + (random(s) * 16 - 8));
  sec.reaction = score >= 62 ? 'ally' : score >= 44 ? 'professional' : score >= 26 ? 'chill' : 'punitive';
  log(s, joined(t(tells[sec.tell]), ' ', t(reactions[sec.reaction])));
  chat(s, 'advisor', s.advisor.name, t(reactions[sec.reaction]));
  const fx = {
    ally: { trust: 4, satisfaction: 2, hope: 6 },
    professional: { satisfaction: -2 },
    chill: { satisfaction: -8, trust: -4, stress: 6 },
    punitive: { satisfaction: -14, trust: -10, conflict: 12, stress: 10 },
  }[sec.reaction];
  effects(s, fx);
  if (sec.reaction === 'chill') s.letterDrag = (s.letterDrag || 0) + 1;
  if (sec.reaction === 'punitive') s.letterDrag = (s.letterDrag || 0) + 2;
  if (sec.reaction === 'ally') award(s, 'toldthem');
}

// Saying it yourself, before the corridor says it for you.
export function discloseSearch(s) {
  ensureJobs(s);
  if (s.jobs.secret.disclosed || s.jobs.secret.discovered) throw new Error(t('They already know.'));
  if (s.month < 30) throw new Error(t('There is nothing to disclose yet.'));
  effects(s, { energy: -3, stress: 6 });
  s.jobs.secret.disclosed = true;
  s.jobs.heat = 0;
  for (const a of s.jobs.apps) a.quiet = false;
  const kind = s.advisor.caring > 55 ? 'ally' : s.advisor.toxicity > 60 ? 'chill' : 'professional';
  s.jobs.secret.reaction = kind;
  log(s, joined(t(DISCLOSE_LINE), ' ', t(reactions[kind])));
  effects(s, kind === 'ally' ? { trust: 6, satisfaction: 4, hope: 8 } : kind === 'chill' ? { satisfaction: -4 } : { satisfaction: 2 });
  award(s, 'saidit');
  return kind;
}

export function withdrawApp(s, appId) {
  ensureJobs(s);
  const a = s.jobs.apps.find(x => x.id === appId);
  if (!a || TERMINAL.includes(a.stage)) throw new Error(t('There is nothing to withdraw.'));
  a.stage = 'withdrawn';
  a.history.push({ stage: 'withdrawn', month: s.month });
  s.jobs.heat = clamp(s.jobs.heat - 14);
  effects(s, { hope: -3 });
  return a;
}

// The tracker. Everything derived, nothing stored twice.
export function funnel(s) {
  const apps = s.jobs?.apps || [];
  const at = st => apps.filter(a => a.history.some(h => h.stage === st)).length;
  return {
    sent: apps.length,
    screens: at('screen'), onsites: at('onsite'), offers: at('offer'),
    rejected: apps.filter(a => a.stage === 'rejected').length,
    silent: apps.filter(a => a.stage === 'ghosted' || (a.stage === 'submitted' && s.month - a.month >= 3)).length,
    auto: apps.filter(a => a.why === 'sponsorship').length,
    live: apps.filter(a => !TERMINAL.includes(a.stage)).length,
  };
}
export const liveOffers = s => (s.jobs?.apps || []).filter(a => a.stage === 'offer' && (a.deadlineMonth ?? 99) >= s.month);
export const heatBand = s => { const h = s.jobs?.heat || 0; return h < 15 ? 'quiet' : h < 35 ? 'noticeable' : h < 60 ? 'obvious' : 'loud'; };
