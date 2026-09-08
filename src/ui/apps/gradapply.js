import { esc, btn, bar, group, tag, money, note, oddsTag, dots, band } from '../helpers.js';
import { icon } from '../icons.js';
import { avatar, crest, crestMotto } from '../avatars.js';
import { portalNote } from '../../data/decisions.js';

// A decision that has been made and not yet read. The table must not answer the question the
// portal exists to answer.
// One definition, in the engine, so the strip and the gate cannot disagree.
const sealed = a => unopened({ applications: [a] }).length > 0;
import { schools, backgrounds, topics } from '../../data/catalog.js';
import { emailOpeners, emailFollowUps, studentOpeners, interviewQuestions, visitQuestions } from '../../data/threads.js';
import { campus, campusFields } from '../../data/campus.js';
import { admissionChance, applicationCost, nextStep, interviewStep, unopenedDecisions as unopened } from '../../engine/apply.js';
import { LETTERS_EXPECTED, RECOMMENDER_NOTE } from '../../data/recommenders.js';
import { lastName } from '../../engine/state.js';
import { t } from '../../i18n/index.js';

const phases = ['prep', 'application', 'interviews', 'admissions'];
const tabDefs = () => [['prep', t('Prepare'), t('Fall 2027')], ['application', t('Programs'), t('December 2027')], ['interviews', t('Status'), t('Jan–Mar 2028')], ['admissions', t('Offers'), t('April 2028')]];

// Energy is the whole budget of this phase, so it gets a meter rather than a footnote.
export function energyMeter(s) {
  const e = Math.max(0, Math.min(100, s.player.stats.energy));
  const band = e > 60 ? 'ok' : e > 30 ? 'warn' : e > 12 ? 'low' : 'spent';
  const word = { ok: t('Rested enough'), warn: t('Running down'), low: t('Nearly out'), spent: t('Empty') }[band];
  return `<div class="energy-meter ${band}" title="${esc(t('Energy is the budget for this whole phase. It does not come back before December.'))}">
    <span class="em-label">${icon('bolt', 13)} ${t('Energy')}</span>
    <div class="em-track"><i style="width:${e}%"></i></div>
    <b class="em-val">${Math.round(e)}</b><span class="em-word">${esc(word)}</span>
  </div>`;
}
function header(s, ui, title, sub, action = '') {
  const st = s.player.stats;
  return `<div class="topstrip raised"><div><h1>${title}</h1><div class="sub">${sub}</div></div><div class="stack right">${action}${energyMeter(s)}<span class="tiny muted">${esc(s.player.name)} · ${money(st.money)}</span></div></div>
  <div class="tabs" style="margin-bottom:8px">${tabDefs().map(([id, label, when]) => btn(`${label} <span class="tiny muted">${when}</span>`, 'ga-tab', { id, disabled: id === 'admissions' && unopened(s).length > 0, title: id === 'admissions' && unopened(s).length > 0 ? t('Read your updates first.') : '', cls: (unopened(s).length ? 'interviews' : (ui.gaTab || s.phase)) === id ? 'active' : '', disabled: phases.indexOf(id) > phases.indexOf(s.phase) }))}</div>
  ${guideStrip(s, ui)}`;
}

// The single next thing worth doing. The difficulty in this game is meant to be the choices,
// not working out what the screen wants.
function guideStrip(s, ui) {
  if (ui.guideOff) return '';
  const g = nextStep(s);
  if (!g) return '';
  const cta = g.action === 'prep' && g.id
    ? btn(g.label, 'prep', { cls: 'primary small', attrs: `data-target="" data-guide="1"`, id: g.id })
    : g.action && g.action !== 'prep'
      ? btn(g.label, g.action, { cls: 'primary small', attrs: 'data-guide="1"' })
      : g.label ? `<span class="guide-hint">${esc(g.label)}</span>` : '';
  return `<div class="guide">
    <span class="guide-mark">${icon('info', 16)}</span>
    <div class="guide-body"><b>${esc(g.title)}</b><span class="small">${esc(g.detail)}</span></div>
    <div class="guide-cta">${cta}${btn(t('Hide'), 'guide-off', { cls: 'small link', title: t('Hide these prompts for the rest of the run.') })}</div>
  </div>`;
}
function schoolCard(s, sc, extra = '') {
  return `<div class="school-head"><span class="crest-box">${crest(sc, 44)}</span><div><b>${esc(sc.name)}</b> <span class="tiny muted">“${esc(t(crestMotto(sc)))}”</span><div class="small muted">${esc(sc.tagline)}</div></div>${extra}</div>`;
}

