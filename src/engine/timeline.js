// The graduation timeline negotiation. From year four, the player has to ask — and the
// answer turns on the advisor's willingness at least as much as on the record.
import { t } from '../i18n/index.js';
import { stances, conditions, moves, secondOpinions } from '../data/timeline.js';
import { dateLabel, phdYear } from '../data/calendar.js';
import { random, roll, clamp, pick } from './probability.js';
import { effects, log, message, chat, award, lastName, vars, activeProject, joined } from './state.js';
import { paperQuality } from './paper.js';

export const TALK_OPENS = 36;          // year four
export const DEFENSE_WINDOW = { 5: 57, 6: 69 };   // month a target year defends in

// How strong the objective case is, 0-100. This is the part that is actually about the work.
export function gradRecord(s) {
  const best = s.projects.filter(p => p.kind !== 'thesis').reduce((m, p) => Math.max(m, p.progress * .5 + paperQuality(p) * .5), 0);
  const submitted = s.projects.some(p => ['Submitted', 'Rebuttal'].includes(p.status)) ? 8 : 0;
  return clamp(s.counts.accepted * 26 + (s.milestones.proposal === 'pass' ? 18 : 0) + s.readiness * .22 + best * .14 + submitted);
}
// How willing they are to let go of a productive, cheap, trained pair of hands.
export function gradWillingness(s) {
  const a = s.advisor, r = s.relationship;
  return clamp(50 + (a.caring - 50) * .5 + (r.trust - 50) * .4 + (r.satisfaction - 50) * .3
    - (a.ambition - 50) * .45 - (a.toxicity - 40) * .5 + ((s.standing ?? 60) - 60) * .2
    - (a.funding > 70 ? 6 : 0)
    + Math.min(12, (s.grad?.rounds || 0) * 4)          // asking again, later, genuinely moves them
    + (s.flags.committeeBacking ? 10 : 0));
}
// Whether the objection, when it comes, is about the work or about them.
export const objectionIsFair = s => gradRecord(s) < 45 || gradWillingness(s) >= 45;

export const ASK_COOLDOWN = 3;   // you cannot ask every month; a term has to pass
export const canAskTimeline = s => s.phase === 'playing' && s.month >= TALK_OPENS && !s.milestones.graduated
  && !(s.grad && s.grad.settled) && (!s.grad || !s.grad.asked || s.month - s.grad.askedMonth >= (s.grad.burned ? ASK_COOLDOWN * 2 : ASK_COOLDOWN));
export const askAgainIn = s => (s.grad && s.grad.asked && !s.grad.settled) ? Math.max(0, (s.grad.burned ? ASK_COOLDOWN * 2 : ASK_COOLDOWN) - (s.month - s.grad.askedMonth)) : 0;

export function openTimeline(s) {
  if (!canAskTimeline(s)) throw new Error(t('Too early to ask, or already settled. The question keeps.'));
  const record = gradRecord(s), willing = gradWillingness(s);
  const id = record < 35 ? 'notReady' : willing > 62 ? 'yes' : willing > 40 ? 'conditional' : 'deflect';
  const cond = id === 'conditional' ? pick(s, conditions) : null;
  const prior = s.grad || {};
  s.grad = {
    ...prior,
    asked: true, askedMonth: s.month, rounds: (prior.rounds || 0) + 1,
    stance: id, condition: cond ? cond.id : null,
    record: Math.round(record), willing: Math.round(willing),
    line: vars(t(pick(s, stances[id].lines)), { condition: cond ? t(cond.text) : '' }),
    settled: id === 'yes', targetYear: id === 'yes' ? 5 : null,
    used: [],
  };
  effects(s, { energy: -4, stress: id === 'yes' ? -8 : 6 });
  log(s, joined(t('You asked about finishing.'), ' ', s.grad.line));
  if (id === 'yes') settle(s, 5, t('They agreed in the room, without being pushed.'));
  return s.grad;
}

