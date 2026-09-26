import test from 'node:test';
import assert from 'node:assert/strict';
import { startViva, stopViva, vivaRunning, examLive, examTalk, examInterrupt, vivaMove, examAdvance, examCorridor } from '../src/ui/viva.js';

// The room can run without rendering; its clock must never consume reading time.
const originalDocument = globalThis.document;
globalThis.document = { querySelector: () => null };
test.after(() => { stopViva(); globalThis.document = originalDocument; });

function complete(kind, chooseSlide, chooseAnswer) {
  let outcome;
  startViva(3241, kind, { research: 40, math: 40, communication: 40 }, x => { outcome = x; }, { selfPaced: true });
  for (let turn = 0; vivaRunning() && turn < 100; turn++) {
    const s = examLive();
    if (s.holdUntil || ['intro', 'clear'].includes(s.phase)) examAdvance();
    else if (s.phase === 'talk') {
      if (s.interrupt) examInterrupt('answer');
      else examTalk(chooseSlide(s.deck[s.slideIndex]));
    } else if (s.phase === 'qa') vivaMove(chooseAnswer(s.questions[s.index]));
    else { examCorridor('nothing'); examAdvance(); }
  }
  assert.ok(outcome, 'the entire exam resolves through player actions');
  return outcome;
}

test('self-paced viva waits indefinitely and advances feedback only on request', async () => {
  startViva(1, 'prelim', {}, () => {}, { selfPaced: true });
  assert.equal(vivaRunning(), true);
  await new Promise(resolve => setTimeout(resolve, 240));
  assert.equal(examLive().elapsed, 0);
  while (examLive().phase === 'talk' && !examLive().holdUntil) {
    if (examLive().interrupt) examInterrupt('ignore');
    else examTalk('next');
  }
  assert.ok(examLive().holdUntil);
  examAdvance();
  assert.equal(examLive().phase, 'qa');
  vivaMove('concede');
  const first = examLive().index;
  await new Promise(resolve => setTimeout(resolve, 240));
  assert.equal(examLive().index, first);
  vivaMove('answer');
  assert.equal(Object.values(examLive().tally).reduce((a, b) => a + b), 1);
  examAdvance();
  assert.equal(examLive().index, first + 1);
  stopViva();
});

test('self-paced exams preserve presentation tradeoffs and answer consequences', () => {
  for (const kind of ['prelim', 'proposal', 'defense']) {
    const selective = complete(kind, slide => slide.w === 'core' ? 'hold' : 'next', () => 'concede');
    const lingering = complete(kind, () => 'hold', () => 'redirect');
    assert.ok(selective.talk.covered > 0);
    assert.equal(selective.talk.trapSeen, false);
    assert.ok(selective.caught > 0, 'conceding your own research still has consequences');
    assert.equal(lingering.talk.how, 'cut', 'explaining every slide exhausts the budget');
    assert.equal(lingering.talk.trapSeen, true);
    assert.equal(selective.silent, 0);
  }
});

test('self-paced seeded answers remain reproducible without guaranteeing success', () => {
  const first = complete('defense', () => 'next', () => 'answer');
  assert.deepEqual(complete('defense', () => 'next', () => 'answer'), first);
  assert.ok(first.caught > 0);
});
