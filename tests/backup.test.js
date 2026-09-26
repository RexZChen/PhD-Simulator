import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { SAVE_KEY, emptyMeta, loadSave, saveRun, writeSlot, readSlot } from '../src/engine/save.js';
import { BACKUP_MAX_BYTES, exportRecoveryOriginal, exportBackup, previewBackup, importBackup } from '../src/engine/backup.js';

function memory() {
  const values = new Map();
  return {
    failRead: false, failWrite: false, writes: 0,
    getItem(key) { if (this.failRead) throw Error('access'); return values.get(key) ?? null; },
    setItem(key, text) { if (this.failWrite) throw Error('quota'); this.writes++; values.set(key, text); },
  };
}
function fixture() {
  const storage = memory();
  const run = createRun(802, { name: '中文 applicant' });
  const meta = emptyMeta();
  meta.settings.textSize = 4; meta.settings.lang = 'zh';
  run.seen.orientation = 2; run.achievements.push('prelim');
  const saved = saveRun(storage, run, meta);
  writeSlot(storage, 1, createRun(803));
  writeSlot(storage, 3, createRun(804));
  return { storage, run, meta: saved.meta };
}

test('portable backups preview and round-trip autosave, all slots and collection without preview writes', () => {
  const { storage, run } = fixture();
  const backup = exportBackup(storage);
  assert.equal(backup.error, null);
  const writes = storage.writes;
  const preview = previewBackup(backup.text);
  assert.equal(preview.error, null);
  assert.equal(preview.summary.autosave.name, run.player.name);
  assert.deepEqual(preview.summary.slots.map(s => s.summary?.seed ?? null), [803, null, 804]);
  assert.equal(preview.summary.achievements, 1);
  assert.equal(storage.writes, writes);
  const destination = memory();
  destination.setItem('unrelated', 'untouched');
  assert.equal(importBackup(destination, backup.text).error, null);
  assert.deepEqual(loadSave(destination), loadSave(storage));
  assert.deepEqual(readSlot(destination, 3), readSlot(storage, 3));
  assert.equal(destination.getItem('unrelated'), 'untouched');
});

test('export rescues unsaved live progress during quota failures without committing live counters', () => {
  const { storage, run, meta } = fixture();
  const original = storage.getItem(SAVE_KEY);
  run.seen.orientation = 3;
  run.player.stats.money += 123;
  storage.failWrite = true;
  const liveBefore = structuredClone({ run, meta });
  const backup = exportBackup(storage, run, meta);
  assert.equal(backup.error, null);
  assert.deepEqual({ run, meta }, liveBefore);
  assert.equal(storage.getItem(SAVE_KEY), original);
  const destination = memory();
  importBackup(destination, backup.text);
  const restored = loadSave(destination);
  assert.equal(restored.run.player.stats.money, run.player.stats.money);
  assert.equal(restored.meta.eventCounts.orientation, 3);
  assert.equal(saveRun(destination, restored.run, restored.meta).meta.eventCounts.orientation, 3);
  assert.equal(readSlot(destination, 1).seed, 803);
});

test('invalid backup files never replace the current save, including damaged slots and unsafe keys', () => {
  const { storage } = fixture();
  const original = storage.getItem(SAVE_KEY);
  const backup = JSON.parse(exportBackup(storage).text);
  const cases = ['{', 'null', '[]', JSON.stringify({ ...backup, format: 'other-game' })];
  for (const mutate of [
    b => { b.data.run.player.stats.energy = null; },
    b => { b.data.run.stage = 'unknown'; },
    b => { b.data.run.player.skills = {}; },
    b => { b.data.run.conditions = [null]; },
    b => { b.data.run.committee = [null]; },
    b => { b.data.run.threads = []; },
    b => { b.data.run.report = 'broken'; },
    b => { b.data.slots[3] = {}; },
    b => { b.data.slots[4] = b.data.run; },
    b => { b.data.meta.settings.sound = 'yes'; },
    b => { b.data.meta.achievements = ['ok', null]; },
    b => { b.data.meta.eventCounts.orientation = -1; },
    b => { b.createdAt = 'never'; },
    b => { b.data.run.flags = JSON.parse('{"__proto__":{"polluted":true}}'); },
    b => { b.data.run.flags.deep = Array.from({ length: 140 }).reduce(value => ({ child: value }), {}); },
  ]) {
    const malformed = structuredClone(backup); mutate(malformed); cases.push(JSON.stringify(malformed));
  }
  for (const text of cases) {
    assert.equal(previewBackup(text).error, 'invalid');
    assert.equal(importBackup(storage, text).error, 'invalid');
    assert.equal(storage.getItem(SAVE_KEY), original);
  }
  assert.equal({}.polluted, undefined);
});

