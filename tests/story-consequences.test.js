import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, entryText } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { eligible, templateById, openNext, scheduleTurnEvents } from '../src/engine/events.js';
import { random } from '../src/engine/probability.js';
import { patentMonth, patentEntry } from '../src/engine/patent.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { saveRun, loadSave, emptyMeta, validRun } from '../src/engine/save.js';
import { beginRevisions, deposit } from '../src/engine/thesis.js';
import { startEpilogue, currentBeat, answerBeat, beatText } from '../src/engine/epilogue.js';
import { t } from '../src/i18n/index.js';
import { epilogueBeats } from '../src/data/epilogue.js';
import { epilogueScreen } from '../src/ui/apps/commencement.js';

function student(month = 14) {
  let s = createRun(711, { background: 'masters', topic: 'ml', international: true });
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.stage = 'plan'; s.event = null; s.eventQueue = []; s.needsBegin = false;
  s = dispatch(s, { type: 'START_PROJECT' });
  s.month = month; s.scheduled = []; s.eventQueue = []; s.stage = 'plan';
  s.player.stats.money = 3000;
  return s;
}
function show(s, id) {
  assert.equal(eligible(s, templateById[id]), true, `${id} must be eligible`);
  s.event = null; s.eventQueue = [id]; s.eventReturn = 'plan'; openNext(s);
  assert.equal(s.event, id);
}
function choose(s, event, id) { show(s, event); return dispatch(s, { type: 'CHOICE', id }); }
function draw(s, success) {
  for (let seed = 0; seed < 1000; seed++) {
    const n = random({ rng: seed });
    if (success ? n < .01 : n > .99) { s.rng = seed; return; }
  }
  throw Error('No deterministic draw');
}
function reload(s) {
  let raw;
  const storage = { getItem: () => raw || null, setItem: (_key, value) => { raw = value; } };
  assert.equal(saveRun(storage, s, emptyMeta()).error, null);
  const loaded = loadSave(storage);
  assert.equal(loaded.error, null);
  return loaded.run;
}
function completeDegree(s) {
  s.event = null; s.eventQueue = []; s.month = s.milestones.defenseMonth || 60;
  beginRevisions(s);
  // A checkpoint after doing the committee's work, before the real deposit action.
  s.thesis.items.forEach(x => { x.done = x.effort; });
  s.thesis.done = s.thesis.needed; s.thesis.formatFails = 2;
  assert.equal(deposit(s).ok, true);
  return s;
}
function familyBeat(s) {
  startEpilogue(s, 'unplaced');
  assert.ok(s.epilogue.beats.includes('family_celebration'));
  while (currentBeat(s)?.id !== 'family_celebration') answerBeat(s, currentBeat(s).choices[0].id);
}

test('an emergency payroll advance prevents a later duplicate payment', () => {
  let s = student(); show(s, 'stipend_late'); draw(s, true);
  s = dispatch(s, { type: 'CHOICE', id: 'emergency' });
  assert.equal(s.lastRoll.success, true); assert.equal(s.player.stats.money, 3000);
  s.month++;
  scheduleTurnEvents(s, { tempo: 'month', monthEnd: false });
  if (s.event === 'stipend_fix') s = dispatch(s, { type: 'CHOICE', id: 'ok' });
  assert.equal(s.player.stats.money, 3000, 'an advance plus reconciliation cannot create a second paycheck');
});

test('each repeated payroll withholding is actually refunded once', () => {
  let s = student();
  for (const month of [14, 24]) {
    s.month = month; s.event = null; s.eventQueue = [];
    s = choose(s, 'stipend_late', 'wait');
    assert.equal(s.player.stats.money, 1800);
    s.month++;
    scheduleTurnEvents(s, { tempo: 'week', monthEnd: false });
    assert.equal(s.event, 'stipend_fix', 'a previous refund cannot suppress the new one');
    s = dispatch(s, { type: 'CHOICE', id: 'ok' });
    assert.equal(s.player.stats.money, 3000);
  }
});

test('family visa preparation needs a real defense date and cannot award a future ceremony', () => {
  let s = student(34); s.milestones.prelim = 'pass';
  assert.equal(eligible(s, templateById.parents_visa), false);
  s.month = 58; s.milestones.proposal = 'pass'; s.milestones.defenseMonth = 60;
  s = choose(s, 'parents_visa', 'after');
  assert.equal(s.milestones.graduated, false);
  assert.equal(s.achievements.includes('hoodedathome'), false);
  assert.equal(s.player.stats.money, 3000, 'travel is paid when the post-deposit trip is chosen');
  assert.doesNotMatch(entryText(s, s.history.at(-1)), /You are hooded/);
});

