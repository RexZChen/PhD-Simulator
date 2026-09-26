// The presentation minigame. Runs on its own interval and paints the DOM directly, so a
// re-render never restarts it. Six sections; pick the phrase that belongs before the clock
// runs out. Good phrases build the talk, hype words cash in now and cost you in the Q&A.
import { talkSlots } from '../data/conference.js';
import { t } from '../i18n/index.js';
import { activityPaused } from './activity.js';

const SLOT_MS = 5200;
const TICK = 50;
let live = null, timer = null;

const shuffle = (arr, r) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function buildRound(i, rand) {
  const slot = talkSlots[i];
  const good = shuffle(slot.good, rand).slice(0, 1);
  const hype = shuffle(slot.hype, rand).slice(0, 1);
  const filler = shuffle(slot.filler, rand).slice(0, 2);
  return { slot, words: shuffle([...good.map(w => ({ w, kind: 'good' })), ...hype.map(w => ({ w, kind: 'hype' })), ...filler.map(w => ({ w, kind: 'filler' }))], rand) };
}

function paint() {
  if (!live) return;
  const round = live.rounds[live.index];
  const slotEl = document.querySelector('[data-tg-slot]');
  const barEl = document.querySelector('[data-tg-bar]');
  const wordsEl = document.querySelector('[data-tg-words]');
  const slideEl = document.querySelector('[data-tg-slide]');
  const scoreEl = document.querySelector('[data-tg-score]');
  if (!slotEl || !wordsEl) return;
  slotEl.textContent = `${live.index + 1}/${live.rounds.length} · ${t(round.slot.label)}`;
  const left = Math.max(0, 1 - live.elapsed / SLOT_MS);
  if (barEl && live.selfPaced) barEl.parentElement.hidden = true;
  if (barEl) { barEl.style.width = `${left * 100}%`; barEl.className = left < .25 ? 'low' : ''; }
  if (scoreEl) scoreEl.textContent = t('Talk strength: {score}', { score: live.hits });
  if (slideEl) slideEl.innerHTML = live.picked.length
    ? live.picked.map(p => `<span class="${p.kind}">${p.w}</span>`).join('')
    : `<span class="tg-empty">${t('Your slide is empty. Six sections, and whatever you put in them is the talk.')}</span>`;
  wordsEl.hidden = !!live.awaiting;
  const feedback = document.querySelector('[data-tg-feedback]');
  if (feedback) {
    feedback.hidden = !live.awaiting;
    feedback.textContent = live.awaiting ? live.feedback : '';
  }
  const next = document.querySelector('[data-tg-advance]');
  if (next) {
    next.hidden = !live.awaiting;
    next.textContent = live.index === live.rounds.length - 1 ? t('Finish presentation') : t('Continue');
  }
  if (wordsEl.dataset.round !== String(live.index)) {
    wordsEl.dataset.round = String(live.index);
    wordsEl.innerHTML = round.words.map((x, i) => `<button class="tg-word" data-tg-pick="${i}">${t(x.w)}</button>`).join('');
  }
}

function advance(picked) {
  const round = live.rounds[live.index];
  if (picked === null) { live.misses++; live.picked.push({ w: t('…'), kind: 'miss' }); }
  else {
    const x = round.words[picked];
    if (x.kind === 'good') live.hits++;
    else if (x.kind === 'hype') { live.hype++; live.hits += .5; }
    else live.misses++;
    live.picked.push({ w: t(x.w), kind: x.kind });
  }
  if (live.selfPaced) {
    const selected = live.picked.at(-1);
    const meaning = selected.kind === 'good' ? t('This phrase supports the point. It strengthens the talk.')
      : selected.kind === 'hype' ? t('This phrase adds hype. It helps the talk a little, but raises the stakes in the questions.')
      : t('This phrase is filler. It uses the section without strengthening the talk.');
    live.feedback = t('You chose “{phrase}”. {meaning}', { phrase: selected.w, meaning });
    live.awaiting = true;
    paint();
    focusTalk('[data-tg-feedback]');
    return;
  }
  nextRound();
}

function focusTalk(selector) {
  const el = document.querySelector(selector);
  if (el && !el.closest('[inert]') && !activityPaused('.talkgame')) el.focus({ preventScroll: true });
}

function nextRound() {
  live.awaiting = false; live.feedback = null;
  live.index++;
  live.elapsed = 0;
  if (live.index >= live.rounds.length) finish();
  else paint();
}

function finish() {
  const tally = { hits: Math.round(live.hits), hype: live.hype, misses: live.misses };
  const done = live.onDone;
  stopTalk();
  done(tally);
}

export function startTalk(seed, onDone, { selfPaced = false } = {}) {
  stopTalk();
  let x = (seed >>> 0) || 1;
  const rand = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
  live = { rounds: talkSlots.map((_, i) => buildRound(i, rand)), index: 0, elapsed: 0, hits: 0, hype: 0, misses: 0, picked: [], onDone, selfPaced, awaiting: false, feedback: null };
  paint();
  if (!selfPaced) timer = setInterval(() => {
    if (!live || activityPaused('.talkgame')) return;
    live.elapsed += TICK;
    if (live.elapsed >= SLOT_MS) advance(null);
    else paint();
  }, TICK);
}
export function pickWord(i) {
  if (live && !live.awaiting && !activityPaused('.talkgame') && Number.isInteger(Number(i)) && live.rounds[live.index].words[Number(i)]) advance(Number(i));
}
export function advanceTalk() {
  if (!live?.selfPaced || !live.awaiting || activityPaused('.talkgame')) return;
  nextRound();
  if (live) focusTalk('[data-tg-slot]');
}
export const repaintTalk = paint;
export function talkRunning() { return !!live; }
export function stopTalk() { if (timer) clearInterval(timer); timer = null; live = null; }

// ── The Q&A clock ─────────────────────────────────────────────────────────────
let qaTimer = null, qaLeft = 0, qaTotal = 0;
export function repaintQaTimer() {
  if (!qaTimer) return;
  const bar = document.querySelector('[data-qa-timer]');
  if (bar) { const pct = Math.max(0, qaLeft / qaTotal) * 100; bar.style.width = `${pct}%`; bar.className = pct < 30 ? 'low' : ''; }
}
export function startQaTimer(seconds, onTimeout, { selfPaced = false } = {}) {
  stopQaTimer();
  if (selfPaced) return;
  qaLeft = qaTotal = seconds * 1000;
  qaTimer = setInterval(() => {
    if (activityPaused('.trip.qa')) return;
    qaLeft -= 100;
    repaintQaTimer();
    if (qaLeft <= 0) { stopQaTimer(); onTimeout(); }
  }, 100);
}
export function stopQaTimer() { if (qaTimer) clearInterval(qaTimer); qaTimer = null; }
