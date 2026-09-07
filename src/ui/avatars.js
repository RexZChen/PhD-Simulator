import { t } from '../i18n/index.js';
// Code-drawn, faceless avatars and parody crests. Deterministic from a seed string.
function hash(str) { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const SKIN = ['#e8c4a2', '#d9a066', '#c68642', '#8d5524', '#f1d3b3', '#a9714b'];
const HAIR = ['#2b2118', '#5a3b21', '#b98a4a', '#8c8c8c', '#1a1a1a', '#c14a2a', '#e6d7b8'];
const SHIRT = ['#3a5f8f', '#7a4f6f', '#3f7a5b', '#8f6a3a', '#5a5a7a', '#a14d4d', '#2f6f6f', '#6b6b6b'];

export function avatar(seed, size = 48, { bg = '#dfe6ee' } = {}) {
  const h = hash(seed);
  const skin = SKIN[h % SKIN.length], hair = HAIR[(h >> 3) % HAIR.length], shirt = SHIRT[(h >> 6) % SHIRT.length];
  const style = (h >> 9) % 6; // hair styles
  const glasses = ((h >> 12) % 3) === 0, beard = ((h >> 14) % 4) === 0 && style !== 4, earrings = ((h >> 16) % 5) === 0;
  const hairShape = [
    `<path d="M14 22c0-9 6-14 18-14s18 5 18 14v6H14z" fill="${hair}"/>`, // short
    `<path d="M12 24c0-11 7-16 20-16s20 5 20 16v18h-6V30H18v12h-6z" fill="${hair}"/>`, // long
    `<path d="M15 21c0-8 7-12 17-12s17 4 17 12v4H15z" fill="${hair}"/><circle cx="32" cy="8" r="6" fill="${hair}"/>`, // bun
    `<path d="M13 24c-1-12 8-17 19-17s20 5 19 17c-4-3-8-4-19-4s-15 1-19 4z" fill="${hair}"/><circle cx="16" cy="20" r="5" fill="${hair}"/><circle cx="48" cy="20" r="5" fill="${hair}"/><circle cx="24" cy="12" r="5" fill="${hair}"/><circle cx="40" cy="12" r="5" fill="${hair}"/>`, // curly
    ``, // bald
    `<path d="M14 26c0-10 6-16 18-16s18 6 18 16v2H14z" fill="${hair}"/><path d="M14 27h36l-2 8H16z" fill="${hair}" opacity=".7"/>`, // shaggy
  ][style];
  return `<svg class="avatar" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${bg}"/><path d="M6 64c0-12 10-18 26-18s26 6 26 18z" fill="${shirt}"/><rect x="22" y="36" width="20" height="12" fill="${skin}"/><ellipse cx="32" cy="26" rx="15" ry="17" fill="${skin}"/>${hairShape}${beard ? `<path d="M19 30c2 10 6 14 13 14s11-4 13-14c-3 4-8 5-13 5s-10-1-13-5z" fill="${hair}" opacity=".85"/>` : ''}${glasses ? `<g fill="none" stroke="#222" stroke-width="2"><circle cx="24" cy="27" r="5"/><circle cx="40" cy="27" r="5"/><path d="M29 27h6"/></g>` : ''}${earrings ? `<circle cx="17" cy="33" r="1.8" fill="#d98b1c"/><circle cx="47" cy="33" r="1.8" fill="#d98b1c"/>` : ''}</svg>`;
}

// Crests: a shield, a symbol, and a motto that has given up. Palette matches the OS.
const PALETTE = { navy: '#0a246a', gold: '#d98b1c', teal: '#1f6a6a', cream: '#f4efe2', red: '#a11d1d', slate: '#3d4a5c' };
const SYMBOLS = {
  atom: '<circle cx="32" cy="34" r="4" fill="C2"/><g fill="none" stroke="C2" stroke-width="2.5"><ellipse cx="32" cy="34" rx="17" ry="7"/><ellipse cx="32" cy="34" rx="17" ry="7" transform="rotate(60 32 34)"/><ellipse cx="32" cy="34" rx="17" ry="7" transform="rotate(120 32 34)"/></g>',
  sun: '<circle cx="32" cy="34" r="9" fill="C2"/><g stroke="C2" stroke-width="3" stroke-linecap="round"><path d="M32 16v6M32 46v6M14 34h6M44 34h6M20 22l4 4M40 42l4 4M44 22l-4 4M24 42l-4 4"/></g>',
  bison: '<path d="M18 32c0-8 6-12 14-12s14 4 14 12v6c0 7-6 12-14 12s-14-5-14-12z" fill="C2"/><path d="M18 30c-5-2-7-7-5-11 4 1 6 4 7 8zM46 30c5-2 7-7 5-11-4 1-6 4-7 8z" fill="C2"/><circle cx="27" cy="34" r="1.8" fill="C1"/><circle cx="37" cy="34" r="1.8" fill="C1"/>',
  mountain: '<path d="M10 50l14-24 8 13 6-9 16 20z" fill="C2"/><path d="M18 38l6-12 5 8-4 4z" fill="C1" opacity=".55"/>',
  wave: '<path d="M10 40c6-8 12-8 18 0s12 8 18 0 8-6 8-6v14H10z" fill="C2"/><path d="M12 30c5-6 10-6 15 0s10 6 15 0" fill="none" stroke="C2" stroke-width="2.5"/>',
  tree: '<path d="M32 12l12 16h-7l9 12h-9l7 10H20l7-10h-9l9-12h-7z" fill="C2"/><rect x="29" y="50" width="6" height="8" fill="C2"/>',
  gear: '<circle cx="32" cy="34" r="12" fill="none" stroke="C2" stroke-width="6" stroke-dasharray="6 5"/><circle cx="32" cy="34" r="5" fill="C2"/>',
  bear: '<circle cx="32" cy="36" r="13" fill="C2"/><circle cx="22" cy="26" r="5" fill="C2"/><circle cx="42" cy="26" r="5" fill="C2"/><rect x="27" y="38" width="10" height="6" fill="C1"/>',
  melon: '<path d="M14 30a18 18 0 0 0 36 0z" fill="C2"/><path d="M18 30a14 14 0 0 0 28 0z" fill="#c0392b"/><circle cx="26" cy="38" r="1.5" fill="C1"/><circle cx="32" cy="41" r="1.5" fill="C1"/><circle cx="38" cy="38" r="1.5" fill="C1"/>',
  tiger: '<rect x="16" y="24" width="32" height="20" rx="4" fill="C2"/><rect x="22" y="24" width="4" height="20" fill="C1"/><rect x="30" y="24" width="4" height="20" fill="C1"/><rect x="38" y="24" width="4" height="20" fill="C1"/>',
  drop: '<path d="M32 12c8 12 12 18 12 24a12 12 0 0 1-24 0c0-6 4-12 12-24z" fill="C2"/><rect x="26" y="46" width="12" height="8" fill="C1" opacity=".5"/>',
  tower: '<rect x="24" y="14" width="16" height="40" fill="C2"/><path d="M22 14h20l-10-8z" fill="C2"/><circle cx="32" cy="26" r="5" fill="C1"/><path d="M32 22v4h3" stroke="C2" stroke-width="2" fill="none"/>',
  horn: '<path d="M10 28c8-6 14-6 22-2 8-4 14-4 22 2-6 0-12 4-22 12-10-8-16-12-22-12z" fill="C2"/><circle cx="32" cy="36" r="6" fill="C2"/>',
  block: '<path d="M14 18h12l6 12 6-12h12v30h-10V32l-8 14-8-14v16H14z" fill="C2"/>',
  bee: '<ellipse cx="32" cy="36" rx="14" ry="10" fill="C2"/><rect x="24" y="26" width="4" height="20" fill="C1"/><rect x="32" y="26" width="4" height="20" fill="C1"/><ellipse cx="22" cy="24" rx="8" ry="5" fill="C1" opacity=".8"/><ellipse cx="42" cy="24" rx="8" ry="5" fill="C1" opacity=".8"/>',
  corn: '<ellipse cx="32" cy="34" rx="9" ry="18" fill="C2"/><path d="M26 22l12 24M38 22L26 46" stroke="C1" stroke-width="2"/><path d="M18 40c4-14 8-18 14-22-2 12-6 18-14 22z" fill="C2" opacity=".8"/>',
  star: '<path d="M32 14l5 12h13l-10 8 4 13-12-8-12 8 4-13-10-8h13z" fill="C2"/>',
  torch: '<rect x="29" y="30" width="6" height="24" fill="C2"/><path d="M32 12c6 6 8 10 8 14a8 8 0 0 1-16 0c0-4 2-8 8-14z" fill="C2"/>',
  lake: '<path d="M12 40c6-6 10-6 16 0s10 6 16 0 8-6 12 0v10H12z" fill="C2"/><circle cx="44" cy="22" r="6" fill="C2"/>',
  cheese: '<path d="M14 44l18-24 18 24z" fill="C2"/><circle cx="30" cy="36" r="3" fill="C1"/><circle cx="38" cy="40" r="2" fill="C1"/><circle cx="26" cy="42" r="1.5" fill="C1"/>',
  book: '<path d="M16 20h14v30H16zM34 20h14v30H34z" fill="C2"/><path d="M30 20h4v30h-4z" fill="C1"/>',
  palm: '<rect x="30" y="30" width="4" height="24" fill="C2"/><path d="M32 30c-10-8-16-6-20 0 8-2 14 0 20 4zM32 30c10-8 16-6 20 0-8-2-14 0-20 4zM32 28c-4-10-2-16 4-18-2 6-2 12-4 18zM32 28c4-10 10-12 14-10-8 2-12 6-14 10z" fill="C2"/>',
  skyline: '<rect x="12" y="30" width="8" height="24" fill="C2"/><rect x="22" y="18" width="10" height="36" fill="C2"/><rect x="34" y="26" width="8" height="28" fill="C2"/><rect x="44" y="12" width="8" height="42" fill="C2"/>',
  owl: '<ellipse cx="32" cy="36" rx="14" ry="16" fill="C2"/><circle cx="26" cy="32" r="5" fill="C1"/><circle cx="38" cy="32" r="5" fill="C1"/><path d="M32 38l-3 4h6z" fill="C1"/>',
  cardinal: '<path d="M18 40c4-14 14-18 26-14l6-6-2 10c2 8-4 16-14 18s-14-2-16-8z" fill="C2"/><circle cx="38" cy="30" r="2" fill="C1"/>',
  bridge: '<path d="M10 46h44M14 46V30M50 46V30M14 30q18 14 36 0" stroke="C2" stroke-width="4" fill="none"/>',
  anchor: '<circle cx="32" cy="16" r="4" fill="none" stroke="C2" stroke-width="3"/><rect x="30" y="20" width="4" height="30" fill="C2"/><path d="M16 38c4 10 10 14 16 14s12-4 16-14" stroke="C2" stroke-width="4" fill="none"/><rect x="22" y="26" width="20" height="4" fill="C2"/>',
};
export function crest(school, size = 40) {
  const spec = school.crest || { symbol: 'book', motto: 'Semper Deadline', c1: 'navy', c2: 'gold' };
  const c1 = PALETTE[spec.c1] || spec.c1, c2 = PALETTE[spec.c2] || spec.c2;
  const sym = (SYMBOLS[spec.symbol] || SYMBOLS.book).replaceAll('C1', c1).replaceAll('C2', c2);
  return `<svg class="crest" width="${size}" height="${size}" viewBox="0 0 64 64" aria-label="${school.name} crest"><path d="M8 6h48v30c0 12-10 20-24 24C18 56 8 48 8 36z" fill="${c1}" stroke="${PALETTE.cream}" stroke-width="2"/><path d="M12 10h40v26c0 10-8 16-20 20-12-4-20-10-20-20z" fill="none" stroke="${c2}" stroke-width="1.5" opacity=".6"/>${sym}</svg>`;
}
export const crestMotto = school => t(school.crest?.motto || 'Semper Deadline');
