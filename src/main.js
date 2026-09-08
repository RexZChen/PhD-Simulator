import './styles.css';
import { createRun, chatBody, mailSubject, mailSender, requestText, noticeText, entryText } from './engine/state.js';
import { dispatch, prepareRun } from './engine/game.js';
import { loadSave, saveRun, resetSave, emptyMeta, listSlots, readSlot, writeSlot, deleteSlot } from './engine/save.js';
import { shell } from './ui/shell.js';
import { play, setSound } from './ui/sound.js';
import { setAppLanguage } from './i18n/apply.js';
import { streamText, stopStream, finishStream, isStreaming, composedText } from './ui/compose.js';
import { startTalk, pickWord, stopTalk, talkRunning, startQaTimer, stopQaTimer } from './ui/talkgame.js';
import { startBench, strike, stopBench, benchRunning } from './ui/research.js';
import { startLecture, toggleWork, stopLecture, lectureRunning } from './ui/lecture.js';
import { startViva, vivaMove, stopViva, vivaRunning, examTalk, examInterrupt, examCorridor } from './ui/viva.js';
import { startCluster, clusterPick, stopCluster, clusterRunning } from './ui/cluster.js';
import { draftFor } from './ui/apps/mail.js';
import { markBoard, eraseBoard, paintBoard } from './ui/apps/whiteboard.js';
import { fixtures } from './data/desk.js';
import { exams, badCop } from './data/exams.js';
import { chatDraft } from './ui/apps/chat.js';
import { rebuttalDraft } from './ui/apps/browser.js';
import { conditions as conditionDefs } from './data/life.js';
import { achievements } from './data/catalog.js';
import { esc, voiced, rollReadout } from './ui/helpers.js';
import { t, pauseProvenance, resumeProvenance } from './i18n/index.js';
const conditionNames = Object.fromEntries(Object.entries(conditionDefs).map(([k, v]) => [k, v.name]));

const root = document.querySelector('#app');
const loaded = loadSave(localStorage);
let run = loaded.run;
let meta = loaded.meta;
let notices = [loaded.notice, loaded.error].filter(Boolean);
let ui = { screen: 'boot', wizardStep: 0, wizardChoice: run && run.phase !== 'ending' ? 'continue' : 'new', eula: false, app: 'dashboard', browserTab: 'overgrief', mailFolder: 'inbox', selectedMail: null, chatChannel: 'advisor', startMenu: false, minimized: false, confirm: null, dialog: null, balloons: [], saveError: loaded.error, effort: 'generic', contact: false };
let balloonId = 0;
setSound(meta.settings.sound);
// Text size is a scale now, not a switch. Old saves carry a boolean; read it once and forget it.
if (meta.settings.textSize === undefined) meta.settings.textSize = meta.settings.largeText ? 2 : 1;   // 1 is Normal, not the floor
// The rungs the A−/A+ control moves between. Every font size in the stylesheet is a ratio of this,
// so a step here moves every word on screen — which is what the control always looked like it did.
export const TEXT_SIZES = [
  { id: 0, label: 'Small', px: 13 },
  { id: 1, label: 'Normal', px: 15 },
  { id: 2, label: 'Large', px: 17 },
  { id: 3, label: 'Larger', px: 19 },
  { id: 4, label: 'Largest', px: 22 },
];
function applyTextSize() {
  const step = TEXT_SIZES.find(x => x.id === meta.settings.textSize) || TEXT_SIZES[1];
  document.documentElement.style.setProperty('--base-font', `${step.px}px`);
}
applyTextSize();
const initialLanguage = meta.settings.lang || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');
setAppLanguage(initialLanguage);
if (!meta.settings.lang) meta.settings.lang = initialLanguage;

// Timed dialogs: the bar in the DOM is the clock. When it empties, the moment closes.
let sceneTimer = null, sceneKey = null;
function stopSceneTimer() { if (sceneTimer) clearInterval(sceneTimer); sceneTimer = null; sceneKey = null; }
function syncSceneTimer() {
  const el = document.querySelector('[data-scene-timer]');
  if (!el) { stopSceneTimer(); return; }
  const key = el.dataset.sceneTimer + '|' + (run?.pushback?.id || run?.event || '');
  if (sceneTimer && sceneKey === key) return;
  stopSceneTimer();
  sceneKey = key;
  const total = Number(el.dataset.sceneTimer) * 1000;
  let left = total;
  sceneTimer = setInterval(() => {
    left -= 100;
    const bar = document.querySelector('[data-scene-bar]');
    if (!bar) { stopSceneTimer(); return; }
    const pct = Math.max(0, left / total) * 100;
    bar.style.width = `${pct}%`;
    bar.className = pct < 30 ? 'low' : '';
    if (left <= 0) { stopSceneTimer(); perform({ type: 'HESITATE' }); }
  }, 100);
}
// The lecture runs itself once its dialog is on screen.
function syncLecture() {
  const on = run?.stage === 'minigame' && run?.minigame === 'lecture';
  if (on && !lectureRunning()) startLecture((run.seed + run.month * 7) >>> 0, r => perform({ type: 'LECTURE', ...r }));
  if (!on && lectureRunning()) stopLecture();
}
// Room 214, same lifecycle. It survives a re-render and does not restart on one.
function syncViva() {
  const on = run?.stage === 'minigame' && run?.minigame === 'viva';
  if (on && !vivaRunning()) {
    // The establishing shot: who is in the room, what is booked, and whose third one of the week
    // this is. It is the first thing the day tells you and it belongs before anybody speaks.
    const exam = exams[run.viva.kind] || exams.prelim;
    if (exam.note) sceneNote(t(exam.note));
    startViva((run.seed + run.month * 31 + (run.milestones?.prelimAttempts || 0) * 7) >>> 0, run.viva.kind, run.player.skills,
      tally => {
        play('chime');
        perform({ type: 'VIVA', tally }, { preserveScroll: false });
        // And afterwards, the one who was assigned the difficult role is warm to you and asks about
        // your funding. Which lands only once the verdict is already in, so it goes after dispatch.
        if (tally.badCop) sceneNote(t(badCop.afterward));
      });
  }
  if (!on && vivaRunning()) stopViva();
  if (run?.stage !== 'minigame' || run?.minigame !== 'cluster') { if (clusterRunning()) stopCluster(); }
}