export function prepare(s, ui) {
  const p = s.prep;
  const sopSteps = p.sopSteps;
  const emailed = Object.values(s.threads).filter(x => x.kind === 'email').length;
  return `${header(s, ui, t('GradApply — Preparation'), t('September to November 2027. Energy is the budget; December is the deadline. Whatever you do not do now, you will not do.'), btn(t('Proceed to applications (December) →'), 'prep', { id: 'proceed', cls: 'primary continue', disabled: !p.letters.some(l => l.asked) }))}
  ${note(t('Every step below costs Energy. Statement quality, letters, and contact with professors all feed into your odds. You will not have Energy for everything; that is the point.'))}
  <div class="grid-3"><div>${group(`${t('Statement of purpose')} ${tag(`${Math.round(p.sop)}/100`, p.sop > 60 ? 'ok' : p.sop > 35 ? 'warn' : 'bad')}`, `${bar(t('Quality'), p.sop)}<div class="stack" style="margin-top:6px">${btn(t('Draft it (−6 Energy)'), 'prep', { id: 'sop_draft', cls: 'small', disabled: sopSteps.includes('draft') })}${btn(t('Ask a friend to read it (−4)'), 'prep', { id: 'sop_friend', cls: 'small', disabled: !sopSteps.includes('draft') || sopSteps.includes('friend') })}${btn(t('Ask a recommender for notes (−3)'), 'prep', { id: 'sop_mentor', cls: 'small', disabled: !sopSteps.includes('draft') || sopSteps.includes('mentor') })}${btn(t('Name the actual research question (−5)'), 'prep', { id: 'sop_specific', cls: 'small', disabled: !sopSteps.includes('draft') || sopSteps.includes('specific'), title: t('Worth far more once you have researched three or more programs — you cannot aim a question at people you have not read.') })}${btn(t('Cut it to two pages (−4)'), 'prep', { id: 'sop_cut', cls: 'small', disabled: !sopSteps.includes('draft') || sopSteps.includes('cut') })}${btn(t('Read it aloud again (−3)'), 'prep', { id: 'sop_reread', cls: 'small', disabled: !sopSteps.includes('draft') || sopSteps.filter(x => x === 'reread').length >= 3, title: t('Diminishing, three times over. Past that it is a way of not sending it.') })}</div>`)}
  ${group(t('Standardized test'), p.gre === null ? `<p class="small muted">${t('The GRE is “optional,” a word with a range of meanings. Exam-style programs peek at it.')}</p><div class="row">${btn(t('Take it (−8 Energy, −$220)'), 'prep', { id: 'gre', cls: 'small' })}${btn(t('Skip it'), 'prep', { id: 'gre', cls: 'small', attrs: 'data-target="skip"' })}</div>` : `<p class="small">${p.gre === 'skipped' ? t('Skipped. Bold.') : t('Quant {score}. The chair was designed by a rival.', { score: p.gre })}</p>`)}
  ${group(t('Fees'), p.waiverRolled ? `<p class="small">${p.waivers ? t('Waivers approved: applications are free.') : t('Waiver denied. {fee} each, payable to a portal.', { fee: money(applicationCost(s, 'generic', false).money) })}</p>` : `<p class="small muted">${t('{fee} per application unless waived. Waivers go to people who fill out the right form on the right site.', { fee: money(applicationCost(s, 'generic', false).money) })}</p>${btn(t('Request fee waivers (−3 Energy)'), 'prep', { id: 'waiver', cls: 'small' })}`)}</div>
  <div>${(() => {
    const asked = p.letters.filter(l => l.asked);
    const head = `${t('Recommendation letters')} ${tag(t('{n} of {m} asked', { n: asked.length, m: LETTERS_EXPECTED }), asked.length >= LETTERS_EXPECTED ? 'ok' : asked.length ? 'warn' : 'bad')}`;
    return group(head, `<p class="small muted">${t(RECOMMENDER_NOTE)}</p>${p.letters.map(l => `<div class="request ${l.asked ? 'done' : ''}"><div class="meta"><span><b>${esc(l.name)}</b> · ${esc(t(l.relation))}</span><span>${l.asked ? (l.reminded ? t('asked & reminded') : t('asked')) : t('not asked')}</span></div><span class="rec-note">${esc(t(l.note || ''))}</span><div class="row">${btn(t('Ask for a letter (−2)'), 'prep', { id: 'letter_ask', cls: 'small', disabled: l.asked, attrs: `data-target="${l.id}"` })}${btn(t('Send a reminder (−2)'), 'prep', { id: 'letter_remind', cls: 'small', disabled: !l.asked || l.reminded, attrs: `data-target="${l.id}"` })}</div></div>`).join('')}`);
  })()}</div>
  <div>${group(`${t('Prospective advisors')} ${emailed ? tag(t('{n} emailed', { n: emailed }), 'info') : ''}`, `<p class="small muted">${t('Email a professor of interest. Most replies say “apply through the portal.” Some say more. Pick a school below to see its faculty and write.')}</p><div class="school-pick">${schools.map(sc => {
      const wroteTo = s.advisors.filter(a => a.schoolId === sc.id && s.threads[`${a.id}:email`]).length;
      const read = !!s.prep.researched[sc.id];
      const cls = [ui.gaSchool === sc.id ? 'primary' : '', wroteTo ? 'visited' : read ? 'researched' : ''].filter(Boolean).join(' ');
      const why = wroteTo ? t('You have written to {n} professor(s) here.', { n: wroteTo }) : read ? t('You have read up on this program.') : esc(sc.tagline);
      return `<button class="btn small ${cls}" data-action="ga-school" data-id="${sc.id}" title="${esc(why)}">${crest(sc, 16)} ${esc(sc.name)}</button>`;
    }).join('')}</div>${ui.gaSchool ? facultyPanel(s, ui, schools.find(x => x.id === ui.gaSchool)) : ''}`)}</div></div>`;
}
function facultyPanel(s, ui, sc) {
  const facs = s.advisors.filter(a => a.schoolId === sc.id);
  return `<div class="faculty-panel">${schoolCard(s, sc, `<span class="small muted">${sc.topics.map(x => esc(topics[x])).join(' · ')}</span>`)}${researched(s, sc)}<div class="cols two">${facs.map(a => { const th = s.threads[`${a.id}:email`]; const st = s.threads[`${a.id}:student`]; return `<div class="offer-card"><div class="advisor-card">${avatar(a.id, 44)}<div><b>${t('Prof. {name}', { name: a.name })}</b><div class="small muted">${esc(topics[a.topic])} · ${t('lab of {n}', { n: a.labSize })}${a.openingsKnown ? ` · ${a.openings === 0 ? t('not recruiting') : t('{n} opening(s)', { n: a.openings })}` : ''}</div><div class="traits" style="margin-top:4px">${['ambition', 'prestige', 'connections', 'funding'].map(k => `<span>${t(k)}<b>${dots(a[k])}</b></span>`).join('')}</div></div></div>${a.known?.length ? `<ul class="hint-list">${a.known.map(k => `<li>${t('You learned: {fact}.', { fact: k })}</li>`).join('')}</ul>` : ''}<div class="row" style="margin-top:6px">${btn(th ? t('Open thread') : t('Write an email'), 'ga-thread', { id: `${a.id}:email`, cls: 'small' })}${st ? btn(t('Message the student'), 'ga-thread', { id: `${a.id}:student`, cls: 'small' }) : ''}</div></div>`; }).join('')}</div></div>`;
}
const researched = (s, sc) => {
  const r = s.prep.researched[sc.id];
  if (!r) return `<div class="row">${btn(t('Research this program (−1 Energy)'), 'prep', { id: 'research', cls: 'small link', attrs: `data-target="${sc.id}"` })}<span class="tiny muted">${t('The website, a forum thread, and someone who actually goes there.')}</span></div>`;
  const facts = `<p class="small">${t('Structure')}: ${sc.structure === 'exam' ? t('written qualifier in year two') : t('project-based prelim in year two')} · ${t('climate {c}', { c: t(sc.climate) })} · ${t('rent {r} vs stipend {s}', { r: money(sc.rent), s: money(sc.stipend) })}</p>`;
  const notes = Array.isArray(r.notes) ? r.notes : [];
  // The place, not the ranking. Two programs with the same numbers are not the same six years.
  const v = campus[sc.id];
  const vibe = v ? `<div class="campus"><b class="small">${t('The place itself')}</b><dl>${campusFields.map(([k, label]) => v[k] ? `<dt>${esc(t(label))}</dt><dd>${esc(t(v[k]))}</dd>` : '').join('')}</dl></div>` : '';
  return `${facts}${vibe}${notes.length ? `<div class="insider"><b class="small">${t('What people who are there say')}</b><ul>${notes.map(n => `<li>“${esc(t(n.line))}” <span class="src">— ${esc(t(n.from))}</span></li>`).join('')}</ul></div>` : ''}`;
};

