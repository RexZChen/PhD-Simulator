import { retirementOffer, supervisionActive, canConsultEmeritus } from '../engine/supervision.js';
import { activeProject, editable } from '../engine/state.js';
import { dateLabel } from '../data/calendar.js';
import { t } from '../i18n/index.js';
import { esc, money, btn } from './helpers.js';

const field = (label, value) => `<div><dt>${esc(t(label))}</dt><dd>${esc(value)}</dd></div>`;
const dates = (from, until) => t('{from} through {until}', { from: dateLabel(from), until: dateLabel(until - 1) });

export function retirementTerms(s) {
  return `<section class="supervision-terms" aria-label="${esc(t('Retirement arrangements'))}">
    <p>${esc(t('All paths: a new local primary advisor. Completed work stays; pending internal reviews need resending.'))}</p>
  </section>`;
}

export function retirementChoiceTerms(s, c) {
  if (!c.retirement || c.retirement === 'local') return '';
  const offer = retirementOffer(s);
  const terms = c.retirement === 'coadvise' ? t('If agreed: optional check-in, 4 Energy, once per month.')
    : offer.months ? t('{dates} · {stipend}/month gross RA. Maintenance: −4 Energy, +2 stress per month; excused on leave.', { dates: dates(offer.from, offer.until), stipend: money(s.program.stipend) })
      : t('No funded handover months remain in this program.');
  return `<span class="supervision-choice-note">${esc(terms)}</span>`;
}

export function supervisionStatus(s) {
  if (!supervisionActive(s)) return '';
  const arrangement = s.supervision;
  const handover = arrangement.kind === 'handover';
  const project = s.projects.find(p => p.id === arrangement.projectId);
  const availability = !handover ? canConsultEmeritus(s) : null;
  return `<section class="supervision-status" aria-label="${esc(t('Your supervision arrangement'))}">
    <h3>${esc(t(handover ? 'Lab handover' : 'Primary advisor + emeritus mentor'))}</h3>
    <dl class="supervision-facts">${field('Primary advisor', s.advisor.name)}${field('Former advisor', arrangement.mentor.name)}
      ${handover ? `${field('Handover project', project?.title || t('Project record unavailable'))}${field('Departmental RA support', dates(arrangement.from, arrangement.until))}` : ''}
    </dl>
    ${handover ? `<p class="supervision-note">${esc(t('Funded months: −4 Energy, +2 stress. Maintenance is excused during leave.'))}</p>`
      : `<div class="supervision-consult"><p>${esc(t('Readiness +3 · stress −3'))}${editable(activeProject(s)) ? `<br>${esc(t('Active paper: progress +4 · evidence +2'))}` : ''}</p>${btn(t('Consult emeritus mentor · 4 Energy'), 'emeritus-consult', { disabled: !availability.ok })}<p>${esc(availability.ok ? t('Optional consultation, once per month.') : t(availability.why || 'Consultation is unavailable right now.'))}</p></div>`}
  </section>`;
}
