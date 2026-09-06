import { esc, btn, bar, group, tag, money, note, dots, band } from './helpers.js';
import { icon } from './icons.js';
import { schools, backgrounds, topics, skillNames, achievements, advisorArchetypes, mutators } from '../data/catalog.js';
import { DISCLAIMER } from '../data/names.js';
import { dateLabel } from '../data/calendar.js';
import { personality, lastName, entryDate, entryText } from '../engine/state.js';
import { t, languages, getLanguage } from '../i18n/index.js';

const select = (label, name, options, value) => `<label class="field"><span>${label}</span><select name="${name}">${options.map(([v, l]) => `<option value="${v}" ${String(value) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;

export function setupWizard(ui, meta, saved, notices) {
  const step = ui.wizardStep || 0;
  const choice = ui.wizardChoice || (saved && saved.phase !== 'ending' ? 'continue' : 'new');
  const banner = `<div class="wizard-banner">${icon('wizard', 40)}<h2>Academic OS<br>${t('Setup')}</h2><small>US CS PhD Simulator<br>${t('Build 1.1 · offline · no account')}</small><small style="margin-top:auto">${t('{e} endings · {a} achievements found on this computer', { e: meta.endings.length, a: meta.achievements.length })}</small></div>`;
  const langRow = `<div class="row" style="margin-top:10px"><span class="small muted">${t('Language')} / 语言:</span>${languages.map(([id, label]) => btn(label, 'language', { id, cls: `small ${getLanguage() === id ? 'primary' : ''}` })).join('')}</div>`;
  let page = '', buttons = '';
  if (step === 0) {
    const opt = (id, label, desc, off = false) => `<button class="option ${choice === id ? 'selected' : ''}" data-action="wiz-choice" data-id="${id}" ${off ? 'disabled' : ''}><span class="radio"></span>${icon(id === 'continue' ? 'disk' : id === 'random' ? 'star' : id === 'collection' ? 'flag' : 'user', 22)}<span><b>${label}</b><span class="muted">${desc}</span></span><span></span></button>`;
    page = `<h1>${t('Welcome to the US CS PhD Simulator Setup Wizard')}</h1><p>${t('This wizard will guide you through applying to graduate school, choosing an advisor with incomplete information, and surviving a computer science PhD in the United States: prelim, proposal, dissertation, defense, and whatever comes after.')}</p><p class="small muted">${t('A satirical life simulation. Your choices matter. So does everything else.')}</p>
    <div class="radio-list" style="margin-top:8px">${opt('continue', saved?.phase === 'ending' ? t('Review the last run’s transcript') : t('Continue the saved run'), saved ? `${esc(saved.player.name)} · ${saved.phase === 'playing' ? dateLabel(saved.month) : saved.phase === 'ending' ? esc(saved.ending.title) : t(saved.phase)} · ${saved.program?.name || t('applying')}` : t('No saved run on this computer'), !saved)}${opt('new', t('New applicant'), t('Answer a short questionnaire about the person behind the application.'))}${opt('random', t('Randomize My Academic Fate'), t('Generate everything. Regret nothing, briefly.'))}${opt('collection', t('Achievements & discoveries'), t('What you have survived so far.'))}</div>${langRow}${notices.map(n => note(esc(n))).join('')}`;
    buttons = `${btn(t('Next >'), 'wiz-next', { cls: 'primary', attrs: 'data-default="1"' })}`;
  } else if (step === 1) {
    page = `<h1>${t('License agreement')}</h1><p class="small">${t('Please read the following before continuing. It is short, which is unusual for a license.')}</p><div class="eula sunken">${esc(t(DISCLAIMER))}

${esc(t('Placeholder names (schools, venues, companies) are parodies of real-world archetypes and are stored in data files so they can be replaced. Advisor, labmate, and committee names are assembled at random from a list of invented names.'))}

${esc(t('By continuing you agree that: (1) nobody in this game is real; (2) any resemblance is a coincidence; (3) the simulation is not advice about any actual program, advisor, or career; (4) Reviewer 2 is a literary device.'))}</div><label class="check" style="margin-top:8px"><input type="checkbox" id="eula" ${ui.eula ? 'checked' : ''}> ${t('I understand that everyone in this game is fictional.')}</label>`;
    buttons = `${btn(t('< Back'), 'wiz-back')}${btn(choice === 'new' ? t('Next >') : choice === 'random' ? t('Generate applicant') : t('Continue'), 'wiz-next', { cls: 'primary', disabled: !ui.eula, attrs: 'data-default="1"' })}`;
  } else {
    page = `<h1>${t('Before the uncertainty')}</h1><p class="small muted">${t('A few details about the person behind the application. There is no perfect profile; there are only different events.')}</p><form id="profile-form"><div class="form"><label class="field"><span>${t('Your name')}</span><input name="name" maxlength="40" value="${esc(t('Alex Student'))}" autocomplete="off" required></label>
    ${select(t('Where are you starting?'), 'background', Object.entries(backgrounds).map(([k, v]) => [k, v.name]))}
    ${select(t('Prior research experience'), 'experience', [['some', t('A little — enough to be curious')], ['extensive', t('Extensive — enough to be worried')], ['none', t('None yet')]])}
    ${select(t('Your strongest skill'), 'strength', skillNames.map(k => [k, t(k)]))}
    ${select(t('Prior publications'), 'publications', [['none', t('No publications yet')], ['yes', t('At least one paper')]])}
    ${select(t('Financial buffer'), 'buffer', [['normal', t('Some savings')], ['tight', t('A little precarious')], ['comfortable', t('Comfortable for now')]])}
    ${select(t('Domestic / international'), 'international', [['false', t('Domestic student')], ['true', t('International student')]])}
    ${select(t('Research interest'), 'topic', Object.entries(topics))}
    ${select(t('Career ambition'), 'ambition', [['undecided', t('Keep my options open')], ['academic', t('An academic career')], ['industry', t('Research in industry')]])}
    ${select(t('Preferred research style'), 'style', [['collaborative', t('Think with other people')], ['independent', t('Figure things out alone')]])}</div><p class="tiny muted" style="margin-top:8px">${t('International status changes which situations you encounter (visas, taxes, distance), not your ability.')}</p></form>`;
    buttons = `${btn(t('< Back'), 'wiz-back')}${btn(t('Create applicant'), 'wiz-submit', { cls: 'primary', attrs: 'data-default="1"' })}`;
  }
  return `<div class="wizard-body">${banner}<div class="wizard-page">${page}</div></div><div class="wizard-buttons">${buttons}${btn(t('Cancel'), 'wiz-cancel')}</div>`;
}

export function endingApp(s, meta) {
  const [title, desc] = personality(s);
  const papers = s.projects.flatMap(p => p.submissionHistory.map(h => ({ p, h })));
  const timeline = s.history.filter(h => !h.routine).slice(-40);
  const epilogues = { phd_faculty: t('Five years later, you are writing a grant at 2 a.m. and a student has just asked whether the change is small. You say yes.'), phd_industry: t('Five years later, you lead a team. Your calendar has a color for “thinking.” Nobody has ever booked it.'), phd_postdoc: t('Two years later, you are on the market again. You are better at it. The market is not.'), phd_startup: t('Three years later, the startup pivots to something adjacent to your thesis. The thesis is cited in the pitch deck, in a footnote.'), phd_open: t('That September, an offer arrives from a place you had not considered. You take it. It is fine. It is, honestly, more than fine.'), abd: t('Ten years later, a stranger cites your second paper in a way that suggests they read it. You feel something. It is not regret, exactly.'), master: t('Two years later, you earn more than your advisor. You do not tell them. They find out anyway.'), industry: t('Three years later, you mentor an intern who is deciding about a PhD. You tell them the truth. They apply anyway.'), burnout: t('A year later, you sleep eight hours a night and read papers for fun. The fun part surprised you.'), advisor: t('Two years later, in a different lab, you finish. The acknowledgments section is very carefully worded.'), no_offer: t('Next cycle, you apply again, with a better statement and worse illusions.'), fail: t('A year later, in a different field, you are good at something. It counts.'), startup: t('Three years later, the startup pivots to something adjacent to your thesis. The thesis is cited in the pitch deck, in a footnote.') };
  const epilogue = epilogues[s.ending.id] || '';
  const relationship = s.advisor ? (s.relationship.conflict > 60 ? t('Strained') : s.relationship.trust > 65 ? t('Supportive') : t('Complicated')) : '—';
  return `<div class="transcript"><div class="hdr">${icon(s.ending.id.startsWith('phd_') ? 'grad' : s.ending.id === 'pass' ? 'star' : 'doc', 36)}<h1>${esc(s.ending.title)}</h1><p>${esc(s.ending.text)}</p>${epilogue ? `<p class="small muted"><b>${t('Epilogue.')}</b> ${esc(epilogue)}</p>` : ''}</div>
  <div class="cols two"><div><div class="persona"><span class="tiny muted">${t('YOUR ACADEMIC ALTER EGO')}</span><h2>${esc(title)}</h2><p style="margin:0">${esc(desc)}</p></div>
  ${group(t('Final stats'), `<table class="grid"><tr><td>${t('Hope')}</td><td class="num">${Math.round(s.player.stats.hope)}</td><td>${t('Papers accepted')}</td><td class="num">${s.counts.accepted}</td></tr><tr><td>${t('Confidence')}</td><td class="num">${Math.round(s.player.stats.confidence)}</td><td>${t('Rejections')}</td><td class="num">${s.counts.rejected}</td></tr><tr><td>${t('Money')}</td><td class="num">${money(s.player.stats.money)}</td><td>${t('Deadlines made / missed')}</td><td class="num">${s.counts.deadlinesMade} / ${s.counts.deadlinesMissed}</td></tr><tr><td>${t('Academic capital')}</td><td class="num">${Math.round(s.player.stats.academicCapital)}</td><td>${t('Advisor requests done / declined / ignored')}</td><td class="num">${s.counts.requestsDone} / ${s.counts.requestsDeclined} / ${s.counts.requestsExpired}</td></tr><tr><td>${t('Advisor relationship')}</td><td class="num">${relationship}</td><td>${t('Meetings held / cancelled')}</td><td class="num">${s.meetingStats.held} / ${s.meetingStats.cancelled}</td></tr><tr><td>${t('Holidays actually taken')}</td><td class="num">${s.counts.holidaysTaken}</td><td>${t('Preprints')}</td><td class="num">${s.counts.preprints}</td></tr><tr><td>${t('Years in the program')}</td><td class="num">${(s.month / 12).toFixed(1)}</td><td>${t('Milestones')}</td><td class="num">${['prelim', 'proposal', 'defense'].filter(k => s.milestones?.[k] === 'pass').map(k => t(k)).join(', ') || '—'}</td></tr></table>`)}
  ${group(t('Papers'), papers.length ? `<table class="grid"><tr><th>${t('Project')}</th><th>${t('Venue')}</th><th>${t('Outcome')}</th></tr>${papers.map(({ p, h }) => `<tr><td>${esc(p.title)}</td><td>${esc(h.venue)} <span class="muted tiny">${esc(h.date || '')}</span></td><td>${tag(t(h.outcome), /Accept|Spotlight|Oral|Award/.test(h.outcome) ? 'ok' : /Reject/.test(h.outcome) ? 'bad' : 'info')}</td></tr>`).join('')}</table>` : `<p class="muted small">${t('No submissions. The reviewers never knew what they missed.')}</p>`)}
  ${group(t('Achievements this run'), s.achievements.length ? s.achievements.map(id => `<div class="achv">${icon('star', 18)}<div><b>${esc(achievements[id]?.name || id)}</b><div class="small muted">${esc(achievements[id]?.desc || '')}</div></div></div>`).join('') : `<p class="muted small">${t('No badges this time. The experience still happened.')}</p>`)}</div>
  <div>${group(t('A record of being here'), `<div class="timeline">${timeline.map(h => `<div><time>${esc(entryDate(h))}</time><span>${esc(entryText(s, h))}</span></div>`).join('')}</div>`)}
  ${s.advisor ? group(t('The people'), `<p class="small">${t('Advisor')}: ${t('Prof. {name}', { name: s.advisor.name })} (${esc(advisorArchetypes.find(a => a.id === s.advisor.archetype)?.name)}). ${t('Conditions')}: ${s.mutators.map(id => esc(mutators.find(m => m.id === id)?.name || id)).join(', ')}.</p><p class="small">${t('Lab')}: ${s.labmates.map(l => esc(l.name)).join(', ')}. ${t('Cohort')}: ${s.peers.map(p => esc(p.name)).join(', ')}.</p>`) : ''}</div></div>
  <div class="row between" style="margin-top:8px"><span class="tiny muted">${t('Seed {seed} · A different advisor is a different story.', { seed: s.seed })} ${esc(t(DISCLAIMER).slice(0, 120))}…</span>${btn(t('Try another academic fate →'), 'new', { cls: 'primary' })}</div></div>`;
}

export function collectionApp(meta, s = null) {
  // There is always a way back. Mid-run it returns you to where you were; otherwise, to the wizard.
  const back = s && s.phase !== 'ending'
    ? btn(`← ${t('Back to the game')}`, 'back-to-game', { cls: 'primary' })
    : btn(`← ${t('Back to the Setup Wizard')}`, 'home', { cls: 'primary' });
  return `<div class="row between" style="margin-bottom:8px">${back}<span class="tiny muted">${t('Nothing here is lost when a run ends.')}</span></div><h1>${t('Things you’ve survived')}</h1><p class="small muted">${t('Discoveries persist between runs on this computer.')}</p><div class="cols two">${group(t('Achievements'), Object.entries(achievements).map(([id, a]) => `<div class="achv ${meta.achievements.includes(id) ? '' : 'locked'}">${icon(meta.achievements.includes(id) ? 'star' : 'x', 18)}<div><b>${esc(a.name)}</b><div class="small muted">${esc(a.desc)}</div></div></div>`).join(''))}<div>${group(t('Advisor archetypes discovered'), advisorArchetypes.map(a => tag(meta.archetypes.includes(a.id) ? a.name : '???', meta.archetypes.includes(a.id) ? 'ok' : '')).join(' '))}${group(t('Endings'), `<p>${t('{n} distinct ending(s)', { n: meta.endings.length })}: ${meta.endings.map(e => esc(t(e))).join(', ') || '—'}</p>`)}${group(t('Situations encountered'), `<p>${t('{n} of ~200 situations. New ones are weighted higher in future runs.', { n: meta.seenEvents.length })}</p>`)}</div></div>`;
}

export const aboutDialog = () => `<div class="modal"><section class="dialog narrow" role="dialog" aria-modal="true"><div class="titlebar"><span class="tb-title">${icon('info', 16)}<span>${t('About Academic OS')}</span></span></div><div class="body"><div class="row"><span>${icon('wizard', 40)}</span><div><b>Academic OS 1.1</b><br><span class="small muted">${t('US CS PhD Simulator · runs entirely in this browser')}</span></div></div><p class="small" style="margin-top:8px">${esc(t(DISCLAIMER))}</p><p class="tiny muted">${t('Venue timing uses representative official cycles from 2025–2027 and is projected by month into later fictional years. It is not a live deadline calendar; check each venue’s official site before a real submission.')}</p></div><div class="buttons">${btn(t('OK'), 'close-dialog', { cls: 'primary', attrs: 'data-default="1"' })}</div></section></div>`;
export const tipsDialog = (s = null) => {
  // A new player starts in the application phase, so the tips about plans and LabChat are about
  // a screen they have not reached yet. Show them what is actually in front of them.
  const applying = s && ['prep', 'application', 'interviews', 'admissions'].includes(s.phase);
  const tips = applying ? [
    t('You are applying to graduate school. It is autumn 2027 and the deadlines are in December.'),
    t('The blue bar at the top is Energy. It is the entire budget for this phase and it does not come back — every action spends some, and December arrives whether you are ready or not.'),
    t('The blue box under the tabs always names the single next thing worth doing, with the button that does it. Follow it if you are unsure; ignore it once you are not.'),
    t('Your statement of purpose is the one document everyone reads. Draft it first, then improve it — naming an actual research question is worth more than anything else you can do to it.'),
    t('Research a program before you write to it. One Energy, and it tells you what people who are actually there say — which is not what the website says.'),
    t('Ask three people for letters. The note under each name is a real hint about what they would write.'),
    t('Then apply to four to eight programs, naming a professor of interest in each. One acceptance is all you need.'),
  ] : [
    t('Each turn: pick a plan, then press Continue (or Enter). Calm months pass in one step; deadline months run week by week; after year two, calm seasons pass three months at a time.'),
    t('Number keys 1–4 pick a choice in any conversation.'),
    t('Your advisor sends requests in LabChat. You can do them, push back, or decline. Ignoring them is also a choice, with a cost.'),
    t('You can message your advisor: ask for leave, funding, a letter, fewer meetings, or a plan. Answers depend on who they are and what month it is.'),
    t('Set a target deadline in OpenRegret. Real venues, real annual cycles.'),
    t('Stress is never shown as a number. Watch the desktop.'),
  ];
  return `<div class="modal"><section class="dialog narrow" role="dialog" aria-modal="true"><div class="titlebar"><span class="tb-title">${icon('info', 16)}<span>${t('Welcome to Academic OS')}</span></span></div><div class="body"><h2>${applying ? t('How this starts') : t('Did you know…')}</h2><ul class="small">${tips.map(x => `<li>${x}</li>`).join('')}</ul><label class="check"><input type="checkbox" id="tips-toggle" checked> ${t('Show tips at startup')}</label></div><div class="buttons">${btn(t('Close'), 'close-dialog', { cls: 'primary', attrs: 'data-default="1"' })}</div></section></div>`;
};

export const confirmDialog = ui => `<div class="modal"><section class="dialog narrow" role="dialog" aria-modal="true"><div class="titlebar"><span class="tb-title">${icon('warn', 16)}<span>Academic OS</span></span></div><div class="body"><h2>${ui.confirm === 'reset' ? t('Reset all saved progress?') : t('Start a new academic fate?')}</h2><p class="small">${ui.confirm === 'reset' ? t('This removes this game’s current run, achievements, discoveries, and settings from this browser.') : t('Your current run will be replaced. Achievements and discoveries remain.')}</p></div><div class="buttons">${btn(t('Cancel'), 'cancel-confirm')}${btn(ui.confirm === 'reset' ? t('Reset Save') : t('New Run'), 'confirm', { cls: 'primary', attrs: 'data-default="1"' })}</div></section></div>`;
export const shutdownDialog = () => `<div class="modal"><section class="dialog narrow" role="dialog" aria-modal="true"><div class="titlebar"><span class="tb-title">${icon('computer', 16)}<span>${t('Shut Down Academic OS')}</span></span></div><div class="body"><p>${t('You cannot shut down. You have a PhD to finish.')}</p><p class="small muted">${t('Closing the tab is allowed. Progress is saved. The deadline is not.')}</p></div><div class="buttons">${btn(t('Fine'), 'close-dialog', { cls: 'primary', attrs: 'data-default="1"' })}</div></section></div>`;
