import { esc, btn, bar, group, money, signed, tag, voiced } from '../helpers.js';
import { icon } from '../icons.js';
import { activeProject, absWeek, noticeText, say } from '../../engine/state.js';
import { dayName } from '../../engine/game.js';
import { turnChoices, suggestedTurn } from '../../engine/play.js';
import { canStartMain, canStartSide, canSubmitNow } from '../../engine/paper.js';
import { canStartThesis, canDecideThesis, milestoneOf, paceOptions, thesisFloor, focusOptions } from '../../engine/time.js';
import { activeConditions, clinicQuote } from '../../engine/life.js';
import { clinics } from '../../data/life.js';
import { canAskTimeline } from '../../engine/timeline.js';
import { dateLabel, phdYear } from '../../data/calendar.js';
import { venueById, venuesForTopic, nextDeadline } from '../../data/venues.js';
import { monthOf } from '../../data/calendar.js';
import { rebuttals } from '../../data/catalog.js';
import { t } from '../../i18n/index.js';
import { requestList, projectList, readinessWidget, standingBanner, revisionPanel, timelinePanel,
  internPanel, lettersPanel, advisorCard, quickAsks, journeyBar, agenda, planList, dayStrip, stuckPanel } from './manager.js';

const taskButton = (s, label, type, id = '', project = '') => btn(label, 'desk-action', {
  cls: 'primary', disabled: s.stage !== 'plan', id,
  attrs: `data-type="${type}"${project ? ` data-project="${esc(project)}"` : ''}`,
});
const task = (title, text, body) => `<section class="desk-task" aria-label="${esc(t('On your desk'))}"><span class="desk-eyebrow">${t('On your desk')}</span><h2>${esc(title)}</h2>${text ? `<p>${esc(text)}</p>` : ''}${body}</section>`;

function paperDecision(s, p) {
  const document = `<p class="small"><b>${esc(p.title)}</b></p>`;
  if (p.status === 'Rebuttal') return task(t('Reviewer 2 has thoughts.'), t('The reviews are in. Choose how to answer before the month ends.'),
    document + `<div class="review-scores">${p.reviewers.map(r => `<span>${t('Score')} <b>${esc(r.score)}/10</b></span>`).join('')}</div><div class="desk-decisions">${rebuttals.filter(r => ['careful', 'experiments', 'confident'].includes(r.id)).map(r => taskButton(s, `${t(r.name)} · ${t('Energy')} −${r.energy}`, 'REBUT', r.id, p.id)).join('')}</div>`);
  if (p.status === 'Rejected') return task(t('It came back.'), t('A rejection is a decision about this submission. You still have the work.'),
    document + `<div class="desk-decisions">${taskButton(s, t('Fix the evidence · −6 Energy'), 'RECYCLE', 'revise', p.id)}${taskButton(s, t('Change the story · −4 Energy'), 'RECYCLE', 'reframe', p.id)}${taskButton(s, t('Let this project go'), 'RECYCLE', 'abandon', p.id)}</div>`);
  const venues = venuesForTopic(p.topic);
  const open = venues.filter(v => canSubmitNow(s, v));
  const target = venueById[p.targetVenueId];
  const choices = [...(target && open.includes(target) ? [target] : []), ...open.filter(v => v !== target)].slice(0, 3);
  const next = target && !open.includes(target) ? target : venues.filter(v => !v.rolling && !open.includes(v))
    .sort((a, b) => nextDeadline(a, s.month, monthOf) - nextDeadline(b, s.month, monthOf) || a.tier - b.tier)[0];
  return task(t('The paper can leave your desk.'), t('Submit now, or keep improving it for a later deadline. Better work improves the odds; it does not buy a verdict.'),
    document + `<div class="desk-decisions">${choices.map(v => `<div>${taskButton(s, t('Submit to {venue}', { venue: v.name }), 'SUBMIT_PAPER', v.id, p.id)}<small>${esc(t(v.tier === 1 ? 'Ambitious venue. A difficult lottery.' : v.tier === 2 ? 'Established venue. Still a lottery.' : 'Workshop. A smaller first step.'))}</small></div>`).join('')}
    ${next ? `<div>${p.targetVenueId === next.id ? `<b>${t('Aiming for {venue}', { venue: esc(next.name) })}</b>` : taskButton(s, t('Aim for {venue}', { venue: next.name }), 'SET_TARGET', next.id, p.id)}<small>${t('Deadline: {month}. Keep working or rest while you wait.', { month: dateLabel(nextDeadline(next, s.month, monthOf)) })}</small></div>` : ''}</div>`);
}

