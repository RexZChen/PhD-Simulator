import { medicalRecoveryQuote } from '../engine/life.js';
import { t } from '../i18n/index.js';
import { esc, money } from './helpers.js';

export function medicalRecoveryTerms(s) {
  const { weeks, bill } = medicalRecoveryQuote(s);
  const cash = Math.max(0, Math.min(s.player.stats.money, bill));
  const debt = Math.round(bill - cash);
  return `<section class="recovery-terms" aria-label="${esc(t('Recovery arrangement'))}">
    <h3>${esc(t('Take leave. Continue this run.'))}</h3>
    <dl class="recovery-facts"><div><dt>${esc(t('Medical leave'))}</dt><dd>${esc(t('{n} weeks', { n: weeks }))}</dd></div>
      <div><dt>${esc(t('Care bill (USD)'))}</dt><dd>${esc(money(bill))}<span>${esc(t('{cash} from cash · {debt} added to debt', { cash: money(cash), debt: money(debt) }))}</span></dd></div></dl>
    <ul class="recovery-notes"><li>${esc(t('Open advisor requests get {n} more weeks.', { n: weeks }))}</li><li>${esc(t('External deadlines keep their dates.'))}</li></ul>
  </section>`;
}

export function recoveryStatus(s) {
  if (!(s.leaveWeeks > 0) || !(s.medicalLeave || (s.crisis?.resolved && s.crisis.weeks > 0))) return '';
  // Leave is measured in five-day workweeks; suppress floating-point residue at day boundaries.
  const days = Math.max(1, Math.ceil(s.leaveWeeks * 5 - 1e-9));
  return `<section class="recovery-status" aria-label="${esc(t('Recovery leave'))}"><b>${esc(t('Recovery leave'))}</b><span>${esc(t(days === 1 ? '1 workday remaining' : '{n} workdays remaining', { n: days }))}</span><p>${esc(t('Work pauses during leave. Your run continues.'))}</p></section>`;
}
