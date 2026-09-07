import { esc, btn, hotkey, effectPills, money, voiced } from './helpers.js';
import { icon } from './icons.js';
import { avatar } from './avatars.js';
import { memeFor, memeCard } from '../data/memes.js';
import { dateLabel } from '../data/calendar.js';
import { templateById, eventText } from '../engine/events.js';
import { fill, lastName, labmateById, activeProject } from '../engine/state.js';
import { prelimChance, proposalChance, defenseChance } from '../engine/game.js';
import { pushbacks, lectureLines } from '../data/minigames.js';
import { benchNote } from '../data/bench.js';
import { vivaMoves, examiners } from '../data/viva.js';
import { exams, talkMoves, examNote } from '../data/exams.js';
import { clusterNote } from '../data/cluster.js';
import { officeAction, patentShare, patentNote, patentMeetings, PATENT } from '../data/patent.js';
import { summonsKinds, summonsMoves, summonsNote, SUMMONS } from '../data/summons.js';
import { crises, crisisMoves, CRISIS_NOTE } from '../data/crisis.js';
import { t } from '../i18n/index.js';
import { whiteboardApp } from './apps/whiteboard.js';

// ── Scene art ────────────────────────────────────────────────────────────────────────────────
// The strips existed but were static: the same lab at two in the morning as at three in the
// afternoon, in December as in June, in year one as in year six. The art now carries state, which
// is the only reason to have art in a game that is otherwise all prose — you should be able to tell
// roughly when it is and roughly how you are before you read a word.
//
//   sky        time of day, from the tempo and the day index
//   season     the month; snow on the sill in winter, low sun in autumn
//   clutter    coffee cups accumulate as you drink them
//   board      the whiteboard fills as the project does
//   mood       the room desaturates as stress rises

// Day pace knows the hour; anything coarser gets a plausible one from the seed and the month.
function timeOfDay(s) {
  if (s.tempo === 'day') return ['morning', 'day', 'day', 'dusk', 'night'][Math.min(4, s.dayIndex || 0)];
  if (s.player?.hidden?.stress > 72) return 'night';
  return ['morning', 'day', 'dusk'][(s.month + (s.week || 0)) % 3];
}
const seasonOf = m => { const mo = ((m + 8) % 12) + 1; return mo <= 2 || mo === 12 ? 'winter' : mo <= 5 ? 'spring' : mo <= 8 ? 'summer' : 'autumn'; };