function nextTask(s) {
  if (s.stage !== 'plan') return '';
  const requests = s.requests.filter(r => r.status === 'open').sort((a, b) => a.dueWeek - b.dueWeek);
  if (requests.length) return task(t('Your advisor needs something.'), t('Answer before spending the turn. Helping, negotiating, and saying no all have consequences.'), requestList({ ...s, requests: [requests[0]] }));
  if (s.thesis && !s.thesis.deposited) return task(t('Defending was not finishing.'), '', revisionPanel(s));
  const rebuttal = s.projects.find(p => p.status === 'Rebuttal');
  if (rebuttal) return paperDecision(s, rebuttal);
  const condition = activeConditions(s)[0];
  if (condition) {
    const clinic = clinics.filter(c => c.treats.includes(condition.id)).map(c => clinicQuote(s, c.id)).sort((a, b) => a.you - b.you)[0];
    if (clinic) return task(t('Your body has filed a complaint.'), t('{name}. {blurb}', { name: t(condition.def.name), blurb: t(condition.def.blurb) }),
      taskButton(s, t('{clinic} · {cost}', { clinic: t(clinic.name), cost: money(clinic.you) }), 'CLINIC', clinic.id)
      + `<p class="small muted">${t('Insurance pays its share. Anything you cannot pay goes on the card.')}</p>`);
  }
  if (canDecideThesis(s)) return task(t('What is this PhD actually about?'), t('The papers do not become a thesis by themselves. Take an afternoon to choose the question.'), taskButton(s, t('Decide what the thesis is'), 'DECIDE_THESIS'));
  if (s.grad?.asked && !s.grad.settled || canAskTimeline(s)) return task(t('Put a finishing date on the table.'), '', timelinePanel(s));
  if (canStartThesis(s)) return task(t('The dissertation can begin.'), t('Your papers become chapters. The introduction will insist this was the plan all along.'), taskButton(s, t('Start the dissertation'), 'START_THESIS'));
  const thesis = s.projects.find(p => p.kind === 'thesis');
  if (thesis?.status === 'Ready' && s.milestones.defenseMonth == null) return task(t('Book the room.'), t('The committee has a draft. Now it needs a date.'), taskButton(s, t('Schedule the defense'), 'SCHEDULE_DEFENSE', '', thesis.id));
  const waiting = s.projects.find(p => p.status === 'Ready' && p.kind !== 'thesis' || p.status === 'Rejected');
  if (waiting) return paperDecision(s, waiting);
  const ready = s.projects.find(p => p.status === 'Drafting' && p.draft >= (p.kind === 'thesis' ? 90 : 60) && (p.kind === 'thesis' || p.progress >= 40));
  if (ready) return task(t('Someone else needs to read this.'), t('The draft is ready for your advisor. Sending it starts the wait; more polishing is your choice.'), taskButton(s, t('Send to advisor'), 'SEND_ADVISOR', '', ready.id));
  if (canStartMain(s)) return task(t('One manageable idea.'), t('Start a project. It will remain manageable for approximately one meeting.'), taskButton(s, t('Start main project'), 'START_PROJECT'));
  const reviewing = s.projects.find(p => p.status === 'Advisor Review');
  if (reviewing) return task(t('The draft is on another desk.'), t('Your advisor is reading it. Use the wait for coursework, people, or a life outside the document.'), `<p class="small muted">${t('Expected reply in about {n} week(s). Estimates are a genre.', { n: Math.max(0, reviewing.reviewDueWeek - absWeek(s)) })}</p>`);
  return '';
}

function receipt(s) {
  const r = s.lastTurn;
  if (!r) return '';
  return `<section class="desk-receipt" aria-label="${esc(t('Last statement'))}"><div><b>${t('Last statement')} · ${esc(say(s, r.focus, r.i18nFocus))}</b><span class="small muted">${dateLabel(r.month)}</span></div>
    <p>${[t('Energy {n}', { n: signed(r.energy) }), t('Hope {n}', { n: signed(r.hope) }), t('Health {n}', { n: signed(r.health) })].join(' · ')}</p>
    ${r.projects.filter(p => p.progress || p.draft).map(p => `<p class="small">${esc(p.title)} · ${t('Research {n}', { n: signed(p.progress) })} · ${t('Draft {n}', { n: signed(p.draft) })}</p>`).join('')}
    ${r.events.slice(-2).map(e => `<p class="small muted">${esc(e.i18n ? say(s, '', e.i18n) : `${e.title} — ${e.result || e.choice}`)}</p>`).join('')}</section>`;
}

