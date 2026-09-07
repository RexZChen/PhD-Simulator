import { schools, focuses } from '../data/catalog.js';
import { t } from '../i18n/index.js';
import { monthOf, isSummer, nextIndexFor, dateLabel as calLabel } from '../data/calendar.js';
import { chatphdLines, chatphdReplies, advisorPings, logLines } from '../data/chatter.js';
import { repliesFor } from '../data/replies.js';
import { channelActionById } from '../data/social.js';
import { clamp, random, roll, pick, pickFresh } from './probability.js';
import { effects, log, message, sentMail, chat, finish, award, populateLab, activeProject, absWeek, lastName, firstName, editable, fill, joined, TOTAL_MONTHS, vars } from './state.js';
import { scheduleTurnEvents, resolveChoice, hooks, pushEvent, openNext, resolvePushback, hesitate } from './events.js';
import { lectureLines } from '../data/minigames.js';
import { createProject, createThesis, benchSession, clusterSession, canStartMain, canStartSide, syncProject, write, sendAdvisor, skipApproval, submit, processPapers, closeRebuttals, rebut, recycle, preprint, paperQuality, setTarget, clearTarget, venueById, venuesForTopic, canSubmitNow } from './paper.js';
import { patentMonth, openPatent, doPatentMeeting, answerOfficeAction, nextPatentMeeting } from './patent.js';
import { networkMonth, netTalk, netCollab, doCollab, askNetLetter, netIntro, meetContact } from './network.js';
import { updateAdvisorMode, monthlyMeetings, weeklyMeeting, generateRequests, expireRequests, doRequest, pushbackRequest, declineRequest, ask, updatePressure, advisorPing, shiftCadence, revealHint, reviewLatencyWeeks, advisorResponds, newAdvisor } from './advisor.js';
import { monthlyChatter, monthlyMail, fieldNote } from './lab.js';
import { hardTaMonth, onHardTA } from './life.js';
import { maybeSummons, answerSummons, summonsKeep, clearSummons, summonsOpen } from './summons.js';
import { askDoor, doorOptions, obstacleOf } from './stuck.js';
import { monthlyLedger, monthlyLife, vitalsDrift, doLifeAction, visitClinic, payDebt, setBudget, coffee, skipMeal, charge, caffeineState, crisisDue, openCrisis, resolveCrisis, crisisMoveList } from './life.js';
import { popIns, runIns, dayWeather } from '../data/day.js';
import { flowLine as boardFlowLine } from '../data/whiteboard.js';
import { verdicts } from '../data/exams.js';
import { useFixture } from './desk.js';
import { accrueCitations } from './scholar.js';
import { updateStanding, updateQuitPressure, fired, quit, quitBand } from './divergence.js';
import { prepareTrip, resolveVisa, scoreTalk, answerQuestion, spendTripDay, resolveCaught, endTrip, upgradeTrip } from './trip.js';
import { buildCV, generateOffers, startEpilogue, answerBeat, currentBeat } from './epilogue.js';
import { trackEndings } from '../data/endings.js';
import { trackById, ACADEMIC } from '../data/tracks.js';
import { drawWeather, weatherLine, openBoard } from './market.js';
import { beginRevisions, revise, deposit, canDeposit, revisionMonth, revisionsLeft } from './thesis.js';
import { openTimeline, playTimelineMove, canAskTimeline, timelineDrift } from './timeline.js';
import { crunchOf, tempoOf, focusOptions, focusById, crunchSnapshot, milestoneOf, seasonEligible, dayEligible, paceOptions, setPace, DAYS_PER_WEEK } from './time.js';
import { applyInternships, canApplyIntern, openInternTalk, playInternMove, endInternship, ensureIntern, internWindow } from './internship.js';
import { addFunding } from './funding.js';
import { fundingSources } from '../data/fundingSources.js';
import { react, replyTo, sendDm, dmPeople, dmOptions, replyOptionsFor } from './slack.js';
import { askLetter, availableWriters, letterCount, lettersReady, packetStrength, closeLetters, needsLetters } from './letters.js';
import { applyJob, jobsMonth, discloseSearch, withdrawApp, setWorkAuth, listingsFor, openPortals, funnel, liveOffers, ensureJobs } from './jobsearch.js';
import * as applyEngine from './apply.js';

hooks.setTarget = (s, p, mode) => setTarget(s, p, mode);
hooks.startMain = s => { if (canStartMain(s)) createProject(s); };
hooks.startSide = (s, name) => { if (!s.projects.some(p => p.kind === 'side' && !['Accepted', 'Abandoned'].includes(p.status))) createProject(s, { kind: 'side', collaborator: name }); };
hooks.shiftCadence = shiftCadence;
hooks.revealHint = revealHint;
hooks.advisorResponds = advisorResponds;
hooks.jobTrack = (s, track) => {
  s.jobs.track = track;
  s.jobs.declaredMonth = s.month;
  if (!track) { log(s, t('Not this cycle. The ads will be back, in the same fonts.')); return; }
  drawWeather(s);
  openBoard(s);
  const tr = trackById[track];
  log(s, t('On the market: {name}. {weather}', { name: t(tr ? tr.name : track), weather: weatherLine(s) }));
  // Advisors have a house style about this, and the silence is also a style.
  const a = s.advisor;
  const line = { parent: t('Saw a posting that would suit you — the chair there is decent, which matters more than the ranking. Forwarded it.'),
    empire: t('Forwarded you nine postings. Tell me which ones you took, and cc me on the applications.'),
    star: t('Aim high. I will make calls. Do not apply anywhere you would be embarrassed to end up.'),
    warlord: t('The market is the market. If you had listened to me in year three you would have another paper for it.'),
    chaos: t('Oh! Is it that time already. Yes. Right. Send me the statement and I will read it eventually.'),
    ghost: null }[a.archetype];
  if (line) chat(s, 'advisor', a.name, line);
  if (!ACADEMIC.includes(track) && a.ambition > 70) chat(s, 'advisor', a.name, t('I will support whatever you decide. I would be lying if I said I was not disappointed, and you should ignore that entirely.'));
};
hooks.newAdvisor = s => newAdvisor(s);
hooks.openPatent = s => openPatent(s, activeProject(s)?.id);
hooks.fired = s => fired(s);
hooks.conference = (s, p) => { s.pendingTrip = p.id; };
hooks.quit = (s, how) => quit(s, how);
// The market opens before you graduate, so this reads the same file the offers screen will read.
// One scorer: buildCV -> generateOffers. Nothing here decides anything commencement will contradict.
hooks.jobOffers = s => {
  const cv = buildCV(s);
  const market = generateOffers(s, cv);
  s.jobs.preview = { score: cv.score, month: s.month };
  const real = market.filter(o => o.kind !== 'open');
  if (!real.length) {
    effects(s, { hope: -10, stress: 8 });
    log(s, t('No offers this cycle. The emails all began with “after careful consideration.”'));
    return t('Nothing, this cycle. The market is a weather system; you are not the weather.');
  }
  effects(s, { hope: 10, confidence: 8, stress: -6 });
  log(s, t('Offers: {list}.', { list: real.map(o => t(o.name)).join(', ') }));
  return t('You have {list}. You read the emails standing up.', { list: real.map(o => t(o.name)).join(t(' and ')) });
};
hooks.addCollaborator = s => { const p = activeProject(s); const mate = s.labmates.find(l => !p?.collaborators.includes(l.name)); if (p && mate) { p.collaborators.push(mate.name); mate.bond = clamp(mate.bond + 8); } };
// The recruiter path: an unsolicited offer, taken inside an event rather than negotiated.
// Award events record real money against the CV. Kind and source come from the event.
hooks.funding = (s, spec) => {
  const src = fundingSources[spec.source];
  if (!src) return;
  addFunding(s, spec.kind, { source: spec.source, name: src.name, amount: spec.amount ?? src.amount });
};
hooks.acceptInternship = s => {
  const start = nextIndexFor(6, s.month + 1);
  if (start > 22 || s.internship) return;
  s.internship = { start, end: Math.min(23, start + 2), company: s.company, typeId: pick(s, ['sde', 'mle', 'research']), mentor: null, salary: 9000 };
  if (s.player.profile.international) s.scheduled.push({ id: 'cpt', week: absWeek(s) + 4 });
  log(s, t('Internship at {company} confirmed for {from}–{to}. Summer has a salary now.', { company: s.company, from: calLabel(start), to: calLabel(s.internship.end) }));
};