function strip(scene, s, e) {
  const advisor = e.speaker === 'advisor' || e.category === 'meeting';
  const caption = advisor ? `${t('PROF.')} ${esc(s.advisor?.name.toUpperCase() || t('ADVISOR'))}` : { lab: t('THE LAB · SOME TIME AFTER COFFEE'), home: t('HOME · SUCH AS IT IS'), life: t('HOME · SUCH AS IT IS'), campus: t('CAMPUS'), party: t('LAB SOCIAL · NOBODY IS WORKING'), portal: t('STUDENT PORTAL · NOTICE'), conference: t('CONFERENCE · HALLWAY TRACK'), winter: t('DECEMBER'), office: t('OFFICE') }[scene] || t('SOMEWHERE');
  const p = activeProject(s);
  const cups = Math.min(5, (s.caffeine?.month || 0) + (s.caffeine?.day || 0));
  const board = Math.round(Math.min(100, p?.progress || 0));
  const time = timeOfDay(s);
  const season = seasonOf(s.month || 0);
  const stress = s.player?.hidden?.stress ?? 30;
  const mood = stress > 74 ? 'm-frayed' : stress > 52 ? 'm-tired' : '';
  // Layers every location gets: a sky behind the window, dust in the light, and the clock.
  const common = `<div class="s-sky"></div>${season === 'winter' ? '<div class="s-snow"></div>' : ''}${time === 'night' ? '<div class="s-dark"></div>' : ''}<div class="s-dust"></div>`;
  const desk = n => `<div class="s-desk"></div><div class="s-cups" data-n="${n}">${'<i></i>'.repeat(n)}</div>`;
  const inner = {
    office: `<div class="s-window"></div><div class="s-shelf"></div>${desk(0)}<div class="s-plant"></div><div class="s-papers"></div><div class="portrait-avatar">${s.advisor ? avatar(s.advisor.id, 110, { bg: 'transparent' }) : ''}</div><div class="call-bar"><i></i> ${t('LIVE')} · ${esc(t(s.cadence?.oneOnOne || 'meeting'))}</div>`,
    lab: `<div class="s-window"></div><div class="s-server"></div><div class="s-board"><i style="width:${board}%"></i></div>${desk(cups)}<div class="s-monitor"><b></b></div><div class="portrait" style="--shirt:#4f7c5b;right:52%"><i></i></div>`,
    home: `<div class="s-window"></div><div class="s-plant" style="left:70%"></div><div class="s-desk" style="left:10%;width:40%"></div><div class="s-cups" data-n="${cups}" style="left:14%">${'<i></i>'.repeat(cups)}</div><div class="s-monitor" style="left:16%"><b></b></div><div class="s-laundry"></div><div class="portrait" style="--shirt:#6b6b8f;right:60%"><i></i></div>`,
    life: `<div class="s-window"></div><div class="s-plant" style="left:70%"></div><div class="s-desk" style="left:10%;width:40%"></div><div class="s-cups" data-n="${cups}" style="left:14%">${'<i></i>'.repeat(cups)}</div><div class="s-laundry"></div><div class="portrait" style="--shirt:#6b6b8f;right:60%"><i></i></div>`,
    campus: `<div class="s-tree"></div><div class="s-banner">${esc(s.program?.name || t('CAMPUS'))} · ${t('DEPARTMENT OF COMPUTER SCIENCE')}</div><div class="s-poster"></div><div class="s-bike"></div><div class="portrait" style="--shirt:#4f7c5b;right:30%"><i></i></div><div class="portrait p3" style="right:55%"><i></i></div>`,
    party: `<div class="s-lights"></div><div class="s-window"></div><div class="s-desk"></div><div class="s-cups" data-n="4"><i></i><i></i><i></i><i></i></div><div class="portrait" style="--shirt:#8f4f6b;right:25%"><i></i></div><div class="portrait p3"><i></i></div>`,
    portal: `<div class="s-form"><b>${t('FORM 27-B · REQUEST FOR PERMISSION TO REQUEST')}</b>${t('Name')}: ________ ID: ________<br>${t('Reason')}: ________________________<br>${t('Approved by')}: ____ ${t('Date')}: ____ ${t('Hold')}: [x]</div><div class="s-stamp">${t('PENDING')}</div>`,
    conference: `<div class="s-banner">${t('WELCOME ATTENDEES · REGISTRATION →')}</div><div class="s-poster"></div><div class="s-lanyard"></div><div class="portrait" style="--shirt:#637ab0;right:40%"><i></i></div><div class="portrait p2"><i></i></div>`,
    winter: `<div class="s-snow"></div><div class="s-window"></div><div class="s-desk" style="background:#8a8f99;border-top-color:#b9bfc9"></div><div class="portrait" style="--shirt:#2f4f6f;right:50%"><i></i></div>`,
  }[scene] || `<div class="s-window"></div>${desk(cups)}<div class="portrait"><i></i></div>`;
  return `<div class="scene-strip ${scene} t-${time} sn-${season} ${mood}">${common}${inner}<span class="scene-caption">${caption}</span>${memeCard(memeFor(e))}</div>`;
}

