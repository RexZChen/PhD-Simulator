// Health, money, and the parts of a PhD that are not the PhD.
// Everything here is deterministic given the seed; nothing here calls the UI.
import { t } from '../i18n/index.js';
import { crises, crisisMoves, afterCrisis, CRISIS_HEALTH, CRISIS_COOLDOWN } from '../data/crisis.js';
import { HARD_TA, raLostText, raBackText, raExtendText } from '../data/hardta.js';
import { conditions as conditionDefs, clinicById, clinics, budgets, lifeActionById, COFFEE } from '../data/life.js';
import { monthOf } from '../data/calendar.js';
import { random, roll, clamp, pick } from './probability.js';
import { effects, log, message, chat, award, absWeek, activeProject, lastName, fill, joined, activeLabmates } from './state.js';

export const PLAN_YEAR_MONTH = 9; // insurance resets in September, like everything else

export const budgetOf = s => budgets[s.budget] || budgets.normal;
export const hasCondition = (s, id) => (s.conditions || []).some(c => c.id === id);
export const activeConditions = s => (s.conditions || []).map(c => ({ ...c, def: conditionDefs[c.id] })).filter(c => c.def);

// Weekly drag from every untreated condition, summed.
export function conditionDrag(s) {
  const out = {};
  for (const c of activeConditions(s)) for (const [k, v] of Object.entries(c.def.drag || {})) out[k] = (out[k] || 0) + v * (c.severity || 1);
  return out;
}

export function addCondition(s, id, { quiet = false } = {}) {
  const def = conditionDefs[id];
  if (!def || hasCondition(s, id)) return null;
  const c = { id, since: s.month, severity: 1, ignored: 0 };
  s.conditions = [...(s.conditions || []), c];
  if (!quiet) {
    log(s, t('Your body has filed a complaint: {name}. {blurb}', { name: t(def.name), blurb: t(def.blurb) }));
    message(s, t('Student Health Services'), t('About your symptoms'), t('{blurb} Our records show you have not been seen. You can book at the campus health center, or with a provider who will bill your insurance and then, separately, bill you.', { blurb: t(def.blurb) }), 'life', 'inbox', 'healthNudge');
  }
  return c;
}

export function clearCondition(s, id) { s.conditions = (s.conditions || []).filter(c => c.id !== id); }

// Chance of picking something up, evaluated monthly. Bodies keep score.
export function maybeCondition(s) {
  const st = s.player.stats, hid = s.player.hidden;
  if ((s.conditions || []).length >= 3) return null;              // a body files one complaint at a time
  if (s.month - (s.lastCondition ?? -9) < 2) return null;
  const risk = clamp((hid.stress - 45) * .003 + (55 - st.health) * .003 + (25 - Math.min(25, st.energy)) * .004
    + (s.caffeine?.month > 45 ? .05 : 0) + (s.meals?.skippedMonth > 6 ? .05 : 0) + (s.budget === 'lean' ? .02 : 0)
    + (s.burnoutMonths > 0 ? .05 : 0), 0, .34);
  if (!roll(s, risk)) return null;
  const m = monthOf(s.month);
  const pool = [
    ...(s.caffeine?.month > 30 || s.meals?.skippedMonth > 4 ? ['gastritis'] : []),
    ...(hid.stress > 60 ? ['insomnia', 'anxiety'] : []),
    ...(s.tempo === 'week' || s.tempo === 'day' ? ['rsi', 'back'] : ['back']),
    ...([10, 11, 12, 1, 2, 3].includes(m) ? ['flu', 'flu'] : []),
    ...(s.month > 8 ? ['toothache'] : []),
    ...(hid.burnoutRisk > 60 ? ['burnedout'] : []),
  ].filter(id => !hasCondition(s, id));
  if (!pool.length) return null;
  s.lastCondition = s.month;
  return addCondition(s, pick(s, pool));
}

