import { legacyVenture } from '../engine/venture.js';
import { dateLabel } from '../data/calendar.js';
import { t } from '../i18n/index.js';
import { esc, btn } from './helpers.js';

const field = (label, value) => `<div><dt>${esc(t(label))}</dt><dd>${esc(value)}</dd></div>`;
const shareLabels = { you: 'Your share', advisor: 'Advisor allocation', university: 'University allocation', cofounder: 'Commercial cofounder allocation' };
function shareTable(shares) {
  return `<dl class="supervision-facts venture-shares">${Object.entries(shareLabels).map(([key, label]) => field(label, `${shares[key]}%`)).join('')}</dl>`;
}
function status(s) {
  const v = s.venture;
  if (v.commitment === 'declined') return t('Company route declined. The research remains yours.');
  if (v.commitment === 'joined') return t('Full-time founder · no salary committed');
  if (v.commitment === 'board') return t('Board role · separate from your main career');
  if (v.commitment === 'thesis-first') return t('Company tasks paused. Deposit the thesis, then decide whether to join.');
  if (s.month < v.workloadPausedUntil) return t('Company tasks paused until {date}.', { date: dateLabel(v.workloadPausedUntil) });
  return t(v.status === 'disclosed' ? 'Disclosure recorded · awaiting a proposal' : v.status === 'considering' ? 'Terms under discussion · nothing signed' : 'Agreement signed · exploring alongside the PhD');
}

export function ventureStatus(s) {
  const v = s.venture;
  if (!v && !legacyVenture(s)) return '';
  if (!v) return `<section class="supervision-status" aria-label="${esc(t('Research spinout'))}"><h3>${esc(t('Research spinout'))}</h3><p>${esc(t('An older company discussion has no recorded agreement. Review it to open a new proposal.'))}</p><div class="supervision-consult">${btn(t('Review company discussion'), 'venture-review')}</div></section>`;
  return `<section class="supervision-status venture-status" aria-label="${esc(t('Research spinout'))}">
    <h3>${esc(t('Research spinout'))}</h3><p>${esc(status(s))}</p>
    <details><summary>${esc(t('Project, people & equity'))}</summary>
      <dl class="supervision-facts">${field('Research project', v.project.title)}${field('Founding advisor', v.advisor.name)}${field('Founding institution', v.school.name)}</dl>
      ${v.terms ? `${shareTable(v.terms.shares)}<p>${esc(t('Company equity is separate from patent royalties. No salary is committed.'))}</p>` : ''}
    </details>
  </section>`;
}

export function ventureSceneTerms(s) {
  const shares = s.event === 'spin_captable' ? { you: 40, advisor: 20, university: 15, cofounder: 25 }
    : s.event === 'spin_decide' ? s.venture?.terms?.shares : null;
  return shares ? `<section class="supervision-terms" aria-label="${esc(t(s.event === 'spin_captable' ? 'Proposed company equity' : 'Agreed company equity'))}"><h3>${esc(t(s.event === 'spin_captable' ? 'Proposed company equity' : 'Agreed company equity'))}</h3>${shareTable(shares)}</section>` : '';
}