// Achievements were a grey line in a log nobody re-reads. When a new one lands, stamp it on the
// screen for four seconds. Tracked here rather than in the run, because it is about this session's
// attention, not about the save.
let seenAwards = null;
let armTimer = null;          // the arming window on a destructive save action
function flashAwards() {
  if (!run) { seenAwards = null; return; }
  const now = run.achievements || [];
  if (seenAwards === null) { seenAwards = new Set(now); return; }
  const fresh = now.filter(id => !seenAwards.has(id));
  for (const id of fresh) seenAwards.add(id);
  if (!fresh.length || !meta.settings.sound && meta.settings.quiet) return;
  const host = document.querySelector('[data-award-host]');
  if (!host) return;
  for (const id of fresh) {
    const a = achievements[id];
    if (!a) continue;
    const el = document.createElement('div');
    el.className = 'award-toast';
    el.innerHTML = `<b>${t('Achievement unlocked')}</b><span>${esc(t(a.name))}</span><small>${esc(t(a.desc))}</small>`;
    host.appendChild(el);
    setTimeout(() => el.remove(), 5200);
  }
  play('chime');
}

// Touching something on the desk says something back, and what it says is two or three sentences
// long. The status bar truncates at about seventy characters, which cut every one of them in half.
// So it lands on screen instead, in the same place achievements do, and wraps.
// The dice, at the moment they land. It also lives in the monthly report, but by then the scene
// that produced it is four screens away.
function showRoll(r) {
  const host = document.querySelector('[data-desk-host]');
  if (!host || !r) return;
  for (const old of host.querySelectorAll('.roll-toast')) old.remove();
  const el = document.createElement('div');
  el.className = 'roll-toast rolling';
  el.innerHTML = rollReadout(r);
  host.appendChild(el);
  const pin = el.querySelector('.roll-pin');
  const out = el.querySelector('.roll-out');
  const outHtml = out ? out.innerHTML : '';
  if (out) out.innerHTML = `<span class="roll-tick">${t('rolling…')}</span>`;
  // ~900ms of the number moving, then it lands. Long enough to watch, short enough that the
  // sixtieth time you see it is not an imposition.
  const start = performance.now(), dur = 900;
  const tick = now => {
    const t0 = Math.min(1, (now - start) / dur);
    const ease = 1 - Math.pow(1 - t0, 3);
    const at = t0 < 1 ? (17 + ((now - start) / 40 * 37) % 66) * (1 - ease) + r.draw * ease : r.draw;
    if (pin) pin.style.left = `${Math.max(0, Math.min(100, at))}%`;
    if (out && t0 < 1) out.innerHTML = `<span class="roll-tick">${Math.round(at)}</span>`;
    if (t0 < 1) requestAnimationFrame(tick);
    else {
      el.className = `roll-toast landed ${r.success ? 'won' : 'lost'}`;
      if (out) out.innerHTML = outHtml;
      play(r.success ? 'chime' : 'click');
    }
  };
  requestAnimationFrame(tick);
  setTimeout(() => el.remove(), 7000);
}

// Copy, from a menu that says Copy. Falls back silently rather than throwing in a sandbox.
function copyText(text) {
  if (!text) return;
  try { navigator.clipboard?.writeText(text); } catch { /* no clipboard here */ }
}

function deskNote(text) {
  note('[data-desk-host]', text);
}
// The same note, on the one layer that is above a dialog. Every scene in this game is a `.modal` at
// z-index 20 and the desk host sits at 6, so a line raised from inside Room 214 through deskNote is
// read — if at all — through a black overlay. The award host is the only host above the modals.
function sceneNote(text) {
  note('[data-award-host]', text);
}
function note(hostSel, text) {
  const host = document.querySelector(hostSel);
  if (!host || !text) return;
  for (const old of host.querySelectorAll('.desk-note')) old.remove();
  const el = document.createElement('div');
  el.className = 'desk-note';
  el.innerHTML = voiced(text);
  host.appendChild(el);
  setTimeout(() => el.remove(), 9000);
}

// Conversations read downward. The thread panes are rebuilt from scratch on every render, which
// reset them to the top and left the newest message below the fold for the whole exchange.
function followThreads() {
  for (const log of document.querySelectorAll('.thread-log, .chat-log, .mail-thread')) {
    log.scrollTop = log.scrollHeight;
  }
}

function render({ restoreTyping = false, preserveScroll = true } = {}) {
  const scroll = preserveScroll ? (document.querySelector('.client')?.scrollTop || 0) : 0;
  const modalScroll = document.querySelector('.dialog .body')?.scrollTop || 0;
  // Rendering calls t() thousands of times; none of it is text the run stores, so keep it
  // out of the provenance buffer.
  pauseProvenance();
  try { root.innerHTML = shell(run, ui, meta, loaded.run, notices); } finally { resumeProvenance(); }
  const client = document.querySelector('.client');
  if (client && preserveScroll) client.scrollTop = scroll;
  const body = document.querySelector('.dialog .body'); if (body) body.scrollTop = modalScroll;
  if (restoreTyping) document.querySelector('#typing-zone')?.focus();
  followThreads();
  syncSceneTimer();
  syncLecture();
  syncViva();
  flashAwards();
  paintBoard();
}
function persist() {
  if (!run) return;
  const result = saveRun(localStorage, run, meta);
  meta = result.meta; ui.saveError = result.error; loaded.run = run; loaded.meta = meta;
}
function saveMeta() { const result = saveRun(localStorage, run, meta); meta = result.meta; ui.saveError = result.error; loaded.meta = meta; }
function balloon(title, text, icon = 'bell', sound = 'notify') {
  ui.balloons.push({ id: ++balloonId, title, text: String(text).slice(0, 140) });
  if (ui.balloons.length > 3) ui.balloons.shift();
  const id = balloonId;
  setTimeout(() => { ui.balloons = ui.balloons.filter(b => b.id !== id); render(); }, 6000);
  play(sound);
}
function notify(text) { balloon('Academic OS', text, 'warn', 'error'); }
// The composer types a canned line into the box, then Send becomes available.
function closeCompose() { stopStream(); ui.compose = null; ui.chatMenu = false; }
function beginCompose(mailId, optionId) {
  ui.compose = { mailId, optionId, done: false };
  render();
  const text = draftFor(run, mailId, optionId);
  play('click');
  streamText(text, () => { if (ui.compose) { ui.compose.done = true; render(); } });
}
function setLanguage(lang) { meta.settings.lang = lang; setAppLanguage(lang); saveMeta(); render(); }