export function sceneDialog(s) {
  const e = templateById[s.event]; if (!e) return '';
  const scene = e.scene || (e.category === 'meeting' ? 'office' : 'life');
  const advisor = e.speaker === 'advisor' || e.category === 'meeting';
  const actor = s.eventActor ? labmateById(s, s.eventActor.id) : null;
  const title = advisor ? t('MeetMe — Prof. {name}', { name: s.advisor?.name }) : { lab: t('The lab'), home: 'Life.exe', life: 'Life.exe', campus: t('Campus'), party: t('Lab social'), portal: t('Student Portal — Notice'), conference: t('Conference'), winter: t('Winter break') }[scene] || t('Something happened');
  const ic = advisor ? 'chat' : scene === 'portal' ? 'portal' : scene === 'party' ? 'gift' : scene === 'conference' ? 'plane' : scene === 'winter' ? 'snow' : scene === 'lab' ? 'research' : 'home';
  const speaker = advisor ? t('Prof. {name}', { name: lastName(s.advisor.name) }) : actor ? actor.name : e.category === 'crunch' ? t('The deadline') : t('Narrator');
  const mode = s.advisorMode?.id;
  const timed = e.category === 'meeting' && (mode === 'pressed' || s.crunch || s.advisor.toxicity > 55 || s.relationship.conflict > 45);
  const seconds = s.crunch ? 11 : 15;
  return `<div class="modal"><section class="dialog ${timed ? 'timed-scene' : ''}" role="dialog" aria-modal="true" aria-labelledby="scene-title"><div class="titlebar"><span class="tb-title">${icon(ic, 16)}<span>${title}</span></span><span class="tb-right">${esc(dateLabel(s.month))}${s.tempo === 'week' ? ` · ${t('week {n}', { n: Math.min(4, s.week + 1) })}` : ''}</span></div><div class="body">${strip(scene, s, e)}<h2 id="scene-title" style="margin:0 0 6px">${esc(fill(s, e.title))}</h2><div class="scene-text"><span class="speaker">${esc(speaker)}</span>${voiced(eventText(s, e))}</div><div class="choices">${e.choices.map((c, i) => `<button class="btn choice" data-action="choice" data-id="${c.id}" data-hotkey="${i + 1}" ${(c.requiresCoursework && s.coursework < c.requiresCoursework) || (c.requiresMoney && s.player.stats.money < c.requiresMoney) ? 'disabled' : ''}><span>${hotkey(i + 1)}</span><span><b>${esc(fill(s, c.text))}</b><small>${effectPills(c.effects, c, 5)}<span class="muted">${esc(fill(s, c.hint))}${c.requiresCoursework ? ` · ${t('needs {n} coursework', { n: c.requiresCoursework })}` : ''}</span></small></span><span class="arrow">→</span></button>`).join('')}</div>${timed ? timedFooter(seconds) : ''}<div class="dialog-footer"><span>${timed ? t('They are waiting for an answer, visibly.') : e.category === 'meeting' ? t('A meeting. It will end with a list.') : t('Some consequences take time.')}</span><span>${e.choices.some(c => c.check) ? t('Some options roll against your skills or your advisor’s traits.') : ''}</span></div></div></section></div>`;
}

// A meeting under a clock. The bar is honest: when it runs out, the moment closes.
export function timedFooter(seconds) {
  return `<div class="timer-bar meeting" data-scene-timer="${seconds}"><i data-scene-bar></i></div><p class="tiny muted timer-note">${t('They are waiting. {n} seconds.', { n: seconds })}</p>`;
}

// The second beat: your advisor did not accept the first answer.
export function pushbackDialog(s) {
  const pb = pushbacks.find(x => x.id === s.pushback?.id);
  if (!pb) return '';
  const seconds = s.pushback.seconds || 12;
  return `<div class="modal"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="pb-title"><div class="titlebar"><span class="tb-title">${icon('chat', 16)}<span>${t('MeetMe — Prof. {name}', { name: s.advisor?.name })}</span></span><span class="tb-right">${esc(dateLabel(s.month))}</span></div><div class="body pushback">
    <div class="pb-mark">${t('They are not finished.')}</div>
    <h2 id="pb-title">${esc(fill(s, t(pb.text)))}</h2>
    <div class="choices">${pb.options.map((o, i) => `<button class="btn choice" data-action="pushback" data-id="${o.id}" data-hotkey="${i + 1}"><span><kbd>${i + 1}</kbd></span><span><b>${esc(t(o.label))}</b><small>${effectPills(o.effects, o, 4)}</small></span><span class="arrow">→</span></button>`).join('')}</div>
    ${timedFooter(seconds)}
  </div></section></div>`;
}

