import { t } from '../i18n/index.js';
import { joined } from './state.js';

const roles = ['you', 'advisor', 'university', 'cofounder'];
export const legacyVenture = s => !s.venture && !!(s.flags.ipDisclosed || s.flags.ventureTerms || s.flags.ventureAfter || s.flags.ventureBoard);
export const ventureProject = s => s.projects.find(p => p.status === 'Accepted' && !p.prior && p.novelty >= 40 && p.evidence >= 40);
export function validVenture(v) {
  return v == null || (!!v && typeof v === 'object' && typeof v.id === 'string'
    && ['project', 'school', 'advisor'].every(k => v[k] && typeof v[k].id === 'string' && typeof v[k][k === 'project' ? 'title' : 'name'] === 'string')
    && Number.isInteger(v.startedMonth) && v.startedMonth >= 0 && typeof v.policyRead === 'boolean'
    && ['disclosed', 'considering', 'agreed', 'declined'].includes(v.status)
    && ['exploring', 'thesis-first', 'board', 'joined', 'declined'].includes(v.commitment)
    && (v.workloadPausedUntil == null || Number.isInteger(v.workloadPausedUntil))
    && (v.joinedMonth == null || Number.isInteger(v.joinedMonth))
    && (v.status !== 'agreed' || v.terms != null)
    && (!['board', 'joined'].includes(v.commitment) || v.status === 'agreed')
    && (v.terms == null || (Number.isInteger(v.terms.agreedMonth) && v.terms.shares
      && ['standard', 'advisor-reduced', 'university-reduced'].includes(v.terms.outcome)
      && roles.every(k => Number.isFinite(v.terms.shares[k]) && v.terms.shares[k] >= 0)
      && roles.reduce((n, k) => n + v.terms.shares[k], 0) === 100)));
}

// Eligibility reads the agreement, not old flags or whichever manuscript is selected today.
export function ventureEventEligible(s, id) {
  if (!id.startsWith('spin_')) return true;
  const v = s.venture;
  if (id === 'spin_review_legacy') return legacyVenture(s);
  if (id === 'spin_disclosure') return !v && !legacyVenture(s) && !!ventureProject(s);
  if (!v) return false;
  if (id === 'spin_advisor_idea') return v.status === 'disclosed';
  if (id === 'spin_captable') return v.status === 'considering';
  if (id === 'spin_decide') return v.status === 'agreed' && !['board', 'joined', 'declined'].includes(v.commitment) && !v.finalChoice;
  if (['spin_two_jobs', 'spin_advisor_absent'].includes(id)) return v.status === 'agreed' && v.commitment === 'exploring'
    && s.month >= (v.workloadPausedUntil || 0)
    && (id !== 'spin_advisor_absent' || (v.advisor.id === s.advisor?.id && s.month >= v.terms.agreedMonth + 5));
  return false;
}

export function ventureChoiceUnavailable(s, eventId, choice) {
  if (!eventId?.startsWith('spin_')) return null;
  if (!ventureEventEligible(s, eventId)) return t('This company decision is no longer current.');
  if (eventId === 'spin_review_legacy' && choice.id === 'restart' && !ventureProject(s)) return t('A new proposal needs an accepted research paper from this run.');
  if (eventId === 'spin_two_jobs' && choice.id === 'tell' && s.venture.advisor.id !== s.advisor?.id) return t('The founding advisor no longer supervises you. Protect your degree work directly.');
  return null;
}

export function ventureBindings(s, id) {
  if (!id?.startsWith('spin_')) return {};
  const v = s.venture;
  return v ? { project: v.project.title, advisor: v.advisor.name, school: v.school.name }
    : { project: ventureProject(s)?.title || '' };
}

function begin(s, policyRead, reviewedLegacy = false) {
  const p = ventureProject(s);
  if (!p) throw new Error(t('A new proposal needs an accepted research paper from this run.'));
  s.venture = { id: `venture-${p.id}`, project: { id: p.id, title: p.title },
    school: { id: s.program.id, name: s.program.name }, advisor: { id: s.advisor.id, name: s.advisor.name },
    startedMonth: s.month, status: 'disclosed', policyRead, terms: null, commitment: 'exploring',
    workloadPausedUntil: null, joinedMonth: null, reviewedLegacy };
  for (const key of ['ventureTerms', 'ventureNo', 'ventureAfter', 'ventureBoard', 'ventureDeferred']) delete s.flags[key];
  if (reviewedLegacy) {
    // This is a new proposal, not a replay of an old, unrecorded contract.
    for (const id of ['spin_advisor_idea', 'spin_captable', 'spin_two_jobs', 'spin_advisor_absent', 'spin_decide']) {
      delete s.seen[id]; delete s.cooldowns[id];
    }
    s.scheduled = s.scheduled.filter(item => !item.id.startsWith('spin_'));
    s.eventQueue = s.eventQueue.filter(id => !id.startsWith('spin_'));
  }
  s.flags.ipDisclosed = true;
}

