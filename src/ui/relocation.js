import { relocationQuote, transferSupportActive } from '../engine/relocation.js';
import { schools } from '../data/catalog.js';
import { dateLabel } from '../data/calendar.js';
import { t } from '../i18n/index.js';
import { esc, money } from './helpers.js';
import { crest } from './avatars.js';

const field = (label, value, detail = '') => `<div class="relocation-field"><dt>${esc(t(label))}</dt><dd>${esc(value)}${detail ? `<span>${esc(detail)}</span>` : ''}</dd></div>`;
const schoolCard = (school, label, fallback = '') => `<div class="relocation-campus">${school ? `<span class="relocation-crest" aria-hidden="true">${crest(school, 32)}</span>` : ''}<div><span>${esc(t(label))}</span><b>${esc(school?.name || fallback)}</b></div></div>`;

function terms(s, quote, paid = false) {
  const from = schools.find(x => x.id === quote.fromSchoolId) || s.program;
  const to = schools.find(x => x.id === quote.schoolId);
  const borrowed = paid ? quote.borrowed || 0 : Math.round(Math.max(0, quote.cost - Math.max(0, s.player.stats.money)));
  const cash = quote.cost - borrowed;
  const split = t('{cash} from cash · {debt} added to debt', { cash: money(cash), debt: money(borrowed) });
  return `<div class="relocation-route">${schoolCard(from, 'From campus')}<span class="relocation-arrow" aria-hidden="true">→</span>${schoolCard(to, 'To campus', quote.schoolName)}</div>
    <dl class="relocation-facts">
      ${field('Arrival', dateLabel(quote.moveMonth))}
      ${field(paid ? 'Moving deposit · paid' : 'Moving deposit · due now', money(quote.cost), split)}
      ${field('New gross stipend / month', money(quote.stipend))}
      ${field('New base rent / month', money(quote.rent))}
      ${field('Departmental RA funding', t('{n} months · through {date}', { n: quote.supportMonths, date: dateLabel(quote.moveMonth + quote.supportMonths - 1) }))}
    </dl>
    <ul class="relocation-notes"><li>${esc(t('Completed coursework, exams, and your continuing committee carry over.'))}</li><li>${esc(t('Your housing arrangement resets; the new stipend and rent start on arrival.'))}</li></ul>`;
}

// A read-only quote: looking at a choice must not change cash, RNG or the destination.
export function relocationTerms(s) {
  const quote = relocationQuote(s);
  if (!quote) return '';
  return `<section class="relocation-terms" aria-label="${esc(t('Campus transfer terms'))}"><h3>${esc(t('Campus transfer terms'))}</h3>${terms(s, quote, !!s.pendingRelocation)}</section>`;
}

export function relocationPanel(s) {
  if (s.pendingRelocation) {
    const quote = s.pendingRelocation;
    return `<section class="relocation-panel" aria-label="${esc(t('Your campus transfer'))}"><div class="relocation-summary"><b>${esc(t('Transfer arranged'))}</b><span>${esc(t('{school} · arriving {date}', { school: quote.schoolName, date: dateLabel(quote.moveMonth) }))}</span></div><details><summary>${esc(t('View terms and paid deposit'))}</summary>${terms(s, quote, true)}</details></section>`;
  }
  if (!s.transferSupport || s.transferSupport.schoolId !== s.program?.id) return '';
  const active = transferSupportActive(s);
  return `<section class="relocation-panel" aria-label="${esc(t('Your campus transfer'))}"><div class="relocation-summary"><b>${esc(s.program.name)}</b><span>${esc(active
    ? t('Transfer RA support through {date}', { date: dateLabel(s.transferSupport.until - 1) })
    : t('Transfer RA support is no longer active.'))}</span></div></section>`;
}
