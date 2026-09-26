import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, cadenceFor } from '../src/engine/state.js';
import { prepareRun } from '../src/engine/game.js';
import { apply, submitAll, email, askStudentThread } from '../src/engine/apply.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { t } from '../src/i18n/index.js';
import { resolveChoice } from '../src/engine/events.js';
import { schools } from '../src/data/catalog.js';
import { interviewQuestions, visitQuestions } from '../src/data/threads.js';
import { misc } from '../src/i18n/zh/misc.js';
import { admissionsEventsZh } from '../src/i18n/zh/admissions-story.js';

function applicant() {
  const s = prepareRun(createRun(4242, { background: 'masters', topic: 'ml', international: false }));
  s.prep.waivers = true;
  s.prep.letters[0].asked = true;
  s.prep.letters[1].asked = true;
  s.phase = 'application';
  s.player.stats.energy = 100;
  return s;
}
function threeApplications(s) {
  for (const sc of schools.slice(0, 3)) apply(s, { schoolId: sc.id, poiId: s.advisors.find(a => a.schoolId === sc.id).id, effort: 'generic' });
}

for (const choice of ['successful nudge', 'late nudge', 'short letter']) {
  test(`letter crisis binds its writer and preserves ${choice} through the deadline`, () => {
    const s = applicant();
    threeApplications(s);
    assert.equal(s.event, 'letter');
    const writer = s.prep.letters.find(l => l.id === s.applicationLetterId);
    assert.equal(writer.id, s.prep.letters[0].id);
    const strength = writer.strength;
    s.rng = choice === 'late nudge' ? 43 : 7;
    resolveChoice(s, choice === 'short letter' ? 'backup' : 'nudge');
    assert.equal(writer.status, choice === 'late nudge' ? 'late' : 'on time');
    assert.equal(writer.strength, strength - (choice === 'late nudge' ? 15 : choice === 'short letter' ? 10 : 0));
    assert.equal(s.prep.letters[1].status, 'pending', 'the other recommender remains independent');
    assert.equal(s.flags.backupLetter, undefined, 'short letter cost is in the letter itself, not a second global penalty');
    const settled = { status: writer.status, strength: writer.strength };
    writer.reliability = choice === 'late nudge' ? 100 : 0;
    submitAll(s);
    assert.deepEqual({ status: writer.status, strength: writer.strength }, settled, 'the deadline cannot contradict or penalize the resolved letter again');
  });
}

test('a completed letter packet does not invent an outstanding recommender', () => {
  const s = applicant();
  for (const l of s.prep.letters.filter(l => l.asked)) l.status = 'on time';
  threeApplications(s);
  assert.notEqual(s.event, 'letter');
  assert.equal(s.applicationLetterId, null);
});

test('an interested professor with zero openings does not claim to be recruiting', () => {
  const s = applicant();
  const advisor = s.advisors[0]; advisor.openings = 0;
  s.rng = 2; // The interested-response outcome, not the generic portal response.
  const thread = email(s, advisor.id, 'generic');
  assert.equal(advisor.openingsKnown, true);
  assert.match(thread.messages.at(-1).text, /not taking students this year/);
  assert.doesNotMatch(thread.messages.at(-1).text, /I am recruiting/);
});

test('English and Chinese interviews preserve uncertainty and the hostile visit cue', () => {
  const why = interviewQuestions.find(q => q.id === 'why_me');
  const joke = interviewQuestions.find(q => q.id === 'compute').options.find(o => o.id === 'sleep');
  assert.doesNotMatch(why.them, /2029/);
  assert.doesNotMatch(joke.goodReply, /during the rejection/);
  assert.doesNotMatch(misc.interviewQuestions.why_me.them, /2029/);
  assert.doesNotMatch(misc.interviewQuestions.compute.options.sleep.goodReply, /被拒的时候/);
  assert.match(visitQuestions.find(q => q.id === 'stuck').replies[2], /colder/);
  assert.match(misc.visitQuestions.stuck.replies[2], /冷/);
  assert.match(admissionsEventsZh.letter.choices.backup.text, /简短/);
  assert.match(admissionsEventsZh.letter.choices.nudge.successText, /已收到/);
});

for (const lang of ['en', 'zh']) test(`${lang}: a student's meeting answer describes the schedule used on enrollment`, () => {
  setAppLanguage(lang);
  try {
    for (const traits of [
      { availability: 85, ambition: 50, labSize: 7 },
      { availability: 50, ambition: 50, labSize: 7 },
      { availability: 30, ambition: 50, labSize: 3 },
      { availability: 10, ambition: 50, labSize: 7 },
      { availability: 50, ambition: 90, labSize: 20 },
    ]) {
      const s = applicant(), a = s.advisors[0];
      Object.assign(a, traits);
      const key = `${a.id}:student`;
      s.threads[key] = { kind: 'student', advisorId: a.id, messages: [], asked: [], done: false };
      s.rng = 1; // Truthful reply; the student's uncertainty branch is separate.
      const energy = s.player.stats.energy;
      const result = askStudentThread(s, a.id, 'meet');
      const cadence = cadenceFor(a);
      assert.ok(result.messages.at(-1).text.includes(t('one-on-ones are {oneOnOne}; group meetings are {group}. That is the calendar, at least', {
        oneOnOne: t(cadence.oneOnOne), group: t(cadence.group),
      })));
      assert.equal(s.player.stats.energy, energy - 2);
      assert.throws(() => askStudentThread(s, a.id, 'meet'));
      assert.equal(s.player.stats.energy, energy - 2, 'a repeat cannot charge energy again');
    }
  } finally { setAppLanguage('en'); }
});
