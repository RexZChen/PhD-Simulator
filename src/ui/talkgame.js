// The presentation minigame. Runs on its own interval and paints the DOM directly, so a
// re-render never restarts it. Six sections; pick the phrase that belongs before the clock
// runs out. Good phrases build the talk, hype words cash in now and cost you in the Q&A.
import { talkSlots } from '../data/conference.js';
import { t } from '../i18n/index.js';

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
  if (barEl) { barEl.style.width = `${left * 100}%`; barEl.className = left < .25 ? 'low' : ''; }
  if (scoreEl) scoreEl.textContent = String(live.hits);
  if (slideEl) slideEl.innerHTML = live.picked.length
    ? live.picked.map(p => `<span class="${p.kind}">${p.w}</span>`).join('')
    : `<span class="tg-empty">${t('Your slide is empty. Six sections, and whatever you put in them is the talk.')}</span>`;
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

export function startTalk(seed, onDone) {
  stopTalk();
  let x = (seed >>> 0) || 1;
  const rand = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
  live = { rounds: talkSlots.map((_, i) => buildRound(i, rand)), index: 0, elapsed: 0, hits: 0, hype: 0, misses: 0, picked: [], onDone };
  paint();
  timer = setInterval(() => {
    if (!live) return;
    live.elapsed += TICK;
    if (live.elapsed >= SLOT_MS) advance(null);
    else paint();
  }, TICK);
}
export function pickWord(i) { if (live) advance(Number(i)); }
export function talkRunning() { return !!live; }
export function stopTalk() { if (timer) clearInterval(timer); timer = null; live = null; }

// ── The Q&A clock ─────────────────────────────────────────────────────────────
let qaTimer = null, qaLeft = 0;
export function startQaTimer(seconds, onTimeout) {
  stopQaTimer();
  qaLeft = seconds * 1000;
  qaTimer = setInterval(() => {
    qaLeft -= 100;
    const bar = document.querySelector('[data-qa-timer]');
    if (bar) { const pct = Math.max(0, qaLeft / (seconds * 1000)) * 100; bar.style.width = `${pct}%`; bar.className = pct < 30 ? 'low' : ''; }
    if (qaLeft <= 0) { stopQaTimer(); onTimeout(); }
  }, 100);
}
export function stopQaTimer() { if (qaTimer) clearInterval(qaTimer); qaTimer = null; }
