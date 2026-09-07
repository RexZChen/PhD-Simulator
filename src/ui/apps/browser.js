import { esc, btn, bar, tag, group, note, band, money } from '../helpers.js';
import { icon } from '../icons.js';
import { venues, venueById, nextDeadline, acceptsThisMonth, selectivityLabel, tierLabel, fitsTopic, venuesForTopic } from '../../data/venues.js';
import { rebuttals, topics } from '../../data/catalog.js';
import { dateLabel, monthOf } from '../../data/calendar.js';
import { activeProject, absWeek, lastName, editable } from '../../engine/state.js';
import { writeBudget, canSubmitNow } from '../../engine/paper.js';
import { composedText, isStreaming } from '../compose.js';
import { BENCH_ENERGY } from '../../data/bench.js';
import { portals, efforts, AUTH_QUESTION, SPONSOR_QUESTION, SPONSOR_NOTE } from '../../data/portals.js';
import { listingsFor, portalOpen, openPortals, funnel, heatBand, ensureJobs, sponsorBlocked } from '../../engine/jobsearch.js';
import { letterCount, needsLetters } from '../../engine/letters.js';
import { LETTERS_REQUIRED } from '../../data/letters.js';
import { t } from '../../i18n/index.js';

const projectTabs = (s, p) => s.projects.length > 1 ? `<div class="row small" style="margin-bottom:8px">${s.projects.map(x => btn(esc(x.title), 'select-project', { id: x.id, cls: `small ${x.id === p?.id ? 'primary' : ''}` })).join('')}</div>` : '';
const sel = v => t(selectivityLabel(v));
const tierWord = v => t(tierLabel(v));


// ── Where the paper is, and the single thing to do next ───────────────────────
const PAPER_STAGES = ['Idea', 'Prototype', 'Experiments', 'Drafting', 'Advisor Review', 'Ready', 'Submitted', 'Rebuttal', 'Decision'];
const THESIS_STAGES = ['Drafting', 'Advisor Review', 'Ready', 'Defense'];
function stageIndex(p) {
  if (p.kind === 'thesis') return { Drafting: 0, 'Advisor Review': 1, Ready: 2 }[p.status] ?? 0;
  const i = PAPER_STAGES.indexOf(p.status);
  if (i >= 0) return i;
  return ['Accepted', 'Rejected', 'Abandoned'].includes(p.status) ? PAPER_STAGES.length - 1 : 0;
}
function pipelineRail(p) {
  const stages = p.kind === 'thesis' ? THESIS_STAGES : PAPER_STAGES;
  const at = stageIndex(p);
  return `<div class="pipeline" role="list">${stages.map((name, i) => `<span class="pstage ${i < at ? 'done' : i === at ? 'now' : ''}" role="listitem"><i>${i < at ? '✓' : i + 1}</i>${esc(t(name))}</span>`).join('')}</div>`;
}
// Returns { title, detail, cta } — cta is pre-rendered HTML or ''.
function nextStep(s, p) {
  const plan = s.stage === 'plan';
  const openNow = venuesForTopic(p.topic).filter(v => canSubmitNow(s, v));
  const go = (label, action, opts = {}) => btn(label, action, { cls: 'primary', disabled: !plan, ...opts });
  if (p.kind === 'thesis') {
    if (p.status === 'Drafting') return { title: t('Write the dissertation to 90%'), detail: t('The committee reads it at 90%. You are at {n}%.', { n: Math.round(p.draft) }), cta: go(t('Write a paragraph (+5)'), 'write', { disabled: !plan || p.draft >= 100 }) };
    if (p.status === 'Advisor Review') return { title: t('The committee is reading'), detail: t('Expected reply in {n} week(s).', { n: Math.max(0, p.reviewDueWeek - absWeek(s)) }), cta: '' };
    if (p.status === 'Ready') return { title: t('Schedule the defense'), detail: t('Approved. Book the room from PhD Manager.'), cta: btn(t('Open PhD Manager'), 'open', { app: 'dashboard', cls: 'primary' }) };
  }
  if (p.status === 'Accepted') return { title: t('This one is finished'), detail: t('Published. Start the next thing when you are ready.'), cta: btn(t('Open PhD Manager'), 'open', { app: 'dashboard', cls: 'primary' }) };
  if (p.status === 'Abandoned') return { title: t('This project is over'), detail: t('Start something new from PhD Manager.'), cta: btn(t('Open PhD Manager'), 'open', { app: 'dashboard', cls: 'primary' }) };
  if (p.status === 'Rejected') return { title: t('Decide what this becomes'), detail: t('Revise, reframe, expand, or let it go — in OpenRegret.'), cta: btn(t('Open OpenRegret'), 'browser-tab', { id: 'openregret', cls: 'primary' }) };
  if (p.status === 'Rebuttal') return { title: t('Write the rebuttal'), detail: t('The window closes at the end of this month.'), cta: btn(t('Open OpenRegret'), 'browser-tab', { id: 'openregret', cls: 'primary' }) };
  if (p.status === 'Submitted') return { title: t('Under review. Out of your hands.'), detail: p.timeline ? t('Decision expected {month}.', { month: dateLabel(p.timeline.decision) }) : '', cta: '' };
  if (p.status === 'Advisor Review') return { title: t('Your advisor is reading'), detail: t('Expected reply in {n} week(s). Nothing to do but the next thing.', { n: Math.max(0, p.reviewDueWeek - absWeek(s)) }), cta: '' };
  if (p.status === 'Ready') {
    if (openNow.length) return { title: t('Submit it'), detail: t('Open this month: {list}.', { list: openNow.map(v => v.name).join(', ') }), cta: btn(t('Open OpenRegret'), 'browser-tab', { id: 'openregret', cls: 'primary' }) };
    if (p.targetVenue) return { title: t('Wait for the deadline'), detail: t('{venue} opens in {month}.', { venue: p.targetVenue, month: dateLabel(p.targetMonth) }), cta: '' };
    return { title: t('Choose where to send it'), detail: t('No venue is open this month. Set a target below and the deadline month will run week by week.'), cta: btn(t('Open OpenRegret'), 'browser-tab', { id: 'openregret', cls: 'primary' }) };
  }
  if (p.progress < 35) return { title: t('Get the research to 35%'), detail: t('Drafting unlocks at 35% research. You are at {n}%.', { n: Math.round(p.progress) }), cta: btn(t('Plan a Research month'), 'open', { app: 'dashboard', cls: 'primary' }) };
  if (p.draft < 60) return { title: t('Write the draft to 60%'), detail: t('Your advisor reads it at 60% draft and 40% research. Draft {d}%, research {r}%.', { d: Math.round(p.draft), r: Math.round(p.progress) }), cta: go(t('Write a paragraph (+5)'), 'write', { disabled: !plan || p.draft >= 100 || writeBudget(s) - (s.typed || 0) <= 0 }) };
  if (p.progress < 40) return { title: t('Get the research to 40%'), detail: t('The draft is long enough; the results are not. Research {r}%.', { r: Math.round(p.progress) }), cta: btn(t('Plan a Research month'), 'open', { app: 'dashboard', cls: 'primary' }) };
  return { title: t('Send it to your advisor'), detail: t('Draft {d}%, research {r}%. Both thresholds met.', { d: Math.round(p.draft), r: Math.round(p.progress) }), cta: go(t('Send to advisor'), 'send-advisor') };
}
function nextCard(s, p, here) {
  const n = nextStep(s, p);
  if (here && n.cta && n.cta.includes(`data-id="${here}"`)) n.cta = '';
  return `<div class="next-step"><span class="ns-mark">${icon('arrow', 18)}</span><div><b>${esc(n.title)}</b><span class="muted small">${esc(n.detail)}</span></div><span class="ns-cta">${n.cta}</span></div>`;
}