export const prepareRun = s => { if (s.phase === 'prep' && !s.prep) applyEngine.initPrep(s); return s; };
export const admissionChance = applyEngine.admissionChance;
export const applicationCost = applyEngine.applicationCost;
function enroll(s, id) {
  const advisor = s.advisors.find(x => x.id === id);
  if (!advisor || !s.offers.includes(advisor.schoolId)) throw new Error(t('Select an advisor at a school that admitted you.'));
  s.advisor = structuredClone(advisor); s.program = structuredClone(schools.find(x => x.id === advisor.schoolId));
  s.phase = 'playing'; s.stage = 'plan'; s.eventReturn = null; s.month = 0; s.week = 0;
  s.player.stats.energy = Math.max(65, s.player.stats.energy);
  populateLab(s);
  const moving = 650 + Math.round(random(s) * 600);
  effects(s, { money: -moving, hope: 8, stress: 5 });
  const app = s.applications.find(x => x.schoolId === advisor.schoolId);
  if (advisor.fellowship || app?.funding === 'fellowship') { effects(s, { money: 3000 }); s.flags.fellow = true; s.ta = false; }
  if (app?.funding === 'TA') s.flags.extraTA = true;
  log(s, t('Started at {school} with {advisor}. Moving cost ${moving}, plus one lamp you regret.', { school: s.program.name, advisor: lastName(advisor.name), moving }));
  message(s, t('Graduate Studies'), t('Welcome. Please read all 47 attachments.'), t('Welcome to {school}. Your first year includes coursework, a research rotation with {advisor}, and a preliminary examination at the end of year two. {funding} Forms are attached, in a format we no longer support.', { school: s.program.name, advisor: advisor.name, funding: s.ta ? t('You have been assigned a teaching assistantship.') : t('You are supported as a research assistant.') }), 'portal');
  message(s, 'Academic OS', t('Tips for your first month'), t('Choose a plan for the month, then Continue. Things will happen. Respond to them in the window that appears; number keys 1–4 work. Your advisor will message you in Lab Chat — you can also message them from there. Deadlines live in the Calendar and in OpenRegret.'), 'dashboard');
  chat(s, 'advisor', advisor.name, pick(s, [t('Welcome aboard. Let’s find you a project. Something small to start.'), t('Welcome! Read the three papers I attached before we meet. (Six papers.)'), t('Glad you chose us. Group meeting is Wednesdays. Bring a question you actually want answered.')]));
  chat(s, 'general', s.labmates[0].name, t('Welcome {name}! The good printer is on the third floor. The good chair is mine.', { name: s.player.name.split(' ')[0] }));
  chat(s, 'cohort', s.peers[0].name, t('Cohort chat! For complaining, mostly. Also study groups.'));
  monthStart(s, true);
}

function snapshot(s) {
  const p = activeProject(s);
  return { stats: { ...s.player.stats }, stress: s.player.hidden.stress, loneliness: s.player.hidden.loneliness || 0, debt: s.debt || 0, progress: p?.progress || 0, projects: Object.fromEntries(s.projects.map(x => [x.id, { progress: x.progress, draft: x.draft, status: x.status }])), relationship: { ...s.relationship }, coursework: s.coursework, readiness: s.readiness, career: s.career, pressure: s.pressure, achievements: s.achievements.length };
}

function monthStart(s, first = false, intermediate = false) {
  const m = monthOf(s.month);
  if (!first) {
    const interning = s.internship && s.month >= s.internship.start && s.month <= s.internship.end;
    const summerGap = isSummer(s.month) && s.ta && !interning && !s.flags.summerTA && !s.flags.summerCovered;
    monthlyLedger(s);
    if (summerGap && m === 6) log(s, t('Summer funding gap. The stipend has become a suggestion.'));
    if (s.debt > 4000 && !s.flags.debtNoticed) {
      s.flags.debtNoticed = true;
      log(s, t('The card balance passed $4,000. It is not an emergency yet. It is the shape of one.'));
      pushEvent(s, 'money_trouble');
      message(s, t('Bursar’s Office'), t('Your student account'), t('Our records show an outstanding balance and a pattern of late payment. Options are available, including a payment plan and an application for hardship support. Both require forms. One of them requires a meeting.'), 'life', 'inbox', 'surpriseBill');
    }
    if (s.flags.forceLean && s.budget !== 'lean') s.budget = 'lean';
  }
  if (m === 9 || m === 1) {
    s.ta = !s.flags.fellow && (s.advisor.funding < 50 || !!s.flags.extraTA);
    if (s.ta) s.counts.taSemesters = (s.counts.taSemesters || 0) + 1;   // what you taught, not what you are teaching
    if (m === 9) { s.flags.summerTA = false; s.flags.summerCovered = false; }
  }
  if (s.internship && s.month === s.internship.start) { log(s, t('First day at {company}. The badge photo is unflattering, as required.', { company: s.internship.company })); chat(s, 'advisor', s.advisor.name, pick(s, [t('Have a good summer. Keep an eye on the project.'), t('Send me a monthly update from the internship. Monthly.')])); }
  if (s.internship && s.month === s.internship.end + 1) endInternship(s);
  if (!first && monthOf(s.month) === 8 && canApplyIntern(s) && s.month >= 6) {
    message(s, t('Career Services'), t('Summer internship applications are open'), t('Applications for next summer open this month and most of them close before you have finished the semester. A reminder that the decision is not only yours: your advisor has a summer planned too, and it may have you in it.'), 'dashboard', 'inbox', null);
  }
  if (s.burnoutMonths > 0) s.burnoutMonths--;
  if (s.flags.recovery) { s.burnoutMonths = Math.max(0, s.burnoutMonths - 1); s.flags.recovery = false; }
  updateAdvisorMode(s);
  if (!first) { updatePressure(s); advisorPing(s); monthlyChatter(s); monthlyMail(s); monthlyLife(s); accrueCitations(s); updateStanding(s); updateQuitPressure(s); revisionMonth(s); timelineDrift(s); jobsMonth(s); networkMonth(s); patentMonth(s); hardTaMonth(s); }
  // The body does not wait for a convenient month.
  // The window where "I am still not right" is a thing you can say closes; after that it is just
  // how you are now.
  if (s.flags.afterCrisis && s.month - (s.lastCrisisMonth ?? 0) > 4) s.flags.afterCrisis = false;
  if (!first) { const c = crisisDue(s); if (c) openCrisis(s, c); }
  closeRebuttals(s);
  for (const p of s.projects) {
    if (p.targetVenueId && p.targetMonth === s.month - 1 && !['Submitted', 'Rebuttal', 'Accepted', 'Abandoned'].includes(p.status)) {
      s.counts.deadlinesMissed++; s.lastMissed = p.targetVenue;
      log(s, vars(t(pickFresh(s, 'log:missed', logLines.missedDeadline)), { venue: p.targetVenue }));
      clearTarget(s, p);
      if (s.advisor.ambition > 45) { s.activeProjectId = p.id; pushEvent(s, 'missed_deadline'); }
      // A missed deadline costs trust, not only goodwill, and the second one costs more than the
      // first — that is what it is like to be the student who said it would be ready.
      const n = s.counts.deadlinesMissed;
      effects(s, {
        pressure: 10, hope: -5,
        satisfaction: -6 - Math.min(6, (n - 1) * 3),
        trust: -(4 + Math.min(6, (n - 1) * 3)),
        stress: 6 + Math.min(4, (n - 1) * 2),
      });
      s.missedRecently = s.month;
      if (advisorPings.afterMiss?.length) chat(s, 'advisor', s.advisor.name, vars(t(pick(s, advisorPings.afterMiss)), { venue: p.targetVenue || t('it') }));
    }
  }
  if (s.month === 12 && s.player.stats.hope > 60) award(s, 'survivor');
  // Conditional prelim: needs an accepted paper within a year.
  if (s.milestones.prelim === 'conditional' && s.month >= 36) { if (s.counts.accepted >= 1) { s.milestones.prelim = 'pass'; log(s, t('The conditional pass is now a pass. The condition was a paper; the paper exists.')); } else { finish(s, 'master', t('Mastered Out'), t('The conditional pass expired without a paper. You leave with an MS and a body of work that will haunt someone’s related-work section.')); return; } }
  if (s.milestones.prelim === 'conditional' && s.month === 30) message(s, t('Graduate Studies'), t('Reminder: conditional pass'), t('Your preliminary examination result was a conditional pass. The condition (an accepted publication) must be met by the end of August 2031.'), 'portal', 'inbox', 'policies');
  // Year six funding: stipend shrinks unless someone covers it.
  if (s.month >= 60 && s.advisor.funding < 60 && !s.ta && !s.flags.fellow && !s.flags.loan && !s.flags.finishFast) s.flags.fundingGap = true;
  if (intermediate) return;
  s.report = { before: snapshot(s), events: [], focus: null, meetings: null, month: s.month, weeks: [], ledger: s.ledger || null, monthsCovered: 1 };
  // Real movement on a project is something an advisor can see in a meeting, so it counts as
  // output too — not only a draft that was formally sent.
  s.turnStartWork = s.projects.reduce((a, p) => a + (p.progress || 0) + (p.draft || 0), 0);
  beginTurn(s);
  if (s.eventQueue.length) { s.eventReturn = 'plan'; openNext(s); }
}

