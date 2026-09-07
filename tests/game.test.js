import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, populateLab } from '../src/engine/state.js';
import { dispatch, prelimChance, focusOptions } from '../src/engine/game.js';
import { admissionChance, applicationCost, interviewStep } from '../src/engine/apply.js';
import { schools, mutators, achievements } from '../src/data/catalog.js';
import { venues, venueReferences, nextDeadline, timelineFor, acceptsThisMonth } from '../src/data/venues.js';
import { monthOf, dateLabel, holidays } from '../src/data/calendar.js';
import { events, eventById } from '../src/data/events.js';
import { meetings } from '../src/data/meetings.js';
import { requests } from '../src/data/requests.js';
import { asks } from '../src/data/asks.js';
import { crisisMoveList } from '../src/engine/life.js';
import { templateById, eligible, freshness } from '../src/engine/events.js';
import { createProject, acceptanceChance, setTarget } from '../src/engine/paper.js';
import { loadSave, saveRun, validRun, emptyMeta } from '../src/engine/save.js';
import { memeFor, memeArt } from '../src/data/memes.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { t } from '../src/i18n/index.js';
import { emailFollowUps, visitQuestions } from '../src/data/threads.js';

function resolveAll(state) {
  // A choice can leave a real-time scene on screen (the lecture minigame, a pushback exchange).
  // Clear those too, or a test that only drained the event queue asserts against the wrong stage.
  let guard = 0;
  while ((state.event || ['minigame', 'pushback'].includes(state.stage)) && guard++ < 60) {
    if (state.stage === 'summons') { state = dispatch(state, { type: 'SUMMONS', id: 'go' }); continue; }
    if (state.stage === 'minigame' && state.minigame === 'viva') { state = dispatch(state, { type: 'VIVA', tally: { land: 3, concede: 2, caught: 1, silent: 0, composure: 66 } }); continue; }
    if (state.stage === 'minigame') { state = dispatch(state, { type: 'LECTURE', worked: 9, attention: 5, caught: 1 }); continue; }
    if (state.stage === 'pushback') {
      const pb = pushbacks.find(x => x.id === state.pushback?.id);
      state = dispatch(state, { type: 'PUSHBACK', id: pb ? pb.options[0].id : 'hold' });
      continue;
    }
    const e = templateById[state.event];
    const ok = e.choices.find(c => !c.ending && !(c.requiresCoursework && state.coursework < c.requiresCoursework)) || e.choices[0];
    state = dispatch(state, { type: 'CHOICE', id: ok.id });
  }
  return state;
}
const act = (s, a) => resolveAll(dispatch(s, a));

// Getting in is no longer a formality — that is goal #1 of the design — so a fixture that needs
// an enrolled student asks for one rather than asserting that this particular seed got lucky.
function enterProgram(seed = 1) {
  for (let bump = 0; bump < 12; bump++) {
    try { return enterProgramOnce(seed + bump * 1000); } catch (e) { if (bump === 11) throw e; }
  }
}
// Same walk, with the questionnaire answers under test.
function enterProgramWith(seed, extra) {
  for (let bump = 0; bump < 12; bump++) {
    try { return enterProgramOnce(seed + bump * 1000, extra); } catch (e) { if (bump === 11) throw e; }
  }
}
function enterProgramOnce(seed = 1, extra = {}) {
  let s = createRun(seed, { background: 'masters', topic: 'systems', international: false, ...extra });
  s = act(s, { type: 'PREP', id: 'sop_draft' });
  s = act(s, { type: 'PREP', id: 'letter_ask', target: 'rec-0' });
  s = act(s, { type: 'PREP', id: 'proceed' });
  for (const school of schools.slice(8, 22)) {
    if (s.player.stats.energy < 3 || s.player.stats.money < 75) break;
    s = act(s, { type: 'APPLY', schoolId: school.id, effort: 'generic', contact: false, poiId: s.advisors.find(a => a.schoolId === school.id).id });
  }
  s = act(s, { type: 'ADMISSIONS' });
  // Each interview draws its own questions now, so answer whatever is actually asked.
  for (const app of s.applications.filter(a => a.interview)) {
    for (let n = 0; n < 8; n++) {
      const live = s.applications.find(a => a.schoolId === app.schoolId);
      if (!live?.interview || live.interview.done) break;
      const q = interviewStep(live);
      if (!q) break;
      s = act(s, { type: 'INTERVIEW', schoolId: app.schoolId, id: q.options[0].id });
    }
  }
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
  const tailoredCost = applicationCost(s, 'tailored', false).energy;
  const genericCost = applicationCost(s, 'generic', false).energy;
  assert.ok(tailoredCost > genericCost, 'tailoring costs more than spraying');
  assert.ok(s.player.stats.energy <= before.energy - tailoredCost, 'a tailored application costs energy');
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
  s = act(s, { type: 'START_PROJECT' });          // Research needs something to research
  s = act(s, { type: 'PLAN', id: 'research' });
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
  s = act(s, { type: 'START_PROJECT' });          // Research needs something to research
  s = act(s, { type: 'PLAN', id: 'research' });
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
  if (!s.projects.some(p => !['Accepted', 'Abandoned'].includes(p.status))) s = act(s, { type: 'START_PROJECT' });   // research needs something to research
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
  s = act(s, { type: 'START_PROJECT' });          // Write needs something to write
  s = act(s, { type: 'PLAN', id: 'write' });
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
  if (s.stage === 'summons') return dispatch(s, { type: 'SUMMONS', id: 'go' });
  if (s.stage === 'minigame' && s.minigame === 'viva') return dispatch(s, { type: 'VIVA', tally: { land: 3, concede: 2, caught: 1, silent: 0, composure: 66 } });
  if (s.stage === 'crisis') return dispatch(s, { type: 'CRISIS', id: 'treat' });
  if (s.stage === 'commencement') return dispatch(s, { type: 'TAKE_OFFER', id: s.jobs.market[0].kind });
  if (s.stage === 'epilogue') { const b = currentBeat(s); return dispatch(s, { type: 'EPILOGUE', id: b ? b.choices[0].id : 'ok' }); }
  return s;
}

test('a health crisis stops the turn until it is answered', () => {
  let s = enterProgram(4);
  let guard = 0;
  // Below CRISIS_HEALTH the crisis is not a dice roll, so this is the whole path: month start
  // draws it, beginTurn must not overwrite it, and nothing else may run until it is answered.
  while (s.phase === 'playing' && s.stage !== 'crisis' && guard++ < 40) {
    if (s.stage === 'plan') {
      s.player.stats.health = 12;
      if (!s.focus) s = act(s, { type: 'PLAN', id: focusOptions(s).find(f => !f.disabled).id });
      s = act(s, { type: 'CONTINUE' });
    }
    if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' });
    if (s.stage === 'milestone') s = act(s, { type: 'MILESTONE', id: 'balanced' });
    if (s.stage !== 'crisis') s = resolveAll(advance(s));
  }
  assert.equal(s.stage, 'crisis', 'the crisis survives the start of the turn');
  assert.throws(() => dispatch(s, { type: 'CONTINUE' }), /screen|report/i, 'CONTINUE is refused');
  assert.throws(() => dispatch(s, { type: 'PLAN', id: 'research' }), /screen|report/i, 'PLAN is refused');
  assert.ok(crisisMoveList(s).length >= 3, 'and there are moves to choose from');
  s = dispatch(s, { type: 'CRISIS', id: 'treat' });
  assert.equal(s.stage, 'plan', 'answering it hands the turn back');
  assert.ok(s.flags.afterCrisis, 'and the run remembers it happened');
  assert.throws(() => dispatch(s, { type: 'CRISIS', id: 'treat' }), /nothing to deal with/i, 'it cannot be answered twice');
});

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
  // A hundred seeds, not fifty: the true rate is around 91%, and a fifty-seed window can come up
  // all-settled often enough to fail a "<99%" assertion on nothing but luck.
  let settled5 = 0, stuck = 0, runs = 0;
  for (let seed = 40; seed < 140; seed++) {
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
    runs++;
    if (s.grad.settled && s.grad.targetYear === 5) settled5++;
    if (!s.grad.settled) { playTimelineMove(s, 'accept'); assert.equal(s.grad.targetYear, 6); stuck++; }
  }
  assert.ok(settled5 / runs > .6, `a strong communicator usually gets out on time (got ${settled5}/${runs})`);
  assert.ok(settled5 / runs < .99, `but not always — willingness is real (got ${settled5}/${runs})`);
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

