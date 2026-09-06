import { esc, btn, titlebar, menubar, statusbar, tag, money } from './helpers.js';
import { icon, appDefs } from './icons.js';
import { dateLabel, monthOf } from '../data/calendar.js';
import { SHORT_DISCLAIMER } from '../data/names.js';
import { lastName, noticeText } from '../engine/state.js';
import { MODES } from '../engine/advisor.js';
import { managerApp, reportDialog } from './apps/manager.js';
import { mailApp } from './apps/mail.js';
import { chatApp } from './apps/chat.js';
import { browserApp } from './apps/browser.js';
import { portalApp } from './apps/portal.js';
import { calendarApp } from './apps/calendar.js';
import { statusApp, sideStatus } from './apps/status.js';
import { lifeApp } from './apps/life.js';
import { scholarApp } from './apps/scholar.js';
import { tripScreen } from './apps/trip.js';
import { commencementScreen, epilogueScreen } from './apps/commencement.js';
import { cities as conferenceCities } from '../data/conference.js';
import { setupWizard, endingApp, collectionApp, aboutDialog, tipsDialog, confirmDialog, shutdownDialog } from './screens.js';
import { gradApply, threadDialog } from './apps/gradapply.js';
import { sceneDialog, milestoneDialog, pushbackDialog, lectureDialog } from './scenes.js';
import { t, languages, getLanguage } from '../i18n/index.js';

const reminders = () => [t('You cannot optimize your way out of being a person.'), t('A finished project is a contribution. A perfect project is a rumor.'), t('Reply to the collaborator. (You will not.)'), t('Buy milk. Cite milk.'), t('The deadline is not a person. It cannot be disappointed in you.'), t('Water the plant. Water yourself.')];

export function bootScreen() {
  return `<div class="boot" data-action="boot-skip"><div><div class="logo">ACADEMIC OS</div><div class="lines"><span>${t('Checking memory ........ 640K (should be enough)')}</span><span>${t('Loading potential ........ OK')}</span><span>${t('Locating funding ......... pending')}</span><span>${t('Mounting /home/student ... OK')}</span><span>${t('Work-life balance ........ not found')}</span><span>${t('Starting desktop ......... ')}</span></div></div><div class="hint">${t('Click anywhere to skip.')}</div></div>`;
}

function windowTitle(s, ui) {
  if (ui.screen === 'home') return [t('Academic OS Setup'), 'wizard'];
  if (ui.screen === 'collection') return [t('Achievements & discoveries'), 'star'];
  if (['prep', 'application', 'interviews', 'admissions'].includes(s?.phase)) return ['GradApply 98', 'doc'];
  if (s?.phase === 'ending') return [t('Transcript — {name}', { name: s.player.name }), 'doc'];
  if (s?.stage === 'commencement') return [t('Commencement'), 'star'];
  if (s?.stage === 'epilogue') return [t('After — {name}', { name: s.player.name }), 'doc'];
  if (s?.stage === 'trip' && s.trip) return [t('{venue} — {city}', { venue: s.trip.venueName, city: t(conferenceCities[s.trip.cityId]?.name || '') }), 'plane'];
  const def = appDefs.find(a => a[0] === ui.app) || appDefs[0];
  return [t(def[2]), def[1]];
}

function content(s, ui, meta, saved, notices) {
  if (ui.screen === 'home' || !s && ui.screen !== 'collection') return setupWizard(ui, meta, saved, notices);
  if (ui.screen === 'collection') return collectionApp(meta, s);
  if (['prep', 'application', 'interviews', 'admissions'].includes(s.phase)) return gradApply(s, ui);
  if (s.phase === 'epilogue') return epilogueScreen(s, ui);
  if (s.phase === 'ending') return endingApp(s, meta);
  if (s.stage === 'trip' && s.trip) return tripScreen(s, ui);
  if (s.stage === 'commencement' && s.cv) return commencementScreen(s, ui);
  if (s.stage === 'epilogue' && s.epilogue) return epilogueScreen(s, ui);
  return { dashboard: managerApp, mail: mailApp, chat: chatApp, browser: browserApp, portal: portalApp, calendar: calendarApp, life: lifeApp, scholar: scholarApp, status: statusApp }[ui.app || 'dashboard'](s, ui);
}