function settle(s, year, how) {
  s.grad = { ...(s.grad || {}), settled: true, targetYear: year, how };
  s.milestones.targetGradYear = year;
  const month = DEFENSE_WINDOW[year] || DEFENSE_WINDOW[6];
  s.milestones.plannedDefense = month;
  log(s, year === 5
    ? t('It is agreed: you are finishing in year five. {how} The date exists now, which changes what every month is for.', { how })
    : t('It is agreed: a sixth year. {how} It is the median outcome and it is not a defeat; it is just longer.', { how }));
  message(s, t('Graduate Studies'), t('Expected completion updated'),
    t('Your record now shows an expected completion in year {year}. This is an estimate and carries no obligation on the part of the university, your advisor, or the passage of time.', { year }),
    'portal', 'inbox', 'policies');
  chat(s, 'advisor', s.advisor.name, year === 5
    ? t('Right — May it is. I will start thinking about your letter. Do not make me regret the letter.')
    : t('Next year, then. It will be a better thesis and I know that is not what you wanted to hear.'));
  effects(s, year === 5 ? { hope: 14, confidence: 8, stress: -6 } : { hope: -8, stress: 4, satisfaction: 4 });
  if (year === 5) award(s, 'ontime');
}

export function timelineMoves(s) {
  const g = s.grad;
  if (!g || g.settled) return [];
  const used = g.used || [];
  const list = [];
  if (g.stance !== 'notReady') {
    list.push({ ...moves.evidence, done: used.includes('evidence') });
    list.push({ ...moves.date, done: used.includes('date') });
    list.push({ ...moves.committee, done: used.includes('committee') });
  }
  // The offer move only exists if there is an offer, and only once in a run.
  if (!used.includes('offer') && (s.jobs?.apps || []).some(a => a.stage === 'offer' && (a.deadlineMonth ?? 99) >= s.month))
    list.push({ ...moves.offer, done: false, danger: true });
  list.push({ ...moves.second, done: used.includes('second') });
  list.push({ ...moves.accept, done: false });
  return list;
}

export function playTimelineMove(s, id) {
  const g = s.grad;
  if (!g || g.settled) throw new Error(t('That conversation is over for now.'));
  if (g.burned) throw new Error(t('Not after that. You will have to let a term pass and come back to it.'));
  const move = moves[id];
  if (!move) throw new Error(t('That is not something you could say.'));
  if ((g.used || []).includes(id) && id !== 'accept') throw new Error(t('You have tried that. Trying it again is just repeating yourself.'));
  g.used = [...(g.used || []), id];

  if (id === 'accept') {
    settle(s, 6, t('You accepted the extra year.'));
    return { id, line: t(move.line), outcome: 'settled' };
  }

  if (id === 'second') {
    // The only move that buys information rather than ground.
    const fair = objectionIsFair(s);
    const line = t(pick(s, fair ? secondOpinions.fair : secondOpinions.unfair));
    g.knowsTruth = fair ? 'fair' : 'unfair';
    effects(s, { hope: fair ? -2 : 6, stress: fair ? 2 : -4 });
    award(s, 'askedaround');
    log(s, joined(t(move.line), ' ', line));
    return { id, line: `${t(move.line)} ${line}`, outcome: 'informed', fair };
  }

  if (id === 'offer') {
    const o = (s.jobs?.apps || []).find(a => a.stage === 'offer' && (a.deadlineMonth ?? 99) >= s.month);
    if (!o) throw new Error(t('You have no offer to put on the table.'));
    const legible = { tenure_track: 1, teaching_faculty: .9, abroad: .8, postdoc: .8, national_lab: .7, soft_money: .7, policy: .6, industry_research: .6, quant: .45, product_eng: .5, founder: .35 }[o.track] ?? .6;
    const clock = (o.deadlineMonth - s.month) <= 1 ? .18 : (o.deadlineMonth - s.month) <= 2 ? .10 : 0;
    const strength = clamp(legible * (.45 + Math.min(100, gradRecord(s)) / 100 * .55) + clock, 0, 1);
    const odds = clamp(.26 + strength * .40 + (gradWillingness(s) - 45) / 280 + gradRecord(s) / 600
      - (gradRecord(s) < 35 ? .16 : 0) - (s.advisor.ambition - 50) / 280 - (s.advisor.toxicity - 40) / 220
      - s.relationship.dependency / 500 + (s.flags.committeeBacking ? .07 : 0)
      + (s.jobs?.secret?.disclosed ? .05 : -.05), .12, .86);
    // One shadow roll, evaluated whether you win or lose. It is never shown.
    const shadow = roll(s, clamp(.34 - (s.advisor.caring - 50) * .008 + (s.advisor.toxicity - 40) * .010
      + (s.advisor.ambition - 50) * .006 - (s.relationship.trust - 50) * .006 + (s.relationship.dependency - 20) * .004
      - (s.jobs?.secret?.disclosed ? .10 : 0) - (s.flags.committeeBacking ? .05 : 0), .04, .74));
    const won = roll(s, odds);
    const text = `${t(move.line)} ${t(won ? move.good : move.bad)}`;
    log(s, text);
    s.flags.usedOfferAsLeverage = true;
    if (shadow) s.letterDrag = (s.letterDrag || 0) + (won ? 1 : 2);
    award(s, 'leverage');
    if (won) {
      effects(s, { trust: shadow ? 0 : 4, hope: 16 });
      settle(s, 5, t('You put an offer on the table and the table moved.'));
      return { id, line: text, outcome: 'settled', won: true };
    }
    effects(s, { satisfaction: shadow ? -14 : -8, conflict: shadow ? 18 : 6, hope: -10, stress: shadow ? 12 : 4, ...(shadow ? { trust: -6 } : {}) });
    if (shadow) { g.burned = true; s.standing = clamp((s.standing ?? 60) - 4); }
    return { id, line: text, outcome: 'open', won: false };
  }

  const record = gradRecord(s), willing = gradWillingness(s);
  const base = {
    evidence: .28 + record / 260 + s.player.skills.communication / 300 + s.player.skills.writing / 400,
    date: .22 + (s.player.stats.confidence - 45) / 240 + record / 400,
    committee: .24 + s.player.skills.networking / 260 + (s.relationship.conflict < 40 ? .08 : -.08) + (s.counts.accepted ? .1 : -.06),
  }[id];
  const odds = clamp(base + (willing - 45) / 260 - (s.advisor.toxicity - 40) / 320, .08, .88);
  const won = roll(s, odds);
  const text = `${t(move.line)} ${t(won ? move.good : move.bad)}`;
  log(s, text);

  if (won) {
    if (id === 'committee') { s.flags.committeeBacking = true; effects(s, { academicCapital: 4, satisfaction: -5, conflict: 6 }); }
    if (id === 'date') { s.player.personality.boundarySetter++; effects(s, { confidence: 6 }); }
    if (id === 'evidence') { s.player.personality.independent++; effects(s, { trust: 5 }); }
    // A won move upgrades the stance one step; two wins from a deflection still gets you out.
    if (g.stance === 'deflect') { g.stance = 'conditional'; g.condition = pick(s, conditions).id; effects(s, { hope: 8 }); }
    else { settle(s, 5, t('You made the case and it landed.')); award(s, 'heldthedate'); return { id, line: text, outcome: 'settled', won }; }
  } else {
    effects(s, { satisfaction: id === 'committee' ? -10 : -5, stress: 6, hope: -4, ...(id === 'committee' ? { conflict: 10 } : {}) });
  }
  return { id, line: text, outcome: g.settled ? 'settled' : 'open', won };
}