// Untreated conditions get worse, slowly, in the way real ones do.
export function ageConditions(s) {
  for (const c of [...(s.conditions || [])]) {
    const def = conditionDefs[c.id];
    if (!def) continue;
    c.ignored = (c.ignored || 0) + 1;
    if (def.months && c.ignored > def.months) {
      if (def.worsens && !hasCondition(s, def.worsens)) {
        clearCondition(s, c.id);
        const worse = addCondition(s, def.worsens, { quiet: true });
        if (worse) {
          log(s, t('The {old} became {new}. This is what “I will deal with it after the deadline” buys.', { old: t(def.name), new: t(conditionDefs[def.worsens].name) }));
          effects(s, { health: -10, stress: 8 });
        }
      } else if (!def.worsens) { clearCondition(s, c.id); log(s, t('The {name} faded on its own, eventually, the way most things do.', { name: t(def.name) })); }
    } else if (!def.worsens && c.ignored >= 3 && roll(s, .22)) {
      clearCondition(s, c.id);
      log(s, t('The {name} cleared up on its own, which is the outcome for most things, eventually.', { name: t(def.name) }));
    } else if (c.ignored > 2 && roll(s, .08)) c.severity = Math.min(1.5, (c.severity || 1) + .2);
  }
}

// ── Insurance and the clinic ──────────────────────────────────────────────────
export function outOfPocket(s, list) {
  const ins = s.insurance || { deductibleLeft: 0, coinsurance: .2 };
  const toDeductible = Math.min(list, Math.max(0, ins.deductibleLeft));
  const after = Math.max(0, list - toDeductible);
  return Math.round(toDeductible + after * ins.coinsurance);
}
export function clinicQuote(s, id) {
  const c = clinicById[id];
  if (!c) return null;
  const you = outOfPocket(s, c.list);
  return { ...c, you, covered: c.list - you };
}
export function visitClinic(s, id) {
  const c = clinicById[id];
  if (!c) throw new Error(t('That clinic is not on the plan. Neither is this one, technically.'));
  const you = outOfPocket(s, c.list);
  const ins = s.insurance;
  ins.deductibleLeft = Math.max(0, ins.deductibleLeft - c.list);
  charge(s, you, 'care');
  effects(s, { energy: c.energy, ...(c.effects || {}) });
  for (const [k, v] of Object.entries(c.flags || {})) s.flags[k] = v;
  const treated = (s.conditions || []).filter(x => c.treats.includes(x.id));
  if (treated.some(x => (x.ignored || 0) <= 2)) award(s, 'bodykept');
  for (const x of treated) clearCondition(s, x.id);
  const names = treated.map(x => t(conditionDefs[x.id].name));
  log(s, treated.length
    ? t('{clinic}: {names} treated. You paid ${you}; insurance paid ${covered} and will remind you of this.', { clinic: t(c.name), names: names.join(', '), you, covered: c.list - you })
    : t('{clinic}: nothing conclusive. You paid ${you} to be told to drink water and reduce stress.', { clinic: t(c.name), you }));
  // The bill that arrives after the bill.
  if (c.surprise && roll(s, c.surprise)) {
    const amount = Math.round(c.list * (.3 + random(s) * .5));
    s.bills = [...(s.bills || []), { id: `bill-${(s.bills || []).length}`, amount, due: s.month + 1 + Math.floor(random(s) * 2), from: c.id }];
  }
  return { you, treated: names };
}
// Surprise bills land at the start of a month, by mail, with a reply set.
export function dueBills(s) {
  const due = (s.bills || []).filter(b => b.due <= s.month);
  if (!due.length) return 0;
  s.bills = (s.bills || []).filter(b => b.due > s.month);
  let total = 0;
  for (const b of due) {
    total += b.amount;
    charge(s, b.amount, 'care');
    message(s, t('Billing Department'), t('Statement — this is not a bill'), t('This is not a bill. Enclosed is a bill for ${amount}. The provider you saw was in network; the person who handed them an instrument was not. Payment is due in fourteen days and the phone line is open Tuesdays between 10 and 11.', { amount: b.amount }), 'life', 'inbox', 'surpriseBill');
  }
  log(s, t('A surprise medical bill arrived: ${amount}. The care was covered. The billing was not.', { amount: total }));
  effects(s, { stress: 6, hope: -3 });
  return total;
}

