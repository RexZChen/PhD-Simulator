import { esc, btn, group, tag } from '../helpers.js';
import { icon } from '../icons.js';
import { avatar } from '../avatars.js';
import { myProfile, otherProfiles, comparison } from '../../engine/scholar.js';
import { diamondBar } from '../../engine/paper.js';
import { calendarOf } from '../../data/calendar.js';
import { t } from '../../i18n/index.js';

// Citations per year, as bars, because that is how the real one hooks you.
function yearChart(byYear, startYear, endYear) {
  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);
  const max = Math.max(1, ...years.map(y => byYear[y] || 0));
  return `<div class="cite-chart" role="img" aria-label="${esc(t('Citations per year'))}">
    <div class="cc-bars">${years.map(y => {
      const n = byYear[y] || 0;
      return `<div class="cc-col" title="${esc(t('{n} citations in {y}', { n, y }))}"><b class="cc-n">${n || ''}</b><i style="height:${Math.max(2, (n / max) * 100)}%"></i><span class="cc-y">${String(y).slice(2)}</span></div>`;
    }).join('')}</div>
  </div>`;
}

export function scholarApp(s, ui) {
  const me = myProfile(s);
  const others = otherProfiles(s).sort((a, b) => b.total - a.total);
  const thisYear = calendarOf(s.month).year;
  const startYear = calendarOf(0).year;
  const tab = ui.scholarTab || 'me';

  const meCard = `<div class="sch-head">
    ${avatar(s.player.name, 64)}
    <div><h2>${esc(s.player.name)}</h2><p class="muted small">${esc(me.affiliation)} · ${t('PhD student')}${s.milestones?.proposal === 'pass' ? ` · ${t('PhD candidate')}` : ''}</p>
    <p class="tiny muted">${esc(s.player.profile.topic ? t('Verified email at {school}', { school: (me.affiliation || 'university').toLowerCase().replace(/\s+/g, '') + '.edu' }) : '')}</p></div>
    <table class="sch-metrics"><tr><th></th><th>${t('All')}</th><th>${t('Since {y}', { y: thisYear - 4 })}</th></tr>
      <tr><td>${t('Citations')}</td><td><b>${me.total}</b></td><td>${Object.entries(me.byYear).filter(([y]) => Number(y) >= thisYear - 4).reduce((a, [, n]) => a + n, 0)}</td></tr>
      <tr><td>${t('h-index')}</td><td><b>${me.h}</b></td><td>${me.h}</td></tr>
      <tr><td>${t('i10-index')}</td><td><b>${me.i10}</b></td><td>${me.i10}</td></tr>
    </table>
  </div>
  ${yearChart(me.byYear, startYear, Math.max(startYear + 3, thisYear))}
  ${me.papers.length ? `<div class="listview sch-list"><div class="lv-head"><span>${t('Title')}</span><span>${t('Cited by')}</span><span>${t('Year')}</span></div>
    ${me.papers.map(p => `<div class="lv-row"><span><b>${esc(p.title)}</b><br><span class="muted tiny">${esc(p.venue)} · ${diamondBar(p.diamonds)}${p.status === 'Accepted' ? '' : ` · ${t('preprint')}`}</span></span><span class="num"><b>${p.n}</b></span><span class="num">${p.year}</span></div>`).join('')}</div>`
    : `<p class="muted small">${t('No indexed work yet. The page exists. That is all it does.')}</p>`}
  <p class="small muted" style="margin-top:8px">${esc(comparison(s))}</p>`;

  const leaderboard = `<div class="listview sch-list sch-board"><div class="lv-head"><span>${t('Name')}</span><span>${t('Role')}</span><span>${t('Cited by')}</span><span>${t('h')}</span></div>
    ${[{ name: s.player.name, role: t('you'), total: me.total, h: me.h, kind: 'me' }, ...others].sort((a, b) => b.total - a.total).map(o => `<div class="lv-row ${o.kind === 'me' ? 'me' : ''}"><span>${esc(o.name)}</span><span class="small muted">${esc(o.role)}</span><span class="num"><b>${o.total}</b></span><span class="num">${o.h}</span></div>`).join('')}</div>
    <p class="tiny muted">${t('Every number on this page is a proxy for something that does not have a number. You know this. You are still here.')}</p>`;

  return `<div class="scholar">
    <div class="sch-bar"><span class="sch-logo">${icon('book', 18)} <b>Gaggle</b> ${t('Scholar')}</span>
      <span class="sch-search">${esc(s.player.name.split(' ').at(-1))} ${esc(s.player.profile.topic)}</span>
      <span class="tiny muted">${t('About {n} results ({s} sec)', { n: 40000 + s.month * 137, s: '0.' + (31 + (s.month % 40)) })}</span></div>
    <div class="tabs">${[['me', t('My profile')], ['everyone', t('People you know')]].map(([id, label]) => `<button class="btn tab ${tab === id ? 'active' : ''}" data-action="scholar-tab" data-id="${id}">${esc(label)}</button>`).join('')}</div>
    <div class="sch-body">${tab === 'me' ? meCard : leaderboard}</div>
  </div>`;
}
