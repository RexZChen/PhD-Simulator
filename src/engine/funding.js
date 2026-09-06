// Money you brought in, or helped bring in. On an academic CV this is the line a search committee
// reads as evidence you can pay for yourself, and it is worth more than almost anything else on
// the page. On an industry CV nobody reads it at all.
import { t } from '../i18n/index.js';
import { clamp } from './probability.js';
import { effects, log, message, award } from './state.js';
import { ACADEMIC } from '../data/tracks.js';
import { venueById } from '../data/venues.js';

export const ensureFunding = s => (s.funding = s.funding || { records: [], applied: {}, helped: 0, rejected: 0 });

// What each kind is worth to a committee. A fellowship you won yourself outranks being named on
// somebody else's grant, which outranks being thanked in one, which outranks a travel award.
export const FUNDING_WEIGHT = { fellowship: 26, named: 18, acknowledged: 9, small: 4, declined: 6 };

export function addFunding(s, kind, { source = '', name = '', amount = 0, note = '' } = {}) {
  ensureFunding(s);
  if (!FUNDING_WEIGHT[kind]) throw new Error(t('That is not a kind of funding.'));
  const rec = { kind, source, name, amount: Math.round(amount), month: s.month, note };
  s.funding.records.push(rec);
  if (kind === 'fellowship') { s.flags.fellow = true; award(s, 'fundedyourself'); }
  if (kind === 'named') award(s, 'namedonit');
  if (s.funding.records.filter(r => r.kind !== 'small').length >= 3) award(s, 'thefundedone');
  return rec;
}

// Dollars you can legitimately claim on a CV. Being acknowledged on a grant is not the same as
// having brought it in, so it counts for a fraction of its face value.
export const claimable = r => r.kind === 'fellowship' || r.kind === 'named' ? r.amount
  : r.kind === 'acknowledged' ? Math.round(r.amount * .15)
    : r.kind === 'declined' ? 0 : r.amount;
export const fundingTotal = s => (s.funding?.records || []).reduce((a, r) => a + claimable(r), 0);

// 0-100, the number the CV and the market read. Diminishing: the first grant is the one that
// changes how the file is read; the fourth adds very little.
export function fundingScore(s) {
  const recs = s.funding?.records || [];
  if (!recs.length) return 0;
  // Sorted best-first and taperedheavily: the first piece of funding is the one that changes how
  // the file is read, and the fourth is a line nobody reaches.
  const taper = [1, .5, .26, .14, .08];
  const weighted = recs.map(r => FUNDING_WEIGHT[r.kind]).sort((a, b) => b - a)
    .reduce((a, w, i) => a + w * (taper[i] ?? .05), 0);
  const dollars = Math.min(18, Math.sqrt(fundingTotal(s) / 1400));
  return clamp(weighted * 1.7 + dollars);
}
export const hasMajorFunding = s => (s.funding?.records || []).some(r => ['fellowship', 'named'].includes(r.kind));

// The ace: enormous on an academic search, invisible in industry. This is the whole point of the
// system — a funded candidate is a candidate who costs the department less.
export function fundingBoost(s, employer) {
  const score = fundingScore(s);
  if (!score) return 0;
  const academic = ACADEMIC.includes(employer.track) || employer.track === 'postdoc';
  const softMoney = employer.track === 'soft_money' || employer.track === 'national_lab';
  const weight = academic ? .0022 : softMoney ? .0018 : employer.track === 'industry_research' ? .0005 : 0;
  return score * weight;
}


// ── Who gets asked, and whether it lands ──────────────────────────────────────
// A mediocre student is not asked to help write a grant. That is not cruelty; a proposal is the
// lab's next three years of salary and an advisor does not hand a section of it to somebody whose
// judgement they have not seen work. So the invitation itself is the recognition.
export function researchStanding(s) {
  const tier1 = s.projects.filter(p => p.status === 'Accepted' && venueById[p.venueId]?.tier === 1).length;
  const accepted = s.counts.accepted || 0;
  return clamp(
    tier1 * 16
    + (accepted - tier1) * 9
    + (s.milestones?.prelim === 'pass' ? 8 : 0)
    + (s.milestones?.proposal === 'pass' ? 12 : 0)
    + (s.player.skills.research - 50) * .35
    + (s.player.skills.writing - 50) * .2
    + (s.relationship.trust - 50) * .25
    + Math.min(10, (s.player.stats.academicCapital || 0) * .18)
    + Math.min(8, (s.conferenceConnections || 0) * .8));
}