// Entering the planning stage: refresh papers, tempo, and defaults.
function beginTurn(s) {
  processPapers(s);
  syncProject(s);
  s.crunch = crunchSnapshot(s);
  s.tempo = tempoOf(s);
  const current = activeProject(s);
  if (current && !editable(current)) { const other = s.projects.find(p => editable(p)); if (other) s.activeProjectId = other.id; }
  const options = focusOptions(s);
  if (options.length === 1 && options[0].locked) s.focus = options[0].id;
  else if (!options.some(f => f.id === s.focus && !f.disabled)) s.focus = null;
  s.typed = 0; s.actions = {}; s.needsBegin = false; s.doorScene = null;
  if (s.tempo === 'day') { s.dayActions = s.dayActions || {}; s.dayIndex = s.dayIndex || 0; } else { s.dayIndex = 0; s.dayActions = {}; }
  // An open crisis is a gate on the turn, not a screen you can be pushed off. The body is not
  // optional and neither is this: you answer it before you plan anything else.
  s.stage = s.crisis && !s.crisis.resolved ? 'crisis' : 'plan';
  s.notice = fieldNote(s);
  // A conference month takes over the whole window; open it once the turn is otherwise ready.
  if (s.pendingTrip) {
    const p = s.projects.find(x => x.id === s.pendingTrip);
    s.pendingTrip = null;
    if (p) prepareTrip(s, p);
  }
}

function applyTurn(s) {
  if (s.stage !== 'plan') throw new Error('Finish what is on screen first.');
  const f = focusById(s, s.focus);
  if (!f || f.disabled) throw new Error(s.tempo === 'week' ? t('Choose what this week goes to.') : t('Choose a plan for the month first.'));
  if (s.tempo === 'season' && !seasonEligible(s)) { s.tempo = 'month'; s.report.monthsCovered = 1; }
  if (f.id === 'rest') { s.counts.rested = (s.counts.rested || 0) + 1; if (s.counts.rested >= 9) award(s, 'ninerest'); }
  const tempo = s.tempo, crunch = s.crunch;
  const isDay = tempo === 'day';
  const weeks = isDay ? 1 / DAYS_PER_WEEK : tempo === 'week' ? 1 : tempo === 'season' ? 12 : 4 - s.week;
  expireRequests(s);
  const leave = isDay ? 0 : Math.min(s.leaveWeeks, weeks); s.leaveWeeks -= leave;
  const work = weeks - leave;
  const st = s.player.stats;
  const productivity = clamp((.55 + s.player.skills.research / 150) * (st.energy < 25 ? .55 : 1) * (st.hope < 25 ? .7 : 1) * (s.burnoutMonths > 0 ? .65 : 1) * (s.mutators.includes('drought') && ['ml', 'nlp', 'robotics'].includes(s.player.profile.topic) ? .9 : 1), .2, 1.3);
  // An unscheduled meeting does not cost you its own length; it costs the turn around it.
  const kept = summonsKeep(s);
  const scale = (isDay ? work : tempo === 'week' ? work : tempo === 'season' ? work / 4 * .9 : work / 4) * kept;
  const delta = {};
  for (const [k, v] of Object.entries(f.effects)) delta[k] = v * scale;
  const p = activeProject(s);
  for (const k of ['progress', 'draft', 'evidence', 'writingQuality']) if (delta[k] && delta[k] > 0) delta[k] *= productivity;
  if (p && delta.progress > 0) delta.progress *= 1 - p.scope / 220;
  if (p && f.id === 'research' && p.progress >= 35 && ['Drafting', 'Experiments', 'Prototype'].includes(p.status)) delta.draft = (delta.draft || 0) + 5 * scale;
  if (p && f.id === 'write') delta.progress = (delta.progress || 0) + 4 * scale;
  if (p && (f.id === 'write' || f.id === 'writing') && work > 0) delta.writingQuality = Math.max(1, (s.player.skills.writing + st.energy + s.advisor.management / 3 - s.player.hidden.stress * .6) / 30) * scale * (tempo === 'week' || isDay ? 2 : 1);
  if (p && p.collaborators.length > 1 && delta.progress > 0) delta.progress *= 1.15;
  if (f.id === 'career' && [9, 10, 11].includes(monthOf(s.month))) delta.career = (delta.career || 0) * 1.3;
  if (f.id === 'teach' && !s.ta) delta.money = (delta.money || 0) * .5;
  effects(s, delta);
  clearSummons(s);
  if (leave) { effects(s, { energy: 12 * leave, stress: -10 * leave, hope: 4 * leave }); log(s, leave === weeks ? t('On leave. The laptop stayed closed for a whole week, which counts as a miracle.') : t('A week of leave, then back to it.')); }
  const commute = s.housing.commute * .5, taDrag = s.ta ? .8 : 0, stressDrag = s.player.hidden.stress > 65 ? 1.5 : 0, health = s.flags.resolutionHealth ? .5 : 0, cat = s.flags.cat ? .3 : 0;
  const openRequests = s.requests.filter(r => r.status === 'open').length;
  effects(s, { energy: (3.2 - commute - taDrag - stressDrag + health + cat) * weeks, stress: (-.5 + (s.pressure > 60 ? .5 : 0) + (tempo === 'week' ? 1.5 : 0) + openRequests * .5) * weeks });
  vitalsDrift(s, weeks);
  if (tempo === 'month' && p && s.report?.before && p.progress <= (s.report.before.projects?.[p.id]?.progress ?? 0) && !['Submitted', 'Rebuttal', 'Accepted'].includes(p.status) && f.id !== 'rest') effects(s, { hope: -2 });
  if (st.money < 0) effects(s, { stress: 2 * weeks, hope: -.5 * weeks });
  else if (st.money < 300) effects(s, { stress: 1 * weeks, hope: -.25 * weeks });
  if (f.skill) s.player.skills[f.skill] = clamp(s.player.skills[f.skill] + .15 * work);
  if (f.personality && work > 0) s.player.personality[f.personality]++;
  if (s.player.profile.style === 'collaborative' && (f.id === 'network' || f.id === 'feedback')) effects(s, { trust: 2 });
  if (s.player.personality.boundarySetter >= 5) award(s, 'boundary');
  const ctx = { tempo, crunch, monthsList: tempo === 'season' ? [0, 1, 2].map(i => monthOf(s.month + i)) : null };
  let meetingTemplate = null, present = false;
  if (tempo === 'season') {
    const parts = [0, 1, 2].map(() => monthlyMeetings(s, ctx));
    const mm = { expected: parts.reduce((a, x) => a + x.expected, 0), held: parts.reduce((a, x) => a + x.held, 0), cancelled: parts.reduce((a, x) => a + x.cancelled, 0), lines: parts.flatMap(x => x.lines).slice(0, 6), groupLine: parts[0].groupLine + ' (×3)', present: parts.some(x => x.present), meetingTemplate: parts.map(x => x.meetingTemplate).find(Boolean) || null };
    s.report.meetings = mm; s.report.focus = f.name; s.report.monthsCovered = 3; meetingTemplate = mm.meetingTemplate; present = mm.present;
    for (let i = 0; i < 2; i++) monthlyDrift(s);
    log(s, t('{focus} season ({from}–{to}). {held} of {expected} one-on-ones happened.', { focus: f.name, from: calLabel(s.month), to: calLabel(s.month + 2), held: mm.held, expected: mm.expected }), true);
  } else if (tempo === 'month') {
    const mm = monthlyMeetings(s, ctx);
    s.report.meetings = mm; s.report.focus = f.name; meetingTemplate = mm.meetingTemplate; present = mm.present;
    log(s, t('{focus} month. {held} of {expected} one-on-ones happened.', { focus: f.name, held: mm.held, expected: mm.expected }), true);
  } else if (isDay) {
    s.report.days = s.report.days || [];
    s.report.days.push({ week: s.week + 1, day: (s.dayIndex || 0) + 1, focus: f.name, coffee: s.caffeine?.day || 0, skipped: s.dayMeals || 0 });
    log(s, t('{day}: {focus}.', { day: dayName(s), focus: f.name }), true);
  } else {
    const wm = weeklyMeeting(s, ctx);
    meetingTemplate = wm.meetingTemplate;
    s.report.weeks.push({ week: s.week + 1, focus: f.name, held: wm.held, cancelled: wm.cancelled, leave });
    log(s, t('Week {week}: {focus}.', { week: s.week + 1, focus: f.name }) + (wm.cancelled ? ' ' + t('Meeting cancelled.') : ''), true);
  }
  if (isDay) {
    s.dayIndex = (s.dayIndex || 0) + 1;
    s.dayActions = {}; s.dayMeals = 0;
    if (s.caffeine) { s.caffeine.day = 0; }
    if (s.dayIndex >= DAYS_PER_WEEK) { s.dayIndex = 0; s.week += 1; }
  } else s.week += tempo === 'season' ? 4 : weeks;
  const monthEnded = s.week >= 4;
  if (monthEnded) { s.week = 4; monthlyDrift(s); }
  generateRequests(s, weeks, ctx);
  syncProject(s);
  s.eventReturn = monthEnded ? 'report' : 'plan';
  s.needsBegin = !monthEnded;
  if (isDay && !monthEnded) s.dayNote = pick(s, dayWeather);
  scheduleTurnEvents(s, { ...ctx, meetingTemplate, present, monthEnd: monthEnded });
}

