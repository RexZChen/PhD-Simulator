// Room 214. Own interval, paints the DOM directly, so a re-render never restarts it.
//
// Six questions, eleven seconds each, three moves. The moves are not equally good and which one is
// good depends on what is being asked — that is the whole game, and it is the thing an oral exam is
// actually testing. Composure carries between questions, so being caught out early makes the rest
// harder, which is unfair and accurate.
import { vivaQuestions, vivaMoves, vivaSilence, VIVA_SECONDS, VIVA_QUESTIONS, examiners } from '../data/viva.js';
import { t } from '../i18n/index.js';

const TICK = 100;
let live = null, timer = null;

export const vivaRunning = () => !!timer;

// Which skill the room is reading, by what it is asking about.
const SKILL = { own: 'research', method: 'math', field: 'research', motivation: 'communication' };

// Answering is the only move that rolls. The other two are decided by what is being asked, and
// that is deliberate: the risk lives in exactly one place, and the other two moves are a test of
// whether you can read the room rather than a second dice throw. It also means the written outcome
// can never contradict the mechanic.
//
//   concede   safe on the field, the method and the motivation; never on your own chapter.
//   redirect  works when the question is not about your work or your numbers.
const CONCEDE_OK = { own: false, method: true, field: true, motivation: true };
const REDIRECT_OK = { own: false, method: false, field: true, motivation: true };
const ANSWER_FIT = { own: 6, method: 0, field: -6, motivation: 4 };

// Skill against the question, nudged by how the last few went. The spiral is the point.
function answerOdds(q, skill, composure) {
  const margin = skill + ANSWER_FIT[q.domain] + (composure - 60) * .35 - q.hard;
  return Math.max(.1, Math.min(.93, .5 + margin / 90));
}

function paint() {
  if (!live) return;
  const root = document.querySelector('[data-vv]');
  if (!root) return;
  const q = live.questions[live.index];
  const set = (sel, fn) => { const el = root.querySelector(sel); if (el) fn(el); };
  set('[data-vv-count]', el => { el.textContent = t('Question {n} of {total}', { n: live.index + 1, total: live.questions.length }); });
  set('[data-vv-who]', el => { el.textContent = t(examiners[q.who].label); });
  set('[data-vv-note]', el => { el.textContent = t(examiners[q.who].note); });
  set('[data-vv-q]', el => { el.textContent = t(q.q); });
  set('[data-vv-composure]', el => {
    el.style.width = `${Math.max(0, Math.min(100, live.composure))}%`;
    el.className = live.composure > 60 ? 'vv-fill b-ok' : live.composure > 32 ? 'vv-fill b-warn' : 'vv-fill b-spent';
  });
  set('[data-vv-clock]', el => {
    const left = Math.max(0, live.deadline - live.elapsed);
    el.style.width = `${(left / (VIVA_SECONDS * 1000)) * 100}%`;
    el.className = left < 3500 ? 'vv-fill b-spent' : left < 6500 ? 'vv-fill b-warn' : 'vv-fill b-ok';
  });
  set('[data-vv-tally]', el => {
    el.textContent = t('{l} landed · {c} conceded · {x} caught', { l: live.tally.land, c: live.tally.concede, x: live.tally.caught + live.tally.silent });
  });
  const flash = root.querySelector('[data-vv-flash]');
  if (flash) {
    flash.textContent = live.flash || '';
    flash.className = `vv-flash ${live.flash ? live.flashKind : 'hidden'}`;
  }
  root.classList.toggle('resolving', !!live.holdUntil);
  for (const b of root.querySelectorAll('[data-action="viva-move"]')) b.disabled = !!live.holdUntil;
}

function step() {
  if (!live) return;
  live.elapsed += TICK;
  if (live.holdUntil) {
    if (live.elapsed >= live.holdUntil) advance();
    paint();
    return;
  }
  if (live.elapsed >= live.deadline) resolve(null);
  paint();
}

function advance() {
  live.index++;
  if (live.index >= live.questions.length) return finish();
  live.holdUntil = null; live.flash = null; live.flashKind = null;
  live.elapsed = 0;
  live.deadline = VIVA_SECONDS * 1000;
  paint();
}

// A move, or null for the silence.
function resolve(move) {
  const q = live.questions[live.index];
  let kind, line;
  if (!move) {
    kind = 'silent';
    line = t(vivaSilence[live.index % vivaSilence.length]);
    live.composure -= 22;
  } else if (move === 'concede') {
    const ok = CONCEDE_OK[q.domain];
    kind = ok ? 'concede' : 'caught';
    line = t(q.concede);
    live.composure += ok ? 5 : -18;
  } else if (move === 'redirect') {
    const ok = REDIRECT_OK[q.domain];
    kind = ok ? 'land' : 'caught';
    line = t(q.redirect);
    live.composure += ok ? 7 : -14;
  } else {
    const ok = live.rand() < answerOdds(q, live.skills[SKILL[q.domain]] ?? 50, live.composure);
    kind = ok ? 'land' : 'caught';
    line = t(ok ? q.land : q.caught);
    live.composure += ok ? 12 : -20;
  }
  live.composure = Math.max(0, Math.min(100, live.composure));
  live.tally[kind]++;
  live.flash = line;
  live.flashKind = kind === 'land' ? 'good' : kind === 'concede' ? 'ok' : 'bad';
  live.holdUntil = live.elapsed + 2600;
  paint();
}

export function vivaMove(id) {
  if (!live || live.holdUntil || !vivaMoves[id]) return;
  resolve(id);
}

function finish() {
  const tally = { ...live.tally, composure: Math.round(live.composure) };
  const done = live.onDone;
  stopViva();
  done(tally);
}

export function startViva(seed, kind, skills, onDone) {
  stopViva();
  let x = (seed >>> 0) || 1;
  const rand = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1e6) / 1e6; };
  const pool = [...(vivaQuestions[kind] || vivaQuestions.prelim)];
  // Shuffle, then keep six. The reader always gets one in, because in a real room they always do.
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const own = pool.find(q => q.domain === 'own');
  const rest = pool.filter(q => q !== own).slice(0, VIVA_QUESTIONS - (own ? 1 : 0));
  const questions = own ? [own, ...rest] : rest;
  for (let i = questions.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [questions[i], questions[j]] = [questions[j], questions[i]]; }
  live = {
    questions, index: 0, elapsed: 0, deadline: VIVA_SECONDS * 1000, holdUntil: null,
    flash: null, flashKind: null, composure: 62, skills, rand, onDone,
    tally: { land: 0, concede: 0, caught: 0, silent: 0 },
  };
  timer = setInterval(step, TICK);
  paint();
}

export function stopViva() { if (timer) clearInterval(timer); timer = null; live = null; }