function overgrief(s, ui) {
  const p = activeProject(s), plan = s.stage === 'plan';
  if (!p) return `<div class="webpage"><h1>Overgrief</h1><p class="muted">${t('Every paper begins with a project. Start one in PhD Manager.')}</p>${btn(t('Open PhD Manager'), 'open', { app: 'dashboard' })}</div>`;
  const canType = ['Experiments', 'Drafting', 'Prototype'].includes(p.status) && (p.kind === 'thesis' || p.progress >= 35);
  const remaining = Math.max(0, writeBudget(s) - (s.typed || 0));
  const crunch = s.crunch?.type === 'deadline' && s.crunch.projectId === p.id;
  const isThesis = p.kind === 'thesis';
  return `<div class="webpage" style="padding:0">${crunch ? `<div class="deadline-banner"><span>${t('DEADLINE MODE')} · ${esc(p.targetVenue)}</span><b>${t('{n} week(s) left', { n: 4 - s.week })}</b></div>` : ''}<div style="padding:12px 14px">${projectTabs(s, p)}
  <div class="row between" style="margin-bottom:8px"><div><b style="font-size:15px">${esc(p.title)}</b> ${tag(t(p.status), p.status === 'Accepted' ? 'ok' : '')}<div class="small muted">${esc(topics[p.topic])} · ${p.collaborators.map(c => esc(lastName(c))).join(', ')} · ${isThesis ? 'thesis.tex' : 'main.tex'} · ${t('autosaved (allegedly)')}</div></div>${p.targetVenue ? `<span class="small">${t('Target')}: <b>${esc(p.targetVenue)}</b> · ${dateLabel(p.targetMonth)} ${btn(t('clear'), 'clear-target', { cls: 'small link', disabled: !plan })}</span>` : isThesis ? `<span class="small muted">${t('The committee is the venue.')}</span>` : `<span class="small muted">${t('No target deadline (set one in OpenRegret)')}</span>`}</div>
  ${pipelineRail(p)}
  ${nextCard(s, p, 'overgrief')}
  <div class="editor-layout"><div class="editor-source"><div class="src-title">${isThesis ? 'thesis.tex' : 'main.tex'} — ${p.draft >= 70 ? t('ready for comments') : t('citation desperately needed')}</div><pre><span class="ln">01</span><b>\\documentclass</b>{${isThesis ? 'thesis' : 'article'}}
<span class="ln">02</span><b>\\title</b>{${esc(p.title)}}
<span class="ln">03</span><b>\\begin</b>{document}
<span class="ln">04</span>
<span class="ln">05</span><i>% TODO: ${t('make contribution obvious')}</i>
<span class="ln">06</span>${t('We propose a {adj} framework', { adj: p.hype > 30 ? t('revolutionary') : t('modest') })}
<span class="ln">07</span>${t('for a surprisingly persistent problem.')}
<span class="ln">08</span>
<span class="ln">09</span><b>\\section</b>{${isThesis ? t('Chapter 4') : t('Experiments')}}
<span class="ln">10</span>${t('Our method outperforms the baseline')}
<span class="ln">11</span>${p.evidence > 60 ? t('across multiple carefully tested settings.') : t('on the machine where we wrote it.')}
<span class="ln">12</span>
<span class="ln">13</span><i>% ${p.draft >= 100 ? t('DONE (never done)') : t('draft {n}%', { n: Math.round(p.draft) })}</i>
<span class="ln">14</span><b>\\end</b>{document}</pre><div id="typing-zone" class="typing-zone" tabindex="${plan && canType && remaining > 0 ? 0 : -1}" role="textbox" aria-label="${esc(t('Writing session'))}" aria-readonly="true">${plan && canType ? `${t('Click here and mash keys to write.')}<br><span class="muted">${t('{n} draft points left this {unit}. Typing moves progress, not quality.', { n: remaining, unit: s.tempo === 'week' ? t('week') : t('month') })}</span>` : canType ? t('Writing is available once you are planning a turn.') : t('Research must reach 35% before drafting.')}<span class="cursor">▌</span></div></div>
  <div class="paper-preview"><div class="paper-sheet"><h3>${esc(p.title)}</h3><div class="authors">${p.collaborators.length > 1 ? esc(s.player.name) + ' · ' + p.collaborators.map(esc).join(' · ') : esc(s.player.name) + ' · ' + esc(s.advisor.name)}<br>${esc(s.program.name)}</div><h4>${t('Abstract')}</h4><p>${t('We investigate a problem that is widely considered to be a problem. Our approach offers a promising direction, subject to the limitations described in Section 8, which does not exist yet.')}</p><div class="cols2"><div><h4>1. ${t('Introduction')}</h4><p>${t('Recent work has demonstrated that more work remains. We build on this important tradition.')}</p><div class="fake-lines"></div></div><div><h4>2. ${t('Results')}</h4><div class="fake-chart"><i style="height:35%"></i><i style="height:50%"></i><i style="height:42%"></i><i style="height:${Math.min(95, 40 + p.evidence / 2)}%"></i></div><p class="tiny">${t('Figure 1. Bigger is probably better.')}</p><div class="fake-lines"></div></div></div></div></div></div>
  <div class="group" style="margin-top:8px">${bar(t('Draft'), p.draft)}${bar(t('Research'), p.progress, { cls: 'teal' })}<div class="row" style="margin-top:6px">${btn(t('Write a paragraph (+5)'), 'write', { disabled: !plan || !canType || !remaining || p.draft >= 100 })}${btn(t('Read for the afternoon (−{n})', { n: BENCH_ENERGY }), 'bench-start', { disabled: !plan || s.actions.bench || s.player.stats.energy < BENCH_ENERGY || !['Idea', 'Prototype', 'Experiments', 'Drafting'].includes(p.status), title: s.actions.bench ? t('You have already done that this turn.') : t('Five moments in the literature where the timing is the skill. Easier if you are good at this.') })}${btn(t('“A general framework for…”'), 'hype', { disabled: !plan || !['Drafting', 'Experiments'].includes(p.status) || s.actions.hype, title: t('More hype, more novelty, more risk') })}${btn(isThesis ? t('Send to the committee') : t('Send to advisor'), 'send-advisor', { cls: 'primary', disabled: !plan || ['Advisor Review', 'Ready', 'Submitted', 'Rebuttal', 'Accepted', 'Abandoned'].includes(p.status) || (isThesis ? p.draft < 90 : (p.draft < 60 || p.progress < 40)), title: isThesis ? t('Needs a 90% draft') : t('Needs 40% research and 60% draft') })}${p.status === 'Advisor Review' ? btn(t('Skip the advisor’s read'), 'skip-approval', { disabled: !plan, title: t('Late in a crunch, or when they are unreachable. Costs goodwill.') }) : ''}${isThesis ? '' : btn(t('Post preprint (arXive)'), 'preprint', { disabled: !plan || p.preprint || p.draft < 85, title: t('Draft ≥85%. A timestamp against scooping; a little hype.') })}</div>
  <p class="small muted" style="margin:8px 0 0">${t('Evidence')}: ${band(p.evidence)} · ${t('Writing')}: ${band(p.writingQuality)} · ${t('Rigor')}: ${band(p.reproducibility)} · ${t('Claims')}: ${p.hype > 45 ? t('getting ambitious') : t('relatively restrained')} · ${t('Scope')}: ${p.scope > 60 ? t('sprawling') : p.scope > 40 ? t('growing') : t('contained')}</p>
  ${p.status === 'Advisor Review' ? note(t('{name} is reading. Expected reply in {n} week(s). Keep going; they will find something.', { name: lastName(s.advisor.name), n: Math.max(0, p.reviewDueWeek - absWeek(s)) })) : ''}${p.status === 'Ready' ? note(isThesis ? t('Approved. Schedule the defense from PhD Manager.') : t('Approved. Open the OpenRegret tab to submit when a venue is open.')) : ''}</div>
  ${history(p)}</div></div>`;
}
const history = p => p.submissionHistory.length ? group(t('Submission history'), `<table class="grid"><tr><th>${t('Venue')}</th><th>${t('Submitted')}</th><th>${t('Outcome')}</th><th>${t('Scores')}</th></tr>${p.submissionHistory.map(h => `<tr><td>${esc(h.venue)}</td><td>${esc(h.date || t('Month {n}', { n: h.month + 1 }))}</td><td>${tag(t(h.outcome), /Accept|Spotlight|Oral|Award/.test(h.outcome) ? 'ok' : /Reject/.test(h.outcome) ? 'bad' : 'info')}</td><td class="muted">${h.reviewers?.length ? h.reviewers.map(r => r.score).join(' / ') : '—'}</td></tr>`).join('')}</table>`) : '';