function monthlyDrift(s) {
  const st = s.player.stats;
  st.hope = clamp(st.hope + (60 - st.hope) * .12 - (s.player.hidden.stress > 70 ? 4 : s.player.hidden.stress > 55 ? 2 : 0));
  s.relationship.satisfaction = clamp(s.relationship.satisfaction + (50 - s.relationship.satisfaction) * .05);
  st.confidence = clamp(st.confidence + (55 - st.confidence) * .05);
  if (s.player.hidden.stress > 65) effects(s, { energy: -4 });
  s.exhaustedMonths = st.energy < 25 ? s.exhaustedMonths + 1 : Math.max(0, s.exhaustedMonths - 1);
  s.player.hidden.burnoutRisk = clamp((s.player.hidden.stress - 40) * 1.2 + s.exhaustedMonths * 12);
  if (s.burnoutMonths === 0 && s.player.hidden.burnoutRisk > 50 && roll(s, s.player.hidden.burnoutRisk / 250)) {
    s.burnoutMonths = 3; effects(s, { hope: -8, energy: -8 }); log(s, t(pickFresh(s, 'log:burnout', logLines.burnout)));
  }
  if (s.advisor.ambition > 70 && s.tempo === 'month' && !['research', 'write'].includes(s.focus)) effects(s, { satisfaction: -3 });
  if (s.relationship.satisfaction < 25) effects(s, { conflict: 5 });
  if (s.focus === 'rest' && s.advisor.caring > 65) effects(s, { satisfaction: 3 });
  if (s.flags.moonlighting) effects(s, { energy: -3, money: 300 });
  if (s.flags.therapy) effects(s, { stress: -3, money: -40 });
}

const DAY_NAMES = () => [t('Monday'), t('Tuesday'), t('Wednesday'), t('Thursday'), t('Friday')];
export { paceOptions } from './time.js';
export { doorOptions, obstacleOf } from './stuck.js';
export const dayName = s => DAY_NAMES()[(s.dayIndex || 0) % DAYS_PER_WEEK];
export const daysLeftInWeek = s => DAYS_PER_WEEK - (s.dayIndex || 0);

// Knock on the door. Whether anyone is behind it depends on the month they are having.
function popIn(s) {
  const mode = s.advisorMode?.id;
  const away = ['checkedOut', 'traveling'].includes(mode);
  const chance = clamp(s.advisor.availability / 130 + (mode === 'attentive' ? .25 : mode === 'pressed' ? .1 : mode === 'grant' ? -.1 : 0) - (away ? .9 : 0), .02, .92);
  if (!roll(s, chance)) {
    const miss = pick(s, popIns.absent);
    effects(s, { energy: -1, hope: -1 });
    log(s, t(miss.line));
    s.doorScene = { state: away ? 'dark' : 'closed', stamp: away ? 'AWAY' : 'NOT NOW' };
    return { found: false, line: t(miss.line) };
  }
  const goodOdds = clamp(.35 + (s.advisor.caring - 50) / 180 + (s.relationship.trust - 50) / 220 - (mode === 'pressed' ? .12 : 0) - (s.advisor.toxicity - 40) / 260, .12, .88);
  const set = roll(s, goodOdds) ? popIns.good : popIns.bad;
  const beat = pick(s, set);
  effects(s, { energy: -2, ...beat.effects });
  const p = activeProject(s);
  if (p && beat.quality) p.novelty = clamp(p.novelty + beat.quality * .6);
  s.meetingStats.held++;
  s.doorScene = { state: set === popIns.good ? 'open' : 'ajar', stamp: set === popIns.good ? 'COME IN' : 'MAKE IT QUICK' };
  log(s, joined(t('Popped into {advisor}’s office.', { advisor: lastName(s.advisor.name) }), ' ', fill(s, t(beat.line))));
  return { found: true, line: fill(s, t(beat.line)), good: set === popIns.good };
}

// The corridor, the kettle, the 1 a.m. elevator.
function runInto(s) {
  const pool = s.labmates.filter(l => l.status === 'active' && l.role !== 'phantom');
  const who = pick(s, pool.length ? pool : s.labmates);
  if (!who) throw new Error(t('There is nobody in the building. There is only you and the hum.'));
  const beat = pick(s, runIns);
  s.eventActor = { type: 'labmate', id: who.id };
  const { loneliness, ...rest } = beat.effects || {};
  effects(s, rest);
  if (loneliness) s.player.hidden.loneliness = clamp((s.player.hidden.loneliness || 0) + loneliness);
  if (beat.bond) who.bond = clamp(who.bond + beat.bond);
  const p = activeProject(s);
  if (p && beat.quality) p.evidence = clamp(p.evidence + beat.quality);
  const line = fill(s, t(beat.line)).replace('{labmateFirst}', firstName(who.name));
  chat(s, 'general', who.name, line);
  log(s, line);
  s.eventActor = null;
  return line;
}

// The funding window closes at 72 months. What that means depends on how far you got.
function outOfTime(s) {
  if (s.month < TOTAL_MONTHS - 1) return false;
  if (s.thesis && !s.thesis.deposited) {
    if (s.thesis.done > 0 || s.month - s.thesis.defendedMonth < 3) {
      // You defended and you were working on it. The funding ends; the degree does not.
      s.thesis.deposited = true; s.thesis.depositMonth = s.month; s.thesis.deferred = true;
      s.milestones.graduated = true;
      log(s, t('The funding ends before the revisions do. You finish them in the autumn, unpaid, on a laptop in a different city, and the degree is conferred a term late. Nobody outside this sentence will ever know it was late.'));
      s.cv = buildCV(s); generateOffers(s, s.cv); s.stage = 'commencement'; s.milestoneKind = 'graduation';
      return true;
    }
    finish(s, 'undeposited', t('Defended, Never Deposited'),
      t('You passed. There is a form in a drawer in an office that says so, signed by four people.\n\nThe revisions were three weeks of work and you did not do them, because you had started the job, and because the thing you had been carrying for six years had already been put down and could not be picked back up. This happens to more people than anyone admits, and almost none of them are lazy. They are finished, in the way a runner is finished.\n\nThe university will hold your file for five years. Two of those years from now, on a Tuesday, you will open the document again.'));
    return true;
  }
  return false;
}

function dismissReport(s) {
  if (s.stage !== 'report') throw new Error(t('There is no report open.'));
  const ms = milestoneOf(s);
  if (ms && ms.month === s.month) { s.stage = 'milestone'; s.milestoneKind = ms.kind; log(s, { prelim: t('The committee has assembled. The projector works, which feels like an omen.'), proposal: t('The proposal committee is in the room. One of them brought lunch.'), defense: t('Defense day. The room is booked for two hours. The cake is booked for one.') }[ms.kind]); return; }
  if (outOfTime(s)) return;
  if (s.month >= TOTAL_MONTHS - 1) { finish(s, 'abd', t('All But Dissertation'), t('Six years. The funding ended before the thesis did. You leave with a master’s, a body of work, and a very specific kind of tiredness. Many good careers begin exactly here.')); return; }
  advanceMonths(s, s.report?.monthsCovered || 1);
}
function advanceMonths(s, n) {
  s.report = s.report || {};
  if (s.turnStartWork !== undefined) {
    const now = s.projects.reduce((a, p) => a + (p.progress || 0) + (p.draft || 0), 0);
    if (now - s.turnStartWork >= 8) s.lastOutputMonth = s.month;
  }
  const ledgers = [];
  // The report's baseline has to be taken before the month-start pass, not inside it: monthStart
  // applies the ledger, the missed-deadline penalty and the standing update *before* it snapshots,
  // so every one of those landed in no report at all. At season pace it was three months of them.
  const opening = snapshot(s);
  for (let i = 0; i < n; i++) {
    s.month++; s.week = 0;
    if (s.month >= TOTAL_MONTHS) {
      s.month = TOTAL_MONTHS - 1;
      if (outOfTime(s)) return;
      s.month = TOTAL_MONTHS;
      finish(s, 'abd', t('All But Dissertation'), t('The clock ran out. You leave with a master’s and a body of work.'));
      return;
    }
    const ms = milestoneOf(s);
    const last = i === n - 1 || (ms && ms.month <= s.month + 1);
    monthStart(s, false, !last);
    ledgers.push(s.ledger);
    if (last) break;
  }
  if (s.report) s.report.before = opening;
  if (n > 1) s.report.ledgers = ledgers;
}