// The bar for being asked. It rises with what the proposal is worth: nobody hands the big
// collaborative one to a second-year with a workshop paper.
export const ASK_BAR = { small: 24, single: 46, large: 62 };   // one paper and a passed prelim clears the small one
export function canBeAskedToHelp(s, size = 'single') {
  if (s.phase !== 'playing' || s.month < 18) return { ok: false, why: t('Too early. You have no record for them to judge yet.') };
  if (researchStanding(s) < ASK_BAR[size]) return { ok: false, why: t('Not yet. They have not seen enough of your judgement to give you a section of a proposal.') };
  if (s.relationship.trust < 40) return { ok: false, why: t('Not with the relationship where it is.') };
  return { ok: true, why: '' };
}

// Even a top student's help does not land a grant. The base rate is the base rate, the panel is
// three people who disagree, and your related-work section was never the reason.
export const GRANT_BASE = { small: .30, single: .19, large: .12 };
export function grantOdds(s, { size = 'single', help = 'none' } = {}) {
  const a = s.advisor;
  const helpTerm = { none: 0, minimal: .012, solid: .03, heroic: .045 }[help] ?? 0;
  return clamp(
    GRANT_BASE[size]
    + (a.prestige - 70) * .0016
    + (a.connections - 60) * .0011
    + (a.funding - 55) * .0009
    + Math.min(.03, (s.counts.accepted || 0) * .01)
    + helpTerm,
    .05, { small: .55, single: .40, large: .30 }[size] ?? .40);
}

// What your help was worth, once it is over. Being named requires that you did real work AND that
// the thing was funded — most of the time you did real work and it was not.
export function resolveHelp(s, { size = 'single', help = 'solid', awarded = false, name = '', amount = 0 } = {}) {
  ensureFunding(s);
  s.funding.helped = (s.funding.helped || 0) + 1;
  if (!awarded) { recordRejection(s, name); return { kind: null, awarded: false }; }
  // Named personnel is for substantial contribution; otherwise you are in the acknowledgements,
  // which is still a line and still worth having.
  const kind = help === 'heroic' || (help === 'solid' && size !== 'small') ? 'named' : 'acknowledged';
  const rec = addFunding(s, kind, { name, amount, source: 'advisor' });
  effects(s, { satisfaction: kind === 'named' ? 10 : 6, trust: 5, academicCapital: kind === 'named' ? 8 : 4, hope: 8, confidence: 6 });
  message(s, t('Office of Sponsored Programmes'), t('Award notice'),
    t('The proposal “{name}” has been recommended for funding in the amount of {amount}. Personnel listed on the award will be contacted regarding effort reporting, which is a phrase you will come to know well.', { name, amount: `$${amount.toLocaleString('en-US')}` }), 'portal', 'inbox', null);
  return { kind, awarded: true, record: rec };
}

// Applying for things is mostly a way of not getting them.
export function applyFunding(s, id, cost = { energy: 6 }) {
  ensureFunding(s);
  if (s.funding.applied[id]) throw new Error(t('You have already applied to that one this cycle.'));
  if (s.player.stats.energy < (cost.energy || 0)) throw new Error(t('Not enough Energy to write it properly, and it is not worth writing badly.'));
  s.funding.applied[id] = s.month;
  effects(s, { energy: -(cost.energy || 0), stress: 2 });
  return true;
}

export function recordRejection(s, name = '') {
  ensureFunding(s);
  s.funding.rejected = (s.funding.rejected || 0) + 1;
  effects(s, { hope: -4, confidence: -3 });
  if (s.funding.rejected === 3) { log(s, t('Three now. You have started reading the score before the reviews, and then not reading the reviews.')); award(s, 'threescores'); }
  return s.funding.rejected;
}

// The CV lines. A grant is not an award and should not sit in the same section as a best-paper.
export function fundingLines(s) {
  const recs = s.funding?.records || [];
  const out = [];
  const money = n => `$${n.toLocaleString('en-US')}`;
  for (const r of recs.filter(x => x.kind === 'fellowship')) out.push({ text: t('{name} — {amount}, held for the duration', { name: r.name || t('Graduate fellowship'), amount: money(r.amount) }), points: 12 });
  for (const r of recs.filter(x => x.kind === 'named')) out.push({ text: t('Named personnel, {name} ({amount})', { name: r.name || t('an awarded grant'), amount: money(r.amount) }), points: 9 });
  const ack = recs.filter(x => x.kind === 'acknowledged');
  if (ack.length) out.push({ text: t('Contributed to {n} funded proposal(s), acknowledged', { n: ack.length }), points: Math.min(8, ack.length * 4) });
  const small = recs.filter(x => x.kind === 'small');
  if (small.length) out.push({ text: t('{n} travel and equipment award(s), {amount} total', { n: small.length, amount: money(small.reduce((a, r) => a + r.amount, 0)) }), points: Math.min(6, small.length * 2) });
  for (const r of recs.filter(x => x.kind === 'declined')) out.push({ text: t('{name} — awarded, declined', { name: r.name || t('Fellowship') }), points: 5 });
  return out;
}
