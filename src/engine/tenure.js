import { random, clamp } from './probability.js';
import { t } from '../i18n/index.js';

export const TENURE_EVENTS = new Set(['tenure_result', 'advisor_tenure_denied', 'advisor_leaves']);
export const TENURE_EVENT_IDS = TENURE_EVENTS;
const school = s => s.program?.id ?? s.advisor?.schoolId;
const bound = (s, r) => r && r.advisorId === s.advisor?.id && r.schoolId === school(s);
const live = s => bound(s, s.advisorTenure) && s.advisorTenure.status !== 'resolved' ? s.advisorTenure : null;

// Eligibility is intentionally read-only: neither rendering nor sampling commits a decision.
export function tenureEventEligible(s, id) {
  if (live(s)?.status === 'notice' && ['advisor_moves', 'advisor_retires', 'advisor_industry'].includes(id)) return false;
  if (!TENURE_EVENTS.has(id)) return true;
  const r = live(s);
  if (id === 'advisor_leaves') return !!r && r.outcome === 'denied' && r.status === 'notice' && s.month >= r.departureMonth && !s.pendingRelocation;
  const appointments = [s.formerAdvisors?.at(-1)?.departedMonth,
    s.relocationHistory?.filter(move => move.status === 'completed' && move.advisorId === s.advisor?.id).at(-1)?.resolvedMonth].filter(Number.isFinite);
  const assigned = appointments.length ? Math.max(...appointments) : null;
  const earliest = Number.isFinite(assigned) ? assigned + 12 : id === 'tenure_result' ? 24 : 14;
  return !r && !s.flags?.tenureDenied && s.advisor?.stage === 'pre_tenure' && s.month >= earliest;
}

export function clearAdvisorTenure(s, resolution = 'reassigned') {
  const r = s.advisorTenure;
  if (r) {
    const archived = { ...r, status: 'resolved', resolution, resolvedMonth: s.month };
    (s.advisorTenureHistory ||= []).push(archived);
    delete s.advisorTenure;
  }
  for (const key of ['tenureDenied', 'followingAdvisor', 'racingClock']) if (s.flags) delete s.flags[key];
  return !!r;
}
export const completeTenureDeparture = (s, resolution = 'relocated') => clearAdvisorTenure(s, resolution);

// Load/month-start hook. Old global `seen` is deliberately never used as identity evidence.
export function maintainTenure(s) {
  if (!s.advisor) return null;
  if (s.advisorTenure && !bound(s, s.advisorTenure)) clearAdvisorTenure(s, 'superseded');
  const r = s.advisorTenure;
  if (r && (!['granted', 'denied'].includes(r.outcome) || !Number.isFinite(r.announcedMonth))) {
    clearAdvisorTenure(s, 'invalid_legacy_record');
  }
  if (!s.advisorTenure && s.flags?.tenureDenied) {
    // Missing announcement date is not permission to send a student away immediately.
    s.advisorTenure = { advisorId: s.advisor.id, schoolId: school(s), outcome: 'denied', announcedMonth: s.month,
      departureMonth: s.month + 12, status: 'notice', eventId: 'legacy', response: null, migrated: true };
  }
  const current = live(s);
  if (current?.outcome === 'denied') {
    if (!Number.isFinite(current.departureMonth) || current.departureMonth < current.announcedMonth + 12) current.departureMonth = current.announcedMonth + 12;
    current.status = 'notice';
    (s.flags ||= {}).tenureDenied = true;
  }
  if (current?.outcome === 'granted') applyGrant(s);
  return current;
}
function applyGrant(s) {
  s.advisor.stage = 'mid_career';
  const catalog = s.advisors?.find(a => a.id === s.advisor.id);
  if (catalog) catalog.stage = 'mid_career';
  s.mutators = (s.mutators || []).filter(m => m !== 'tenure');
  if (s.flags) delete s.flags.tenureDenied;
}

export function openTenureEvent(s, id) {
  if (!TENURE_EVENTS.has(id)) return null;
  const existing = live(s);
  if (existing) return existing.eventId === id || (id === 'advisor_leaves' && tenureEventEligible(s, id)) ? existing : null;
  if (!tenureEventEligible(s, id) || id === 'advisor_leaves') return null;
  // The dedicated denial scene already has a seeded selection. The generic announcement
  // draws exactly once here, before any response, using the former prestige check odds.
  const outcome = id === 'advisor_tenure_denied' || random(s) >= clamp(.5 + ((s.advisor.prestige ?? 50) - 55) / 110, .1, .9) ? 'denied' : 'granted';
  const r = s.advisorTenure = { advisorId: s.advisor.id, schoolId: school(s), outcome,
    announcedMonth: s.month, departureMonth: outcome === 'denied' ? s.month + 12 : null,
    status: outcome === 'denied' ? 'notice' : 'decided', eventId: id, response: null };
  if (outcome === 'granted') { applyGrant(s); s.pressure = clamp((s.pressure || 0) - 15); }
  else { (s.flags ||= {}).tenureDenied = true; s.pressure = clamp((s.pressure || 0) + 8); }
  return r;
}

export function tenureAnnouncement(s, id) {
  if (id !== 'tenure_result') return null;
  const r = live(s);
  if (!r) return null;
  return r.outcome === 'granted'
    ? t('{advisor} turns the letter toward you. Tenure granted. The next grant deadline is still on the calendar, but this particular clock has stopped.')
    : t('{advisor} turns the letter toward you. Tenure denied. Their appointment ends in twelve months. No transfer is arranged today; you have notice, and a decision about whose lab to finish in.');
}
export function resolveTenureChoice(s, id, choiceId) {
  const r = live(s);
  if (!r || !TENURE_EVENTS.has(id)) return false;
  if (id === 'advisor_leaves') {
    if (!tenureEventEligible(s, id)) return false;
    r.departureChoice = choiceId;
    // Actual relocation, or newAdvisor, closes the record; signing alone is not arrival.
    return true;
  }
  if (r.eventId !== id || r.response !== null) return false;
  r.response = choiceId;
  r.respondedMonth = s.month;
  return true;
}
