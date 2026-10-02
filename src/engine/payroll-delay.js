import { effects, absWeek } from './state.js';

const AMOUNT = 1200;
export const validPayrollDelay = p => p == null || (typeof p === 'object' && !Array.isArray(p)
  && Number.isInteger(p.month) && p.month >= 0 && Number.isInteger(p.dueWeek) && p.dueWeek >= 0
  && p.amount === AMOUNT && [0, AMOUNT].includes(p.outstanding)
  && ['withheld', 'advanced', 'refunded'].includes(p.status)
  && (p.status === 'withheld') === (p.outstanding > 0));

// Old saves have no incident record. Only a recorded choice and check result can
// establish an unpaid amount; a scheduled apology alone is not evidence of debt.
function legacyIncident(s) {
  const history = s.history || [];
  const index = history.findLastIndex(h => h.i18n?.ev === 'stipend_late');
  if (index < 0) return null;
  const entry = history[index], ref = entry.i18n;
  if (!Number.isInteger(entry.month)) return null;
  const withheld = ref.ch === 'wait' || (ref.ch === 'emergency' && ref.r === 'failure');
  const advanced = ref.ch === 'emergency' && ref.r === 'success';
  if (!withheld && !advanced) return null;
  const refunded = history.slice(index + 1).some(h => h.i18n?.ev === 'stipend_fix' && h.i18n.ch === 'ok');
  return { month: entry.month, dueWeek: entry.month * 4 + (entry.week || 0) + 4,
    amount: AMOUNT, outstanding: withheld && !refunded ? AMOUNT : 0,
    status: refunded ? 'refunded' : advanced ? 'advanced' : 'withheld' };
}

export const payrollIncident = s => s.payrollDelay === undefined ? legacyIncident(s) : s.payrollDelay;
export function payrollEventEligible(s, id) {
  if (!['stipend_late', 'stipend_fix'].includes(id)) return true;
  const incident = payrollIncident(s), owed = (incident?.outstanding || 0) > 0;
  return id === 'stipend_fix' ? owed && absWeek(s) >= incident.dueWeek : !owed;
}

export function normalizePayrollDelay(s) {
  if (s.payrollDelay === undefined) s.payrollDelay = legacyIncident(s);
  const p = s.payrollDelay;
  if (s.phase === 'playing' && p?.outstanding > 0 && s.event !== 'stipend_fix'
    && !s.eventQueue.includes('stipend_fix') && !s.scheduled.some(x => x.id === 'stipend_fix')) {
    // Recover a documented unpaid incident even if an older retry limit dropped it.
    s.scheduled.push({ id: 'stipend_fix', week: Math.max(absWeek(s), p.dueWeek) });
  }
}

export function resolvePayrollChoice(s, eventId, choiceId, success) {
  if (eventId === 'stipend_late') {
    const advanced = choiceId === 'emergency' && success === true;
    s.payrollDelay = { month: s.month, dueWeek: absWeek(s) + 4, amount: AMOUNT,
      outstanding: advanced ? 0 : AMOUNT, status: advanced ? 'advanced' : 'withheld' };
    // The choice effects already applied the missing paycheck. The record tracks
    // what payroll still owes; an advance leaves cash unchanged and clears that debt.
    s.scheduled = s.scheduled.filter(x => x.id !== 'stipend_fix');
    if (!advanced) s.scheduled.push({ id: 'stipend_fix', week: s.payrollDelay.dueWeek });
  }
  if (eventId === 'stipend_fix') {
    normalizePayrollDelay(s);
    const p = s.payrollDelay;
    if (!p?.outstanding) return;
    effects(s, { money: p.outstanding });
    p.outstanding = 0; p.status = 'refunded';
    s.scheduled = s.scheduled.filter(x => x.id !== 'stipend_fix');
  }
}