// A candidate who did the ordinary thing and lined up letters. Tests that care about the
// letter gate build their own packet instead.
const withLetters = (s, n = 4, quality = 62, darkHorse = false) => {
  s.letters = { asked: [], closed: false };
  const kinds = ['advisor', 'committee', 'collaborator', 'mentor', 'senior'];
  for (let i = 0; i < n; i++) s.letters.asked.push({
    id: `w-${i}`, kind: kinds[i % kinds.length], name: `Writer ${i}`, status: 'yes',
    reach: i === 0 ? 0 : 2, quality, darkHorse: darkHorse && i === 1, register: 'warm', line: '',
  });
  return s;
};
function graduand(seed, mutate = () => {}) {
  let s = enterProgram(seed);
  s.month = 58;
  s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass'; s.milestones.graduated = true;
  withLetters(s);
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
    if (!admitted(seed)) continue;
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
    if (!admitted(seed)) continue;
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
  const talk = openInternTalk(s, offers[0].id);
  if (talk.settled) return;   // an advisor who simply says go leaves nothing to decline
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

test('every achievement the engine awards exists in the catalog, and every catalog entry is reachable', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = new URL('../src/engine/', import.meta.url).pathname;
  const awarded = new Set();
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.js')) continue;
    for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/\baward\(\s*\w+\s*,\s*'([a-zA-Z_][\w]*)'/g)) awarded.add(m[1]);
  }
  assert.ok(awarded.size > 30, `only found ${awarded.size} award sites — did the call shape change?`);
  for (const id of awarded) assert.ok(achievements[id], `award('${id}') has no catalog entry — it would unlock a blank`);
  for (const [id, a] of Object.entries(achievements)) {
    assert.ok(a.name && a.desc, `${id} is not written`);
    assert.ok(a.desc.length > 20, `${id} needs a real description`);
  }
});

test('every achievement is translated, so no unlock arrives half in English', async () => {
  const { setAppLanguage } = await import('../src/i18n/apply.js');
  const before = JSON.parse(JSON.stringify(achievements));
  setAppLanguage('zh');
  const untranslated = Object.keys(achievements).filter(k => achievements[k].desc === before[k].desc);
  setAppLanguage('en');
  assert.deepEqual(untranslated, [], `untranslated achievement descriptions: ${untranslated.join(', ')}`);
  for (const [id, a] of Object.entries(before)) assert.deepEqual(achievements[id], a, `${id} did not restore to English`);
});

// ── Recommendation letters ─────────────────────────────────────────────────────
import { LETTERS_REQUIRED, writerKinds, askLines, packetVerdicts, darkHorseLines } from '../src/data/letters.js';
import { availableWriters, askLetter, letterCount, hasAdvisorLetter, lettersReady, packetStrength, letterGate, needsLetters, darkHorseReveal, closeLetters } from '../src/engine/letters.js';

test('letters are required for faculty and postdocs, and never for industry', () => {
  assert.ok(needsLetters('tenure_track') && needsLetters('postdoc') && needsLetters('teaching_faculty'));
  assert.ok(!needsLetters('product_eng') && !needsLetters('quant') && !needsLetters('founder'));
  const s = graduand(60, x => { x.letters = { asked: [], closed: false }; });
  assert.ok(letterGate(s, 'tenure_track').blocked, 'no letters, no faculty file');
  assert.ok(!letterGate(s, 'product_eng').blocked, 'industry asks for referees it never calls');
  assert.ok(letterGate(s, 'tenure_track').why.length > 20, 'and it says why');
  // Three is not four.
  withLetters(s, 3);
  assert.ok(letterGate(s, 'tenure_track').blocked, `${LETTERS_REQUIRED} is the minimum and three is not it`);
  withLetters(s, 4);
  assert.ok(!letterGate(s, 'tenure_track').blocked);
  // A packet without the advisor is not a packet, whatever the count.
  s.letters.asked = s.letters.asked.map(l => ({ ...l, kind: 'committee' }));
  assert.ok(!hasAdvisorLetter(s));
  assert.ok(letterGate(s, 'tenure_track').blocked, 'a faculty file without the advisor is not a file');
});

test('who you can ask comes from people the run actually produced', () => {
  const bare = graduand(61);
  const ids = availableWriters(bare).map(w => w.kind);
  assert.ok(ids.includes('advisor'), 'the advisor is always available');
  assert.ok(ids.includes('committee'), 'the committee exists by now');
  assert.ok(!ids.includes('collaborator'), 'no collaboration happened in this run');

  const connected = graduand(61, x => { x.flags.collabOffer = true; x.collabFrom = 'a group in Lisbon'; x.conferenceConnections = 9; x.lastInternship = { company: 'Cloudvale', end: 30 }; });
  const rich = availableWriters(connected).map(w => w.kind);
  for (const k of ['collaborator', 'mentor', 'senior']) assert.ok(rich.includes(k), `${k} should be available to a connected candidate`);
  assert.ok(rich.length > ids.length, 'a bigger world means more people to ask');
  // Asking someone twice is not a way to get five letters from four people.
  const s = graduand(61);
  const first = availableWriters(s)[0];
  askLetter(s, first.id);
  assert.ok(!availableWriters(s).some(w => w.id === first.id));
  assert.throws(() => askLetter(s, first.id));
});

test('a big name who barely knows you is how you acquire a dark horse', () => {
  let seniorDark = 0, postdocDark = 0, seniorN = 0, postdocN = 0;
  for (let seed = 700; seed < 780; seed++) {
    if (!admitted(seed)) continue;
    const a = graduand(seed, x => { x.letters = { asked: [], closed: false }; x.conferenceConnections = 9; });
    const senior = availableWriters(a).find(w => w.kind === 'senior');
    if (senior) { const r = askLetter(a, senior.id); if (r.status === 'yes') { seniorN++; if (a.letters.asked.at(-1).darkHorse) seniorDark++; } }
    const b = graduand(seed, x => { x.letters = { asked: [], closed: false }; });
    const pd = availableWriters(b).find(w => w.kind === 'postdocmate');
    if (pd) { const r = askLetter(b, pd.id); if (r.status === 'yes') { postdocN++; if (b.letters.asked.at(-1).darkHorse) postdocDark++; } }
  }
  assert.ok(seniorN > 10 && postdocN > 10, `not enough samples (${seniorN}/${postdocN})`);
  const seniorRate = seniorDark / seniorN, postdocRate = postdocDark / postdocN;
  assert.ok(seniorRate > postdocRate, `the prestigious stranger should be riskier (${seniorRate.toFixed(2)} vs ${postdocRate.toFixed(2)})`);
  assert.ok(postdocRate < .3, 'someone who supervised you daily rarely writes a quiet letter');
});

test('one dark horse is not averaged away by three good letters', () => {
  const clean = graduand(62, x => withLetters(x, 4, 72, false));
  const doomed = graduand(62, x => withLetters(x, 4, 72, true));
  const a = packetStrength(clean), b = packetStrength(doomed);
  assert.ok(b.score < a.score - 10, `the dark horse must bite (${a.score} vs ${b.score})`);
  assert.ok(b.darkHorse === true && a.darkHorse === false);
  assert.ok(darkHorseReveal(doomed), 'and it is explained afterwards, once it cannot be fixed');
  assert.equal(darkHorseReveal(clean), null, 'nothing to reveal when there was nothing');
});

test('letters from outside the lab are worth more than letters from inside it', () => {
  const inside = graduand(63);
  inside.letters = { asked: [0, 1, 2, 3].map(i => ({ id: `i${i}`, kind: i ? 'postdocmate' : 'advisor', name: `A${i}`, status: 'yes', reach: 0, quality: 65, darkHorse: false })) };
  const outside = graduand(63);
  outside.letters = { asked: [0, 1, 2, 3].map(i => ({ id: `o${i}`, kind: i ? 'collaborator' : 'advisor', name: `B${i}`, status: 'yes', reach: i ? 3 : 0, quality: 65, darkHorse: false })) };
  assert.ok(packetStrength(outside).score > packetStrength(inside).score);
  assert.equal(packetStrength(inside).verdict, 'inside', 'a file entirely from one lab reads as a smaller world');
  assert.ok(packetVerdicts[packetStrength(outside).verdict]);
});

