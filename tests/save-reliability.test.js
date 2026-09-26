import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, TOTAL_MONTHS } from '../src/engine/state.js';
import { validRun, emptyMeta, loadSave, saveRun, listSlots, readSlot, writeSlot, deleteSlot, resetSave } from '../src/engine/save.js';

const KEY = 'phdsim.academic-os.v2';
function memory() {
  const values = new Map();
  return {
    values, failRead: false, failWrite: false, failRemove: false,
    getItem(key) { if (this.failRead) throw new Error('blocked'); return values.get(key) ?? null; },
    setItem(key, value) { if (this.failWrite) throw new Error('quota'); values.set(key, value); },
    removeItem(key) { if (this.failRemove) throw new Error('blocked'); values.delete(key); },
  };
}

test('failed autosaves preserve the last disk state and retry encounter accounting exactly once', () => {
  const storage = memory();
  const run = createRun(510);
  run.seen.orientation = 1;
  const first = saveRun(storage, run, emptyMeta());
  const disk = storage.getItem(KEY);
  run.seen.orientation = 2;
  run.achievements.push('prelim');
  storage.failWrite = true;
  const failed = saveRun(storage, run, first.meta);
  assert.ok(failed.error);
  assert.equal(storage.getItem(KEY), disk);
  assert.deepEqual(run.persistedSeen, { orientation: 1 });
  assert.equal(failed.meta.eventCounts.orientation, 1);
  assert.equal(failed.meta.achievements.includes('prelim'), false);
  storage.failWrite = false;
  const retried = saveRun(storage, run, failed.meta);
  assert.equal(retried.error, null);
  assert.equal(retried.meta.eventCounts.orientation, 2);
  assert.equal(saveRun(storage, run, retried.meta).meta.eventCounts.orientation, 2);
  assert.ok(loadSave(storage).meta.achievements.includes('prelim'));
});

test('corrupt save envelopes cannot be silently replaced by autosave or slot operations', () => {
  for (const raw of ['{broken', 'null', '[]', '42', '{"slots": []}', '{"meta":{"achievements":42}}', '{"meta":{"settings":[]}}']) {
    const storage = memory();
    storage.setItem(KEY, raw);
    assert.ok(loadSave(storage).error, raw);
    assert.ok(saveRun(storage, createRun(510), emptyMeta()).error, raw);
    assert.ok(writeSlot(storage, 1, createRun(511)), raw);
    assert.ok(deleteSlot(storage, 1), raw);
    assert.equal(storage.getItem(KEY), raw);
    assert.equal(readSlot(storage, 1), null);
    assert.equal(listSlots(storage).length, 3);
    assert.equal(resetSave(storage), null);
    assert.equal(saveRun(storage, createRun(512), emptyMeta()).error, null);
  }
});

test('temporarily unreadable storage never becomes an empty document on the next write', () => {
  const storage = memory();
  const run = createRun(510);
  saveRun(storage, run, emptyMeta());
  writeSlot(storage, 1, run);
  const disk = storage.getItem(KEY);
  storage.failRead = true;
  assert.ok(saveRun(storage, run, emptyMeta()).error);
  assert.ok(writeSlot(storage, 2, run));
  assert.ok(deleteSlot(storage, 1));
  assert.ok(loadSave(storage).error);
  storage.failRead = false;
  assert.equal(storage.getItem(KEY), disk);
  assert.equal(readSlot(storage, 1).seed, run.seed);
});

test('loading does not remove legacy saves and reset failure is recoverable', () => {
  const storage = memory();
  storage.setItem('phdsim.academic-os.v1', 'legacy backup');
  saveRun(storage, createRun(510), emptyMeta());
  const disk = storage.getItem(KEY);
  assert.ok(loadSave(storage).notice);
  assert.equal(storage.getItem('phdsim.academic-os.v1'), 'legacy backup');
  storage.failRemove = true;
  assert.ok(resetSave(storage));
  assert.equal(storage.getItem(KEY), disk);
});

test('final month endings remain loadable while malformed core run fields are rejected', () => {
  const run = createRun(510);
  run.phase = 'ending'; run.month = TOTAL_MONTHS;
  run.ending = { id: 'abd', title: 'All But Dissertation' };
  assert.equal(validRun(run), true);
  const storage = memory();
  assert.equal(saveRun(storage, run, emptyMeta()).error, null);
  assert.equal(loadSave(storage).run.month, TOTAL_MONTHS);
  for (const mutate of [
    r => { r.phase = 'playing'; },
    r => { r.month = TOTAL_MONTHS + 1; },
    r => { r.week = -1; },
    r => { r.week = 5; },
    r => { r.player.stats.unused = r.player.stats.hope; delete r.player.stats.hope; },
    r => { r.player.skills = []; },
    r => { r.relationship = 'broken'; },
    r => { r.milestones = null; },
    r => { r.advisors = [null]; },
    r => { r.eventQueue = [{}]; },
  ]) {
    const malformed = structuredClone(run);
    mutate(malformed);
    assert.equal(validRun(malformed), false);
  }
});

