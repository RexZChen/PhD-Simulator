import { VERSION } from './state.js';
import { SAVE_KEY, SAVE_MAX_BYTES, SLOTS, emptyMeta, readSaveEnvelope, saveRun, slotSummary, validRun } from './save.js';
import { skillNames } from '../data/catalog.js';

export const BACKUP_MAX_BYTES = SAVE_MAX_BYTES;
const FORMAT = 'phdsim.backup';
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const bytes = text => new TextEncoder().encode(text).byteLength;
const failed = error => ({ error });

// Imported files are untrusted. Reject dangerous object keys, excessive nesting and non-finite
// numbers before they can enter the game's mutable records. Inspect iteratively, not recursively.
function safeTree(root) {
  const pending = [[root, 0]];
  while (pending.length) {
    const [value, depth] = pending.pop();
    if (depth > 128 || (typeof value === 'number' && !Number.isFinite(value))) return false;
    if (!value || typeof value !== 'object') continue;
    for (const [key, child] of Object.entries(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) return false;
      pending.push([child, depth + 1]);
    }
  }
  return true;
}

function validMeta(meta) {
  if (!record(meta) || !record(meta.settings) || !record(meta.eventCounts)) return false;
  if (!['achievements', 'archetypes', 'endings', 'seenEvents'].every(k => Array.isArray(meta[k]) && meta[k].every(id => typeof id === 'string'))) return false;
  if (!Number.isSafeInteger(meta.runs) || meta.runs < 0 || !Object.values(meta.eventCounts).every(n => Number.isSafeInteger(n) && n >= 0)) return false;
  for (const k of ['quiet', 'sound', 'largeText', 'tips', 'untimedChoices', 'selfPaced']) {
    if (meta.settings[k] !== undefined && typeof meta.settings[k] !== 'boolean') return false;
  }
  return (meta.settings.lang === undefined || ['en', 'zh'].includes(meta.settings.lang))
    && (meta.settings.textSize === undefined || (Number.isInteger(meta.settings.textSize) && meta.settings.textSize >= 0 && meta.settings.textSize <= 4));
}

function validPortableRun(run) {
  if (!validRun(run) || !Number.isInteger(run.seed)) return false;
  if (!skillNames.every(k => Number.isFinite(run.player.skills[k])) || !['stress', 'burnoutRisk', 'loneliness'].every(k => Number.isFinite(run.player.hidden[k]))) return false;
  for (const k of ['seen', 'persistedSeen']) {
    if (run[k] !== undefined && (!record(run[k]) || !Object.values(run[k]).every(n => Number.isSafeInteger(n) && n >= 0))) return false;
  }
  if (run.event !== null && typeof run.event !== 'string') return false;
  if (run.stage === 'event' && !run.event) return false;
  if (run.phase === 'ending' && (!record(run.ending) || typeof run.ending.id !== 'string' || typeof run.ending.title !== 'string')) return false;
  for (const k of ['mutators', 'weekLog', 'conditions', 'bills', 'pendingCites', 'committee', 'chatphdLog', 'stuckTried', 'citiesVisited']) {
    if (run[k] !== undefined && !Array.isArray(run[k])) return false;
  }
  for (const k of ['askCooldowns', 'meetingStats', 'spend', 'caffeine', 'meals', 'lifeCooldowns', 'citations', 'insurance', 'threads', 'actorFor', 'recent', 'dayActions', 'stuckAsked']) {
    if (run[k] !== undefined && !record(run[k])) return false;
  }
  for (const k of ['prep', 'eventActor', 'report', 'internship', 'probation', 'dayPlan', 'advisorMode', 'epilogue', 'pushback', 'thesisIdea', 'doorScene', 'lectureResult', 'photo', 'preview', 'viva', 'lastInternship', 'crisis', 'ledger', 'patent', 'summons', 'thesis', 'grad', 'lastTrip', 'stampHold', 'trip', 'visaCase']) {
    if (run[k] != null && !record(run[k])) return false;
  }
  for (const [k, type] of [['committee', 'string'], ['mutators', 'string'], ['citiesVisited', 'string']]) {
    if (run[k] && !run[k].every(item => typeof item === type)) return false;
  }
  for (const k of ['bills', 'conditions', 'pendingCites']) {
    if (run[k] && !run[k].every(record)) return false;
  }
  return true;
}

