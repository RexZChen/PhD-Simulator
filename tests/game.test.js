import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, populateLab } from '../src/engine/state.js';
import { dispatch, prelimChance, focusOptions } from '../src/engine/game.js';
import { admissionChance } from '../src/engine/apply.js';
import { schools, mutators } from '../src/data/catalog.js';
import { venues, venueReferences, nextDeadline, timelineFor, acceptsThisMonth } from '../src/data/venues.js';
import { monthOf, dateLabel, holidays } from '../src/data/calendar.js';
import { events, eventById } from '../src/data/events.js';
import { meetings } from '../src/data/meetings.js';
import { requests } from '../src/data/requests.js';
import { asks } from '../src/data/asks.js';
import { templateById, eligible, freshness } from '../src/engine/events.js';
import { createProject, acceptanceChance, setTarget } from '../src/engine/paper.js';
import { loadSave, saveRun, validRun, emptyMeta } from '../src/engine/save.js';
import { memeFor, memeArt } from '../src/data/memes.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { t } from '../src/i18n/index.js';
import { emailFollowUps, visitQuestions } from '../src/data/threads.js';

function resolveAll(state) {
  while (state.event) {
    const e = templateById[state.event];
    const ok = e.choices.find(c => !c.ending && !(c.requiresCoursework && state.coursework < c.requiresCoursework)) || e.choices[0];
    state = dispatch(state, { type: 'CHOICE', id: ok.id });
  }
  return state;
}
const act = (s, a) => resolveAll(dispatch(s, a));

function enterProgram(seed = 1) {
  let s = createRun(seed, { background: 'masters', topic: 'systems', international: false });
  s = act(s, { type: 'PREP', id: 'sop_draft' });
  s = act(s, { type: 'PREP', id: 'letter_ask', target: 'rec-0' });
  s = act(s, { type: 'PREP', id: 'proceed' });
  for (const school of schools.slice(8, 22)) {
    if (s.player.stats.energy < 3 || s.player.stats.money < 75) break;
    s = act(s, { type: 'APPLY', schoolId: school.id, effort: 'generic', contact: false, poiId: s.advisors.find(a => a.schoolId === school.id).id });
  }
  s = act(s, { type: 'ADMISSIONS' });
  for (const app of s.applications.filter(a => a.interview)) for (const id of ['honest', 'sleep', 'style']) s = act(s, { type: 'INTERVIEW', schoolId: app.schoolId, id });
  s = act(s, { type: 'DECISIONS' });
  if (!s.offers.length && s.applications.some(a => a.waitlisted)) s = act(s, { type: 'WAIT_APRIL' });
  assert.ok(s.offers.length > 0, `seed ${seed} should have at least one offer`);
  const advisor = s.advisors.find(item => item.schoolId === s.offers[0]);
  return act(s, { type: 'ENROLL', id: advisor.id });
}

test('seeded applicant generation is reproducible and fictional names are assembled', () => {
  const one = createRun(971, { background: 'industry', topic: 'hci' });
  const two = createRun(971, { background: 'industry', topic: 'hci' });
  assert.deepEqual(one, two);
  assert.equal(one.advisors.length, schools.length * 2);
  assert.ok(one.advisors.every(a => /^[A-Z][a-z]+ [A-Z]/.test(a.name)));
});

test('academic calendar starts September 2028 and knows its holidays', () => {
  assert.equal(dateLabel(0), 'September 2028');
  assert.equal(dateLabel(23), 'August 2030');
  assert.equal(monthOf(4), 1);
  assert.ok(holidays(2).some(h => h.name === 'Thanksgiving'));
});

