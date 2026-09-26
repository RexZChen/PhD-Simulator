import { VERSION, TOTAL_MONTHS, WEEKS } from './state.js';
import { maintainTenure, TENURE_EVENT_IDS, openTenureEvent } from './tenure.js';
import { reviewLegacySupervision } from './supervision.js';
import { validVenture, ventureEventEligible } from './venture.js';
import { normalizeChatHistory } from './conversation.js';
import { focusOptions } from './time.js';
export const SAVE_KEY = 'phdsim.academic-os.v2';
export const SAVE_MAX_BYTES = 5 * 1024 * 1024;
const KEY = SAVE_KEY;
const LEGACY = ['phdsim.academic-os.v1'];
export const emptyMeta = () => ({ achievements: [], archetypes: [], endings: [], seenEvents: [], eventCounts: {}, runs: 0, settings: { quiet: false, sound: true, largeText: false, tips: true } });
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const READ_ERROR = 'The save could not be read. You can start a fresh run or reset this game’s save. Other browser data is untouched.';
const WRITE_ERROR = 'Save storage is unavailable or full. This run is playable, but progress will not survive closing or reloading the game.';
export const RECOVERY_NOTICE = 'A save this build cannot load is preserved in recovery storage. Saved runs can download its original file; this build cannot resume that archived run.';
const RUN_STAGES = new Set(['plan', 'event', 'pushback', 'minigame', 'milestone', 'commencement', 'epilogue', 'summons', 'trip', 'crisis', 'report']);
const statNames = ['hope', 'confidence', 'energy', 'health', 'money', 'academicCapital'];
const validAgreement = a => a == null || (record(a) && ['coadvised', 'handover'].includes(a.kind)
  && typeof a.advisorId === 'string' && typeof a.schoolId === 'string'
  && record(a.mentor) && typeof a.mentor.id === 'string' && typeof a.mentor.name === 'string'
  && record(a.mentor.relationship) && ['trust', 'satisfaction'].every(k => Number.isFinite(a.mentor.relationship[k]))
  && (a.kind !== 'handover' || (typeof a.projectId === 'string' && Number.isInteger(a.from) && Number.isInteger(a.until) && a.until > a.from)));
const validTenure = a => a == null || (record(a) && typeof a.advisorId === 'string' && typeof a.schoolId === 'string'
  && ['granted', 'denied'].includes(a.outcome) && Number.isInteger(a.announcedMonth)
  && ['decided', 'notice', 'resolved'].includes(a.status) && (a.departureMonth == null || Number.isInteger(a.departureMonth)));