test('a filed patent keeps its inventor when a local successor takes over', () => {
  let s = student(24);
  s.projects[0].status = 'Accepted'; s.projects[0].novelty = 70; s.projects[0].evidence = 70; s.counts.accepted = 1;
  s = choose(s, 'spin_disclosure', 'read');
  for (const id of ['plain', 'ask', 'push']) s = dispatch(s, { type: 'PATENT_MEET', id });
  s.month = s.patent.filedMonth; patentMonth(s);
  const oldAdvisor = s.advisor.name;
  for (const lang of ['en', 'zh']) {
    setAppLanguage(lang);
    const before = patentEntry(s).inventors;
    const next = choose(s, 'advisor_moves', 'newlocal');
    assert.notEqual(next.advisor.name, oldAdvisor);
    assert.equal(patentEntry(next).inventors, before);
    assert.equal(next.venture.advisor.name, oldAdvisor);
  }
  setAppLanguage('en');
});

test('failed advances survive reload and stale duplicate refunds cannot pay again', () => {
  let s = student(); show(s, 'stipend_late'); draw(s, false);
  s = dispatch(s, { type: 'CHOICE', id: 'emergency' });
  assert.equal(s.lastRoll.success, false);
  assert.equal(s.player.stats.money, 1800);
  s = reload(s);
  assert.equal(s.payrollDelay.outstanding, 1200);
  assert.equal(eligible(s, templateById.stipend_late), false);
  s.month++; scheduleTurnEvents(s, { tempo: 'week' });
  assert.equal(s.event, 'stipend_fix');
  s = dispatch(s, { type: 'CHOICE', id: 'ok' });
  assert.equal(s.player.stats.money, 3000);
  s = reload(s); s.event = 'stipend_fix'; s.eventQueue = []; s.stage = 'event';
  const before = structuredClone(s);
  s = dispatch(s, { type: 'CHOICE', id: 'ok' });
  assert.deepEqual(s.player, before.player);
  assert.equal(s.rng, before.rng);
  assert.equal(s.payrollDelay.outstanding, 0);
  assert.equal(s.event, null);
});

test('legacy payroll history recovers dropped repayments without inventing debt for successful advances', () => {
  for (const success of [false, true]) {
    let s = student(); show(s, 'stipend_late'); draw(s, success);
    s = dispatch(s, { type: 'CHOICE', id: 'emergency' });
    delete s.payrollDelay; s.scheduled = []; s.month = 17;
    s.cooldowns.stipend_fix = 3; // the old 99-month cooldown must not block this incident
    s = reload(s);
    assert.equal(s.payrollDelay.outstanding, success ? 0 : 1200);
    assert.equal(s.scheduled.some(x => x.id === 'stipend_fix'), !success);
    if (!success) {
      scheduleTurnEvents(s, { tempo: 'week' });
      assert.equal(s.event, 'stipend_fix');
      s = dispatch(s, { type: 'CHOICE', id: 'ok' });
    }
    assert.equal(s.player.stats.money, 3000);
  }
  let ambiguous = student(); delete ambiguous.payrollDelay;
  ambiguous.history = []; ambiguous.event = 'stipend_fix'; ambiguous.stage = 'event';
  ambiguous = reload(ambiguous);
  ambiguous = dispatch(ambiguous, { type: 'CHOICE', id: 'ok' });
  assert.equal(ambiguous.player.stats.money, 3000, 'a queued apology alone cannot establish cash owed');
});

test('a canceled or already-passed defense invalidates queued and saved family visa decisions', () => {
  let s = student(58); s.milestones.defenseMonth = 60;
  show(s, 'parents_visa'); s.milestones.defenseMonth = null;
  const before = structuredClone(s);
  s = dispatch(s, { type: 'CHOICE', id: 'after' });
  assert.deepEqual(s.player, before.player); assert.equal(s.rng, before.rng);
  assert.equal(s.familyVisit, null); assert.equal(s.event, null);
  s.milestones.defenseMonth = 60; s.milestones.defense = 'pass'; s.eventQueue = ['parents_visa'];
  openNext(s); assert.equal(s.event, null);
});

test('home celebrations stay optional and charge once only after a real deposit, in both languages', () => {
  try {
    for (const lang of ['en', 'zh']) for (const choice of ['go', 'later']) {
      setAppLanguage(lang);
      let s = student(58); s.milestones.defenseMonth = 60;
      s = choose(s, 'parents_visa', 'after');
      assert.equal(s.achievements.includes('hoodedathome'), false);
      assert.equal(s.player.stats.money, 3000);
      s = reload(s);
      const planLine = entryText(s, s.history.at(-1));
      assert.match(planLine, lang === 'zh' ? /还没买.*还没发生/ : /No ticket is bought and no ceremony has happened/);
      completeDegree(s); familyBeat(s);
      assert.match(beatText(s, currentBeat(s)), lang === 'zh' ? /900美元/ : /\$900/);
      const money = s.player.stats.money;
      const result = answerBeat(s, choice);
      assert.equal(s.player.stats.money, money - (choice === 'go' ? 900 : 0));
      assert.equal(s.achievements.includes('hoodedathome'), choice === 'go');
      assert.equal(s.familyVisit.outcome, choice === 'go' ? 'celebrated' : 'deferred');
      assert.match(result, lang === 'zh' ? /[\u4e00-\u9fff]/ : /family|photograph/);
      assert.equal(reload(s).familyVisit.completed, true);
    }
  } finally { setAppLanguage('en'); }
});