test('venue deadlines follow real annual cycles', () => {
  const neurips = venues.find(v => v.id === 'neuripsy');
  const at = nextDeadline(neurips, 0, monthOf);
  assert.equal(dateLabel(at), 'May 2029');
  const tl = timelineFor(neurips, at, monthOf);
  assert.equal(dateLabel(tl.decision), 'September 2029');
  assert.equal(dateLabel(tl.conference), 'December 2029');
  assert.equal(acceptsThisMonth(neurips, at, monthOf), true);
  assert.equal(acceptsThisMonth(neurips, at + 1, monthOf), false);
  const workshop = venues.find(v => v.id === 'workshop');
  assert.equal(acceptsThisMonth(workshop, 3, monthOf), true);
  assert.equal(venues.find(v => v.id === 'aaaight').deadlines[0], 7);
  assert.equal(venues.find(v => v.id === 'uisted').deadlines[0], 3);
  assert.equal(venues.find(v => v.id === 'cscwhy').rolling, true);
  assert.match(venueReferences.NeurIPS.source, /^https:\/\//);
  assert.equal(venueReferences.OSDI.submitted, '2025-12-11');
});

test('Simplified Chinese preserves gameplay fields in translated content', () => {
  const selector = visitQuestions[0].select;
  setAppLanguage('zh');
  assert.equal(t('New applicant'), '新申请者');
  assert.match(t('Welcome to the US CS PhD Simulator Setup Wizard'), /博士模拟器/);
  assert.equal(typeof visitQuestions[0].select, 'function');
  assert.equal(visitQuestions[0].select, selector);
  assert.deepEqual(emailFollowUps.call.map(choice => [choice.id, choice.cost]), [['call_yes', 4], ['call_no', 0]]);
  let s = createRun(92, { background: 'masters', topic: 'systems' });
  s = dispatch(s, { type: 'PREP', id: 'sop_draft' });
  const advisor = s.advisors[0];
  s.threads[`${advisor.id}:email`] = { kind: 'email', advisorId: advisor.id, schoolId: advisor.schoolId, messages: [], stage: 1, followUp: 'call', done: false };
  const energy = s.player.stats.energy;
  s = dispatch(s, { type: 'EMAIL', advisorId: advisor.id, id: 'call_yes' });
  assert.equal(s.player.stats.energy, energy - 4);
  assert.equal(s.threads[`${advisor.id}:email`].done, true);
  setAppLanguage('en');
  assert.equal(t('New applicant'), 'New applicant');
  assert.equal(typeof visitQuestions[0].select, 'function');
});

test('cross-run freshness favors rare events after the whole catalog has been seen', () => {
  const s = { seen: {}, seenBefore: { common: 40, rare: 2 } };
  const base = { weight: 1, probability: .5 };
  assert.ok(freshness(s, { ...base, id: 'unseen' }) > freshness(s, { ...base, id: 'rare' }));
  assert.ok(freshness(s, { ...base, id: 'rare' }) > freshness(s, { ...base, id: 'common' }));
  s.seen.rare = 2;
  assert.ok(freshness(s, { ...base, id: 'rare' }) < freshness({ seen: {}, seenBefore: s.seenBefore }, { ...base, id: 'rare' }));
});

test('application preparation, interviews, and decisions form a coherent phase machine', () => {
  let s = createRun(44, { background: 'masters', topic: 'systems' });
  assert.equal(s.phase, 'prep');
  s = act(s, { type: 'PREP', id: 'sop_draft' });
  assert.ok(s.prep.sop > 20);
  assert.throws(() => dispatch(s, { type: 'PREP', id: 'sop_draft' }), /drafted/);
  const matching = schools.find(school => school.topics[0] === 'systems');
  const mismatch = schools.find(school => !school.topics.includes('systems'));
  s = act(s, { type: 'PREP', id: 'letter_ask', target: 'rec-0' });
  s = act(s, { type: 'PREP', id: 'proceed' });
  assert.equal(s.phase, 'application');
  assert.ok(admissionChance(s, matching, { effort: 'tailored' }) > admissionChance(s, mismatch, { effort: 'generic' }));
  const before = structuredClone(s.player.stats);
  s = act(s, { type: 'APPLY', schoolId: matching.id, effort: 'tailored', contact: false, poiId: s.advisors.find(a => a.schoolId === matching.id).id });
  assert.ok(s.player.stats.money <= before.money - 75, 'the application fee was charged');
  assert.ok(s.player.stats.energy <= before.energy - 7, 'a tailored application costs energy');
  s = act(s, { type: 'ADMISSIONS' });
  assert.equal(s.phase, 'interviews');
  assert.throws(() => dispatch(s, { type: 'ENROLL', id: 'x' }), /March/);
});

test('emails to prospective advisors produce a thread with a reply', () => {
  let s = createRun(5, { background: 'masters', topic: 'nlp' });
  const advisor = s.advisors[0];
  s = act(s, { type: 'EMAIL', advisorId: advisor.id, id: 'generic' });
  const thread = s.threads[`${advisor.id}:email`];
  assert.equal(thread.messages[0].from, 'you');
  assert.equal(thread.messages.length, 2);
});

test('the monthly loop enters play, resolves a month, and shows a report', () => {
  let s = enterProgram(1);
  assert.equal(s.phase, 'playing');
  assert.equal(s.stage, 'plan');
  assert.equal(s.tempo, 'month');
  assert.ok(s.labmates.length >= 2 && s.peers.length === 3);
  assert.equal(s.mutators.length, 2);
  s = act(s, { type: 'PLAN', id: 'research' });
  s = act(s, { type: 'START_PROJECT' });
  assert.throws(() => dispatch(s, { type: 'START_PROJECT' }), /still alive/);
  s = act(s, { type: 'CONTINUE' });
  assert.equal(s.stage, 'report');
  assert.ok(s.report.meetings, 'monthly meetings digest exists');
  s = act(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.month, 1);
  assert.equal(s.stage, 'plan');
  assert.equal(s.focus, 'research', 'the plan persists between calm months');
});

test('deadline months switch to weekly tempo and back after submission', () => {
  let s = enterProgram(1);
  s = act(s, { type: 'PLAN', id: 'research' });
  s = act(s, { type: 'START_PROJECT' });
  const p = s.projects[0];
  const venue = venues.find(v => v.topics.includes(p.topic) && !v.rolling);
  const at = nextDeadline(venue, 1, monthOf);
  s = act(s, { type: 'SET_TARGET', id: venue.id });
  assert.equal(s.projects[0].targetMonth, at);
  // Fast-forward to the deadline month via the public loop.
  let guard = 0;
  while (s.month < at && guard++ < 60) {
    if (!s.focus) s = act(s, { type: 'PLAN', id: focusOptions(s).find(f => !f.disabled).id });
    s = act(s, { type: 'CONTINUE' });
    if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' });
  }
  assert.equal(s.month, at);
  assert.equal(s.tempo, 'week');
  assert.ok(focusOptions(s).some(f => f.id === 'writing'), 'sprint actions replace monthly plans');
});

test('advisor requests can be done, pushed back on, or declined, and expire otherwise', () => {
  let s = enterProgram(2);
  s.requests.push({ id: 'req-test', templateId: 'figure', kind: 'figure', text: 'Remake figure 2.', createdWeek: 0, dueWeek: 1, status: 'open', tone: 'plain' });
  const done = dispatch(s, { type: 'REQUEST_DO', id: 'req-test' });
  assert.equal(done.requests.find(r => r.id === 'req-test').status, 'done');
  const declined = dispatch(s, { type: 'REQUEST_DECLINE', id: 'req-test' });
  assert.equal(declined.requests.find(r => r.id === 'req-test').status, 'declined');
  assert.ok(declined.relationship.satisfaction < s.relationship.satisfaction);
  s = act(s, { type: 'PLAN', id: 'research' });
  s.requests[0].dueWeek = -1;
  s = act(s, { type: 'CONTINUE' });
  assert.equal(s.requests.find(r => r.id === 'req-test').status, 'expired');
});

test('asking the advisor respects cooldowns and produces a reply', () => {
  let s = enterProgram(3);
  s = act(s, { type: 'ASK', id: 'update' });
  assert.ok(s.chatMessages.some(m => m.channel === 'advisor' && m.mine));
  assert.throws(() => dispatch(s, { type: 'ASK', id: 'update' }), /recently/);
});

test('content catalogs are large, well-formed, and every scene has a meme card', () => {
  assert.ok(events.length >= 120);
  assert.ok(meetings.length >= 18);
  assert.ok(requests.length >= 12 && asks.length >= 10);
  for (const category of ['application', 'research', 'advisor', 'life', 'department', 'review', 'holiday', 'lab', 'peer', 'crunch', 'career']) assert.ok(events.some(e => e.category === category), `missing ${category}`);
  for (const e of [...events, ...meetings]) {
    assert.ok(e.choices.length >= 1 && e.choices.length <= 6, `${e.id} choice count`);
    assert.ok(e.choices.length <= 4 || e.id === 'job_market' || e.id === 'the_decision', `${e.id} has more than four choices, which only the declaration scenes may`);
    assert.ok(memeArt[memeFor(e).art], `${e.id} meme art`);
    for (const c of e.choices) assert.ok(c.text && c.hint !== undefined, `${e.id}/${c.id} text`);
  }
  assert.ok(events.some(e => e.choices.some(c => c.followUps?.length)));
  assert.ok(schools.length >= 20 && mutators.length >= 10);
});

test('typing changes draft progress without directly changing quality', () => {
  let s = enterProgram(1);
  s = act(s, { type: 'PLAN', id: 'write' });
  s = act(s, { type: 'START_PROJECT' });
  s.projects[0].progress = 45;
  s.projects[0].status = 'Experiments';
  const quality = s.projects[0].writingQuality;
  s = dispatch(s, { type: 'WRITE', amount: 1 });
  assert.equal(s.projects[0].draft, 1);
  assert.equal(s.projects[0].writingQuality, quality);
});

test('paper and prelim probabilities reward preparation without guarantees', () => {
  const s = enterProgram(1);
  createProject(s);
  const reviewers = [{ score: 7 }, { score: 7 }, { score: 7 }];
  const workshop = venues.find(v => v.id === 'workshop');
  const weak = { ...s.projects[0], novelty: 20, evidence: 20, writingQuality: 20, reproducibility: 20, technicalDepth: 20 };
  const strong = { ...s.projects[0], novelty: 90, evidence: 90, writingQuality: 90, reproducibility: 90, technicalDepth: 90 };
  assert.ok(acceptanceChance(strong, workshop, reviewers) > acceptanceChance(weak, workshop, reviewers));
  assert.ok(acceptanceChance(strong, workshop, reviewers) < 1);
  const early = prelimChance(s);
  s.projects[0].progress = 90; s.coursework = 90; s.readiness = 90; s.relationship.trust = 90; s.relationship.satisfaction = 90;
  assert.ok(prelimChance(s) > early && prelimChance(s) < 1);
});

test('save and load preserves the exact run and retires malformed data gracefully', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const state = enterProgram(1);
  const saved = saveRun(storage, state, emptyMeta());
  assert.equal(saved.error, null);
  const encountered = Object.keys(state.seen)[0];
  if (encountered) {
    const count = saved.meta.eventCounts[encountered];
    const savedAgain = saveRun(storage, state, saved.meta);
    assert.equal(savedAgain.meta.eventCounts[encountered], count, 'autosaving does not count the same encounter twice');
  }
  const loaded = loadSave(storage);
  assert.deepEqual(loaded.run, state);
  assert.equal(validRun(loaded.run), true);
  assert.ok(saved.meta.archetypes.includes(state.advisor.archetype));
  values.set('phdsim.academic-os.v2', '{"version":2,"run":{"phase":"playing"},"meta":{"achievements":[],"archetypes":[],"endings":[],"seenEvents":[]}}');
  const retired = loadSave(storage);
  assert.equal(retired.run, null);
  assert.match(retired.notice, /set aside/);
});

// Drives every stage the game can be in, including the ones added later.
function advance(s) {
  if (s.stage === 'pushback') { const pb = pushbacks.find(x => x.id === s.pushback.id); return dispatch(s, { type: 'PUSHBACK', id: pb.options[0].id }); }
  if (s.stage === 'minigame') return dispatch(s, { type: 'LECTURE', worked: 10, attention: 4, caught: 0 });
  if (s.stage === 'trip') {
    if (s.trip.phase === 'visa') return dispatch(s, { type: 'TRIP_VISA', id: 'normal' });
    if (s.trip.caughtScene) return dispatch(s, { type: 'TRIP_CAUGHT', id: 'honest' });
    if (s.trip.day === s.trip.talkDay && !s.trip.talkDone) return dispatch(s, { type: 'TRIP_TALK', tally: { hits: 4, hype: 1, misses: 1 } });
    if (s.trip.qa && !s.trip.qaDone) { const q = questioners.find(x => x.id === s.trip.qa[s.trip.qaIndex]); return dispatch(s, { type: 'TRIP_QA', id: q.best }); }
    return dispatch(s, { type: 'TRIP_DAY', id: 'sessions' });
  }
  if (s.stage === 'commencement') return dispatch(s, { type: 'TAKE_OFFER', id: s.jobs.market[0].kind });
  if (s.stage === 'epilogue') { const b = currentBeat(s); return dispatch(s, { type: 'EPILOGUE', id: b ? b.choices[0].id : 'ok' }); }
  return s;
}

test('a full run reaches an ending without crashing', () => {
  let s = enterProgram(4);
  let guard = 0;
  while (s.phase === 'playing' && guard++ < 1200) {
    const before = s.stage;
    if (s.stage === 'plan') {
      // A diligent-enough student: answers the advisor, then plans the month.
      for (const r of s.requests.filter(r => r.status === 'open')) { try { s = act(s, { type: 'REQUEST_DO', id: r.id }); } catch { /* not enough energy */ } }
      if (!s.focus) s = act(s, { type: 'PLAN', id: focusOptions(s).find(f => !f.disabled).id });
      if (!s.projects.length) s = act(s, { type: 'START_PROJECT' });
      if (s.milestones.proposal === 'pass' && !s.milestones.thesisStarted && s.month >= 54) s = act(s, { type: 'START_THESIS' });
      s = act(s, { type: 'CONTINUE' });
    }
    if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' });
    if (s.stage === 'milestone') s = act(s, { type: 'MILESTONE', id: 'balanced' });
    s = resolveAll(advance(s));
    if (s.stage === before && !['plan', 'report', 'milestone'].includes(s.stage)) break;
  }
  assert.ok(['ending', 'epilogue'].includes(s.phase), `run should conclude (phase ${s.phase}, stage ${s.stage})`);
  assert.ok(s.ending ? s.ending.title : s.epilogue, 'it concludes with something to read');
  assert.ok(s.history.length > 50);
  assert.ok(s.month >= 23, `the run reaches at least the prelim (month ${s.month}, ending ${s.ending?.id})`);
});