function venueTable(s, p) {
  const plan = s.stage === 'plan';
  const list = venuesForTopic(p.topic).map(v => ({ v, at: nextDeadline(v, s.month, monthOf) })).sort((a, b) => (a.v.rolling ? 99 : a.at) - (b.v.rolling ? 99 : b.at));
  return `<div class="listview venue-table"><div class="lv-head"><span>${t('Venue')}</span><span>${t('Category')}</span><span>${t('Next deadline')}</span><span>${t('Selectivity')}</span><span>${t('Fit')}</span><span></span></div>${list.map(({ v, at }) => { const open = canSubmitNow(s, v); const fit = v.topics.includes('any') ? t('any') : v.primary === p.topic ? t('primary') : t('partial'); return `<div class="lv-row"><span><b>${esc(v.name)}</b><span class="muted tiny"> (${t('{real}-like', { real: v.real })})</span></span><span class="small">${esc(v.category)} · ${tierWord(v)}</span><span class="small">${v.rolling ? t('Rolling') : dateLabel(at) + (at === s.month ? ` · ${t('open')}` : '')}</span><span class="small">${sel(v)}</span><span class="small">${fit}</span><span>${!v.rolling && at < 72 ? btn(p.targetVenueId === v.id ? t('Targeted') : t('Target'), 'set-target', { id: v.id, cls: 'small', disabled: !plan || p.targetVenueId === v.id || !editable(p) && p.status !== 'Ready', title: t('Aim the project at this deadline. The deadline month runs week by week.') }) : ''}${p.status === 'Ready' && open ? btn(t('Submit here'), 'wizard', { id: v.id, cls: 'small primary', disabled: !plan }) : ''}</span></div>`; }).join('')}</div>`;
}