export function deskApp(s, ui) {
  const tab = ui.deskTab || 'now';
  const ms = milestoneOf(s);
  const current = activeProject(s);
  const period = s.tempo === 'day' ? t('One day') : s.tempo === 'week' ? t('One week') : s.tempo === 'season' ? t('Three months') : t('One month');
  const nextGoal = s.thesis && !s.thesis.deposited ? t('Finish revisions and deposit the dissertation')
    : ms ? t('{milestone} · {month}', { milestone: { prelim: t('Preliminary examination'), proposal: t('Thesis proposal'), defense: t('Defense') }[ms.kind], month: dateLabel(ms.month) })
      : s.milestones.proposal === 'pass' && !s.milestones.thesisStarted ? t('Dissertation opens {month}', { month: dateLabel(thesisFloor(s)) }) : t('Get the dissertation approved');
  const heading = s.month < 12 ? t('You are here to do research.') : s.month < 24 ? t('The committee is getting closer.') : s.month < 46 ? t('Somewhere in the middle of a PhD.') : t('Finish the work. Leave the building.');
  const top = `<header class="desk-heading"><div><span class="desk-eyebrow">${t('Year {n}', { n: phdYear(s.month) })} / ${dateLabel(s.month)}${s.tempo === 'week' || s.tempo === 'day' ? ` / ${t('Week {n} of 4', { n: s.week + 1 })}${s.tempo === 'day' ? ` / ${dayName(s)}` : ''}` : ''}</span><h1>${heading}</h1><p>${t('Next milestone')}: <b>${nextGoal}</b></p></div><span class="desk-stamp">${t('ACADEMIC')}<br>${t('PROGRESS*')}</span></header>
    <nav class="desk-tabs" aria-label="${esc(t('Your desk'))}">${[['now', t('Now')], ['research', t('Research')], ['people', t('People')], ['records', t('Records')]].map(([id, name]) => btn(name, 'desk-tab', { id, cls: tab === id ? 'active' : '', attrs: `aria-pressed="${tab === id}"` })).join('')}</nav>`;
  if (tab === 'research') return `<div class="desk">${top}${group(t('Projects'), projectList(s) + `<div class="row wrap">${canStartMain(s) ? taskButton(s, t('Start main project'), 'START_PROJECT') : ''}${canStartSide(s) ? taskButton(s, t('Start side project'), 'START_SIDE') : ''}${btn(t('Open Overgrief'), 'open', { app: 'browser', attrs: 'data-page="overgrief"' })}</div>`)}${group(t('Plan your own turn'), planList(s) + btn(t('Spend this turn →'), 'continue', { cls: 'primary continue', disabled: s.stage !== 'plan' || !focusOptions(s).some(f => f.id === s.focus && !f.disabled) }))}${group(t('Stuck?'), stuckPanel(s))}${s.tempo === 'day' ? dayStrip(s) : ''}</div>`;
  if (tab === 'people') return `<div class="desk">${top}${group(t('Advisor'), advisorCard(s) + quickAsks(s))}${group(t('Advisor requests'), requestList(s))}${timelinePanel(s)}${internPanel(s)}${lettersPanel(s)}</div>`;
  if (tab === 'records') return `<div class="desk">${top}${journeyBar(s)}${readinessWidget(s)}${agenda(s)}${group(t('Field notes'), `<div class="notes-box">${voiced(noticeText(s))}</div>`)}<div class="desk-pace">${paceOptions(s).map(p => btn(t({ day: 'Day', week: 'Week', month: 'Month', season: 'Season' }[p.id]), 'set-pace', { id: p.id, disabled: !!p.disabled || s.stage !== 'plan', title: p.disabled ? t(p.disabled) : '', cls: p.active ? 'primary' : '' })).join('')}</div></div>`;
  const onDesk = nextTask(s);
  const choices = turnChoices(s), suggested = /<button\b(?![^>]*\sdisabled\b)[^>]*>/.test(onDesk) ? null : suggestedTurn(s);
  return `<div class="desk">${top}${standingBanner(s)}<div class="desk-layout"><div class="desk-main">${onDesk}
    ${ui.pendingTurn ? `<div class="desk-pending" role="status">${t('Your plan is queued. Answer your advisor above, then the turn will run.')}${btn(t('Cancel this plan'), 'cancel-turn', { cls: 'small' })}</div>` : ''}
    <section class="desk-turn" aria-label="${esc(t('Spend your time'))}"><div class="desk-section-heading"><h2>${t('What gets your time?')}</h2><span>${period} ${t('passes when you click.')}</span></div>
    <div class="turn-choices">${choices.map(c => `<button class="turn-choice ${c.id === suggested?.id ? 'suggested' : ''}" data-action="play-turn" data-id="${c.id}" ${s.stage !== 'plan' ? 'disabled' : ''}><span class="turn-icon">${icon(c.icon, 25)}</span><span><span class="turn-label">${esc(c.name)}</span><span class="turn-detail">${esc(c.detail)}</span>${c.id === suggested?.id ? `<small>${t('A useful next step')}</small>` : ''}</span><span class="turn-arrow">→</span></button>`).join('')}</div></section>
    ${receipt(s)}</div><aside class="desk-paper"><span class="desk-eyebrow">${t('The work so far')}</span>${current ? `<h2>${esc(current.title)}</h2>${tag(t(current.status))}${bar(t('Research'), current.progress)}${bar(t('Draft'), current.draft)}${current.targetVenue ? `<p>${t('Aiming for {venue}', { venue: esc(current.targetVenue) })}<br><b>${dateLabel(current.targetMonth)}</b></p>` : ''}` : `<p>${t('No project yet. Everything starts with one idea that seemed manageable.')}</p>`}<div class="desk-paper-foot"><b>${t('{n} paper(s) accepted', { n: s.counts.accepted })}</b><p>${t('A finished project is a contribution. A perfect project is a rumor.')}</p></div></aside></div></div>`;
}
