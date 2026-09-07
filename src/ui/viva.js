// Room 214, for the whole hour.
//
// This used to be six questions and nothing else, which made an oral exam look like a quiz. It is
// not a quiz; it is a scheduled block of time with a shape, and the shape is what people remember
// twenty years later. So the room now runs the timetable in src/data/exams.js: you present, you are
// questioned, the room is cleared if this is a defense, you are questioned properly, and then you
// stand in a corridor while four people decide, out loud, without you.
//
// One interval, one `live` object, painting the DOM directly, so a re-render never restarts it —
// the same contract as the other real-time rooms.
import { vivaQuestions, vivaMoves, vivaSilence, VIVA_SECONDS, examiners } from '../data/viva.js';
import { exams, decks, talkLines, badCop, corridor, EXAM_TICK } from '../data/exams.js';
import { t } from '../i18n/index.js';
import { voiced } from './helpers.js';

const TICK = EXAM_TICK;
let live = null, timer = null;

export const vivaRunning = () => !!timer;
export const examPhase = () => (live ? live.phase : null);
export const examLive = () => live;

const SKILL = { own: 'research', method: 'math', field: 'research', motivation: 'communication' };
const CONCEDE_OK = { own: false, method: true, field: true, motivation: true };
const REDIRECT_OK = { own: false, method: false, field: true, motivation: true };
const ANSWER_FIT = { own: 6, method: 0, field: -6, motivation: 4 };

// The talk is a budget, not a race. Holding is the only thing that costs extra, which makes the
// question "which slides are worth ninety seconds" — the actual skill being modelled.
const HOLD_COST = 1800;
const INTERRUPT_WINDOW = 4200;
const INTERRUPT_COST = 2500;

function answerOdds(q, skill, composure) {
  const margin = skill + ANSWER_FIT[q.domain] + (composure - 60) * .35 - q.hard;
  return Math.max(.1, Math.min(.93, .5 + margin / 90));
}

// A harsh room is harsher: the same answer, judged on a worse curve. `nice` is the open segment of
// a defense, where the committee is visibly kind to you in front of an audience and means it.
const TONE = { nice: .1, badcop: -.05, harsh: -.1 };

function seg() { return live.plan[live.segIndex]; }

// ── painting ──────────────────────────────────────────────────────────────────────────────────
function paint() {
  if (!live) return;
  const root = document.querySelector('[data-vv]');
  if (!root) return;
  const set = (sel, fn) => { const el = root.querySelector(sel); if (el) fn(el); };
  root.dataset.phase = live.phase;
  const s = seg();
  set('[data-vv-seg]', el => { el.textContent = t('{label} · {mins} min', { label: t(s.label), mins: s.minutes }); });
  set('[data-vv-segsub]', el => { el.textContent = t(s.sub); });
  set('[data-vv-progress]', el => {
    el.innerHTML = live.plan.map((x, i) => `<i class="ex-pip${i < live.segIndex ? ' done' : i === live.segIndex ? ' now' : ''}" style="flex:${Math.max(1, x.minutes || 5)}"></i>`).join('');
  });
  set('[data-vv-composure]', el => {
    el.style.width = `${Math.max(0, Math.min(100, live.composure))}%`;
    el.className = live.composure > 60 ? 'vv-fill b-ok' : live.composure > 32 ? 'vv-fill b-warn' : 'vv-fill b-spent';
  });
  const clockPct = live.deadline ? Math.max(0, live.deadline - live.elapsed) / live.deadline : 1;
  set('[data-vv-clock]', el => {
    el.style.width = `${clockPct * 100}%`;
    el.className = clockPct < .2 ? 'vv-fill b-spent' : clockPct < .45 ? 'vv-fill b-warn' : 'vv-fill b-ok';
  });
  const flash = root.querySelector('[data-vv-flash]');
  if (flash) { flash.innerHTML = live.flash ? voiced(live.flash) : ''; flash.className = `vv-flash ${live.flash ? live.flashKind : 'hidden'}`; }

  if (live.phase === 'talk') paintTalk(root, set);
  if (live.phase === 'qa') paintQa(root, set);
  if (live.phase === 'corridor') paintCorridor(root, set);
  if (live.phase === 'clear' || live.phase === 'intro') paintClear(root, set);
  root.classList.toggle('resolving', !!live.holdUntil);
  for (const b of root.querySelectorAll('[data-action="viva-move"],[data-action="exam-talk"],[data-action="exam-interrupt"]')) b.disabled = !!live.holdUntil;
  // Panels for the other phases are display:none, but their buttons were still enabled and still
  // carried data-hotkey 1..3 — and the hotkey handler takes the first match in the document, so
  // the number keys during the questions were pressing the hidden talk buttons.
  for (const panel of root.querySelectorAll('.ex-only')) {
    const off = !panel.classList.contains(`ex-${live.phase}`);
    for (const b of panel.querySelectorAll('button')) if (off) b.disabled = true;
  }
}

