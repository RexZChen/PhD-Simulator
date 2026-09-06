import { esc, group, tag } from '../helpers.js';
import { dateLabel, monthOf, daysIn, firstWeekday, holidays, semester } from '../../data/calendar.js';
import { venueById, venuesForTopic, nextDeadline } from '../../data/venues.js';
import { lastName } from '../../engine/state.js';
import { t } from '../../i18n/index.js';
export function calendarApp(s, ui) {
  const offset = firstWeekday(s.month), days = daysIn(s.month), m = monthOf(s.month);
  const marks = {};
  const add = (day, text, cls = '') => { (marks[day] = marks[day] || []).push({ text, cls }); };
  add(1, t('Stipend in · rent out'), 'gold');
  for (const h of holidays(s.month)) add(h.day, h.name, 'gray');
  const oneOnOne = { weekly: [4, 11, 18, 25], biweekly: [4, 18], monthly: [11], whenever: [] }[s.cadence.oneOnOne];
  for (const d of oneOnOne) if (d <= days) add(d, t('1:1 with {name}', { name: lastName(s.advisor.name) }), 'blue');
  const groupDays = { weekly: [3, 10, 17, 24], biweekly: [3, 17], monthly: [10] }[s.cadence.group] || [];
  for (const d of groupDays) if (d <= days) add(d, t('Group meeting'), 'blue');
  for (const p of s.projects) {
    if (p.targetMonth === s.month && p.targetVenue) add(Math.min(days, 28), t('{venue} deadline', { venue: p.targetVenue }), 'red');
    if (p.status === 'Submitted' && p.timeline) { if (p.timeline.rebuttal === s.month) add(15, `${t('Reviews')}: ${venueById[p.venueId]?.name}`, 'red'); if (p.timeline.decision === s.month) add(20, `${t('Decision')}: ${venueById[p.venueId]?.name}`, 'red'); }
    if (p.status === 'Rebuttal') add(Math.min(days, 27), t('Rebuttal due'), 'red');
    if (p.status === 'Accepted' && p.timeline?.conference === s.month) add(12, `${t('Conference')}: ${venueById[p.venueId]?.name}`, 'gold');
  }
  for (const v of venuesForTopic(s.player.profile.topic)) if (!v.rolling && v.deadlines.includes(m)) add(v.id === 'neuripsy' ? 15 : v.id === 'iclearn' ? 25 : 10, t('{venue} deadline', { venue: v.name }), 'red');
  if (s.milestones?.prelimMonth === s.month && !s.milestones.prelim) add(28, t('PRELIM'), 'red');
  if (s.milestones?.proposalMonth === s.month && s.milestones.prelim && !['pass'].includes(s.milestones.proposal)) add(28, t('PROPOSAL'), 'red');
  if (s.milestones?.defenseMonth === s.month) add(28, t('DEFENSE'), 'red');
  const today = s.week * 7 + 1;
  const upcoming = venuesForTopic(s.player.profile.topic).filter(v => !v.rolling).map(v => ({ v, at: nextDeadline(v, s.month + 1, monthOf) })).filter(x => x.at < 72 && x.at - s.month <= 4).sort((a, b) => a.at - b.at);
  const weekdays = [t('SUN'), t('MON'), t('TUE'), t('WED'), t('THU'), t('FRI'), t('SAT')];
  return `<div class="row between" style="margin-bottom:8px"><h1 style="margin:0">${dateLabel(s.month)}</h1><span class="muted small">${esc(semester(s.month))} · ${s.tempo === 'week' ? t('week {n} of 4', { n: Math.min(4, s.week + 1) }) : s.tempo === 'season' ? t('season view') : t('month view')}</span></div>
  <div class="calendar-grid">${weekdays.map(x => `<b>${x}</b>`).join('')}${Array.from({ length: offset }, () => '<div class="outside"></div>').join('')}${Array.from({ length: days }, (_, i) => `<div class="${s.tempo === 'week' && i + 1 >= today && i + 1 < today + 7 ? 'today' : ''}"><span>${i + 1}</span>${(marks[i + 1] || []).map(x => `<em class="${x.cls}" title="${esc(x.text)}">${esc(x.text)}</em>`).join('')}</div>`).join('')}</div>
  <div class="cols two" style="margin-top:10px">${group(t('Next few months'), upcoming.length ? `<ul class="small">${upcoming.map(({ v, at }) => `<li><b>${esc(v.name)}</b> — ${dateLabel(at)}</li>`).join('')}</ul>` : `<p class="muted small">${t('No relevant deadlines in the next four months. Enjoy the silence; it is not real.')}</p>`)}${group(t('Holidays this month'), holidays(s.month).length ? `<ul class="small">${holidays(s.month).map(h => `<li><b>${esc(h.name)}</b> — ${esc(h.note)}</li>`).join('')}</ul>` : `<p class="muted small">${t('None. The department does not believe in rest this month.')}</p>`)}</div>`;
}