// The lecture. Real time, and the only enemy is a person with a whiteboard marker.
export function lectureDialog(s) {
  return `<div class="modal"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="lec-title"><div class="titlebar"><span class="tb-title">${icon('book', 16)}<span>${t('Lecture hall 1B')}</span></span><span class="tb-right">${esc(dateLabel(s.month))}</span></div><div class="body">
    <h2 id="lec-title">${t('Two hours of a required course')}</h2>
    <p class="small muted">${esc(t(lectureLines.intro))}</p>
    <div class="lecture" data-lec>
      <div class="lec-front"><span class="lec-prof" data-lec-eye>✎</span><span class="lec-board" data-lec-board></span></div>
      <div class="lec-room">${Array.from({ length: 18 }, (_, i) => `<i class="${i === 9 ? 'you' : ''}"></i>`).join('')}</div>
      <div class="lec-meters">
        <span class="lbl">${t('Lecture')}</span><span class="lec-bar"><i data-lec-time></i></span>
        <span class="lbl">${t('Your draft')}</span><span class="lec-bar work"><i data-lec-work></i></span>
        <span class="lbl">${t('Caught')}</span><b class="lec-caught" data-lec-caught>···</b>
      </div>
      <button class="lec-toggle" data-action="lecture-toggle">${t('Work on the paper')}<small>${t('SPACE')}</small></button>
      <p class="tiny muted" data-lec-hint></p>
    </div>
  </div></section></div>`;
}

// The reading session. Same shape as the lecture: a dialog whose innards are painted by its own
// interval, so a re-render never restarts it.
export function benchDialog(s) {
  return `<div class="modal"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="bq-title"><div class="titlebar"><span class="tb-title">${icon('book', 16)}<span>${t('Reading session')}</span></span></div><div class="body">
    <h2 id="bq-title">${t('An afternoon in the literature')}</h2>
    <p class="small muted">${esc(t(benchNote))}</p>
    <div class="bench">
      <b class="bq-label" data-bq-label></b>
      <p class="bq-stage" data-bq-stage></p>
      <div class="bq-track" data-bq-bar></div>
      <button class="bq-strike" data-action="bench-strike">${t('That is the one')}<small>${t('SPACE')}</small></button>
      <p class="tiny muted" data-bq-tally></p>
    </div>
  </div></section></div>`;
}

// The one scene you cannot dismiss. Every other dialog in this game has a way past it; this one
// has three ways through, and all of them cost something.
export function crisisDialog(s) {
  const c = s.crisis; if (!c || c.resolved) return '';
  const def = crises[c.id];
  return `<div class="modal"><section class="dialog crisis" role="dialog" aria-modal="true" aria-labelledby="cr-title"><div class="titlebar"><span class="tb-title">${icon('heart', 16)}<span>${t('Life.exe')}</span></span></div><div class="body">
    <h2 id="cr-title">${esc(t(def.title))}</h2>
    <p class="scene-text">${esc(t(pick2(s, def.text)))}</p>
    <p class="tiny muted">${t(CRISIS_NOTE)}</p>
    <div class="choices">${Object.values(crisisMoves).map((m, i) => `<button class="btn choice" data-action="crisis" data-id="${m.id}" data-hotkey="${i + 1}"><span><kbd>${i + 1}</kbd></span><span><b>${esc(t(m.label))}</b><small>${esc(t(m.hint))}</small></span><span class="arrow">→</span></button>`).join('')}</div>
  </div></section></div>`;
}
// Deterministic pick that does not consume the run's RNG — this renders on every frame.
const pick2 = (s, arr) => arr[(s.seed + s.month) % arr.length];

