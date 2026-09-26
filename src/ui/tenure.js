import { TENURE_EVENTS } from '../engine/tenure.js';
import { dateLabel } from '../data/calendar.js';
import { t } from '../i18n/index.js';
import { esc } from './helpers.js';

// Read the committed decision only; a reminder must never draw or migrate an outcome.
function currentNotice(s) {
  const notice = s.advisorTenure;
  if (s.pendingRelocation || !notice || notice.status !== 'notice' || notice.outcome !== 'denied'
    || notice.advisorId !== s.advisor?.id || notice.schoolId !== s.program?.id
    || !Number.isFinite(notice.departureMonth)) return null;
  return notice;
}
function remainingTime(s, notice) {
  const months = Math.max(0, Math.ceil(notice.departureMonth - s.month));
  return months === 0 ? t('Appointment end reached')
    : months === 1 ? t('1 month remaining') : t('{n} months remaining', { n: months });
}
export function tenureNotice(s) {
  const notice = currentNotice(s);
  if (!notice) return '';
  const remaining = remainingTime(s, notice);
  return `<section class="supervision-status" aria-label="${esc(t('Advisor appointment notice'))}">
    <h3>${esc(t('Advisor appointment notice'))}</h3>
    <dl class="supervision-facts"><div><dt>${esc(t('Advisor'))}</dt><dd>${esc(s.advisor.name)}</dd></div>
      <div><dt>${esc(t('Appointment ends'))}</dt><dd>${esc(dateLabel(notice.departureMonth))}<br>${esc(remaining)}</dd></div>
      <div><dt>${esc(t('Current institution'))}</dt><dd>${esc(s.program.name)}</dd></div></dl>
    <p class="supervision-note">${esc(t('No transfer is arranged. You remain at your current institution.'))}</p>
  </section>`;
}

export function tenureSceneNotice(s) {
  const notice = TENURE_EVENTS.has(s.event) && currentNotice(s);
  return notice ? `<p class="supervision-terms tenure-scene-notice">${esc(t('Appointment ends {date} · {remaining}.', { date: dateLabel(notice.departureMonth), remaining: remainingTime(s, notice) }))}</p>` : '';
}