function openregret(s, ui) {
  const p = activeProject(s), plan = s.stage === 'plan';
  if (!p || p.kind === 'thesis') return `<div class="webpage"><h1>Open<span style="color:#a11d1d">Regret</span></h1><p class="muted">${p ? t('Dissertations are not submitted here. They are defended, in a room, with cake.') : t('Nothing to regret. Yet. Start a project and draft a manuscript first.')}</p></div>`;
  const labels = [t('Venue'), t('Metadata'), t('Authors'), t('Manuscript'), t('Submit')];
  const v = venueById[p.venueId];
  let body = '';
  if (p.status === 'Ready' && p.wizardStep > 0) body = `<div class="wizard-steps">${labels.map((x, i) => `<span class="${p.wizardStep === i ? 'current' : p.wizardStep > i ? 'done' : ''}">${i + 1}. ${x}</span>`).join('')}</div><div class="group">${p.wizardStep === 1 ? `<h2>${t('Confirm metadata')}</h2><p>${t('Title')}: ${esc(p.title)}<br>${t('Area')}: ${esc(topics[p.topic])}<br>${t('Venue')}: ${esc(v?.name)}<br>${t('Claims')}: ${p.hype > 45 ? t('rather ambitious') : t('within plausible limits')}.</p>` : p.wizardStep === 2 ? `<h2>${t('Confirm authors')}</h2><ol>${[s.player.name, ...p.collaborators].map(a => `<li>${esc(a)}</li>`).join('')}</ol><p class="muted small">${t('Everyone has contributed. Definitions vary.')}</p>` : p.wizardStep === 3 ? `<h2>${t('Upload manuscript')}</h2><div class="sunken center" style="padding:18px">${icon('paper', 28)}<br><b>manuscript_final_FINAL_v7${p.approvedWithout ? '_unapproved' : ''}.pdf</b><br><span class="muted small">${t('Generated from Overgrief · margins: probably fine')}</span></div>` : `<h2>${t('Are you absolutely sure?')}</h2><p>${t('Venue')}: <b>${esc(v?.name)}</b>. ${t('Decision expected {month}.', { month: v ? dateLabel(s.month + v.review) : '—' })}${v?.rebuttal !== null && v ? ` ${t('Reviews and rebuttal in {month}.', { month: dateLabel(s.month + v.rebuttal) })}` : ''}</p><p class="muted small">${t('Once submitted, the manuscript cannot be edited, un-read, or un-regretted.')}</p>`}<div class="row" style="margin-top:8px">${btn(p.wizardStep === 4 ? t('Submit manuscript') : t('Confirm & continue'), p.wizardStep === 4 ? 'submit' : 'wizard', { cls: 'primary', disabled: !plan })}</div></div>`;
  else if (p.status === 'Rebuttal') {
    const chosen = ui && ui.compose && ui.compose.kind === 'rebuttal' ? rebuttals.find(r => r.id === ui.compose.optionId) : null;
    const ready = !!(ui && ui.compose && ui.compose.kind === 'rebuttal' && ui.compose.done);
    const avg = (p.reviewers.reduce((a, r) => a + r.score, 0) / Math.max(1, p.reviewers.length)).toFixed(1);
    body = `<h2>${t('Reviews')} · ${esc(v?.name)} <span class="muted small">${t('mean {n}/10', { n: avg })}</span></h2>
      <div class="reviews">${p.reviewers.map(r => `<div class="review"><span class="score">${r.score}<small>/10</small></span><b>${esc(r.name)}</b><div class="tiny muted">${t('confidence {n}/5', { n: r.confidence })}</div><p>${esc(r.text)}</p></div>`).join('')}</div>
      <div class="compose-pane rebuttal-pane">
        <div class="compose-head"><b>${t('Rebuttal — due this month')}</b><span class="muted small">${t('If the month ends without a response, the decision uses the reviews as they are.')}</span></div>
        <div class="compose-body sunken" data-compose-scroll data-action="compose-skip" title="${esc(t('Click to skip the typing.'))}"><div class="compose-text ${isStreaming() ? 'streaming' : ''}" data-compose-text>${esc(chosen ? composedText() : '')}</div>${chosen ? '' : `<span class="compose-placeholder">${t('Choose an approach. The letter gets drafted for you.')}</span>`}</div>
        <div class="compose-options">${rebuttals.map((r, i) => `<button class="btn choice compose-opt ${chosen && chosen.id === r.id ? 'selected' : ''}" data-action="rebut-option" data-id="${r.id}" data-hotkey="${i + 1}" ${plan ? '' : 'disabled'}><span><kbd>${i + 1}</kbd></span><span><b>${esc(r.name)}</b><small>${esc(r.desc)}</small></span><span class="arrow">→</span></button>`).join('')}</div>
        <div class="compose-actions">${btn(`${icon('send', 14)} ${t('Submit rebuttal')}`, 'rebut-send', { cls: 'primary', disabled: !ready || !plan, attrs: 'data-default="1"' })}<span class="muted tiny">${ready ? t('Ready to submit.') : chosen ? t('Drafting…') : t('Nothing written yet.')}</span></div>
      </div>`;
  }
  else if (p.status === 'Rejected') body = `<div class="group"><h2>${t('We regret to inform you.')}</h2><p>${t('The paper did not get in. The project still exists. Its history stays with it, like a limp.')}</p><div class="row">${[['revise', t('Revise the evidence')], ['reframe', t('Reframe the story')], ['expand', t('Expand the contribution')], ['abandon', t('Abandon the project')]].map(([id, label]) => btn(label, 'recycle', { id, disabled: !plan })).join('')}</div></div>`;
  else if (p.status === 'Accepted') body = `<div class="group" style="border-top:4px solid var(--ok)"><h2>${t('We are pleased to inform you.')}</h2><p>${esc(t(p.submissionHistory.at(-1)?.outcome || 'Accept'))} · ${esc(p.submissionHistory.at(-1)?.venue)}. ${t('The contribution is now a contribution.')}${p.timeline?.conference !== null && p.timeline?.conference !== undefined ? ` ${t('Conference')}: ${dateLabel(p.timeline.conference)}.` : ''}</p></div>`;
  else if (p.status === 'Submitted') body = `<div class="group"><h2>${t('Under review. Out of your hands.')}</h2><p>${esc(v?.name)} · ${t('submitted')} ${dateLabel(p.timeline.submitted)}${p.timeline.phaseOne !== null ? ` · ${t('phase-one screening')} ${dateLabel(p.timeline.phaseOne)}` : ''}${p.timeline.rebuttal !== null ? ` · ${t('reviews')} ${dateLabel(p.timeline.rebuttal)}` : ''} · ${t('decision')} ${dateLabel(p.timeline.decision)}${p.timeline.conference !== null ? ` · ${t('conference')} ${dateLabel(p.timeline.conference)}` : ''}.</p><p class="muted small">${t('Meanwhile: a side project, coursework, or sleep. Two of these are recommended.')}</p></div>`;
  else body = note(p.status === 'Ready' ? t('Approved by your advisor. Pick a venue that is open this month, or set a target and wait for its deadline.') : p.status === 'Advisor Review' ? t('The draft is with your advisor. Set a target deadline below while you wait.') : t('Draft the paper in Overgrief and get advisor approval before submitting. You can set a target deadline any time.'));
  return `<div class="webpage" style="padding:0"><div style="padding:12px 14px">${projectTabs(s, p)}<div class="row between"><h1 style="margin:0">Open<span style="color:#a11d1d">Regret</span> <span class="small muted" style="font-weight:400">${t('open science · closed doors')}</span></h1>${tag(t(p.status), p.status === 'Accepted' ? 'ok' : p.status === 'Rejected' ? 'bad' : '')}</div><p class="small muted">${t('Manuscript')}: <b>${esc(p.title)}</b></p>${pipelineRail(p)}${nextCard(s, p, 'openregret')}${body}${group(t('Venues for this project'), venueTable(s, p))}${history(p)}</div></div>`;
}

