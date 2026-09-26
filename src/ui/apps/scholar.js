import { esc } from '../helpers.js';
import { icon } from '../icons.js';
import { avatar } from '../avatars.js';
import { myProfile, otherProfiles, comparison } from '../../engine/scholar.js';
import { diamondBar } from '../../engine/paper.js';
import { calendarOf } from '../../data/calendar.js';
import { topics } from '../../data/catalog.js';
import { t } from '../../i18n/index.js';

// Citations per year, as bars, because that is how the real one hooks you.
function yearChart(byYear, startYear, endYear) {
  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);
  const max = Math.max(1, ...years.map(y => byYear[y] || 0));
  // A chart of nothing is a large blank region with four year labels underlined along the bottom,
  // which reads as a rendering failure rather than as "no citations yet". Say it instead.
  const total = years.reduce((a, y) => a + (byYear[y] || 0), 0);
  if (!total) return `<div class="cite-chart empty"><p class="tiny muted">${t('No citations yet. There is a first one and it is almost always your advisor.')}</p></div>`;
  return `<div class="cite-chart" role="img" aria-label="${esc(t('Citations per year'))}">
    <div class="cc-bars">${years.map(y => {
      const n = byYear[y] || 0;
      return `<div class="cc-col" title="${esc(t('{n} citations in {y}', { n, y }))}"><b class="cc-n">${n || ''}</b><i style="height:${Math.max(2, (n / max) * 100)}%"></i><span class="cc-y">${String(y).slice(2)}</span></div>`;
    }).join('')}</div>
  </div>`;
}

import { patentEntry } from '../../engine/patent.js';

export function scholarApp(s, ui) {
  const me = myProfile(s);
  const others = otherProfiles(s).sort((a, b) => b.total - a.total);
  const thisYear = calendarOf(s.month).year;
  const startYear = calendarOf(0).year;
  const tab = ui.scholarTab || 'me';

  const patent = patentEntry(s);
  const recent = Object.entries(me.byYear).filter(([y]) => Number(y) >= thisYear - 4).reduce((a, [, n]) => a + n, 0);
  const metrics = `<aside class="sch-citations" aria-label="${esc(t('Citation overview'))}">
    <h3>${t('Cited by')}</h3>
    <table class="sch-metrics"><thead><tr><th></th><th scope="col">${t('All')}</th><th scope="col">${t('Since {y}', { y: thisYear - 4 })}</th></tr></thead><tbody>
      <tr><th scope="row">${t('Citations')}</th><td>${me.total}</td><td>${recent}</td></tr>
      <tr><th scope="row">${t('h-index')}</th><td>${me.h}</td><td>${me.h}</td></tr>
      <tr><th scope="row">${t('i10-index')}</th><td>${me.i10}</td><td>${me.i10}</td></tr>
    </tbody></table>
    ${yearChart(me.byYear, startYear, Math.max(startYear + 3, thisYear))}
  </aside>`;

  const meCard = `<div class="sch-profile-layout"><section class="sch-publications">
    <header class="sch-head">
      ${avatar(s.player.name, 72)}
      <div><h2>${esc(s.player.name)}</h2>
        <p>${esc(me.affiliation)}</p>
        <p class="sch-secondary">${s.milestones?.proposal === 'pass' ? t('PhD candidate') : t('PhD student')}</p>
        <p class="sch-verified">${esc(t('Verified email at {school}', { school: (me.affiliation || 'university').toLowerCase().replace(/\s+/g, '') + '.edu' }))}</p>
        <p class="sch-interest">${esc(t(topics[s.player.profile.topic] || ''))}</p>
      </div>
    </header>
    <div class="sch-section-title"><h3>${t('Indexed publications')}</h3><button class="sch-text-link" data-action="open" data-app="browser" data-page="openregret">OpenRegret →</button></div>
    ${me.papers.length || patent ? `<div class="sch-paper-list">
      <div class="sch-paper-heading"><span>${t('Title')}</span><span>${t('Cited by')}</span><span>${t('Year')}</span></div>
      ${patent ? `<article class="sch-paper sch-patent"><div><h4>${esc(patent.title)}</h4><p class="sch-metadata">${esc(patent.inventors)}</p><p class="sch-secondary">${esc(patent.venue)}</p></div><span class="sch-cite-count">${patent.n}</span><span class="sch-year">${patent.year}</span></article>` : ''}
      ${me.papers.map(p => {
        const project = s.projects.find(x => x.id === p.id);
        const authors = [s.player.name, ...(project?.collaborators || [])].join(', ');
        return `<article class="sch-paper"><details class="sch-paper-detail"><summary><h4>${esc(p.title)}</h4><span class="sch-detail-hint">${t('Publication details')}</span></summary>
          <div class="sch-paper-expanded"><p>${esc(authors)}</p><p>${esc(p.venue)} · ${p.year}</p><p>${diamondBar(p.diamonds)}${p.status === 'Accepted' ? '' : ` · ${t('preprint')}`}</p><p>${t('Cited by')} ${p.n}</p></div>
        </details><span class="sch-cite-count" aria-label="${esc(t('Cited by'))}">${p.n}</span><span class="sch-year">${p.year}</span>
        <p class="sch-metadata">${esc(authors)}</p><p class="sch-secondary sch-paper-venue">${esc(p.venue)}${p.status === 'Accepted' ? '' : ` · ${t('preprint')}`}</p></article>`;
      }).join('')}</div>` : `<div class="sch-empty"><p>${t('No indexed work yet. The page exists. That is all it does.')}</p></div>`}
    <p class="sch-comparison">${esc(comparison(s))}</p>
  </section>${metrics}</div>`;

  const people = [{ name: s.player.name, role: t('you'), total: me.total, h: me.h, kind: 'me' }, ...others].sort((a, b) => b.total - a.total);
  const leaderboard = `<section class="sch-people"><h2>${t('People you know')}</h2>
    ${people.map(o => `<article class="sch-person ${o.kind === 'me' ? 'sch-person-me' : ''}">${avatar(o.name, 48)}<div><h3>${esc(o.name)}</h3><p class="sch-metadata">${esc(o.role)}</p><p class="sch-person-counts">${t('Cited by')} <b>${o.total}</b><span>${t('h-index')} <b>${o.h}</b></span></p></div></article>`).join('')}
    <p class="sch-comparison">${t('Every number on this page is a proxy for something that does not have a number. You know this. You are still here.')}</p></section>`;

  return `<div class="scholar">
    <header class="sch-bar"><div class="sch-logo"><b><span>G</span><span>a</span><span>g</span><span>g</span><span>l</span><span>e</span></b><span>${t('Scholar')}</span></div>
      <div class="sch-search">${icon('people', 18)}<span>${esc(s.player.name)}</span></div></header>
    <div class="sch-layout"><nav class="sch-nav" aria-label="${esc(t('Scholar'))}">
      ${[['me', t('My profile')], ['everyone', t('People you know')]].map(([id, label]) => `<button class="sch-nav-link ${tab === id ? 'active' : ''}" data-action="scholar-tab" data-id="${id}" aria-current="${tab === id ? 'page' : 'false'}">${esc(label)}</button>`).join('')}
    </nav><div class="sch-body">${tab === 'me' ? meCard : leaderboard}</div></div>
  </div>`;
}
