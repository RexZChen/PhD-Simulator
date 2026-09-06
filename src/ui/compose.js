// Streaming composer. Picking a canned line "types" it into a compose box the way a chat
// assistant streams a reply, then the player presses Send. The whole app re-renders from
// scratch on every state change, so the ticker paints the DOM node directly and never calls
// render(); it re-queries the node each tick because a render may have replaced it.
let timer = null;
let live = null; // { full, shown, done, onDone }

const SELECTOR = '[data-compose-text]';
const TICK = 16;
const MAX_MS = 1500;
const MIN_STEPS = 10;

function paint() {
  const node = document.querySelector(SELECTOR);
  if (!node || !live) return;
  node.textContent = live.shown;
  node.classList.toggle('streaming', !live.done);
  const box = node.closest('[data-compose-scroll]') || node;
  box.scrollTop = box.scrollHeight;
}

export function isStreaming() { return !!live && !live.done; }
export function composedText() { return live ? live.shown : ''; }

export function stopStream() {
  if (timer) clearInterval(timer);
  timer = null;
  live = null;
}

// Jump to the end of the current stream (player clicked the box to skip).
export function finishStream() {
  if (!live || live.done) return false;
  if (timer) clearInterval(timer);
  timer = null;
  live.shown = live.full;
  live.done = true;
  paint();
  const done = live.onDone;
  if (done) done();
  return true;
}

export function streamText(full, onDone) {
  stopStream();
  const text = String(full ?? '');
  live = { full: text, shown: '', done: false, onDone };
  const steps = Math.max(MIN_STEPS, Math.min(Math.round(MAX_MS / TICK), text.length));
  const per = Math.max(1, Math.ceil(text.length / steps));
  paint();
  timer = setInterval(() => {
    if (!live) return;
    live.shown = text.slice(0, live.shown.length + per);
    if (live.shown.length >= text.length) {
      live.done = true;
      clearInterval(timer);
      timer = null;
      paint();
      if (onDone) onDone();
      return;
    }
    paint();
  }, TICK);
}