test('the packet moves the market, and closes when the applications go out', () => {
  const lift = x => { x.advisor.prestige = 88; x.advisor.connections = 80; x.program.prestige = 88; x.conferenceConnections = 8; };
  const strong = graduand(64, x => { withPapers(x, 3); lift(x); withLetters(x, 5, 88); x.jobs.track = 'tenure_track'; });
  const weak = graduand(64, x => { withPapers(x, 3); lift(x); withLetters(x, 4, 34); x.jobs.track = 'tenure_track'; });
  // The hardest employer floors both files at the clamp, which compares two floors and proves
  // nothing. Use the most reachable one in the track, where the letters can actually move it.
  const e = [...employersFor('tenure_track')].sort((a, b) => a.difficulty - b.difficulty)[0];
  const so = slateOdds(strong, buildCV(strong), e), wo = slateOdds(weak, buildCV(weak), e);
  assert.ok(so.per > wo.per, `better letters, better odds (${so.per} vs ${wo.per})`);
  assert.ok(so.per > .012, 'and the comparison must not be against the clamp floor');
  const closed = closeLetters(strong);
  assert.ok(closed.score > 0 && strong.letters.closed);
  assert.throws(() => askLetter(strong, availableWriters(strong)[0]?.id || 'w-chair'), /closed/i);
});

test('every writer kind and every register is written', () => {
  assert.equal(Object.keys(writerKinds).length, 7);
  for (const [id, w] of Object.entries(writerKinds)) {
    assert.equal(w.id, id);
    assert.ok(w.label && w.blurb && w.note, `${id} is not written`);
    assert.ok(Number.isFinite(w.reach));
  }
  for (const k of ['warm', 'dutiful', 'hedged', 'refused']) assert.ok(askLines[k]?.length >= 2, `${k} needs lines`);
  for (const k of ['strong', 'solid', 'thin', 'inside', 'short']) assert.ok(packetVerdicts[k], `no verdict copy for ${k}`);
  assert.ok(darkHorseLines.length >= 4);
  assert.ok(darkHorseLines.every(l => !/[.!?]$/.test(l)), 'dark horse lines are fragments, quoted mid-sentence');
});

// ── The job search ─────────────────────────────────────────────────────────────
import { portals, efforts, rejections, reactions, tells } from '../src/data/portals.js';
import { absWeek as jobAbsWeek } from '../src/engine/state.js';
import { applyJob, jobsMonth, listingsFor, portalOpen, openPortals, funnel, discloseSearch, withdrawApp, setWorkAuth, sponsorBlocked, ensureJobs, heatBand, liveOffers } from '../src/engine/jobsearch.js';

const marketReady = (seed, mutate = () => {}) => graduand(seed, s => {
  s.month = 44; s.milestones.graduated = false; s.phase = 'playing'; s.stage = 'plan';
  s.player.stats.energy = 100;
  withPapers(s, 3);
  mutate(s);
});

test('the boards are seasonal, and the faculty season is the short one', () => {
  const s = marketReady(800);
  for (const [id, p] of Object.entries(portals)) {
    assert.ok(p.name && p.tagline && p.chrome && p.empty && p.applyNote, `${id} is not written`);
    assert.ok(p.tracks.length, `${id} lists no tracks`);
    assert.ok(p.opens.every(m => m >= 1 && m <= 12));
  }
  assert.ok(portals.linkedout.opens.length === 12, 'industry hires all year');
  assert.ok(portals.crab.opens.length <= 4, 'the faculty season is short');
  assert.ok(portals.crab.needsLetters && portals.pipeline.needsLetters && !portals.linkedout.needsLetters);
  // No track is served by two portals, or the same job appears twice.
  const seen = new Set();
  for (const p of Object.values(portals)) for (const tr of p.tracks) { assert.ok(!seen.has(tr), `${tr} is on two boards`); seen.add(tr); }
});

test('the board is stable within a month, reshuffles across months, and never touches the RNG', () => {
  const s = marketReady(801);
  const before = s.rng;
  const a = listingsFor(s, 'linkedout').map(x => x.id);
  const b = listingsFor(s, 'linkedout').map(x => x.id);
  assert.deepEqual(a, b, 'two renders in one month must agree');
  assert.equal(s.rng, before, 'rendering a board must not consume randomness');
  s.month += 1;
  assert.notDeepEqual(listingsFor(s, 'linkedout').map(x => x.id), a, 'a new month is a new board');
  // And it is not sorted by prestige, or everyone applies to the same five places.
  s.month = 44;
  const diffs = listingsFor(s, 'linkedout').slice(0, 6).map(e => e.difficulty);
  assert.ok(new Set(diffs).size > 1, 'the top of the board must not be one difficulty band');
});

test('the sponsorship checkbox closes the application in the same afternoon', () => {
  const intl = marketReady(802, s => { s.player.profile.international = true; });
  ensureJobs(intl);
  // Sponsorship only, not one that is also closed on citizenship — those are a different gate.
  const closed = listingsFor(intl, 'linkedout').find(e => e.sponsorBlocked && !e.gate.blocked);
  assert.ok(closed, 'some employer must not sponsor');
  const app = applyJob(intl, closed.id, 'standard');
  assert.equal(app.stage, 'rejected');
  assert.equal(app.why, 'sponsorship');
  assert.equal(funnel(intl).auto, 1, 'the tracker counts it separately');
  const mail = intl.inbox.find(m => m.sender === closed.name);
  assert.ok(mail, 'and there is a mail, sent by something that did not read the rest');

  // A domestic candidate never sees the question at all.
  const dom = marketReady(802, s => { s.player.profile.international = false; });
  ensureJobs(dom);
  assert.ok(!listingsFor(dom, 'linkedout').some(e => e.sponsorBlocked));
  assert.throws(() => setWorkAuth(dom, 'no'), /does not apply/i);
  // Answering "no" clears the screen. It does not make the clause go away.
  setWorkAuth(intl, 'no');
  assert.ok(!sponsorBlocked(intl, closed));
  assert.ok(intl.flags.sawTheBox);
});

test('an application freezes its odds and its committee, and resolves later', () => {
  const s = marketReady(803);
  const e = listingsFor(s, 'linkedout').find(x => !x.gate.blocked && !x.sponsorBlocked);
  const before = s.player.stats.energy;
  const app = applyJob(s, e.id, 'tailored');
  assert.equal(app.stage, 'submitted');
  assert.ok(app.odds.screen > 0 && app.odds.invite > 0 && app.odds.offer > 0);
  assert.ok(app.mood >= .35 && app.mood <= 1.85, 'the committee is drawn once and frozen');
  assert.ok(s.player.stats.energy < before, 'a tailored application costs more than a click');
  assert.ok(app.nextAt > 0, 'you find out later, which is the only honest way to model it');
  assert.throws(() => applyJob(s, e.id, 'standard'), /already applied/i);
  // Effort is a real lever with a real price.
  assert.ok(efforts.tailored.energy > efforts.standard.energy && efforts.standard.energy > efforts.easy.energy);
  assert.ok(efforts.tailored.delta > efforts.easy.delta);
});

test('most applications do not become jobs, and some never resolve at all', () => {
  let sent = 0, offers = 0, ghosted = 0, landed = 0, runs = 0;
  for (let seed = 810; seed < 840; seed++) {
    const s = marketReady(seed);
    for (let m = 0; m < 14 && s.month < 66; m++) {
      for (const pid of openPortals(s)) {
        for (const e of listingsFor(s, pid).filter(x => !x.gate.blocked && !x.sponsorBlocked).slice(0, 3)) {
          if ((s.jobs?.apps?.length || 0) >= 18) break;
          s.player.stats.energy = 100;
          try { applyJob(s, e.id, 'standard'); } catch {}
        }
      }
      s.month++; jobsMonth(s);
    }
    const f = funnel(s);
    sent += f.sent; offers += f.offers; ghosted += f.silent; runs++;
    if (f.offers) landed++;
  }
  assert.ok(sent / runs > 8, `the bot should send a real slate (${(sent / runs).toFixed(1)})`);
  assert.ok(offers < sent * .25, 'most applications must not become offers');
  assert.ok(ghosted > runs, 'silence is a normal outcome, not an edge case');
  assert.ok(landed < runs, 'not everyone lands something');
  assert.ok(landed > runs * .1, 'and it is not hopeless either');
});

