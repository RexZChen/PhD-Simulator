import { t } from '../i18n/index.js';
import { effects, log, activeProject, editable, TOTAL_MONTHS } from './state.js';
import { clamp } from './probability.js';
import { monthOf } from '../data/calendar.js';

export function retirementOffer(s) {
  const from = s.month + 1, until = Math.min(TOTAL_MONTHS, from + 3);
  return { from, until, months: Math.max(0, until - from), maintenanceEnergy: 4, maintenanceStress: 2, mentorEnergy: 4 };
}

export const supervisionActive = s => !!s.supervision && s.supervision.advisorId === s.advisor?.id
  && (s.supervision.kind === 'coadvised' || (s.supervision.kind === 'handover'
    && s.supervision.schoolId === s.program?.id && s.month < s.supervision.until));
export const handoverSupportActive = s => supervisionActive(s) && s.supervision.kind === 'handover'
  && s.month >= s.supervision.from;
export function handoverCoversRemainingSummer(s) {
  if (!supervisionActive(s) || s.supervision.kind !== 'handover') return false;
  const month = monthOf(s.month);
  if (month < 3 || month > 8) return false;
  return s.supervision.from <= s.month + Math.max(0, 6 - month) && s.supervision.until > s.month + 8 - month;
}

export function reviewLegacySupervision(s) {
  if (s.phase !== 'playing' || !s.advisor || s.supervision) return;
  if (!s.supervisionReview && !(s.formerAdvisors?.length) && (s.flags.coadvised || s.flags.labInheritor)) {
    // A flag-only promise cannot identify a colleague or fund a contract retroactively.
    // Keep the current PI until the player reviews the concrete replacement terms.
    s.supervisionReview = { advisorId: s.advisor.id };
    delete s.flags.coadvised; delete s.flags.labInheritor;
  }
  if (s.supervisionReview?.advisorId !== s.advisor.id || s.leaveWeeks > 0 || s.event === 'advisor_retires') return;
  if (!s.eventQueue.includes('advisor_retires')) s.eventQueue.push('advisor_retires');
}

export function endSupervision(s, reason = 'advisor_changed') {
  if (!s.supervision) return;
  s.supervisionHistory ||= [];
  s.supervisionHistory.push({ ...structuredClone(s.supervision), endedMonth: s.month, reason });
  s.supervision = null;
  delete s.flags.coadvised;
  delete s.flags.labInheritor;
}

// The successor owns ordinary advising; the former PI is a distinct, optional reader.
// Reassignment is injected to keep the agreement independent of the advisor module.
export function arrangeRetirement(s, kind, success, reassign) {
  if (!['coadvise', 'handover', 'local'].includes(kind)) throw new Error(t('That is not a retirement arrangement.'));
  const p = activeProject(s), offer = retirementOffer(s);
  if (kind === 'handover' && (!editable(p) || !offer.months)) throw new Error(t('The handover needs an editable project and time remaining in the program.'));
  const mentor = { id: s.advisor.id, name: s.advisor.name, relationship: { ...s.relationship } };
  delete s.supervisionReview;
  reassign(s, 'retired');
  const former = s.formerAdvisors.find(a => a.id === mentor.id);
  if (former) former.retiredMonth = s.month;
  if (kind === 'coadvise' && success) {
    s.supervision = { kind: 'coadvised', advisorId: s.advisor.id, schoolId: s.program.id,
      mentor, since: s.month, lastConsultMonth: null };
    s.flags.coadvised = true;
    log(s, t('Prof. {primary} is your advisor of record. Prof. {mentor} remains available for one optional check-in each month.', { primary: s.advisor.name, mentor: mentor.name }));
  } else if (kind === 'handover') {
    s.supervision = { kind: 'handover', advisorId: s.advisor.id, schoolId: s.program.id,
      mentor, since: s.month, projectId: p.id, ...offer, lastMaintenanceMonth: null };
    s.flags.labInheritor = true;
    log(s, t('The department signs {months} months of RA support for the handover of “{title}”, starting next month. Monthly maintenance costs 4 Energy and adds 2 Stress; leave excuses it.', { months: offer.months, title: p.title }));
  }
}

export function maintainSupervision(s) {
  reviewLegacySupervision(s);
  const agreement = s.supervision;
  if (!agreement || s.phase !== 'playing') return;
  if (!supervisionActive(s)) {
    const expired = agreement.kind === 'handover' && s.month >= agreement.until;
    endSupervision(s, expired ? 'completed' : 'arrangement_changed');
    if (expired) {
      s.ta = !(s.flags.fellow && s.month < 12)
        && (s.month < 12 || s.advisor.funding < 50 || !!s.flags.extraTA || !!s.flags.hardTA);
      if (s.month >= 60 && s.advisor.funding < 60 && !s.ta && !s.flags.fellow && !s.flags.loan && !s.flags.finishFast) s.flags.fundingGap = true;
      log(s, t('The handover is complete. Its maintenance work and RA guarantee have ended; regular funding rules apply again.'));
    }
    return;
  }
  if (!handoverSupportActive(s) || agreement.lastMaintenanceMonth === s.month) return;
  s.ta = false;
  agreement.lastMaintenanceMonth = s.month;
  if (s.leaveWeeks > 0) {
    log(s, t('Handover maintenance is excused during your leave. The RA guarantee keeps its agreed dates.'));
    return;
  }
  effects(s, { energy: -4, stress: 2 });
  log(s, t('Handover maintenance: access lists, documentation, and the account nobody can close. −4 Energy; +2 Stress.'));
}

export function canConsultEmeritus(s) {
  if (!supervisionActive(s) || s.supervision.kind !== 'coadvised') return { ok: false, why: t('No emeritus check-in is arranged.') };
  if (s.phase !== 'playing' || s.stage !== 'plan') return { ok: false, why: t('Finish what is on screen first.') };
  if (s.leaveWeeks > 0) return { ok: false, why: t('The check-in can wait until your leave ends.') };
  if (s.supervision.lastConsultMonth === s.month) return { ok: false, why: t('You have already met this month. The next check-in is next month.') };
  if (s.player.stats.energy < 4) return { ok: false, why: t('Needs 4 Energy.') };
  return { ok: true, why: '' };
}

export function consultEmeritus(s) {
  const availability = canConsultEmeritus(s);
  if (!availability.ok) throw new Error(availability.why);
  effects(s, { energy: -4, readiness: 3, stress: -3 });
  const p = activeProject(s), a = s.supervision;
  a.lastConsultMonth = s.month;
  if (editable(p)) {
    p.progress = clamp(p.progress + 4);
    p.evidence = clamp(p.evidence + 2);
    a.lastProjectId = p.id;
    log(s, t('Prof. {name} reads “{title}” with you. One claim is smaller now. The next experiment is clearer. +4 Research; +2 Evidence; +3 Readiness; −3 Stress.', { name: a.mentor.name, title: p.title }));
  } else {
    a.lastProjectId = null;
    log(s, t('Prof. {name} helps you put the next steps in order. Submitted work stays with its reviewers. +3 Readiness; −3 Stress.', { name: a.mentor.name }));
  }
}