// A condition, once agreed, is checked every month. Meeting it settles the year.
export function checkCondition(s) {
  const g = s.grad;
  if (!g || g.settled || g.stance !== 'conditional' || !g.condition) return;
  const c = conditions.find(x => x.id === g.condition);
  if (!c) return;
  const met = {
    accepted: () => s.counts.accepted > (g.acceptedAt ?? s.counts.accepted),
    submitted: () => s.projects.some(p => ['Submitted', 'Rebuttal', 'Accepted'].includes(p.status)),
    draft: () => s.projects.some(p => p.kind === 'thesis' && p.draft >= 90),
    handover: () => !!s.flags.documented || s.counts.requestsDone >= 6,
  }[c.check];
  if (g.acceptedAt === undefined) { g.acceptedAt = s.counts.accepted; return; }
  if (met && met()) {
    settle(s, 5, t('You met the condition they set, and they kept their word.'));
    award(s, 'metthebar');
  }
}

// If the player never asks, the default is the long road — stated once, without judgement.
export function timelineDrift(s) {
  if (s.phase !== 'playing' || s.milestones.graduated) return;
  checkCondition(s);
  if (s.month === TALK_OPENS && !s.grad?.asked) {
    chat(s, 'advisor', s.advisor.name, t('Year four. At some point we should talk about what finishing looks like. Whenever you are ready.'));
    log(s, t('Year four begins. Nobody will start the conversation about finishing except you.'));
  }
  if (s.month === 52 && !s.grad?.settled) {
    log(s, t('Nobody has said the word “finishing” out loud in eighteen months. The sixth year is arriving by default, which is how most sixth years arrive.'));
    s.milestones.targetGradYear = s.milestones.targetGradYear || 6;
  }
}