test('applying quietly builds heat, and being found out has four different advisors in it', () => {
  const s = marketReady(850, x => { x.advisor.connections = 85; x.advisorMode = { id: 'attentive' }; });
  for (const pid of openPortals(s)) for (const e of listingsFor(s, pid).filter(x => !x.gate.blocked).slice(0, 3)) {
    s.player.stats.energy = 100; try { applyJob(s, e.id, 'standard'); } catch {}
  }
  assert.ok(s.jobs.apps.every(a => a.quiet), 'nothing has been said, so everything is quiet');
  const h0 = s.jobs.heat;
  jobsMonth(s);
  assert.ok(s.jobs.heat > h0, 'an unexplained absence accumulates');
  assert.ok(['quiet', 'noticeable', 'obvious', 'loud'].includes(heatBand(s)));

  // Every reaction is written and every tell is written.
  for (const k of ['ally', 'professional', 'chill', 'punitive']) assert.ok(reactions[k]?.length > 40, `${k} is not written`);
  for (const k of Object.keys(tells)) assert.ok(tells[k].length > 30, `${k} is not written`);

  // Saying it yourself costs a bad ten minutes and buys the heat back.
  const told = marketReady(851, x => { x.advisor.caring = 80; });
  applyJob(told, listingsFor(told, 'linkedout').find(e => !e.gate.blocked && !e.sponsorBlocked).id, 'standard');
  told.jobs.heat = 50;
  const kind = discloseSearch(told);
  assert.equal(told.jobs.heat, 0);
  assert.ok(told.jobs.secret.disclosed);
  assert.ok(told.jobs.apps.every(a => !a.quiet));
  assert.equal(kind, 'ally', 'a caring advisor makes calls');
  assert.throws(() => discloseSearch(told), /already know/i);
});

test('a punitive discovery is remembered when the letters are written, and never shown', () => {
  const s = marketReady(852, x => { x.advisor.caring = 5; x.advisor.toxicity = 95; x.advisor.ambition = 95; x.relationship.trust = 10; x.relationship.satisfaction = 10; x.relationship.dependency = 60; x.advisor.connections = 95; x.advisorMode = { id: 'attentive' }; });
  for (const pid of openPortals(s)) for (const e of listingsFor(s, pid).filter(x => !x.gate.blocked).slice(0, 3)) {
    s.player.stats.energy = 100; try { applyJob(s, e.id, 'standard'); } catch {}
  }
  const drag0 = s.letterDrag || 0;
  // Keep the search live: discovery is about an ongoing absence, not a closed one.
  for (let i = 0; i < 40 && !s.jobs.secret.discovered; i++) {
    s.month++;
    for (const a of s.jobs.apps) if (!['rejected', 'ghosted', 'withdrawn', 'offer'].includes(a.stage)) a.nextAt = jobAbsWeek(s) + 8;
    s.jobs.heat = 100;
    jobsMonth(s);
  }
  assert.ok(s.jobs.secret.discovered, 'with that advisor and that heat it comes out');
  assert.ok(['chill', 'punitive'].includes(s.jobs.secret.reaction), `expected a cold reaction, got ${s.jobs.secret.reaction}`);
  assert.ok((s.letterDrag || 0) > drag0, 'the mood the letter is written in is recorded');
  assert.ok(s.jobs.secret.tell && tells[s.jobs.secret.tell], 'something specific gave it away');
});

test('the ending is the search you ran, not a fresh roll at the end', () => {
  const s = marketReady(860);
  const e = listingsFor(s, 'linkedout').find(x => !x.gate.blocked && !x.sponsorBlocked);
  const app = applyJob(s, e.id, 'tailored');
  app.stage = 'offer'; app.deadlineMonth = s.month + 2;
  app.history.push({ stage: 'offer', month: s.month });
  const offers = generateOffers(s, buildCV(s));
  assert.ok(s.jobs.fromSearch, 'the market must read the applications');
  assert.equal(offers.length, 1);
  assert.equal(offers[0].employerId, e.id, 'the offer you got is the offer you get');
  assert.ok(liveOffers(s).length === 1);

  // A search that produced nothing says so, rather than quietly rolling you a job.
  const empty = marketReady(861);
  for (const x of listingsFor(empty, 'linkedout').filter(y => !y.gate.blocked && !y.sponsorBlocked).slice(0, 6)) {
    empty.player.stats.energy = 100; try { applyJob(empty, x.id, 'standard'); } catch {}
  }
  for (const a of empty.jobs.apps) { a.stage = 'rejected'; a.why = 'form'; }
  const none = generateOffers(empty, buildCV(empty));
  assert.equal(none[0].kind, 'unplaced');
  assert.ok(empty.jobs.fromSearch);
});

test('an offer moves the timeline once, and the move has a shadow you never see', () => {
  let wins = 0, burns = 0, drags = 0, runs = 0;
  for (let seed = 870; seed < 910; seed++) {
    const s = marketReady(seed, x => { x.advisor.toxicity = 70; x.advisor.caring = 30; x.relationship.trust = 40; });
    openTimeline(s);
    if (s.grad.settled) continue;
    const e = listingsFor(s, 'linkedout').find(x => !x.gate.blocked && !x.sponsorBlocked);
    const app = applyJob(s, e.id, 'standard');
    app.stage = 'offer'; app.deadlineMonth = s.month + 1;
    const moves = timelineMoves(s).map(m => m.id);
    assert.ok(moves.includes('offer'), 'a live offer unlocks the move');
    const drag0 = s.letterDrag || 0;
    const r = playTimelineMove(s, 'offer');
    runs++;
    if (r.won) wins++;
    if (s.grad.burned) burns++;
    if ((s.letterDrag || 0) > drag0) drags++;
    assert.ok(s.flags.usedOfferAsLeverage);
    // Once per run, whatever happened.
    assert.ok(!timelineMoves(s).some(m => m.id === 'offer'));
  }
  assert.ok(runs > 20, `not enough samples (${runs})`);
  assert.ok(wins > 2 && wins < runs, `the move must be able to win and to fail (${wins}/${runs})`);
  assert.ok(burns > 0, 'losing it badly must be possible');
  assert.ok(drags > 0 && drags < runs, 'the shadow falls sometimes, not always');
  // With no offer in hand there is no move.
  const nothing = marketReady(911);
  openTimeline(nothing);
  if (!nothing.grad.settled) assert.ok(!timelineMoves(nothing).some(m => m.id === 'offer'));
});

test('every rejection register is written, and the ghost has no mail by design', () => {
  for (const k of ['sponsorship', 'form', 'screen', 'onsite', 'internal', 'cancelled']) {
    assert.ok(rejections[k]?.length, `${k} has no copy`);
    for (const line of rejections[k]) assert.ok(line.length > 60, `${k} is too thin to sting`);
  }
  assert.equal(rejections.ghost, null, 'silence has no letter; that is the mechanic');
});

test('a line built from two translated pieces still follows the language', async () => {
  const { setAppLanguage } = await import('../src/i18n/apply.js');
  const { joined, log: logLine, entryText: readEntry } = await import('../src/engine/state.js');
  const s = createRun(1);
  s.history = [];
  logLine(s, t('They push back.'));
  logLine(s, joined(t('They push back.'), ' ', t('Thanks.')));
  logLine(s, joined(t('Format review: rejected.'), ' ', t('Thanks.')));
  const en = s.history.map(e => readEntry(s, e));
  setAppLanguage('zh');
  const zh = s.history.map(e => readEntry(s, e));
  setAppLanguage('en');
  const back = s.history.map(e => readEntry(s, e));
  for (let i = 0; i < en.length; i++) {
    assert.notEqual(zh[i], en[i], `line ${i} froze in English: ${en[i]}`);
    assert.ok(/[一-鿿]/.test(zh[i]), `line ${i} has no Chinese in it`);
    assert.equal(back[i], en[i], `line ${i} did not come back to English`);
  }
  // Joining plain strings with no provenance must not invent any.
  assert.equal(joined('abc', ' ', 'def'), 'abc def');
});