function chatphd(s, ui) {
  const p = activeProject(s), plan = s.stage === 'plan';
  const items = [['title', t('Brainstorm a title'), t('A little progress, a little hype.')], ['abstract', t('Polish the abstract'), t('Saves Energy, moves the draft.')], ['concept', t('Explain a concept'), t('Builds presentation readiness.')], ['experiment', t('Suggest an experiment'), t('A direction to test, not a guarantee.')], ['rebuttal', t('Draft a rebuttal'), t('Only when reviews are in. Check the citations.')]];
  const log = (s.chatphdLog || []).map(m => `<div class="msg ${m.from === 'you' ? 'mine' : ''}"><span class="av">${m.from === 'you' ? 'Y' : '✦'}</span><div><div class="who"><b>${m.from === 'you' ? t('You') : 'ChatPHD'}</b></div><p>${esc(m.text)}</p></div></div>`).join('');
  return `<div class="webpage chatphd"><div class="row between"><h1 style="margin:0">ChatPHD <span class="tag info">v4.7 · ${t('hallucination mode: on')}</span></h1><span class="tiny muted">${t('Trained on rejected manuscripts. Occasionally correct.')}</span></div>
  <div class="chat-log chatphd-log" style="margin-top:8px">${log || `<p class="muted">${t('Ask anything: deadlines, advisors, reviewers, sleep, money, bugs, quitting. It has opinions on all of them.')}</p>`}${s.chatphd ? `<div class="msg"><span class="av">✦</span><div><div class="who"><b>ChatPHD</b> <small>${t('tool result')}</small></div><p>${esc(s.chatphd)}</p></div></div>` : ''}</div>
  <form id="chatphd-form" class="chatphd-input"><input id="chatphd-input" maxlength="200" placeholder="${esc(t('Type a message… (free, harmless, mostly)'))}" autocomplete="off"><button class="btn primary" type="submit">${t('Send')}</button></form>
  <p class="small muted" style="margin-top:10px"><b>${t('Tools')}</b> — ${t('one per turn. These have side effects on the paper.')}</p><div class="choices">${items.map(([id, label, d]) => `<button class="btn choice" data-action="chatphd" data-id="${id}" ${!plan || !p || s.actions.chatphd || (id === 'rebuttal' ? p.status !== 'Rebuttal' : !editable(p)) ? 'disabled' : ''}><span>${icon('chat', 16)}</span><span><b>${label}</b><small>${d}</small></span><span class="arrow">→</span></button>`).join('')}</div></div>`;
}
function deadlinesPage(s, ui) {
  const list = venuesForTopic(s.player.profile.topic).filter(v => !v.rolling).map(v => ({ v, at: nextDeadline(v, s.month, monthOf) })).filter(x => x.at < 72).sort((a, b) => a.at - b.at);
  return `<div class="webpage"><h1>WhenIsThe<span style="color:#a11d1d">Deadline</span>.es</h1><p class="muted">${t('Upcoming deadlines for {topic}, derived from each venue’s real annual cycle. Countdown timers omitted for your health.', { topic: topics[s.player.profile.topic] })}</p>${note(t('Reference only: in-game dates are month-level projections, not live deadlines. Verify the official venue page before any real submission.'))}<table class="grid"><tr><th>${t('Venue')}</th><th>${t('Deadline')}</th><th>${t('In')}</th><th>${t('Decision')}</th><th>${t('Conference')}</th><th>${t('Selectivity')}</th></tr>${list.map(({ v, at }) => `<tr><td><b>${esc(v.name)}</b> <span class="muted tiny">${t('{real}-like', { real: v.real })}</span>${v.reference ? `<br><a class="tiny" href="${v.reference.source}" target="_blank" rel="noopener noreferrer">${esc(v.reference.cycle)} ↗</a>` : ''}</td><td>${dateLabel(at)}</td><td>${at === s.month ? `<b>${t('now')}</b>` : t('{n} mo', { n: at - s.month })}</td><td>${dateLabel(at + v.review)}</td><td>${v.conference ? dateLabel(at + v.review + ((v.conference - monthOf(at + v.review) + 12) % 12)) : '—'}</td><td>${sel(v)}</td></tr>`).join('')}</table></div>`;
}
function arxive(s, ui) {
  const pre = s.projects.filter(p => p.preprint);
  return `<div class="webpage"><h1>arXive</h1><p class="muted">${t('Timestamps for people who fear being scooped.')} ${pre.length ? '' : t('You have not posted anything. Neither has your competitor, probably.')}</p>${pre.length ? `<ul>${pre.map(p => `<li><b>${esc(p.title)}</b> — ${esc(s.player.name)} et al. <span class="muted small">(v1; ${t('v2 will fix the typo in the title')})</span></li>`).join('')}</ul>` : ''}<p class="small muted">${t('Post from Overgrief when a draft is at 85% or more.')}</p></div>`;
}

