import { activityPaused } from './activity.js';
// The bench minigame. Own interval, paints the DOM directly, so a re-render never restarts it.
// A needle sweeps a bar; strike while it is inside the band. Middle is a clean catch.
import { benchRounds } from '../data/bench.js';
import { t } from '../i18n/index.js';
import { esc } from './helpers.js';

const TICK = 40;
let live = null, timer = null;

export const benchRunning = () => !!live;
export const benchNeedsTiming = () => !!live && !live.selfPaced;
export const repaintBench = () => paint();

// Skill widens the band, exhaustion narrows it, and the rounds speed up as they go.
function buildRound(i, skill, energy) {
  const width = Math.max(11, Math.min(30, 15 + (skill - 50) * .16 - (energy < 35 ? 5 : 0)));
  const centre = 24 + (i * 13) % 46;
  return { round: benchRounds[i], band: [centre - width / 2, centre + width / 2], core: [centre - width / 6, centre + width / 6], speed: 0.85 + i * 0.16 };
}

function paint() {
  if (!live) return;
  const r = live.rounds[live.index];
  const stage = document.querySelector('[data-bq-stage]');
  const bar = document.querySelector('[data-bq-bar]');
  const label = document.querySelector('[data-bq-label]');
  const tally = document.querySelector('[data-bq-tally]');
  if (!bar || !stage) return;
  label.textContent = `${live.index + 1}/${live.rounds.length} · ${t(r.round.label)}`;
  stage.textContent = live.flash || (live.selfPaced && r.round.id === 'survey'
    ? t('Section 6 concerns your problem. Decide how to approach it.') : t(r.round.hint));
  stage.className = `bq-stage ${live.flashKind || ''}`;
  if (live.selfPaced) {
    stage.tabIndex = 0;
    stage.setAttribute('role', 'status');
    stage.setAttribute('aria-live', 'polite');
    bar.className = 'bq-decisions';
    bar.innerHTML = live.awaiting
      ? `<button class="btn primary" data-action="bench-next">${esc(live.index === live.rounds.length - 1 ? t('Finish reading') : t('Next paper'))}</button>`
      : `<button class="btn" data-action="bench-careful">${esc(t('Read carefully'))}<small>${esc(t('{chance}% useful reading; no breakthrough', { chance: Math.round(live.carefulChance * 100) }))}</small></button>
        <button class="btn" data-action="bench-connect">${esc(t('Connect an idea'))}<small>${esc(t('{clean}% breakthrough · {caught}% useful · {lost}% dead end', {
          clean: Math.round(live.critChance * 100), caught: Math.round((1 - live.critChance - live.missChance) * 100), lost: Math.round(live.missChance * 100),
        }))}</small></button>`;
    const strikeButton = document.querySelector('[data-action="bench-strike"]');
    if (strikeButton) strikeButton.hidden = true;
  } else {
    bar.className = 'bq-track';
    bar.innerHTML = `<i class="bq-band" style="left:${r.band[0]}%;width:${r.band[1] - r.band[0]}%"></i>`
      + `<i class="bq-core" style="left:${r.core[0]}%;width:${r.core[1] - r.core[0]}%"></i>`
      + `<i class="bq-needle" style="left:${live.pos}%"></i>`;
    const strikeButton = document.querySelector('[data-action="bench-strike"]');
    if (strikeButton) strikeButton.hidden = false;
  }
  tally.textContent = t('{c} clean · {h} caught · {m} lost', { c: live.tally.crit, h: live.tally.hit, m: live.tally.miss });
}

function step() {
  if (!live || activityPaused('.bench')) return;
  if (live.holdUntil) {
    live.holdUntil -= TICK;
    if (live.holdUntil <= 0) {
      live.holdUntil = null; live.flash = null; live.flashKind = null;
      live.index++;
      if (live.index >= live.rounds.length) return finish();
      live.pos = 0; live.dir = 1;
    }
    paint();
    return;
  }
  const r = live.rounds[live.index];
  live.pos += live.dir * r.speed;
  if (live.pos >= 100) { live.pos = 100; live.dir = -1; live.sweeps++; }
  if (live.pos <= 0) { live.pos = 0; live.dir = 1; live.sweeps++; }
  // Two full sweeps without a strike is a miss; hesitation is an answer.
  if (live.sweeps >= 2) resolve('miss');
  paint();
}

function resolve(forced) {
  const r = live.rounds[live.index];
  const p = live.pos;
  const kind = forced || (p >= r.core[0] && p <= r.core[1] ? 'crit' : p >= r.band[0] && p <= r.band[1] ? 'hit' : 'miss');
  live.tally[kind]++;
  live.flash = t(r.round[kind === 'crit' ? 'crit' : kind === 'hit' ? 'hit' : 'miss']);
  live.flashKind = kind;
  if (live.selfPaced) live.awaiting = true;
  else live.holdUntil = 1500;
  live.sweeps = 0;
  paint();
}

export function strike() {
  if (!live || live.selfPaced || live.holdUntil || activityPaused('.bench')) return;
  resolve(null);
}

// Reading advances only through explicit choices. Skill and energy still matter;
// taking more real-world time never changes the seeded result.
export function benchChoose(mode) {
  if (!live?.selfPaced || live.awaiting || !['careful', 'connect'].includes(mode) || activityPaused('.bench')) return;
  const draw = live.rand();
  const kind = mode === 'careful'
    ? (draw < live.carefulChance ? 'hit' : 'miss')
    : draw < live.critChance ? 'crit' : draw < 1 - live.missChance ? 'hit' : 'miss';
  resolve(kind);
  document.querySelector('[data-bq-stage]')?.focus();
}

export function benchNext() {
  if (!live?.selfPaced || !live.awaiting || activityPaused('.bench')) return;
  live.index++;
  if (live.index >= live.rounds.length) return finish();
  live.awaiting = false; live.flash = null; live.flashKind = null;
  paint();
  document.querySelector('[data-bq-stage]')?.focus();
}

function finish() {
  const tally = { ...live.tally };
  const done = live.onDone;
  stopBench();
  done(tally);
}

export function startBench(seed, skill, energy, onDone, { selfPaced = false } = {}) {
  stopBench();
  let x = (seed >>> 0) || 0x9e3779b9;
  const rand = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1e6) / 1e6; };
  const order = benchRounds.map((_, i) => i).sort(() => rand() - .5);
  live = {
    rounds: order.map(i => buildRound(i, skill, energy)),
    index: 0, pos: 0, dir: 1, sweeps: 0, holdUntil: null, flash: null, flashKind: null,
    tally: { crit: 0, hit: 0, miss: 0 }, onDone,
    selfPaced, rand, awaiting: false,
    carefulChance: Math.max(.6, Math.min(.95, .75 + skill * .002 - (energy < 35 ? .12 : 0))),
    critChance: Math.max(.1, Math.min(.5, .2 + skill * .003 - (energy < 35 ? .1 : 0))),
    missChance: energy < 35 ? .4 : .3,
  };
  if (!selfPaced) timer = setInterval(step, TICK);
  paint();
}

export function stopBench() { if (timer) clearInterval(timer); timer = null; live = null; }