// ── Money ─────────────────────────────────────────────────────────────────────
// Every outflow goes through here so a shortfall turns into debt instead of a negative balance.
export function charge(s, amount, bucket = null) {
  if (!amount) return 0;
  const st = s.player.stats;
  const paid = Math.max(0, Math.min(st.money, amount));
  st.money = Math.round(st.money - paid);
  const short = Math.round(amount - paid);
  if (short > 0) s.debt = Math.round((s.debt || 0) + short);
  if (bucket && s.spend) s.spend[bucket] = (s.spend[bucket] || 0) + amount;
  return short;
}
export function payDebt(s, amount) {
  const pay = Math.min(Math.max(0, Math.round(amount)), s.player.stats.money, s.debt || 0);
  if (pay <= 0) throw new Error(t('There is nothing to pay, or nothing to pay it with.'));
  s.player.stats.money -= pay;
  s.debt = Math.round(s.debt - pay);
  effects(s, { stress: -3, hope: 2 });
  log(s, t('Paid ${amount} against the card. Balance: ${rest}.', { amount: pay, rest: Math.round(s.debt) }));
}
export function setBudget(s, id) {
  if (!budgets[id]) throw new Error(t('That is not one of the ways to live.'));
  if (s.budget === id) return;
  s.budget = id;
  log(s, t('Living {mode} from now on. {blurb}', { mode: t(budgets[id].name).toLowerCase(), blurb: t(budgets[id].blurb) }));
}


// ── The crisis ────────────────────────────────────────────────────────────────
// Everything else in this game is a trade you choose. This is a fortnight taken from you, and it
// interrupts the turn rather than applying a drag you can absorb. The point is not the punishment;
// it is that afterwards the calendar has not moved and nobody adjusts anything.
export function crisisDue(s) {
  if (s.phase !== 'playing' || s.crisis) return null;
  if (s.month - (s.lastCrisisMonth ?? -99) < CRISIS_COOLDOWN) return null;
  const st = s.player.stats, hid = s.player.hidden;
  const worst = activeConditions(s).find(c => (c.severity || 1) >= 2);
  if (st.health <= CRISIS_HEALTH) return worst?.def?.clinic === 'urgent' ? 'infection' : 'collapse';
  if (hid.stress >= 88 && st.energy <= 18) return 'breakdown';
  if (worst && st.health < 40 && roll(s, .35)) return 'infection';
  return null;
}

export function openCrisis(s, id) {
  const def = crises[id];
  if (!def) return null;
  s.crisis = { id, month: s.month, resolved: false };
  s.lastCrisisMonth = s.month;
  s.stage = 'crisis';
  log(s, t(pick(s, def.text)));
  return s.crisis;
}

export function resolveCrisis(s, moveId) {
  const c = s.crisis;
  if (!c) throw new Error(t('There is nothing to deal with.'));
  const def = crises[c.id], move = crisisMoves[moveId];
  if (!move) throw new Error(t('That is not one of the options.'));
  const weeks = moveId === 'treat' ? def.weeks : moveId === 'minimum' ? Math.max(1, def.weeks - 1) : 0;
  const bill = moveId === 'ignore' ? 0 : outOfPocket(s, def.cost);
  if (bill) charge(s, bill, 'care');
  effects(s, { ...move.effects, energy: (move.effects.energy || 0) - weeks * 3 });
  if (weeks) s.leaveWeeks = (s.leaveWeeks || 0) + weeks;
  // Doing the minimum, or nothing, buys the same crisis back at a worse price.
  if (moveId === 'ignore') s.counts.crisisIgnored = (s.counts.crisisIgnored || 0) + 1;
  if (moveId === 'treat') s.counts.crisisTreated = (s.counts.crisisTreated || 0) + 1;
  if (move.recurs) s.lastCrisisMonth = s.month - Math.floor(CRISIS_COOLDOWN * (move.worse ? .3 : .55));
  if (move.worse) { const w = activeConditions(s)[0]; if (w?.def?.worsens) addCondition(s, w.def.worsens); }
  s.crisis = { ...c, resolved: true, move: moveId, weeks, bill };
  s.stage = 'plan';
  s.flags.afterCrisis = true;
  log(s, joined(t(move.line), bill ? ' ' : '', bill ? t('The visit cost you ${n} after insurance.', { n: bill }) : ''));
  // What comes next is the point: the deadline did not move.
  chat(s, 'advisor', s.advisor.name, t(pick(s, afterCrisis.advisor)));
  { const here = activeLabmates(s); if (here.length) chat(s, 'general', pick(s, here).name, fill(s, t(pick(s, afterCrisis.lab)))); }
  log(s, t(pick(s, afterCrisis.self)));
  award(s, 'thebody');
  if ((s.counts.crisisTreated || 0) >= 2) award(s, 'twocrisestreated');
  return s.crisis;
}
export const crisisMoveList = s => s.crisis && !s.crisis.resolved ? Object.values(crisisMoves) : [];