export function programs(s, ui) {
  const st = s.player.stats;
  const effort = ui.effort || 'generic', contact = !!ui.contact;
  const cost = applicationCost(s, effort, contact);
  const filter = ui.gaFilter || 'all';
  const list = schools.filter(sc => filter === 'all' || (filter === 'mine' && sc.topics.includes(s.player.profile.topic)) || (filter === 'applied' && s.applications.some(a => a.schoolId === sc.id)));
  return `${header(s, ui, t('GradApply — Programs'), t('Deadline: December 15, 2027 (most programs). Name a professor of interest; it routes your file.'), btn(t('Submit {n} application(s) & wait →', { n: s.applications.length }), 'admissions', { cls: 'primary continue', disabled: !s.applications.length }))}
  ${note(s.applications.length < 4 ? t('Aim for 4–8 programs across the odds range. Fit and a named professor help; nothing is guaranteed.') : t('A reasonable spread. Submit when ready, or keep going until the money or the will runs out.'))}
  ${(() => {
    const wrote = Object.values(s.threads).filter(x => x.kind === 'email');
    if (!wrote.length) return '';
    return group(t('Professors you wrote to in the autumn'), `<div class="row wrap">${wrote.map(th => {
      const a = s.advisors.find(x => x.id === th.advisorId); if (!a) return '';
      const sc = schools.find(x => x.id === a.schoolId);
      const replied = th.messages?.some(m => m.from === 'them');
      return `<button class="btn small" data-action="ga-thread" data-id="${a.id}:email" title="${esc(t('Reread the thread'))}">${avatar(a.id, 16)} ${esc(lastName(a.name))} <span class="tiny muted">${esc(sc?.name || '')}</span> ${replied ? tag(t('replied'), 'ok') : tag(t('no reply'), '')}</button>`;
    }).join('')}</div><p class="tiny muted">${t('Naming one of these as your professor of interest is what the “mention the email you sent” box is for.')}</p>`);
  })()}
  ${(() => {
    // Every one of these numbers used to be a hardcoded string, and every one of them had drifted
    // from what the game actually charges: the dropdown said 3 and 7 Energy against a real 4 and 6,
    // the checkbox said +3 against a real +2, and the fee line said $75 against a real $90 — on the
    // one screen where the game asks you to budget. They are read off the same function that takes
    // the money now, so they cannot disagree again.
    const eGeneric = applicationCost(s, 'generic', false).energy;
    const eTailored = applicationCost(s, 'tailored', false).energy;
    const eContact = applicationCost(s, effort, true).energy - applicationCost(s, effort, false).energy;
    return group(t('Settings for the next application'), `<div class="row"><label class="field"><span>${t('Effort')}</span><select id="effort-select">${[['generic', t('Generic application · {n} Energy', { n: eGeneric })], ['tailored', t('Tailored statement · {n} Energy · better odds', { n: eTailored })]].map(([v, l]) => `<option value="${v}" ${effort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label class="check" style="margin-top:14px"><input id="contact-faculty" type="checkbox" ${contact ? 'checked' : ''}> ${t('Mention the email you sent (+{n} Energy)', { n: eContact })}</label><span class="small muted" style="margin-left:auto">${t('Next')}: ${cost.money ? money(cost.money) : t('fee waived')} · ${t('{n} Energy', { n: cost.energy })}</span></div><div class="row" style="margin-top:6px"><span class="small muted">${t('Show')}:</span>${[['all', t('All {n}', { n: schools.length })], ['mine', t('My area')], ['applied', t('Applied')]].map(([id, l]) => btn(l, 'ga-filter', { id, cls: `small ${filter === id ? 'primary' : ''}` })).join('')}</div>`);
  })()}
  <div class="listview apply-table"><div class="lv-head"><span>${t('Program')}</span><span>${t('Areas · prelim')}</span><span>${t('Stipend/mo')}</span><span>${t('Rent/mo')}</span><span>${t('Your odds')}</span><span>${t('Professor of interest')}</span></div>${list.map(sc => { const applied = s.applications.find(a => a.schoolId === sc.id); const facs = s.advisors.filter(a => a.schoolId === sc.id); const poi = ui.poi?.[sc.id] || facs[0].id; const chance = admissionChance(s, sc, { effort, contact, poiId: poi }); return `<div class="lv-row"><span class="school-cell">${crest(sc, 30)}<span><b>${esc(sc.name)}</b><br><span class="tiny muted">${esc(sc.tagline)}</span></span></span><span class="small">${sc.topics.map(x => esc(topics[x])).join(' · ')}<br><span class="tiny muted">${sc.structure === 'exam' ? t('exam-style') : t('project-style')} · ${t(sc.climate)}</span></span><span>${money(sc.stipend)}</span><span>${money(sc.rent)}</span><span>${applied ? tag(applied.effort === 'tailored' ? t('Applied · tailored') : t('Applied'), 'ok') : oddsTag(chance)}</span><span>${applied
      ? (() => { const pa = s.advisors.find(a => a.id === applied.poiId); const th = pa && s.threads[`${pa.id}:email`];
          return `<span class="small">${esc(lastName(pa?.name || ''))}${th ? ` ${btn(`${icon('mail', 12)} ${t('thread')}`, 'ga-thread', { id: `${pa.id}:email`, cls: 'small link', title: t('Read what you wrote and what came back.') })}` : ''}</span>`; })()
      : `<span class="poi-pick">${facs.map(a => {
          const th = s.threads[`${a.id}:email`];
          const replied = th && th.messages?.some(m => m.from === 'them');
          const title = th ? t('You wrote to them{reply}. Click the envelope to reread the thread.', { reply: replied ? t(' and they replied') : t('; no reply yet') }) : esc(a.comment);
          return `<span class="contacted"><button class="btn small ${poi === a.id ? 'primary' : ''} ${th ? 'contacted-on' : ''}" data-action="ga-poi" data-id="${sc.id}" data-target="${a.id}" title="${esc(title)}${a.openingsKnown ? ` · ${t('{n} opening(s)', { n: a.openings })}` : ''}">${avatar(a.id, 16)} ${esc(lastName(a.name))}${th ? ` <b class="wrote" title="${esc(t('You have written to them.'))}">✉</b>` : ''}</button>${th ? btn(icon('mail', 12), 'ga-thread', { id: `${a.id}:email`, cls: 'small link thread-peek', title: t('Reread the thread') }) : ''}</span>`;
        }).join('')}${btn(t('Apply'), 'apply', { id: sc.id, cls: 'small primary', disabled: st.money < cost.money || st.energy < cost.energy, attrs: `data-target="${poi}"` })}</span>`}</span></div>`; }).join('')}</div>`;
}

export function status(s, ui) {
  const pending = s.applications.filter(a => a.interview && !a.interview.done);
  return `${header(s, ui, t('GradApply — Status'), t('January to March 2028. Interviews, waiting, refreshing. The portal has one button and it is “Refresh.”'), pending.length ? `<span class="small">${t('{n} interview(s) to do', { n: pending.length })}</span>` : btn(t('Refresh the portal (March decisions) →'), 'decisions', { cls: 'primary continue' }))}
  ${unopened(s).length ? '' : note(pending.length ? t('Interview invitations arrived. Each is a short video call with your professor of interest: three questions, then a decision you will not hear for weeks.') : t('Nothing to do but wait. Decisions arrive in March; waitlists move in April.'))}
  ${unopened(s).length ? `<div class="updates"><b>${t('{n} update(s) waiting', { n: unopened(s).length })}</b><p class="tiny muted">${esc(t(portalNote))}</p><div class="up-row">${unopened(s).map(a => { const sc = schools.find(x => x.id === a.schoolId); return `<button class="btn update" data-action="decision-open" data-id="${a.schoolId}">${crest(sc, 18)}<span><b>${esc(sc.name)}</b><small>${t('View update')}</small></span></button>`; }).join('')}</div></div>` : ''}
  <div class="listview apply-table"><div class="lv-head"><span>${t('Program')}</span><span>${t('Professor of interest')}</span><span>${t('Submitted')}</span><span>${t('Letters')}</span><span>${t('Status')}</span><span></span></div>${s.applications.map(app => { const sc = schools.find(x => x.id === app.schoolId); const poi = s.advisors.find(a => a.id === app.poiId); const late = s.prep.letters.filter(l => l.asked && l.status === 'late').length; return `<div class="lv-row"><span class="school-cell">${crest(sc, 30)}<b>${esc(sc.name)}</b></span><span class="small">${avatar(poi.id, 18)} ${esc(poi.name)}</span><span class="small">Dec 15 · ${t(app.effort)}</span><span class="small">${late ? t('{n} late', { n: late }) : t('on time')}</span><span>${tag(sealed(app) ? t('update waiting') : t(app.status), sealed(app) ? 'warn' : app.status === 'admitted' ? 'ok' : app.status === 'rejected' ? 'bad' : app.status === 'interview' ? 'warn' : 'info')}</span><span>${app.interview && !app.interview.done ? btn(t('Join the call'), 'ga-thread', { id: `${app.schoolId}:interview`, cls: 'small primary' }) : app.interview ? btn(t('Transcript'), 'ga-thread', { id: `${app.schoolId}:interview`, cls: 'small link' }) : ''}</span></div>`; }).join('')}</div>`;
}

export function offers(s, ui) {
  const waiting = s.applications.filter(a => a.waitlisted && !a.resolved);
  return `${header(s, ui, t('GradApply — Offers'), t('{n} offer(s). Visit days in April. Decide by April 15; the deadline is real and the weather is not.', { n: s.offers.length }), waiting.length ? btn(t('Wait for the waitlist ({n}) →', { n: waiting.length }), 'wait-april', { cls: 'continue', title: t('Resolve waitlists. About one in three moves.') }) : '')}
  <div class="row" style="margin-bottom:8px">${s.applications.map(a => { const sc = schools.find(x => x.id === a.schoolId); return tag(`${sc.name}: ${sealed(a) ? t('update waiting') : t(a.status)}`, sealed(a) ? 'warn' : a.status === 'admitted' ? 'ok' : a.status === 'waitlisted' ? 'warn' : 'bad'); }).join('')}</div>
  ${note(t('An advisor is more than a name on a website. Visit day: ask the professor questions (answers are honest-ish) and ask current students (answers are biased, tired, or both). Then accept an offer.'))}
  ${s.offers.map(id => { const sc = schools.find(x => x.id === id); const app = s.applications.find(a => a.schoolId === id); const funding = app?.funding === 'fellowship' ? t('first-year fellowship') : app?.funding === 'RA' ? t('research assistantship') : t('teaching assistantship'); return group(`${esc(sc.name)} — ${t('{s}/mo stipend · rent {r} · {f} · {p} prelim', { s: money(sc.stipend), r: money(sc.rent), f: funding, p: sc.structure === 'exam' ? t('exam-style') : t('project-style') })}`, `<div class="row" style="margin-bottom:6px">${crest(sc, 40)}<span class="small muted">“${esc(t(crestMotto(sc)))}” · ${esc(sc.tagline)}</span></div><div class="cols two">${s.advisors.filter(a => a.schoolId === id).map(a => { const v = s.threads[`${a.id}:visit`]; return `<div class="offer-card ${a.id === app?.poiId ? 'poi' : ''}"><div class="advisor-card">${avatar(a.id, 48)}<div><b>${t('Prof. {name}', { name: a.name })}</b> ${a.id === app?.poiId ? tag(t('your POI'), 'info') : ''}<div class="small muted">${esc(topics[a.topic])} · ${t('lab of {n}', { n: a.labSize })}${a.fellowship ? ` · ${t('fellowship attached')}` : ''}</div><div class="traits" style="margin-top:4px">${['ambition', 'prestige', 'connections', 'funding'].map(k => `<span>${t(k)}<b title="${band(a[k])}">${dots(a[k])}</b></span>`).join('')}</div></div></div><blockquote>${esc(a.comment)}</blockquote>${a.revealed || a.known?.length ? `<ul class="hint-list">${a.hints.slice(0, a.revealed).map(h => `<li>${t('A student')}: “${esc(t(h))}”</li>`).join('')}${(a.known || []).map(k => `<li>${t('You learned: {fact}.', { fact: k })}</li>`).join('')}</ul>` : ''}<div class="row" style="margin-top:6px">${btn(v?.done ? t('Visit notes') : t('Talk to the professor'), 'ga-thread', { id: `${a.id}:visit`, cls: 'small' })}${btn(a.revealed >= a.hints.length ? t('Students have said enough') : t('Ask a current student (−4)'), 'ask-student', { id: a.id, cls: 'small', disabled: a.revealed >= a.hints.length || s.player.stats.energy < 4 })}${btn(t('Reply to this offer'), 'offer-open', { id: sc.id, cls: 'small primary' })}</div></div>`; }).join('')}</div>`); }).join('') || `<p class="muted">${t('No offers yet.')} ${waiting.length ? t('The waitlist is your last hope, and it is a chair in a hallway.') : ''}</p>`}`;
}

export function gradApply(s, ui) {
  const sealedLeft = unopened(s).length > 0;
  const tab = sealedLeft ? 'interviews'
    : ui.gaTab && phases.indexOf(ui.gaTab) <= phases.indexOf(s.phase) ? ui.gaTab : s.phase;
  return { prep: prepare, application: programs, interviews: status, admissions: offers }[tab](s, ui);
}

export function threadDialog(s, ui) {
  const key = ui.thread; if (!key) return '';
  const [id, kind] = key.split(':');
  const you = t('You');
  if (kind === 'interview') {
    const app = s.applications.find(a => a.schoolId === id); const poi = s.advisors.find(a => a.id === app?.poiId); if (!app?.interview) return '';
    const q = interviewStep(app);
    return dialog(t('MeetMe — interview with Prof. {name}', { name: poi.name }), 'chat', `<div class="thread"><div class="thread-log">${app.interview.questions.map((x, i) => `
        <div class="tl-turn">
          <div class="tl-msg them"><span class="tl-av">${avatar(poi.id, 26)}</span><div><span class="tl-who">${esc(lastName(poi.name))}</span><p>${esc(x.them)}</p></div></div>
          <div class="tl-msg you"><div><span class="tl-who">${you}</span><p>${esc(x.you)}</p></div><span class="tl-av you-av">${esc(String(you)[0] || 'Y')}</span></div>
          <p class="tl-beat">${esc(x.reply)}</p>
        </div>`).join('')}${q && !app.interview.done ? `
        <div class="tl-turn open"><div class="tl-msg them"><span class="tl-av">${avatar(poi.id, 26)}</span><div><span class="tl-who">${esc(lastName(poi.name))}</span><p>${esc(q.them)}</p></div></div></div>` : ''}</div></div>`,
      q && !app.interview.done ? `<div class="choices">${q.options.map((o, i) => `<button class="btn choice" data-action="interview" data-id="${o.id}" data-target="${id}" data-hotkey="${i + 1}"><span><kbd>${i + 1}</kbd></span><span><b>${esc(o.label)}</b><small>${o.check ? t('{what} check', { what: t(o.check.skill || o.check.stat) }) : t('safe')}</small></span><span class="arrow">→</span></button>`).join('')}</div>` : `<p class="small muted">${t('The call ends. “We’ll be in touch.” They will be in touch in March.')}</p>`);
  }
  const a = s.advisors.find(x => x.id === id); if (!a) return '';
  const th = s.threads[key];
  if (kind === 'email') {
    const opts = !th ? emailOpeners.map(o => ({ id: o.id, label: o.label, cost: o.cost, check: o.check })) : th.stage === 1 && !th.done ? emailFollowUps[th.followUp].map(o => ({ id: o.id, label: o.label, cost: o.cost })) : [];
    return dialog(t('Mail — Prof. {name}', { name: a.name }), 'mail', `<div class="thread">${avatar(a.id, 64)}<div class="thread-log">${(th?.messages || [{ from: 'them', text: t('(no messages yet — choose a template below; the wording is yours in spirit)') }]).map(m => `<div class="msg ${m.from === 'you' ? 'mine' : 'advisor'}"><span class="av">${m.from === 'you' ? 'Y' : esc(a.name[0])}</span><div><div class="who"><b>${m.from === 'you' ? you : t('Prof. {name}', { name: lastName(a.name) })}</b></div><p>${esc(m.text)}</p></div></div>`).join('')}</div></div>`,
      opts.length ? `<div class="choices">${opts.map((o, i) => `<button class="btn choice" data-action="email" data-id="${o.id}" data-target="${a.id}" data-hotkey="${i + 1}" ${s.player.stats.energy < o.cost ? 'disabled' : ''}><span><kbd>${i + 1}</kbd></span><span><b>${esc(o.label)}</b><small>${t('−{n} Energy', { n: o.cost })}${o.check ? ` · ${t('{what} check', { what: t(o.check.skill) })}` : ''}</small></span><span class="arrow">→</span></button>`).join('')}</div>` : `<p class="small muted">${th?.done ? t('Thread closed. Faculty inboxes are finite.') : ''}</p>`);
  }
  if (kind === 'student') {
    if (!th) return '';
    const opts = th.done ? [] : studentOpeners.filter(o => !th.asked.includes(o.id));
    return dialog(t('Chat — {student} ({name}’s lab)', { student: th.student, name: lastName(a.name) }), 'chat', `<div class="thread">${avatar(th.student, 64, { bg: '#e8dfc8' })}<div class="thread-log">${th.messages.map(m => `<div class="msg ${m.from === 'you' ? 'mine' : ''}"><span class="av">${m.from === 'you' ? 'Y' : esc(th.student[0])}</span><div><div class="who"><b>${m.from === 'you' ? you : esc(th.student)}</b></div><p>${esc(m.text)}</p></div></div>`).join('')}</div></div>`,
      opts.length ? `<div class="choices">${opts.map((o, i) => `<button class="btn choice" data-action="student" data-id="${o.id}" data-target="${a.id}" data-hotkey="${i + 1}" ${s.player.stats.energy < o.cost ? 'disabled' : ''}><span><kbd>${i + 1}</kbd></span><span><b>${esc(o.label)}</b><small>${t('−{n} Energy', { n: o.cost })} · ${t('mostly true')}</small></span><span class="arrow">→</span></button>`).join('')}</div>` : `<p class="small muted">${t('“Gotta run — group meeting.” The twelve minutes are up.')}</p>`);
  }
  if (kind === 'visit') {
    const opts = th?.done ? [] : visitQuestions.filter(q => !(th?.asked || []).includes(q.id));
    return dialog(t('Visit day — Prof. {name}’s office', { name: a.name }), 'portal', `<div class="scene-strip office"><div class="s-window"></div><div class="s-shelf"></div><div class="s-desk"></div><div class="s-plant"></div><div class="portrait-avatar">${avatar(a.id, 96, { bg: 'transparent' })}</div><span class="scene-caption">${t('VISIT DAY')} · ${esc(schools.find(x => x.id === a.schoolId).name.toUpperCase())}</span></div><div class="thread-log" style="max-height:200px">${(th?.messages || [{ from: 'them', text: t('“Thanks for coming out. The weather is not usually like this.” The weather is exactly like this.') }]).map(m => `<div class="msg ${m.from === 'you' ? 'mine' : 'advisor'}"><span class="av">${m.from === 'you' ? 'Y' : esc(a.name[0])}</span><div><div class="who"><b>${m.from === 'you' ? you : t('Prof. {name}', { name: lastName(a.name) })}</b></div><p>${esc(m.text)}</p></div></div>`).join('')}</div>`,
      opts.length ? `<div class="choices">${opts.map((q, i) => `<button class="btn choice" data-action="visit" data-id="${q.id}" data-target="${a.id}" data-hotkey="${i + 1}" ${s.player.stats.energy < 3 ? 'disabled' : ''}><span><kbd>${i + 1}</kbd></span><span><b>${esc(q.label)}</b><small>${t('−3 Energy · reveals something true')}</small></span><span class="arrow">→</span></button>`).join('')}</div>` : `<p class="small muted">${t('They walk you to the elevator. The elevator is slow. It gives you time to decide nothing.')}</p>`);
  }
  return '';
}
const dialog = (title, ic, body, actions) => `<div class="modal"><section class="dialog" role="dialog" aria-modal="true"><div class="titlebar"><span class="tb-title">${icon(ic, 16)}<span>${title}</span></span><span class="tb-controls">${btn('<i class="glyph">×</i>', 'close-thread', { cls: 'tb-btn', title: t('Close') })}</span></div><div class="body">${body}${actions}</div><div class="buttons">${btn(t('Close'), 'close-thread', { attrs: 'data-default="1"' })}</div></section></div>`;