export function milestoneDialog(s) {
  const kind = s.milestoneKind || 'prelim';
  const best = s.projects.filter(p => p.kind !== 'thesis').reduce((m, p) => (p.progress > (m?.progress || 0) ? p : m), null);
  const thesis = s.projects.find(p => p.kind === 'thesis');
  const odds = { prelim: prelimChance(s), proposal: proposalChance(s), defense: defenseChance(s), graduation: 1 }[kind];
  const oddsWord = odds > .7 ? t('good') : odds > .45 ? t('even') : t('uphill');
  const title = { prelim: t('Preliminary examination — Room 214'), proposal: t('Thesis proposal — Room 214'), defense: t('Dissertation defense — Room 214'), graduation: t('Commencement') }[kind];
  const heading = { prelim: t('“Tell us about your contribution.”'), proposal: t('“Tell us what the next two years are.”'), defense: t('“Tell us what you did, and why it matters.”'), graduation: t('“Doctor.”') }[kind];
  const emphasis = s.program.structure === 'exam' ? t('This program weighs coursework and the talk.') : t('This program weighs the research.');
  const body = {
    prelim: t('Three professors. One presentation. The projector works, which feels like an omen. Coursework {c} · Presentation {r} · Best project {p} · Papers accepted {a}. {emph} Rough odds: <b>{odds}</b>.', { c: Math.round(s.coursework), r: Math.round(s.readiness), p: Math.round(best?.progress || 0), a: s.counts.accepted, emph: emphasis, odds: oddsWord }),
    proposal: t('Three professors and a document. They want to see a thesis where you see a pile of projects. Papers accepted {a} · Presentation {r} · Best project {p} · Advisor support {sup}. Rough odds: <b>{odds}</b>.', { a: s.counts.accepted, r: Math.round(s.readiness), p: Math.round(best?.progress || 0), sup: s.relationship.trust > 60 ? t('solid') : t('thin'), odds: oddsWord }),
    defense: t('Four professors, two hours, one dissertation at {d}% draft quality and {a} chapter(s) that were once papers. Someone will ask about Chapter 4. Rough odds: <b>{odds}</b>.', { d: thesis ? Math.round(thesis.draft) : 0, a: s.counts.accepted, odds: oddsWord }),
    graduation: t('You passed. The committee shook your hand in an order that meant something. Now the question that has been waiting since year one: what next? Offers on the table: {offers}.', { offers: s.jobs.offers.length ? s.jobs.offers.map(o => esc(t(o))).join(', ') : t('none yet (they arrive later; they always do)') }),
  }[kind];
  const choices = kind === 'graduation'
    ? (s.jobs.market || []).map(o => [o.kind, t('Take it: {name}', { name: t(o.name) }), `${esc(o.org)} · ${o.salary ? money(o.salary) : t('no salary, yet')}`])
    : kind === 'defense'
      ? [['balanced', t('Present the work carefully'), t('Let six years speak.')], ['honest', t('Be honest about the limitations'), t('Committees respect it, mostly.')], ['bold', s.player.stats.confidence > 65 ? t('Defend the big claim') : t('Try to sound certain'), t('Confidence can help; overconfidence can hurt.')]]
      : [['balanced', t('Present the evidence carefully'), t('Let the work speak.')], ['honest', t('Explain the limitations honestly'), t('A small bonus for intellectual clarity.')], ['bold', s.player.stats.confidence > 65 ? t('Defend the big idea') : t('Try to sound certain'), t('Confidence can help; overconfidence can hurt.')], ['master', t('Choose the MS exit'), t('Requires 55 coursework progress. A degree, not an apology.')]];
  const subtitle = { prelim: t('PRELIMINARY EXAMINATION'), proposal: t('THESIS PROPOSAL'), defense: t('DISSERTATION DEFENSE'), graduation: t('COMMENCEMENT') }[kind];
  return `<div class="modal"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="milestone-title"><div class="titlebar"><span class="tb-title">${icon('portal', 16)}<span>${title}</span></span><span class="tb-right">${esc(dateLabel(s.month))}</span></div><div class="body"><div class="scene-strip committee"><div class="s-screen">${esc(kind === 'defense' && thesis ? thesis.title : best?.title || t('A Work in Progress'))}<small>${subtitle} · ${esc(s.player.name.toUpperCase())}</small></div><div class="portrait" style="right:6%;--shirt:#637ab0"><i></i></div><div class="portrait p2" style="right:20%"><i></i></div><div class="portrait p3" style="right:34%"><i></i></div><div class="s-table"></div><span class="scene-caption">${t('COMMITTEE')}: ${s.committee.map(c => esc(c.toUpperCase())).join(' · ')}</span></div>
  <h2 id="milestone-title">${heading}</h2><div class="scene-text"><span class="speaker">${kind === 'graduation' ? t('The dean, allegedly') : t('The committee')}</span>${body}</div>
  <div class="choices">${choices.map(([id, label, h], i) => `<button class="btn choice" data-action="${kind === 'graduation' ? 'graduate' : 'milestone'}" data-id="${id}" data-hotkey="${i + 1}" ${id === 'master' && s.coursework < 55 ? 'disabled' : ''}><span><kbd>${i + 1}</kbd></span><span><b>${esc(label)}</b><small>${esc(h)}</small></span><span class="arrow">→</span></button>`).join('')}</div></div></section></div>`;
}
export const prelimDialog = milestoneDialog;