test('stream preparation pays off only after the actual passed defense', () => {
  let s = student(58); s.milestones.defenseMonth = 60;
  s = choose(s, 'parents_visa', 'stream');
  assert.equal(s.familyVisit.completed, false);
  assert.match(entryText(s, s.history.at(-1)), /test the video link/);
  s.month = 60; beginRevisions(s);
  assert.equal(s.familyVisit.completed, true);
  assert.equal(s.milestones.graduated, false);
  assert.match(entryText(s, s.history.at(-1)), /revisions and deposit still come next/);
});

test('legacy home plans retain their earlier payment without granting an unfinished degree', () => {
  let s = student(58); s.flags.hoodingHome = true; s.cooldowns.parents_visa = 34;
  s.achievements.push('hoodedathome'); s.player.stats.money -= 900;
  delete s.familyVisit;
  s = reload(s);
  assert.equal(s.milestones.graduated, false);
  assert.equal(s.familyVisit.completed, false); assert.equal(s.familyVisit.travelPaid, true);
  completeDegree(s); familyBeat(s);
  assert.match(beatText(s, currentBeat(s)), /already paid/);
  const money = s.player.stats.money; answerBeat(s, 'go');
  assert.equal(s.player.stats.money, money);
  assert.equal(s.achievements.filter(x => x === 'hoodedathome').length, 1);
});

test('restoring a family visit late in the epilogue preserves displayed and recorded chronology', () => {
  let s = completeDegree(student(58));
  startEpilogue(s, 'unplaced');
  // A saved run already four years past graduation, with its final correspondence ahead.
  s.epilogue.done = [1, 2, 2, 4].map((year, i) => ({ id: `prior-${i}`, year, subject: 'Earlier message', line: 'Earlier reply' }));
  s.epilogue.beats = ['student_email']; s.epilogue.index = 0;
  s.flags.hoodingHome = true; delete s.familyVisit;
  s = reload(s);
  assert.equal(currentBeat(s).id, 'family_celebration');
  assert.equal(currentBeat(s).when, 4);
  assert.match(epilogueScreen(s), /4 year\(s\) after/);
  assert.match(epilogueScreen(s), /epi-dot now[^>]*>\+4y/);
  const afterAnotherReload = reload(s);
  assert.equal(currentBeat(afterAnotherReload).when, 4);
  const money = s.player.stats.money;
  answerBeat(s, 'go');
  assert.equal(s.epilogue.done.at(-1).year, 4);
  assert.equal(s.player.stats.money, money, 'the legacy travel payment remains honored');
  assert.ok(currentBeat(s).when >= 4);
  assert.deepEqual(s.epilogue.done.map(d => d.year), [1, 2, 2, 4, 4]);
});

test('legacy patents use matching disclosure cast or leave the inventor unattributed', () => {
  let s = student(24);
  s.projects[0].status = 'Accepted'; s.projects[0].novelty = 70; s.projects[0].evidence = 70; s.counts.accepted = 1;
  s = choose(s, 'spin_disclosure', 'file');
  for (const id of ['plain', 'ask', 'push']) s = dispatch(s, { type: 'PATENT_MEET', id });
  s.month = s.patent.filedMonth; patentMonth(s);
  const inventor = structuredClone(s.patent.inventor);
  delete s.patent.inventor; delete s.patent.project; delete s.patent.school;
  s = choose(s, 'advisor_moves', 'newlocal');
  const recovered = reload(s);
  assert.deepEqual(recovered.patent.inventor, inventor);
  const ambiguous = structuredClone(s); ambiguous.history = [];
  const loaded = reload(ambiguous);
  assert.equal(loaded.patent.inventor, null);
  assert.equal(patentEntry(loaded).inventors, 'Inventor names are unavailable in this record.');
  assert.equal(validRun({ ...loaded, patent: { ...loaded.patent, inventor: { name: 7 } } }), false);
});

test('all new family follow-up and archival strings have Chinese translations', () => {
  try {
    setAppLanguage('zh');
    const beat = epilogueBeats.find(b => b.id === 'family_celebration');
    for (const text of [beat.subject, beat.text, ...beat.choices.flatMap(c => [c.label, c.line]),
      'Inventor names are unavailable in this record.']) assert.match(t(text), /[\u4e00-\u9fff]/, text);
    let s = student(); show(s, 'stipend_late'); draw(s, true);
    s = dispatch(s, { type: 'CHOICE', id: 'emergency' });
    assert.match(entryText(s, s.history.at(-1)), /结清预支款/);
  } finally { setAppLanguage('en'); }
});
