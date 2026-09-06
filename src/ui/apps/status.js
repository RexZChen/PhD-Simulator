import { esc, bar, group, tag, money, tier, band, btn } from '../helpers.js';
import { icon } from '../icons.js';
import { backgrounds, topics, mutators } from '../../data/catalog.js';
import { labmateRoles, labmateTraits } from '../../data/names.js';
import { personality, lastName } from '../../engine/state.js';
import { healthBand, healthWord, activeConditions, lonelyWord } from '../../engine/life.js';
import { conditions as conditionDefs } from '../../data/life.js';
import { MODES } from '../../engine/advisor.js';
import { t } from '../../i18n/index.js';
const bondWord = b => b >= 70 ? t('close') : b >= 50 ? t('friendly') : b >= 30 ? t('cordial') : t('distant');
export function statsBars(s) {
  const st = s.player.stats;
  const hb = healthBand(st.health);
  return `${bar(t('Hope'), st.hope, { cls: 'gold', title: t('Belief in the PhD. Low Hope slows everything and makes quitting likelier.') })}${bar(t('Energy'), st.energy, { cls: 'green', title: t('Short-term fuel. Below 25, productivity halves.') })}${bar(t('Health'), st.health, { cls: hb === 'unwell' ? 'red' : hb === 'rundown' ? 'gold' : 'green', title: t('Sleep, food, stress, and every appointment you have postponed.') })}${bar(t('Confidence'), st.confidence, { title: t('Willingness to push back, submit, and argue.') })}`;
}
export function sideStatus(s) {
  const st = s.player.stats;
  const caption = st.health < 35 ? t('You are unwell and working anyway. Life.exe has a list of people who could help.') : s.burnoutMonths > 0 ? t('Burnout: {n} month(s) of slower everything.', { n: s.burnoutMonths }) : s.player.hidden.stress > 70 ? t('You keep opening tabs and forgetting why.') : s.player.hidden.stress > 45 ? t('Your shoulders have been up here for a while.') : t('For the moment, there is room to breathe.');
  const conds = activeConditions(s);
  return `${statsBars(s)}<div class="money-line" title="${esc(t('Stipend minus rent, food, insurance, and whatever happened'))}"><span class="small muted">${t('Funds')}</span><b class="${st.money < 500 ? 'low' : ''}">${money(st.money)}</b></div>${s.debt > 0 ? `<div class="row between small"><span class="muted">${t('On the card')}</span><b class="low">−${money(s.debt)}</b></div>` : ''}<div class="row between small"><span class="muted">${t('Academic capital')}</span><b>${Math.round(st.academicCapital)}</b></div>${conds.length ? `<div class="small" style="margin-top:4px">${conds.slice(0, 2).map(c => tag(t(c.def.name), 'warn')).join(' ')}${conds.length > 2 ? ` <span class="tiny muted">+${conds.length - 2}</span>` : ''}</div>` : ''}<p class="tiny muted" style="margin:6px 0 0">${caption}</p>`;
}
export function statusApp(s, ui) {
  const [title, desc] = personality(s);
  const traitOf = id => labmateTraits.find(x => x.id === id)?.label || id;
  const roleOf = id => labmateRoles.find(r => r.id === id)?.label || id;
  return `<div class="cols two"><div>${group(`${esc(s.player.name)}`, `<p class="small muted">${esc(backgrounds[s.player.profile.background].name)} · ${s.player.profile.international ? t('international') : t('domestic')} ${t('student')} · ${esc(topics[s.player.profile.topic])} · ${t('Year {n} at {school}', { n: Math.floor(s.month / 12) + 1, school: s.program.name })}</p>${statsBars(s)}<div class="row between" style="margin-top:6px"><span>${t('Funds')}</span><b>${money(s.player.stats.money)}</b></div><div class="row between"><span>${t('Academic capital')}</span><b>${Math.round(s.player.stats.academicCapital)}/100</b></div>`)}
  ${group(t('Skills, approximately'), `<table class="grid">${Object.entries(s.player.skills).map(([k, v]) => `<tr><td>${t(k)}</td><td class="num">${tier(v)}</td></tr>`).join('')}</table>`)}
  ${group(t('Tendencies'), `<p><b>${esc(title)}</b> <span class="muted small">(${t('so far')})</span><br><span class="small muted">${esc(desc)}</span></p>`)}</div>
  <div>${group(t('Advisor'), `<p><b>${t('Prof. {name}', { name: s.advisor.name })}</b> · ${esc(t(MODES[s.advisorMode?.id || 'normal'].label))}<br><span class="small muted">${t('Ambition')} ${band(s.advisor.ambition)} · ${t('Prestige')} ${band(s.advisor.prestige)} · ${t('Connections')} ${band(s.advisor.connections)} · ${t('Funding')} ${band(s.advisor.funding)}</span></p><p class="small">${t('Trust')}: <b>${band(s.relationship.trust)}</b> · ${t('Satisfaction')}: <b>${band(s.relationship.satisfaction)}</b> · ${t('Dependency')}: <b>${band(s.relationship.dependency)}</b> · ${t('Conflict')}: <b>${s.relationship.conflict > 60 ? t('high') : s.relationship.conflict > 30 ? t('some') : t('low')}</b></p><p class="small">${t('Meetings: {held} held, {cancelled} cancelled, {presented} group presentations. Requests: {done} done, {declined} declined, {expired} expired.', { held: s.meetingStats.held, cancelled: s.meetingStats.cancelled, presented: s.meetingStats.presented, done: s.counts.requestsDone, declined: s.counts.requestsDeclined, expired: s.counts.requestsExpired })}</p>${s.advisor.known?.length ? `<ul class="hint-list">${s.advisor.known.map(k => `<li>${esc(k)}</li>`).join('')}</ul>` : `<p class="tiny muted">${t('What the lab knows about them, you will learn late at night.')}</p>`}`)}
  ${group(t('The lab'), `<div class="listview people-list"><div class="lv-head"><span>${t('Name')}</span><span>${t('Role')}</span><span>${t('Trait')}</span><span>${t('Bond')}</span></div>${s.labmates.map(l => `<div class="lv-row"><span>${esc(l.name)}</span><span class="small">${esc(roleOf(l.role))}</span><span class="small">${esc(traitOf(l.trait))}</span><span class="small">${bondWord(l.bond)}</span></div>`).join('')}</div>`)}
  ${group(t('Cohort (other labs)'), `<div class="listview people-list"><div class="lv-head"><span>${t('Name')}</span><span>${t('Lab')}</span><span>${t('Status')}</span><span>${t('Bond')}</span></div>${s.peers.map(p => `<div class="lv-row"><span>${esc(p.name)}</span><span class="small">${t('Prof. {name}', { name: lastName(p.labOf) })}</span><span class="small">${t(p.status)}</span><span class="small">${bondWord(p.bond)}</span></div>`).join('')}</div>`)}
  ${group(t('This run’s conditions'), `<ul class="small">${s.mutators.map(id => { const mu = mutators.find(x => x.id === id); return `<li><b>${esc(mu?.name || id)}</b> — <span class="muted">${esc(mu?.desc || '')}</span></li>`; }).join('')}</ul>`)}</div></div>`;
}