// Room 214. Same shape as the lecture and the bench: the dialog is a shell, its innards are
// painted by viva.js's own interval, so a re-render never restarts the exam.
export function vivaDialog(s) {
  const kind = s.viva?.kind || 'prelim';
  const ex = exams[kind] || exams.prelim;
  const title = `${t(ex.label)} — ${t(ex.room)}`;
  const moves = Object.values(vivaMoves);
  const talk = Object.values(talkMoves);
  // One dialog, four rooms. Which panel is showing is driven by data-phase, set by the runner, so
  // the whole timetable stays inside one modal and one interval.
  return `<div class="modal"><section class="dialog viva exam" role="dialog" aria-modal="true" aria-labelledby="vv-title"><div class="titlebar"><span class="tb-title">${icon('flag', 16)}<span>${esc(title)}</span></span><span class="tiny tb-right">${esc(t(ex.total))}</span></div><div class="body" data-vv data-phase="talk">
    <div class="ex-timeline" data-vv-progress></div>
    <div class="ex-segbar"><b class="tiny" data-vv-seg></b><span class="tiny muted" data-vv-segsub></span></div>
    <div class="vv-head">
      <div><h2 id="vv-title" data-vv-who></h2><p class="tiny muted" data-vv-note></p></div>
      <b class="tiny muted" data-vv-count></b>
    </div>
    <div class="vv-meters">
      <span class="tiny muted">${t('Composure')}</span><div class="vv-track"><i data-vv-composure class="vv-fill"></i></div>
      <span class="tiny muted" data-vv-clocklabel>${t('The clock')}</span><div class="vv-track"><i data-vv-clock class="vv-fill"></i></div>
    </div>

    <div class="ex-only ex-talk">
      <div class="ex-slide w-core" data-vv-slidebox>
        <b data-vv-slide-title></b>
        <p class="tiny" data-vv-slide-line></p>
      </div>
      <p class="ex-interrupt hidden" data-vv-interrupt></p>
      <div class="choices ex-moves">
        ${talk.map((m, i) => `<button class="btn choice" data-action="exam-talk" data-id="${m.id}" data-hotkey="${i + 1}"><span><kbd>${i + 1}</kbd></span><span><b>${esc(t(m.label))}</b><small>${esc(t(m.hint))}</small></span><span class="arrow">→</span></button>`).join('')}
        <button class="btn choice urgent hidden" data-action="exam-interrupt" data-hotkey="3"><span><kbd>3</kbd></span><span><b>${esc(t('Stop and answer it'))}</b><small>${esc(t('Costs you two minutes of the talk. Buys you the room.'))}</small></span><span class="arrow">→</span></button>
      </div>
    </div>

    <div class="ex-only ex-qa">
      <p class="vv-q" data-vv-q></p>
      <div class="choices vv-moves">${moves.map((m, i) => `<button class="btn choice" data-action="viva-move" data-id="${m.id}" data-hotkey="${i + 1}"><span><kbd>${i + 1}</kbd></span><span><b>${esc(t(m.label))}</b><small>${esc(t(m.hint))}</small></span><span class="arrow">→</span></button>`).join('')}</div>
      <p class="tiny muted" data-vv-tally></p>
    </div>

    <div class="ex-only ex-corridor">
      <div class="ex-door"><i class="ex-door-panel"></i><i class="ex-chair"></i></div>
      <div class="ex-things" data-vv-things></div>
    </div>

    <div class="ex-only ex-clear"><div class="ex-leaving">${Array.from({ length: 9 }, (_, i) => `<i class="ex-figure" style="--d:${i * .18}s"></i>`).join('')}</div></div>
    <div class="ex-only ex-intro"><div class="ex-podium"><i class="ex-lectern"></i><i class="ex-speaker"></i><i class="ex-you"></i></div></div>

    <p class="vv-flash hidden" data-vv-flash></p>
    <p class="tiny muted">${esc(t(examNote))}</p>
  </div></section></div>`;
}

