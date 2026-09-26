// 04:12. Own interval, paints the DOM directly, so a re-render never restarts it.
//
// Four stages, one shared countdown — the reservation, which does not reset between stages and does
// not care that you are close. Clicking the wrong line costs seconds, so the punishment for reading
// the last line first is exactly the punishment it is in real life.
import { clusterStages, CLUSTER_SECONDS, CLUSTER_PENALTY, clusterMiss } from '../data/cluster.js';
import { t } from '../i18n/index.js';
import { activityPaused } from './activity.js';

const TICK = 100;
let live = null, timer = null;

export const clusterRunning = () => !!live;
export const repaintCluster = () => paint();

function paint() {
  if (!live) return;
  const root = document.querySelector('[data-cl]');
  if (!root) return;
  const st = live.stages[live.index];
  const set = (sel, fn) => { const el = root.querySelector(sel); if (el) fn(el); };
  set('[data-cl-title]', el => { el.textContent = t(st.stage.title); el.tabIndex = 0; });
  set('[data-cl-hint]', el => { el.textContent = t(st.stage.hint); });
  set('[data-cl-count]', el => { el.textContent = t('Job {n} of {total}', { n: live.index + 1, total: live.stages.length }); });
  set('[data-cl-clock]', el => {
    const pct = Math.max(0, live.left / (CLUSTER_SECONDS * 1000)) * 100;
    el.style.width = `${pct}%`;
    el.className = pct < 22 ? 'vv-fill b-spent' : pct < 50 ? 'vv-fill b-warn' : 'vv-fill b-ok';
  });
  set('[data-cl-left]', el => { el.textContent = live.selfPaced
    ? t('{n} wrong choices left · no timer', { n: Math.ceil(live.left / (CLUSTER_PENALTY * 1000)) })
    : t('{n}s left on the reservation', { n: Math.ceil(live.left / 1000) }); });
  const log = root.querySelector('[data-cl-log]');
  if (log && log.dataset.stage !== st.stage.id) {
    log.dataset.stage = st.stage.id;
    log.innerHTML = st.lines.map((l, i) => `<button class="cl-line" data-action="cluster-line" data-id="${i}">${escapeHtml(t(l.t))}</button>`).join('');
  }
  if (log) for (const b of log.querySelectorAll('.cl-line')) {
    const i = Number(b.dataset.id);
    b.classList.toggle('wrong', live.wrong.includes(i));
    b.classList.toggle('right', live.found === i);
    b.disabled = !!live.holdUntil || live.wrong.includes(i);
  }
  const flash = root.querySelector('[data-cl-flash]');
  if (flash) {
    if (flash.textContent !== (live.flash || '')) flash.textContent = live.flash || '';
    flash.tabIndex = 0;
    flash.setAttribute('role', 'status');
    flash.className = `vv-flash ${live.flash ? live.flashKind : 'hidden'}`;
  }
  let advance = root.querySelector('[data-cl-advance]');
  if (live.selfPaced && !advance) {
    advance = document.createElement('button');
    advance.className = 'btn primary';
    advance.dataset.action = 'cluster-advance';
    advance.dataset.clAdvance = '';
    root.append(advance);
  }
  if (advance) {
    advance.textContent = t('Continue');
    advance.hidden = !live.selfPaced || !live.holdUntil;
  }
}

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function step() {
  if (!live || activityPaused('[data-cl]')) return;
  if (live.holdUntil) {
    live.holdUntil -= TICK;
    if (live.holdUntil <= 0) nextStage();
    paint();
    return;
  }
  live.left -= TICK;
  if (live.left <= 0) { live.left = 0; return finish(); }
  paint();
}

function nextStage() {
  live.holdUntil = 0; live.flash = null; live.flashKind = null;
  live.index++;
  if (live.index >= live.stages.length) return finish();
  live.misses += live.wrong.length;
  live.wrong = []; live.found = null;
  const log = document.querySelector('[data-cl-log]');
  if (log) log.dataset.stage = '';
  paint();
}

export function clusterPick(index) {
  if (!live || live.holdUntil || activityPaused('[data-cl]')) return;
  const st = live.stages[live.index];
  const line = st.lines[index];
  if (!line || live.wrong.includes(index)) return;
  if (line.real) {
    live.found = index;
    live.solved++;
    live.flash = t(line.why);
    live.flashKind = 'good';
    live.holdUntil = 3000;
  } else {
    live.wrong.push(index);
    live.left -= CLUSTER_PENALTY * 1000;
    live.flash = live.selfPaced ? t(line.why) : `${t(clusterMiss[live.wrong.length % clusterMiss.length])} ${t(line.why)}`;
    live.flashKind = 'bad';
    if (live.selfPaced) live.holdUntil = 1;
    if (live.left <= 0) { live.left = 0; if (!live.selfPaced) return finish(); }
  }
  paint();
  if (live?.selfPaced) document.querySelector('[data-cl-flash]')?.focus();
}

export function clusterAdvance() {
  if (!live?.selfPaced || !live.holdUntil || activityPaused('[data-cl]')) return;
  if (live.left <= 0) return finish();
  if (live.found !== null) {
    nextStage();
    if (live) document.querySelector('[data-cl-title]')?.focus();
    return;
  }
  live.holdUntil = 0;
  live.flash = null;
  live.flashKind = null;
  paint();
  document.querySelector('[data-cl-title]')?.focus();
}

function finish() {
  const result = { solved: live.solved, stages: live.stages.length, misses: live.misses + live.wrong.length, secondsLeft: live.selfPaced ? 0 : Math.max(0, Math.round(live.left / 1000)) };
  const done = live.onDone;
  stopCluster();
  done(result);
}

export function startCluster(seed, onDone, { selfPaced = false } = {}) {
  stopCluster();
  let x = (seed >>> 0) || 1;
  const rand = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1e6) / 1e6; };
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const stages = shuffle(clusterStages).map(stage => ({ stage, lines: shuffle(stage.lines) }));
  live = { stages, index: 0, left: CLUSTER_SECONDS * 1000, wrong: [], found: null, misses: 0, solved: 0, holdUntil: 0, flash: null, flashKind: null, selfPaced, onDone };
  if (!selfPaced) timer = setInterval(step, TICK);
  paint();
}

export function stopCluster() { if (timer) clearInterval(timer); timer = null; live = null; }