test('a student who ignores every request and every meeting is eventually removed', () => {
  let s = enterProgram(21);
  let guard = 0;
  while (s.phase === 'playing' && guard++ < 400 && !s.ending) {
    if (s.stage === 'plan') {
      s.relationship.satisfaction = Math.max(0, s.relationship.satisfaction - 6);
      s.relationship.conflict = Math.min(100, s.relationship.conflict + 4);
      for (const r of s.requests.filter(r => r.status === 'open')) { try { s = act(s, { type: 'REQUEST_DECLINE', id: r.id }); } catch { /* ignore */ } }
      if (!s.focus) s = act(s, { type: 'PLAN', id: 'rest' });
      s = act(s, { type: 'CONTINUE' });
    }
    if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' });
    if (s.stage === 'milestone') s = act(s, { type: 'MILESTONE', id: 'balanced' });
    s = resolveAll(advance(s));
    if (s.warnings >= 2 || s.probation) break;
  }
  assert.ok((s.warnings || 0) >= 1 || s.probation || s.ending, 'the ladder engages for a student who does nothing');
});

test('passing the prelim continues into year three and seasons pass faster', () => {
  let s = enterProgram(1);
  s.month = 23; s.week = 4; s.stage = 'report'; s.report = { before: {}, events: [], weeks: [], monthsCovered: 1 };
  s.coursework = 90; s.readiness = 90; s.relationship.trust = 90; s.relationship.satisfaction = 90; s.player.stats.confidence = 80;
  s.projects.push({ id: 'p', kind: 'main', title: 'T', topic: 'systems', novelty: 80, technicalDepth: 80, evidence: 80, writingQuality: 80, hype: 10, reproducibility: 80, topicFit: 60, progress: 95, draft: 100, scope: 30, status: 'Accepted', collaborators: [s.advisor.name], submissionHistory: [], reviewers: [], wizardStep: 0, venueId: null, targetVenueId: null, targetMonth: null, targetVenue: null, timeline: null, preprint: false, startedMonth: 0 });
  s.counts.accepted = 2;
  s = act(s, { type: 'DISMISS_REPORT' });
  assert.equal(s.stage, 'milestone');
  assert.equal(s.milestoneKind, 'prelim');
  let guard = 0;
  while (s.stage === 'milestone' && s.milestoneKind === 'prelim' && guard++ < 3) { s = act(s, { type: 'MILESTONE', id: 'balanced' }); if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' }); }
  assert.equal(s.phase, 'playing');
  assert.ok(s.month >= 24, 'the run continues past the prelim');
  assert.ok(['month', 'season', 'week'].includes(s.tempo));
});

// ── Wave 4–7 systems ──────────────────────────────────────────────────────────
import { conditions as conditionDefs, clinics, budgets, lifeActions } from '../src/data/life.js';
import { outOfPocket, visitClinic, monthlyLedger, coffee, skipMeal, vitalsDrift, healthBand, addCondition, hasCondition, ageConditions, charge, payDebt, lifeActionAvailable, doLifeAction } from '../src/engine/life.js';
import { diamonds, diamondBar, paperQuality } from '../src/engine/paper.js';
import { updateStanding, updateQuitPressure, fired, quit } from '../src/engine/divergence.js';
import { hIndex, myProfile, accrueCitations, otherProfiles } from '../src/engine/scholar.js';
import { cities, venueCities, talkSlots, questioners, tripActivities } from '../src/data/conference.js';
import { prepareTrip, startTrip, scoreTalk, answerQuestion, spendTripDay, visaNeed, upgradeOptions, upgradeTrip, TRIP_DAYS } from '../src/engine/trip.js';
import { buildCV, generateOffers, startEpilogue, answerBeat, currentBeat } from '../src/engine/epilogue.js';
import { epilogueBeats } from '../src/data/epilogue.js';
import { pushbacks } from '../src/data/minigames.js';
import { resolvePushback, hesitate } from '../src/engine/events.js';

test('health drains from the things that actually drain it, and the clinic costs money either way', () => {
  let s = enterProgram(4);
  const start = s.player.stats.health;
  s.player.hidden.stress = 80; s.player.stats.energy = 15; s.meals.skippedMonth = 9;
  vitalsDrift(s, 4);
  assert.ok(s.player.stats.health < start, 'stress, exhaustion and skipped meals cost health');

  s.player.stats.health = 40;
  s.player.stats.money = 5000;
  addCondition(s, 'rsi');
  assert.ok(hasCondition(s, 'rsi'));
  const before = s.player.stats.money;
  const quote = outOfPocket(s, clinics.find(c => c.id === 'primary').list);
  assert.ok(quote > 0, 'insurance never makes it free');
  assert.ok(quote <= clinics.find(c => c.id === 'primary').list);
  visitClinic(s, 'primary');
  assert.equal(s.player.stats.money, before - quote);
  assert.ok(!hasCondition(s, 'rsi'), 'the visit treats what it treats');
  assert.ok(s.player.stats.health > 40, 'and you feel better');
});

test('untreated conditions escalate into the expensive version', () => {
  let s = enterProgram(5);
  addCondition(s, 'toothache');
  for (let i = 0; i < 6; i++) ageConditions(s);
  assert.ok(hasCondition(s, 'abscess') || !hasCondition(s, 'toothache'), 'ignoring a tooth has consequences');
});

test('the monthly ledger itemises everything and a shortfall becomes debt, not a negative balance', () => {
  let s = enterProgram(6);
  s.player.stats.money = 40; s.debt = 0;
  const l = monthlyLedger(s);
  for (const k of ['stipend', 'rent', 'food', 'premium', 'other']) assert.ok(Number.isFinite(l[k]), `${k} is itemised`);
  assert.ok(s.player.stats.money >= 0, 'the balance never goes negative');
  s.player.stats.money = 0; s.debt = 0;
  charge(s, 500);
  assert.equal(s.debt, 500, 'what you cannot pay goes on the card');
  s.player.stats.money = 600;
  payDebt(s, 'all' === 'all' ? 500 : 0);
  assert.equal(s.debt, 0);
  assert.equal(s.player.stats.money, 100);
});

test('coffee helps now and costs later, and the fifth cup is a medical event', () => {
  let s = enterProgram(7);
  s.player.stats.energy = 40; s.player.stats.health = 90;
  const e0 = s.player.stats.energy;
  coffee(s);
  assert.ok(s.player.stats.energy > e0, 'the first cup works');
  for (let i = 0; i < 4; i++) coffee(s);
  assert.equal(s.caffeine.day, 5);
  assert.ok(s.player.stats.health < 90, 'five cups is not free');
  assert.ok(s.achievements.includes('caffeinated'));
  const h = s.player.stats.health;
  skipMeal(s);
  assert.ok(s.player.stats.health < h);
});

test('paper quality reads 1-5 diamonds and tilts the lottery without deciding it', () => {
  const mk = q => ({ novelty: q, technicalDepth: q, evidence: q, writingQuality: q, reproducibility: q, hype: 10, approvedWithout: false, preprint: false, topic: 'ml' });
  assert.equal(diamonds(mk(25)), 1);
  assert.equal(diamonds(mk(88)), 5);
  assert.equal(diamondBar(3), '◆◆◆◇◇');
  const venue = venues.find(v => v.tier === 1 && v.topics.includes('ml') && !v.rolling);
  const revs = q => [0, 1, 2].map(() => ({ score: Math.round(q / 10) }));
  const weak = acceptanceChance(mk(30), venue, revs(30));
  const strong = acceptanceChance(mk(88), venue, revs(88));
  assert.ok(strong > weak, 'quality helps');
  assert.ok(weak > .05, 'a weak paper can still get in');
  assert.ok(strong < .9, 'a strong paper can still be rejected');
});

test('standing falls with missed work and rises again, and the ladder reaches probation', () => {
  let s = enterProgram(8);
  s.month = 10; s.standing = 60;
  s.relationship.satisfaction = 12; s.relationship.trust = 15; s.relationship.conflict = 80;
  s.counts.deadlinesMissed = 3; s.counts.requestsExpired = 4;
  for (let i = 0; i < 6; i++) { updateStanding(s); s.month++; }
  assert.ok(s.standing < 40, `standing should fall (was ${s.standing})`);
  assert.ok((s.warnings || 0) >= 1, 'a warning is raised before anything formal');
  for (let i = 0; i < 10; i++) { s.relationship.satisfaction = 10; updateStanding(s); s.month++; }
  assert.ok((s.warnings || 0) >= 2 || s.probation, 'it escalates');
});

test('quit pressure reads the whole person, and both exits end the run kindly', () => {
  let s = enterProgram(9);
  s.month = 20;
  s.player.stats.hope = 15; s.player.stats.health = 25; s.player.hidden.loneliness = 85; s.player.hidden.stress = 85; s.debt = 8000;
  for (let i = 0; i < 5; i++) updateQuitPressure(s);
  assert.ok(s.quitPressure > 50, `pressure should be high (was ${s.quitPressure})`);
  const a = structuredClone(s);
  quit(a, 'health');
  assert.equal(a.phase, 'ending');
  assert.equal(a.ending.id, 'quit');
  assert.ok(a.ending.text.length > 200 && !/failure/i.test(a.ending.title));
  const b = structuredClone(s);
  fired(b);
  assert.equal(b.ending.id, 'fired');
  assert.ok(b.achievements.includes('removed'));
});

test('citations accrue, produce alerts, and an h-index', () => {
  assert.equal(hIndex([10, 8, 5, 4, 3]), 4);
  assert.equal(hIndex([]), 0);
  let s = enterProgram(10);
  const p = s.projects[0] || createProject(s);
  p.status = 'Accepted'; p.venueId = 'neuripsy'; p.novelty = 80; p.evidence = 80; p.writingQuality = 75; p.reproducibility = 70;
  p.submissionHistory = [{ venueId: 'neuripsy', venue: 'NeurIPSy', month: 0, outcome: 'Accept', reviewers: [], quality: 76 }];
  const mailBefore = s.inbox.length;
  for (let m = 1; m < 26; m++) { s.month = m; accrueCitations(s); }
  const prof = myProfile(s);
  assert.ok(prof.total > 0, 'an accepted paper accrues citations');
  assert.ok(s.inbox.length > mailBefore, 'and you hear about it by email');
  assert.ok(otherProfiles(s).length >= 4, 'so does everyone you know');
});

test('every conference maps to real host cities with real attractions', () => {
  for (const [real, list] of Object.entries(venueCities)) {
    assert.ok(list.length >= 3, `${real} rotates through several cities`);
    for (const id of list) {
      const c = cities[id];
      assert.ok(c, `${id} exists`);
      assert.ok(c.attractions.length >= 3, `${c.name} has things to do`);
      for (const a of c.attractions) assert.ok(a.name && a.blurb && a.effects, `${c.name} attractions are complete`);
    }
  }
  assert.ok(Object.keys(cities).length >= 40);
});

test('a conference trip runs: costs, a talk, a Q&A, days, and something to show for it', () => {
  let s = enterProgram(11);
  const p = s.projects[0] || createProject(s);
  p.status = 'Accepted'; p.venueId = 'osdisaster'; p.novelty = 70; p.evidence = 70; p.writingQuality = 70; p.reproducibility = 70;
  p.submissionHistory = [{ venueId: 'osdisaster', venue: 'OSDIsaster', month: 2, outcome: 'Accept', reviewers: [], quality: 70 }];
  s.player.stats.money = 12000;
  const trip = startTrip(s, p, 'boston');
  assert.equal(s.stage, 'trip');
  assert.ok(trip.yours >= 0 && trip.airfare > 0 && trip.registration > 0, 'a conference costs money');
  const ups = upgradeOptions(s);
  assert.equal(ups.length, 3);
  upgradeTrip(s, 'extend');
  assert.equal(s.trip.days, TRIP_DAYS + 1, 'money buys another day');
  scoreTalk(s, { hits: 6, hype: 0, misses: 0 });
  assert.equal(s.trip.talk.grade, 'great');
  assert.equal(s.trip.qa.length, 3, 'three questions');
  const q = questioners.find(x => x.id === s.trip.qa[0]);
  answerQuestion(s, q.best);
  assert.equal(s.trip.qaResults[0].good, true);
  answerQuestion(s, Object.keys(questioners.find(x => x.id === s.trip.qa[1]).options)[0]);
  answerQuestion(s, Object.keys(questioners.find(x => x.id === s.trip.qa[2]).options)[0]);
  assert.ok(s.trip.qaDone);
  while (s.trip) spendTripDay(s, 'sessions');
  assert.equal(s.stage, 'plan');
  assert.ok(s.lastTrip && s.lastTrip.city === 'Boston');
  assert.ok((s.citations?.[p.id] || 0) > 0, 'a good talk brings citations home');
});

test('international students need a visa for most of the world and domestic students mostly do not', () => {
  let intl = enterProgram(12); intl.player.profile.international = true;
  let dom = enterProgram(12); dom.player.profile.international = false;
  assert.equal(visaNeed(intl, cities.sandiego), null, 'no visa for a domestic conference');
  assert.ok(visaNeed(intl, cities.vienna), 'Schengen needs paperwork on an F-1');
  assert.equal(visaNeed(dom, cities.vienna), null, 'and none on a US passport');
  assert.ok(visaNeed(intl, cities.addis).risk > visaNeed(intl, cities.seoul).risk, 'some borders are harder than others');
});

test('the CV is built from what happened, and the market reads it', () => {
  let s = enterProgram(13);
  s.month = 60;
  for (const id of ['neuripsy', 'aaaight']) {
    const p = createProject(s);
    p.status = 'Accepted'; p.venueId = id; p.novelty = 78; p.evidence = 78; p.writingQuality = 74; p.reproducibility = 72;
    p.submissionHistory = [{ venueId: id, venue: id, month: 20, outcome: 'Accept', reviewers: [], quality: 76 }];
  }
  s.counts.accepted = 2; s.citations = { 'project-1': 40, 'project-2': 15 };
  s.relationship.trust = 75; s.relationship.satisfaction = 70; s.ta = true;
  const cv = buildCV(s);
  assert.ok(cv.lines.length >= 5, 'the CV has lines');
  assert.ok(cv.score > 40, `a two-paper CV should read well (was ${cv.score})`);
  assert.ok(cv.lines.some(l => l.section === 'publications'));
  assert.ok(cv.lines.some(l => l.section === 'people'), 'the letter is on there');
  const thin = buildCV({ ...structuredClone(s), projects: [], counts: { ...s.counts, accepted: 0 }, citations: {}, relationship: { ...s.relationship, trust: 20, satisfaction: 20 } });
  assert.ok(thin.score < cv.score, 'a thinner file scores lower');
  s.jobs.track = 'industry';
  const offers = generateOffers(s, cv);
  assert.ok(offers.length >= 1);
  for (const o of offers) assert.ok(o.name && o.catch && Number.isFinite(o.salary), 'every offer is complete');
});

test('the epilogue runs after graduation and ends on the long view', () => {
  let s = enterProgram(14);
  s.month = 64; s.milestones.graduated = true; s.jobs.track = 'industry';
  s.cv = buildCV(s);
  generateOffers(s, s.cv);
  startEpilogue(s, s.jobs.market[0].kind);
  assert.equal(s.phase, 'epilogue');
  assert.ok(s.epilogue.beats.length >= 2, 'there are years to come');
  let guard = 0;
  while (!s.epilogue.finished && guard++ < 12) {
    const beat = currentBeat(s);
    assert.ok(beat, 'each year has something in it');
    answerBeat(s, beat.choices[0].id);
  }
  assert.ok(s.epilogue.finished);
  assert.ok(s.epilogue.done.length >= 2);
  assert.ok(s.achievements.includes('lifelong'));
});

test('advisor pushback is a real second beat, and hesitation has a cost', () => {
  assert.ok(pushbacks.length >= 4);
  for (const pb of pushbacks) { assert.ok(pb.text && pb.options.length >= 2); for (const o of pb.options) assert.ok(o.label && o.line); }
  let s = enterProgram(15);
  createProject(s);
  s.advisor.ambition = 95; s.advisor.toxicity = 80; s.relationship.satisfaction = 20;
  s.advisorMode = { id: 'pressed', until: 99, since: 0 };
  let fired_ = 0;
  for (let i = 0; i < 30 && !fired_; i++) {
    s.event = 'meet_progress'; s.stage = 'event'; s.eventVariant = 0; s.eventReturn = 'plan';
    s = dispatch(s, { type: 'CHOICE', id: 'honest' });
    if (s.pushback) fired_ = 1;
  }
  assert.equal(fired_, 1, 'a hostile, pressed advisor pushes back sooner or later');
  const stress = s.player.hidden.stress;
  s = dispatch(s, { type: 'HESITATE' });
  assert.ok(!s.pushback, 'the moment closes');
  assert.ok(s.player.hidden.stress >= stress, 'and saying nothing is not free');
});

test('the lecture minigame turns dodging into draft progress', () => {
  let s = enterProgram(16);
  const p = createProject(s);
  p.progress = 60; p.draft = 10; p.status = 'Drafting';
  s.event = 'lecture_dodge'; s.stage = 'event'; s.eventVariant = 0; s.eventReturn = 'plan';
  s = dispatch(s, { type: 'CHOICE', id: 'dodge' });
  assert.equal(s.stage, 'minigame');
  assert.equal(s.minigame, 'lecture');
  const before = s.projects[0].draft;
  s = dispatch(s, { type: 'LECTURE', worked: 18, attention: 4, caught: 0 });
  assert.ok(s.projects[0].draft > before, 'stolen time is real time');
  assert.equal(s.minigame, null);
  const caught = dispatch({ ...structuredClone(s), stage: 'minigame', minigame: 'lecture' }, { type: 'LECTURE', worked: 3, attention: 2, caught: 3 });
  assert.ok(caught.player.stats.confidence < s.player.stats.confidence, 'being called on three times costs something');
});

test('life actions have real costs, cooldowns, and one of them is closed to visa holders', () => {
  let s = enterProgram(17);
  s.player.profile.international = true;
  const tutor = lifeActions.find(a => a.id === 'tutor');
  assert.ok(tutor.offCampus, 'tutoring is off-campus work');
  assert.ok(lifeActionAvailable(s, tutor), 'and an F-1 cannot take it');
  s.player.profile.international = false;
  assert.equal(lifeActionAvailable(s, tutor), null, 'a domestic student can');
  const money = s.player.stats.money;
  doLifeAction(s, 'tutor');
  assert.ok(s.player.stats.money > money);
  assert.ok(lifeActionAvailable(s, tutor), 'and then it is on cooldown');
});

// ── Stored text follows the language, instead of freezing in the one it was written in ──
import { entryText, mailSubject, mailBody, chatBody, requestText, noticeText, say, vars } from '../src/engine/state.js';
import { provenanceOf, pauseProvenance, resumeProvenance, readSlot } from '../src/i18n/index.js';
import { labLines } from '../src/data/chatter.js';

const han = x => /[一-鿿]/.test(x);
const latin = x => /[A-Za-z]{4}/.test(x);

test('t() records what produced a string, and pauses while the UI renders', () => {
  setAppLanguage('en');
  const plain = t('Health');
  assert.deepEqual(provenanceOf(plain), { s: 'Health' });
  const withVars = t('Paid ${amount} against the card. Balance: ${rest}.', { amount: 200, rest: 50 });
  assert.deepEqual(provenanceOf(withVars), { s: 'Paid ${amount} against the card. Balance: ${rest}.', v: { amount: 200, rest: 50 } });
  pauseProvenance();
  const quiet = t('Coffee');
  assert.equal(provenanceOf(quiet), null, 'rendering does not fill the buffer');
  resumeProvenance();
  // A variable that is itself translated keeps its own reference.
  const nested = t('Achievement unlocked: {id}.', { id: t('Coffee') });
  assert.deepEqual(provenanceOf(nested).v.id, { r: { s: 'Coffee' } });
});

test('catalog pools resolve by slot, so lines picked from them follow the language', () => {
  setAppLanguage('en');
  const line = labLines.wholesome[0];
  const ref = provenanceOf(line);
  assert.equal(ref.p, 'chatter.labLines.wholesome.0');
  assert.ok(latin(readSlot(ref.p)));
  setAppLanguage('zh');
  assert.ok(han(readSlot(ref.p)), 'the same slot reads Chinese after the switch');
  setAppLanguage('en');
});

test('a run played in English reads back in Chinese, and back again', () => {
  setAppLanguage('en');
  let s = enterProgram(2);
  s = act(s, { type: 'PLAN', id: focusOptions(s).find(f => !f.disabled).id });
  s = act(s, { type: 'START_PROJECT' });
  for (let i = 0; i < 6 && s.phase === 'playing'; i++) {
    if (s.stage === 'plan') { if (!s.focus) s = act(s, { type: 'PLAN', id: focusOptions(s).find(f => !f.disabled).id }); s = act(s, { type: 'CONTINUE' }); }
    if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' });
    if (s.stage === 'milestone') s = act(s, { type: 'MILESTONE', id: 'balanced' });
    if (!['plan', 'report', 'milestone'].includes(s.stage)) break;
  }
  const sample = () => [
    ...s.history.filter(h => h.i18n).slice(-5).map(h => entryText(s, h)),
    ...s.inbox.filter(m => m.i18nBody).slice(0, 4).map(m => mailBody(s, m)),
    ...s.inbox.filter(m => m.i18nSubject).slice(0, 4).map(m => mailSubject(s, m)),
    ...s.chatMessages.filter(c => c.i18n).slice(-5).map(c => chatBody(s, c)),
  ].filter(Boolean);

  const en = sample();
  assert.ok(en.length >= 8, `there should be stored text to check (got ${en.length})`);
  assert.ok(en.every(latin), 'the run was played in English');

  setAppLanguage('zh');
  const zh = sample();
  assert.equal(zh.length, en.length);
  assert.ok(zh.every(han), `every stored line reads in Chinese:\n${zh.filter(x => !han(x)).join('\n')}`);

  setAppLanguage('en');
  assert.deepEqual(sample(), en, 'switching back restores the original text exactly');
});

test('most stored text carries a reference, and the rest falls back to its own words', () => {
  setAppLanguage('en');
  let s = enterProgram(3);
  s = act(s, { type: 'START_PROJECT' });
  for (let i = 0; i < 10 && s.phase === 'playing'; i++) {
    if (s.stage === 'plan') { if (!s.focus) s = act(s, { type: 'PLAN', id: focusOptions(s).find(f => !f.disabled).id }); s = act(s, { type: 'CONTINUE' }); }
    if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' });
    if (s.stage === 'milestone') s = act(s, { type: 'MILESTONE', id: 'balanced' });
    if (!['plan', 'report', 'milestone'].includes(s.stage)) break;
  }
  const share = (list, has) => list.length ? list.filter(has).length / list.length : 1;
  assert.ok(share(s.history, h => h.i18n) > .9, 'the log is almost entirely translatable');
  assert.ok(share(s.inbox.filter(m => !m.mine), m => m.i18nBody) > .9, 'mail bodies are translatable');
  assert.ok(share(s.chatMessages, c => c.i18n) > .85, 'chat is translatable');
  // Anything without a reference keeps the words it was written with.
  const orphan = { text: 'A line nobody recorded.' };
  assert.equal(entryText(s, orphan), 'A line nobody recorded.');
  assert.equal(say(s, 'fallback', null), 'fallback');
  assert.equal(say(s, 'fallback', { p: 'chatter.nope.404' }), 'fallback', 'a stale reference falls back to the stored words');
});

test('references survive a save and a reload', () => {
  setAppLanguage('en');
  let s = enterProgram(5);
  s = act(s, { type: 'START_PROJECT' });
  for (let i = 0; i < 4 && s.phase === 'playing'; i++) {
    if (s.stage === 'plan') { if (!s.focus) s = act(s, { type: 'PLAN', id: focusOptions(s).find(f => !f.disabled).id }); s = act(s, { type: 'CONTINUE' }); }
    if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' });
    if (!['plan', 'report'].includes(s.stage)) break;
  }
  const revived = JSON.parse(JSON.stringify(s));
  assert.ok(validRun(revived), 'the extra fields do not invalidate a save');
  setAppLanguage('zh');
  const bodies = revived.inbox.filter(m => m.i18nBody).map(m => mailBody(revived, m));
  assert.ok(bodies.length && bodies.every(han), 'reloaded mail still follows the language');
  const notice = noticeText(revived);
  assert.ok(!notice || han(notice) || !latin(notice), 'the field note follows too');
  setAppLanguage('en');
});

test('token substitution keeps its reference, including dates', () => {
  setAppLanguage('en');
  const template = 'Deadline {deadline} for {venue}.';
  const filled = vars(t(template), { deadline: dateLabel(4), venue: 'NeurIPSy' });
  assert.ok(filled.includes('January 2029') && filled.includes('NeurIPSy'));
  const ref = provenanceOf(filled);
  assert.ok(ref && ref.m, 'the substitution is remembered');
  setAppLanguage('zh');
  const zh = say({}, filled, ref);
  assert.ok(zh.includes('2029年1月'), `the date follows the language: ${zh}`);
  setAppLanguage('en');
});

// ── The finishing conversation and the months after the defense ───────────────
import { openTimeline, playTimelineMove, canAskTimeline, gradRecord, gradWillingness, objectionIsFair, timelineMoves, TALK_OPENS } from '../src/engine/timeline.js';
import { beginRevisions, revise, deposit, canDeposit, revisionsLeft } from '../src/engine/thesis.js';
import { stances as gradStances, conditions as gradConditions, moves as gradMoves } from '../src/data/timeline.js';
import { revisionItems, formatFaults, hooding } from '../src/data/thesis.js';

function atYearFour(seed, mutate = () => {}) {
  let s = enterProgram(seed);
  s.month = 38;
  s.milestones.prelim = 'pass';
  s.milestones.proposal = 'pass';
  mutate(s);
  return s;
}

test('the timeline conversation opens in year four and not before', () => {
  let s = enterProgram(11);
  s.month = 20;
  assert.equal(canAskTimeline(s), false, 'too early in year two');
  assert.throws(() => openTimeline(s), /Too early/);
  s.month = TALK_OPENS;
  assert.equal(canAskTimeline(s), true);
});

test('a generous advisor and a real record produce a straight yes', () => {
  const s = atYearFour(12, x => {
    x.counts.accepted = 2; x.readiness = 70;
    x.advisor.caring = 88; x.advisor.toxicity = 8; x.advisor.ambition = 35;
    x.relationship.trust = 82; x.relationship.satisfaction = 80;
  });
  assert.ok(gradRecord(s) > 60);
  assert.ok(gradWillingness(s) > 62);
  const g = openTimeline(s);
  assert.equal(g.stance, 'yes');
  assert.equal(g.settled, true);
  assert.equal(s.milestones.targetGradYear, 5);
  assert.ok(s.achievements.includes('ontime'));
});

test('a thin record gets an honest no, and the game says it is honest', () => {
  const s = atYearFour(13, x => { x.counts.accepted = 0; x.readiness = 12; x.advisor.caring = 85; });
  const g = openTimeline(s);
  assert.equal(g.stance, 'notReady');
  assert.equal(objectionIsFair(s), true, 'a thin record makes the objection fair');
  // No confrontation moves are offered against a fair objection — only information and acceptance.
  const ids = timelineMoves(s).map(m => m.id);
  assert.deepEqual(ids.sort(), ['accept', 'second']);
});

test('an ambitious advisor with a strong student moves the goalposts, and the player can find out', () => {
  const s = atYearFour(14, x => {
    x.counts.accepted = 2; x.readiness = 74;
    x.advisor.caring = 18; x.advisor.toxicity = 80; x.advisor.ambition = 94;
    x.relationship.trust = 38; x.relationship.satisfaction = 36;
  });
  assert.ok(gradRecord(s) > 60, 'the record is genuinely strong');
  const g = openTimeline(s);
  assert.equal(g.stance, 'deflect');
  assert.equal(objectionIsFair(s), false, 'this objection is not about the work');
  const r = playTimelineMove(s, 'second');
  assert.equal(r.fair, false);
  assert.equal(s.grad.knowsTruth, 'unfair');
  assert.ok(s.achievements.includes('askedaround'));
  assert.ok(r.line.length > 60);
  assert.throws(() => playTimelineMove(s, 'second'), /tried that/);
});

test('persistence across terms is itself an argument, and the sixth year is never a dead end', () => {
  let settled5 = 0, stuck = 0;
  for (let seed = 40; seed < 90; seed++) {
    let s = atYearFour(seed, x => {
      x.counts.accepted = 2; x.readiness = 72;
      x.advisor.caring = 20; x.advisor.toxicity = 78; x.advisor.ambition = 92;
      x.relationship.trust = 40; x.relationship.satisfaction = 38;
      x.player.skills.communication = 82; x.player.skills.networking = 78; x.player.stats.confidence = 78;
    });
    openTimeline(s);
    for (let round = 0; round < 4 && !s.grad.settled; round++) {
      for (const mv of ['evidence', 'date', 'committee']) {
        if (s.grad.settled) break;
        try { playTimelineMove(s, mv); } catch { /* already used */ }
      }
      if (!s.grad.settled) { s.month += 3; try { openTimeline(s); } catch { break; } }
    }
    if (s.grad.settled && s.grad.targetYear === 5) settled5++;
    if (!s.grad.settled) { playTimelineMove(s, 'accept'); assert.equal(s.grad.targetYear, 6); stuck++; }
  }
  assert.ok(settled5 / 50 > .6, `a strong communicator usually gets out on time (got ${settled5}/50)`);
  assert.ok(settled5 / 50 < .99, 'but not always — willingness is real');
});

test('every advisor stance, condition and move has complete copy', () => {
  for (const [id, st] of Object.entries(gradStances)) {
    assert.equal(st.id, id);
    assert.ok(st.label && st.lines.length >= 3, `${id} needs a label and three lines`);
    for (const l of st.lines) assert.ok(l.length > 40, `${id} line is too thin`);
  }
  for (const c of gradConditions) assert.ok(c.text && c.line && c.check);
  for (const [id, m] of Object.entries(gradMoves)) {
    assert.ok(m.label && m.hint && m.line, `${id} incomplete`);
    if (!['second', 'accept'].includes(id)) assert.ok(m.good && m.bad, `${id} needs both outcomes`);
  }
});

test('defending is not finishing: the committee gives a list, and the degree waits on the deposit', () => {
  let s = enterProgram(15);
  s.month = 60;
  s.projects.push({ id: 'thesis', kind: 'thesis', title: 'T', topic: 'systems', novelty: 60, technicalDepth: 60, evidence: 60, writingQuality: 60, hype: 10, reproducibility: 60, topicFit: 60, progress: 95, draft: 92, scope: 30, status: 'Ready', collaborators: [s.advisor.name], submissionHistory: [], reviewers: [], wizardStep: 0, venueId: null, targetVenueId: null, targetMonth: null, targetVenue: null, timeline: null, preprint: false, startedMonth: 54 });
  const th = beginRevisions(s);
  assert.ok(th.items.length >= 2 && th.items.length <= 5);
  assert.equal(s.milestones.defense, 'pass');
  assert.equal(s.milestones.graduated, false, 'the defense does not confer the degree');
  assert.ok(revisionsLeft(s) > 0);
  assert.equal(canDeposit(s), false);
  assert.throws(() => deposit(s), /list is not finished/);

  let guard = 0;
  while (!canDeposit(s) && guard++ < 40) {
    const next = s.thesis.items.find(i => i.done < i.effort);
    s.player.stats.energy = 90;
    revise(s, next.id);
  }
  assert.equal(canDeposit(s), true);
  assert.throws(() => revise(s, s.thesis.items[0].id), /done/);

  let tries = 0;
  let r = { ok: false };
  while (!r.ok && tries++ < 5) { s.player.stats.energy = 90; r = deposit(s); }
  assert.equal(r.ok, true);
  assert.equal(s.milestones.graduated, true, 'the deposit confers the degree');
  assert.ok(s.achievements.includes('deposited'));
  assert.throws(() => deposit(s), /Stop opening the portal/);
});

test('defending after May defers the ceremony, which is what brings the advisor back later', () => {
  const build = month => {
    let s = enterProgram(16);
    s.month = month;
    s.projects.push({ id: 'thesis', kind: 'thesis', title: 'T', topic: 'systems', novelty: 60, technicalDepth: 60, evidence: 60, writingQuality: 60, hype: 10, reproducibility: 60, topicFit: 60, progress: 95, draft: 95, scope: 30, status: 'Ready', collaborators: [s.advisor.name], submissionHistory: [], reviewers: [], wizardStep: 0, venueId: null, targetVenueId: null, targetMonth: null, targetVenue: null, timeline: null, preprint: false, startedMonth: 54 });
    beginRevisions(s);
    let guard = 0;
    while (!canDeposit(s) && guard++ < 40) { const n = s.thesis.items.find(i => i.done < i.effort); s.player.stats.energy = 90; revise(s, n.id); }
    let r = { ok: false }, tries = 0;
    while (!r.ok && tries++ < 5) { s.player.stats.energy = 90; r = deposit(s); }
    return s;
  };
  // month 62 is November: the ceremony is months away.
  assert.equal(build(62).thesis.deferred, true);
  // month 56 is May: you walk with your cohort.
  const may = build(56);
  assert.equal(monthOf(56), 5);
  assert.equal(may.thesis.deferred, false);
});

test('the hooding invitation is warm, optional, and never scolds you for skipping it', () => {
  assert.ok(hooding.choices.length >= 3);
  const skip = hooding.choices.find(c => c.id === 'skip');
  assert.ok(skip, 'skipping must be an option');
  assert.ok(skip.effects.hope > 0, 'even skipping is not punished into misery');
  for (const c of hooding.choices) assert.ok(c.line.length > 80, `${c.id} needs real copy`);
  assert.ok(revisionItems.every(i => i.label && i.line && i.effort >= 1));
  assert.ok(formatFaults.every(f => f.length > 40));
});

// ── The job market: twelve outcomes, forty-eight employers, and a real lottery ─
import { employers as jobEmployers, employersFor, SECTION_MAX, BASE_BY_DIFFICULTY, fitScore, gateFor, slateOdds, drawWeather, offTrackPenalty } from '../src/engine/market.js';
import { tracks, trackById, ACADEMIC } from '../src/data/tracks.js';
import { trackEndings } from '../src/data/endings.js';
import { axesOf } from '../src/engine/epilogue.js';

function graduand(seed, mutate = () => {}) {
  let s = enterProgram(seed);
  s.month = 58;
  s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass'; s.milestones.graduated = true;
  mutate(s);
  return s;
}
const withPapers = (s, n, venue = 'neuripsy', cites = 40) => {
  s.counts.accepted = n; s.citations = {};
  for (let i = 0; i < n; i++) {
    const p = createProject(s);
    p.status = 'Accepted'; p.venueId = venue; p.novelty = 80; p.evidence = 80; p.writingQuality = 78; p.reproducibility = 74;
    p.submissionHistory = [{ venueId: venue, venue, month: 30, outcome: 'Accept', reviewers: [], quality: 78 }];
    s.citations[p.id] = cites;
  }
};

test('every track has a name, employers, and ending copy in the register of the game', () => {
  assert.equal(tracks.length, 12);
  for (const tr of tracks) {
    assert.ok(tr.name && tr.subtitle && tr.pitch && tr.truth, `${tr.id} incomplete`);
    assert.ok(tr.difficulty >= 1 && tr.difficulty <= 5, `${tr.id} difficulty`);
    assert.ok(tr.permanence >= 0 && tr.permanence <= 2, `${tr.id} permanence`);
    assert.ok(employersFor(tr.id).length >= 2, `${tr.id} needs employers`);
    const e = trackEndings[tr.id];
    assert.ok(e && e.title && e.text.length > 400, `${tr.id} needs real ending copy`);
    // The tone contract: no outcome is named after the player, and none calls them a failure.
    assert.ok(!/\b(failure|failed|loser|washout|traitor|homeless)\b/i.test(e.text), `${tr.id} ending must not punch down`);
  }
  // Leaving research is never a lower ceiling than staying.
  assert.ok(trackById.product_eng.ceiling >= trackById.postdoc.ceiling);
});

test('the employer catalog is complete, deduplicated, and its base rates derive from difficulty', () => {
  assert.ok(jobEmployers.length >= 40, `catalog is thin (${jobEmployers.length})`);
  const ids = jobEmployers.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate employer ids');
  for (const e of jobEmployers) {
    assert.ok(trackById[e.track], `${e.id} has an unknown track`);
    assert.ok(e.name && e.kind && e.where && e.catch && e.hook, `${e.id} incomplete`);
    assert.ok(e.salary[0] <= e.salary[1], `${e.id} salary band inverted`);
    assert.ok(BASE_BY_DIFFICULTY[e.difficulty], `${e.id} difficulty out of range`);
    for (const k of Object.keys(e.wants || {})) assert.ok(k in SECTION_MAX, `${e.id} wants an axis that does not exist: ${k}`);
  }
  // Harder employers must be harder at every gate.
  const d = BASE_BY_DIFFICULTY;
  for (let i = 1; i < 5; i++) for (const gate of ['screen', 'invite', 'offer']) {
    assert.ok(d[i][gate] > d[i + 1][gate], `difficulty ${i + 1} must be harder than ${i} at ${gate}`);
  }
  // A postdoc is not paid like a quant.
  const band = track => { const es = employersFor(track); return es.reduce((a, e) => a + (e.salary[0] + e.salary[1]) / 2, 0) / es.length; };
  assert.ok(band('quant') > band('product_eng'), 'quant should out-pay engineering');
  assert.ok(band('product_eng') > band('postdoc'), 'engineering should out-pay a postdoc');
  assert.ok(band('tenure_track') > band('postdoc'), 'faculty should out-pay a postdoc');
});

test('the CV axes discriminate instead of saturating', () => {
  const thin = graduand(20, s => { createProject(s); s.relationship.trust = 40; });
  const strong = graduand(20, s => {
    withPapers(s, 4);
    s.counts.taSemesters = 4; s.counts.reviewed = 2; s.meetingStats.presented = 8;
    s.relationship.trust = 82; s.relationship.satisfaction = 78;
    s.conferenceConnections = 9; s.citiesVisited = ['a', 'b', 'c', 'd']; s.player.skills.teaching = 74;
  });
  const a = buildCV(thin).axes, b = buildCV(strong).axes;
  for (const k of ['publications', 'citations', 'talks', 'teaching', 'people']) {
    assert.ok(b[k] > a[k], `${k} must separate a strong file from a thin one (${a[k]} vs ${b[k]})`);
    assert.ok(b[k] <= 100 && a[k] >= 0, `${k} out of range`);
  }
  // Every axis is reachable and none is free.
  for (const k of Object.keys(SECTION_MAX)) assert.ok(SECTION_MAX[k] > 0);
});

test('gates are hard, stated, and land where they really land', () => {
  const dom = graduand(21, s => { withPapers(s, 2); s.counts.taSemesters = 3; });
  const intl = graduand(21, s => { withPapers(s, 2); s.counts.taSemesters = 3; s.player.profile.international = true; });
  const openTo = st => jobEmployers.filter(e => !gateFor(st, e).blocked).length;
  assert.equal(openTo(dom), jobEmployers.length, 'nothing is closed to a domestic candidate');
  assert.ok(openTo(intl) < openTo(dom), 'sponsorship and citizenship close part of the board');
  assert.ok(openTo(intl) / openTo(dom) > .5, 'but most of the board stays open');
  // Every block gives a reason, in the voice of the form.
  for (const e of jobEmployers) {
    const g = gateFor(intl, e);
    if (g.blocked) assert.ok(g.why.length > 20, `${e.id} blocks without saying why`);
  }
  // National labs are the citizenship case the player is warned about.
  assert.ok(employersFor('national_lab').some(e => gateFor(intl, e).blocked));
  // Teaching jobs want evidence of teaching.
  const noTeaching = graduand(21, s => { withPapers(s, 2); s.counts.taSemesters = 0; s.flags.extraTA = false; });
  assert.ok(employersFor('teaching_faculty').some(e => gateFor(noTeaching, e).blocked), 'teaching proof must gate something');
});

test('fit rises with the file, and crossing tracks costs less in the direction the field calls down', () => {
  const e = employersFor('tenure_track')[0];
  const low = fitScore({ publications: 20, citations: 20, talks: 20, awards: 10, people: 20, teaching: 10, education: 100 }, e);
  const high = fitScore({ publications: 95, citations: 90, talks: 90, awards: 60, people: 90, teaching: 40, education: 100 }, e);
  assert.ok(high > low);
  assert.ok(low >= -1 && high <= .6, 'fit is bounded, so nobody buys the job twice');

  const s = graduand(22, x => { withPapers(x, 2); x.jobs.track = 'tenure_track'; });
  const leaving = offTrackPenalty(s, employersFor('product_eng')[0]);
  s.jobs.track = 'product_eng';
  const returning = offTrackPenalty(s, employersFor('tenure_track')[0]);
  assert.ok(leaving > returning, 'an industry file is a bigger handicap on a faculty search than the reverse');
  s.jobs.track = 'tenure_track';
  assert.equal(offTrackPenalty(s, employersFor('tenure_track')[0]), 0, 'on-track is free');
});

test('the market is a lottery: a strong file strikes out and a thin one lands', () => {
  const outcomes = { strongMiss: 0, thinHit: 0, strongHit: 0 };
  for (let seed = 200; seed < 260; seed++) {
    const strong = graduand(seed, s => {
      withPapers(s, 4); s.counts.taSemesters = 3; s.relationship.trust = 80; s.relationship.satisfaction = 76;
      s.conferenceConnections = 8; s.citiesVisited = ['a', 'b', 'c']; s.advisor.connections = 80; s.advisor.prestige = 88;
      s.jobs.track = 'tenure_track';
    });
    const got = generateOffers(strong, buildCV(strong));
    if (got.some(o => o.kind === 'tenure_track')) outcomes.strongHit++; else outcomes.strongMiss++;

    const thin = graduand(seed, s => { createProject(s); s.relationship.trust = 45; s.jobs.track = 'product_eng'; });
    if (generateOffers(thin, buildCV(thin)).some(o => o.kind !== 'unplaced')) outcomes.thinHit++;
  }
  assert.ok(outcomes.strongHit > 6, `a strong faculty file should often land (${outcomes.strongHit}/60)`);
  assert.ok(outcomes.strongMiss > 6, `and should sometimes strike out (${outcomes.strongMiss}/60)`);
  assert.ok(outcomes.thinHit > 6, `a thin file must still be able to land something (${outcomes.thinHit}/60)`);
});

test('the market always produces something to read, and never more offers than a person could hold', () => {
  for (let seed = 300; seed < 330; seed++) {
    const s = graduand(seed, x => { withPapers(x, 2); x.jobs.track = tracks[seed % 11].id; });
    const offers = generateOffers(s, buildCV(s));
    assert.ok(offers.length >= 1, 'there is always an outcome');
    assert.ok(offers.length <= 4, `too many offers (${offers.length})`);
    for (const o of offers) {
      assert.ok(trackEndings[o.kind], `${o.kind} has no ending`);
      assert.ok(o.name && o.catch, 'every offer explains itself');
      assert.ok(Number.isFinite(o.salary));
    }
    // An unplaced result is a state, not a verdict, and it is never mixed with a real offer.
    if (offers.some(o => o.kind === 'unplaced')) assert.equal(offers.length, 1);
  }
});

test('market weather is drawn once, bounded, and described in prose rather than a number', () => {
  const s = graduand(23, x => { withPapers(x, 2); });
  const w = drawWeather(s);
  assert.ok(w >= -.14 && w <= .12, `weather out of range (${w})`);
  assert.equal(s.jobs.weather, w);
  generateOffers(s, buildCV(s));
  assert.ok(s.jobs.weatherLine && !/\d/.test(s.jobs.weatherLine), 'the weather is prose, not a percentage');
});

// ── Internships ────────────────────────────────────────────────────────────────
import { internTypes, internEmployers, hijackLines, stanceLines, internMoves, returnLines } from '../src/data/internships.js';
import { applyInternships, canApplyIntern, internWindow, internWillingness, internScore, collisions, collisionWeight, openInternTalk, playInternMove, internTalkMoves, endInternship, internObjectionIsFair } from '../src/engine/internship.js';
import { nextIndexFor } from '../src/data/calendar.js';
import { skillNames } from '../src/data/catalog.js';

const AUGUST = nextIndexFor(8, 12);   // the first August after enrolment
const admitted = seed => { try { return enterProgram(seed); } catch { return null; } };
function summerCandidate(seed, mutate = () => {}) {
  const s = enterProgram(seed);
  s.month = AUGUST;
  s.counts.accepted = 1;
  s.player.skills.coding = 70; s.player.skills.research = 65;
  mutate(s);
  return s;
}

test('every internship type is playable: a label, a real skill delta, and somewhere to do it', () => {
  const ids = Object.keys(internTypes);
  assert.equal(ids.length, 7);
  for (const [id, ty] of Object.entries(internTypes)) {
    assert.equal(ty.id, id);
    assert.ok(ty.label && ty.blurb, `${id} does not explain itself`);
    assert.ok(Object.keys(ty.skills).length, `${id} changes nothing about you`);
    for (const k of Object.keys(ty.skills)) assert.ok(skillNames.includes(k), `${id} moves a skill that does not exist: ${k}`);
    assert.ok(ty.salary > 0 && Number.isFinite(ty.salary));
    assert.ok(ty.onCampus || (internEmployers[id] || []).length >= 3, `${id} has nowhere to go`);
  }
  // The user's brief, as an assertion: a job that is not research costs you research.
  assert.ok(internTypes.sde.skills.research < 0, 'shipping features should cost research skill');
  assert.ok(internTypes.quant.skills.research < internTypes.sde.skills.research, 'quant should cost more');
  assert.ok(internTypes.research.skills.research > 0, 'a research internship should build it');
});

test('the window is August, opens once a cycle, and closes behind you', () => {
  const s = summerCandidate(11);
  assert.equal(internWindow(s), 'open');
  assert.ok(canApplyIntern(s));
  s.month = AUGUST + 3;           // November: late, still possible
  assert.equal(internWindow(s), 'late');
  s.month = AUGUST + 6;           // February: gone
  assert.equal(internWindow(s), 'closed');
  assert.equal(canApplyIntern(s), false);
  s.month = AUGUST;
  applyInternships(s);
  assert.equal(canApplyIntern(s), false, 'one cycle, one application season');
  assert.throws(() => applyInternships(s));
});

test('applications mostly produce nothing, and a strong file produces something', () => {
  let weakHits = 0, strongHits = 0;
  for (let seed = 400; seed < 440; seed++) {
    if (!admitted(seed)) continue;
    const weak = summerCandidate(seed, x => { x.counts.accepted = 0; x.player.skills.coding = 25; x.player.skills.research = 25; });
    if (applyInternships(weak).length) weakHits++;
    const strong = summerCandidate(seed, x => { x.counts.accepted = 3; x.player.skills.coding = 92; x.player.skills.research = 88; x.conferenceConnections = 8; });
    if (applyInternships(strong).length) strongHits++;
  }
  assert.ok(strongHits > weakHits, `a stronger file should land more often (${strongHits} vs ${weakHits})`);
  assert.ok(weakHits < 34, 'a weak file should sometimes hear nothing at all');
  assert.ok(strongHits > 6, 'a strong file should not be shut out');
  assert.ok(internScore(summerCandidate(1, x => { x.counts.accepted = 3; })) > internScore(summerCandidate(1)));
});

test('national labs do not hire international students, and a startup cannot sponsor', () => {
  for (let seed = 500; seed < 540; seed++) {
    if (!admitted(seed)) continue;
    const intl = summerCandidate(seed, x => { x.player.profile.international = true; x.player.skills.coding = 95; x.player.skills.research = 95; x.counts.accepted = 4; });
    for (const o of applyInternships(intl)) {
      assert.notEqual(o.typeId, 'natlab', 'the national lab is closed to them and says so elsewhere');
      assert.notEqual(o.typeId, 'startup', 'four engineers cannot run an immigration department');
    }
  }
  const domestic = [];
  for (let seed = 500; seed < 560; seed++) {
    if (!admitted(seed)) continue;
    const us = summerCandidate(seed, x => { x.player.profile.international = false; x.player.skills.coding = 95; x.player.skills.research = 95; x.counts.accepted = 4; });
    domestic.push(...applyInternships(us).map(o => o.typeId));
  }
  assert.ok(domestic.includes('natlab') || domestic.includes('startup'), 'a US passport opens doors that are otherwise shut');
});

test('the excuse is drawn from the calendar, not from the air', () => {
  const s = summerCandidate(7);
  const offer = { start: nextIndexFor(6, s.month + 1), end: 0, typeId: 'sde' };
  const p = createProject(s);
  p.targetMonth = offer.start + 1; p.targetVenue = 'NeurIPSy'; p.status = 'Drafting';
  const cols = collisions(s, offer);
  assert.ok(cols.some(c => c.kind === 'deadline' && c.venue === 'NeurIPSy'), 'a deadline inside the summer is a real objection');
  assert.ok(collisionWeight(s, offer) >= 1);
  p.status = 'Rebuttal';
  assert.ok(collisions(s, offer).some(c => c.kind === 'owed'), 'an unfinished draft is a different objection');
});

test('willingness moves the way the brief says it does, and going anyway always works', () => {
  const kind = summerCandidate(3, x => { x.advisor.caring = 85; x.advisor.ambition = 30; x.advisor.toxicity = 10; x.relationship.trust = 80; x.relationship.satisfaction = 80; x.advisor.funding = 30; });
  const hostile = summerCandidate(3, x => { x.advisor.caring = 20; x.advisor.ambition = 90; x.advisor.toxicity = 75; x.relationship.trust = 30; x.relationship.satisfaction = 30; x.advisor.funding = 80; });
  const offer = { id: 'o', typeId: 'research', start: nextIndexFor(6, kind.month + 1), end: 0, salary: 8500, employer: 'X', mentor: 'Dr. Y' };
  assert.ok(internWillingness(kind, offer) > internWillingness(hostile, offer) + 30);
  // And quant is the summer they like least.
  assert.ok(internWillingness(kind, { ...offer, typeId: 'quant' }) < internWillingness(kind, { ...offer, typeId: 'research' }));

  // Forbidden, and you go anyway: it works, and the bill arrives in the relationship.
  const s = summerCandidate(3, x => { x.advisor.caring = 10; x.advisor.ambition = 95; x.advisor.toxicity = 85; x.relationship.trust = 20; x.relationship.satisfaction = 20; x.advisor.funding = 90; x.player.skills.coding = 95; x.counts.accepted = 3; });
  const offers = applyInternships(s);
  if (!offers.length) return;   // a hostile advisor does not stop the recruiters, but the seed might
  const talk = openInternTalk(s, offers[0].id);
  assert.ok(['hijack', 'forbid'].includes(talk.stance), `expected pushback, got ${talk.stance}`);
  const before = { sat: s.relationship.satisfaction, trust: s.relationship.trust };
  playInternMove(s, 'go');
  assert.ok(s.internship, 'going anyway always works');
  assert.ok(s.relationship.satisfaction < before.sat && s.relationship.trust < before.trust, 'and it is never free');
  assert.ok(s.letterDrag > 0, 'forcing it is remembered when the letters are written');
});

test('asking a labmate is free, tells you the truth, and never settles the argument', () => {
  const s = summerCandidate(9, x => { x.advisor.caring = 30; x.advisor.ambition = 85; x.advisor.toxicity = 60; x.player.skills.coding = 95; x.counts.accepted = 3; });
  const offers = applyInternships(s);
  if (!offers.length) return;
  const talk = openInternTalk(s, offers[0].id);
  if (talk.settled) return;
  const before = { sat: s.relationship.satisfaction, energy: s.player.stats.energy };
  const r = playInternMove(s, 'ask_labmate');
  assert.equal(r.outcome, 'informed');
  assert.equal(s.relationship.satisfaction, before.sat, 'it costs nothing with your advisor');
  assert.ok(['fair', 'unfair'].includes(s.intern.talk.knowsTruth));
  assert.equal(s.intern.talk.settled, false, 'knowing is not the same as winning');
  assert.equal(internObjectionIsFair(s, offers[0]), s.intern.talk.knowsTruth === 'fair');
});

test('declining is a settled ending, and the offer list closes with it', () => {
  const s = summerCandidate(15, x => { x.player.skills.coding = 90; x.counts.accepted = 2; });
  const offers = applyInternships(s);
  if (!offers.length) return;
  openInternTalk(s, offers[0].id);
  playInternMove(s, 'decline');
  assert.equal(s.intern.talk.outcome, 'declined');
  assert.equal(s.internship, null, 'you did not go');
  assert.equal(internTalkMoves(s).length, 0, 'the conversation is over');
  assert.throws(() => playInternMove(s, 'go'), /over/i);
});

test('the summer ends with the deltas it promised, and SDE gives research back slowly', () => {
  for (const id of Object.keys(internTypes)) {
    const s = summerCandidate(21 + id.length);
    s.internship = { start: s.month, end: s.month + 2, company: 'Cloudvale', typeId: id, salary: internTypes[id].salary, mentor: 'Dr. Q' };
    s.intern = { season: 1, offers: [], talk: { outcome: 'blessed', settled: true }, history: [] };
    const before = { ...s.player.skills };
    endInternship(s);
    assert.equal(s.internship, null, 'the summer is over');
    assert.equal(s.counts.internships, 1);
    assert.equal(s.intern.history.length, 1);
    assert.equal(s.intern.history[0].typeId, id);
    for (const [k, v] of Object.entries(internTypes[id].skills)) {
      if (v > 0) assert.ok(s.player.skills[k] >= before[k], `${id} should not reduce ${k}`);
      if (v < 0) assert.ok(s.player.skills[k] <= before[k], `${id} should reduce ${k}`);
    }
  }
  const sde = summerCandidate(31);
  sde.player.skills.research = 70;
  sde.internship = { start: sde.month, end: sde.month + 2, company: 'Cloudvale', typeId: 'sde', salary: 11000 };
  sde.intern = { season: 1, offers: [], talk: { outcome: 'hijacked', settled: true }, history: [] };
  endInternship(sde);
  assert.ok(sde.player.skills.research < 70, 'the research skill you had in May is not the one you have in September');
});

test('the ledger pays what the offer said, which is sometimes worse than the stipend', () => {
  const rich = enterProgram(41), poor = enterProgram(41);
  for (const [s, id] of [[rich, 'quant'], [poor, 'teaching']]) {
    s.month = 30;
    s.internship = { start: 30, end: 32, company: 'X', typeId: id, salary: internTypes[id].salary };
  }
  assert.ok(monthlyLedger(rich).stipend > rich.program.stipend * 3, 'a quant summer is a different financial year');
  assert.ok(monthlyLedger(poor).stipend < poor.program.stipend, 'teaching over the summer costs you money');
  assert.ok(/less than the stipend/i.test(monthlyLedger(poor).note || ''), 'and the ledger says so');
});

test('every advisor line and every player move is written, tokenised, and answerable', () => {
  for (const [kind, lines] of Object.entries(hijackLines)) {
    assert.ok(lines.length, `${kind} has no lines`);
    for (const line of lines) {
      const tokens = [...line.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
      for (const tk of tokens) assert.ok(['venue', 'project', 'milestone'].includes(tk), `${kind}: cannot fill {${tk}}`);
    }
  }
  for (const st of ['bless', 'trade', 'forbid']) assert.ok(stanceLines[st]?.length, `${st} has no lines`);
  for (const [id, mv] of Object.entries(internMoves)) {
    assert.equal(mv.id, id);
    assert.ok(mv.label && mv.hint && mv.line, `${id} is not written`);
    if (!['go', 'decline', 'ask_labmate'].includes(id)) assert.ok(mv.good && mv.bad, `${id} has no outcomes`);
  }
  for (const k of ['blessedPaper', 'blessedNothing', 'hijackedPaper', 'hijackedNothing', 'forbidden', 'rough']) assert.ok(returnLines[k], `no return line for ${k}`);
});