export function prelimChance(s, strategy = 'balanced') {
  const best = s.projects.reduce((m, p) => Math.max(m, p.progress * .4 + paperQuality(p) * .6), 0);
  const prep = s.program.structure === 'exam' ? s.coursework * .45 + s.readiness * .55 : s.coursework * .25 + s.readiness * .3 + best * .45;
  const support = (s.relationship.trust + s.relationship.satisfaction) / 2;
  const papers = Math.min(.12, s.counts.accepted * .04);
  return clamp(.1 + best * .003 + prep * .004 + support * .0025 + papers + (s.player.stats.confidence - 50) * .002 - (s.program.difficulty - 60) * .003 + (strategy === 'honest' ? .03 : strategy === 'bold' ? (s.player.stats.confidence - 55) * .002 : 0), .06, .94);
}
export function proposalChance(s) {
  const best = s.projects.reduce((m, p) => Math.max(m, p.progress * .4 + paperQuality(p) * .6), 0);
  const support = (s.relationship.trust + s.relationship.satisfaction) / 2;
  return clamp(.12 + Math.min(.36, s.counts.accepted * .12) + best * .003 + s.readiness * .003 + support * .002 + (s.player.stats.confidence - 50) * .0015 - (s.program.difficulty - 60) * .002, .06, .93);
}
export function defenseChance(s) {
  const thesis = s.projects.find(p => p.kind === 'thesis');
  const support = (s.relationship.trust + s.relationship.satisfaction) / 2;
  return clamp(.3 + Math.min(.4, s.counts.accepted * .12) + (thesis ? paperQuality(thesis) * .003 : 0) + s.readiness * .002 + support * .002 - (s.program.difficulty - 60) * .0015, .1, .96);
}
// The exam performance shifts the odds; it never replaces them. Same principle as papers: a good
// defense can still get revisions and a shaky one can still pass, because the room is four people
// having a day. Bounded at roughly ±0.2 so six years of record still dominate one afternoon.
export function vivaModifier(viva) {
  if (!viva || !viva.tally) return 0;
  const { land = 0, concede = 0, caught = 0, silent = 0, composure = 60, talk, badCop } = viva.tally;
  const answered = land + concede + caught + silent;
  if (!answered) return 0;
  // Conceding is worth real credit — knowing the edge of what you know is what is being examined —
  // but it is worth less than landing it, and silence is worth less than being caught trying.
  const score = (land * 1 + concede * .55 - caught * .8 - silent * 1.1) / answered;
  // The talk is graded too, and lightly: a committee that has just watched you spend forty minutes
  // reaching the results is already in a mood before the first question. Half the weight of the
  // questions, because the questions are the exam and the talk is the day around it.
  let room = 0;
  if (talk) {
    const shown = talk.covered + talk.skipped;
    if (shown) room += ((talk.covered - talk.skipped * .7) / shown) * .07;
    if (talk.how === 'cut') room -= .03;
    if (talk.wasted >= 3) room -= .02;
  }
  if (badCop === 'handled') room += .02;
  if (badCop === 'ignored') room -= .025;
  return Math.max(-.24, Math.min(.24, score * .17 + (composure - 60) * .0011 + room));
}

function milestone(s, kind, strategy) {
  const m = s.milestones;
  const continueAt = () => { s.stage = 'plan'; advanceMonths(s, 1); };
  // Three of the most consequential days of a PhD used to be one click. The room comes first.
  if (['prelim', 'proposal', 'defense'].includes(kind) && strategy !== 'master' && !s.viva) {
    s.viva = { kind, strategy, tally: null };
    s.stage = 'minigame'; s.minigame = 'viva';
    return;
  }
  const viva = s.viva && s.viva.kind === kind ? s.viva : null;
  const room = vivaModifier(viva);
  if (viva?.tally) {
    const { land = 0, concede = 0, caught = 0, silent = 0, talk, badCop, stillness } = viva.tally;
    if (concede >= 3 && caught + silent === 0) award(s, 'saidido');
    if (caught + silent === 0 && land + concede >= 6) award(s, 'heldtheroom');
    // The quiet ones. None of these is announced anywhere and none of them changes the odds much.
    if (stillness === 'total') award(s, 'onechair');
    if (badCop === 'handled') award(s, 'stoppedandanswered');
    if (talk && talk.how === 'clean' && talk.skipped === 0) award(s, 'undertime');
  }
  s.viva = null;
  if (kind === 'prelim') {
    if (!['balanced', 'honest', 'bold', 'master'].includes(strategy)) throw new Error(t('Choose a presentation approach.'));
    if (strategy === 'master') { finish(s, 'master', t('Mastered Out'), t('You choose the MS exit. This is a degree, not an apology.')); return; }
    m.prelimAttempts++;
    const chance = clamp(prelimChance(s, strategy) + room, .04, .96), r = random(s);
    if (r < chance) { m.prelim = 'pass'; award(s, 'prelim'); effects(s, { hope: 12, confidence: 10, stress: -12, academicCapital: 5 }); log(s, t(verdicts.pass.prelim)); log(s, t(pick(s, verdicts.quickCongrats))); log(s, t('Prelim passed. The committee agrees you can keep doing this. Years three to five are now your problem.')); message(s, t('Graduate Studies'), t('Preliminary examination: PASS'), t('Congratulations. You are advanced to candidacy pending the thesis proposal, expected by May 2032. Forms are attached in a format from 2009.'), 'portal', 'inbox', 'prelimPass'); continueAt(); return; }
    if (r < chance + (1 - chance) * .4) { m.prelim = 'conditional'; effects(s, { hope: -4, stress: 6 }); log(s, t('Conditional pass. The committee would like “a little more research maturity,” operationalized as one accepted paper by August 2031.')); message(s, t('Graduate Studies'), t('Preliminary examination: CONDITIONAL PASS'), t('You may continue. Condition: at least one accepted publication by the end of August 2031. Nobody can define research maturity; the committee has decided it looks like a paper.'), 'portal', 'inbox', 'policies'); continueAt(); return; }
    if (m.prelimAttempts < 2 && (s.coursework >= 45 || s.readiness >= 40)) { m.prelim = 'retake'; m.prelimMonth = s.month + 6; effects(s, { hope: -12, confidence: -8, stress: 12 }); log(s, t('Retake. The committee will see you again in {month}. They say this kindly, which is worse.', { month: calLabel(s.month + 6) })); continueAt(); return; }
    finish(s, 'fail', t('Prelim Not Passed'), t('The committee did not pass you. You leave with what you learned and a story you will tell better in ten years.')); return;
  }
  if (kind === 'proposal') {
    if (!['balanced', 'honest', 'bold', 'master'].includes(strategy)) throw new Error(t('Choose an approach.'));
    if (strategy === 'master') { finish(s, 'master', t('Mastered Out'), t('You take the MS and a job. The dissertation you did not write is the best one you ever wrote.')); return; }
    m.proposalAttempts++;
    const chance = clamp(proposalChance(s) + room + (strategy === 'honest' ? .03 : strategy === 'bold' ? (s.player.stats.confidence - 55) * .002 : 0), .04, .96), r = random(s);
    if (r < chance) { m.proposal = 'pass'; award(s, 'candidate'); effects(s, { hope: 10, confidence: 8, stress: -10, academicCapital: 6, dependency: -5 }); log(s, t(verdicts.pass.proposal)); log(s, t(pick(s, verdicts.quickCongrats))); log(s, t('Proposal accepted. You are a candidate. The word means “someone who has not finished,” but with a title.')); continueAt(); return; }
    if (r < chance + (1 - chance) * .45 && m.proposalAttempts < 3) { m.proposal = 'conditional'; m.proposalMonth = s.month + 4; effects(s, { hope: -5, stress: 8 }); log(s, t('Revise and re-present in {month}. The committee wants “a clearer arc.” Arcs are for stories; this is a thesis.', { month: calLabel(s.month + 4) })); continueAt(); return; }
    if (m.proposalAttempts < 2) { m.proposal = 'retake'; m.proposalMonth = s.month + 6; effects(s, { hope: -12, confidence: -8, stress: 12 }); log(s, t('The proposal was not accepted. Again in {month}.', { month: calLabel(s.month + 6) })); continueAt(); return; }
    finish(s, s.coursework >= 55 ? 'master' : 'fail', s.coursework >= 55 ? t('Mastered Out') : t('Proposal Not Accepted'), t('The committee could not see the thesis. You leave with a master’s degree and, eventually, perspective.')); return;
  }
  if (kind === 'defense') {
    if (!['balanced', 'honest', 'bold'].includes(strategy)) throw new Error(t('Choose an approach.'));
    m.defenseAttempts++;
    const chance = clamp(defenseChance(s) + room + (strategy === 'honest' ? .03 : strategy === 'bold' ? (s.player.stats.confidence - 55) * .002 : 0), .04, .96), r = random(s);
    if (r < chance || m.defenseAttempts >= 2) {
      award(s, 'doctor');
      if (s.month < 60) award(s, 'express');
      if (s.month >= TOTAL_MONTHS - 1) award(s, 'sixYears');
      effects(s, { hope: 20, confidence: 15, stress: -20 });
      log(s, t(verdicts.pass.defense));
      // Nobody leaves this one early. Everybody stands for the photograph, in an order they know,
      // and four of the five faces in it have done this about forty times.
      s.photo = { title: t('Somebody produces a phone'), lines: [verdicts.photo.line, verdicts.photo.faces, verdicts.advisorLine, verdicts.photo.after, verdicts.photo.unfinished] };
      log(s, t(verdicts.photo.line));
      log(s, t(verdicts.advisorLine));
      log(s, t(verdicts.photo.unfinished));
      beginRevisions(s);   // you are Doctor. you are also still writing.
      continueAt();
      return;
    }
    m.defense = 'revisions'; m.defenseMonth = Math.min(TOTAL_MONTHS - 1, s.month + 3); effects(s, { hope: -8, stress: 10 }); log(s, t('Major revisions. The committee wants Chapter 4 rewritten and one more experiment. Defense again in {month}.', { month: calLabel(m.defenseMonth) })); continueAt(); return;
  }
  if (kind === 'graduation') {
    const offer = (s.jobs.market || []).find(o => o.kind === strategy);
    if (!offer) throw new Error(t('That offer is not on the table.'));
    s.jobs.chosen = strategy;
    s.jobs.taken = offer;
    const ending = trackEndings[strategy] || trackEndings.unplaced;
    const tr = trackById[strategy];
    finish(s, `phd_${strategy}`, t(ending.title), t(ending.text));
    if (tr && tr.id === 'tenure_track') award(s, 'cycle');
  }
}

