// The whiteboard app.
//
// Owns its own DOM between renders, like the minigames do, because the marks are transient UI and
// have no business in the run's state — a save should not carry a list of doodles. What *does*
// reach the engine is the one thing that has a consequence, and only when it is earned.
import { marks, eraseLines, fullLine, flowLine, boardNote, BOARD } from '../../data/whiteboard.js';
import { esc, btn } from '../helpers.js';
import { icon } from '../icons.js';
import { t } from '../../i18n/index.js';

// Session-local. Cleared when the app closes.
let board = null;

const freshBoard = topic => ({ topic, marks: [], clicks: [], flowed: false, recent: [], said: null, seed: (Date.now() | 0) || 1 });
export const boardFull = () => !!board && board.marks.length >= BOARD.capacity;
export const boardCount = () => (board ? board.marks.length : 0);

// Own generator so a doodle never touches the run's reproducible stream. An LCG's low bits
// correlate badly at this stride — with one, LayerNorm turned up four times on a board of
// eighteen — so this is xorshift, and marks avoid the last few they used on top of that.
function rnd() {
  let x = board.seed | 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  board.seed = x | 0;
  return ((x >>> 0) % 1e6) / 1e6;
}

function pickMark(topic) {
  const pool = rnd() < .3 ? marks.loose : (marks[topic] || marks.ml);
  const recent = board.recent || (board.recent = []);
  for (let i = 0; i < 8; i++) {
    const m = pool[Math.floor(rnd() * pool.length)];
    if (!recent.includes(m)) { recent.push(m); if (recent.length > 7) recent.shift(); return m; }
  }
  return pool[Math.floor(rnd() * pool.length)];
}

export function ensureBoard(topic) {
  if (!board || board.topic !== topic) board = freshBoard(topic);
  return board;
}

export function eraseBoard() {
  if (!board) return null;
  const line = eraseLines[Math.floor(rnd() * eraseLines.length)];
  board.marks = [];
  board.clicks = [];
  board.said = line;
  paintBoard();
  return line;
}

// A click on the surface. Returns 'flow' the one time the burst is met, so main.js can hand that
// to the engine; everything else stays in here.
export function markBoard(xPct, yPct) {
  if (!board) return null;
  const now = Date.now();
  board.clicks = board.clicks.filter(c => now - c < BOARD.burstMs);
  board.clicks.push(now);
  if (board.marks.length < BOARD.capacity) {
    board.marks.push({
      text: pickMark(board.topic),
      x: Math.max(2, Math.min(92, xPct)),
      y: Math.max(4, Math.min(88, yPct)),
      rot: (rnd() * 8 - 4).toFixed(1),
      size: 12 + Math.round(rnd() * 7),
      ink: rnd() < .22 ? 'red' : rnd() < .3 ? 'green' : 'blue',
    });
  }
  // The board says its own lines rather than handing them to main.js to put on the desktop: the
  // desk host sits at z-index 6 and the board is a modal at 20, so a line raised outward from in
  // here would be read through a black overlay, which is to say not read.
  const flowed = !board.flowed && board.clicks.length >= BOARD.burstNeed;
  const out = flowed ? 'flow' : board.marks.length >= BOARD.capacity ? 'full' : null;
  if (flowed) board.flowed = true;
  if (out) board.said = flowed ? flowLine : fullLine;
  paintBoard();
  return out;
}

// Paint directly; the app re-renders around this and must not wipe the marks.
export function paintBoard() {
  const host = document.querySelector('[data-wb-surface]');
  if (!host || !board) return;
  host.innerHTML = board.marks.map((m, i) => `<span class="wb-mark ink-${m.ink}" style="left:${m.x}%;top:${m.y}%;--r:${m.rot}deg;font-size:${m.size}px;--i:${i}">${esc(t(m.text))}</span>`).join('');
  const meter = document.querySelector('[data-wb-count]');
  if (meter) meter.textContent = t('{n} of {max}', { n: board.marks.length, max: BOARD.capacity });
  // Inline display rather than a class, because styles.css has no general hidden rule and an empty
  // paragraph still reserves a line, which moves the surface every time the board speaks.
  const said = document.querySelector('[data-wb-said]');
  if (said) { said.textContent = board.said ? t(board.said) : ''; said.style.display = board.said ? '' : 'none'; }
  const surf = document.querySelector('[data-wb-surface]');
  if (surf) surf.classList.toggle('full', board.marks.length >= BOARD.capacity);
}

export function whiteboardApp(s) {
  const topic = s.player?.profile?.topic === 'theory' ? 'theory'
    : ['systems', 'robotics'].includes(s.player?.profile?.topic) ? 'systems' : 'ml';
  ensureBoard(topic);
  return `<div class="wb">
    <div class="wb-bar">
      <b>${t('Whiteboard')}</b>
      <span class="tiny muted" data-wb-count></span>
      ${btn(`${icon('trash', 14)} ${t('Erase')}`, 'wb-erase', { cls: 'small' })}
    </div>
    <div class="wb-surface" data-wb-surface data-action="wb-mark" role="img" aria-label="${esc(t('A whiteboard. Click it.'))}"></div>
    <p class="tiny wb-said" data-wb-said aria-live="polite" style="display:none"></p>
    <p class="tiny muted">${esc(t(boardNote))}</p>
  </div>`;
}

export const closeBoard = () => { board = null; };