function paintTalk(root, set) {
  const slide = live.deck[live.slideIndex];
  set('[data-vv-who]', el => { el.textContent = t('Slide {n} of {total}', { n: live.slideIndex + 1, total: live.deck.length }); });
  set('[data-vv-note]', el => { el.textContent = t('{n} of the ones that matter, so far', { n: live.covered }); });
  set('[data-vv-slide-title]', el => { el.textContent = slide ? t(slide.title) : ''; });
  set('[data-vv-slide-line]', el => { el.textContent = slide ? t(slide.line) : ''; });
  const stage = root.querySelector('[data-vv-slidebox]');
  if (stage) stage.className = `ex-slide w-${slide ? slide.w : 'core'}`;
  const int = root.querySelector('[data-vv-interrupt]');
  if (int) {
    int.innerHTML = live.interrupt ? voiced(t(live.interrupt)) : '';
    int.className = `ex-interrupt${live.interrupt ? '' : ' hidden'}`;
  }
  const btn = root.querySelector('[data-action="exam-interrupt"]');
  if (btn) btn.classList.toggle('hidden', !live.interrupt);
}

function paintQa(root, set) {
  const q = live.questions[live.index];
  if (!q) return;
  set('[data-vv-who]', el => { el.textContent = t(examiners[q.who].label) + (live.badCopWho === q.who ? t(' — the difficult one') : ''); });
  set('[data-vv-note]', el => { el.textContent = t(examiners[q.who].note); });
  set('[data-vv-q]', el => { el.textContent = t(q.q); });
  set('[data-vv-count]', el => { el.textContent = t('Question {n} of {total}', { n: live.index + 1, total: live.questions.length }); });
  set('[data-vv-tally]', el => {
    el.textContent = t('{l} landed · {c} conceded · {x} caught', { l: live.tally.land, c: live.tally.concede, x: live.tally.caught + live.tally.silent });
  });
}

function paintCorridor(root, set) {
  set('[data-vv-who]', el => { el.textContent = t('The corridor'); });
  set('[data-vv-note]', el => { el.textContent = t('One chair. The corridor has been used this way before.'); });
  const box = root.querySelector('[data-vv-things]');
  if (box && box.dataset.built !== '1') {
    box.dataset.built = '1';
    box.innerHTML = corridor.things.map(x => `<button class="btn small ex-thing" data-action="exam-corridor" data-id="${x.id}">${t(x.label)}</button>`).join('');
  }
  if (box) for (const b of box.querySelectorAll('button')) b.disabled = live.touched.includes(b.dataset.id);
}

function paintClear(root, set) {
  set('[data-vv-who]', el => { el.textContent = t(seg().label); });
  set('[data-vv-note]', el => { el.textContent = ''; });
}

// ── the clock ─────────────────────────────────────────────────────────────────────────────────
function step() {
  if (!live) return;
  live.elapsed += TICK;
  if (live.holdUntil) { if (live.elapsed >= live.holdUntil) afterQuestion(); paint(); return; }

  if (live.phase === 'talk') {
    if (live.interrupt && live.elapsed >= live.interruptUntil) missInterrupt();
    if (live.elapsed >= live.deadline) endTalk('cut');
  } else if (live.phase === 'qa') {
    if (live.elapsed >= live.deadline) answer(null);
  } else if (['corridor', 'clear', 'intro'].includes(live.phase)) {
    if (live.elapsed >= live.deadline) nextSegment();
  }
  paint();
}

// ── the talk ──────────────────────────────────────────────────────────────────────────────────
function raiseInterrupt() {
  live.interrupt = badCop.interrupts[live.slideIndex % badCop.interrupts.length];
  live.interruptUntil = live.elapsed + INTERRUPT_WINDOW;
}

function missInterrupt() {
  live.interrupt = null; live.interruptDone = true; live.badCop = 'ignored';
  live.composure = Math.max(0, live.composure - 12);
  say(badCop.ignored, 'bad');
}

