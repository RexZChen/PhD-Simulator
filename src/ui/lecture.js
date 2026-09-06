// The lecture minigame. You are in a required course and you have a deadline. The lecturer
// looks up on their own schedule. Work while they are writing; stop before they turn round.
import { t } from '../i18n/index.js';

const TICK = 60;
const TOTAL = 26000;      // about twenty-six seconds of lecture
const GRACE = 700;        // how long you have to shut the laptop
let live = null, timer = null;

function nextGlance(elapsed, rand) {
  return elapsed + 1400 + rand() * 2600;
}

function paint() {
  if (!live) return;
  const root = document.querySelector('[data-lec]');
  if (!root) return;
  const bar = root.querySelector('[data-lec-time]');
  const eye = root.querySelector('[data-lec-eye]');
  const board = root.querySelector('[data-lec-board]');
  const meter = root.querySelector('[data-lec-work]');
  const caught = root.querySelector('[data-lec-caught]');
  const hint = root.querySelector('[data-lec-hint]');
  if (bar) bar.style.width = `${Math.max(0, 1 - live.elapsed / TOTAL) * 100}%`;
  if (meter) meter.style.width = `${Math.min(100, (live.worked / (TOTAL * .62)) * 100)}%`;
  if (caught) caught.textContent = '✕'.repeat(live.caught) + '·'.repeat(Math.max(0, 3 - live.caught));
  root.classList.toggle('looking', live.looking);
  root.classList.toggle('working', live.working);
  if (eye) eye.textContent = live.looking ? '👁' : '✎';
  if (board) board.textContent = live.looking ? t('They are looking at the room.') : t('They are writing on the board.');
  if (hint) hint.textContent = live.note || (live.working ? t('Working. Watch the front of the room.') : t('Press SPACE, or click, to work on your own thing.'));
}

function tick() {
  if (!live) return;
  live.elapsed += TICK;
  if (live.elapsed >= live.nextGlance) {
    live.looking = true;
    live.glanceEnd = live.elapsed + 900 + live.rand() * 1200;
    live.nextGlance = Infinity;
    live.caughtAt = live.elapsed + GRACE;
  }
  if (live.looking && live.elapsed >= live.glanceEnd) {
    live.looking = false;
    live.nextGlance = nextGlance(live.elapsed, live.rand);
    live.caughtAt = null;
  }
  if (live.working) {
    if (!live.looking) live.worked += TICK;
    else if (live.caughtAt && live.elapsed > live.caughtAt) {
      live.caught++;
      live.working = false;
      live.caughtAt = null;
      live.note = t('“Is there something you would like to share with us?” There is not.');
      if (live.caught >= 3) return finish();
    }
  } else if (!live.looking) live.attention += TICK;
  if (live.elapsed >= TOTAL) return finish();
  paint();
}

function finish() {
  const result = { worked: Math.round(live.worked / 1000), attention: Math.round(live.attention / 1000), caught: live.caught };
  const done = live.onDone;
  stopLecture();
  done(result);
}

export function startLecture(seed, onDone) {
  stopLecture();
  let x = (seed >>> 0) || 7;
  const rand = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
  live = { elapsed: 0, worked: 0, attention: 0, caught: 0, working: false, looking: false, nextGlance: 1800 + rand() * 1800, glanceEnd: 0, caughtAt: null, note: null, rand, onDone };
  paint();
  timer = setInterval(tick, TICK);
}
export function toggleWork() { if (live) { live.working = !live.working; live.note = null; paint(); } }
export function lectureRunning() { return !!live; }
export function stopLecture() { if (timer) clearInterval(timer); timer = null; live = null; }
