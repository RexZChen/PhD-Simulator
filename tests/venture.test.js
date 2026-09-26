import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { eligible, templateById, resolveChoice, choiceUnavailable, openNext, eventText } from '../src/engine/events.js';
import { validRun, saveRun, loadSave, emptyMeta } from '../src/engine/save.js';
import { random } from '../src/engine/probability.js';

function researcher() {
  let s = createRun(711, { background: 'masters', topic: 'ml', international: false });
  const advisor = s.advisors[0];
  s.phase = 'admissions'; s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  s.stage = 'plan'; s.event = null; s.eventQueue = []; s.needsBegin = false;
  s = dispatch(s, { type: 'START_PROJECT' });
  const accepted = s.projects[0];
  accepted.status = 'Accepted'; accepted.title = 'The published invention'; accepted.novelty = 70; accepted.evidence = 75;
  s.counts.accepted = 1;
  const prior = { ...structuredClone(accepted), id: 'prior-fixture', title: 'Prior institution work', prior: true };
  const unfinished = { ...structuredClone(accepted), id: 'unfinished-fixture', title: 'Unfinished selected paper', status: 'Prototype' };
  s.projects = [prior, accepted, unfinished]; s.activeProjectId = unfinished.id;
  s.month = 40;
  return s;
}
function choose(s, event, choice) {
  s.event = event; s.eventVariant = 0; s.stage = 'event'; s.eventQueue = [];
  resolveChoice(s, choice);
  return s;
}
function discussed(commitment = 'keen') {
  const s = researcher(); choose(s, 'spin_disclosure', 'read'); choose(s, 'spin_advisor_idea', commitment);
  return s;
}
function agreed(commitment = 'keen') {
  return choose(discussed(commitment), 'spin_captable', 'sign');
}
function forceDraw(s, low) {
  for (let seed = 0; seed < 1000; seed++) {
    const value = random({ rng: seed });
    if (low ? value < .01 : value > .99) { s.rng = seed; return; }
  }
  throw Error('No deterministic draw found');
}

test('disclosure binds accepted work from this run, not prior work or the selected unfinished paper', () => {
  const s = researcher();
  assert.equal(eligible(s, templateById.spin_disclosure), true);
  s.event = 'spin_disclosure'; s.eventVariant = 0;
  assert.match(eventText(s, templateById.spin_disclosure), /The published invention/);
  choose(s, 'spin_disclosure', 'read');
  assert.equal(s.venture.project.title, 'The published invention');
  assert.equal(s.venture.policyRead, true);
  assert.match(s.patent.title, /the published invention/);
  assert.doesNotMatch(s.patent.title, /unfinished|prior institution/i);
  const noPaper = researcher(); noPaper.projects = noPaper.projects.filter(p => p.prior || p.status !== 'Accepted');
  assert.equal(eligible(noPaper, templateById.spin_disclosure), false);
});

test('cap-table check outcomes persist distinct company shares summing to100, separately from patent royalties', () => {
  for (const [choice, success, expected] of [['advisor', true, 50], ['advisor', false, 40], ['university', true, 42], ['university', false, 40]]) {
    const s = discussed(); const royalties = structuredClone(s.patent.share);
    forceDraw(s, success); choose(s, 'spin_captable', choice);
    assert.equal(s.lastRoll.success, success);
    assert.equal(s.venture.terms.shares.you, expected);
    assert.equal(Object.values(s.venture.terms.shares).reduce((a, b) => a + b, 0), 100);
    assert.deepEqual(s.patent.share, royalties);
    let raw = null; const storage = { getItem: () => raw, setItem: (_key, value) => { raw = value; } };
    assert.equal(saveRun(storage, s, emptyMeta()).error, null);
    assert.deepEqual(loadSave(storage).run.venture.terms, s.venture.terms);
  }
});