export function examInterrupt() {
  if (!live || live.phase !== 'talk' || live.holdUntil || !live.interrupt) return;
  live.interrupt = null; live.interruptDone = true; live.badCop = 'handled';
  live.elapsed += INTERRUPT_COST;                       // it costs you two minutes of the talk
  live.composure = Math.min(100, live.composure + 8);
  say(badCop.handled, 'good');
  paint();
}

export function examTalk(move) {
  if (!live || live.phase !== 'talk' || live.holdUntil) return;
  const slide = live.deck[live.slideIndex];
  if (!slide) return;
  if (move === 'hold') {
    live.elapsed += HOLD_COST;
    if (slide.w === 'core') { live.covered++; live.composure = Math.min(100, live.composure + 4); say(talkLines.holdCore, 'good'); }
    else if (slide.w === 'trap') { live.trapSeen = true; live.composure = Math.max(0, live.composure - 6); say(talkLines.holdTrap, 'bad'); }
    else { live.wasted++; say(talkLines.holdFiller, 'ok'); }
  } else {
    if (slide.w === 'core') { live.skipped++; say(talkLines.skipCore, 'ok'); }
    else if (slide.w === 'trap') { live.trapSkipped = true; say(talkLines.skipTrap, 'ok'); }
    else say(talkLines.skipFiller, 'ok');
  }
  live.slideIndex++;
  if (!live.interruptDone && !live.interrupt && live.slideIndex >= live.interruptSlide && live.slideIndex < live.deck.length) { raiseInterrupt(); paint(); return; }
  if (live.slideIndex >= live.deck.length) endTalk(live.elapsed < live.deadline * .7 ? 'rushed' : 'clean');
  paint();
}

function endTalk(how) {
  if (live.talkHow) return;                       // never re-decide a verdict already reached
  if (live.interrupt) { live.interrupt = null; live.interruptDone = true; live.badCop = 'ignored'; live.composure = Math.max(0, live.composure - 12); }
  live.talkHow = how;
  if (how === 'cut') {
    // Everything you never reached counts against you, which is what running long actually costs.
    for (let i = live.slideIndex; i < live.deck.length; i++) if (live.deck[i].w === 'core') live.skipped++;
    live.composure = Math.max(0, live.composure - 8);
  }
  say(talkLines[how] || talkLines.clean, how === 'cut' ? 'bad' : how === 'rushed' ? 'ok' : 'good');
  live.pendingSegment = true;
  live.holdUntil = live.elapsed + 2400;
}

// ── the questions ─────────────────────────────────────────────────────────────────────────────
function say(line, kind) { live.flash = t(line); live.flashKind = kind; }

function answer(move) {
  const q = live.questions[live.index];
  const tone = TONE[seg().tone] ?? 0;
  let kind, line;
  if (!move) {
    kind = 'silent'; line = t(vivaSilence[live.index % vivaSilence.length]); live.composure -= 22;
  } else if (move === 'concede') {
    const ok = CONCEDE_OK[q.domain];
    kind = ok ? 'concede' : 'caught'; line = t(q.concede); live.composure += ok ? 5 : -18;
  } else if (move === 'redirect') {
    const ok = REDIRECT_OK[q.domain];
    kind = ok ? 'land' : 'caught'; line = t(q.redirect); live.composure += ok ? 7 : -14;
  } else {
    const ok = live.rand() < answerOdds(q, live.skills[SKILL[q.domain]] ?? 50, live.composure) + tone;
    kind = ok ? 'land' : 'caught'; line = t(ok ? q.land : q.caught); live.composure += ok ? 12 : -20;
  }
  live.composure = Math.max(0, Math.min(100, live.composure));
  live.tally[kind]++;
  live.flash = line;
  live.flashKind = kind === 'land' ? 'good' : kind === 'concede' ? 'ok' : 'bad';
  live.holdUntil = live.elapsed + 2600;
  paint();
}

export function vivaMove(id) { if (live && live.phase === 'qa' && !live.holdUntil && vivaMoves[id]) answer(id); }

function afterQuestion() {
  if (live.pendingSegment) { live.pendingSegment = false; nextSegment(); return; }
  live.index++;
  if (live.index >= live.questions.length) { nextSegment(); return; }
  live.holdUntil = null; live.flash = null; live.flashKind = null;
  live.elapsed = 0; live.deadline = VIVA_SECONDS * 1000;
  paint();
}

// ── the corridor ──────────────────────────────────────────────────────────────────────────────
export function examCorridor(id) {
  if (!live || live.phase !== 'corridor' || live.touched.includes(id)) return;
  const thing = corridor.things.find(x => x.id === id);
  if (!thing) return;
  live.touched.push(id);
  say(thing.line, id === 'nothing' ? 'good' : 'ok');
  if (id === 'nothing') live.composure = Math.min(100, live.composure + 6);
  paint();
}

