import { t } from '../i18n/index.js';
import { effects, log, award } from './state.js';

export const validFamilyVisit = v => v == null || (typeof v === 'object' && !Array.isArray(v)
  && ['reapply', 'stream', 'home'].includes(v.plan) && Number.isInteger(v.plannedMonth) && v.plannedMonth >= 0
  && typeof v.travelPaid === 'boolean' && typeof v.completed === 'boolean'
  && (v.visaApproved == null || typeof v.visaApproved === 'boolean'));

export function normalizeFamilyVisit(s) {
  if (!s.familyVisit && s.flags.hoodingHome) {
    // This old choice charged $900 immediately. Preserve that payment and any old
    // achievement, but do not infer a defense, deposit or completed family ceremony.
    s.familyVisit = { plan: 'home', plannedMonth: s.cooldowns.parents_visa ?? s.month,
      travelPaid: true, completed: false, legacy: true };
  }
  if (s.phase === 'epilogue' && s.epilogue && !s.epilogue.finished && familyCelebrationDue(s)
    && !s.epilogue.beats.includes('family_celebration')) {
    s.epilogue.beats.splice(s.epilogue.index, 0, 'family_celebration');
  }
}

export function recordFamilyPlan(s, choiceId, success) {
  s.familyVisit = { plan: choiceId === 'after' ? 'home' : choiceId === 'stream' ? 'stream' : 'reapply',
    plannedMonth: s.month, defenseMonth: s.milestones.defenseMonth, travelPaid: false, completed: false,
    ...(choiceId === 'reapply' ? { visaApproved: success === true } : {}) };
}

export function familyDefense(s) {
  const v = s.familyVisit;
  if (v?.plan !== 'stream' || v.completed || s.milestones.defense !== 'pass') return;
  v.completed = true;
  log(s, t('After the defense, you stay on the video call with your parents. They heard the questions and the result. You explain that the revisions and deposit still come next.'));
}

export const familyCelebrationDue = s => s.familyVisit?.plan === 'home' && !s.familyVisit.completed
  && !!s.thesis?.deposited && !!s.milestones.graduated;
export const familyTravelTerms = s => t(s.familyVisit?.travelPaid
  ? 'The travel is already paid for. There is no second charge.'
  : 'Making the trip costs $900. You can also leave the visit for another time.');

export function finishFamilyCelebration(s, choiceId) {
  if (!familyCelebrationDue(s)) throw new Error(t('The family celebration waits until the degree is deposited.'));
  const v = s.familyVisit;
  if (choiceId === 'go') {
    if (!v.travelPaid) effects(s, { money: -900 });
    v.travelPaid = true;
    award(s, 'hoodedathome');
  }
  v.completed = true;
  v.outcome = choiceId === 'go' ? 'celebrated' : 'deferred';
}