// ── Funding: the academic ace ──────────────────────────────────────────────────
import { addFunding, fundingScore, fundingTotal, fundingBoost, fundingLines, researchStanding, canBeAskedToHelp, grantOdds, resolveHelp, ASK_BAR, GRANT_BASE, claimable, hasMajorFunding } from '../src/engine/funding.js';

const withRecord = (s, { papers = 0, tier1 = 0, proposal = false, trust = 65 } = {}) => {
  s.counts.accepted = papers; s.projects = [];
  for (let i = 0; i < papers; i++) { const p = createProject(s); p.status = 'Accepted'; p.venueId = i < tier1 ? 'neuripsy' : 'kddish'; }
  s.milestones.prelim = 'pass';
  s.milestones.proposal = proposal ? 'pass' : null;
  s.relationship.trust = trust;
  s.month = Math.max(s.month, 30);
  return s;
};

test('a mediocre student is never asked to help write a grant, and the bar rises with the money', () => {
  const nothing = withRecord(enterProgram(90));
  assert.equal(canBeAskedToHelp(nothing, 'small').ok, false, 'no record, no invitation');
  assert.ok(canBeAskedToHelp(nothing, 'small').why.length > 20, 'and it says why');

  const thin = withRecord(enterProgram(90), { papers: 1 });
  assert.ok(canBeAskedToHelp(thin, 'small').ok, 'one paper opens the small one');
  assert.equal(canBeAskedToHelp(thin, 'large').ok, false, 'and not the large one');

  const strong = withRecord(enterProgram(90), { papers: 3, tier1: 2, proposal: true });
  for (const size of ['small', 'single', 'large']) assert.ok(canBeAskedToHelp(strong, size).ok, `a real record opens ${size}`);
  assert.ok(researchStanding(strong) > researchStanding(thin) + 20);

  // Too early is too early, whatever the record.
  const early = withRecord(enterProgram(90), { papers: 3, tier1: 2, proposal: true });
  early.month = 9;
  assert.equal(canBeAskedToHelp(early, 'small').ok, false);

  // And a broken relationship closes it regardless.
  const estranged = withRecord(enterProgram(90), { papers: 3, tier1: 2, proposal: true, trust: 25 });
  assert.equal(canBeAskedToHelp(estranged, 'single').ok, false);

  assert.ok(ASK_BAR.small < ASK_BAR.single && ASK_BAR.single < ASK_BAR.large);
});

test('even a top student’s help does not land the grant', () => {
  const s = withRecord(enterProgram(91), { papers: 4, tier1: 3, proposal: true });
  s.advisor.prestige = 95; s.advisor.connections = 92; s.advisor.funding = 90;
  for (const size of ['small', 'single', 'large']) {
    const none = grantOdds(s, { size, help: 'none' });
    const heroic = grantOdds(s, { size, help: 'heroic' });
    assert.ok(heroic > none, `help should move ${size}`);
    assert.ok(heroic - none < .09, `but not by much (${size}: ${(heroic - none).toFixed(3)})`);
    assert.ok(heroic < .5, `and never to a coin flip (${size}: ${heroic.toFixed(2)})`);
  }
  // A weaker lab is a worse bet, whatever the student does.
  const weak = withRecord(enterProgram(91), { papers: 4, tier1: 3, proposal: true });
  weak.advisor.prestige = 45; weak.advisor.connections = 40; weak.advisor.funding = 30;
  assert.ok(grantOdds(weak, { size: 'large', help: 'heroic' }) < grantOdds(s, { size: 'large', help: 'heroic' }));
  assert.ok(GRANT_BASE.large < GRANT_BASE.single && GRANT_BASE.single < GRANT_BASE.small);
});

test('helping is mostly a rejection, and being named needs the work and the award', () => {
  const rejected = withRecord(enterProgram(92), { papers: 3, tier1: 2, proposal: true });
  const r = resolveHelp(rejected, { size: 'single', help: 'heroic', awarded: false, name: 'X', amount: 480000 });
  assert.equal(r.awarded, false);
  assert.equal(r.kind, null, 'a declined proposal puts nothing on your CV');
  assert.equal(fundingLines(rejected).length, 0);
  assert.equal(rejected.funding.rejected, 1);

  const named = withRecord(enterProgram(92), { papers: 3, tier1: 2, proposal: true });
  const n = resolveHelp(named, { size: 'single', help: 'heroic', awarded: true, name: 'Emerging Systems', amount: 480000 });
  assert.equal(n.kind, 'named');
  assert.ok(hasMajorFunding(named));

  const thanked = withRecord(enterProgram(92), { papers: 3, tier1: 2, proposal: true });
  const a = resolveHelp(thanked, { size: 'small', help: 'minimal', awarded: true, name: 'Y', amount: 40000 });
  assert.equal(a.kind, 'acknowledged', 'minimal help on a small grant is the acknowledgements');
  assert.ok(claimable(thanked.funding.records[0]) < 40000, 'and you cannot claim the whole sum');
});

test('funding is an ace on an academic search and invisible in industry', () => {
  const funded = graduand(93, s => { withPapers(s, 3); });
  addFunding(funded, 'fellowship', { name: 'Graduate Research Fellowship', amount: 111000 });
  addFunding(funded, 'named', { name: 'Emerging Systems', amount: 480000 });
  assert.ok(fundingScore(funded) > 50);
  assert.ok(fundingTotal(funded) > 500000);

  const academic = employersFor('tenure_track')[0];
  const industry = employersFor('product_eng')[0];
  assert.ok(fundingBoost(funded, academic) > 0.1, 'it must actually move an academic search');
  assert.equal(fundingBoost(funded, industry), 0, 'and do nothing in industry');
  assert.ok(fundingBoost(funded, academic) > fundingBoost(funded, employersFor('quant')[0]));

  // Diminishing: the first grant changes how the file reads, the fourth barely registers.
  const one = graduand(93, s => { withPapers(s, 3); });
  addFunding(one, 'named', { name: 'A', amount: 400000 });
  const four = graduand(93, s => { withPapers(s, 3); });
  for (const n of ['A', 'B', 'C', 'D']) addFunding(four, 'named', { name: n, amount: 400000 });
  assert.ok(fundingScore(four) > fundingScore(one));
  assert.ok(fundingScore(four) - fundingScore(one) < fundingScore(one), 'three more grants add less than the first');

  // And it reaches the CV as its own section, not lumped in with awards.
  const cv = buildCV(funded);
  assert.ok(cv.lines.some(l => l.section === 'funding'), 'funding is a section');
  assert.ok(!cv.lines.some(l => l.section === 'awards' && /fellowship/i.test(l.text)), 'and not in awards');
  assert.ok(cv.axes.funding > 0);
});

test('every jobTrack an event can set is a real track id', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = new URL('../src/data/events/', import.meta.url).pathname;
  const valid = new Set([...tracks.map(t => t.id), 'null']);
  const found = new Set();
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.js')) continue;
    for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/jobTrack:\s*'([a-z_]+)'/g)) found.add(m[1]);
  }
  assert.ok(found.size > 3, `only found ${found.size} jobTrack values — did the shape change?`);
  for (const id of found) assert.ok(valid.has(id), `jobTrack '${id}' is not a track — it would set a track nothing can look up`);
});

test('the advisor has a career clock, and the tenure arc is keyed to it rather than to a rare mutator', () => {
  const stages = {};
  for (let seed = 1; seed <= 120; seed++) {
    const s = createRun(seed);
    for (const a of s.advisors) { assert.ok(a.stage, 'every advisor has a stage'); stages[a.stage] = (stages[a.stage] || 0) + 1; }
  }
  for (const k of ['pre_tenure', 'newly_tenured', 'mid_career', 'late']) assert.ok(stages[k] > 0, `${k} never occurs`);
  // The clearest statement of the game's thesis must not need a 5% mutator to be reachable.
  const push = eventById.tenure_push;
  assert.ok(push, 'tenure_push exists');
  assert.deepEqual(push.conditions.stage, ['pre_tenure']);
  assert.equal(push.conditions.mutator, undefined, 'no longer gated on the tenure mutator');
  // And the condition key actually filters.
  const s = enterProgram(1);
  s.advisor.stage = 'late';
  assert.equal(eligible(s, push, {}), false, 'a late-career advisor has no tenure case');
  s.advisor.stage = 'pre_tenure';
  s.month = 6;
  assert.ok(eligible(s, push, {}) || push.conditions.minMonth > 6);
});