// The month's money, itemised. Called once per month from game.js.
export function monthlyLedger(s) {
  const interning = s.internship && s.month >= s.internship.start && s.month <= s.internship.end;
  const m = monthOf(s.month);
  const summerGap = [6, 7, 8].includes(m) && s.ta && !interning && !s.flags.summerTA && !s.flags.summerCovered;
  const stipend = interning
    ? Math.round(s.internship.salary || s.program.stipend * 1.75)   // what the offer actually said, which is sometimes worse
    : Math.round(s.program.stipend * (summerGap ? .4 : 1) * (s.flags.fundingGap ? .7 : 1)) + (s.flags.raise ? 150 : 0);
  const rent = s.program.rent + s.housing.rentDelta;
  const food = budgetOf(s).food + (s.flags.cat ? 45 : 0);
  const premium = s.insurance?.premium || 0;
  const fees = (m === PLAN_YEAR_MONTH || m === 1) ? (s.player.profile.international ? 980 : 720) : 0;
  const visa = s.player.profile.international && m === 4 ? 510 : 0;
  const interest = s.flags.hardship ? 0 : Math.round(Math.min(s.debt || 0, 20000) * .012);
  const remit = s.flags.remitting ? 250 : 0;
  const support = s.flags.hardship ? 400 : 0;
  const other = Math.round(145 + (s.housing.commute || 0) * 22);   // phone, transit, laundry, the thing that broke

  if (m === PLAN_YEAR_MONTH && s.insurance) { s.insurance.deductibleLeft = s.insurance.deductible; s.insurance.planYear++; }

  s.player.stats.money = Math.round(s.player.stats.money + stipend + support);
  s.debt = Math.round((s.debt || 0) + interest);
  const outflow = rent + food + premium + fees + visa + remit + other;
  charge(s, outflow);
  if (fees) s.spend && (s.spend.fees = (s.spend.fees || 0) + fees + visa);
  if (interest) s.spend && (s.spend.interest = (s.spend.interest || 0) + interest);
  if (remit) s.spend && (s.spend.sent = (s.spend.sent || 0) + remit);

  // Nobody carries a balance while sitting on cash: pay it down, keep a cushion.
  let repaid = 0;
  if ((s.debt || 0) > 0 && s.player.stats.money > 900) {
    repaid = Math.min(s.debt, s.player.stats.money - 900);
    if (repaid > 0) { s.player.stats.money -= repaid; s.debt = Math.round(s.debt - repaid); }
  }
  const note = interning ? (stipend < s.program.stipend ? t('Internship salary this month. It is less than the stipend, which you knew and took anyway.') : t('Internship salary this month. The company pays like the company.'))
    : summerGap ? t('Summer TA gap: the stipend is 40% of itself until September.')
      : s.flags.fundingGap ? t('Year-six funding gap: the stipend is 70% of itself.')
        : fees ? t('Term fees. Your tuition is waived; the fees are not tuition, which is how they survive.')
          : null;
  s.ledger = { month: s.month, stipend, support, rent, food, premium, fees, visa, remit, interest, other, repaid, debt: Math.round(s.debt || 0), note };
  return s.ledger;
}

