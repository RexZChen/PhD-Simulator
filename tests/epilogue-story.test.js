import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { prepareRun, dispatch } from '../src/engine/game.js';
import { startEpilogue, beatText, currentBeat, answerBeat } from '../src/engine/epilogue.js';
import { epilogueBeats, advisorNews } from '../src/data/epilogue.js';
import { tracks } from '../src/data/tracks.js';
import { epilogueStoryZh } from '../src/i18n/zh/epilogue-story.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { t } from '../src/i18n/index.js';
import { endingApp } from '../src/ui/screens.js';

function graduate(track = 'unplaced', seed = 4242) {
  let s = prepareRun(createRun(seed, { background: 'masters', topic: 'ml', international: false }));
  const advisor = s.advisors[6];
  s.phase = 'admissions'; s.offers = [advisor.schoolId];
  s.applications = [{ schoolId: advisor.schoolId, effort: 'tailored', poiId: advisor.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: advisor.id });
  s.month = 55;
  s.jobs = { chosen: track, market: [{ kind: track, employerId: 'test', name: 'An Employer', salary: track === 'unplaced' ? 0 : 80000 }] };
  s.thesis = { deferred: true };
  s.milestones.graduated = true;
  return s;
}

test('every career gets a promised relevant consequence before the player judges the PhD', () => {
  for (const track of tracks) {
    const s = graduate(track.id);
    startEpilogue(s, track.id);
    const beats = s.epilogue.beats.map(id => epilogueBeats.find(b => b.id === id));
    const career = beats.filter(b => b.tracks);
    assert.equal(career.length, 1, track.id);
    assert.ok(career[0].tracks.includes(track.id), track.id);
    assert.equal(beats.some(b => b.id === 'the_book'), track.id === 'tenure_track');
    assert.equal(beats[0].id, 'hooding');
    assert.equal(beats.at(-1).id, 'student_email');
    assert.deepEqual([...beats.map(b => b.when)].sort((a, b) => a - b), beats.map(b => b.when));
    while (currentBeat(s)?.id !== 'student_email') answerBeat(s, currentBeat(s).choices[0].id);
    const final = currentBeat(s);
    assert.deepEqual(final.choices.map(c => c.id), ['honest', 'different', 'short']);
    assert.equal(new Set(final.choices.map(c => c.effects.hope)).size, 1);
    const ended = dispatch(s, { type: 'EPILOGUE', id: 'different' });
    assert.equal(ended.ending.id, `phd_${track.id}`);
    assert.ok(ended.ending.text.includes(final.choices.find(c => c.id === 'different').line));
    assert.ok(!ended.ending.text.includes('You still email'));
    assert.ok(!endingApp(ended, {}).includes('Two years later, you are on the market again.'), 'legacy narration must not overwrite the completed epilogue');
  }
});

test('advisor news respects career stage and rendering never consumes RNG, including legacy saves', () => {
  const newsBeat = epilogueBeats.find(b => b.id === 'advisor_life');
  for (const stage of ['pre_tenure', 'newly_tenured', 'mid_career', 'late']) {
    for (let seed = 1; seed <= 15; seed++) {
      const s = graduate('unplaced', seed);
      s.advisor.stage = stage;
      startEpilogue(s, 'unplaced');
      const news = s.epilogue.advisorNewsIndex;
      if (stage !== 'pre_tenure') assert.notEqual(news, 0);
      if (stage !== 'late') assert.notEqual(news, 4);
      const before = JSON.stringify(s);
      assert.equal(beatText(s, newsBeat), t(advisorNews[news]));
      beatText(s, currentBeat(s)); beatText(s, newsBeat);
      assert.equal(JSON.stringify(s), before);
      delete s.epilogue.advisorNewsIndex;
      const legacy = JSON.stringify(s);
      assert.equal(beatText(s, newsBeat), beatText(s, newsBeat));
      assert.equal(JSON.stringify(s), legacy);
    }
  }
});

test('career payoffs and revised player positions have complete Chinese prose', () => {
  const changed = new Set(['hooding', 'coffee', 'student_email', 'labmate_news', 'the_book']);
  const strings = epilogueBeats.filter(b => b.tracks || changed.has(b.id)).flatMap(b =>
    [b.text, ...b.choices.flatMap(c => [c.label, c.line])]);
  for (const text of strings) assert.ok(epilogueStoryZh[text], `Missing story translation: ${text}`);
});

test('same saved news reads consistently in Chinese and English', () => {
  const s = graduate();
  startEpilogue(s, 'unplaced');
  const b = epilogueBeats.find(b => b.id === 'advisor_life');
  const english = beatText(s, b), before = JSON.stringify(s);
  try {
    setAppLanguage('zh');
    const chinese = beatText(s, b);
    assert.match(chinese, /[\u3400-\u9fff]/);
    assert.equal(beatText(s, b), chinese);
    setAppLanguage('en');
    assert.equal(beatText(s, b), english);
    assert.equal(JSON.stringify(s), before);
  } finally { setAppLanguage('en'); }
});