test('company provenance survives a change of advisor and institution', () => {
  const s = discussed(); const provenance = structuredClone(s.venture);
  s.advisor = { ...s.advisor, id: 'replacement', name: 'Different Advisor' };
  s.program = { ...s.program, id: 'replacement-school', name: 'Different Institution' };
  choose(s, 'spin_captable', 'sign');
  assert.deepEqual(s.venture.advisor, provenance.advisor);
  assert.deepEqual(s.venture.school, provenance.school);
  assert.deepEqual(s.venture.project, provenance.project);
  assert.equal(eligible(s, templateById.spin_advisor_absent), false);
  s.event = 'spin_two_jobs';
  const tell = templateById.spin_two_jobs.choices.find(c => c.id === 'tell');
  assert.match(choiceUnavailable(s, tell), /no longer supervises/);
  assert.throws(() => resolveChoice(s, 'tell'), /no longer supervises/);
});

test('thesis-first commitments suppress stale queued workload scenes without inventing a degree date', () => {
  const s = agreed('finish');
  assert.equal(s.venture.commitment, 'thesis-first');
  assert.equal(eligible(s, templateById.spin_two_jobs), false);
  s.event = null; s.eventQueue = ['spin_two_jobs', 'spin_advisor_absent'];
  openNext(s);
  assert.equal(s.event, null);
  assert.notEqual(s.milestones.graduated, true);
  assert.equal(s.venture.joinedMonth, null);
});

test('successful workload negotiation pauses work scenes for four actual months', () => {
  const s = agreed();
  forceDraw(s, true); choose(s, 'spin_two_jobs', 'tell');
  assert.equal(s.lastRoll.success, true);
  assert.equal(s.venture.workloadPausedUntil, 44);
  delete s.cooldowns.spin_two_jobs;
  for (const month of [40, 41, 42, 43]) {
    s.month = month;
    assert.equal(eligible(s, templateById.spin_two_jobs), false);
  }
  s.month = 44;
  assert.equal(eligible(s, templateById.spin_two_jobs), true);
});

test('choosing full-time founding ends the PhD unfinished with recorded equity and no invented income', () => {
  const s = agreed(); s.month = 52;
  const money = s.player.stats.money;
  choose(s, 'spin_decide', 'go');
  assert.equal(s.phase, 'ending'); assert.equal(s.ending.id, 'spinout');
  assert.equal(s.venture.commitment, 'joined'); assert.equal(s.venture.joinedMonth, 52);
  assert.notEqual(s.milestones.graduated, true);
  assert.equal(s.player.stats.money, money);
  assert.match(s.ending.text, /doctorate remains unfinished/);
  assert.match(s.ending.text, /you 40%/);
  assert.match(s.ending.text, /no salary commitment/i);
});

test('legacy review opens explicitly from planning and never reconstructs unrecorded equity', () => {
  let s = researcher(); s.flags.ventureAfter = true;
  for (const id of ['spin_disclosure', 'spin_advisor_idea', 'spin_captable', 'spin_decide']) { s.seen[id] = 1; s.cooldowns[id] = s.month; }
  s = dispatch(s, { type: 'VENTURE_REVIEW' });
  assert.equal(s.event, 'spin_review_legacy');
  s = dispatch(s, { type: 'CHOICE', id: 'restart' });
  assert.equal(s.venture.status, 'disclosed'); assert.equal(s.venture.terms, null);
  assert.equal(s.venture.project.title, 'The published invention');
  assert.equal(s.seen.spin_captable, undefined);
  assert.equal(s.cooldowns.spin_captable, undefined);
  const interrupted = researcher(); interrupted.flags.ventureAfter = true; interrupted.stage = 'report';
  assert.throws(() => dispatch(interrupted, { type: 'VENTURE_REVIEW' }));
});

test('saved agreements reject corrupt allocations instead of silently repairing company ownership', () => {
  const s = agreed();
  assert.equal(validRun(s), true);
  s.venture.terms.shares.you = 101;
  assert.equal(validRun(s), false);
  delete s.venture;
  assert.equal(validRun(s), true, 'older saves without a venture record remain loadable');
});