test('a rich advisor can show a cage too, not only a poor one', async () => {
  // The precarity scenes were gated on low funding, and the archetype table anti-correlates
  // funding with warmth — so the two harshest advisors could never fire one.
  const { advisorArchetypes: arch, traitNames: names } = await import('../src/data/catalog.js');
  const fundingOf = a => a.traits[names.indexOf('funding')];
  const toxOf = a => a.traits[names.indexOf('toxicity')];
  const harshest = [...arch].sort((a, b) => toxOf(b) - toxOf(a))[0];
  assert.ok(fundingOf(harshest) > 70, 'the harshest archetype is a well-funded one — that is the premise');
  // Something in the catalogue must be able to show that advisor being squeezed.
  const reachable = events.filter(e => e.conditions?.archetype?.includes(harshest.id)
    || (e.conditions?.stage && !e.conditions.maxFunding));
  assert.ok(reachable.length > 0, `nothing in the catalogue can show a ${harshest.id} under pressure`);
});

test('every line the exam room, the corridor and the desk can print exists in Chinese', async () => {
  // These live behind a real-time UI the audit harness cannot walk — it dispatches VIVA with a
  // synthetic tally and never renders a slide, a corridor or a verdict. So the exam prose was
  // reachable in play and invisible to the audit, which is exactly the shape of bug that let a
  // year of gameplay strings sit untranslated behind a confident zero. Checked directly instead.
  const { exams, decks, talkLines, badCop, corridor, verdicts, talkMoves, examNote } = await import('../src/data/exams.js');
  const { plantLines, plantNote, chairLines, chairNote, fridgeLines, fridgeNote } = await import('../src/data/desk.js');
  const { doors, OBSTACLES, stuckNote } = await import('../src/data/stuck.js');
  const { zh } = await import('../src/i18n/zh/index.js');
  const need = [];
  for (const e of Object.values(exams)) { need.push(e.label, e.room, e.total, e.note); for (const g of e.segments) need.push(g.label, g.sub); }
  for (const deck of Object.values(decks)) for (const sl of deck) need.push(sl.title, sl.line);
  need.push(...Object.values(talkLines), badCop.intro, ...badCop.interrupts, badCop.handled, badCop.ignored, badCop.afterward);
  need.push(corridor.intro, corridor.ready, ...corridor.things.flatMap(x => [x.label, x.line]));
  need.push(...Object.values(verdicts.pass), ...verdicts.quickCongrats, verdicts.advisorLine, ...Object.values(verdicts.photo));
  for (const m of Object.values(talkMoves)) need.push(m.label, m.hint);
  need.push(examNote, plantNote, plantLines.discover, plantLines.noticed, plantLines.devoted, plantLines.dry, ...plantLines.after, ...plantLines.idle);
  need.push(chairNote, chairLines.discover, chairLines.noticed, ...chairLines.after, ...chairLines.idle);
  need.push(fridgeNote, fridgeLines.discover, fridgeLines.thrown, fridgeLines.slack, fridgeLines.slackAfter,
    ...fridgeLines.after, ...fridgeLines.after_thrown, ...fridgeLines.idle);
  for (const d of Object.values(doors)) need.push(d.label, d.hint, ...d.good, ...d.bad);
  for (const o of Object.values(OBSTACLES)) need.push(o.label, o.hint);
  need.push(stuckNote);
  const missing = [...new Set(need)].filter(x => x && !zh.ui[x]);
  assert.deepEqual(missing, [], `${missing.length} string(s) would show in English mid-exam`);
});

test('the plant only does something when you are already having a bad time', async () => {
  // A ritual is not a resource. If watering paid out on a good day it would become a strategy,
  // and 288 waterings over six years would dwarf every real decision in the game.
  const { waterPlant } = await import('../src/engine/desk.js');
  const mk = stress => { const s = enterProgram(4); s.month = 20; s.week = 0; s.player.hidden.stress = stress; return s; };
  const calm = mk(20), hope = calm.player.stats.hope, st = calm.player.hidden.stress;
  waterPlant(calm);
  assert.equal(calm.player.hidden.stress, st, 'no stress relief on a good day');
  assert.equal(calm.player.stats.hope, hope, 'no hope on a good day');
  const bad = mk(72);
  waterPlant(bad);
  assert.ok(bad.player.hidden.stress < 72, 'it helps when it is being used for what it is for');
  // And it cannot be spammed inside a week.
  const twice = mk(72);
  waterPlant(twice);
  const after = twice.player.hidden.stress;
  waterPlant(twice);
  assert.equal(twice.player.hidden.stress, after, 'the cooldown holds inside one week');
  assert.equal(twice.plant.watered, 1, 'a blocked watering does not count');
});

test('each exam runs the hours it claims to, in the order it claims', async () => {
  const { exams } = await import('../src/data/exams.js');
  const shape = k => exams[k].segments.map(g => g.kind).join('>');
  assert.equal(shape('prelim'), 'talk>qa>corridor');
  assert.equal(shape('proposal'), 'talk>qa>corridor');
  // A defense is public, then cleared, then closed — the clearing is the whole point of it.
  assert.equal(shape('defense'), 'intro>talk>qa>clear>qa>corridor');
  const mins = k => exams[k].segments.reduce((n, g) => n + g.minutes, 0);
  assert.equal(mins('prelim'), 60);
  assert.equal(mins('proposal'), 120);
  assert.equal(mins('defense'), 150);
  // The open questions are the kind ones and the closed ones are not.
  const def = exams.defense.segments.filter(g => g.kind === 'qa');
  assert.equal(def[0].tone, 'nice');
  assert.equal(def[1].tone, 'harsh');
  // Every deck has to be able to reward a talk: some slides must actually carry it.
  const { decks } = await import('../src/data/exams.js');
  for (const [k, deck] of Object.entries(decks)) {
    assert.ok(deck.filter(s => s.w === 'core').length >= 4, `${k} deck has too few load-bearing slides`);
    assert.ok(deck.some(s => s.w === 'filler'), `${k} deck has no filler, which is not what a deck is`);
  }
});