// Three boards, one tab, because the tab strip is not infinite and neither is the field's patience.
function jobsPage(s, ui) {
  ensureJobs(s);
  const open = openPortals(s);
  const pid = open.includes(ui.jobPortal) ? ui.jobPortal : (open[0] || 'linkedout');
  const p = portals[pid];
  const f = funnel(s);
  const intl = s.player.profile.international;
  const band = heatBand(s);
  const listings = portalOpen(s, pid) ? listingsFor(s, pid) : [];

  const auth = intl ? `<fieldset class="group jobs-auth"><legend>${t('Work authorisation')}</legend>
    <p class="small">${t(AUTH_QUESTION)} <b>${t('Yes')}</b> <span class="muted tiny">${t('(with a document that expires)')}</span></p>
    <p class="small">${t(SPONSOR_QUESTION)}</p>
    <div class="row">${['yes', 'no'].map(v => `<button class="btn small ${s.jobs.form.sponsorship === v ? 'primary' : ''}" data-action="work-auth" data-id="${v}" ${s.stage !== 'plan' ? 'disabled' : ''}>${t(v === 'yes' ? 'Yes' : 'No')}</button>`).join('')}</div>
    <p class="tiny muted">${t(SPONSOR_NOTE)}</p>
    ${s.jobs.form.sponsorship === 'no' ? `<p class="tiny truth-bad">${t('Answering no clears the screen and surfaces again at the I-9, in a room, with a folder.')}</p>` : ''}
  </fieldset>` : '';

  const tracker = f.sent ? `<fieldset class="group"><legend>${t('applications.xls')}</legend>
    <table class="mini"><tr><th>${t('Sent')}</th><th>${t('Screens')}</th><th>${t('Visits')}</th><th>${t('Offers')}</th><th>${t('Rejected')}</th><th>${t('Silent')}</th></tr>
    <tr><td>${f.sent}</td><td>${f.screens}</td><td>${f.onsites}</td><td>${f.offers}</td><td>${f.rejected}</td><td>${f.silent}</td></tr></table>
    ${f.auto ? `<p class="tiny muted">${t('{n} of those closed inside the hour on work authorisation.', { n: f.auto })}</p>` : ''}
    <div class="app-rows">${s.jobs.apps.slice(-8).reverse().map(a => `<div class="app-row"><b>${esc(a.name)}</b><span class="tag ${a.stage === 'offer' ? 'ok' : ['rejected', 'ghosted', 'withdrawn'].includes(a.stage) ? 'bad' : 'warn'}">${esc(t(a.stage))}</span>${!['rejected', 'ghosted', 'withdrawn', 'offer'].includes(a.stage) ? btn(t('Withdraw'), 'job-withdraw', { id: a.id, cls: 'small link', disabled: s.stage !== 'plan' }) : ''}</div>`).join('')}</div>
  </fieldset>` : '';

  const quiet = !s.jobs.secret.disclosed && !s.jobs.secret.discovered && s.jobs.apps.some(a => a.quiet)
    ? `<div class="note ${band === 'loud' || band === 'obvious' ? 'warn' : ''}"><b>${t('Your advisor does not know.')}</b> ${esc(t({
        quiet: 'Nothing has come up. Nobody has mentioned anything.',
        noticeable: 'A recruiter used your university address once. It is probably nothing.',
        obvious: 'Two people have asked, separately, whether you are around this spring.',
        loud: 'It is going to come out. The only question left is who says it.',
      }[band]))} ${btn(t('Tell them yourself'), 'job-disclose', { cls: 'small', disabled: s.stage !== 'plan' })}</div>` : '';

  const body = !portalOpen(s, pid)
    ? `<p class="muted">${esc(t(p.empty))}</p>${s.month < p.minMonth ? `<p class="tiny muted">${t('Opens from year {n}.', { n: Math.floor(p.minMonth / 12) + 1 })}</p>` : ''}`
    : p.needsLetters && letterCount(s) < LETTERS_REQUIRED
      ? `<p class="truth-bad">${t('{have} of {need} letters. The portal will not transmit an incomplete file, and it says so before it takes the fee.', { have: letterCount(s), need: LETTERS_REQUIRED })}</p>`
      : listings.length
        ? `<div class="listings">${listings.slice(0, 8).map(e => {
            const blocked = e.gate.blocked || e.sponsorBlocked;
            return `<div class="listing ${blocked ? 'blocked' : ''}">
              <div class="row between"><b>${esc(e.name)}</b>${tag(t(e.kind), '')}</div>
              <p class="small muted">${esc(t(e.where))}</p>
              ${e.applicants ? `<p class="tiny muted">${t('{n} applicants', { n: e.applicants[0] })}+</p>` : ''}
              ${e.sponsorBlocked ? `<p class="tiny truth-bad">${t('Does not sponsor. You may still apply, and you will hear back the same afternoon.')}</p>` : ''}
              ${e.gate.blocked ? `<p class="tiny truth-bad">${esc(e.gate.why)}</p>`
                : `<div class="row">${Object.values(efforts).map(x => `<button class="btn small" data-action="job-apply" data-id="${esc(e.id)}" data-effort="${x.id}" ${s.stage !== 'plan' || s.player.stats.energy < x.energy ? 'disabled' : ''} title="${esc(t(x.hint))}">${esc(t(x.label))} <span class="muted">−${x.energy}</span></button>`).join('')}</div>`}
            </div>`;
          }).join('')}</div>`
        : `<p class="muted">${esc(t(p.empty))}</p>`;

  return `<div class="webpage jobs-page">
    <div class="row">${Object.values(portals).map(x => btn(x.name.split(' —')[0], 'job-portal', { id: x.id, cls: `small ${pid === x.id ? 'primary' : ''}` })).join('')}</div>
    <h1>${esc(p.name)}</h1><p class="muted">${esc(t(p.tagline))}</p>
    <p class="small">${esc(t(p.chrome))}</p>
    ${quiet}${auth}${body}${tracker}
  </div>`;
}

