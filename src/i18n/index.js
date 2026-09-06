// Minimal i18n. UI and engine strings are looked up by their English source text; content
// catalogs (events, meetings, requests, asks, chatter, memes, calendar, catalog) are translated
// in place by id when the language changes, with the English originals kept for switching back.
import { zh } from './zh/index.js';

const dicts = { zh };
let current = 'en';
const originals = new WeakMap();

// Content definitions can include predicate functions. `structuredClone` rejects
// functions, so preserve those references while copying the surrounding data.
function copy(value) {
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]));
  return value;
}

export const getLanguage = () => current;
export const languages = [['en', 'English'], ['zh', '简体中文']];

// ── Provenance ────────────────────────────────────────────────────────────────
// Text written into a run — mail, chat, the history log — outlives the language it was
// written in. t() records what produced each string in a small ring buffer, so state.js
// can store the source alongside the text and re-translate it at render time instead of
// freezing it. Strings assembled by concatenation have no single source and simply keep
// the behaviour they had before: they stay in the language they were written in.
// Recording pauses while the UI renders, so the buffer only ever holds engine output.
const PROV_MAX = 300;
const prov = new Map();
let recording = true;
export const pauseProvenance = () => { recording = false; };
export const resumeProvenance = () => { recording = true; };
export const clearProvenance = () => prov.clear();
export function provenanceOf(text) {
  if (typeof text !== 'string' || !text) return null;
  const hit = prov.get(text);
  if (hit) return hit;
  const slot = slotIndex.get(text);
  return slot ? { p: slot } : null;
}

// Catalog pools (chatter, requests, asks) are translated in place, so a stored reference to
// the slot a line came from keeps resolving in whatever language is current. Every string
// leaf is indexed by a dotted path after each language switch.
const roots = {};
const slotIndex = new Map();
function indexNode(name, node, path) {
  if (typeof node === 'string') { if (node) slotIndex.set(node, path ? `${name}.${path}` : name); return; }
  if (Array.isArray(node)) { node.forEach((v, i) => indexNode(name, v, path ? `${path}.${i}` : String(i))); return; }
  if (node && typeof node === 'object') for (const k of Object.keys(node)) indexNode(name, node[k], path ? `${path}.${k}` : k);
}
// Data modules register themselves at load, so the index exists even before a language
// is ever applied, and is rebuilt whenever the catalogs are re-translated.
export function registerCatalog(name, obj) { roots[name] = obj; reindex(); }
function reindex() {
  slotIndex.clear();
  for (const [name, obj] of Object.entries(roots)) indexNode(name, obj, '');
}
// Read a catalog slot back in the current language.
export function readSlot(ref) {
  const parts = String(ref).split('.');
  let node = roots[parts[0]];
  for (let i = 1; i < parts.length && node != null; i++) node = node[parts[i]];
  return typeof node === 'string' ? node : null;
}
export function rememberSource(result, meta) {
  if (!recording || typeof result !== 'string' || !result) return result;
  if (prov.size >= PROV_MAX && !prov.has(result)) prov.delete(prov.keys().next().value);
  prov.set(result, meta);
  return result;
}

export function t(text, vars) {
  const d = dicts[current];
  let out = (d && d.ui && Object.prototype.hasOwnProperty.call(d.ui, text)) ? d.ui[text] : text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  if (recording && typeof text === 'string') {
    let v;
    if (vars) {
      // A variable that is itself a translated string keeps its own reference, so the
      // whole sentence re-translates rather than half of it.
      v = {};
      for (const [k, val] of Object.entries(vars)) {
        const inner = typeof val === 'string' ? provenanceOf(val) : null;
        v[k] = inner ? { r: inner } : val;
      }
    }
    rememberSource(out, v ? { s: text, v } : { s: text });
  }
  return out;
}
// Translate a plain data string (school taglines, focus names, etc.) when a translation exists.
export const td = text => t(text);

function remember(obj) { if (!originals.has(obj)) originals.set(obj, copy(obj)); return originals.get(obj); }
function restore(obj) { const o = originals.get(obj); if (!o) return; for (const k of Object.keys(o)) obj[k] = copy(o[k]); }