// ── the timetable ─────────────────────────────────────────────────────────────────────────────
function nextSegment() {
  live.segIndex++;
  if (live.segIndex >= live.plan.length) return finish();
  live.holdUntil = null; live.flash = null; live.flashKind = null;
  live.elapsed = 0;
  const s = seg();
  live.phase = s.kind;
  if (s.kind === 'talk') startTalk(s);
  else if (s.kind === 'qa') startQa(s);
  else { live.deadline = (s.seconds || 10) * 1000; if (s.kind === 'corridor') say(corridor.intro, 'ok'); }
  const box = document.querySelector('[data-vv-things]');
  if (box) box.dataset.built = '';
  paint();
}

function startTalk(s) {
  live.deck = decks[s.deck] || decks.prelim;
  live.slideIndex = 0;
  live.deadline = (s.seconds || 28) * 1000;
  live.interruptSlide = 3 + Math.floor(live.rand() * 3);
  live.interrupt = null; live.interruptDone = false;
}

function startQa(s) {
  // A defense has two question segments and they must not be the same questions. The room
  // remembers what it has already asked; without this the closed session re-asked all three of
  // the open-floor questions word for word, with the same answer prose, and counted them twice.
  const bank = vivaQuestions[live.kind] || vivaQuestions.prelim;
  let pool = bank.filter(q => !live.asked.includes(q.id));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(live.rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  // The one who read it always gets a question about your own work in, because in a real room
  // they always do. An ignored interruption buys you one extra, which is exactly how that works.
  const want = (s.questions || 4) + (live.badCop === 'ignored' && s.tone === 'harsh' ? 1 : 0);
  // If a future content trim leaves too few, take the shortfall from the bank rather than
  // silently running a shorter segment — but never prefer a repeat over something unasked.
  if (pool.length < want) pool = [...pool, ...bank.filter(q => !pool.includes(q))].slice(0, want);
  const own = pool.find(q => q.domain === 'own');
  const rest = pool.filter(q => q !== own).slice(0, Math.max(0, want - (own ? 1 : 0)));
  const qs = own ? [own, ...rest] : rest;
  live.asked.push(...qs.map(q => q.id));
  for (let i = qs.length - 1; i > 0; i--) { const j = Math.floor(live.rand() * (i + 1)); [qs[i], qs[j]] = [qs[j], qs[i]]; }
  live.questions = qs;
  live.index = 0;
  live.deadline = VIVA_SECONDS * 1000;
  if (s.tone === 'badcop' && qs.length) live.badCopWho = qs[Math.floor(live.rand() * qs.length)].who;
}

function finish() {
  const out = {
    ...live.tally,
    composure: Math.round(live.composure),
    talk: { covered: live.covered, skipped: live.skipped, wasted: live.wasted, how: live.talkHow, trapSeen: !!live.trapSeen },
    badCop: live.badCop,
    // The chair, or nothing at all. Awarding this for pure inaction gave it to anyone who walked
    // away from the keyboard and withheld it from the player who pressed the button whose text is
    // quoted in the achievement. Looking at your phone first still does not count.
    stillness: live.touched.length === 0 || (live.touched.length === 1 && live.touched[0] === 'nothing')
      ? 'total' : live.touched.includes('nothing') ? 'chair' : null,
  };
  const done = live.onDone;
  stopViva();
  done(out);
}

export function startViva(seed, kind, skills, onDone) {
  stopViva();
  let x = (seed >>> 0) || 1;
  const rand = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1e6) / 1e6; };
  const exam = exams[kind] || exams.prelim;
  live = {
    kind, plan: exam.segments, segIndex: -1, phase: 'talk',
    elapsed: 0, deadline: 1, holdUntil: null, flash: null, flashKind: null,
    composure: 62, skills, rand, onDone,
    tally: { land: 0, concede: 0, caught: 0, silent: 0 },
    deck: [], slideIndex: 0, covered: 0, skipped: 0, wasted: 0, talkHow: null,
    interrupt: null, interruptSlide: 3, interruptUntil: 0, interruptDone: false, badCop: null, badCopWho: null,
    questions: [], index: 0, touched: [], asked: [],
  };
  timer = setInterval(step, TICK);
  nextSegment();
}

export function stopViva() { if (timer) clearInterval(timer); timer = null; live = null; }
