// Watering the plant.
//
// Deliberately the smallest system in the codebase. It is not on a menu, it is not in the report,
// it never appears in the next-step banner, and nothing will ever tell you it is there.
//
// The one design decision worth writing down: it only does anything when you are already having a
// bad time. Above the stress line it is a few points of relief; below it, it is a sentence and no
// numbers at all. That makes it impossible to farm, and it makes it accurate — a ritual is not a
// resource, and nobody waters a plastic plant on a good day.
import { PLANT, plantLines } from '../data/plant.js';
import { t } from '../i18n/index.js';
import { pick } from './probability.js';
import { effects, log, award } from './state.js';

export const plantState = s => s.plant || (s.plant = { watered: 0, lastWeek: -99, found: false });

// A week, in the run's own units, so it works at every tempo.
const weekStamp = s => s.month * 4 + (s.week || 0);

export const canWater = s => weekStamp(s) - plantState(s).lastWeek >= PLANT.cooldownWeeks;

export function waterPlant(s) {
  const p = plantState(s);
  if (!canWater(s)) return { line: t(pick(s, plantLines.idle)), again: false };
  p.lastWeek = weekStamp(s);
  p.watered++;

  const line = p.found ? t(pick(s, plantLines.after)) : t(plantLines.discover);
  p.found = true;

  // Only when it is actually being used for what it is being used for.
  const stress = s.player.hidden.stress;
  if (stress > 55) effects(s, { stress: -3, hope: 2 });
  else if (stress > 40) effects(s, { stress: -1 });

  log(s, line);
  if (p.watered === PLANT.ritual) { log(s, t(plantLines.noticed)); award(s, 'waterit'); }
  if (p.watered === PLANT.devoted) { log(s, t(plantLines.devoted)); award(s, 'plasticdevotion'); }
  return { line, again: true };
}