test('the labmate who is pushed out stays the same person, and can become a contact', async () => {
  // This test used to hand-set eventActor to exactly the value firesLabmate falls back to (the
  // highest-bond labmate), so it passed identically whether the actor was carried through the
  // schedule or re-picked from scratch — it could not detect the very regression it was written
  // for. And the regression was live: followUps were pushed as { id, week } with no actor, so
  // beat 2 opened with eventActor === null and named somebody else.
  //
  // So: pick the LOWEST-bond labmate, which the fallback would never choose, and drive beat 2
  // through the real scheduler rather than by hand.
  const { activeContacts } = await import('../src/engine/network.js');
  const { eventText, templateById, scheduleTurnEvents } = await import('../src/engine/events.js');
  const base = enterProgram(29);
  base.month = 20;
  const mates = base.labmates.filter(l => l.status === 'active').sort((a, b) => b.bond - a.bond);
  const chosen = mates[mates.length - 1];
  assert.notEqual(chosen.id, mates[0].id, 'need a labmate the fallback would not pick');

  // Beat 1, about the low-bond one.
  let run = dispatch({ ...base, eventActor: { type: 'labmate', id: chosen.id }, event: 'fired_tell' }, { type: 'CHOICE', id: 'ask' });
  assert.equal(run.fired?.name, chosen.name, 'beat 1 does not record who it was about');
  const beat = run.scheduled.find(x => x.id === 'fired_told');
  assert.ok(beat, 'beat 2 was not scheduled');
  assert.equal(beat.actor?.id, chosen.id, 'the follow-up does not carry the person it is about');

  // Beat 2's body renders BEFORE any choice is made, so the name has to be there already.
  const body = eventText(run, templateById.fired_told);
  assert.ok(body.includes(chosen.name.split(' ')[0]), 'beat 2 names the wrong person');
  assert.equal((body.match(/\{[a-zA-Z]+\}/g) || []).length, 0, 'beat 2 left a token unresolved');

  run = dispatch({ ...run, eventActor: beat.actor, event: 'fired_told' }, { type: 'CHOICE', id: 'stairwell' });
  assert.equal(run.fired.name, chosen.name, 'the arc changed person at beat 2');
  assert.equal(run.labmates.find(l => l.id === chosen.id).status, 'left');
  assert.equal(run.flags.labmateFired, true);

  // Years later, with no actor at all, the later beats still name them.
  run.month = 40; run.eventActor = null;
  for (const id of ['fired_room', 'fired_after']) {
    const text = eventText(run, templateById[id]);
    assert.equal((text.match(/\{[a-zA-Z]+\}/g) || []).length, 0, `${id} left a token unresolved`);
  }
  assert.ok(eventText(run, templateById.fired_room).includes(chosen.name.split(' ')[0]),
    'the group meeting names somebody other than the person who left');

  // Sending the message turns them into a real contact under their own name.
  run = dispatch({ ...run, event: 'fired_after' }, { type: 'CHOICE', id: 'message' });
  const contact = activeContacts(run).find(c => c.name === chosen.name);
  assert.ok(contact, 'keeping in touch puts them in the network');
  assert.equal(contact.where, 'lab');
  assert.ok(contact.regard > 60, 'they are not bitter');
  assert.equal(run.fired.kept, true);

  // Letting it go does not.
  let other = dispatch({ ...base, eventActor: { type: 'labmate', id: chosen.id }, event: 'fired_told' }, { type: 'CHOICE', id: 'desk' });
  other = dispatch({ ...other, month: 40, event: 'fired_after' }, { type: 'CHOICE', id: 'let' });
  assert.equal(activeContacts(other).some(c => c.name === chosen.name), false);
  assert.equal(other.fired.kept, false);
});

test('the outcome of a choice is actually shown, and it is shown in Chinese', async () => {
  // Two coupled bugs, both invisible for a long time. translateChoiceList never copied `result`,
  // so every Chinese outcome translation was dead code; and say() had no branch for a static
  // result, so the outcome sentence was dropped from the report, the timeline and the field notes
  // — in English as well. The second bug is what let the zh round-trip test pass: it threw the
  // untranslated tail away before the assertion could see it.
  const { entryText } = await import('../src/engine/state.js');
  const { events } = await import('../src/data/events.js');
  const { events: zhEvents } = await import('../src/i18n/zh/events.js');

  // Every authored outcome has a Chinese counterpart. 131 of these had none and were reachable.
  const missing = [];
  for (const e of events) {
    const tr = zhEvents[e.id];
    for (const c of e.choices || []) {
      for (const k of ['result', 'successText', 'failureText']) {
        if (c[k] && !tr?.choices?.[c.id]?.[k]) missing.push(`${e.id}.${c.id}.${k}`);
      }
    }
  }
  assert.deepEqual(missing, [], `${missing.length} outcome string(s) would render in English mid-scene`);

  // And the sentence survives the round trip into the log. Pick a real static-result choice.
  const s = enterProgram(23);
  s.month = 30;
  s.fired = { id: 'lab-0', name: 'Ingrid Ashdown', month: 20, kept: false };
  const run = dispatch({ ...s, event: 'fired_after' }, { type: 'CHOICE', id: 'message' });
  const line = entryText(run, run.history[run.history.length - 1]);
  assert.ok(line.includes('nine minutes'), 'the outcome prose is dropped on re-read');
  assert.ok(line.length > 120, 'the log line is only the title and the choice');
});

test('each thing on the desk says its own line, including when it has nothing to say', async () => {
  // The bug this guards: an idle click deliberately does not write to the history (looking at a
  // fridge is not an event), and the UI was reading s.notice — so a fixture on cooldown displayed
  // whatever was logged last. Erase the whiteboard once and every object on the desk said the
  // eraser line, forever, which is exactly what it looked like from the outside.
  const { useFixture } = await import('../src/engine/desk.js');
  const { plantLines, chairLines, fridgeLines } = await import('../src/data/desk.js');
  const pools = {
    plant: [plantLines.discover, ...plantLines.after, ...plantLines.idle],
    chair: [chairLines.discover, ...chairLines.after, ...chairLines.idle],
    fridge: [fridgeLines.discover, ...fridgeLines.after, ...fridgeLines.idle],
  };
  const s = enterProgram(3);
  s.month = 26; s.week = 0;
  // Something unrelated writes to the log, the way erasing the whiteboard does.
  s.notice = 'The eraser leaves a grey ghost of everything.';
  for (const id of ['plant', 'chair', 'fridge']) {
    const first = useFixture(s, id);
    assert.ok(pools[id].includes(first.line), `${id} first click returned a line from another object`);
    assert.equal(s.deskSaid, first.line, `${id} did not record what it said`);
    // Same week again: on cooldown, and it must still answer for itself.
    const again = useFixture(s, id);
    assert.equal(again.again, false, `${id} cooldown did not hold`);
    const idle = { plant: plantLines.idle, chair: chairLines.idle, fridge: fridgeLines.idle }[id];
    assert.ok(idle.includes(again.line), `${id} idle click did not use its own idle lines`);
    assert.notEqual(again.line, s.notice, 'the idle line is the last thing logged, not this object speaking');
    assert.equal(s.deskSaid, again.line, `${id} idle click did not record its line`);
  }
  // The whiteboard is a door, not a ritual: it must never go through the engine at all.
  assert.equal(useFixture(s, 'board'), null);
});

test('touching a decorative object on cooldown does not move the run RNG', async () => {
  // The whole game is reproducible from a seed — the balance harness, every bug report and the
  // save format all depend on it. The desk fixtures broke that: the cooldown branch drew from the
  // run stream to pick a flavour line, so clicking the plant an arbitrary number of times reseeded
  // every subsequent roll. Same seed, same decisions, different outcome.
  const { useFixture } = await import('../src/engine/desk.js');
  const s = enterProgram(7);
  s.month = 26; s.week = 0;
  for (const id of ['plant', 'chair', 'fridge']) {
    useFixture(s, id);                                   // the real use, which is allowed to draw
    const before = { rng: s.rng, energy: s.player.stats.energy, hope: s.player.stats.hope, stress: s.player.hidden.stress };
    for (let i = 0; i < 12; i++) useFixture(s, id);      // twelve idle clicks, same week
    assert.equal(s.rng, before.rng, `${id} advanced the RNG while on cooldown`);
    assert.equal(s.player.stats.energy, before.energy, `${id} changed Energy while on cooldown`);
    assert.equal(s.player.stats.hope, before.hope, `${id} changed Hope while on cooldown`);
    assert.equal(s.player.hidden.stress, before.stress, `${id} changed Stress while on cooldown`);
  }
  // And it still says something — inert is not the same as silent.
  const said = useFixture(s, 'plant');
  assert.ok(said.line && said.line.length > 10);
  assert.equal(said.again, false);
});

test('a month spent on Research always does something, or says why it cannot', async () => {
  // An Accepted paper stays in s.projects forever, so `!s.projects.length` — the condition the
  // whole "start a project" prompt was keyed on — is only ever true before the FIRST one. After
  // the best moment in the game, a player who does not guess that they must start another spends
  // months on a plan that advertises "▲ Progress +++" and silently yields nothing.
  const { focusOptions } = await import('../src/engine/time.js');
  const s = enterProgram(9);
  s.month = 20;
  if (!s.projects.length) Object.assign(s, dispatch(s, { type: 'START_PROJECT' }));
  for (const p of s.projects) { p.status = 'Accepted'; p.progress = 100; }
  for (const id of ['research', 'write']) {
    const f = focusOptions(s).find(x => x.id === id);
    assert.ok(f.disabled, `${id} is offered with nothing to work on, and does nothing`);
  }
  // And it comes back the moment there is something to work on.
  const live = dispatch(s, { type: 'START_PROJECT' });
  for (const id of ['research', 'write']) {
    assert.equal(focusOptions(live).find(x => x.id === id).disabled, null, `${id} stays disabled with a live project`);
  }
});

