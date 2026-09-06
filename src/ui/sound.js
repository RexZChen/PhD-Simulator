// Tiny synthesized OS sounds. No assets. Fails silently where audio is unavailable.
let ctx = null;
let enabled = true;
export const setSound = on => { enabled = !!on; };
function tone(freq, start, length, type = 'square', gain = .04) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + .01);
  g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + start + length);
  o.connect(g); g.connect(ctx.destination);
  o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + length + .05);
}
const patterns = {
  click: () => tone(1200, 0, .03, 'square', .02),
  notify: () => { tone(880, 0, .08); tone(1320, .09, .12); },
  error: () => { tone(220, 0, .18, 'sawtooth', .03); tone(180, .12, .2, 'sawtooth', .03); },
  submit: () => { tone(523, 0, .08); tone(659, .09, .08); tone(784, .18, .16); },
  accept: () => { tone(523, 0, .1); tone(659, .1, .1); tone(784, .2, .1); tone(1047, .3, .3, 'triangle', .05); },
  reject: () => { tone(494, 0, .12); tone(415, .13, .12); tone(330, .26, .3); },
  startup: () => { tone(392, 0, .2, 'triangle', .05); tone(523, .15, .2, 'triangle', .05); tone(659, .3, .2, 'triangle', .05); tone(784, .45, .5, 'triangle', .05); },
  ring: () => { tone(1000, 0, .08); tone(1000, .12, .08); tone(1000, .3, .08); tone(1000, .42, .08); },
  chime: () => { tone(1568, 0, .06, 'sine', .04); tone(2093, .07, .12, 'sine', .04); },
};
export function play(name) {
  if (!enabled || !patterns[name]) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    patterns[name]();
  } catch { /* audio unavailable */ }
}