function normalizeRun(s) {
  if (!s) return s;
  normalizeChatHistory(s);
  if (s.phase !== 'playing') return s;
  maintainTenure(s);
  reviewLegacySupervision(s);
  if (TENURE_EVENT_IDS.has(s.event) && !openTenureEvent(s, s.event)) {
    s.event = null; s.stage = s.eventReturn || 'plan';
  }
  // Earlier saves held company flags without the parties or shares. Do not resume
  // those decisions as if an agreement could be reconstructed from the flags.
  if (s.event?.startsWith('spin_') && !ventureEventEligible(s, s.event)) {
    s.event = null; s.stage = 'plan';
  }
  // Plan menus can change between builds. An obsolete selection is not permission
  // to spend a turn; resume with the available choices, preserving every budget.
  if (s.stage === 'plan' && s.focus && !focusOptions(s).some(f => f.id === s.focus && !f.disabled)) s.focus = null;
  return s;
}
export function validRun(s) {
  return !!(record(s) && s.version === VERSION && RUN_STAGES.has(s.stage) && ['prep', 'application', 'interviews', 'admissions', 'playing', 'epilogue', 'ending'].includes(s.phase)
    && Number.isInteger(s.rng) && Number.isInteger(s.month) && s.month >= 0
    && (s.month < TOTAL_MONTHS || (s.phase === 'ending' && s.month === TOTAL_MONTHS))
    && Number.isInteger(s.week) && s.week >= 0 && s.week <= WEEKS
    && record(s.player) && typeof s.player.name === 'string' && record(s.player.stats)
    && statNames.every(k => Number.isFinite(s.player.stats[k]))
    && ['hidden', 'skills', 'personality', 'profile'].every(k => record(s.player[k]))
    && ['applications', 'offers', 'advisors', 'history', 'inbox', 'chatMessages', 'achievements', 'scheduled', 'eventQueue', 'projects', 'requests', 'labmates', 'peers'].every(k => Array.isArray(s[k]))
    && ['applications', 'advisors', 'history', 'inbox', 'chatMessages', 'scheduled', 'projects', 'requests', 'labmates', 'peers'].every(k => s[k].every(record))
    && ['offers', 'achievements', 'eventQueue'].every(k => s[k].every(id => typeof id === 'string'))
    && ['flags', 'actions', 'cooldowns', 'relationship', 'housing', 'counts', 'cadence', 'milestones', 'jobs'].every(k => record(s[k]))
    && validAgreement(s.supervision) && validTenure(s.advisorTenure) && validVenture(s.venture)
    && ['supervisionHistory', 'advisorTenureHistory'].every(k => s[k] === undefined || (Array.isArray(s[k]) && s[k].every(record)))
    && (!['playing', 'epilogue'].includes(s.phase) || (record(s.program) && record(s.advisor))));
}
// A failed read must never be treated as an empty save by a later write: it may contain the
// player's only copy of an autosave and three slots. Only an explicit reset can discard it.
export const readSaveEnvelope = storage => {
  const raw = storage.getItem(KEY);
  if (!raw) return {};
  const data = JSON.parse(raw);
  // An unknown envelope has an unknown schema, including its collection and slots. Preserve
  // it wholesale rather than interpreting selected fields as if a migration had taken place.
  if (record(data) && data.version !== undefined && data.version !== VERSION) {
    return { version: VERSION, run: null, meta: emptyMeta(), slots: {}, recovery: [raw] };
  }
  if (!record(data) || (data.slots !== undefined && !record(data.slots))) throw new Error('invalid save');
  if (data.recovery !== undefined && (!Array.isArray(data.recovery) || !data.recovery.every(raw => typeof raw === 'string'))) throw new Error('invalid recovery');
  if (data.meta !== undefined) {
    if (!record(data.meta) || (data.meta.settings !== undefined && !record(data.meta.settings))) throw new Error('invalid meta');
    for (const key of ['achievements', 'archetypes', 'endings', 'seenEvents']) {
      if (data.meta[key] !== undefined && (!Array.isArray(data.meta[key]) || !data.meta[key].every(id => typeof id === 'string'))) throw new Error('invalid meta');
    }
    if (data.meta.eventCounts !== undefined && !record(data.meta.eventCounts)) throw new Error('invalid meta');
  }
  const incompatibleRun = data.run != null && !validRun(data.run);
  const incompatibleSlots = Object.entries(data.slots || {}).some(([id, run]) => !/^[1-3]$/.test(id) || (run != null && !validRun(run)));
  if (!incompatibleRun && !incompatibleSlots) return data;
  // Reading never writes. The next successful mutation commits both the exact original bytes
  // and the usable state in one operation. If that write fails, the original remains in place.
  // Archived JSON is inert: no migration, normalization or resume path reads its run fields.
  return {
    version: VERSION,
    run: !incompatibleRun ? data.run || null : null,
    meta: data.meta,
    slots: Object.fromEntries(Object.entries(data.slots || {}).filter(([id, run]) => /^[1-3]$/.test(id) && (run == null || validRun(run)))),
    // The exact latest envelope already contains all earlier archives. Do not duplicate them.
    recovery: [raw],
  };
};
const readAll = readSaveEnvelope;
const serialize = data => {
  const raw = JSON.stringify(data);
  // A recovery-bearing save must remain exportable. Never replace the original with an
  // archive too large for the portable backup envelope (reserve space for its wrapper).
  if (data.recovery?.length && new TextEncoder().encode(raw).byteLength > SAVE_MAX_BYTES - 1024) throw new Error('recovery too large');
  return raw;
};
export function loadSave(storage) {
  let notice = null;
  try {
    for (const k of LEGACY) if (storage.getItem(k)) { notice = 'A save from an older build was found and retired. Achievements from that build were not carried over.'; }
    const raw = storage.getItem(KEY);
    if (!raw) return { run: null, meta: emptyMeta(), error: null, notice };
    const data = readAll(storage);
    const meta = { ...emptyMeta(), ...(data.meta || {}), settings: { ...emptyMeta().settings, ...(data.meta?.settings || {}) } };
    if (!['achievements', 'archetypes', 'endings', 'seenEvents'].every(k => Array.isArray(meta[k]) && meta[k].every(id => typeof id === 'string'))) throw new Error('invalid meta');
    if (!meta.eventCounts || typeof meta.eventCounts !== 'object' || Array.isArray(meta.eventCounts)) throw new Error('invalid meta');
    for (const id of meta.seenEvents) if (!Number.isFinite(meta.eventCounts[id])) meta.eventCounts[id] = 1;
    if (data.recovery?.length) notice = RECOVERY_NOTICE;
    // Older saves did not record which encounters had already been folded into meta.
    // Mark their current totals as committed so the first autosave does not add them twice.
    if (data.run && !data.run.persistedSeen) data.run.persistedSeen = structuredClone(data.run.seen || {});
    return { run: normalizeRun(data.run) || null, meta, error: null, notice, ...(data.recovery?.length ? { recoveryCount: data.recovery.length } : {}) };
  } catch {
    return { run: null, meta: emptyMeta(), error: READ_ERROR, notice };
  }
}
export function saveRun(storage, run, meta) {
  let data;
  try { data = readAll(storage); } catch { return { meta, error: READ_ERROR }; }
  if (run && !validRun(run)) return { meta, error: READ_ERROR };
  try {
    const next = structuredClone(meta);
    for (const id of run?.achievements || []) if (!next.achievements.includes(id)) next.achievements.push(id);
    if (run?.advisor && !next.archetypes.includes(run.advisor.archetype)) next.archetypes.push(run.advisor.archetype);
    if (run?.ending && !next.endings.includes(run.ending.id)) next.endings.push(run.ending.id);
    for (const [id, count] of Object.entries(run?.seen || {})) {
      if (!next.seenEvents.includes(id)) next.seenEvents.push(id);
      const recorded = run.persistedSeen?.[id] || 0;
      const delta = Math.max(0, count - recorded);
      if (delta) next.eventCounts[id] = (next.eventCounts[id] || 0) + delta;
    }
    const persistedSeen = structuredClone(run?.seen || {});
    const savedRun = run ? { ...run, persistedSeen } : null;
    storage.setItem(KEY, serialize({ version: VERSION, run: savedRun, meta: next, ...(data.slots ? { slots: data.slots } : {}), ...(data.recovery?.length ? { recovery: data.recovery } : {}) }));
    // Commit encounter accounting only after the write succeeds. A retry after a quota failure
    // must count those encounters exactly once, regardless of whether the caller kept meta.
    if (run) run.persistedSeen = persistedSeen;
    return { meta: next, error: null };
  } catch { return { meta, error: WRITE_ERROR }; }
}
export function resetSave(storage) {
  try { storage.removeItem(KEY); return null; }
  catch { return WRITE_ERROR; }
}