function afterDispatch(before, after) {
  const newMail = after.inbox.filter(m => !before.inbox.some(x => x.id === m.id));
  const newChat = after.chatMessages.filter(m => !m.mine && !before.chatMessages.some(x => x.id === m.id));
  const newReq = after.requests.filter(r => r.status === 'open' && !before.requests.some(x => x.id === r.id));
  const newAch = after.achievements.filter(a => !before.achievements.includes(a));
  // The balloon printed the raw id — "Achievement unlocked — boundary" — next to a panel that had
  // the real name in it. Look it up, the way the panel does.
  if (newAch.length) balloon(t('Achievement unlocked'), newAch.map(id => t(achievements[id]?.name || id)).join(', '), 'star', 'chime');
  if (newReq.length) balloon(t('Request from Prof. {name}', { name: after.advisor.name.split(' ').at(-1) }), requestText(after, newReq[0]), 'chat', 'ring');
  else if (newChat.filter(m => m.channel === 'advisor').length) balloon(t('Prof. {name}', { name: after.advisor.name.split(' ').at(-1) }), chatBody(after, newChat.filter(m => m.channel === 'advisor')[0]), 'chat', 'notify');
  else if (newChat.length) balloon(`#${newChat[0].channel}`, `${newChat[0].sender}: ${chatBody(after, newChat[0])}`, 'chat', 'notify');
  if (newMail.length) balloon(t('New mail'), `${mailSender(after, newMail[0])}: ${mailSubject(after, newMail[0])}`, 'mail', newChat.length ? 'click' : 'notify');
  const newConds = (after.conditions || []).filter(c => !(before.conditions || []).some(x => x.id === c.id));
  if (newConds.length) balloon(t('Your body, calling'), t(conditionNames[newConds[0].id] || newConds[0].id), 'warn', 'error');
  if (after.phase === 'ending' && before.phase !== 'ending') play(after.ending.id === 'pass' ? 'accept' : 'reject');
  const acc = after.counts?.accepted || 0, bef = before.counts?.accepted || 0;
  if (acc > bef) play('accept'); else if ((after.counts?.rejected || 0) > (before.counts?.rejected || 0)) play('reject');
}
function perform(action, options = {}) {
  try {
    const before = run;
    run = dispatch(run, action);
    if (before.phase === 'playing' || run.phase === 'playing') afterDispatch(before, run);
    // Anything that arrived in the channel you are currently looking at has been seen. Without
    // this the badge counts messages that are already on the screen in front of you.
    if (run?.phase === 'playing' && ui.screen === 'game' && ui.app === 'chat' && !ui.minimized && action.type !== 'READ_CHAT') {
      const open = ui.chatChannel || 'advisor';
      if (run.chatMessages.some(m => m.channel === open && !m.read && !m.mine)) run = dispatch(run, { type: 'READ_CHAT', channel: open });
    }
    persist();
    render(options);
  } catch (error) { notify(error.message || t('That action is unavailable.')); render(); }
}
function startRun(seed, answers) {
  run = prepareRun(createRun(seed, answers));
  run.seenBefore = { ...meta.eventCounts };
  meta.runs = (meta.runs || 0) + 1;
  ui = { ...ui, screen: 'game', app: 'dashboard', confirm: null, startMenu: false, minimized: false, wizardStep: 0, selectedMail: null };
  persist(); play('submit'); render();
}
function submitProfile() {
  const form = document.querySelector('#profile-form'); if (!form) return;
  const values = Object.fromEntries(new FormData(form));
  values.international = values.international === 'true';
  startRun(undefined, values);
}
function wizardNext() {
  const choice = ui.wizardChoice || 'new';
  if (ui.wizardStep === 0) {
    if (choice === 'collection') { ui.screen = 'collection'; render(); return; }
    if (choice === 'continue' && run) { ui.screen = 'game'; ui.app = 'dashboard'; if (meta.settings.tips && run.phase !== 'ending') ui.dialog = 'tips'; render(); return; }
    ui.wizardStep = 1; render(); return;
  }
  if (ui.wizardStep === 1) {
    if (!ui.eula) { notify(t('The license is short. Please tick the box.')); return; }
    if (choice === 'random') { startRun(); if (meta.settings.tips) { ui.dialog = 'tips'; render(); } return; }
    ui.wizardStep = 2; render(); return;
  }
  submitProfile();
}