test('unsupported formats and oversized UTF-8 files have explicit errors', () => {
  const { storage } = fixture();
  const backup = JSON.parse(exportBackup(storage).text);
  for (const mutate of [b => { b.backupVersion++; }, b => { b.data.version++; }]) {
    const other = structuredClone(backup); mutate(other);
    assert.equal(previewBackup(JSON.stringify(other)).error, 'version');
  }
  assert.equal(previewBackup('x'.repeat(BACKUP_MAX_BYTES + 1)).error, 'too-large');
  assert.equal(previewBackup('中'.repeat(Math.ceil(BACKUP_MAX_BYTES / 3))).error, 'too-large');
});

test('failed imports preserve the prior save and a subsequent import can explicitly repair corruption', () => {
  const { storage } = fixture();
  const backup = exportBackup(storage);
  const original = storage.getItem(SAVE_KEY);
  storage.failWrite = true;
  assert.equal(importBackup(storage, backup.text).error, 'write');
  assert.equal(storage.getItem(SAVE_KEY), original);
  storage.failWrite = false;
  storage.setItem(SAVE_KEY, 'broken');
  assert.equal(exportBackup(storage).error, 'read');
  assert.equal(importBackup(storage, backup.text).error, null);
  assert.equal(loadSave(storage).error, null);
});

test('empty-library backups are valid while unreadable storage cannot silently lose manual slots', () => {
  const empty = exportBackup(memory());
  assert.equal(empty.error, null);
  assert.equal(previewBackup(empty.text).summary.autosave, null);
  const { storage, run, meta } = fixture();
  storage.failRead = true;
  assert.equal(exportBackup(storage, run, meta).error, 'read');
});


test('backup recovery retains exact unsupported envelopes without trying to resume or migrate them', () => {
  const { storage } = fixture();
  const originalData = JSON.parse(storage.getItem(SAVE_KEY));
  originalData.version++;
  originalData.meta = { future: 'unknown collection schema' };
  const original = JSON.stringify(originalData, null, 2);
  storage.setItem(SAVE_KEY, original);
  const loaded = loadSave(storage);
  const backup = exportBackup(storage, loaded.run, loaded.meta);
  assert.equal(backup.error, null);
  assert.equal(storage.getItem(SAVE_KEY), original);
  assert.equal(previewBackup(backup.text).summary.recoveryCount, 1);
  assert.equal(previewBackup(backup.text).summary.autosave, null);
  assert.deepEqual(JSON.parse(backup.text).data.recovery, [original]);
  const destination = memory();
  assert.equal(importBackup(destination, backup.text).error, null);
  assert.equal(loadSave(destination).run, null);
  assert.equal(loadSave(destination).recoveryCount, 1);
  const meta = loadSave(destination).meta;
  assert.equal(saveRun(destination, createRun(925), meta).error, null);
  const nextBackup = exportBackup(destination);
  assert.deepEqual(JSON.parse(nextBackup.text).data.recovery, [original]);
  const malformed = JSON.parse(nextBackup.text);
  malformed.data.recovery = [{}];
  const before = destination.getItem(SAVE_KEY);
  assert.equal(importBackup(destination, JSON.stringify(malformed)).error, 'invalid');
  assert.equal(destination.getItem(SAVE_KEY), before);
});


test('quote-heavy incompatible saves remain downloadable as exact originals beyond the wrapped backup cap', () => {
  const storage = memory();
  const original = JSON.stringify({ version: 999, payload: '"'.repeat(1400000) });
  assert.ok(Buffer.byteLength(original) < BACKUP_MAX_BYTES);
  storage.setItem(SAVE_KEY, original);
  const loaded = loadSave(storage);
  assert.ok(saveRun(storage, null, loaded.meta).error);
  assert.equal(storage.getItem(SAVE_KEY), original);
  assert.equal(exportBackup(storage, null, loaded.meta).error, 'too-large');
  assert.deepEqual(exportRecoveryOriginal(storage, 0), { text: original, error: null });
  assert.equal(exportRecoveryOriginal(storage, 1).error, 'invalid');
  assert.equal(exportRecoveryOriginal(storage, -1).error, 'invalid');
  assert.equal(storage.getItem(SAVE_KEY), original);
});
