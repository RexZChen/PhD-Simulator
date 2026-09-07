// Being stuck, and who you ask about it.
//
// Odds are per door and read the run: an advisor who is travelling is not available at all, a
// labmate you never talk to is not listening, a collaborator helps in proportion to their name
// position. No door is strictly best, which is the point — the skill being modelled is knowing
// which one to spend on which kind of stuck, and the game never tells you.
import { doors, doorOrder, OBSTACLES } from '../data/stuck.js';
import { t } from '../i18n/index.js';
import { random, roll, clamp, pick } from './probability.js';
import { effects, log, award, activeProject, lastName, firstName } from './state.js';
import { activeContacts, contactLabel } from './network.js';

// What kind of stuck you are. Derived, so the menu is about the run rather than a free choice.
export function obstacleOf(s) {
  const p = activeProject(s);
  if (!p) return OBSTACLES.motivation;
  if (s.player.stats.energy < 26 || s.player.hidden.stress > 74) return OBSTACLES.motivation;
  if (p.scope > 62) return OBSTACLES.scope;
  if (p.draft > 30 && p.writingQuality < 42) return OBSTACLES.framing;
  if (p.progress > 30 && (p.evidence || 0) < 34) return OBSTACLES.method;
  return OBSTACLES.bug;
}

// Available, and why not. `blocked` is a sentence, never a missing button.
export function doorOptions(s) {
  const ob = obstacleOf(s);
  const mode = s.advisorMode?.id;
  const contacts = activeContacts(s);
  const mates = (s.labmates || []).filter(l => l.status === 'active');
  const asked = s.stuckAsked || {};
  return doorOrder.map(id => {
    const d = doors[id];
    let blocked = null;
    if (asked[id] === s.month) blocked = t('You have already been round this one this month.');
    else if (id === 'advisor' && ['checkedOut', 'traveling'].includes(mode)) blocked = t('They are not reachable this month.');
    else if (id === 'advisor' && s.relationship.satisfaction < 22) blocked = t('You are not going to ask them for anything right now.');
    else if (id === 'collab' && !contacts.length) blocked = t('You do not have a collaborator yet.');
    else if (id === 'labmate' && !mates.length) blocked = t('There is nobody in the lab today.');
    else if (s.player.stats.energy < d.energy) blocked = t('Not enough Energy.');
    return { ...d, blocked, fits: d.fit.includes(ob.id) };
  });
}

// The odds a given door actually helps. Fit is the biggest term, by design.
function doorOdds(s, d, fits) {
  const a = s.advisor;
  const base = { advisor: .34, labmate: .4, collab: .34, google: .3, ai: .42, sleep: .46 }[d.id] ?? .35;
  let mod = 0;
  if (d.id === 'advisor') mod += (a.caring - 50) / 260 + (a.availability - 50) / 300 + (s.relationship.trust - 50) / 320 - (a.ambition - 55) / 400;
  if (d.id === 'labmate') { const best = Math.max(0, ...(s.labmates || []).filter(l => l.status === 'active').map(l => l.bond)); mod += (best - 40) / 260; }
  if (d.id === 'collab') { const c = activeContacts(s)[0]; mod += c ? (c.regard - 45) / 240 : -.2; }
  if (d.id === 'google') mod += (s.player.skills.coding - 50) / 300;
  if (d.id === 'ai') mod += (s.player.skills.research - 55) / 340;      // knowing when it is wrong
  if (d.id === 'sleep') mod += (100 - s.player.hidden.stress) / 500;
  return clamp(base + mod + (fits ? .26 : -.08), .12, .84);
}

export function askDoor(s, id) {
  const opt = doorOptions(s).find(o => o.id === id);
  if (!opt) throw new Error(t('That is not one of the options.'));
  if (opt.blocked) throw new Error(opt.blocked);
  const d = doors[id];
  const p = activeProject(s);
  s.stuckAsked = { ...(s.stuckAsked || {}), [id]: s.month };
  // Cost and restoration are separate: a door with a negative cost silently inverted this into a
  // grant and made its own availability check unreachable.
  if (d.energy > 0) effects(s, { energy: -d.energy });
  if (d.restore) effects(s, { energy: d.restore });
  // Stopping for the evening is not free of the month. Without this the sixth door was strictly
  // the best one: energy back, a decent unstick, and the plan still delivered in full.
  if (id === 'sleep') s.turnBite = clamp((s.turnBite || 0) + .08, 0, .3);
  const won = roll(s, doorOdds(s, d, opt.fits));
  const line = t(pick(s, won ? d.good : d.bad));

  if (won) {
    effects(s, { progress: 7, hope: 4, stress: -6, confidence: 3 });
    if (p) p.evidence = clamp((p.evidence || 0) + 3);
    if (id === 'advisor') effects(s, { satisfaction: 3, trust: 3 });
    if (id === 'labmate') effects(s, { labBond: 4 });
    if (id === 'sleep') effects(s, { energy: 10, health: 2 });
    s.counts.unstuck = (s.counts.unstuck || 0) + 1;
    if ((s.counts.unstuck || 0) >= 8) award(s, 'sixdoors');
  } else {
    effects(s, { stress: 3, hope: -2 });
    // The specific ways each door makes it worse.
    if (id === 'advisor' && p) { p.scope = clamp(p.scope + 9); effects(s, { pressure: 5 }); }
    if (id === 'ai' && p) { p.progress = clamp(p.progress - 4); effects(s, { energy: -3 }); }
    if (id === 'google') effects(s, { energy: -2 });
    if (id === 'collab') effects(s, { hope: -2 });
    if (id === 'sleep') effects(s, { energy: 4 });
  }
  // Trying every door in one run is its own small, unadvertised thing.
  s.stuckTried = [...new Set([...(s.stuckTried || []), id])];
  if (s.stuckTried.length >= doorOrder.length) award(s, 'allsixdoors');
  log(s, line);
  return { won, line };
}