// ── Caffeine ──────────────────────────────────────────────────────────────────
export function coffee(s) {
  const caf = s.caffeine = s.caffeine || { day: 0, week: 0, month: 0, lastCrash: -99 };
  caf.day++; caf.week++; caf.month++;
  charge(s, COFFEE.costMoney);
  const n = caf.day;
  effects(s, { energy: COFFEE.boost.energy - Math.max(0, n - 2) * 2, stress: n >= COFFEE.jitterAt ? 4 : 1 });
  let note = t(COFFEE.lines[Math.min(n, COFFEE.lines.length) - 1]);
  if (n >= COFFEE.crashAt) {
    effects(s, { health: -6, energy: -6, stress: 8 });
    caf.lastCrash = absWeek(s);
    award(s, 'caffeinated');
    if (!hasCondition(s, 'gastritis') && roll(s, .35)) addCondition(s, 'gastritis');
    note = t('Fifth cup. Your heart does something syncopated and you sit down on the floor of the kitchenette for a minute. Nobody sees. You get up.');
  } else if (n >= COFFEE.jitterAt) {
    effects(s, { health: -1.5 });
  }
  s.dayNote = note;
  return { cups: n, note, jitter: n >= COFFEE.jitterAt };
}
export const caffeineState = s => {
  const n = s.caffeine?.day || 0;
  return n >= COFFEE.crashAt ? 'crash' : n >= COFFEE.jitterAt ? 'jitter' : n > 0 ? 'wired' : 'flat';
};
export function skipMeal(s) {
  s.meals = s.meals || { skipped: 0, skippedMonth: 0 };
  s.meals.skipped++; s.meals.skippedMonth++;
  effects(s, { energy: -3, health: -2, stress: 2 });
  s.player.stats.money = Math.round(s.player.stats.money + 9);
  const lines = [
    t('You work through lunch. At 4 p.m. you eat a granola bar from a conference tote and call it a meal.'),
    t('Skipped lunch. You are running on coffee and the memory of breakfast.'),
    t('There is a vending machine on the second floor. There is also a deadline. You choose the deadline.'),
  ];
  s.dayNote = pick(s, lines);
  if (s.meals.skippedMonth >= 8 && !hasCondition(s, 'gastritis')) addCondition(s, 'gastritis');
  return s.dayNote;
}

// ── Vitals drift ──────────────────────────────────────────────────────────────
// Called once per resolved turn, scaled by how many weeks passed.

// Hope does not accumulate. Content grants far more of it than it costs — 121 choices give it,
// 65 take it — so without gravity a long run only ever gets more hopeful, which is the opposite
// of what the years do. This pulls hope toward a level your circumstances can actually sustain:
// acceptances and milestones raise the level, a long flat middle and a silent project lower it.
export function sustainableHope(s) {
  const st = s.player.stats, hid = s.player.hidden;
  const year = Math.floor(s.month / 12) + 1;
  const sag = { 1: 0, 2: 4, 3: 6, 4: 6, 5: 4, 6: 2 }[Math.min(6, year)] ?? 4;   // the long middle
  const recentWin = (s.counts.accepted || 0) > 0 && s.month - (s.lastAcceptMonth ?? -99) <= 6;
  return clamp(64
    + Math.min(14, (s.counts.accepted || 0) * 5)
    + (recentWin ? 8 : 0)
    + (s.milestones?.prelim === 'pass' ? 4 : 0)
    + (s.milestones?.proposal === 'pass' ? 5 : 0)
    + ((s.standing ?? 60) - 60) * .22
    + (s.relationship.satisfaction - 55) * .12
    - (hid.stress - 38) * .20
    - (st.health < 50 ? 9 : 0)
    - ((hid.loneliness || 0) > 60 ? 6 : 0)
    - Math.min(8, (s.debt || 0) / 1400)
    - sag);
}