// The whiteboard, as a thing on the wall by your desk rather than a page in the operating system.
export function boardDialog(s) {
  return `<div class="modal"><section class="dialog board" role="dialog" aria-modal="true" aria-labelledby="wb-title"><div class="titlebar"><span class="tb-title">${icon('research', 16)}<span id="wb-title">${t('Whiteboard')}</span></span>${btn('✕', 'board-close', { cls: 'tb-x' })}</div><div class="body">${whiteboardApp(s)}</div></section></div>`;
}

// The photograph. Four people who have done this forty times, and one who has not.
export function photoDialog(s) {
  const ph = s.photo;
  if (!ph) return '';
  return `<div class="modal"><section class="dialog photo" role="dialog" aria-modal="true" aria-labelledby="ph-title"><div class="titlebar"><span class="tb-title">${icon('flag', 16)}<span>${esc(t('Room 214, afterwards'))}</span></span></div><div class="body">
    <h2 id="ph-title">${esc(t(ph.title))}</h2>
    <div class="ph-frame">
      <div class="ph-row">
        ${Array.from({ length: 5 }, (_, i) => `<div class="ph-person${i === 2 ? ' you' : ''}"><i class="ph-head"></i><i class="ph-body"></i><i class="ph-smile${i === 2 ? ' real' : ''}"></i></div>`).join('')}
      </div>
      <i class="ph-flash"></i>
    </div>
    ${ph.lines.map(l => `<p class="ph-line">${voiced(t(l))}</p>`).join('')}
    <div class="choices">${btn(t('Close'), 'photo-close', { cls: 'primary' })}</div>
  </div></section></div>`;
}


// 04:12. A wall of output and a reservation that is running out. The log itself is painted by
// cluster.js; this is the frame around it.
export function clusterDialog() {
  return `<div class="modal"><section class="dialog cluster" role="dialog" aria-modal="true" aria-labelledby="cl-title"><div class="titlebar"><span class="tb-title">${icon('computer', 16)}<span>${t('gpu-0417')}</span></span></div><div class="body" data-cl>
    <div class="vv-head"><h2 id="cl-title" data-cl-title></h2><b class="tiny muted" data-cl-count></b></div>
    <p class="tiny muted" data-cl-hint></p>
    <div class="vv-meters"><span class="tiny muted" data-cl-left></span><div class="vv-track"><i data-cl-clock class="vv-fill"></i></div></div>
    <div class="cl-log" data-cl-log></div>
    <p class="vv-flash hidden" data-cl-flash></p>
    <p class="tiny muted">${esc(t(clusterNote))}</p>
  </div></section></div>`;
}

