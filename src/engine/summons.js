// The interrupt that takes a piece of the turn you already chose.
//
// It is raised *after* the plan is set and *before* the turn resolves, and the answer scales what
// the turn produces. That ordering is the whole point: everything else in the game happens around
// your decision, and this happens to it.
import { summonsKinds, summonsMoves, summonsDeclined, SUMMONS } from '../data/summons.js';
import { t } from '../i18n/index.js';
import { random, roll, clamp, pick, pickWeighted } from './probability.js';
import { effects, log, chat, award, lastName, firstName, fill } from './state.js';
import { activeContacts, contactLabel } from './network.js';

export const summonsOpen = s => !!s.summons && !s.summons.answered;

// Does one land this turn? Raised on the way out of the plan stage, so it can eat the plan.
export function maybeSummons(s, { crunch } = {}) {
  if (s.phase !== 'playing' || s.summons || s.month < 3) return null;
  if (s.tempo === 'season') return null;                    // a season is not a calendar you can interrupt
  const a = s.advisor;
  // Busier, more managerial advisors interrupt more. A crunch makes it likelier, not less.
  // About six a run rather than ten: often enough to be a real feature of the calendar, not so
  // often that it becomes the calendar. At ~42% of a turn each, ten of these cost four turns of
  // output over a run, which showed up as diligent players defending and never depositing.
  const base = .055 + (a.ambition - 50) / 700 + (a.management - 50) / 900 + (crunch ? .045 : 0)
    + (s.advisorMode?.id === 'pressed' ? .04 : 0) - (s.advisorMode?.id === 'checkedOut' ? .04 : 0);
  if (random(s) >= clamp(base, .01, .18)) return null;
  const contacts = activeContacts(s);
  const pool = Object.values(summonsKinds).filter(k =>
    (!k.crunchOnly || !!crunch) && (!k.needsContact || contacts.length > 0));
  if (!pool.length) return null;
  const kind = pickWeighted(s, pool, k => k.weight);
  const who = kind.needsContact ? contactLabel(pick(s, contacts)) : null;
  s.summons = {
    id: kind.id, from: kind.from, who,
    variant: Math.floor(random(s) * kind.text.length),
    hard: !!crunch, answered: false, move: null,
  };
  return s.summons;
}

export const summonsDef = s => (s.summons ? summonsKinds[s.summons.id] : null);
export const summonsMoveList = () => Object.values(summonsMoves);

// Answering it. Returns the fraction of the turn that survives.
export function answerSummons(s, moveId) {
  const sm = s.summons;
  const def = summonsDef(s);
  if (!sm || sm.answered || !def) throw new Error(t('There is nothing in the calendar.'));
  if (!summonsMoves[moveId]) throw new Error(t('That is not one of the options.'));
  sm.answered = true;
  sm.move = moveId;
  const bite = sm.hard ? SUMMONS.biteHard : SUMMONS.bite;

  if (moveId === 'decline') {
    sm.keep = 1;                                    // the turn is intact
    const cost = { advisor: { satisfaction: -7, trust: -3 }, contact: { hope: -2 }, department: { stress: 3 }, labmate: { labBond: -6, hope: -3 } }[def.from] || { stress: 2 };
    effects(s, cost);
    if (def.from === 'contact' && sm.who) { const c = activeContacts(s).find(x => contactLabel(x) === sm.who); if (c) c.regard = clamp(c.regard - 9); }
    log(s, t(summonsDeclined[def.from] || summonsDeclined.advisor));
    return sm;
  }

  // Going costs the turn. Saying you are close to a deadline sometimes shortens it.
  let keep = 1 - bite;
  let good = roll(s, clamp(.45 + (s.advisor.caring - 50) / 200, .15, .8));
  if (moveId === 'late') {
    const heard = roll(s, clamp(.55 + (s.advisor.caring - 50) / 160 + (s.relationship.trust - 50) / 220, .15, .88));
    if (heard) { keep = 1 - bite * .45; effects(s, { satisfaction: 2 }); }
    else { effects(s, { satisfaction: -5, stress: 4 }); good = false; }
  }
  sm.keep = keep;
  sm.good = good;
  effects(s, { energy: -4 - Math.round(bite * 8), stress: sm.hard ? 6 : 3 });
  if (def.from === 'advisor') effects(s, { satisfaction: 4, trust: 2 });
  if (def.from === 'labmate') effects(s, { labBond: 8, hope: good ? 4 : -2 });
  if (def.from === 'contact' && sm.who) {
    const c = activeContacts(s).find(x => contactLabel(x) === sm.who);
    if (c) { c.regard = clamp(c.regard + 10); c.lastContact = s.month; }
  }
  log(s, fill(s, t(good ? def.good : def.bad)));
  s.counts.summons = (s.counts.summons || 0) + 1;
  if ((s.counts.summons || 0) >= 6) award(s, 'thecalendarisnotyours');
  return sm;
}

// What the turn keeps after the interruption. 1 when nothing happened.
export const summonsKeep = s => (s.summons && s.summons.answered ? (s.summons.keep ?? 1) : 1);
export const clearSummons = s => { s.summons = null; };