export function vitalsDrift(s, weeks) {
  const st = s.player.stats, hid = s.player.hidden, b = budgetOf(s);
  const drag = conditionDrag(s);
  let health = 1.15;
  health += b.health / 3;
  health -= hid.stress > 65 ? 1.35 : hid.stress > 45 ? .55 : 0;
  health -= st.energy < 25 ? 1 : 0;
  health -= (s.caffeine?.week || 0) > 14 ? .5 : 0;
  health -= (s.meals?.skippedMonth || 0) > 6 ? .4 : 0;
  health -= s.burnoutMonths > 0 ? .5 : 0;
  health += s.flags.resolutionHealth ? .6 : 0;
  health += s.flags.therapy ? .4 : 0;
  health += Math.max(-1.3, drag.health || 0);   // a body can only be dragged down so fast
  health -= (hid.loneliness || 0) > 65 ? .3 : 0;
  // Below 30 the body starts fighting back on its own, the way bodies do.
  if (st.health < 25) health += .7;

  let lonely = 1 + (s.player.profile.international ? .8 : 0);
  const bonds = [...activeLabmates(s), ...s.peers];
  const avgBond = bonds.length ? bonds.reduce((a, x) => a + x.bond, 0) / bonds.length : 40;
  lonely -= avgBond > 60 ? .7 : avgBond > 45 ? .35 : 0;
  lonely -= s.flags.partner ? .8 : 0;
  lonely -= s.flags.social ? .4 : 0;
  lonely -= s.flags.cat ? .25 : 0;
  lonely += s.tempo === 'week' || s.tempo === 'day' ? .5 : 0;
  lonely += b.social < 0 ? .3 : b.social > 0 ? -.2 : 0;

  st.health = clamp(st.health + health * weeks);
  // Hope converges on what the circumstances support, rather than ratcheting upward forever.
  const target = sustainableHope(s);
  s.hopeTarget = target;           // read by effects() to damp gains you cannot sustain
  st.hope = clamp(st.hope + (target - st.hope) * (1 - Math.pow(1 - .045, weeks)));
  hid.loneliness = clamp((hid.loneliness || 0) + lonely * weeks);

  for (const [k, v] of Object.entries(drag)) if (k !== 'health') effects(s, { [k]: v * weeks });
  if (hid.loneliness > 70) effects(s, { hope: -.6 * weeks, stress: .5 * weeks });
  if (st.health < 35) effects(s, { energy: -1.2 * weeks, hope: -.4 * weeks });
}

export const healthBand = v => v >= 75 ? 'well' : v >= 50 ? 'tired' : v >= 30 ? 'rundown' : 'unwell';
export const healthWord = v => ({ well: t('Well'), tired: t('Tired'), rundown: t('Run down'), unwell: t('Unwell') }[healthBand(v)]);
export const lonelyWord = v => v >= 70 ? t('Isolated') : v >= 50 ? t('Lonely') : v >= 30 ? t('Some distance') : t('Connected');

// ── Life actions ──────────────────────────────────────────────────────────────
export function lifeActionAvailable(s, a) {
  const now = absWeek(s);
  if ((s.lifeCooldowns?.[a.id] || 0) > now) return t('done recently ({n} wk)', { n: (s.lifeCooldowns[a.id] || 0) - now });
  if (a.offCampus && s.player.profile.international) return t('Your visa does not permit off-campus work. The rule is the rule.');
  if (a.conditions?.minMonth !== undefined && s.month < a.conditions.minMonth) return t('not yet');
  if (a.conditions?.maxMoney !== undefined && s.player.stats.money > a.conditions.maxMoney) return t('you are not there yet, thankfully');
  if ((a.cost?.energy || 0) > s.player.stats.energy) return t('Not enough Energy.');
  return null;
}
export function doLifeAction(s, id) {
  const a = lifeActionById[id];
  if (!a) throw new Error(t('That is not something you can do right now.'));
  const why = lifeActionAvailable(s, a);
  if (why) throw new Error(why);
  if (a.cost?.money) charge(s, a.cost.money);
  const { loneliness, money, ...rest } = a.effects || {};
  effects(s, { energy: -(a.cost?.energy || 0), ...rest });
  if (money) s.player.stats.money = Math.round(s.player.stats.money + money);
  if (loneliness) s.player.hidden.loneliness = clamp((s.player.hidden.loneliness || 0) + loneliness);
  if (a.peerBond) for (const p of s.peers) p.bond = clamp(p.bond + a.peerBond);
  if (a.personality) s.player.personality[a.personality]++;
  for (const [k, v] of Object.entries(a.flags || {})) s.flags[k] = v;
  s.lifeCooldowns = { ...(s.lifeCooldowns || {}), [id]: absWeek(s) + a.cooldown };
  log(s, t(a.line));
  return t(a.line);
}