// The innovation office, and the rejection. Both are gates: a scheduled conversation you have to
// have, and a forty-one page document you have to answer.
export function patentDialog(s) {
  const pt = s.patent;
  if (!pt) return '';
  const meeting = pt.stage === 'meetings' ? patentMeetings[pt.meeting] || null : null;
  const action = pt.stage === 'action';
  if (!meeting && !action) return '';
  const title = action ? t('US Patent Office — non-final rejection') : t('Innovation Office');
  const body = action ? officeAction : meeting;
  const opts = body.choices;
  const share = t(patentShare, { advisor: PATENT.advisorShare, you: 100 - PATENT.advisorShare });
  return `<div class="modal"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="pat-title"><div class="titlebar"><span class="tb-title">${icon('portal', 16)}<span>${esc(title)}</span></span></div><div class="body">
    <h2 id="pat-title">${esc(t(body.title || t('Every claim, rejected')))}</h2>
    <p class="scene-text">${esc(t(Array.isArray(body.text) ? body.text[(s.month + (pt.meeting || 0)) % body.text.length] : body.text))}</p>
    <div class="choices">${opts.map((o, i) => `<button class="btn choice" data-action="${action ? 'patent-action' : 'patent-meet'}" data-id="${o.id}" data-hotkey="${i + 1}" ${s.stage !== 'plan' ? 'disabled' : ''}><span><kbd>${i + 1}</kbd></span><span><b>${esc(t(o.text))}</b><small>${esc(t(o.hint))}</small></span><span class="arrow">→</span></button>`).join('')}</div>
    <p class="tiny muted">${esc(share)}</p>
    <p class="tiny muted">${esc(t(patentNote))}</p>
  </div></section></div>`;
}

// The interrupt. Shown as a calendar rather than described as one: your day, with a block dropped
// into the middle of it, and the hours it eats shaded out. You can see the cost before you read it.
export function summonsDialog(s) {
  const sm = s.summons;
  if (!sm) return '';
  const def = summonsKinds[sm.id];
  if (!def) return '';
  const bite = sm.hard ? SUMMONS.biteHard : SUMMONS.bite;
  const hours = ['9', '10', '11', '12', '1', '2', '3', '4', '5'];
  const startAt = 2 + (sm.variant % 3);
  const eaten = Math.max(2, Math.round(hours.length * bite));
  const who = { advisor: t('Prof. {n}', { n: lastName(s.advisor.name) }), contact: sm.who || t('a collaborator'), department: t('the department'), labmate: t('the lab') }[def.from];
  return `<div class="modal"><section class="dialog summons" role="dialog" aria-modal="true" aria-labelledby="sm-title"><div class="titlebar"><span class="tb-title">${icon('calendar', 16)}<span>${t('Today')}</span></span></div><div class="body">
    <div class="sm-head">${avatar(def.from === 'advisor' ? s.advisor.id : (sm.who || def.from), 44)}<div>
      <h2 id="sm-title">${esc(fill(s, t(def.title)).replace('{who}', who))}</h2>
      <p class="tiny muted">${esc(who)}</p>
    </div></div>
    <div class="sm-day" aria-hidden="true">${hours.map((h, i) => {
      const inBlock = i >= startAt && i < startAt + eaten;
      return `<div class="sm-hour ${inBlock ? 'eaten' : 'yours'}" style="--i:${i}"><span class="sm-t">${h}</span><i></i></div>`;
    }).join('')}</div>
    <p class="tiny muted sm-legend"><b class="sw yours"></b>${t('what you planned')} <b class="sw eaten"></b>${t('what this takes')}</p>
    <p class="scene-text">${esc(fill(s, t(def.text[sm.variant % def.text.length])).replace('{who}', who))}</p>
    <div class="choices">${Object.values(summonsMoves).map((m, i) => `<button class="btn choice" data-action="summons" data-id="${m.id}" data-hotkey="${i + 1}"><span><kbd>${i + 1}</kbd></span><span><b>${esc(t(m.label))}</b><small>${esc(t(m.hint))}</small></span><span class="arrow">→</span></button>`).join('')}</div>
    <p class="tiny muted">${esc(t(summonsNote))}</p>
  </div></section></div>`;
}
