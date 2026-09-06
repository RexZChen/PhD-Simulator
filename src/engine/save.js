import { VERSION } from './state.js';
const KEY = 'phdsim.academic-os.v2';
const LEGACY = ['phdsim.academic-os.v1'];
export const emptyMeta = () => ({ achievements: [], archetypes: [], endings: [], seenEvents: [], eventCounts: {}, runs: 0, settings: { quiet: false, sound: true, largeText: false, tips: true } });
export function validRun(s) {
  return !!s && s.version === VERSION && ['prep', 'application', 'interviews', 'admissions', 'playing', 'epilogue', 'ending'].includes(s.phase)
    && Number.isInteger(s.rng) && Number.isInteger(s.month) && s.month >= 0 && s.month < 72 && Number.isInteger(s.week)
    && s.player && Object.values(s.player.stats || {}).length === 6 && Object.values(s.player.stats).every(Number.isFinite)
    && s.player.hidden && s.player.skills && s.player.personality && s.player.profile
    && ['applications', 'offers', 'advisors', 'history', 'inbox', 'chatMessages', 'achievements', 'scheduled', 'eventQueue', 'projects', 'requests', 'labmates', 'peers'].every(k => Array.isArray(s[k]))
    && s.flags && s.actions && s.cooldowns && s.relationship && s.housing && s.counts && s.cadence
    && (!['playing', 'epilogue'].includes(s.phase) || !!(s.program && s.advisor));
}
export function loadSave(storage) {
  let notice = null;
  try {
    for (const k of LEGACY) if (storage.getItem(k)) { storage.removeItem(k); notice = 'A save from an older build was found and retired. Achievements from that build were not carried over.'; }
    const raw = storage.getItem(KEY);
    if (!raw) return { run: null, meta: emptyMeta(), error: null, notice };
    const data = JSON.parse(raw);
    const meta = { ...emptyMeta(), ...(data.meta || {}), settings: { ...emptyMeta().settings, ...(data.meta?.settings || {}) } };
    if (!['achievements', 'archetypes', 'endings', 'seenEvents'].every(k => Array.isArray(meta[k]))) throw new Error('invalid meta');
    if (!meta.eventCounts || typeof meta.eventCounts !== 'object' || Array.isArray(meta.eventCounts)) throw new Error('invalid meta');
    for (const id of meta.seenEvents) if (!Number.isFinite(meta.eventCounts[id])) meta.eventCounts[id] = 1;
    if (data.run && !validRun(data.run)) return { run: null, meta, error: null, notice: 'The saved run could not be loaded and was set aside. Your achievements are intact.' };
    // Older saves did not record which encounters had already been folded into meta.
    // Mark their current totals as committed so the first autosave does not add them twice.
    if (data.run && !data.run.persistedSeen) data.run.persistedSeen = structuredClone(data.run.seen || {});
    return { run: data.run || null, meta, error: null, notice };
  } catch {
    return { run: null, meta: emptyMeta(), error: 'The save could not be read. You can start a fresh run or reset this game’s save. Other browser data is untouched.', notice };
  }
}
export function saveRun(storage, run, meta) {
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
  if (run) run.persistedSeen = structuredClone(run.seen || {});
  try { storage.setItem(KEY, JSON.stringify({ version: VERSION, run, meta: next })); return { meta: next, error: null }; }
  catch { return { meta: next, error: 'Browser storage is unavailable or full. This run is playable, but progress will not survive closing or reloading the page.' }; }
}
export function resetSave(storage) { storage.removeItem(KEY); }