test('the odds column can say all five of its words, and a portfolio exists', async () => {
  // The phase tells the player to "aim across the odds range". Measured before this: 31 of 32
  // programs read "Long shot", the best achievable chance was ~26%, and two of the five bands
  // were mathematically unreachable. The player was asked to build a portfolio out of one option.
  const { admissionChance } = await import('../src/engine/apply.js');
  const band = p => (p < .10 ? 0 : p < .20 ? 1 : p < .32 ? 2 : p < .50 ? 3 : 4);
  let s = createRun(2091779276, { background: 'undergrad', topic: 'ml', international: false });
  s = act(s, { type: 'PREP', id: 'sop_draft' });
  s = act(s, { type: 'PREP', id: 'letter_ask', target: 'rec-0' });
  s = act(s, { type: 'PREP', id: 'proceed' });
  const seen = new Set();
  for (const sc of schools) {
    const poi = s.advisors.find(a => a.schoolId === sc.id);
    seen.add(band(admissionChance(s, sc, { effort: 'generic', contact: false, poiId: poi?.id })));
  }
  assert.ok(seen.size >= 3, `only ${seen.size} of 5 odds bands are reachable; there is no range to aim across`);
  // A safety has to exist, and the top of the ladder has to stay a gamble.
  const easiest = [...schools].sort((a, b) => a.prestige - b.prestige)[0];
  const hardest = [...schools].sort((a, b) => b.prestige - a.prestige)[0];
  const poiE = s.advisors.find(a => a.schoolId === easiest.id), poiH = s.advisors.find(a => a.schoolId === hardest.id);
  assert.ok(admissionChance(s, easiest, { effort: 'tailored', contact: false, poiId: poiE?.id }) > .30, 'nothing on the board is a safety');
  assert.ok(admissionChance(s, hardest, { effort: 'tailored', contact: false, poiId: poiH?.id }) < .25, 'the top of the ladder stopped being a gamble');
});

test('a cycle that produces nothing costs a year, not the save file', async () => {
  // Following the game's own advice ended the run outright about twenty minutes in, on the phase
  // with the least gameplay in it, with the only way forward being the setup wizard.
  let s = createRun(4, { background: 'undergrad', topic: 'ml', international: false });
  s = act(s, { type: 'PREP', id: 'sop_draft' });
  s = act(s, { type: 'PREP', id: 'letter_ask', target: 'rec-0' });
  s = act(s, { type: 'PREP', id: 'proceed' });
  // Apply nowhere winnable at all, then take the decisions.
  for (const sc of schools.slice(0, 3)) {
    try { s = act(s, { type: 'APPLY', schoolId: sc.id, effort: 'generic', contact: false, poiId: s.advisors.find(a => a.schoolId === sc.id).id }); } catch { /* funds */ }
  }
  s = act(s, { type: 'ADMISSIONS' });
  for (let i = 0; i < 40; i++) {
    const app = s.applications.find(a => a.interview && !a.interview.done);
    if (!app) break;
    const { interviewStep } = await import('../src/engine/apply.js');
    const q = interviewStep(app);
    if (!q) break;
    s = act(s, { type: 'INTERVIEW', schoolId: app.schoolId, id: q.options[0].id });
  }
  s = act(s, { type: 'DECISIONS' });
  if (s.offers.length || s.applications.some(a => a.waitlisted)) return;   // got in; nothing to test
  assert.equal(s.phase, 'prep', 'a first failed cycle ended the run instead of costing a year');
  assert.equal(s.flags.secondCycle, true);
  assert.equal(s.applications.length, 0, 'the second cycle starts from a clean list');
  assert.ok(s.prep.letters.some(l => l.asked), 'the letters you already have are kept');
  // The second failure is the ending.
  s = act(s, { type: 'PREP', id: 'proceed' });
  s.applications = [];
  s = act(s, { type: 'DECISIONS' });
  assert.equal(s.phase, 'ending');
  assert.equal(s.ending.id, 'no_offer');
});

test('the paper you arrived with is a real paper, and quality actually drives citations', async () => {
  // "Prior publications" was a questionnaire field that nothing read — a question about nothing.
  // And every accepted paper accrued citations at nearly the same rate: the quality term ran
  // .4 + q * .17, so a genuinely good paper earned 1.37x a mediocre one and the Scholar page was
  // a function of time rather than of work.
  const { myProfile, accrueCitations } = await import('../src/engine/scholar.js');
  const { diamonds } = await import('../src/engine/paper.js');
  const { venueById } = await import('../src/data/venues.js');

  const withPapers = enterProgramWith(12, { publications: 'yes' });
  const without = enterProgramWith(12, { publications: 'none' });
  assert.equal(myProfile(without).papers.length, 0, 'a student with no prior work has an empty profile');
  const prof = myProfile(withPapers);
  assert.equal(prof.papers.length, 1, 'the paper you arrived with is not on your Scholar page');
  assert.ok(prof.papers[0].title.length > 20);
  assert.ok(prof.total >= 0, 'it carries its own citation history');

  // Quality separates. A 5-diamond paper at a top venue must clearly outrun a 3-diamond one.
  const run = (v0, tier, seed) => {
    const s = enterProgram(seed);
    s.month = 12; s.citations = {}; s.pendingCites = [];
    const v = Object.values(venueById).find(x => x.tier === tier);
    s.projects = [{ id: 'p1', title: 'X', kind: 'main', status: 'Accepted', progress: 100, draft: 100,
      hype: 40, scope: 40, collaborators: [], venueId: v.id,
      novelty: v0, technicalDepth: v0, evidence: v0, writingQuality: v0, reproducibility: v0,
      submissionHistory: [{ venueId: v.id, month: 12, outcome: 'Accept', reviewers: [], quality: v0, diamonds: 4 }] }];
    for (let m = 13; m <= 60; m++) { s.month = m; accrueCitations(s); }
    return { n: s.citations.p1 || 0, d: diamonds(s.projects[0]) };
  };
  const great = [1, 2, 3].map(i => run(88, 1, i));
  const fine = [1, 2, 3].map(i => run(56, 1, i));
  assert.equal(great[0].d, 5);
  assert.equal(fine[0].d, 3);
  const avg = xs => xs.reduce((a, x) => a + x.n, 0) / xs.length;
  assert.ok(avg(great) > avg(fine) * 2.5,
    `a genuinely good paper earns ${Math.round(avg(great))} against ${Math.round(avg(fine))} — quality barely matters`);
});

test('scenes about a first happen the first time, and the twelve endings are reachable', async () => {
  // All 26 firstyear_* events shipped with `probability: .5, cooldown: 14` and no conditions at
  // all, so "The first check lands on the thirtieth" and "The first one-on-one" could fire in
  // year six. And a first-year asking YOU for advice required you not to be one.
  const { events } = await import('../src/data/events.js');
  const firstYear = events.filter(e => e.id.startsWith('firstyear_'));
  assert.ok(firstYear.length >= 20);
  const ungated = firstYear.filter(e => e.conditions?.maxMonth === undefined);
  assert.deepEqual(ungated.map(e => e.id), [], 'a scene about your first year can fire in your sixth');
  assert.ok((events.find(e => e.id === 'midphd_first_year_question')?.conditions?.minMonth ?? 0) >= 12,
    'a first-year asks you for advice while you are one');

  // Twelve ~250-word career endings were authored and none reached a player: the branch that
  // reads them needs stage 'milestone', and graduating sets stage 'commencement'. Every doctorate
  // in the game ended on the same paragraph.
  const { trackEndings } = await import('../src/data/endings.js');
  const src = await import('node:fs').then(fs => fs.readFileSync('src/engine/game.js', 'utf8'));
  assert.ok(src.includes('trackEndings[s.jobs.chosen]'),
    'the epilogue does not read the track ending, so all twelve are dead content');
  assert.ok(Object.keys(trackEndings).length >= 10);
  for (const [id, e] of Object.entries(trackEndings)) {
    assert.ok(e.title && e.text && e.text.length > 200, `${id} is not a real ending`);
  }
});