export function shell(run, ui, meta, saved, notices = []) {
  const s = run;
  if (ui.screen === 'boot') return bootScreen();
  const playing = ui.screen === 'game' && s?.phase === 'playing' && !['trip', 'commencement', 'epilogue'].includes(s?.stage);
  const [title, ic] = windowTitle(s, ui);
  const stress = playing ? s.player.hidden.stress : 0;
  const health = playing ? s.player.stats.health : 100;
  const season = playing ? monthOf(s.month) : 9;
  const unreadMail = s?.inbox.filter(m => !m.read).length || 0;
  const unreadChat = s?.chatMessages.filter(m => !m.read && !m.mine).length || 0;
  const openReq = s?.requests?.filter(r => r.status === 'open').length || 0;
  const phaseLabel = { prep: t('Fall 2027'), application: t('December 2027'), interviews: t('January–March 2028'), admissions: t('April 2028') };
  const menuRight = playing ? `${esc(dateLabel(s.month))}${s.tempo === 'week' ? ` · ${t('wk {n}', { n: Math.min(4, s.week + 1) })}` : ''}` : ui.screen === 'home' ? t('Please read the license. It is short.') : s ? phaseLabel[s.phase] || '' : '';
  const isWizard = ui.screen === 'home' || (!s && ui.screen !== 'collection');
  const mode = playing ? MODES[s.advisorMode?.id || 'normal'] : null;
  const trayDate = playing ? esc(dateLabel(s.month)) : ui.screen === 'home' ? t('September 2027') : s ? ({ prep: t('October 2027'), application: t('December 2027'), interviews: t('February 2028'), admissions: t('April 2028') }[s.phase] || esc(dateLabel(Math.min(71, s.month)))) : '09:41';
  return `<div class="desktop season-${season} ${stress > 70 ? 'frayed' : stress > 45 ? 'stressed' : ''} ${health < 30 ? 'unwell' : health < 50 ? 'rundown' : ''} ${meta.settings.quiet ? 'quiet' : ''}">
  <nav class="desktop-icons" aria-label="${esc(t('Desktop'))}">${appDefs.map(([id, ic2, label]) => `<button class="desk-icon ${playing && ui.app === id ? 'active' : ''}" data-action="open" data-app="${id}" ${playing ? '' : 'disabled'} title="${esc(t(label))}">${icon(ic2, 32)}<span>${t(label)}</span>${id === 'mail' && unreadMail ? `<b class="badge">${unreadMail}</b>` : ''}${id === 'chat' && unreadChat ? `<b class="badge" title="${esc(t('{n} unread message(s)', { n: unreadChat }))}">${unreadChat}</b>` : ''}${id === 'chat' && !unreadChat && openReq ? `<b class="badge req" title="${esc(t('{n} open request(s) from your advisor', { n: openReq }))}">!</b>` : ''}</button>`).join('')}<button class="desk-icon" data-action="collection" title="${esc(t('Achievements'))}">${icon('star', 32)}<span>${t('Achievements')}</span></button></nav>
  <main class="workspace ${playing ? '' : 'no-side'}">
    <section class="window ${ui.minimized ? 'minimized' : ''} ${isWizard ? 'wizard-window' : ''}" aria-label="${esc(title)}">${titlebar(esc(title), ic)}${menubar([t('File'), t('Edit'), t('View'), t('Help')], menuRight)}<div class="client" style="${isWizard ? 'padding:0;display:grid;grid-template-rows:minmax(0,1fr) auto' : ''}">${content(s, ui, meta, saved, notices)}</div>${statusbar([ui.saveError ? '⚠ ' + esc(ui.saveError) : playing ? esc(noticeText(s)) : t(SHORT_DISCLAIMER), s ? t('Seed {seed}', { seed: s.seed }) : t('Offline'), ui.saveError ? t('Not saved') : t('Autosave on')])}</section>
    ${playing ? `<aside class="sidebar"><div class="mini"><div class="titlebar"><span class="tb-title">${icon('status', 14)}<span>${esc(s.player.name)}</span></span></div><div class="body">${sideStatus(s)}</div></div>
    <div class="mini"><div class="titlebar"><span class="tb-title">${icon('user', 14)}<span>${t('Prof. {name}', { name: lastName(s.advisor.name) })}</span></span></div><div class="body"><div class="presence ${['checkedOut', 'traveling'].includes(s.advisorMode?.id) ? 'off' : s.advisorMode?.id === 'grant' ? 'away' : s.advisorMode?.id === 'pressed' ? 'typing' : ''}"><i></i>${esc(t(mode.presence))}</div><div class="small muted">${esc(t(mode.label))} · ${t('1:1s {cadence}', { cadence: t(s.cadence.oneOnOne) })}</div>${openReq ? `<div class="small" style="margin-top:4px">${tag(t('{n} open request(s)', { n: openReq }), 'warn')}</div>` : ''}<div class="row" style="margin-top:6px">${btn(t('Message'), 'open', { app: 'chat', cls: 'small' })}${btn(t('Requests'), 'open', { app: 'dashboard', cls: 'small link' })}</div></div></div>
    <div class="sticky"><span class="pin"></span>${esc(reminders()[(s.month + s.seed) % 6])}<small>— notes.txt</small></div></aside>` : ''}
    ${ui.minimized ? `<div style="color:#fff;place-self:center;text-align:center">${t('Your desk is still here.')}<br><br>${btn(t('Restore window'), 'restore')}</div>` : ''}
  </main>
  <div class="watermark">${t('DOING SCIENCE.')}<br>${t('PROBABLY.')}</div>
  <footer class="taskbar">${btn(`${icon('wizard', 18)} ${t('Start')}`, 'start-menu', { cls: 'start' })}<span class="sep"></span>${btn(`${icon(ic, 16)} <span style="overflow:hidden;text-overflow:ellipsis">${esc(title)}</span>`, 'restore', { cls: `task ${ui.minimized ? '' : 'active'}` })}<div class="tray"><span class="tray-text" title="${esc(t('Text size'))}"><button data-action="text-size" data-id="down" ${(meta.settings.textSize ?? 1) <= 0 ? 'disabled' : ''} title="${esc(t('Smaller'))}">A−</button><button data-action="text-size" data-id="up" ${(meta.settings.textSize ?? 1) >= 4 ? 'disabled' : ''} title="${esc(t('Bigger'))}">A+</button></span><button data-action="sound" title="${meta.settings.sound ? esc(t('Sound on')) : esc(t('Sound off'))}">${icon(meta.settings.sound ? 'sound' : 'mute', 16)}</button>${playing && s.tempo === 'week' ? `<span title="${esc(t('Crunch: weeks pass one at a time'))}">${icon('coffee', 16)}</span>` : ''}<span class="date">${trayDate}</span></div></footer>
  ${ui.startMenu ? `<div class="start-menu"><div class="start-brand">ACADEMIC<small>OS</small></div><div class="start-items">${playing ? appDefs.map(([id, ic2, label]) => `<button data-action="open" data-app="${id}">${icon(ic2, 18)} ${t(label)}</button>`).join('') + '<hr>' : ''}<button data-action="home">${icon('wizard', 18)} ${t('Setup / Welcome')}</button><button data-action="collection">${icon('star', 18)} ${t('Achievements')}</button><button data-action="tips">${icon('info', 18)} ${t('Tips')}</button><button data-action="about">${icon('info', 18)} ${t('About & disclaimer')}</button><hr>${languages.map(([id, label]) => `<button data-action="language" data-id="${id}">${icon('doc', 18)} ${getLanguage() === id ? '● ' : '○ '}${label}</button>`).join('')}<hr><button data-action="sound">${icon(meta.settings.sound ? 'sound' : 'mute', 18)} ${t('Sound')}: ${meta.settings.sound ? t('on') : t('off')}</button><button data-action="quiet">${icon('moon', 18)} ${t('Visual effects')}: ${meta.settings.quiet ? t('reduced') : t('on')}</button><div class="menu-stepper">${icon('doc', 18)} <span>${t('Text size')}</span><button data-action="text-size" data-id="down" title="${esc(t('Smaller'))}">A−</button><b>${esc(t(['Small', 'Normal', 'Large', 'Larger', 'Largest'][meta.settings.textSize ?? 1] || 'Normal'))}</b><button data-action="text-size" data-id="up" title="${esc(t('Bigger'))}">A+</button></div><hr><button data-action="new">${icon('paper', 18)} ${t('New run')}</button><button data-action="reset">${icon('trash', 18)} ${t('Reset save')}</button><button data-action="shutdown">${icon('computer', 18)} ${t('Shut down…')}</button></div></div>` : ''}
  <div class="balloons">${(ui.balloons || []).map(b => `<div class="balloon">${icon(b.icon || 'bell', 16)}<div><b>${esc(b.title)}</b>${esc(b.text)}</div><button class="x" data-action="dismiss-balloon" data-id="${b.id}" aria-label="${esc(t('Dismiss'))}">×</button></div>`).join('')}</div>
  ${ui.screen === 'game' && s?.event ? sceneDialog(s) : ''}${ui.screen === 'game' && s?.pushback ? pushbackDialog(s) : ''}${ui.screen === 'game' && s?.stage === 'minigame' && s?.minigame === 'lecture' ? lectureDialog(s) : ''}${ui.screen === 'game' && s && !s.event && ui.thread ? threadDialog(s, ui) : ''}${playing && s.stage === 'report' && !s.event ? reportDialog(s) : ''}${playing && s.stage === 'milestone' && !s.event ? milestoneDialog(s) : ''}
  ${ui.confirm ? confirmDialog(ui) : ''}${ui.dialog === 'about' ? aboutDialog() : ''}${ui.dialog === 'tips' ? tipsDialog(s) : ''}${ui.dialog === 'shutdown' ? shutdownDialog() : ''}
  </div>`;
}
