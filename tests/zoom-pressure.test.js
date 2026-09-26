import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { maybeSummons, answerSummons } from '../src/engine/summons.js';
import { reviewLatencyWeeks, generateRequests, ask } from '../src/engine/advisor.js';
import { maybePushback } from '../src/engine/events.js';
import { meetingContext } from '../src/ui/meeting.js';
import { sceneDialog } from '../src/ui/scenes.js';
import { templateById } from '../src/engine/events.js';
import { summonsKinds, summonsMoves, summonsDeclined, SUMMONS } from '../src/data/summons.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { t } from '../src/i18n/index.js';

function student() {
  let s = createRun(4242); const a = s.advisors[6];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  Object.assign(s, { month: 8, week: 0, tempo: 'week', stage: 'plan', event: null, eventQueue: [], summons: null, requests: [], crunch: null });
  Object.assign(s.advisor, { ambition: 50, management: 50, availability: 40, caring: 40, toxicity: 10 });
  Object.assign(s.relationship, { conflict: 10, satisfaction: 60, trust: 50 });
  s.advisorMode = { id: 'normal' }; s.pressure = 30; s.player.stats.energy = 90;
  return s;
}

test('manual zoom has the calm summons probability, cost and RNG; real paper pressure remains', () => {
  const base = student(); let calmCount = 0, hardCount = 0, panic = 0;
  for (let seed = 1; seed <= 128; seed++) {
    const calm = structuredClone(base); calm.rng = seed * 7919;
    const zoom = structuredClone(calm), deadline = structuredClone(calm), exam = structuredClone(calm);
    maybeSummons(calm, { crunch: null }); maybeSummons(zoom, { crunch: { type: 'zoom' } });
    assert.deepEqual(zoom, calm);
    if (zoom.summons) {
      calmCount++; assert.equal(zoom.summons.hard, false); assert.notEqual(zoom.summons.id, 'advisor_panic');
      answerSummons(zoom, 'go'); assert.equal(zoom.summons.keep, 1 - SUMMONS.bite);
    }
    maybeSummons(deadline, { crunch: { type: 'deadline' } });
    if (deadline.summons) { hardCount++; assert.equal(deadline.summons.hard, true); if (deadline.summons.id === 'advisor_panic') panic++; }
    maybeSummons(exam, { crunch: { type: 'prelim' } });
    assert.notEqual(exam.summons?.id, 'advisor_panic', 'an exam is not a paper experiment deadline');
  }
  assert.ok(calmCount > 0); assert.ok(hardCount > calmCount); assert.ok(panic > 0);
});

test('zoom does not accelerate advisor review or amplify requests and leave refusal', () => {
  const base = student();
  assert.equal(reviewLatencyWeeks(base, { type: 'zoom' }), reviewLatencyWeeks(base, null));
  assert.equal(reviewLatencyWeeks(base, { type: 'deadline' }), reviewLatencyWeeks(base, null) - 1);
  let calmRequests = 0, deadlineRequests = 0, calmLeave = 0, deadlineLeave = 0;
  for (let seed = 1; seed <= 96; seed++) {
    const calm = structuredClone(base); calm.rng = seed * 7919;
    const zoom = structuredClone(calm), deadline = structuredClone(calm);
    generateRequests(calm, 1, { tempo: 'week', crunch: null });
    generateRequests(zoom, 1, { tempo: 'week', crunch: { type: 'zoom' } });
    generateRequests(deadline, 1, { tempo: 'week', crunch: { type: 'deadline' } });
    assert.deepEqual(zoom, calm); calmRequests += calm.requests.length; deadlineRequests += deadline.requests.length;
    const normalAsk = structuredClone(base); normalAsk.rng = seed * 7919;
    const zoomAsk = structuredClone(normalAsk), deadlineAsk = structuredClone(normalAsk);
    zoomAsk.crunch = { type: 'zoom' }; deadlineAsk.crunch = { type: 'deadline' };
    ask(normalAsk, 'leave'); ask(zoomAsk, 'leave'); ask(deadlineAsk, 'leave');
    zoomAsk.crunch = null; assert.deepEqual(zoomAsk, normalAsk);
    calmLeave += normalAsk.leaveWeeks; deadlineLeave += deadlineAsk.leaveWeeks;
  }
  assert.ok(deadlineRequests > calmRequests); assert.ok(calmLeave > deadlineLeave);
});

test('zoom alone does not make a meeting tense or shorten its answer timer', () => {
  const s = student(); s.event = 'meet_progress'; s.stage = 'event'; s.crunch = { type: 'zoom' };
  assert.notEqual(meetingContext(s, templateById[s.event]).tone, 'tense');
  assert.doesNotMatch(sceneDialog(s), /data-scene-timer/);
  s.advisorMode.id = 'pressed';
  assert.match(sceneDialog(s), /data-scene-timer="15"/);
  s.crunch = { type: 'deadline' };
  assert.match(sceneDialog(s), /data-scene-timer="11"/);
});

test('manual zoom preserves ordinary pushback odds and twelve seconds; genuine pressure keeps nine', () => {
  const base = student(); base.event = 'meet_criticism'; base.stage = 'event'; base.advisor.toxicity = 80;
  let seen = false;
  for (let seed = 1; seed <= 64; seed++) {
    const calm = structuredClone(base); calm.rng = seed * 7919;
    const zoom = structuredClone(calm), deadline = structuredClone(calm);
    zoom.crunch = { type: 'zoom' }; deadline.crunch = { type: 'deadline' };
    assert.equal(maybePushback(zoom, { id: 'specific' }), maybePushback(calm, { id: 'specific' }));
    zoom.crunch = null; assert.deepEqual(zoom, calm);
    if (calm.pushback) { seen = true; assert.equal(calm.pushback.seconds, 12); }
    if (maybePushback(deadline, { id: 'specific' })) assert.equal(deadline.pushback.seconds, 9);
  }
  assert.ok(seen);
});

test('summons copy does not invent four remaining days, exact weekdays or guaranteed reviewer praise', () => {
  assert.doesNotMatch(summonsMoves.late.label, /deadline|four days/i);
  assert.doesNotMatch(JSON.stringify(summonsKinds.advisor_panic), /Friday|Tuesday|Four days|in March/);
  assert.doesNotMatch(summonsDeclined.labmate, /deadline/);
  setAppLanguage('zh'); globalThis.__I18N_MISS = new Set();
  try {
    for (const text of [...summonsKinds.advisor_panic.text, summonsKinds.advisor_panic.good, summonsKinds.advisor_panic.bad,
      summonsKinds.labmate_crisis.text[0], summonsMoves.late.label, summonsDeclined.labmate,
      'Could this wait until I finish the work I have already planned?']) assert.notEqual(t(text), text);
    assert.deepEqual([...globalThis.__I18N_MISS], []);
  } finally { delete globalThis.__I18N_MISS; setAppLanguage('en'); }
});
