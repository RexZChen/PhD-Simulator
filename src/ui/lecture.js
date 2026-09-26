// The lecture minigame. You are in a required course and you have a deadline. The lecturer
// looks up on their own schedule. Work while they are writing; stop before they turn round.
import { t } from '../i18n/index.js';
import { activityPaused } from './activity.js';

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
  if (hint) hint.hidden = live.selfPaced;
  if (live.selfPaced) {
    root.querySelector('[data-action="lecture-toggle"]')?.setAttribute('hidden', '');
    let choices = root.querySelector('[data-lec-choices]');
    if (!choices) { choices = document.createElement('div'); choices.dataset.lecChoices = ''; choices.className = 'self-paced-choices'; root.append(choices); }
    const markup = live.review
      ? `<button class="btn" data-action="lecture-choice" data-id="next">${t('Continue')}</button>`
      : `<button class="btn" data-action="lecture-choice" data-id="listen">${t('Listen to the lecture')}</button><button class="btn" data-action="lecture-choice" data-id="work">${t('Work on the paper')}</button>`;
    if (choices.dataset.view !== markup) { choices.innerHTML = markup; choices.dataset.view = markup; }
  }
  let status = root.querySelector('[data-lec-status]');
  if (!status) {
    status = document.createElement('p');
    status.dataset.lecStatus = '';
    status.tabIndex = 0;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-atomic', 'true');
    const choices = root.querySelector('[data-lec-choices]');
    if (choices) root.insertBefore(status, choices); else root.append(status);
  }
  const cue = live.looking ? t('They are looking at the room.') : t('They are writing on the board.');
  const statusText = [live.selfPaced ? t('Part {n} of 8. Listening builds coursework; writing builds the paper. No timer.', { n: live.part + 1 }) : '', cue, live.note || ''].filter(Boolean).join(' ');
  // Live announcements follow choices and changes in the room, never the ticking clock.
  if (status.textContent !== statusText) status.textContent = statusText;
  if (bar) bar.style.width = `${Math.max(0, 1 - live.elapsed / TOTAL) * 100}%`;
  if (meter) meter.style.width = `${Math.min(100, (live.worked / (TOTAL * .62)) * 100)}%`;
  if (caught) caught.textContent = '✕'.repeat(live.caught) + '·'.repeat(Math.max(0, 3 - live.caught));
  root.classList.toggle('looking', live.looking);
  root.classList.toggle('working', live.working);
  if (eye) eye.textContent = live.looking ? '👁' : '✎';
  if (board) board.textContent = live.looking ? t('They are looking at the room.') : t('They are writing on the board.');
  if (hint) hint.textContent = live.note || (live.selfPaced ? t('Part {n} of 8. Listening builds coursework; writing builds the paper. No timer.', { n: live.part + 1 }) : live.working ? t('Working. Watch the front of the room.') : t('Press SPACE, or click, to work on your own thing.'));
}

function tick() {
  if (!live || activityPaused('[data-lec]')) return;
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

export function startLecture(seed, onDone, { selfPaced = false } = {}) {
  stopLecture();
  let x = (seed >>> 0) || 7;
  const rand = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
  live = { elapsed: 0, worked: 0, attention: 0, caught: 0, working: false, looking: false, nextGlance: 1800 + rand() * 1800, glanceEnd: 0, caughtAt: null, note: null, rand, onDone, selfPaced, part: 0, review: false };
  paint();
  if (!selfPaced) timer = setInterval(tick, TICK);
}
export function lectureChoice(choice) {
  if (!live?.selfPaced || activityPaused('[data-lec]')) return;
  if (choice === 'next' && live.review) {
    live.part++;
    if (live.part >= 8 || live.caught >= 3) return finish();
    live.review = false; live.note = null; live.working = false;
    live.looking = live.rand() < .35;
  } else if (!live.review && ['listen', 'work'].includes(choice)) {
    live.elapsed += TOTAL / 8;
    live.working = choice === 'work';
    if (choice === 'listen') { live.attention += TOTAL / 8; live.note = t('You take notes. The course makes a little more sense.'); }
    else if (live.looking) { live.caught++; live.note = t('They see the draft on your screen. That costs you.'); }
    else { live.worked += TOTAL / 8; live.note = t('A paragraph gets written while they fill the board.'); }
    live.review = true;
  } else return;
  paint();
  document.querySelector('[data-lec-status]')?.focus();
}
export const repaintLecture = paint;
export function toggleWork() { if (live && !live.selfPaced && !activityPaused('[data-lec]')) { live.working = !live.working; live.note = null; paint(); } }
export function lectureRunning() { return !!live; }
export function stopLecture() { if (timer) clearInterval(timer); timer = null; live = null; }