root.addEventListener('submit', e => {
  if (e.target.id === 'profile-form') { e.preventDefault(); submitProfile(); if (meta.settings.tips) { ui.dialog = 'tips'; render(); } }
  if (e.target.id === 'chatphd-form') { e.preventDefault(); const input = document.querySelector('#chatphd-input'); const text = input?.value || ''; perform({ type: 'CHATPHD_SAY', text }); const again = document.querySelector('#chatphd-input'); if (again) again.focus(); }
});
root.addEventListener('change', e => {
  if (e.target.id === 'eula') { ui.eula = e.target.checked; render(); }
  if (e.target.id === 'effort-select') { ui.effort = e.target.value; render(); }
  if (e.target.id === 'contact-faculty') { ui.contact = e.target.checked; render(); }
  if (e.target.id === 'tips-toggle') { meta.settings.tips = e.target.checked; saveMeta(); }
});
root.addEventListener('keydown', e => {
  if (e.target.id === 'typing-zone') {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    e.preventDefault(); perform({ type: 'WRITE', amount: 1 }, { restoreTyping: true }); return;
  }
});
document.addEventListener('keydown', e => {
  if (e.target.matches('input, select, textarea, #typing-zone')) return;
  if (/^[1-6]$/.test(e.key)) { const b = document.querySelector(`[data-hotkey="${e.key}"]:not(:disabled)`); if (b) { e.preventDefault(); b.click(); } return; }
  if (e.key === 'Enter') { const d = document.querySelector('.modal [data-default="1"]:not(:disabled)') || document.querySelector('.wizard-buttons [data-default="1"]:not(:disabled)') || (!document.querySelector('.modal') && document.querySelector('[data-action="continue"]:not(:disabled)')); if (d) { e.preventDefault(); d.click(); } return; }
  if (e.key === ' ' && lectureRunning()) { e.preventDefault(); toggleWork(); return; }
  if (e.key === ' ' && benchRunning()) { e.preventDefault(); strike(); return; }
  if (e.key === 'Escape') { if (ui.startMenu || ui.dialog || ui.confirm || ui.thread) { ui.startMenu = false; ui.dialog = null; ui.confirm = null; ui.thread = null; render(); } }
});