function validData(data) {
  if (!record(data) || data.version !== VERSION || !validMeta(data.meta) || !record(data.slots)) return false;
  if (data.recovery !== undefined && (!Array.isArray(data.recovery) || !data.recovery.every(raw => typeof raw === 'string'))) return false;
  if (data.run !== null && !validPortableRun(data.run)) return false;
  return Object.entries(data.slots).every(([id, run]) => /^[1-3]$/.test(id) && (run === null || validPortableRun(run)));
}

function parseBackup(text) {
  if (typeof text !== 'string') return failed('invalid');
  if (text.length > BACKUP_MAX_BYTES || bytes(text) > BACKUP_MAX_BYTES) return failed('too-large');
  try {
    const backup = JSON.parse(text);
    if (!record(backup) || backup.format !== FORMAT || !record(backup.data)) return failed('invalid');
    if (backup.backupVersion !== 1 || backup.data.version !== VERSION) return failed('version');
    if (typeof backup.createdAt !== 'string' || !Number.isFinite(Date.parse(backup.createdAt)) || !safeTree(backup) || !validData(backup.data)) return failed('invalid');
    return { backup, error: null };
  } catch { return failed('invalid'); }
}

// Overrides rescue the live session when browser writes fail. A memory-only save folds the
// latest encounter counters into cloned meta without marking the live run as persisted.
export function exportBackup(storage, run, meta) {
  try {
    let data = readSaveEnvelope(storage);
    if (!record(data) || !safeTree(data)) return failed('read');
    if (bytes(JSON.stringify(data)) > BACKUP_MAX_BYTES - 1024) return failed('too-large');
    if (run !== undefined || meta !== undefined) {
      const memory = { getItem: () => JSON.stringify(data), setItem: (_key, value) => { data = JSON.parse(value); } };
      const result = saveRun(memory, structuredClone(run === undefined ? data.run || null : run), structuredClone(meta === undefined ? data.meta || emptyMeta() : meta));
      if (result.error) return failed('read');
    }
    data = { ...data, version: data.version ?? VERSION, run: data.run ?? null, meta: data.meta ?? emptyMeta(), slots: data.slots ?? {} };
    if (!validData(data)) return failed('invalid');
    const text = JSON.stringify({ format: FORMAT, backupVersion: 1, createdAt: new Date().toISOString(), data });
    if (bytes(text) > BACKUP_MAX_BYTES) return failed('too-large');
    return { text, error: null };
  } catch { return failed('read'); }
}

export function previewBackup(text) {
  const parsed = parseBackup(text);
  if (parsed.error) return parsed;
  const { data, createdAt } = parsed.backup;
  return { error: null, summary: {
    autosave: slotSummary(data.run),
    slots: Array.from({ length: SLOTS }, (_, i) => ({ id: i + 1, summary: slotSummary(data.slots[i + 1]) })),
    achievements: data.meta.achievements.length,
    recoveryCount: data.recovery?.length || 0,
    createdAt,
  } };
}

// Validate again at commit time. localStorage.setItem is atomic: quota/access failures leave
// the prior value intact. Never remove the original first and never touch other storage keys.
export function importBackup(storage, text) {
  const parsed = parseBackup(text);
  if (parsed.error) return parsed;
  try { storage.setItem(SAVE_KEY, JSON.stringify(parsed.backup.data)); return { error: null }; }
  catch { return failed('write'); }
}

// Recovery originals are not portable backups. Download their exact bytes, without wrapping
// or interpreting their contents, even when an escaped backup would exceed the size cap.
export function exportRecoveryOriginal(storage, index) {
  if (!Number.isInteger(index) || index < 0) return failed('invalid');
  try {
    const text = readSaveEnvelope(storage).recovery?.[index];
    return typeof text === 'string' ? { text, error: null } : failed('invalid');
  } catch { return failed('read'); }
}
