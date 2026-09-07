import { icon } from './icons.js';
import { t } from '../i18n/index.js';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Speech is the message. Everything else is the camera.
//
// A great deal of prose in this game opens with a line somebody actually said or wrote and then
// spends three sentences on what the room did about it. Flattened into one paragraph the two read
// at the same volume, and the sentence that matters is the one you have to hunt for. So a leading
// quoted line keeps the body voice, and the narration after it drops a size, goes italic and takes
// brackets.
//
// Deliberately narrow: this only fires when the text *opens* on a quote. A quote in the middle of a
// sentence — “They say ‘huh, weird’ and go back to their own screen” — is one voice, not two, and
// bracketing half of it would break prose that is written to be read as prose.
//
// And narrower still in Chinese, where the same shape means something else. A leading 「…」/“…” is as
// often a quoted *term* as an utterance — “饭局俱乐部”，既不是俱乐部 is one sentence about a name, and
// cutting after the closing quote leaves a fragment that opens on a comma. Chinese punctuation
// says which one it is: an utterance carries its own stop *inside* the quote and the sentence
// restarts after it, while a term leaves the sentence's punctuation outside. So for CJK text the
// quote must close on a stop (or hand over to a dash) and what follows must not continue the
// clause. Latin text keeps the original, looser rule untouched.
const OPENS_QUOTED = /^\s*[“"][^“”"]*[”"]/;
const QUOTED_RUN = /^\s*(?:[“"][^“”"]*[”"]\s*)+/;
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff]/;
const SPOKEN_END = /[。！？…—，、；：.!?]$/;
const CONTINUES = /^[，、；：。！？…”）】》,;:.!?]/;
function speaks(said, rest) {
  const inner = said.trim().replace(/^[“"]/, '').replace(/[”"]$/, '');
  return !CONTINUES.test(rest) && (SPOKEN_END.test(inner) || /^[—–]/.test(rest));
}
export function voiced(value) {
  const raw = String(value ?? '');
  if (!OPENS_QUOTED.test(raw)) return esc(raw);
  const said = raw.match(QUOTED_RUN)[0];
  const rest = raw.slice(said.length);
  const body = rest.trim();
  if (body && CJK.test(raw) && !speaks(said, body)) return esc(raw);
  const quoted = `<span class="said">${esc(said.trim())}</span>`;
  if (!body) return quoted;
  return `${quoted} <i class="narr">(${esc(body)})</i>`;
}

// The dice, shown.
//
// Every check in this game was a hidden coin flip: you picked an option, something happened, and
// the number that decided it was gone before you could look at it. That makes a system that IS
// legible feel arbitrary. This is the whole roll on one line — what it read, what it needed, the
// chance that produced, and where the draw actually landed — with the threshold marked on a bar so
// a near miss looks like a near miss.
export function rollReadout(r) {
  if (!r) return '';
  const mark = Math.max(0, Math.min(100, r.odds));
  const at = Math.max(0, Math.min(100, r.draw));
  return `<div class="roll ${r.success ? 'won' : 'lost'}" title="${esc(t('{label} {value} against {difficulty}', r))}">
    <span class="roll-eq">${esc(t('{label} {value}', r))} <i>vs</i> ${r.difficulty} <i>&rarr;</i> <b>${r.odds}%</b></span>
    <span class="roll-bar"><i class="roll-fill" style="width:${mark}%"></i><i class="roll-pin" style="left:${at}%"></i></span>
    <span class="roll-out">${esc(t('rolled {draw}', { draw: r.draw }))} · <b>${r.success ? t('passed') : t('failed')}</b></span>
  </div>`;
}

export const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
export const signed = n => (n > 0 ? '+' : '') + Math.round(n);
export const band = n => n >= 75 ? t('High') : n >= 45 ? t('Moderate') : t('Low');
export const tier = n => n >= 75 ? t('Strong') : n >= 50 ? t('Developing') : t('Needs practice');
export const dots = n => { const k = Math.round(n / 20); return '●'.repeat(k) + '○'.repeat(5 - k); };
export const disabled = c => c ? 'disabled' : '';
export function btn(text, action, { id, app, cls = '', attrs = '', disabled: off = false, title = '', type = 'button' } = {}) {
  return `<button type="${type}" class="btn ${cls}" data-action="${action}"${id !== undefined ? ` data-id="${esc(id)}"` : ''}${app ? ` data-app="${app}"` : ''}${off ? ' disabled' : ''}${title ? ` title="${esc(title)}"` : ''} ${attrs}>${text}</button>`;
}
// `band: true` colours the fill by how much is left rather than by a fixed hue, so Energy and
// Health read the same way here as the Energy meter does in the application phase: green when you
// have room, red when you do not.
export const fillBand = v => v > 60 ? 'b-ok' : v > 30 ? 'b-warn' : v > 12 ? 'b-low' : 'b-spent';
export function bar(label, value, { cls = '', max = 100, suffix = '', title = '', band = false } = {}) {
  const v = Math.max(0, Math.min(max, value));
  const pct = (v / max) * 100;
  const tone = band ? ` ${fillBand(pct)}` : '';
  return `<div class="field-row"${title ? ` title="${esc(title)}"` : ''}><span class="lbl">${esc(label)}</span><div class="progress ${cls}${tone}" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${Math.round(v)}" aria-valuetext="${Math.round(v)} ${esc(label)}"><i style="width:${pct}%"></i></div><b class="val">${Math.round(value)}${suffix}</b></div>`;
}
export const group = (title, inner, cls = '') => `<fieldset class="group ${cls}"><legend>${title}</legend>${inner}</fieldset>`;
export const titlebar = (title, ic, { controls = true, inactive = false, right = '' } = {}) => `<div class="titlebar ${inactive ? 'inactive' : ''}"><span class="tb-title">${ic ? icon(ic, 16) : ''}<span>${title}</span></span>${right ? `<span class="tb-right">${right}</span>` : ''}${controls ? `<span class="tb-controls">${btn('<i class="glyph">_</i>', 'minimize', { cls: 'tb-btn', title: t('Minimize') })}${btn('<i class="glyph">□</i>', 'maximize', { cls: 'tb-btn', title: t('Maximize') })}${btn('<i class="glyph">×</i>', 'close-window', { cls: 'tb-btn', title: t('Close') })}</span>` : ''}</div>`;
// The window menus. They looked like menus and did nothing, which in an interface that is
// pretending to be an operating system reads as a broken operating system. Each one now opens and
// every item under it does the thing it says.
export const menubar = (menus, right = '', open = null) => `<div class="menubar">${menus.map(m => typeof m === 'string'
  ? `<span>${m}</span>`
  : `<span class="mb-menu${open === m.id ? ' open' : ''}"><button data-action="menu" data-id="${m.id}">${esc(m.label)}</button>${open === m.id ? `<div class="mb-drop">${m.items.map(it => it.sep
      ? '<hr>'
      : `<button class="mb-item${it.checked ? ' checked' : ''}" data-action="${it.action}"${it.id ? ` data-id="${it.id}"` : ''}${it.app ? ` data-app="${it.app}"` : ''}${it.disabled ? ' disabled' : ''}>${esc(it.label)}${it.hint ? `<small>${esc(it.hint)}</small>` : ''}</button>`).join('')}</div>` : ''}</span>`).join('')}${right ? `<span class="mb-right">${right}</span>` : ''}</div>`;
export const statusbar = panes => `<div class="statusbar">${panes.map(p => `<span class="pane">${p}</span>`).join('')}</div>`;
export const tag = (text, tone = '') => `<span class="tag ${tone}">${esc(text)}</span>`;
export const hotkey = n => `<kbd>${n}</kbd>`;
export const note = (text, tone = '') => `<div class="note ${tone}">${icon(tone === 'warn' ? 'warn' : 'info', 16)}<span>${text}</span></div>`;
export const rows = (items, cls = '') => `<div class="listview ${cls}">${items.join('')}</div>`;

// Admission odds as a word plus a graded shade. Dark text on every shade keeps it readable.
export function oddsTag(chance) {
  // Calibrated against what the model can actually produce. The old boundaries (18/30/45/62) were
  // set for a 15–60% world that never occurs: measured across all 32 programs, 31 read "Long shot"
  // and the best achievable was ~26% with generic effort, ~42% with a perfect file — so two of the
  // five words could not be shown at all and the game's own advice to "aim across the odds range"
  // described a range that did not exist.
  const level = chance < .10 ? 0 : chance < .20 ? 1 : chance < .32 ? 2 : chance < .50 ? 3 : 4;
  const words = [t('Long shot'), t('Reach'), t('Competitive'), t('Reasonable'), t('Safer')];
  const shades = ['#f2c4c4', '#f6d9bf', '#f8ecc0', '#e3edc9', '#cfe8cf'];
  const border = ['#b45a5a', '#c08a52', '#c2ad4e', '#8fa860', '#5f9a5f'];
  return `<span class="tag odds" style="background:${shades[level]};border-color:${border[level]};color:#1d1d1d" title="${esc(t('Rough odds from your profile, fit, effort, and the school’s selectivity'))}">${'●'.repeat(level + 1)}${'○'.repeat(4 - level)} ${words[level]}<b>${Math.round(chance * 100)}%</b></span>`;
}

const pillMeta = { progress: ['Progress', 1], draft: ['Draft', 1], evidence: ['Evidence', 1], writingQuality: ['Writing', 1], reproducibility: ['Rigor', 1], novelty: ['Novelty', 1], hope: ['Hope', 1], energy: ['Energy', 1], stress: ['Stress', -1], money: ['Money', 1], confidence: ['Confidence', 1], satisfaction: ['Advisor', 1], trust: ['Trust', 1], dependency: ['Dependency', -1], conflict: ['Conflict', -1], pressure: ['Pressure', -1], academicCapital: ['Capital', 1], readiness: ['Readiness', 1], coursework: ['Coursework', 1], career: ['Career', 1], scope: ['Scope', -1], hype: ['Hype', 0], rentDelta: ['Rent', -1], commute: ['Commute', -1], bond: ['Bond', 1], labBond: ['Lab bond', 1], peerBond: ['Cohort', 1] };
const order = Object.keys(pillMeta);
// Compact, colored summary of a choice or plan: "▲ Progress ++" etc.
export function effectPills(effects = {}, extra = {}, limit = 5) {
  const all = { ...effects };
  if (extra.bond) all.bond = extra.bond; if (extra.labBond) all.labBond = extra.labBond; if (extra.peerBond) all.peerBond = extra.peerBond;
  // Most effects are points on a 0-100 stat; money is dollars. One threshold for both made $15 and
  // $2,200 read identically, so the scale follows the unit.
  const cash = { money: 1, rentDelta: 1 };
  const items = order.filter(k => all[k]).map(k => { const [label, sign] = pillMeta[k]; const v = all[k]; const good = sign === 0 ? null : (v > 0) === (sign > 0); const unit = v > 0 ? '+' : '−'; const [big, mid] = cash[k] ? [900, 200] : [15, 6]; const mag = unit.repeat(Math.abs(v) >= big ? 3 : Math.abs(v) >= mid ? 2 : 1); return `<span class="pill ${good === null ? 'neutral' : good ? 'up' : 'down'}">${v > 0 ? '▲' : '▼'} ${t(label)} ${mag}</span>`; });
  // Costs first. `order` puts gains before costs, so anything truncated was always the price —
  // which is the one thing this game must never hide. Wrapping made the clip rare; ordering makes
  // it harmless.
  const cost = [], gain = [];
  for (const it of items) (it.includes('class="pill down"') ? cost : gain).push(it);
  const pills = [...cost, ...gain].slice(0, limit).join('');
  const check = extra.check ? `<span class="pill neutral" title="${esc(t('Rolls against this'))}">🎲 ${esc(t(extra.check.skill || extra.check.stat || extra.check.advisor || 'bond'))}</span>` : '';
  const more = extra.leave ? `<span class="pill up">▲ ${t('Leave')}</span>` : '';
  const flagsPill = extra.ending ? `<span class="pill down">■ ${t('Ends the run')}</span>` : '';
  return pills + check + more + flagsPill;
}
export const gauge = (value, cls = '') => `<span class="gauge ${cls}">${Array.from({ length: 10 }, (_, i) => `<i class="${value >= (i + 1) * 10 - 5 ? 'on' : ''}"></i>`).join('')}</span>`;
export const gaugeRow = (label, value, cls = '', title = '') => `<div class="gauge-row"${title ? ` title="${esc(title)}"` : ''}><span class="lbl">${esc(label)}</span>${gauge(value, cls)}<b class="right">${Math.round(value)}</b></div>`;
export const mood = (level, label = '') => `<span class="mood ${level}"><span class="face"><i></i></span>${label ? `<span class="small">${esc(label)}</span>` : ''}</span>`;
export const statusWord = status => t(status);

// ── Show it before you read it ───────────────────────────────────────────────────────────────
// The monthly report is the screen a player sees seventy-two times a run and it was three tables
// and a wall of prose. These are the parts that can be seen rather than read: a face for how the
// month went, and a bar that visibly moves from where a number was to where it is now.

// Five expressions, code-drawn, no assets.
export function faceFor(level, size = 44) {
  const skin = '#e8c4a2';
  const brow = { awful: 'M20 24l10 4M44 24l-10 4', bad: 'M20 25l10 2M44 25l-10 2', ok: '', good: '', great: '' }[level] || '';
  const mouth = {
    awful: 'M22 44c4-6 16-6 20 0',
    bad: 'M22 43h20',
    ok: 'M22 42h20',
    good: 'M22 40c4 6 16 6 20 0',
    great: 'M20 38c5 9 19 9 24 0z',
  }[level] || 'M22 42h20';
  const eyes = level === 'awful'
    ? '<path d="M22 30l6 6M28 30l-6 6M36 30l6 6M42 30l-6 6" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    : level === 'great'
      ? '<path d="M20 32c3-4 7-4 10 0M34 32c3-4 7-4 10 0" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
      : '<circle cx="25" cy="32" r="2.6" fill="#222"/><circle cx="39" cy="32" r="2.6" fill="#222"/>';
  return `<svg class="face-svg ${level}" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="34" r="24" fill="${skin}" stroke="#00000022"/>
    ${brow ? `<path d="${brow}" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>` : ''}
    ${eyes}
    <path d="${mouth}" stroke="#222" stroke-width="2.8" fill="${level === 'great' ? '#222' : 'none'}" stroke-linecap="round"/>
  </svg>`;
}

// A bar that shows where the number was and animates to where it is.
export function deltaBar(label, before, after, { max = 100, fmt = null, invert = false } = {}) {
  const from = Math.max(0, Math.min(100, (before / max) * 100));
  const to = Math.max(0, Math.min(100, (after / max) * 100));
  const d = after - before;
  const dir = d === 0 ? 'flat' : (d > 0) !== invert ? 'up' : 'down';
  const shown = fmt ? fmt(Math.abs(d)) : Math.abs(Math.round(d));
  return `<div class="dbar ${dir}">
    <span class="dbar-l">${esc(label)}</span>
    <span class="dbar-track"><i class="dbar-ghost" style="width:${Math.min(from, to)}%"></i><i class="dbar-fill" style="--from:${from}%;--to:${to}%"></i></span>
    <b class="dbar-d">${d === 0 ? '—' : (d > 0 ? '+' : '−') + shown}</b>
  </div>`;
}
