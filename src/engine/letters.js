// The letters. Four minimum for anything academic, and the one thing about your file you
// are structurally forbidden from checking.
import { t } from '../i18n/index.js';
import { LETTERS_REQUIRED, writerKinds, askLines, packetVerdicts, darkHorseLines, RANK_NOTE } from '../data/letters.js';
import { ACADEMIC } from '../data/tracks.js';
import { random, roll, clamp, pick } from './probability.js';
import { effects, log, message, award, lastName, firstName, joined } from './state.js';

export const ensureLetters = s => (s.letters = s.letters || { asked: [], closed: false });
export const letterCount = s => (s.letters?.asked || []).filter(l => l.status === 'yes').length;
export const hasAdvisorLetter = s => (s.letters?.asked || []).some(l => l.kind === 'advisor' && l.status === 'yes');
export const lettersReady = s => letterCount(s) >= LETTERS_REQUIRED && hasAdvisorLetter(s);
export const needsLetters = track => ACADEMIC.includes(track) || track === 'postdoc' || track === 'national_lab';

// Who is actually available to ask, drawn from people this run produced.
export function availableWriters(s) {
  ensureLetters(s);
  const taken = new Set(s.letters.asked.map(l => l.id));
  const out = [];
  // Spread the archetype first: it carries its own `id`, and ours must win.
  const add = (id, kind, name, extra = {}) => { if (!taken.has(id)) out.push({ ...writerKinds[kind], ...extra, id, kind, name }); };

  add('w-advisor', 'advisor', t('Prof. {name}', { name: lastName(s.advisor.name) }));
  (s.committee || []).forEach((c, i) => add(`w-comm-${i}`, 'committee', c));
  if (s.flags.collabOffer) add('w-collab', 'collaborator', s.collabFrom || t('your collaborator'));
  const mentor = s.lastInternship || (s.intern?.history || [])[0];
  if (mentor) add('w-mentor', 'mentor', (s.intern?.history || [])[0]?.employer || s.lastInternship?.company || t('your internship mentor'));
  if ((s.conferenceConnections || 0) >= 4) add('w-senior', 'senior', t('Prof. {name}', { name: lastName(s.peers[0]?.labOf || s.advisor.name) }));
  const pd = (s.labmates || []).find(l => l.role === 'postdoc');
  if (pd) add('w-postdoc', 'postdocmate', pd.name);
  add('w-chair', 'chair', t('the department chair'));
  return out;
}

// How good the letter actually is — a number the player never sees.
function trueQuality(s, w) {
  const base = {
    advisor: 40 + (s.relationship.trust - 50) * .55 + (s.relationship.satisfaction - 50) * .35 - (s.letterDrag || 0) * 7,
    committee: 44 + (s.readiness - 50) * .25 + (s.counts.accepted || 0) * 4,
    collaborator: 58 + (s.conferenceConnections || 0) * 1.2,
    mentor: 56 + (s.player.skills.coding - 50) * .2,
    senior: 34 + s.advisor.connections * .18,
    postdocmate: 62,
    chair: 30,
  }[w.kind] ?? 45;
  const known = { advisor: 1, committee: .7, collaborator: .8, mentor: .8, senior: .25, postdocmate: 1, chair: .1 }[w.kind] ?? .5;
  return { q: clamp(base + (random(s) * 2 - 1) * 9), known };
}