function translateChoiceList(list, dict) {
  for (const e of list) {
    const base = remember(e);
    const tr = dict?.[e.id];
    if (!tr) { restore(e); continue; }
    e.title = tr.title ?? base.title;
    e.text = tr.text ?? base.text;
    if (tr.speakerLabel) e.speakerLabel = tr.speakerLabel;
    e.choices = base.choices.map(c => { const tc = tr.choices?.[c.id]; return tc ? { ...copy(c), text: tc.text ?? c.text, hint: tc.hint ?? c.hint, successText: tc.successText ?? c.successText, failureText: tc.failureText ?? c.failureText } : copy(c); });
  }
}
function translateSimple(list, dict, fields) {
  for (const item of list) {
    const base = remember(item);
    const tr = dict?.[item.id];
    if (!tr) { restore(item); continue; }
    for (const f of fields) if (tr[f] !== undefined) item[f] = tr[f]; else item[f] = base[f];
  }
}
// Replace values in place so other modules that imported the same objects see the change.
function assignDeep(target, source) {
  if (Array.isArray(target) && Array.isArray(source)) { target.splice(0, target.length, ...copy(source)); return; }
  if (target && typeof target === 'object' && source && typeof source === 'object') { for (const k of Object.keys(source)) { if (target[k] && typeof target[k] === 'object' && source[k] && typeof source[k] === 'object' && !Array.isArray(target[k])) assignDeep(target[k], source[k]); else if (Array.isArray(target[k]) && Array.isArray(source[k])) assignDeep(target[k], source[k]); else target[k] = copy(source[k]); } }
}
function translateMap(obj, dict) {
  const base = remember(obj);
  assignDeep(obj, base);
  if (dict) assignDeep(obj, dict);
}
function translateFollowUps(obj, dict) {
  const base = remember(obj);
  assignDeep(obj, base);
  if (!dict) return;
  for (const [kind, translations] of Object.entries(dict)) {
    if (!Array.isArray(base[kind]) || !Array.isArray(translations)) continue;
    obj[kind] = base[kind].map((choice, index) => {
      const translated = translations[index];
      return translated && typeof translated === 'object'
        ? { ...copy(choice), label: translated.label ?? choice.label, reply: translated.reply ?? choice.reply }
        : copy(choice);
    });
  }
}
function translateQuestions(list, dict) {
  const base = remember(list);
  list.forEach((q, i) => { const b = base[i]; const tr = dict?.[i]; q.them = tr?.them ?? b.them; q.options = b.options.map(o => { const to = tr?.options?.[o.id]; return to ? { ...o, label: to.label ?? o.label, goodReply: to.goodReply ?? o.goodReply, badReply: to.badReply ?? o.badReply } : { ...o }; }); });
}
function translateAsks(list, dict) {
  for (const a of list) {
    const base = remember(a); const tr = dict?.[a.id];
    a.name = tr?.name ?? base.name; a.desc = tr?.desc ?? base.desc;
    a.success = { ...copy(base.success), ...(tr?.success ? { text: tr.success.text } : {}) };
    if (base.failure) a.failure = { ...copy(base.failure), ...(tr?.failure ? { text: tr.failure.text } : {}) };
  }
}

// Apply a language to the shared data modules. Pass the modules in to avoid import cycles.
export function applyLanguage(lang, data) {
  current = dicts[lang] ? lang : 'en';
  const d = dicts[current] || {};
  if (typeof document !== 'undefined') { document.documentElement.lang = current === 'zh' ? 'zh-CN' : 'en'; document.body?.classList.toggle('lang-zh', current === 'zh'); }
  translateChoiceList(data.events, d.events);
  translateChoiceList(data.meetings, d.meetings);
  translateSimple(data.requests, d.requests, ['text']);
  translateAsks(data.asks, d.asks);
  translateSimple(data.venues, d.venues, ['category']);
  translateSimple(data.labmateRoles, d.labmateRoles, ['label']);
  translateSimple(data.labmateTraits, d.labmateTraits, ['label']);
  translateSimple([data.internshipFocus], d.focuses, ['name', 'desc']);
  translateSimple(data.visitQuestions, d.visitQuestions, ['label', 'replies']);
  translateQuestions(data.interviewQuestions, d.interviewQuestions);
  translateFollowUps(data.emailFollowUps, d.emailFollowUps);
  translateMap(data.studentFlavor, d.studentFlavor);
  translateSimple(data.schools, d.schools, ['tagline']);
  translateSimple(data.focuses, d.focuses, ['name', 'desc']);
  translateSimple(data.rebuttals, d.rebuttals, ['name', 'desc']);
  translateSimple(data.mutators, d.mutators, ['name', 'desc']);
  translateSimple(data.advisorArchetypes, d.archetypes, ['name', 'comments']);
  for (const set of Object.values(data.sprintSets)) translateSimple(set, d.sprints, ['name', 'desc']);
  translateSimple(data.emailOpeners, d.emailOpeners, ['label', 'text']);
  translateSimple(data.studentOpeners, d.studentOpeners, ['label']);
  translateMap(data.achievements, d.achievements);
  translateMap(data.backgrounds, d.backgrounds);
  translateMap(data.topics, d.topics);
  translateMap(data.personalityTitles, d.personalityTitles);
  translateMap(data.chatter, d.chatter);
  translateMap(data.memeOverrides, d.memes);
  translateMap(data.memeDefaults, d.memeDefaults);
  translateMap(data.calendarText, d.calendar);
  if (data.setCalendarLocale) data.setCalendarLocale(current);
  reindex();
}