export const equityLine = s => s.venture?.terms ? t('Company equity: you {you}%, advisor allocation {advisor}%, university {university}%, commercial cofounder allocation {cofounder}%.', s.venture.terms.shares) : '';

// Called once by resolveChoice, after the check and before its result is recorded.
export function resolveVentureChoice(s, eventId, choiceId, success) {
  if (eventId === 'spin_disclosure' && ['file', 'read'].includes(choiceId)) begin(s, choiceId === 'read');
  if (eventId === 'spin_review_legacy') {
    if (choiceId === 'restart') begin(s, false, true);
    else s.flags.ventureReviewDismissed = true;
    return '';
  }
  const v = s.venture;
  if (!v) return '';
  if (eventId === 'spin_advisor_idea') {
    v.status = choiceId === 'no' ? 'declined' : 'considering';
    v.commitment = choiceId === 'no' ? 'declined' : choiceId === 'finish' ? 'thesis-first' : 'exploring';
  }
  if (eventId === 'spin_captable') {
    if (choiceId === 'walk') { v.status = 'declined'; v.commitment = 'declined'; return ''; }
    const shares = { you: 40, advisor: 20, university: 15, cofounder: 25 };
    const outcome = choiceId === 'advisor' && success ? 'advisor-reduced' : choiceId === 'university' && success ? 'university-reduced' : 'standard';
    if (outcome === 'advisor-reduced') { shares.you += 10; shares.advisor -= 10; }
    if (outcome === 'university-reduced') { shares.you += 2; shares.university -= 2; }
    v.terms = { agreedMonth: s.month, outcome, shares }; v.status = 'agreed';
    s.flags.ventureTerms = outcome;
    return equityLine(s);
  }
  if (eventId === 'spin_two_jobs' && choiceId === 'tell' && success) v.workloadPausedUntil = s.month + 4;
  if (eventId === 'spin_decide') {
    v.finalChoice = choiceId; v.decidedMonth = s.month;
    v.commitment = choiceId === 'go' ? 'joined' : choiceId === 'board' ? 'board' : 'thesis-first';
    if (choiceId === 'go') v.joinedMonth = s.month;
  }
  return '';
}

export function ventureOffer(s) {
  const v = s.venture;
  if (!v?.terms || v.status !== 'agreed' || v.commitment !== 'thesis-first' || !s.thesis?.deposited || !s.milestones.graduated) return null;
  return ventureOfferView(s, { kind: 'founder', employerId: v.id, venture: true,
    salary: 0, months: 12, prestige: 2, permanence: 0, ceiling: 5 });
}

// Stored identity and numbers stay fixed; presentation follows the current language.
export function ventureOfferView(s, offer) {
  const v = s.venture;
  if (!offer?.venture || !v?.terms || offer.employerId !== v.id) return offer;
  return { ...offer,
    name: t('The company from “{title}”', { title: v.project.title }), org: t('Your research spinout'),
    where: v.school.name, equity: t('{n}% company equity', { n: v.terms.shares.you }),
    catch: t('No salary is committed. The shares are not money for rent.'),
    hook: t('Your degree is deposited. Joining is now a choice; the funding round still needs work.') };
}

export function chooseVentureCareer(s, offer) {
  const v = s.venture;
  if (!v || v.commitment !== 'thesis-first') return;
  if (offer?.venture && offer.employerId === v.id && ventureOffer(s)) { v.commitment = 'joined'; v.joinedMonth = s.month; }
  else v.commitment = 'declined';
}

export function ventureEnding(s) {
  const v = s.venture;
  if (!v?.terms) return null;
  return [t('Founder, with a cap table'), joined(
    t('You leave the program to work full time on the company built around “{title}”. The doctorate remains unfinished.', { title: v.project.title }), '\n\n',
    equityLine(s), '\n\n',
    t('There is no salary commitment. The next document is a budget, and the rent line cannot be paid in percentages. The agreement is signed; the company still has to be built.'))];
}
