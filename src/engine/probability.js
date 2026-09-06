export const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
// Mulberry32. Every random decision consumes one step so runs are reproducible from a seed.
export function random(state) {
  state.rng = (state.rng + 0x6D2B79F5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
export const roll = (state, chance) => random(state) < clamp(chance, .03, .97);
export const pick = (state, values) => values[Math.floor(random(state) * values.length)];
export const jitter = (state, value, width = 14) => Math.round(clamp(value + (random(state) * 2 - 1) * width));
export function shuffle(state, values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random(state) * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
// Weighted choice; weights of zero or less are skipped. Returns null when nothing is eligible.
export function pickWeighted(state, items, weightOf) {
  const weights = items.map(weightOf);
  const total = weights.reduce((a, w) => a + Math.max(0, w), 0);
  if (total <= 0) return null;
  let r = random(state) * total;
  for (let i = 0; i < items.length; i++) { const w = Math.max(0, weights[i]); if (r < w) return items[i]; r -= w; }
  return items[items.length - 1];
}