export function dispatch(state, action) {
  const s = structuredClone(state), a = action;
  const always = ['READ_MAIL', 'READ_MAIL_ALL', 'READ_CHAT'];
  if (a.type === 'READ_MAIL') { const m = s.inbox.find(x => x.id === a.id); if (m) m.read = true; return s; }
  if (a.type === 'READ_MAIL_ALL') { s.inbox.forEach(m => { if (!a.folder || (m.folder || 'inbox') === a.folder) m.read = true; }); return s; }
  if (a.type === 'READ_CHAT') { s.chatMessages.forEach(m => { if (!a.channel || m.channel === a.channel) m.read = true; }); return s; }
  if (s.event && !['CHOICE', 'PUSHBACK', 'HESITATE', 'LECTURE'].includes(a.type) && !always.includes(a.type)) throw new Error(t('Respond to what is on screen first.'));
  if (a.type === 'CHOICE') { resolveChoice(s, a.id); if (s.phase === 'playing' && s.stage === 'plan' && s.needsBegin) beginTurn(s); return s; }
  if (a.type === 'PUSHBACK') { resolvePushback(s, a.id); if (s.phase === 'playing' && s.stage === 'plan' && s.needsBegin) beginTurn(s); return s; }
  if (a.type === 'HESITATE') { hesitate(s); if (s.phase === 'playing' && s.stage === 'plan' && s.needsBegin) beginTurn(s); return s; }
  if (a.type === 'LECTURE') {
    if (s.stage !== 'minigame' || s.minigame !== 'lecture') throw new Error(t('You are not in a lecture.'));
    const worked = clamp(Number(a.worked) || 0, 0, 40), caught = clamp(Number(a.caught) || 0, 0, 3), attention = clamp(Number(a.attention) || 0, 0, 40);
    const p = activeProject(s);
    effects(s, { draft: worked * .7, progress: worked * .35, coursework: attention * .35, energy: -4, stress: caught * 3 });
    if (caught >= 3) { effects(s, { confidence: -8, coursework: -4, stress: 8 }); log(s, t(lectureLines.caught)); }
    else if (worked >= 14) log(s, t(lectureLines.great));
    else if (worked >= 7) log(s, t(lectureLines.good));
    else log(s, t(lectureLines.poor));
    s.lectureResult = { worked, caught, attention };
    s.minigame = null;
    openNext(s);
    if (s.phase === 'playing' && s.stage === 'plan' && s.needsBegin) beginTurn(s);
    return s;
  }
  if (s.phase === 'prep') {
    if (!s.prep) applyEngine.initPrep(s);
    if (a.type === 'PREP') applyEngine.prepAction(s, a.id, a.target);
    else if (a.type === 'EMAIL') applyEngine.email(s, a.advisorId, a.id);
    else if (a.type === 'STUDENT') applyEngine.askStudentThread(s, a.advisorId, a.id);
    else throw new Error(t('Finish preparing first. December is coming.'));
    return s;
  }
  if (s.phase === 'application') {
    if (a.type === 'APPLY') applyEngine.apply(s, a);
    else if (a.type === 'ADMISSIONS') applyEngine.submitAll(s);
    else if (a.type === 'EMAIL') applyEngine.email(s, a.advisorId, a.id);
    else if (a.type === 'STUDENT') applyEngine.askStudentThread(s, a.advisorId, a.id);
    else throw new Error(t('Finish your applications first.'));
    return s;
  }
  if (s.phase === 'interviews') {
    if (a.type === 'INTERVIEW') applyEngine.interviewAnswer(s, a.schoolId, a.id);
    else if (a.type === 'DECISIONS') applyEngine.decisions(s);
    else throw new Error(t('Decisions arrive in March. Refresh the portal until then.'));
    return s;
  }
  if (s.phase === 'admissions') {
    if (a.type === 'ENROLL') enroll(s, a.id);
    else if (a.type === 'ASK_STUDENT') applyEngine.askStudentVisit(s, a.id);
    else if (a.type === 'VISIT') applyEngine.visit(s, a.advisorId, a.id);
    else if (a.type === 'WAIT_APRIL') applyEngine.waitForApril(s);
    else throw new Error(t('Choose a program and advisor.'));
    return s;
  }
  if (s.stage === 'commencement') {
    if (a.type === 'TAKE_OFFER') {
      const offer = (s.jobs.market || []).find(o => o.kind === a.id);
      if (!offer) throw new Error(t('That offer is not on the table.'));
      startEpilogue(s, a.id);
      return s;
    }
    throw new Error(t('You are graduating. Choose what happens next.'));
  }
  if (s.stage === 'epilogue') {
    if (a.type === 'EPILOGUE') {
      answerBeat(s, a.id);
      if (s.epilogue.finished) {
        const years = 5 + Math.round(random(s) * 4);
        finish(s, `phd_${s.jobs.chosen}`, t('Dr. {name}', { name: s.player.name }),
          t('{years} years later, the degree is a line on a page and everything else it gave you is not. You can read a hard paper and know within ten minutes whether it is true. You can sit with a problem that does not resolve. You know what it costs to find something out, and you are one of a small number of people on earth who has done it.\n\nYou still email {advisor}. Not often. Enough.\n\nA PhD is not for everyone, and nobody should pretend otherwise. It is long, it is underpaid, and it will ask for more than is reasonable. It was also the six years you learned to think. Both of those are true, and you are allowed to keep both.',
            { years, advisor: t('Prof. {name}', { name: lastName(s.advisor.name) }) }));
        s.finalEpilogue = s.epilogue;
      }
      return s;
    }
    throw new Error(t('Read the message. The years are passing either way.'));
  }
  if (s.stage === 'trip') {
    if (a.type === 'TRIP_VISA') { resolveVisa(s, a.id); return s; }
    if (a.type === 'TRIP_TALK') { scoreTalk(s, a.tally || {}); return s; }
    if (a.type === 'TRIP_QA') { answerQuestion(s, a.id); return s; }
    if (a.type === 'TRIP_DAY') { spendTripDay(s, a.id); return s; }
    if (a.type === 'TRIP_CAUGHT') { resolveCaught(s, a.id); return s; }
    if (a.type === 'TRIP_UPGRADE') { upgradeTrip(s, a.id); return s; }
    if (a.type === 'TRIP_END') { endTrip(s); return s; }
    throw new Error(t('You are at a conference. The conference is the thing that is happening.'));
  }
  if (s.phase !== 'playing') throw new Error(t('This run is complete.'));
  if (a.type === 'MAIL_REPLY') {
    const mail = s.inbox.find(x => x.id === a.mailId);
    const set = mail && repliesFor(mail);
    const opt = set && set.options.find(o => o.id === a.id);
    if (!mail || !opt) throw new Error(t('That message cannot be answered.'));
    if (mail.replied) throw new Error(t('You already answered this one.'));
    if (s.player.stats.energy < 1) throw new Error(t('Not enough Energy.'));
    effects(s, opt.effects);
    let outcome = opt.note ? t(opt.note) : '';
    if (opt.check) {
      const val = opt.check.advisor ? s.advisor[opt.check.advisor] : opt.check.skill ? s.player.skills[opt.check.skill] : s.player.stats[opt.check.stat];
      const success = roll(s, clamp(.5 + (val - opt.check.difficulty) / 110, .1, .9));
      effects(s, success ? opt.successEffects : opt.failureEffects);
      outcome = success ? t(opt.successText) : t(opt.failureText);
      for (const [flag, v] of Object.entries(opt.flags || {})) { if (v === 'onSuccess') { if (success) s.flags[flag] = true; } else s.flags[flag] = v; }
    } else {
      for (const [flag, v] of Object.entries(opt.flags || {})) if (v !== 'onSuccess') s.flags[flag] = v;
    }
    if (opt.personality) s.player.personality[opt.personality]++;
    mail.replied = opt.id;
    if (!opt.silent) sentMail(s, mail.sender, `${t('Re:')} ${mail.subject}`, fill(s, opt.draft));
    log(s, outcome ? joined(t('Replied to {sender}: {label}', { sender: mail.sender, label: t(opt.label) }), ' ', outcome) : t('Replied to {sender}: {label}', { sender: mail.sender, label: t(opt.label) }));
    if (outcome) s.mailOutcome = outcome;
    return s;
  }
  if (a.type === 'SELECT_PROJECT') { if (!s.projects.some(p => p.id === a.id)) throw new Error(t('No such project.')); s.activeProjectId = a.id; return s; }
  if (a.type === 'DISMISS_REPORT') { dismissReport(s); return s; }
  if (a.type === 'FIXTURE') { useFixture(s, a.id); return s; }
  if (a.type === 'SUMMONS') {
    if (s.stage !== 'summons') throw new Error(t('There is nothing in the calendar.'));
    answerSummons(s, a.id);
    s.stage = 'plan';
    applyTurn(s);
    if (s.stage === 'plan' && s.needsBegin) beginTurn(s);
    return s;
  }
  if (a.type === 'CRISIS') { if (s.stage !== 'crisis') throw new Error(t('There is nothing to deal with.')); resolveCrisis(s, a.id); if (s.phase === 'playing' && s.stage === 'plan' && s.needsBegin) beginTurn(s); return s; }
  // The room's verdict, carried back from Room 214. Like CRISIS and MILESTONE it has to sit above
  // the "stage must be plan" guard, because the whole point is that you are not on the plan screen.
  if (a.type === 'VIVA') {
    if (s.stage !== 'minigame' || s.minigame !== 'viva' || !s.viva) throw new Error(t('You are not in the room.'));
    s.viva.tally = a.tally || null;
    s.stage = 'milestone'; s.minigame = null;
    milestone(s, s.viva.kind, s.viva.strategy);
    if (s.phase === 'playing' && s.stage === 'plan' && s.needsBegin) beginTurn(s);
    return s;
  }
  if (a.type === 'PRELIM' || a.type === 'MILESTONE') { if (s.stage !== 'milestone') throw new Error(t('The committee is not assembled yet.')); if (a.id === 'master' && s.coursework < 55) throw new Error(t('The MS exit requires 55 coursework progress.')); milestone(s, s.milestoneKind, a.id); if (s.phase === 'playing' && s.stage === 'plan' && s.needsBegin) beginTurn(s); return s; }
  if (s.stage !== 'plan') throw new Error(s.stage === 'report' ? t('Close the monthly report first.') : t('Finish what is on screen first.'));
  if (a.type === 'PLAN') { const f = focusById(s, a.id); if (!f) throw new Error(t('That is not an option right now.')); if (f.disabled) throw new Error(f.disabled); s.focus = a.id; return s; }
  if (a.type === 'CONTINUE') {
    // The interrupt is raised after the plan is chosen and before the turn resolves, which is the
    // whole point of it: everything else happens around your decision, this happens to it.
    if (!s.summons && maybeSummons(s, { crunch: s.crunch })) { s.stage = 'summons'; return s; }
    applyTurn(s);
    if (s.stage === 'plan' && s.needsBegin) beginTurn(s);
    return s;
  }
  const once = id => { if (s.actions[id]) throw new Error(t('You already did that this turn.')); s.actions[id] = true; };
  const p = activeProject(s);
  switch (a.type) {
    case 'START_PROJECT': if (!canStartMain(s)) throw new Error(t('Your main project is still alive. Finish it, submit it, or abandon it first.')); createProject(s); break;
    case 'START_SIDE': if (!canStartSide(s)) throw new Error(t('A side project needs month 5+, a main project past 40%, and no other side project.')); if (s.player.stats.energy < 15) throw new Error(t('Not enough Energy to start something new.')); effects(s, { energy: -5 }); createProject(s, { kind: 'side' }); s.player.personality.independent++; break;
    case 'WRITE': write(s, Number.isFinite(a.amount) ? clamp(a.amount, 1, 5) : 5); break;
    case 'HYPE': if (!p || !['Drafting', 'Experiments'].includes(p.status)) throw new Error(t('Open an active draft first.')); once('hype'); effects(s, { hype: 12, novelty: 3 }); s.player.personality.riskTaker++; log(s, t('Added “a general framework.” The claim is doing some heavy lifting.')); break;
    case 'SEND_ADVISOR': sendAdvisor(s, reviewLatencyWeeks(s, s.crunch)); break;
    case 'SKIP_APPROVAL': if (!(s.tempo === 'week' && s.week >= 2) && !['checkedOut', 'traveling'].includes(s.advisorMode?.id)) throw new Error(t('You can only skip the advisor’s read late in a crunch, or when they are unreachable.')); skipApproval(s); break;
    case 'SET_TARGET': { if (!p || !editable(p) && p.status !== 'Ready') throw new Error(t('Pick an editable project first.')); const v = venueById[a.id]; if (!v || v.rolling || !venuesForTopic(p.topic).includes(v)) throw new Error(t('That venue does not fit this project.')); if (!setTarget(s, p, a.id)) throw new Error(t('No upcoming deadline for that venue within this run.')); break; }
    case 'CLEAR_TARGET': if (!p) throw new Error(t('No project.')); clearTarget(s, p); log(s, t('Target cleared. The deadline still exists; it just isn’t yours.')); break;
    case 'SET_PACE': {
      const note = setPace(s, a.id);
      s.crunch = crunchSnapshot(s); s.tempo = tempoOf(s); s.focus = null;
      if (s.report) s.report.monthsCovered = s.tempo === 'season' ? 3 : 1;
      if (note) log(s, t(note));
      break;
    }
    case 'ZOOM': if (s.week !== 0 || crunchOf(s)) throw new Error(t('You can only zoom in at the start of a calm month.')); s.flags.zoomMonth = s.flags.zoomMonth === s.month ? -1 : s.month; s.crunch = crunchSnapshot(s); s.tempo = tempoOf(s); s.focus = null; log(s, s.tempo === 'week' ? t('Taking this month week by week.') : t('Back to the monthly view.')); break;
    case 'PACE': s.pace = s.pace === 'month' ? 'auto' : 'month'; s.tempo = tempoOf(s); s.report.monthsCovered = s.tempo === 'season' ? 3 : 1; log(s, s.pace === 'month' ? t('Taking it month by month.') : t('Letting calm seasons pass in one step.')); break;
    case 'START_THESIS': if (s.milestones.proposal !== 'pass') throw new Error(t('The dissertation starts after the proposal is accepted.')); if (s.month < 54) throw new Error(t('Too early. The committee expects a dissertation in year five or six; so does your advisor, for different reasons.')); if (s.projects.some(p => p.kind === 'thesis')) throw new Error(t('The dissertation already exists, in the sense that a file exists.')); createThesis(s); break;
    case 'SCHEDULE_DEFENSE': {
      const th = s.projects.find(p => p.kind === 'thesis');
      if (!th || th.status !== 'Ready') throw new Error(t('The committee needs an approved dissertation draft first.'));
      if (s.milestones.defenseMonth !== null && s.milestones.defenseMonth !== undefined) throw new Error(t('The defense is already scheduled.'));
      if (s.relationship.dependency >= 60 && !s.flags.defenseCleared && !s.flags.oneMorePaper) { pushEvent(s, 'one_more_paper'); s.eventReturn = 'plan'; openNext(s); break; }
      const target = s.milestones.targetGradYear || 6;
      const earliest = target === 5 ? 54 : 60;
      if (!s.grad?.settled && s.month < 54) throw new Error(t('Agree a finishing year with your advisor first. Ask them in the PhD Manager.'));
      // Leave room for revisions and the deposit; a defense with no room after it is not a favour.
      // The outer max used to defeat this cap, so a defense booked past month 66 was scheduled
      // anyway and could not possibly finish — the run ended ABD with a passed defense behind it.
      const latest = TOTAL_MONTHS - 5;
      // A cramped defense still beats no defense: refusing to schedule one past month 66 turned
      // a run that sometimes made it into a run that never could.
      s.milestones.defenseMonth = Math.max(s.month + 1, Math.min(latest, Math.max(s.month + 2, earliest)));
      log(s, t('Defense scheduled for {month}. The room has a projector. The projector has opinions.', { month: calLabel(s.milestones.defenseMonth) }));
      message(s, t('Graduate Studies'), t('Dissertation defense scheduled'), t('Your defense is scheduled for {month}. Please submit the formatted dissertation two weeks prior. Margins will be checked by a machine that does not love you.', { month: calLabel(s.milestones.defenseMonth) }), 'portal', 'inbox', 'defenseScheduled');
      break;
    }
    case 'WIZARD': {
      if (p?.status !== 'Ready') throw new Error(t('The manuscript needs advisor approval first.'));
      if (p.wizardStep === 0) { const v = venueById[a.venueId]; if (!v || !venuesForTopic(p.topic).includes(v)) throw new Error(t('Choose a venue that fits the project.')); if (!canSubmitNow(s, v)) throw new Error(t('{venue} is not open this month.', { venue: v.name })); p.venueId = a.venueId; }
      if (p.wizardStep >= 4) throw new Error(t('The checks are already complete.'));
      p.wizardStep++; break;
    }
    case 'SUBMIT': submit(s); break;
    case 'REBUT': rebut(s, a.id); break;
    case 'RECYCLE': recycle(s, a.id); break;
    case 'PREPRINT': preprint(s); break;
    case 'CHATPHD': {
      if (!p || !['title', 'abstract', 'concept', 'experiment', 'rebuttal'].includes(a.id)) throw new Error(t('Choose a ChatPHD request with a project open.'));
      if (a.id === 'rebuttal' ? p.status !== 'Rebuttal' : !editable(p)) throw new Error(t('ChatPHD needs an editable project (or an open rebuttal).'));
      once('chatphd');
      effects(s, { energy: 3, ...({ title: { hype: 6, draft: 3 }, abstract: { draft: 8, writingQuality: 3 }, concept: { readiness: 4 }, experiment: { evidence: 5, progress: 5 }, rebuttal: {} }[a.id]) });
      const wrong = roll(s, .25); if (wrong) effects(s, { hype: 8, reproducibility: -4 });
      if (a.id === 'rebuttal') s.flags.rebuttalBonus = !wrong;
      s.chatphd = pick(s, chatphdLines[a.id]) + (wrong ? t(' (You did not check. You will remember this.)') : t(' (You checked. Two things were wrong. You fixed them.)'));
      log(s, wrong ? t('ChatPHD suggested an impressively confident shortcut. Verification was skipped.') : t('ChatPHD helped you get unstuck. You checked the suggestion before using it.')); break;
    }
    case 'CHATPHD_SAY': {
      const text = String(a.text || '').trim().slice(0, 200);
      if (!text) throw new Error(t('Say something. ChatPHD is listening, in the sense that a search bar listens.'));
      const key = Object.keys(chatphdReplies).find(k => k !== 'default' && text.toLowerCase().includes(k)) || (/\b(hi|hey)\b/i.test(text) ? 'hello' : /\b(thank)/i.test(text) ? 'thanks' : /\?$/.test(text) && text.length < 12 ? 'help' : 'default');
      const reply = pick(s, chatphdReplies[key]);
      s.chatphdLog = [...(s.chatphdLog || []), { from: 'you', text }, { from: 'bot', text: reply }].slice(-14);
      if (key === 'cite' && roll(s, .5)) { effects(s, { hype: 2 }); }
      if (['sleep', 'quit', 'love', 'joke'].includes(key)) effects(s, { stress: -1, hope: 1 });
      break;
    }
    case 'DAY_MODE': {
      if (!s.crunch) throw new Error(t('Day by day only makes sense when something is due.'));
      if (s.tempo === 'day') { s.dayOff = s.month; s.dayMode = null; log(s, t('Back to whole weeks. The days blur again, which is a mercy.')); }
      else { s.dayMode = s.month; s.dayOff = null; s.dayIndex = 0; s.dayActions = {}; log(s, t('Going day by day. Five working days a week, and you will feel every one.')); }
      s.tempo = tempoOf(s); s.focus = null; s.dayNote = pick(s, dayWeather);
      break;
    }
    case 'COFFEE': {
      if (s.tempo !== 'day') throw new Error(t('Coffee is a day-scale intervention.'));
      if ((s.caffeine?.day || 0) >= 6) throw new Error(t('Six cups. No. Go and drink some water and look at a tree.'));
      const r = coffee(s);
      log(s, r.note, true);
      break;
    }
    case 'SKIP_MEAL': {
      if (s.tempo !== 'day') throw new Error(t('You can only skip a meal on a day you are living hour by hour.'));
      if ((s.dayMeals || 0) >= 2) throw new Error(t('You have skipped enough meals today. Eat something.'));
      s.dayMeals = (s.dayMeals || 0) + 1;
      log(s, skipMeal(s), true);
      break;
    }
    case 'POP_IN': {
      if (s.tempo !== 'day') throw new Error(t('Pop-ins happen on days, not months.'));
      once('popin');
      if (s.player.stats.energy < 3) throw new Error(t('Not enough Energy.'));
      s.dayOutcome = popIn(s).line;
      break;
    }
    case 'RUN_INTO': {
      if (s.tempo !== 'day') throw new Error(t('Corridors happen on days.'));
      once('runinto');
      s.dayOutcome = runInto(s);
      break;
    }
    case 'LIFE': { s.lifeOutcome = doLifeAction(s, a.id); break; }
    case 'CLINIC': {
      const r = visitClinic(s, a.id);
      s.lifeOutcome = r.treated.length
        ? t('Treated: {names}. You paid ${you}.', { names: r.treated.join(', '), you: r.you })
        : t('Nothing conclusive, and ${you} lighter.', { you: r.you });
      break;
    }
    case 'BUDGET': setBudget(s, a.id); break;
    case 'REFLECT': {
      if (s.month < 4) throw new Error(t('Too early to know. Give it a term.'));
      once('reflect');
      pushEvent(s, s.flags.consideringLeaving ? 'the_decision' : 'considering_leaving');
      s.eventReturn = 'plan'; openNext(s);
      break;
    }
    case 'PAY_DEBT': payDebt(s, a.amount === 'all' ? s.debt : Number(a.amount) || 0); break;
    case 'ASK_TIMELINE': openTimeline(s); break;
    case 'TIMELINE_MOVE': playTimelineMove(s, a.id); break;
    case 'BENCH': benchSession(s, a.tally); break;
    case 'CLUSTER': clusterSession(s, a.result); break;
    case 'PATENT_MEET': doPatentMeeting(s, a.id); break;
    case 'PATENT_ACTION': answerOfficeAction(s, a.id); break;
    // The whiteboard. Only the earned thing reaches the run; the marks stay in the app.
    case 'BOARD_ERASE': if (a.line) log(s, t(a.line)); break;
    case 'BOARD_FLOW': {
      if (s.flags.boardFlowMonth === s.month) break;
      s.flags.boardFlowMonth = s.month;
      const p = activeProject(s);
      effects(s, { novelty: 5, progress: 4, stress: -6, hope: 3, energy: -1 });
      if (p) p.evidence = clamp((p.evidence || 0) + 2);
      s.counts.boardFlow = (s.counts.boardFlow || 0) + 1;
      log(s, t(boardFlowLine));
      if ((s.counts.boardFlow || 0) >= 3) award(s, 'twentyminutes');
      break;
    }
    case 'STUCK_ASK': askDoor(s, a.id); break;
    case 'NET_TALK': once(`net:${a.id}`); netTalk(s, a.id); break;
    case 'NET_COLLAB': netCollab(s, a.id, a.size); break;
    case 'DO_COLLAB': doCollab(s, a.id); break;
    case 'NET_LETTER': askNetLetter(s, a.id); break;
    case 'NET_INTRO': once(`intro:${a.id}`); netIntro(s, a.id); break;
    case 'REACT': react(s, a.id, a.reaction); break;
    case 'CHAT_REPLY': replyTo(s, a.id, a.kind, a.text || ''); break;
    case 'DM': sendDm(s, a.id, a.opener, a.text || ''); break;
    case 'ASK_LETTER': askLetter(s, a.id); break;
    case 'JOB_APPLY': applyJob(s, a.id, a.effort || 'standard'); break;
    case 'JOB_WITHDRAW': withdrawApp(s, a.id); break;
    case 'JOB_DISCLOSE': discloseSearch(s); break;
    case 'WORK_AUTH': setWorkAuth(s, a.id); break;
    case 'INTERN_APPLY': applyInternships(s); break;
    case 'INTERN_TALK': openInternTalk(s, a.id); break;
    case 'INTERN_MOVE': playInternMove(s, a.id); break;
    case 'REVISE': revise(s, a.id); break;
    case 'DEPOSIT': {
      const r = deposit(s);
      if (r.ok) { s.cv = buildCV(s); generateOffers(s, s.cv); s.stage = 'commencement'; s.milestoneKind = 'graduation'; }
      break;
    }
    case 'PRACTICE': once('practice'); effects(s, { energy: -6, readiness: 8, confidence: 2 }); log(s, t('Practiced explaining the contribution without saying “obviously.”')); break;
    case 'GRANT': once('grant'); if (s.player.stats.money >= 500 || s.flags.emergencyGrant) throw new Error(t('Emergency support is available once, below $500.')); s.flags.emergencyGrant = true; effects(s, { money: 900, energy: -5 }); log(s, t('Emergency support approved. A little breathing room, and a form to confirm you breathed.')); break;
    case 'REQUEST_DO': doRequest(s, a.id, a.text || ''); break;
    case 'REQUEST_PUSH': pushbackRequest(s, a.id, a.text || ''); break;
    case 'REQUEST_DECLINE': declineRequest(s, a.id, a.text || ''); break;
    case 'ASK': { ask(s, a.id, a.text || ''); if (s.eventQueue.length && !s.event) { s.eventReturn = 'plan'; openNext(s); } break; }
    case 'SOCIAL': {
      const act = channelActionById(a.channel, a.id);
      if (!act) throw new Error(t('That is not something you can say here.'));
      if ((s.askCooldowns[`soc:${a.id}`] || 0) > absWeek(s)) throw new Error(t('You said that recently. Give it a few weeks.'));
      if (s.player.stats.energy < (act.cost?.energy || 0)) throw new Error(t('Not enough Energy.'));
      effects(s, Object.fromEntries(Object.entries(act.cost || {}).map(([k, v]) => [k, -v])));
      const { labBond, peerBond, ...rest } = act.effects || {};
      effects(s, rest);
      if (labBond) effects(s, { labBond });
      if (peerBond) for (const pr of s.peers) pr.bond = clamp(pr.bond + peerBond);
      if (act.personality) s.player.personality[act.personality]++;
      s.askCooldowns[`soc:${a.id}`] = absWeek(s) + act.cooldown;
      chat(s, a.channel, s.player.name, a.text || fill(s, t(act.draft)), { mine: true });
      const responder = a.channel === 'general' ? pick(s, s.labmates.filter(l => l.status === 'active')) : pick(s, s.peers.filter(pr => pr.status === 'active'));
      const line = t(act.reply());
      if (responder) chat(s, a.channel, responder.name, line);
      log(s, t('Posted in #{channel}. {line}', { channel: a.channel, line }));
      break;
    }
    default: throw new Error(t('Unknown game action.'));
  }
  syncProject(s);
  return s;
}
export { crunchOf, tempoOf, focusOptions, canStartMain, canStartSide };