// Monthly bookkeeping for the life side.
export function monthlyLife(s) {
  // What you borrowed. It was eleven hours that felt like a superpower and it is charged to the
  // following month, which is the entire appeal and the entire problem.
  if (s.flags.borrowedFocus) {
    s.flags.borrowedFocus = false;
    effects(s, { energy: -9, health: -2, stress: 5 });
    log(s, t('The day after the day after. You are useless in a way that sleep does not touch, and you know exactly why, and you would probably do it again in April.'));
  }
  s.caffeine = s.caffeine || { day: 0, week: 0, month: 0, lastCrash: -99 };
  s.caffeine.month = 0; s.caffeine.week = 0; s.caffeine.day = 0;
  s.meals = s.meals || { skipped: 0, skippedMonth: 0 };
  s.meals.skippedMonth = 0;
  ageConditions(s);
  maybeCondition(s);
  dueBills(s);
  // How long you have been running on empty, which is the thing that actually gets people —
  // not one bad month but thirty of them with nobody counting.
  if (s.player.stats.health < 32) s.counts.lowHealthMonths = (s.counts.lowHealthMonths || 0) + 1;
  if (s.player.hidden.stress > 72) s.counts.highStressMonths = (s.counts.highStressMonths || 0) + 1;
}

// ── The year the money went ──────────────────────────────────────────────────────────────────
// Rare, and it happens to somebody in every cohort. The package is intact — that is the whole
// point of it — and the research year is gone, and only the first of those appears in a document.
export const onHardTA = s => !!s.raLost && s.month < s.raLost.until;

export function hardTaMonth(s) {
  if (s.phase !== 'playing') return;
  if (s.raLost) {
    if (s.month >= s.raLost.until) {
      // Either the money came back, or it did not and the year runs again.
      const back = roll(s, clamp(.45 + (s.advisor.funding - 40) / 90, .12, .9));
      if (back) {
        s.raLost = null; s.flags.hardTA = false;
        effects(s, { hope: 10, stress: -10 });
        log(s, t(pick(s, raBackText)));
        award(s, 'theyearthemoneywent');
      } else {
        s.raLost.until = s.month + HARD_TA.semesters * 5;
        s.raLost.years = (s.raLost.years || 1) + 1;
        effects(s, { hope: -12, stress: 10 });
        log(s, t(pick(s, raExtendText)));
      }
      return;
    }
    // The month itself.
    effects(s, { energy: HARD_TA.energy, progress: HARD_TA.progress, teaching: 2, stress: 3 });
    return;
  }
  // Does it start? Rare, and it needs the money to actually be gone.
  if (s.month < 14 || s.flags.fellow || s.milestones.graduated) return;
  if (s.month - (s.lastRaCheck ?? -99) < 6) return;
  s.lastRaCheck = s.month;
  // roll() floors its chance at 3%, so a computed risk of zero is not zero — with a check every
  // six months that turns "well funded, cannot happen" into about a quarter of all runs. Guard the
  // zero explicitly, and keep the rate genuinely rare: this is the thing that happens to somebody
  // in every cohort and almost never to you.
  // roll() both floors its chance at 3% and ceilings it at 97%, so it cannot express anything
  // rarer than 3% — with a check every six months that is a quarter of all runs, whatever number
  // you pass it. For genuinely rare things, compare against random() directly.
  const risk = (44 - s.advisor.funding) / 2200;
  if (risk <= 0 || random(s) >= risk) return;
  s.raLost = { since: s.month, until: s.month + HARD_TA.semesters * 5, years: 1 };
  s.ta = true;
  s.flags.hardTA = true;
  log(s, t(pick(s, raLostText)));
  pushHardTa(s);
}
// The conversation is an event so it has choices; life.js only owns the clock.
function pushHardTa(s) { s.eventQueue = [...(s.eventQueue || []), 'ra_lost']; }
