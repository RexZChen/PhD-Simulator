// The things on the desk, and what touching them does.
//
// Deliberately the smallest system in the codebase, and the one with the strictest rule: a fixture
// only pays out when you are already having a bad time. Above the line it is a few points of
// relief; below it, a sentence and no numbers. That makes none of them farmable and all of them
// accurate — a ritual is not a resource.
//
// The fridge is the exception that proves it. It never pays you anything. The one click that does
// something costs you, quietly, with somebody in the room, forever.
import { fixtures, PLANT, CHAIR, FRIDGE, plantLines, chairLines, fridgeLines } from '../data/desk.js';
import { t } from '../i18n/index.js';
import { pick } from './probability.js';
import { effects, log, award, chat } from './state.js';

// A week in the run's own units, so the cooldown behaves at every tempo.
const weekStamp = s => s.month * 4 + (s.week || 0);
const slotOf = (s, id) => {
  const f = fixtures[id];
  if (!f) return null;
  return (s[f.slot] ||= { used: 0, watered: 0, lastWeek: -99, found: false });
};

export const fixtureState = slotOf;
export const canUse = (s, id) => {
  const st = slotOf(s, id);
  return !!st && weekStamp(s) - st.lastWeek >= (fixtures[id].cooldown || 1);
};

// Kept for the plant's own slot shape, which shipped before the others existed.
export const plantState = s => slotOf(s, 'plant');
export const canWater = s => canUse(s, 'plant');

function usePlant(s, st) {
  st.watered = (st.watered || 0) + 1;
  const line = st.found ? t(pick(s, plantLines.after)) : t(plantLines.discover);
  st.found = true;
  const stress = s.player.hidden.stress;
  if (stress > 55) effects(s, { stress: -3, hope: 2 });
  else if (stress > 40) effects(s, { stress: -1 });
  log(s, line);
  if (st.watered === PLANT.ritual) { log(s, t(plantLines.noticed)); award(s, 'waterit'); }
  if (st.watered === PLANT.devoted) { log(s, t(plantLines.devoted)); award(s, 'plasticdevotion'); }
  return line;
}

function useChair(s, st) {
  st.used = (st.used || 0) + 1;
  const line = st.found ? t(pick(s, chairLines.after)) : t(chairLines.discover);
  st.found = true;
  // A chair at the right height is a real thing and a small one.
  if (s.player.stats.energy < 45) effects(s, { energy: 2 });
  log(s, line);
  if (st.used === CHAIR.ritual) { log(s, t(chairLines.noticed)); award(s, 'thechair'); }
  return line;
}

function useFridge(s, st) {
  st.used = (st.used || 0) + 1;
  // The one click that does something. It pays you nothing and it costs you a little, with
  // somebody, permanently, and neither of you will ever raise it.
  if (!st.thrown && st.used >= FRIDGE.throwAt) {
    st.thrown = true;
    const line = t(fridgeLines.thrown);
    effects(s, { labBond: -3 });
    const who = (s.labmates || []).filter(l => l.status === 'active')[0];
    chat(s, 'general', who?.name || t('somebody in the lab'), t(fridgeLines.slack));
    chat(s, 'general', who?.name || t('somebody in the lab'), t(fridgeLines.slackAfter));
    award(s, 'theyogurt');
    log(s, line);
    return line;
  }
  const pool = st.thrown ? fridgeLines.after_thrown : st.found ? fridgeLines.after : null;
  const line = pool ? t(pick(s, pool)) : t(fridgeLines.discover);
  st.found = true;
  log(s, line);
  return line;
}

const HANDLER = { plant: usePlant, chair: useChair, fridge: useFridge };
const IDLE = { plant: plantLines.idle, chair: chairLines.idle, fridge: fridgeLines.idle };

export function useFixture(s, id) {
  if (fixtures[id]?.opens) return null;          // that one is a door, not a ritual
  const st = slotOf(s, id);
  if (!st || !HANDLER[id]) return null;
  // The line is recorded on the run so the UI can show THIS fixture's answer. Reading s.notice
  // instead meant an idle click — which deliberately does not write to the history, because
  // looking at a fridge is not an event — displayed whatever was logged last. If you had erased
  // the whiteboard at any point, every object on the desk said the eraser line forever.
  const said = line => { s.deskSaid = line; return line; };
  if (!canUse(s, id)) return { line: said(t(pick(s, IDLE[id]))), again: false };
  st.lastWeek = weekStamp(s);
  return { line: said(HANDLER[id](s, st)), again: true };
}

// The old name, still used by the tests and by anything that only cares about the plant.
export const waterPlant = s => useFixture(s, 'plant');