root.addEventListener('click', event => {
  const word = event.target.closest('[data-tg-pick]');
  if (word && talkRunning()) { play('click'); pickWord(word.dataset.tgPick); return; }
  const target = event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  const action = target.dataset.action, id = target.dataset.id;
  if (action !== 'start-menu') ui.startMenu = false;
  if (action !== 'menu' && !String(action).startsWith('text-size') && action !== 'sound' && action !== 'quiet') ui.menu = null;
  if (!['choice', 'continue', 'dismiss-report', 'boot-skip', 'wb-mark'].includes(action)) play('click');
  switch (action) {
    case 'boot-skip': ui.screen = 'home'; render(); return;
    case 'home': ui.screen = 'home'; ui.minimized = false; ui.confirm = null; ui.dialog = null; ui.wizardStep = 0; render({ preserveScroll: false }); return;
    case 'collection': ui.screen = 'collection'; ui.minimized = false; render({ preserveScroll: false }); return;
    case 'back-to-game': ui.screen = 'game'; ui.minimized = false; render({ preserveScroll: false }); return;
    case 'guide-off': ui.guideOff = true; render(); return;
    case 'wiz-choice': ui.wizardChoice = id; render(); return;
    case 'wiz-next': wizardNext(); return;
    case 'wiz-back': ui.wizardStep = Math.max(0, ui.wizardStep - 1); render(); return;
    case 'wiz-submit': submitProfile(); if (meta.settings.tips) { ui.dialog = 'tips'; render(); } return;
    case 'wiz-cancel': if (run && run.phase !== 'ending') { ui.screen = 'game'; } ui.wizardStep = 0; render(); return;
    case 'new': if (run && run.phase !== 'ending') { ui.confirm = 'new'; render(); } else { ui.screen = 'home'; ui.wizardStep = 0; ui.wizardChoice = 'new'; render(); } return;
    case 'reset': ui.confirm = 'reset'; render(); return;
    case 'cancel-confirm': ui.confirm = null; render(); return;
    case 'confirm':
      if (ui.confirm === 'reset') { resetSave(localStorage); run = null; meta = emptyMeta(); loaded.run = null; loaded.meta = meta; notices = []; ui = { ...ui, screen: 'home', confirm: null, wizardStep: 0, wizardChoice: 'new', eula: false }; }
      else { ui.confirm = null; ui.screen = 'home'; ui.wizardStep = 0; ui.wizardChoice = 'new'; }
      render(); return;
    case 'about': ui.dialog = 'about'; render(); return;
    case 'language': setLanguage(id); return;
    case 'tips': ui.dialog = 'tips'; render(); return;
    case 'shutdown': ui.dialog = 'shutdown'; render(); return;
    case 'close-dialog': ui.dialog = null; render(); return;
    case 'dismiss-balloon': ui.balloons = ui.balloons.filter(b => String(b.id) !== id); render(); return;
    case 'start-menu': ui.startMenu = !ui.startMenu; ui.menu = null; render(); return;
    case 'menu': ui.menu = ui.menu === id ? null : id; ui.startMenu = false; render(); return;
    case 'new-run': ui.menu = null; if (run && run.phase !== 'ending') { ui.confirm = 'new'; render(); } else { ui.screen = 'home'; ui.wizardStep = 0; ui.wizardChoice = 'new'; render({ preserveScroll: false }); } return;
    case 'save-now': ui.menu = null; persist(); ui.saveNote = t('Saved.'); render(); return;
    case 'to-wizard': ui.menu = null; ui.screen = 'home'; ui.minimized = false; ui.wizardStep = 0; render({ preserveScroll: false }); return;
    case 'lang-toggle': ui.menu = null; setLanguage(meta.settings.lang === 'zh' ? 'en' : 'zh'); return;
    case 'copy-seed': ui.menu = null; copyText(run ? String(run.seed) : ''); return;
    case 'copy-notes': {
      ui.menu = null;
      const lines = (run?.history || []).filter(h => h.month === run.month).map(h => entryText(run, h));
      copyText(lines.join('\n'));
      return;
    }
    case 'minimize': ui.minimized = true; render(); return;
    case 'restore': ui.minimized = false; render(); return;
    case 'maximize': document.querySelector('.workspace')?.classList.toggle('no-side'); return;
    case 'close-window': if (run?.phase === 'playing') ui.minimized = true; else ui.screen = 'home'; render(); return;
    case 'sound': meta.settings.sound = !meta.settings.sound; setSound(meta.settings.sound); saveMeta(); if (meta.settings.sound) play('notify'); render(); return;
    case 'quiet': meta.settings.quiet = !meta.settings.quiet; saveMeta(); render(); return;
    case 'text-size': {
      const dir = id === 'down' ? -1 : 1;
      meta.settings.textSize = Math.max(0, Math.min(TEXT_SIZES.length - 1, (meta.settings.textSize ?? 1) + dir));
      applyTextSize(); saveMeta(); render(); return;
    }
    case 'open': {
      // Mail, Netscope, Life.exe and Scholar are yours before anybody admits you — see the note on
      // PRE_ENROL in shell.js. The others need a department and are disabled with a reason.
      const PRE_ENROL = ['mail', 'browser', 'life', 'scholar'];
      if (target.dataset.app === 'gradapply-status') { ui.app = null; ui.gaTab = 'interviews'; render({ preserveScroll: false }); return; }
      if (target.dataset.app === 'gradapply') { ui.app = null; render({ preserveScroll: false }); return; }
      const early = run && ['prep', 'application', 'interviews', 'admissions'].includes(run.phase);
      if (!run || !(['playing', 'ending'].includes(run.phase) || (early && PRE_ENROL.includes(target.dataset.app)))) return;
      closeCompose();
      ui.screen = 'game'; ui.app = target.dataset.app; ui.minimized = false;
      // A jump that names a destination lands on it. "Open OpenRegret" used to open Netscope on
      // whatever tab you last left it on, which is not what the button said.
      const page = target.dataset.page;
      if (page) {
        if (ui.app === 'browser') ui.browserTab = page;
        else if (ui.app === 'chat') ui.chatChannel = page;
        else if (ui.app === 'life') ui.lifeTab = page;
        else if (ui.app === 'portal') ui.portalTab = page;
        else if (ui.app === 'mail') ui.selectedMail = page;
      }
      if (ui.app === 'mail' && !ui.selectedMail) ui.selectedMail = run.inbox[0]?.id;
      if (ui.app === 'chat') perform({ type: 'READ_CHAT', channel: ui.chatChannel }, { preserveScroll: false });
      else render({ preserveScroll: false });
      return;
    }
    case 'browser-tab': closeCompose(); ui.browserTab = id; render({ preserveScroll: false }); return;
    case 'job-portal': ui.jobPortal = id; render({ preserveScroll: false }); return;
    case 'bench-start': {
      if (!run || run.stage !== 'plan') return;
      run.stage = 'minigame'; run.minigame = 'bench'; persist(); render({ preserveScroll: false });
      play('click');
      startBench((run.seed + run.month * 13) >>> 0, run.player.skills.research, run.player.stats.energy,
        tally => { run.stage = 'plan'; run.minigame = null; perform({ type: 'BENCH', tally }, { preserveScroll: false }); play('chime'); });
      return;
    }
    case 'bench-strike': strike(); return;
    case 'cluster-start': {
      if (!run || run.stage !== 'plan') return;
      run.stage = 'minigame'; run.minigame = 'cluster'; persist(); render({ preserveScroll: false });
      play('click');
      startCluster((run.seed + run.month * 17) >>> 0,
        result => { run.stage = 'plan'; run.minigame = null; perform({ type: 'CLUSTER', result }, { preserveScroll: false }); play('chime'); });
      return;
    }
    case 'cluster-line': clusterPick(Number(id)); play('click'); return;
    case 'wb-mark': {
      // The marks live in the app, not in the run — a save should not carry a list of doodles.
      const host = event.target.closest('[data-wb-surface]');
      if (!host) return;
      const r = host.getBoundingClientRect();
      const out = markBoard(((event.clientX - r.left) / r.width) * 100, ((event.clientY - r.top) / r.height) * 100);
      if (out === 'flow' && run) { play('chime'); perform({ type: 'BOARD_FLOW' }); }
      else if (out === 'full') play('click');
      return;
    }
    case 'stuck-ask': perform({ type: 'STUCK_ASK', id }); return;
    case 'wb-erase': { const line = eraseBoard(); if (line && run) perform({ type: 'BOARD_ERASE', line }); return; }
    case 'summons': perform({ type: 'SUMMONS', id }, { preserveScroll: false }); return;
    case 'patent-meet': perform({ type: 'PATENT_MEET', id }, { preserveScroll: false }); return;
    case 'patent-action': perform({ type: 'PATENT_ACTION', id }, { preserveScroll: false }); return;
    case 'set-pace': perform({ type: 'SET_PACE', id }, { preserveScroll: false }); return;
    case 'net-talk': perform({ type: 'NET_TALK', id }); return;
    case 'net-collab': { const [who, size] = String(id).split('|'); perform({ type: 'NET_COLLAB', id: who, size }); return; }
    case 'net-do': perform({ type: 'DO_COLLAB', id }); return;
    case 'net-letter': perform({ type: 'NET_LETTER', id }); return;
    case 'net-intro': perform({ type: 'NET_INTRO', id }); return;
    case 'viva-move': vivaMove(id); play('click'); return;
    case 'exam-talk': examTalk(id); play('click'); return;
    case 'exam-interrupt': examInterrupt(); play('click'); return;
    case 'exam-corridor': examCorridor(id); play('click'); return;
    case 'fixture': {
      if (fixtures[id]?.opens) { ui.board = true; render({ preserveScroll: false }); play('click'); return; }
      perform({ type: 'FIXTURE', id });
      // The line is two or three sentences and the status bar truncates it, so it goes on screen.
      // Read what the fixture said, not the last thing logged — see the note in engine/desk.js.
      if (run?.deskSaid) deskNote(run.deskSaid);
      return;
    }
    case 'read-all-mail': perform({ type: 'READ_MAIL_ALL' }, { preserveScroll: true }); return;
    case 'decision-open': {
      // The letter opens in front of you, one at a time. Reading six of these in one screen is a
      // list; reading them one at a time is the week it actually was.
      perform({ type: 'OPEN_DECISION', id }, { preserveScroll: false });
      if (run?.applications?.find(a => a.schoolId === id)?.letter) { ui.decision = id; play('chime'); render({ preserveScroll: false }); }
      return;
    }
    case 'offer-open': { ui.offer = { school: id, done: false }; render({ preserveScroll: false }); play('click'); return; }
    case 'offer-close': { ui.offer = null; render({ preserveScroll: false }); return; }
    case 'offer-submit': {
      const yes = document.querySelector('input[name="reply"][value="yes"]')?.checked !== false;
      if (!yes) { perform({ type: 'ANSWER_OFFER', id, yes: false }, { preserveScroll: false }); ui.offer = null; render({ preserveScroll: false }); return; }
      // Ninety seconds, your legal name twice, and then the page that says thank you.
      ui.offer = { school: id, done: true };
      play('chime');
      render({ preserveScroll: false });
      return;
    }
    case 'offer-begin': {
      const adv = run?.advisors?.find(a => a.schoolId === id && a.id === run.applications.find(x => x.schoolId === id)?.poiId)
        || run?.advisors?.find(a => a.schoolId === id);
      ui.offer = null; ui.gaTab = null;
      if (adv) perform({ type: 'ENROLL', id: adv.id }, { preserveScroll: false });
      return;
    }
    case 'saves': { ui.saves = { slots: listSlots(localStorage) }; ui.saveNote = null; ui.startMenu = false; ui.menu = null; render({ preserveScroll: false }); return; }
    case 'saves-close': { clearTimeout(armTimer); ui.saves = null; ui.saveNote = null; ui.saveArmed = null; render({ preserveScroll: false }); return; }
    case 'slot-save': {
      // Copying the live run into a slot. The autosave keeps writing to its own key, so this is a
      // snapshot rather than a move: you can put the run down and pick it up later.
      clearTimeout(armTimer); ui.saveArmed = null;
      const err = writeSlot(localStorage, Number(id), run);
      ui.saveNote = err || t('Saved to slot {n}.', { n: id });
      ui.saves = { slots: listSlots(localStorage) };
      render({ preserveScroll: false });
      return;
    }
    case 'slot-delete': {
      // Arm, then fire. The second click inside a few seconds is the confirm.
      if (ui.saveArmed !== Number(id)) {
        ui.saveArmed = Number(id);
        ui.saveNote = t('Click Sure? to delete slot {n}. Nothing else is affected.', { n: id });
        render({ preserveScroll: false });
        clearTimeout(armTimer);
        armTimer = setTimeout(() => { if (ui.saveArmed !== null) { ui.saveArmed = null; render({ preserveScroll: false }); } }, 5000);
        return;
      }
      clearTimeout(armTimer);
      ui.saveArmed = null;
      const err = deleteSlot(localStorage, Number(id));
      ui.saveNote = err || t('Slot {n} deleted. Your achievements are untouched.', { n: id });
      ui.saves = { slots: listSlots(localStorage) };
      render({ preserveScroll: false });
      return;
    }
    case 'slot-abandon': {
      // Ending the run that is open. Two clicks, and it goes back to the setup wizard rather than
      // leaving the player on a desktop belonging to a student who no longer exists.
      if (ui.saveArmed !== 'live') {
        ui.saveArmed = 'live';
        ui.saveNote = t('This ends the run that is open. Save it to a slot first if you want it back.');
        render({ preserveScroll: false });
        clearTimeout(armTimer);
        armTimer = setTimeout(() => { if (ui.saveArmed !== null) { ui.saveArmed = null; render({ preserveScroll: false }); } }, 5000);
        return;
      }
      clearTimeout(armTimer);
      ui.saveArmed = null;
      run = null;
      saveRun(localStorage, null, meta);
      ui.saves = null; ui.saveNote = null;
      ui.screen = 'home'; ui.wizardStep = 0; ui.wizardChoice = 'new'; ui.app = 'dashboard';
      render({ preserveScroll: false });
      return;
    }
    case 'slot-load': {
      const loadedRun = readSlot(localStorage, Number(id));
      if (!loadedRun) { ui.saveNote = t('That slot could not be read.'); render({ preserveScroll: false }); return; }
      run = loadedRun;
      persist();
      ui.saves = null; ui.saveNote = null; ui.screen = 'game'; ui.app = 'dashboard'; ui.minimized = false;
      ui.gaTab = null; ui.decision = null; ui.offer = null; ui.board = false; ui.thread = null;
      seenAwards = null;
      render({ preserveScroll: false });
      return;
    }
    case 'decision-close': { ui.decision = null; render({ preserveScroll: false }); return; }
    case 'offer-answer': { const [school, yes] = String(id).split('|'); perform({ type: 'ANSWER_OFFER', id: school, yes: yes === 'yes' }, { preserveScroll: false }); return; }
    case 'board-close': { ui.board = false; render({ preserveScroll: false }); return; }
    case 'photo-close': { if (run) { run.photo = null; persist(); render({ preserveScroll: false }); } return; }
    case 'crisis': perform({ type: 'CRISIS', id }, { preserveScroll: false }); return;
    case 'life-tab': ui.lifeTab = id; render({ preserveScroll: false }); return;
    case 'trip-visa': perform({ type: 'TRIP_VISA', id }, { preserveScroll: false }); return;
    case 'talk-intro': ui.talkStage = 'intro'; render({ preserveScroll: false }); return;
    case 'talk-start': {
      ui.talkStage = 'game'; render({ preserveScroll: false });
      play('click');
      startTalk((run.seed + run.month) >>> 0, tally => { ui.talkStage = 'result'; perform({ type: 'TRIP_TALK', tally }, { preserveScroll: false }); play('chime'); });
      return;
    }
    case 'talk-qa': {
      ui.talkStage = 'qa'; render({ preserveScroll: false });
      startQaTimer(14, () => { if (run?.trip && !run.trip.qaDone) { perform({ type: 'TRIP_QA', id: 'timeout' }, { preserveScroll: false }); } });
      return;
    }
    case 'trip-qa': {
      stopQaTimer();
      perform({ type: 'TRIP_QA', id }, { preserveScroll: false });
      if (run?.trip && !run.trip.qaDone) startQaTimer(14, () => { if (run?.trip && !run.trip.qaDone) perform({ type: 'TRIP_QA', id: 'timeout' }, { preserveScroll: false }); });
      else { ui.talkStage = null; }
      return;
    }
    case 'trip-day': perform({ type: 'TRIP_DAY', id }, { preserveScroll: false }); return;
    case 'cv-step': ui.cvStep = (ui.cvStep ?? 0) + 1; play('click'); render(); return;
    case 'cv-all': ui.cvStep = (run.cv?.lines.length || 0); play('chime'); render(); return;
    case 'take-offer': ui.cvStep = 0; play('accept'); perform({ type: 'TAKE_OFFER', id }, { preserveScroll: false }); return;
    case 'epilogue': perform({ type: 'EPILOGUE', id }, { preserveScroll: false }); return;
    case 'epilogue-end': perform({ type: 'EPILOGUE', id: (run.epilogue && 'ok') || 'ok' }, { preserveScroll: false }); return;
    case 'trip-caught': perform({ type: 'TRIP_CAUGHT', id }, { preserveScroll: false }); return;
    case 'trip-upgrade': play('submit'); perform({ type: 'TRIP_UPGRADE', id }); return;
    case 'scholar-tab': ui.scholarTab = id; render({ preserveScroll: false }); return;
    case 'coffee': play('click'); perform({ type: 'COFFEE' }); return;
    case 'skip-meal': perform({ type: 'SKIP_MEAL' }); return;
    case 'pop-in': perform({ type: 'POP_IN' }); return;
    case 'run-into': perform({ type: 'RUN_INTO' }); return;
    case 'day-mode': perform({ type: 'DAY_MODE' }, { preserveScroll: false }); return;
    case 'life': perform({ type: 'LIFE', id }); return;
    case 'clinic': perform({ type: 'CLINIC', id }); return;
    case 'budget': perform({ type: 'BUDGET', id }); return;
    case 'reflect': perform({ type: 'REFLECT' }); return;
    case 'ask-timeline': perform({ type: 'ASK_TIMELINE' }, { preserveScroll: false }); return;
    case 'timeline-move': perform({ type: 'TIMELINE_MOVE', id }); return;
    case 'react': perform({ type: 'REACT', id, reaction: target.dataset.reaction }); return;
    case 'chat-reply': perform({ type: 'CHAT_REPLY', id, kind: target.dataset.kind }); return;
    case 'dm-send': perform({ type: 'DM', id, opener: target.dataset.opener }); return;
    case 'dm-open': ui.chatChannel = `dm:${id}`; perform({ type: 'READ_CHAT', channel: ui.chatChannel }, { preserveScroll: false }); return;
    case 'ask-letter': perform({ type: 'ASK_LETTER', id }); return;
    case 'job-apply': perform({ type: 'JOB_APPLY', id, effort: target.dataset.effort }); return;
    case 'job-withdraw': perform({ type: 'JOB_WITHDRAW', id }); return;
    case 'job-disclose': perform({ type: 'JOB_DISCLOSE' }, { preserveScroll: false }); return;
    case 'work-auth': perform({ type: 'WORK_AUTH', id }); return;
    case 'intern-apply': perform({ type: 'INTERN_APPLY' }, { preserveScroll: false }); return;
    case 'intern-talk': perform({ type: 'INTERN_TALK', id }, { preserveScroll: false }); return;
    case 'intern-move': perform({ type: 'INTERN_MOVE', id }); return;
    case 'revise': perform({ type: 'REVISE', id }); return;
    case 'deposit': play('submit'); perform({ type: 'DEPOSIT' }, { preserveScroll: false }); return;
    case 'pay-debt': perform({ type: 'PAY_DEBT', amount: id }); return;
    case 'rebut-option': {
      ui.compose = { kind: 'rebuttal', optionId: id, done: false };
      render(); play('click');
      streamText(rebuttalDraft(run, id), () => { if (ui.compose) { ui.compose.done = true; render(); } });
      return;
    }
    case 'rebut-send': {
      if (!ui.compose || ui.compose.kind !== 'rebuttal' || !ui.compose.done) return;
      const { optionId } = ui.compose;
      closeCompose(); play('submit');
      perform({ type: 'REBUT', id: optionId });
      return;
    }
    case 'mail-folder': closeCompose(); ui.mailFolder = id; ui.selectedMail = null; render({ preserveScroll: false }); return;
    case 'mail-reply': closeCompose(); ui.compose = { mailId: id, optionId: null, done: false }; render(); return;
    case 'mail-option': beginCompose(target.dataset.mail, id); return;
    case 'mail-discard': closeCompose(); render(); return;
    case 'compose-skip': if (isStreaming()) finishStream(); return;
    case 'mail-archive': closeCompose(); perform({ type: 'READ_MAIL', id }); return;
    case 'mail-send': {
      if (!ui.compose || !ui.compose.done) return;
      const { mailId, optionId } = ui.compose;
      closeCompose(); play('submit');
      perform({ type: 'MAIL_REPLY', mailId, id: optionId });
      if (run && run.mailOutcome) { balloon(t('Reply sent'), run.mailOutcome, 'mail', 'notify'); run.mailOutcome = null; }
      return;
    }
    case 'chat-channel': closeCompose(); ui.chatChannel = id; perform({ type: 'READ_CHAT', channel: id }); return;
    case 'chat-menu': stopStream(); ui.compose = null; ui.chatMenu = true; render(); return;
    case 'chat-menu-close': ui.chatMenu = false; render(); return;
    case 'chat-option': {
      ui.chatMenu = false;
      ui.compose = { kind: 'chat', channel: ui.chatChannel, optionId: id, done: false };
      render();
      play('click');
      streamText(chatDraft(run, ui.chatChannel, id), () => { if (ui.compose) { ui.compose.done = true; render(); } });
      return;
    }
    case 'chat-send': {
      if (!ui.compose || ui.compose.kind !== 'chat' || !ui.compose.done) return;
      const { channel, optionId } = ui.compose;
      const text = composedText();
      const [kind, x, y] = optionId.split(':');
      closeCompose(); play('submit');
      if (kind === 'ask') perform({ type: 'ASK', id: x, text });
      else if (kind === 'soc') perform({ type: 'SOCIAL', channel, id: x, text });
      else if (kind === 'req') perform({ type: { do: 'REQUEST_DO', push: 'REQUEST_PUSH', decline: 'REQUEST_DECLINE' }[x], id: y, text });
      return;
    }
    case 'read-mail': closeCompose(); ui.selectedMail = id; perform({ type: 'READ_MAIL', id }); return;
    case 'apply': perform({ type: 'APPLY', schoolId: id, effort: ui.effort || 'generic', contact: !!ui.contact, poiId: target.dataset.target }); return;
    case 'ga-tab': ui.gaTab = id; render({ preserveScroll: false }); return;
    case 'ga-school': {
      // The faculty panel renders below a grid of thirty-two school buttons, roughly five hundred
      // pixels under the fold. A first-time player clicked MITT three times and reported that
      // clicking a school did nothing — it is the gateway to researching a program and emailing a
      // professor, which the tutorial tells you to do. Selecting a school now brings it into view.
      const opening = ui.gaSchool !== id;
      ui.gaSchool = opening ? id : null;
      render();
      if (opening) requestAnimationFrame(() => document.querySelector('.faculty-panel')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
      return;
    }
    case 'ga-filter': ui.gaFilter = id; render(); return;
    case 'ga-poi': ui.poi = { ...(ui.poi || {}), [id]: target.dataset.target }; render(); return;
    case 'ga-thread': ui.thread = id; render(); return;
    case 'close-thread': ui.thread = null; render(); return;
    case 'prep': perform({ type: 'PREP', id, target: target.dataset.target }); return;
    case 'email': perform({ type: 'EMAIL', advisorId: target.dataset.target, id }); return;
    case 'student': perform({ type: 'STUDENT', advisorId: target.dataset.target, id }); return;
    case 'interview': perform({ type: 'INTERVIEW', schoolId: target.dataset.target, id }); return;
    case 'visit': perform({ type: 'VISIT', advisorId: target.dataset.target, id }); return;
    case 'decisions': ui.gaTab = null; perform({ type: 'DECISIONS' }); return;
    case 'wait-april': perform({ type: 'WAIT_APRIL' }); return;
    case 'wizard': { const p = run.projects.find(x => x.id === run.activeProjectId); perform({ type: 'WIZARD', venueId: p?.wizardStep === 0 ? id : undefined }); return; }
    case 'continue': play('click'); perform({ type: 'CONTINUE' }); return;
    case 'dismiss-report': play('chime'); perform({ type: 'DISMISS_REPORT' }); return;
    case 'choice': stopSceneTimer(); play('click'); perform({ type: 'CHOICE', id }); if (run?.lastRoll) showRoll(run.lastRoll); return;
    case 'pushback': stopSceneTimer(); play('click'); perform({ type: 'PUSHBACK', id }); return;
    case 'lecture-toggle': toggleWork(); return;
    default: break;
  }
  const actions = {
    admissions: { type: 'ADMISSIONS' }, enroll: { type: 'ENROLL', id }, 'ask-student': { type: 'ASK_STUDENT', id },
    plan: { type: 'PLAN', id }, 'start-project': { type: 'START_PROJECT' }, 'start-side': { type: 'START_SIDE' }, 'select-project': { type: 'SELECT_PROJECT', id },
    write: { type: 'WRITE', amount: 5 }, hype: { type: 'HYPE' }, 'send-advisor': { type: 'SEND_ADVISOR' }, 'skip-approval': { type: 'SKIP_APPROVAL' }, 'set-target': { type: 'SET_TARGET', id }, 'clear-target': { type: 'CLEAR_TARGET' }, zoom: { type: 'ZOOM' },
    submit: { type: 'SUBMIT' }, rebut: { type: 'REBUT', id }, recycle: { type: 'RECYCLE', id }, preprint: { type: 'PREPRINT' }, chatphd: { type: 'CHATPHD', id }, practice: { type: 'PRACTICE' }, grant: { type: 'GRANT' },
    'req-do': { type: 'REQUEST_DO', id }, 'req-push': { type: 'REQUEST_PUSH', id }, 'req-decline': { type: 'REQUEST_DECLINE', id }, ask: { type: 'ASK', id }, prelim: { type: 'MILESTONE', id }, milestone: { type: 'MILESTONE', id }, graduate: { type: 'MILESTONE', id },
    pace: { type: 'PACE' }, 'start-thesis': { type: 'START_THESIS' }, 'schedule-defense': { type: 'SCHEDULE_DEFENSE' },
  };
  if (actions[action]) { if (action === 'submit') play('submit'); if (action === 'admissions' || action === 'enroll') ui.gaTab = null; if (action === 'enroll') ui.thread = null; perform(actions[action]); }
});

render();
setTimeout(() => { if (ui.screen === 'boot') { ui.screen = 'home'; play('startup'); render(); } }, 1800);