test('slot mutations reject invalid slots and runs without changing existing data', () => {
  const storage = memory();
  const run = createRun(510);
  saveRun(storage, run, emptyMeta());
  const disk = storage.getItem(KEY);
  for (const id of [0, 4, -1, 1.5, '__proto__', 'constructor']) {
    assert.ok(writeSlot(storage, id, run));
    assert.ok(deleteSlot(storage, id));
    assert.equal(readSlot(storage, id), null);
  }
  assert.ok(writeSlot(storage, 1, {}));
  assert.equal(storage.getItem(KEY), disk);
});


test('unsupported autosaves survive settings saves, new runs, slots and reloads as exact inert archives', () => {
  for (const kind of ['future-envelope', 'future-run', 'malformed-run', 'malformed-slot']) {
    const storage = memory();
    const run = createRun(920);
    const data = { version: run.version, run, meta: emptyMeta(), slots: { 1: createRun(921) } };
    if (kind === 'future-envelope') { data.version++; data.meta = { futureCollection: true }; data.slots = ['future schema']; }
    if (kind === 'future-run') data.run.version++;
    if (kind === 'malformed-run') data.run.player.stats.energy = null;
    if (kind === 'malformed-slot') data.slots[1].version++;
    const original = JSON.stringify(data, null, 2);
    storage.setItem(KEY, original);
    const loaded = loadSave(storage);
    assert.equal(loaded.error, null, kind);
    assert.equal(loaded.recoveryCount, 1, kind);
    assert.match(loaded.notice, /cannot resume/);
    assert.equal(storage.getItem(KEY), original, 'reading is not a mutation');
    loaded.meta.settings.quiet = true;
    assert.equal(saveRun(storage, loaded.run, loaded.meta).error, null);
    assert.deepEqual(JSON.parse(storage.getItem(KEY)).recovery, [original]);
    assert.equal(loadSave(storage).recoveryCount, 1);
    const next = createRun(922);
    assert.equal(saveRun(storage, next, loaded.meta).error, null);
    assert.equal(writeSlot(storage, 2, next), null);
    assert.equal(deleteSlot(storage, 2), null);
    assert.deepEqual(JSON.parse(storage.getItem(KEY)).recovery, [original]);
    assert.equal(loadSave(storage).run.seed, 922);
    assert.equal(loadSave(storage).meta.settings.quiet, true);
    assert.equal(resetSave(storage), null);
    assert.equal(loadSave(storage).recoveryCount, undefined);
  }
});

test('archive quota and supported-size failures never overwrite an incompatible original', () => {
  for (const oversized of [false, true]) {
    const storage = memory();
    const run = createRun(923); run.version++;
    const original = JSON.stringify({ version: 3, run, meta: emptyMeta(), ...(oversized ? { padding: 'x'.repeat(5 * 1024 * 1024) } : {}) });
    storage.setItem(KEY, original);
    storage.failWrite = !oversized;
    const loaded = loadSave(storage);
    const next = createRun(924);
    assert.ok(saveRun(storage, next, loaded.meta).error);
    assert.equal(storage.getItem(KEY), original);
    assert.ok(writeSlot(storage, 1, next));
    assert.equal(storage.getItem(KEY), original);
    assert.ok(deleteSlot(storage, 1));
    assert.equal(storage.getItem(KEY), original);
    assert.equal(loadSave(storage).recoveryCount, 1);
  }
});


test('repeated incompatibility keeps one exact snapshot chain, without duplicating older originals', () => {
  const storage = memory();
  const run = createRun(926); run.stage = 'future-stage';
  const first = JSON.stringify({ version: run.version, run, meta: emptyMeta() });
  storage.setItem(KEY, first);
  assert.equal(loadSave(storage).run, null);
  assert.equal(validRun(run), false);
  saveRun(storage, createRun(927), loadSave(storage).meta);
  const secondData = JSON.parse(storage.getItem(KEY));
  secondData.run.stage = 'another-future-stage';
  const second = JSON.stringify(secondData);
  storage.setItem(KEY, second);
  saveRun(storage, createRun(928), loadSave(storage).meta);
  const restored = JSON.parse(storage.getItem(KEY));
  assert.deepEqual(restored.recovery, [second]);
  assert.deepEqual(JSON.parse(restored.recovery[0]).recovery, [first]);
});