// ── Saved runs ────────────────────────────────────────────────────────────────────────────────
//
// One autosave was the whole save system, so starting anything new destroyed the run you had and
// the only control was a button that wiped achievements as well. These are three manual slots
// alongside it, held in the same storage key so there is one place that can be full.
//
// Achievements, endings and the seen-scene counters live in `meta` and are deliberately NOT
// per-slot: they are what the machine has seen, not what one student did, and the collection
// screen would be meaningless otherwise. Deleting a run never touches them, and the manager says so.
export const SLOTS = 3;

const writeAll = (storage, data) => {
  try { storage.setItem(KEY, serialize(data)); return null; }
  catch { return 'Save storage is unavailable or full. Your saved runs are unchanged.'; }
};

// What a slot looks like in a list, without loading the whole run.
export function slotSummary(run) {
  if (!run) return null;
  return {
    name: run.player?.name || '—',
    program: run.program?.name || null,
    advisor: run.advisor?.name || null,
    month: run.month ?? 0,
    phase: run.phase,
    ending: run.ending?.title || null,
    seed: run.seed,
    savedAt: run.savedAt || null,
  };
}

export function listSlots(storage) {
  let data;
  try { data = readAll(storage); } catch { data = {}; }
  const slots = data.slots || {};
  const out = [];
  for (let i = 1; i <= SLOTS; i++) {
    const run = slots[i] && validRun(slots[i]) ? slots[i] : null;
    out.push({ id: i, run, summary: slotSummary(run) });
  }
  return out;
}

export function readSlot(storage, id) {
  if (!validSlotId(id)) return null;
  try {
    const run = (readAll(storage).slots || {})[id];
    return run && validRun(run) ? normalizeRun(run) : null;
  } catch { return null; }
}

// Copy the live run into a slot. Stamped so the list can say when, because "which one is newer"
// is the only question anybody asks of a save list.
const validSlotId = id => Number.isInteger(id) && id >= 1 && id <= SLOTS;

export function writeSlot(storage, id, run) {
  if (!validSlotId(id) || !validRun(run)) return 'There is no run to save.';
  let data;
  try { data = readAll(storage); } catch { return READ_ERROR; }
  data.slots = data.slots || {};
  data.slots[id] = { ...structuredClone(run), savedAt: Date.now() };
  return writeAll(storage, data);
}

export function deleteSlot(storage, id) {
  if (!validSlotId(id)) return READ_ERROR;
  let data;
  try { data = readAll(storage); } catch { return READ_ERROR; }
  if (data.slots) delete data.slots[id];
  return writeAll(storage, data);
}