export function browserApp(s, ui) {
  const tab = ui.browserTab || 'overgrief';
  const tabs = [['overgrief', 'Overgrief'], ['openregret', 'OpenRegret'], ['chatphd', 'ChatPHD'], ['deadlines', t('Deadlines')], ['arxive', 'arXive']];
  if (s.month >= 30 && s.phase === 'playing') tabs.push(['jobs', t('Jobs')]);
  const url = { overgrief: 'https://overgrief.academic/project/main.tex', openregret: 'https://openregret.net/author/console', chatphd: 'https://chatphd.ai/', deadlines: 'https://whenisthedeadline.es/', arxive: 'https://arxive.org/list/new', jobs: 'https://www.linkedout.com/jobs/search?keywords=phd' }[tab];
  const page = ({ overgrief, openregret, chatphd, deadlines: deadlinesPage, arxive, jobs: jobsPage }[tab] || overgrief)(s, ui);
  return `<div class="browser-chrome"><div class="tabs">${tabs.map(([id, label]) => btn(label, 'browser-tab', { id, cls: tab === id ? 'active' : '' })).join('')}</div><div class="address"><span class="muted">◀ ▶ ↻</span><span class="url sunken">${url}</span><span class="muted">☆</span></div></div>${page}`;
}

// Draft letter typed into the rebuttal composer.
export function rebuttalDraft(s, id) {
  const r = rebuttals.find(x => x.id === id);
  return r ? t(r.draft || r.name) : '';
}