// Ask. They can say yes warmly, yes dutifully, yes with a hedge, or no — and the register
// you hear is only loosely coupled to what gets written.
export function askLetter(s, writerId) {
  ensureLetters(s);
  if (s.letters.closed) throw new Error(t('The packet is closed. The letters are in, for better or worse.'));
  const w = availableWriters(s).find(x => x.id === writerId);
  if (!w) throw new Error(t('You cannot ask that person.'));
  if (s.player.stats.energy < 4) throw new Error(t('Not enough Energy to write the email properly, and this is not an email to write badly.'));
  effects(s, { energy: -4 });

  const { q, known } = trueQuality(s, w);
  const declines = w.kind === 'advisor' ? .02 : clamp(.30 - q / 260 - known * .12, .03, .40);
  if (roll(s, declines)) {
    const line = t(pick(s, askLines.refused));
    s.letters.asked.push({ id: w.id, kind: w.kind, name: w.name, status: 'no', quality: 0, reach: w.reach, line });
    log(s, joined(t('You asked {who} for a letter.', { who: w.name }), ' ', line));
    effects(s, { hope: -3 });
    if (w.kind === 'senior') award(s, 'saidno');
    return { status: 'no', line };
  }

  // A big name who barely knows you is how you acquire a dark horse.
  const darkHorse = roll(s, clamp(.05 + (1 - known) * .38 + (60 - q) / 400 + (w.kind === 'advisor' ? (s.letterDrag || 0) * .06 : 0), .02, .55));
  const register = q > 68 && known > .6 ? 'warm' : q > 48 ? 'dutiful' : 'hedged';
  const line = t(pick(s, askLines[register]));
  s.letters.asked.push({
    id: w.id, kind: w.kind, name: w.name, status: 'yes', reach: w.reach,
    quality: Math.round(darkHorse ? Math.min(q, 26 + random(s) * 12) : q),
    darkHorse, register, line,
    hint: darkHorse ? t(pick(s, darkHorseLines)) : null,   // stored, never shown before the outcome
  });
  log(s, joined(t('You asked {who} for a letter.', { who: w.name }), ' ', line));
  if (register === 'hedged') effects(s, { hope: -2 });
  if (letterCount(s) === LETTERS_REQUIRED) {
    log(s, t('Four letters. That is the minimum, and the minimum is the number most people file.'));
    message(s, t('Faculty Search Support'), t('Your reference list is complete'),
      t('Our records show {n} confirmed letter writers, which meets the requirement for faculty and postdoctoral applications. {note}', { n: letterCount(s), note: t(RANK_NOTE) }), 'browser', 'inbox', null);
    award(s, 'fourletters');
  }
  return { status: 'yes', line, register };
}

// What the packet is worth, weighted so an outside letter counts for more than a lab one.
export function packetStrength(s) {
  const yes = (s.letters?.asked || []).filter(l => l.status === 'yes');
  if (!yes.length) return { score: 0, verdict: 'short', outside: 0, n: 0 };
  const weighted = yes.reduce((a, l) => a + l.quality * (1 + l.reach * .13), 0) / yes.reduce((a, l) => a + (1 + l.reach * .13), 0);
  const outside = yes.filter(l => l.reach >= 2).length;
  const worst = Math.min(...yes.map(l => l.quality));
  // The dark horse is not averaged away. One quiet letter is read as the honest one.
  const score = clamp(weighted - (yes.some(l => l.darkHorse) ? 18 : 0) - (worst < 32 ? 6 : 0) + outside * 3);
  const verdict = yes.length < LETTERS_REQUIRED ? 'short'
    : outside === 0 ? 'inside'
      : score > 68 ? 'strong' : score > 48 ? 'solid' : 'thin';
  return { score, verdict, outside, n: yes.length, darkHorse: yes.some(l => l.darkHorse) };
}

export const packetVerdictText = s => t(packetVerdicts[packetStrength(s).verdict]);

// The gate the market reads. Industry never checks; academia will not open the file without it.
export function letterGate(s, track) {
  if (!needsLetters(track)) return { blocked: false, why: '' };
  if (!hasAdvisorLetter(s)) return { blocked: true, why: t('No letter from your advisor. A faculty file without one is not a file.') };
  if (letterCount(s) < LETTERS_REQUIRED)
    return { blocked: true, why: t('{have} of {need} letters. Faculty searches and postdocs will not open the file.', { have: letterCount(s), need: LETTERS_REQUIRED }) };
  return { blocked: false, why: '' };
}

// Once applications go out, the packet is fixed.
export function closeLetters(s) { ensureLetters(s); s.letters.closed = true; return packetStrength(s); }

// Told only at the end, and only if it mattered.
export function darkHorseReveal(s) {
  const dh = (s.letters?.asked || []).find(l => l.status === 'yes' && l.darkHorse);
  if (!dh) return null;
  return t('One line, in one letter, from {who}: “…{line}.” You were never going to see it. You still do not, except that now you know the shape of it.', { who: dh.name, line: dh.hint });
}
