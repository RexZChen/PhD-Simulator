import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { availableWriters, askLetter, ensureLetters, hasAdvisorLetter, packetStrength } from '../src/engine/letters.js';

function fixture() {
  const s = createRun(4812);
  s.advisor = { id: 'pi-new', name: 'Mira Newton', connections: 60 };
  s.formerAdvisors = [{ id: 'pi-old', name: 'Alex Rivera' }];
  s.player.stats.energy = 90;
  s.letters = { asked: [], closed: false };
  return s;
}
const oldLetter = (name = 'Prof. Rivera') => ({ id: 'w-advisor', kind: 'advisor', name, status: 'yes', quality: 61, reach: 3, line: 'A saved reply.' });

test('legacy predecessor letter keeps its name, assessment and packet contribution while successor can be asked', () => {
  const s = fixture();
  s.letters.asked.push(oldLetter());
  const packet = packetStrength(s);
  const writers = availableWriters(s);
  assert.equal(s.letters.asked[0].id, 'w-advisor-pi-old');
  assert.equal(s.letters.asked[0].advisorId, 'pi-old');
  assert.equal(s.letters.asked[0].name, 'Prof. Rivera');
  assert.deepEqual(packetStrength(s), packet);
  assert.equal(hasAdvisorLetter(s), true);
  assert.equal(writers.find(w => w.kind === 'advisor').advisorId, 'pi-new');
  const old = structuredClone(s.letters.asked[0]);
  const energy = s.player.stats.energy;
  askLetter(s, 'w-advisor');
  assert.equal(s.player.stats.energy, energy - 4);
  assert.deepEqual(s.letters.asked[0], old);
  assert.equal(s.letters.asked[1].advisorId, 'pi-new');
  assert.equal(s.letters.asked[1].id, 'w-advisor-pi-new');
  assert.throws(() => askLetter(s, 'w-advisor'));
  assert.equal(s.player.stats.energy, energy - 4);
});

test('current legacy letter deduplicates in English and Chinese; unresolved names are not relabeled', () => {
  for (const name of ['Prof. Newton', 'Newton教授', 'Mira Newton']) {
    const s = fixture();
    s.letters.asked.push(oldLetter(name));
    assert.equal(availableWriters(s).some(w => w.kind === 'advisor'), false);
    assert.equal(s.letters.asked[0].advisorId, 'pi-new');
  }
  const s = fixture();
  s.letters.asked.push(oldLetter('Prof. Unknown'));
  const old = structuredClone(s.letters.asked[0]);
  assert.equal(availableWriters(s).some(w => w.kind === 'advisor'), true);
  assert.deepEqual(s.letters.asked[0], old);
});

test('same surname and repeated transitions do not rewrite existing author identity', () => {
  const s = fixture();
  s.formerAdvisors.push({ id: 'pi-other', name: 'Sam Newton' });
  s.letters.asked.push(oldLetter('Prof. Newton'));
  ensureLetters(s);
  assert.equal(s.letters.asked[0].advisorId, undefined);
  s.letters.asked[0].advisorId = 'pi-other';
  ensureLetters(s);
  assert.equal(s.letters.asked[0].id, 'w-advisor-pi-other');
  assert.equal(availableWriters(s).some(w => w.advisorId === 'pi-new'), true);
  const saved = JSON.parse(JSON.stringify(s));
  ensureLetters(saved);
  assert.deepEqual(saved.letters, s.letters);
});

test('internship mentor and advisor are one writer, including saved mentor letters', () => {
  const s = fixture();
  s.lastInternship = { company: 'Visiting lab', mentorAdvisorId: 'pi-new' };
  assert.equal(availableWriters(s).some(w => w.kind === 'mentor'), false);
  s.letters.asked.push({ id: 'w-mentor', kind: 'mentor', name: 'Visiting lab', status: 'yes', quality: 65, reach: 2 });
  assert.equal(availableWriters(s).some(w => w.kind === 'advisor'), false);
  assert.equal(s.letters.asked[0].advisorId, 'pi-new');
  assert.equal(hasAdvisorLetter(s), true);
  s.lastInternship.mentorAdvisorId = 'pi-old';
  assert.equal(s.letters.asked[0].advisorId, 'pi-new');
  assert.equal(availableWriters(s).some(w => w.kind === 'mentor'), true);
});

test('a newer internship uses its own captured mentor rather than an older advisor internship', () => {
  const s = fixture();
  const old = { employer: 'University Lab', mentor: 'Mira Newton', mentorAdvisorId: 'pi-new' };
  const recent = { employer: 'Second Lab', mentor: 'Dr. Chen' };
  s.intern = { history: [old, recent] };
  s.lastInternship = { company: recent.employer, mentor: recent.mentor };
  s.letters.asked.push({ id: 'w-mentor', kind: 'mentor', name: old.employer, status: 'yes', quality: 65, reach: 2 });
  const writers = availableWriters(s);
  assert.equal(s.letters.asked[0].advisorId, 'pi-new');
  assert.equal(writers.some(w => w.kind === 'advisor'), false);
  const mentor = writers.find(w => w.kind === 'mentor');
  assert.equal(mentor.name, 'Dr. Chen');
  assert.equal(mentor.advisorId, undefined);
  askLetter(s, 'w-mentor');
  assert.equal(s.letters.asked[1].name, 'Dr. Chen');
  assert.equal(s.letters.asked[1].advisorId, undefined);
  assert.equal(availableWriters(s).some(w => w.kind === 'mentor'), false);
  delete s.lastInternship;
  assert.equal(availableWriters(s).some(w => w.kind === 'mentor'), false);
});

test('same-employer legacy mentor letters stay ambiguous instead of inheriting an unrelated PI', () => {
  const s = fixture();
  s.intern = { history: [
    { employer: 'Shared Lab', mentor: 'Mira Newton', mentorAdvisorId: 'pi-new' },
    { employer: 'Shared Lab', mentor: 'Dr. Chen' },
  ] };
  s.letters.asked.push({ id: 'w-mentor', kind: 'mentor', name: 'Shared Lab', status: 'yes', quality: 65, reach: 2 });
  const writers = availableWriters(s);
  assert.equal(s.letters.asked[0].advisorId, undefined);
  assert.equal(writers.find(w => w.kind === 'mentor').name, 'Dr. Chen');
  assert.equal(writers.some(w => w.kind === 'advisor'), true);
});

test('closed packets preserve letters and reject the legacy action alias without energy cost', () => {
  const s = fixture();
  s.letters.closed = true;
  const energy = s.player.stats.energy;
  assert.throws(() => askLetter(s, 'w-advisor'));
  assert.equal(s.player.stats.energy, energy);
});
