import { schools } from '../data/catalog.js';
import { monthOf } from '../data/calendar.js';
import { t } from '../i18n/index.js';
import { effects, log, award, newName, preserveStoryCast, TOTAL_MONTHS } from './state.js';
import { completeTenureDeparture } from './tenure.js';
import { endSupervision } from './supervision.js';

// A guarantee ending in July cannot answer a request about August's rent.
export function transferCoversRemainingSummer(s) {
  const month = monthOf(s.month), support = s.transferSupport;
  if (month < 3 || month > 8 || !support || support.schoolId !== s.program?.id) return false;
  const first = s.month + Math.max(0, 6 - month);
  const last = s.month + 8 - month;
  return support.from <= first && support.until > last;
}

const hash = text => {
  let n = 2166136261;
  for (const char of text) n = Math.imul(n ^ char.charCodeAt(0), 16777619) >>> 0;
  return n;
};

// Rendering a quote must never consume the run's random stream.
export function relocationQuote(s) {
  if (s.pendingRelocation) return structuredClone(s.pendingRelocation);
  if (s.phase !== 'playing' || !s.advisor || !s.program || s.month + 1 >= TOTAL_MONTHS) return null;
  const others = schools.filter(x => x.id !== s.program.id);
  const matching = others.filter(x => x.topics.includes(s.player.profile.topic));
  const pool = matching.length ? matching : others;
  if (!pool.length) return null;
  const destination = pool[hash(`${s.advisor.id}|${s.seed}`) % pool.length];
  return { advisorId: s.advisor.id, advisorName: s.advisor.name, fromSchoolId: s.program.id,
    schoolId: destination.id, schoolName: destination.name, moveMonth: s.month + 1,
    cost: 1600, stipend: destination.stipend, rent: destination.rent, supportMonths: Math.min(12, TOTAL_MONTHS - s.month - 1) };
}

export function commitRelocation(s) {
  if (s.pendingRelocation) return false;
  const quote = relocationQuote(s);
  if (!quote) return false;
  const debtBefore = s.debt || 0;
  effects(s, { money: -quote.cost });
  s.pendingRelocation = { ...quote, committedMonth: s.month, borrowed: (s.debt || 0) - debtBefore };
  log(s, t('Transfer arranged to {school}. Moving deposit: ${cost}. Arrival is next month; the new stipend and rent begin then.', { school: quote.schoolName, cost: quote.cost }));
  return true;
}

export const transferSupportActive = s => !!s.transferSupport
  && s.transferSupport.schoolId === s.program?.id
  && s.month >= s.transferSupport.from && s.month < s.transferSupport.until;

export function processRelocation(s) {
  const pending = s.pendingRelocation;
  if (!pending) return false;
  const destination = schools.find(x => x.id === pending.schoolId);
  if (s.advisor?.id !== pending.advisorId || s.program?.id !== pending.fromSchoolId || !destination) {
    const debtRefund = Math.min(s.debt || 0, pending.borrowed || 0);
    s.debt = (s.debt || 0) - debtRefund;
    effects(s, { money: pending.cost - debtRefund });
    s.relocationHistory ||= [];
    s.relocationHistory.push({ ...pending, status: 'cancelled', resolvedMonth: s.month, refunded: pending.cost });
    s.pendingRelocation = null;
    log(s, t('The transfer arrangement no longer matches your advisor or program. The move is cancelled and the ${cost} deposit is refunded.', { cost: pending.cost }));
    return false;
  }
  if (s.month < pending.moveMonth) return false;
  completeTenureDeparture(s);
  if (s.supervision?.kind === 'handover') endSupervision(s, 'relocated');
  preserveStoryCast(s);
  s.relocationHistory ||= [];
  s.relocationHistory.push({ ...pending, status: 'completed', resolvedMonth: s.month,
    previousProgram: structuredClone(s.program), previousHousing: structuredClone(s.housing),
    previousTeaching: { ta: s.ta, raLost: structuredClone(s.raLost || null) }, committee: [...(s.committee || [])] });
  s.program = structuredClone(destination);
  s.advisor.schoolId = destination.id;
  const catalogAdvisor = s.advisors.find(a => a.id === s.advisor.id);
  if (catalogAdvisor) catalogAdvisor.schoolId = destination.id;
  s.housing = { ...s.housing, rentDelta: 0, commute: 0 };
  for (const key of ['roommate', 'further', 'closer']) delete s.lifeCooldowns?.[key];
  for (const key of ['remoteAdvisor', 'hardTA', 'extraTA', 'summerTA', 'summerCovered', 'fundingGap', 'raise']) delete s.flags[key];
  s.raLost = null;
  s.ta = false;
  s.transferSupport = { advisorId: s.advisor.id, schoolId: destination.id, from: s.month, until: s.month + pending.supportMonths };
  for (const mate of s.labmates || []) if (mate.status === 'active') mate.schoolId = destination.id;
  for (const peer of s.peers || []) {
    peer.schoolId ||= pending.fromSchoolId;
    if (peer.status === 'active') peer.status = 'remote';
  }
  const faculty = s.advisors.filter(a => a.schoolId === destination.id && a.id !== s.advisor.id);
  for (let i = 0; i < 2; i++) {
    const professor = faculty[i];
    s.peers.push({ id: `peer-transfer-${s.relocationHistory.length}-${i}`, name: newName(s),
      labOf: professor?.name || newName(s), archetype: professor?.archetype || 'parent',
      fate: i ? 'struggle' : 'thrive', bond: 35, status: 'active', schoolId: destination.id });
  }
  s.flags.movedWithAdvisor = true;
  award(s, 'wentwiththem');
  s.pendingRelocation = null;
  log(s, t('Arrived at {school} with your advisor and lab. The new housing starts at ${rent} a month, with a ${stipend} gross monthly stipend and {months} months of RA support. Completed academic work and your continuing committee are preserved; your former cohort stays in touch remotely.', { school: destination.name, rent: destination.rent, stipend: destination.stipend, months: pending.supportMonths }));
  return true;
}
