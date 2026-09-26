import { esc, money, btn, bar, group, tag, note, signed, band, effectPills, gauge, gaugeRow, mood, faceFor, deltaBar, voiced, rollReadout } from '../helpers.js';
import { icon } from '../icons.js';
import { avatar } from '../avatars.js';
import { dateLabel, monthOf, semester, holidays, seasonalFlavor, phdYear, isTeachingTerm } from '../../data/calendar.js';
import { venueById, nextDeadline, venuesForTopic } from '../../data/venues.js';
import { mutators, topics } from '../../data/catalog.js';
import { requestById } from '../../data/requests.js';
import { asks } from '../../data/asks.js';
import { activeProject, absWeek, lastName, firstName, editable, requestText, noticeText, say } from '../../engine/state.js';
import { focusOptions, canStartMain, canStartSide, dayName, daysLeftInWeek, doorOptions, obstacleOf } from '../../engine/game.js';
import { stuckNote } from '../../data/stuck.js';
import { milestoneOf, dayEligible, paceOptions, DAYS_PER_WEEK, canDecideThesis, inTheMiddle, thesisFloor, remainingWeeks, focusScale } from '../../engine/time.js';
import { diamonds, diamondBar, diamondWord } from '../../engine/paper.js';
import { caffeineState, healthBand } from '../../engine/life.js';
import { revisionsLeft, canDeposit, defenseScheduleUnavailable } from '../../engine/thesis.js';
import { canAskTimeline, askAgainIn, timelineMoves, gradRecord, gradWillingness, feasibleGraduationTarget, agreedGraduationMonth, graduationTargetMissed } from '../../engine/timeline.js';
import { canApplyIntern, internWindow, internTalkMoves, collisions } from '../../engine/internship.js';
import { availableWriters, letterCount, packetStrength, packetVerdictText, needsLetters, hasAdvisorLetter } from '../../engine/letters.js';
import { LETTERS_REQUIRED, RANK_NOTE } from '../../data/letters.js';
import { internTypes } from '../../data/internships.js';
import { conditions as gradConditions } from '../../data/timeline.js';
import { STANDING_WARN, quitBand } from '../../engine/divergence.js';
import { COFFEE } from '../../data/life.js';
import { MODES } from '../../engine/advisor.js';
import { relocationPanel } from '../relocation.js';
import { recoveryStatus } from '../recovery.js';
import { supervisionStatus } from '../supervision.js';
import { tenureNotice } from '../tenure.js';
import { ventureStatus } from '../venture.js';
import { t } from '../../i18n/index.js';

// The crunch banner is composed here so every part of it goes through t().
export function crunchLabel(c) {
  if (!c) return '';
  if (c.kind === 'prelim') return t('Preliminary exam at the end of the month');
  if (c.kind === 'proposal') return t('Thesis proposal at the end of the month');
  if (c.kind === 'defense') return t('Dissertation defense at the end of the month');
  if (c.type === 'rebuttal') return t('Rebuttal window: {venue}', { venue: c.venueName || '' });
  if (c.type === 'zoom') return t('Week-by-week (your choice)');
  return c.venueName ? t('{venue} deadline', { venue: c.venueName }) : t('Deadline month');
}

// The day panel: the small levers you pull between 9 a.m. and whenever you leave.
export function dayStrip(s) {
  const cups = s.caffeine?.day || 0;
  const caf = caffeineState(s);
  const skipped = s.dayMeals || 0;
  const done = s.actions || {};
  const cafNote = { flat: t('No coffee yet. The day has not officially begun.'), wired: t('Coffee is working. This is the good part.'), jitter: t('Your hands are doing a small independent thing.'), crash: t('Everything has a faint ring around it. Sit down for a minute.') }[caf];
  return `<div class="daystrip ${caf}">
    <div class="day-head"><b>${esc(dayName(s))}</b><span class="muted small">${t('day {n} of {m} · week {w} of 4', { n: (s.dayIndex || 0) + 1, m: DAYS_PER_WEEK, w: Math.min(4, s.week + 1) })}</span></div>
    <div class="day-meters">
      <span class="cups" title="${esc(cafNote)}">${'●'.repeat(Math.min(cups, 6))}${'○'.repeat(Math.max(0, 5 - cups))} <small>${t('{n} cup(s)', { n: cups })}</small></span>
      ${skipped ? `<span class="skipped">${icon('warn', 12)} <small>${t('{n} meal(s) skipped', { n: skipped })}</small></span>` : ''}
    </div>
    <div class="day-acts">
      ${btn(`${icon('coffee', 14)} ${t('Coffee')}`, 'coffee', { cls: 'small', disabled: s.stage !== 'plan' || cups >= 6, title: cups >= COFFEE.crashAt - 1 ? t('One more and your body will make this decision for you.') : t('+Energy now. The invoice arrives later.') })}
      ${btn(`${icon('warn', 14)} ${t('Work through lunch')}`, 'skip-meal', { cls: 'small', disabled: s.stage !== 'plan' || skipped >= 2, title: t('An hour back. A little of yourself gone.') })}
      ${s.flags.remoteAdvisor ? btn(`${icon('chat', 14)} ${t('Message remote advisor')}`, 'open', { app: 'chat', attrs: 'data-page="advisor"', cls: 'small', title: t('Your advisor is off campus. Request a meeting in LabChat.') }) : btn(`${icon('user', 14)} ${t('Knock on their door')}`, 'pop-in', { cls: 'small', disabled: s.stage !== 'plan' || !!done.popin, title: t('Five unscheduled minutes with your advisor. They may not be there.') })}
      ${btn(`${icon('people', 14)} ${t('Go find the kettle')}`, 'run-into', { cls: 'small', disabled: s.stage !== 'plan' || !!done.runinto, title: t('Whoever is in the corridor is in the corridor.') })}
    </div>
    ${doorScene(s)}
    <p class="tiny muted day-note">${esc(s.dayOutcome || s.dayNote || cafNote)}</p>
  </div>`;
}

// When the relationship is in trouble, the game says so plainly rather than hiding it in a stat.
export function standingBanner(s) {
  if (s.probation) {
    const left = Math.max(0, s.probation.until - s.month);
    return `<div class="standing-banner probation">
      <div class="row between"><b>${icon('warn', 16)} ${t('Academic improvement plan')}</b><span>${t('{n} month(s) remaining', { n: left })}</span></div>
      <ul class="small">${s.probation.terms.map(x => `<li>${esc(t(x))}</li>`).join('')}</ul>
      <p class="tiny">${t('Meet the terms, or submit something, and this closes quietly. Miss them and the next meeting has two people in it.')}</p>
    </div>`;
  }
  if ((s.warnings || 0) >= 2) return `<div class="standing-banner warned"><b>${icon('warn', 14)} ${t('A written warning is in your file.')}</b> <span class="small">${t('Standing recovers with delivered work, held meetings, and answered requests. It moves slowly, like the person holding it.')}</span></div>`;
  if ((s.warnings || 0) === 1) return `<div class="standing-banner soft"><b>${icon('info', 14)} ${t('Your advisor has raised concerns.')}</b> <span class="small">${t('Nothing is in writing yet. This is the part where it can still just be a hard month.')}</span></div>`;
  if ((s.standing ?? 60) < STANDING_WARN + 8) return `<div class="standing-banner soft"><span class="small">${t('Things have been quiet between you and {name} in the way that is not restful.', { name: lastName(s.advisor.name) })}</span></div>`;
  return '';
}

// You passed. The committee gave you a list. This is the list.
export function revisionPanel(s) {
  const th = s.thesis;
  if (!th || th.deposited) return '';
  const late = s.month > th.dueMonth;
  const pct = th.needed ? Math.round((th.done / th.needed) * 100) : 100;
  return `<div class="revisions ${late ? 'late' : ''}">
    <div class="row between"><b>${icon('doc', 14)} ${t('Committee revisions')}</b><span class="${late ? 'overdue' : 'muted'} small">${late ? t('deposit deadline passed') : t('deposit by {month}', { month: dateLabel(th.dueMonth) })}</span></div>
    ${bar(t('Revised'), pct, { cls: pct >= 100 ? 'green' : 'gold' })}
    <div class="rev-list">${th.items.map(x => {
      const done = x.done >= x.effort;
      return `<button class="rev-item ${done ? 'done' : ''}" data-action="revise" data-id="${x.id}" ${done || s.stage !== 'plan' ? 'disabled' : ''} title="${esc(t(x.line))}">
        <span class="rev-tick">${done ? '✓' : '○'}</span><span><b>${esc(t(x.label))}</b><small class="muted">${done ? t('done') : t('{n} more session(s) · −6 Energy', { n: x.effort - x.done })}</small></span></button>`;
    }).join('')}</div>
    <div class="row" style="margin-top:6px">${btn(t('Deposit the dissertation →'), 'deposit', { cls: canDeposit(s) ? 'primary' : '', disabled: !canDeposit(s) || s.stage !== 'plan', title: canDeposit(s) ? t('Format review. It is not about the research.') : t('The committee’s list first.') })}${th.formatFails ? `<span class="tiny muted">${t('format review rejected it {n} time(s)', { n: th.formatFails })}</span>` : ''}</div>
    <p class="tiny muted">${t('You are already Doctor. The degree is conferred when this is deposited and the margins are correct.')}</p>
  </div>`;
}

// Year four onward: the conversation nobody starts for you.
export function timelinePanel(s) {
  const g = s.grad;
  const asked = !!(g && g.asked);
  if (!g?.settled && !feasibleGraduationTarget(s)) return `<div class="gradtalk"><b>${t('Finishing')}</b><p class="small">${t('No new defense target fits before funding ends. An agreement cannot extend the funding window.')}</p></div>`;
  if (!asked) {
    if (!canAskTimeline(s)) return '';
    return `<div class="gradtalk ask">
      <b>${icon('chat', 14)} ${t('Finishing')}</b>
      <p class="small">${t('Ask for a feasible finishing target. An agreement still needs a dissertation, a booked defense, and deposit.')}</p>
      ${btn(t('Ask about a finishing date'), 'ask-timeline', { cls: 'primary small', disabled: s.stage !== 'plan' })}
    </div>`;
  }
  if (g.settled) {
    const month = agreedGraduationMonth(s), missed = graduationTargetMissed(s);
    return `<div class="gradtalk settled">
      <div class="row between"><b>${icon('flag', 14)} ${missed ? t('The earlier target has passed') : t('Agreed defense target')}${Number.isFinite(month) ? `: ${dateLabel(month)}` : ''}</b>${s.flags.committeeBacking ? tag(t('committee backing'), 'ok') : ''}</div>
      <p class="small muted">${esc(g.how || '')}</p>
      <p class="small">${missed ? t('The earlier agreement did not book a defense. Review the remaining work and discuss a new feasible target.') : t('This is a planning target, not a booking. Schedule the defense after the dissertation is approved; revisions and deposit still follow.')}</p>
      ${missed ? canAskTimeline(s) ? btn(t('Revisit the finishing date'), 'ask-timeline', { cls: 'small primary', disabled: s.stage !== 'plan' }) : `<p class="small">${feasibleGraduationTarget(s) ? t('You can raise it again in {n} month(s).', { n: askAgainIn(s) }) : t('No new defense target fits before funding ends. An agreement cannot extend the funding window.')}</p>` : ''}
    </div>`;
  }
  const cond = g.condition ? gradConditions.find(c => c.id === g.condition) : null;
  const truth = g.knowsTruth === 'unfair' ? t('You know now: this is not about the work.') : g.knowsTruth === 'fair' ? t('You know now: this one is about the work.') : '';
  return `<div class="gradtalk ${g.stance}">
    <div class="row between"><b>${icon('chat', 14)} ${t('Finishing')}</b>${tag({ yes: t('agreed'), conditional: t('conditional'), notReady: t('not yet'), deflect: t('no straight answer') }[g.stance], g.stance === 'deflect' ? 'bad' : g.stance === 'conditional' ? 'warn' : '')}</div>
    <p class="small gradtalk-line">${esc(g.line || '')}</p>
    ${cond ? `<p class="small"><b>${t('The bar')}:</b> ${esc(t(cond.text))} — <span class="muted">${esc(t(cond.line))}</span></p>` : ''}
    ${truth ? `<p class="small ${g.knowsTruth === 'unfair' ? 'truth-bad' : 'truth-ok'}">${esc(truth)}</p>` : ''}
    <div class="gradmoves">${timelineMoves(s).map(m => `<button class="gradmove" data-action="timeline-move" data-id="${m.id}" ${m.done || s.stage !== 'plan' ? 'disabled' : ''} title="${esc(t(m.hint))}"><b>${esc(t(m.label))}</b><small class="muted">${esc(t(m.hint))}</small></button>`).join('')}</div>
    <div class="row" style="margin-top:4px">${canAskTimeline(s)
      ? btn(t('Raise it again'), 'ask-timeline', { cls: 'small', disabled: s.stage !== 'plan', title: t('A term has passed. Asking again, later, moves them — slowly.') })
      : `<span class="tiny muted">${t('You can raise it again in {n} month(s).', { n: askAgainIn(s) })}</span>`}</div>
    ${g.stance === 'notReady' ? `<p class="tiny muted">${t('The record is thin and they said so plainly. Papers, a proposal, a draft — then ask again.')}</p>`
      : `<p class="tiny muted">${t('Your case: record {r}/100. Their willingness is not a number you get to see. Persistence across terms is itself an argument.', { r: Math.round(gradRecord(s)) })}</p>`}
  </div>`;
}

// Every August. The offer is the easy half.
export function internPanel(s) {
  const it = s.intern;
  if (s.internship) {
    const running = s.month >= s.internship.start;
    const ty = internTypes[s.internship.typeId];
    return `<div class="summertalk settled">
      <div class="row between"><b>${icon('case', 14)} ${t('The summer')}</b>${tag(running ? t('in progress') : t('confirmed'), 'ok')}</div>
      <p class="small"><b>${esc(s.internship.company)}</b>${ty ? ` — ${esc(t(ty.label))}` : ''}</p>
      <p class="tiny muted">${t('{from} to {to}. ${salary} a month, which the ledger will notice.', { from: dateLabel(s.internship.start), to: dateLabel(s.internship.end), salary: s.internship.salary || 9000 })}</p>
    </div>`;
  }
  const talk = it && it.talk;
  if (talk && !talk.settled) {
    const offer = it.offers.find(o => o.id === talk.offerId);
    const ty = internTypes[offer.typeId];
    const cols = collisions(s, offer);
    const truth = talk.knowsTruth === 'unfair' ? t('You know now: this is not about the work.') : talk.knowsTruth === 'fair' ? t('You know now: this one is about the work.') : '';
    return `<div class="summertalk ${talk.stance}">
      <div class="row between"><b>${icon('case', 14)} ${t('About the summer')}</b>${tag({ trade: t('conditional'), hijack: t('they want the summer'), forbid: t('no') }[talk.stance] || t('open'), talk.stance === 'forbid' ? 'bad' : 'warn')}</div>
      <p class="small"><b>${esc(offer.employer)}</b> — ${esc(t(ty.label))} · ${t('${n}/mo', { n: offer.salary })}</p>
      <p class="small summertalk-line">${esc(talk.line || '')}</p>
      ${cols.length ? `<p class="tiny muted">${t('On the calendar that summer: {list}.', { list: cols.map(c => c.venue || c.project || c.milestone).filter(Boolean).join(', ') })}</p>` : ''}
      ${truth ? `<p class="small ${talk.knowsTruth === 'unfair' ? 'truth-bad' : 'truth-ok'}">${esc(truth)}</p>` : ''}
      <div class="gradmoves">${internTalkMoves(s).map(m => `<button class="gradmove" data-action="intern-move" data-id="${m.id}" ${m.done || s.stage !== 'plan' ? 'disabled' : ''} title="${esc(t(m.hint))}"><b>${esc(t(m.label))}</b><small class="muted">${esc(t(m.hint))}</small></button>`).join('')}</div>
      <p class="tiny muted">${t('Going anyway always works. It is the price that varies, and you pay it in September.')}</p>
    </div>`;
  }
  if (it && it.offers.length) {
    return `<div class="summertalk ask">
      <b>${icon('case', 14)} ${t('Summer offers')}</b>
      <div class="gradmoves">${it.offers.map(o => {
        const ty = internTypes[o.typeId];
        return `<button class="gradmove" data-action="intern-talk" data-id="${esc(o.id)}" ${s.stage !== 'plan' ? 'disabled' : ''} title="${esc(t(ty.blurb))}"><b>${esc(o.employer)}</b><small class="muted">${esc(t(ty.label))} · ${t('${n}/mo', { n: o.salary })}</small></button>`;
      }).join('')}</div>
      <p class="tiny muted">${t('Pick one and take it to your advisor. That is the part that decides it.')}</p>
    </div>`;
  }
  if (!canApplyIntern(s)) return '';
  const late = internWindow(s) === 'late';
  return `<div class="summertalk ask">
    <b>${icon('case', 14)} ${t('Summer internships')}</b>
    <p class="small">${late ? t('Most of the deadlines have gone. Some places are still reading, in the way places still read in January.') : t('Applications are open. Forty of them, and a summer that is not yours to promise.')}</p>
    ${btn(t('Apply (−8 Energy)'), 'intern-apply', { cls: 'primary small', disabled: s.stage !== 'plan' })}
  </div>`;
}

// Four letters, for the academic file only, and you never find out what is in them.
export function lettersPanel(s) {
  if (s.month < 40 || s.phase !== 'playing') return '';
  const track = s.jobs?.track;
  if (track && !needsLetters(track)) return '';
  const have = letterCount(s), pk = packetStrength(s), closed = s.letters?.closed;
  const yes = (s.letters?.asked || []).filter(l => l.status === 'yes');
  const no = (s.letters?.asked || []).filter(l => l.status === 'no');
  const writers = closed ? [] : availableWriters(s);
  const enough = have >= LETTERS_REQUIRED && hasAdvisorLetter(s);
  return `<div class="summertalk ${enough ? 'settled' : 'ask'}">
    <div class="row between"><b>${icon('mail', 14)} ${t('Letters')}</b>${tag(t('{have} of {need}', { have, need: LETTERS_REQUIRED }), enough ? 'ok' : have ? 'warn' : 'bad')}</div>
    ${yes.length ? `<div class="letter-list">${yes.map(l => `<div class="letter-row"><b>${esc(l.name)}</b><small class="muted">${esc(t(writerKindLabel(l.kind)))}${l.reach >= 2 ? ` · ${t('outside the lab')}` : ''}</small></div>`).join('')}</div>` : ''}
    ${no.length ? `<p class="tiny muted">${t('{n} said no.', { n: no.length })}</p>` : ''}
    ${enough ? `<p class="small">${esc(packetVerdictText(s))}</p>` : `<p class="small">${t('Faculty searches and postdocs will not open a file with fewer than {n}. Industry asks for referees and never calls them.', { n: LETTERS_REQUIRED })}</p>`}
    ${!hasAdvisorLetter(s) && have ? `<p class="small truth-bad">${t('None of these is your advisor. That is the one that cannot be missing.')}</p>` : ''}
    ${writers.length ? `<div class="gradmoves">${writers.slice(0, 6).map(w => `<button class="gradmove" data-action="ask-letter" data-id="${esc(w.id)}" ${s.stage !== 'plan' || s.player.stats.energy < 4 ? 'disabled' : ''} title="${esc(t(w.note))}"><b>${esc(w.name)}</b><small class="muted">${esc(t(w.blurb))}</small></button>`).join('')}</div>` : ''}
    <p class="tiny muted">${closed ? t('The packet is closed.') : t(RANK_NOTE)}</p>
  </div>`;
}
const writerKindLabel = kind => ({ advisor: 'Your advisor', committee: 'A committee member', collaborator: 'An external collaborator', mentor: 'Your internship mentor', senior: 'A senior professor in the department', postdocmate: 'The postdoc who supervised you day to day', chair: 'The department chair' }[kind] || kind);

// The six-year strip. Where you are, what is behind you, and the next thing with a date on it.
// Everything on it is drawn from real run state, so it changes shape as the story does.
export function journeyBar(s) {
  if (s.phase !== 'playing' && s.phase !== 'epilogue') return '';
  const TOTAL = 72;
  const now = Math.min(TOTAL, s.month);
  const pct = m => (Math.max(0, Math.min(TOTAL, m)) / TOTAL) * 100;
  let marks = [];
  const add = (m, kind, label, note = '') => {
    if (m === null || m === undefined || m < 0 || m > TOTAL) return;
    marks.push({ m, kind, label, note, done: m < s.month });
  };

  // Milestones: the spine of the thing.
  const ms = s.milestones || {};
  add(ms.prelimMonth, ms.prelim === 'pass' ? 'done' : ms.prelim === 'fail' ? 'bad' : 'milestone', t('Prelim'),
    ms.prelim === 'pass' ? t('passed') : ms.prelim === 'retake' ? t('retake') : t('year two'));
  add(ms.proposalMonth, ms.proposal === 'pass' ? 'done' : 'milestone', t('Proposal'),
    ms.proposal === 'pass' ? t('passed') : t('candidacy'));
  if (ms.defenseMonth !== null && ms.defenseMonth !== undefined)
    add(ms.defenseMonth, ms.defense === 'pass' ? 'done' : 'defense', t('Defense'), ms.defense === 'pass' ? t('passed') : t('scheduled'));

  // Deadlines you actually chose: pinned, because you put them there.
  for (const p of s.projects || []) {
    if (p.targetMonth !== null && p.targetMonth !== undefined && !['Accepted', 'Abandoned'].includes(p.status))
      add(p.targetMonth, 'pin', p.targetVenue || t('Deadline'), p.title);
    if (p.status === 'Submitted' && p.timeline?.decision !== null && p.timeline?.decision !== undefined)
      add(p.timeline.decision, 'decision', t('Decision'), p.title);
    if (p.status === 'Accepted' && p.timeline?.conference !== null && p.timeline?.conference !== undefined && p.timeline.conference >= s.month)
      add(p.timeline.conference, 'trip', t('Conference'), p.title);
  }
  if (s.internship) add(s.internship.start, 'summer', t('Internship'), s.internship.company);
  if (s.grad?.settled && Number.isFinite(agreedGraduationMonth(s))) add(agreedGraduationMonth(s), 'goal', t('Target'), graduationTargetMissed(s) ? t('The earlier target has passed') : t('year {n}', { n: Math.floor(agreedGraduationMonth(s) / 12) + 1 }));
  if (s.advisorTenure?.status === 'notice' && s.advisorTenure.advisorId === s.advisor?.id) {
    add(s.advisorTenure.departureMonth, 'goal', t('Advisor departure'), s.advisor.name);
  }

  // The proposal is not drawn on the track while you are in the middle of it either — a pin at the
  // far end is the same promise the legend was making, in a different shape.
  const middle = inTheMiddle(s);
  const shown = middle ? marks.filter(x => !(x.kind === 'milestone' && x.m > s.month)) : marks;
  shown.sort((a, b) => a.m - b.m);
  const next = shown.find(x => x.m >= s.month);
  marks = shown;

  // Year bands, so six years reads as six years rather than seventy-two of something.
  const years = [1, 2, 3, 4, 5, 6].map(y => `<span class="jb-year" style="left:${pct((y - 1) * 12)}%;width:${100 / 6}%">${t('Y{n}', { n: y })}</span>`).join('');
  // Terms: teaching terms shaded, summers left pale, so the rhythm of the year is visible.
  const terms = Array.from({ length: TOTAL }, (_, m) => isTeachingTerm(m)
    ? `<i class="jb-term" style="left:${pct(m)}%;width:${100 / TOTAL}%"></i>` : '').join('');

  return `<div class="journey" title="${esc(t('Six years, and where you are in them.'))}">
    <div class="jb-track">
      ${terms}${years}
      <i class="jb-fill" style="width:${pct(now)}%"></i>
      ${marks.map(x => `<span class="jb-mark ${x.kind} ${x.done ? 'past' : ''}" style="left:${pct(x.m)}%" title="${esc(`${x.label}${x.note ? ' — ' + x.note : ''} · ${dateLabel(x.m)}`)}"><i></i></span>`).join('')}
      <span class="jb-now" style="left:${pct(now)}%" title="${esc(dateLabel(s.month))}"><i></i></span>
    </div>
    <div class="jb-legend">
      <span><b>${esc(semester(s.month))}</b> · ${t('Year {n}', { n: phdYear(s.month) })}</span>
      ${holidays(s.month).length ? `<span class="jb-holiday">${esc(t(holidays(s.month)[0].name))}</span>` : ''}
      ${(() => {
        // The middle years do not get a countdown.
        //
        // From day one this strip said "Next: Prelim · 20 months", and the moment you passed it,
        // "Next: Proposal · 24 months". There is always a named thing with a date on it, and the
        // pace control quietly makes the empty stretches pass three months at a time, so the
        // middle of a PhD was the fastest and best-signposted part of this game. It is the
        // opposite of that. Nobody tells you when year three ends. Nobody can.
        //
        // The months still pass quickly — that is a kindness to the player and the returning
        // player was right that it works — but between the prelim and the proposal the strip
        // stops promising an end date. Everything you have to do *this month* is still on screen,
        // in the next-step box, which is the level guidance belongs at.
        // A conference deadline is a real date that somebody else set, and hiding it would be
        // unhelpful and untrue — the e2e suite was right to object. What loses its date is the
        // milestone: the proposal, which nobody schedules for you. So the legend still names any
        // real deadline you are working towards, and says the other thing only when there is none.
        if (!next) return inTheMiddle(s)
          ? `<span class="jb-middle">${t('No date on it. Year three does not announce itself and year four does not end.')}</span>`
          : `<span class="muted">${t('Nothing scheduled. That is its own kind of pressure.')}</span>`;
        return `<span class="jb-next">${t('Next milestone')}: <b>${esc(next.label)}</b> · ${esc(dateLabel(next.m))}${next.m > s.month ? ` (${t('{n} month(s)', { n: next.m - s.month })})` : ` (${t('this month')})`}</span>`;
      })()}
    </div>
  </div>`;
}

// The main screen is seen hundreds of times, and its guidance was one italic line while the paper
// editor had a proper callout with a button. Same component, same clarity, here.
export function managerNextStep(s) {
  const p = activeProject(s);
  const open = s.requests.filter(r => r.status === 'open');
  const go = (label, action, opts = {}) => btn(label, action, { cls: 'primary small', attrs: 'data-guide="1"', ...opts });
  // A jump that names a page lands on that page. "Open OpenRegret" used to open Netscope on
  // whatever tab you happened to leave it on, which is not what the button says.
  const openApp = (label, app, page = '') => btn(label, 'open', { app, cls: 'primary small', attrs: `data-guide="1"${page ? ` data-page="${page}"` : ''}` });

  if (s.stage !== 'plan') return { title: t('Something is waiting for you'), detail: t('Answer what is on screen. Number keys 1–4 pick a choice.'), cta: '' };
  if (s.focus === 'recovery') return { title: t('Recovery leave'), detail: t('Continue to use your leave. Research and meetings wait.'), cta: go(t('Continue →'), 'continue') };
  if (s.thesis && !s.thesis.deposited) {
    if (canDeposit(s)) return { title: t('Deposit the dissertation'), detail: t('Every revision is done. The degree is conferred on deposit, not on the defense.'), cta: go(t('Deposit it →'), 'deposit') };
    const next = s.thesis.items.find(x => x.done < x.effort);
    if (s.player.stats.energy < 6) return { title: t('Recover before revising'), detail: t('Each revision session needs 6 Energy. Recover first; the committee’s list will still be here.'), cta: openApp(t('Open Life.exe'), 'life', 'body') };
    return { title: t('Finish the committee’s revisions'), detail: t('{n} left. Defending was not finishing.', { n: revisionsLeft(s) }), cta: next ? go(t('Revise next item · −6 Energy'), 'revise', { id: next.id }) : '' };
  }
  // Running out of Energy outranks everything else, because at 0 Energy every other suggestion on
  // this screen is a button the player cannot afford to press — and the way out is in another app,
  // on a tab they have no reason to have opened.
  if (s.player.stats.energy < 22) return { title: t('You are running on nothing'),
    detail: t('Everything costs Energy and you are out. Life.exe → Body has the things that give it back; every one of them costs you something else.'),
    cta: openApp(t('Open Life.exe'), 'life', 'body') };
  if (p?.status === 'Rebuttal') return { title: t('The rebuttal window is open'), detail: t('Reviews are in. The window closes at the end of this month.'), cta: openApp(t('Open OpenRegret'), 'browser', 'openregret') };
  if (open.length) return { title: t('Your advisor asked for something'), detail: t('{n} open request(s). Do them, push back, or decline — ignoring them is also a choice, with a cost.', { n: open.length }), cta: openApp(t('Open LabChat'), 'chat', 'advisor') };
  const dissertation = s.projects.find(x => x.kind === 'thesis');
  if (dissertation?.status === 'Ready' && s.milestones.defenseMonth == null) {
    const blocked = defenseScheduleUnavailable(s);
    return { title: t('Schedule the defense'), detail: blocked || t('The dissertation is approved. Book the defense before the funding window closes.'), cta: blocked ? '' : go(t('Schedule the defense'), 'schedule-defense') };
  }
  if (dissertation && editable(dissertation) && dissertation.id !== p?.id && !['deadline', 'rebuttal'].includes(s.crunch?.type))
    return { title: t('Return to the dissertation'), detail: t('Another project is selected. Select the dissertation to put your writing time into it.'), cta: go(t('Return to the dissertation'), 'select-project', { id: dissertation.id }) };
  if (p?.kind === 'thesis' && p.status === 'Drafting' && !['deadline', 'rebuttal'].includes(s.crunch?.type))
    return { title: t('Work on the dissertation'), detail: t('The committee needs a 90% draft before the advisor review. Writing goes into the selected project.'), cta: openApp(t('Open Overgrief'), 'browser', 'overgrief') };
  if (canStartMain(s)) {
    const reviewing = s.projects.some(x => x.status === 'Submitted');
    return { title: reviewing ? t('While the paper is under review') : s.projects.length ? t('Start the next one') : t('Start a project'),
      detail: reviewing ? t('You can start another project, take courses, or recover. The submitted manuscript stays unchanged.')
        : s.projects.length ? t('There is room for another project. Research needs an active project; taking a break is also an option.')
          : t('Nothing is running. A PhD is made of projects and you do not have one.'),
      cta: go(t('Start main project'), 'start-project') };
  }
  if (p?.status === 'Ready' && p.kind !== 'thesis') return { title: p.approvedWithout ? t('Ready without the final read') : t('A draft is approved'), detail: t('Submit it when a venue is open.'), cta: openApp(t('Open OpenRegret'), 'browser', 'openregret') };
  // The draft is finished and nobody has read it. This had no branch at all, so the screen said
  // "Plan set. Use the desktop if you want to" — and four measured runs sat on a project reading
  // 100/100 for more than twenty months and ended All But Dissertation. The verb lives in another
  // app, which is the whole reason this callout exists.
  if (p && p.status === 'Drafting' && p.draft >= 60 && p.progress >= 40)
    return { title: p.draft >= 99 ? t('The draft is finished and nobody has read it') : t('The draft is ready for a reader'),
      detail: t('Nothing happens to a paper until your advisor has it. It will come back with comments; that is the point of sending it.'),
      cta: openApp(t('Open OpenRegret'), 'browser', 'openregret') };
  if (p?.status === 'Rejected') return { title: t('It came back'), detail: t('A rejected paper is not a dead paper. Revise it, reframe it, or make it bigger, and send it somewhere else.'), cta: openApp(t('Open OpenRegret'), 'browser', 'openregret') };
  if (canDecideThesis(s)) return { title: t('Decide what the thesis is'), detail: t('Choose the thread connecting your results. This helps shape the proposal.'), cta: go(t('Decide what the thesis is'), 'decide-thesis') };
  if (p?.status === 'Advisor Review') return { title: t('It is on their desk'), detail: t('Your advisor has the draft. This takes as long as it takes, and the waiting is not idleness — start the next thing.'), cta: '' };
  if (p && ['Drafting', 'Experiments', 'Prototype', 'Idea'].includes(p.status) && !p.targetVenueId && p.progress >= 35)
    return { title: t('Choose a venue'), detail: t('Work without a deadline expands, and your advisor will keep asking which one it is.'), cta: openApp(t('Set a target'), 'browser', 'openregret') };
  if (!s.focus) return null;
  return { title: t('Plan set'), detail: t('Use the desktop if you want to, then continue. Everything else is optional.'), cta: go(t('Continue →'), 'continue') };
}


// Knocking on the door is the most-repeated five seconds of a deadline week, and it was one line
// of grey text. Four states, drawn in code and animated once on arrival, with a stamp on top: the
// door is the joke, and the joke is that you cannot tell which one you are getting until it opens.
function doorScene(s) {
  const d = s.doorScene;
  if (!d) return '';
  const open = d.state === 'open' ? 62 : d.state === 'ajar' ? 22 : 0;
  const dark = d.state === 'dark';
  return `<div class="door-scene ${d.state}">
    <svg viewBox="0 0 120 90" width="120" height="90" aria-hidden="true">
      <rect x="0" y="0" width="120" height="90" fill="${dark ? '#22262c' : '#3c4450'}"/>
      <rect x="18" y="8" width="84" height="82" fill="${dark ? '#15181c' : '#1d2126'}"/>
      <g class="door-leaf" style="--open:${open}">
        <rect x="18" y="8" width="84" height="82" fill="#8d6a44"/>
        <rect x="26" y="16" width="30" height="30" fill="#7a5a38"/>
        <rect x="64" y="16" width="30" height="30" fill="#7a5a38"/>
        <rect x="26" y="54" width="68" height="28" fill="#7a5a38"/>
        <circle cx="96" cy="52" r="3" fill="#d9b24a"/>
        <rect x="34" y="20" width="22" height="9" fill="#f4efe2"/>
      </g>
      ${dark ? '' : `<circle class="door-face" cx="${d.state === 'open' ? 78 : 66}" cy="46" r="9" fill="#e8c4a2"/>`}
    </svg>
    <b class="door-stamp">${esc(t(d.stamp))}</b>
  </div>`;
}


// The pace control. One place, always visible, four speeds, and when one is closed it says why
// rather than disappearing — which is what the three scattered buttons used to do.
const PACE_LABEL = { season: 'Season', month: 'Month', week: 'Week', day: 'Day' };
function paceControl(s) {
  const opts = paceOptions(s);
  return `<div class="pace" role="group" aria-label="${esc(t('Pace'))}">
    <span class="tiny muted">${t('Pace')}</span>
    ${opts.map(o => `<button class="pace-step ${o.active ? 'on' : ''}" data-action="set-pace" data-id="${o.id}" ${o.disabled || s.stage !== 'plan' ? 'disabled' : ''} title="${esc(o.disabled ? t(o.disabled) : t('{n} at a time', { n: t(PACE_LABEL[o.id]) }))}">${esc(t(PACE_LABEL[o.id]))}</button>`).join('')}
  </div>`;
}


// Being stuck, and who you ask. Six doors, each greyed with its own reason rather than missing,
// and the one that suits this kind of stuck marked — because knowing which door is the skill.
function stuckPanel(s) {
  const ob = obstacleOf(s);
  const opts = doorOptions(s);
  const plan = s.stage === 'plan';
  const who = { advisor: s.advisor?.id, labmate: (s.labmates || []).find(l => l.status === 'active')?.name, collab: (s.contacts || []).find(c => c.status === 'active')?.name };
  return `<div class="stuck">
    <div class="stuck-head"><b>${esc(t(ob.label))}</b><span class="tiny muted">${esc(t(ob.hint))}</span></div>
    <div class="stuck-doors">${opts.map(o => {
      const face = who[o.id] ? avatar(who[o.id], 26) : icon(o.icon, 20);
      return `<button class="stuck-door ${o.fits ? 'fits' : ''} ${o.id === 'sleep' ? 'apart' : ''}" data-action="stuck-ask" data-id="${o.id}" ${o.blocked || !plan ? 'disabled' : ''} title="${esc(o.blocked || t(o.hint))}">
        <span class="sd-who">${face}</span>
        <span class="sd-l"><b>${esc(t(o.label))}</b><small>${esc(o.blocked || t(o.hint))}</small></span>
        ${o.fits ? `<span class="sd-fit" title="${esc(o.blocked ? t('This is the one that would help. It is not open to you today.') : t('Suited to this kind of stuck'))}">●</span>` : ''}
      </button>`;
    }).join('')}</div>
    <p class="tiny muted">${esc(t(stuckNote))}</p>
  </div>`;
}

export function planList(s) {
  const opts = focusOptions(s);
  const available = opts.filter(f => !f.disabled), unavailable = opts.filter(f => f.disabled);
  const option = f => `<button class="option ${s.focus === f.id ? 'selected' : ''}" data-action="plan" data-id="${f.id}" title="${esc(f.desc)}"><span class="radio"></span>${icon(f.icon, 22)}<span class="opt-name"><b>${esc(f.name)}</b><span class="muted">${esc(f.desc)}</span><span class="eff">${effectPills(Object.fromEntries(Object.entries(f.effects).map(([key, value]) => [key, value * focusScale(s, f)])), {}, 5)}</span></span></button>`;
  // Keep usable plans first. Closed plans remain named, with keyboard-accessible reasons;
  // identical reasons are shared instead of pushing the first usable choice down the page.
  const reasons = new Map();
  for (const f of unavailable) reasons.set(f.disabled, [...(reasons.get(f.disabled) || []), f]);
  const closed = unavailable.length ? `<details class="unavailable-plans" data-disclosure="unavailable-plans"><summary>${esc(t('Unavailable now: {plans}', { plans: unavailable.map(f => f.name).join(' / ') }))}</summary>${[...reasons].map(([reason, plans]) => `<div class="unavailable-reason"><b>${plans.map(f => esc(f.name)).join(' / ')}</b><p>${esc(reason)}</p></div>`).join('')}</details>` : '';
  return `<p class="small muted plan-hint">${opts[0]?.id === 'recovery' ? t('Continue to use your leave. Research and meetings wait.') : t('Select a plan to see its trade-offs. Time moves only when you Continue.')}</p><div class="radio-list plans">${available.map(option).join('')}</div>${closed}`;
}

export function readinessWidget(s) {
  const ms = milestoneOf(s);
  const best = s.projects.filter(p => p.kind !== 'thesis').reduce((m, p) => Math.max(m, p.progress), 0);
  const thesis = s.projects.find(p => p.kind === 'thesis');
  if (!ms) return '';
  const rows = ms.kind === 'defense' ? [[t('Dissertation'), thesis?.draft || 0, 'gold'], [t('Papers'), Math.min(100, s.counts.accepted * 34), 'green'], [t('Presentation'), s.readiness, '']] : [[t('Coursework'), s.coursework, ''], [t('Presentation'), s.readiness, 'gold'], [ms.kind === 'proposal' ? t('Papers') : t('Research'), ms.kind === 'proposal' ? Math.min(100, s.counts.accepted * 40 + best * .3) : best, 'green']];
  return `<div class="readiness"><div class="row between"><b>${{ prelim: t('Prelim readiness'), proposal: t('Proposal readiness'), defense: t('Defense readiness') }[ms.kind]}</b><span class="tiny muted">${inTheMiddle(s) ? t('when you are ready') : dateLabel(ms.month)}</span></div>${rows.map(([l, v, c]) => gaugeRow(l, v, c)).join('')}</div>`;
}

export function agenda(s) {
  const items = [];
  const m = monthOf(s.month);
  const crunch = s.crunch;
  const monthsAway = n => n === 0 ? t('this month') : t('{n} month(s)', { n });
  if (crunch && crunch.type !== 'zoom') items.push(`<li>${tag(crunch.type === 'prelim' || crunch.type === 'defense' ? t('MILESTONE MONTH') : crunch.type === 'rebuttal' ? t('REBUTTAL WINDOW') : t('DEADLINE MONTH'), 'crunch')} ${esc(crunchLabel(crunch))}${crunch.type === 'deadline' && crunch.projectId ? ` — ${t('{n} week(s) left', { n: 4 - s.week })}` : ''}</li>`);
  for (const p of s.projects) {
    if (p.targetMonth !== null && p.targetMonth !== undefined && p.targetMonth >= s.month && !['Submitted', 'Rebuttal', 'Accepted', 'Abandoned'].includes(p.status)) items.push(`<li>${icon('flag', 14)} ${t('Target')}: <b>${esc(p.targetVenue)}</b> ${dateLabel(p.targetMonth)} (${monthsAway(p.targetMonth - s.month)}) — “${esc(p.title)}”</li>`);
    if (p.status === 'Submitted' && p.timeline) items.push(`<li>${icon('clock', 14)} ${t('“{title}” under review at {venue} — {next}', { title: p.title, venue: venueById[p.venueId]?.name, next: p.timeline.rebuttal !== null && s.month < p.timeline.rebuttal ? t('reviews {month}', { month: dateLabel(p.timeline.rebuttal) }) : t('decision {month}', { month: dateLabel(p.timeline.decision) }) })}</li>`);
    if (p.status === 'Rebuttal') items.push(`<li>${icon('warn', 14)} ${t('Rebuttal for “{title}” due this month — open OpenRegret', { title: p.title })}</li>`);
    if (p.status === 'Advisor Review') items.push(`<li>${icon('doc', 14)} ${t('Draft with {name} — reply in ~{n} wk', { name: lastName(s.advisor.name), n: Math.max(0, p.reviewDueWeek - absWeek(s)) })}</li>`);
    if (p.status === 'Ready' && p.kind !== 'thesis') items.push(`<li>${icon('send', 14)} ${t('“{title}” is approved — submit when a venue is open', { title: p.title })}</li>`);
    if (p.status === 'Accepted' && p.timeline?.conference !== null && p.timeline?.conference >= s.month) items.push(`<li>${icon('plane', 14)} ${t('Conference for “{title}”: {month}', { title: p.title, month: dateLabel(p.timeline.conference) })}</li>`);
  }
  const openVenues = venuesForTopic(s.player.profile.topic).filter(v => !v.rolling && v.deadlines.includes(m));
  if (openVenues.length) items.push(`<li>${icon('calendar', 14)} ${t('Deadlines this month')}: ${openVenues.map(v => esc(v.name)).join(', ')}</li>`);
  for (const h of holidays(s.month)) items.push(`<li>${icon(m === 12 || m === 1 ? 'snow' : m >= 6 && m <= 8 ? 'sun' : 'gift', 14)} ${esc(h.name)} <span class="muted">— ${esc(h.note)}</span></li>`);
  items.push(`<li>${icon('chat', 14)} ${t('One-on-ones')}: <b>${t(s.cadence.oneOnOne)}</b> · ${t('group meeting')}: ${t(s.cadence.group)}${s.ta ? ` · ${t('TA this term')}` : ''}</li>`);
  if (s.internship && s.month >= s.internship.start && s.month <= s.internship.end) items.push(`<li>${icon('case', 14)} ${t('Interning at {company} until {month}', { company: s.internship.company, month: dateLabel(s.internship.end) })}</li>`);
  else if (s.internship) items.push(`<li>${icon('case', 14)} ${t('Internship at {company} starts {month}', { company: s.internship.company, month: dateLabel(s.internship.start) })}</li>`);
  if (s.leaveWeeks) items.push(`<li>${icon('moon', 14)} ${t('{n} week(s) of approved leave banked', { n: s.leaveWeeks })}</li>`);
  const ms = milestoneOf(s);
  // The proposal was named with a date in three separate boxes — the journey legend, the readiness
  // header, and here. Removing it from one and leaving it in the others would just have moved the
  // promise. In the middle years the agenda names the thing without naming a month for it.
  if (ms && inTheMiddle(s)) items.push(`<li>${icon('portal', 14)} ${t('The proposal, eventually. Nobody has given you a date and nobody is going to.')}</li>`);
  else if (ms) items.push(`<li>${icon('portal', 14)} ${{ prelim: t('Prelim'), proposal: t('Thesis proposal'), defense: t('Defense') }[ms.kind]}: ${dateLabel(ms.month)} (${monthsAway(ms.month - s.month)})${s.milestones?.prelim === 'conditional' && ms.kind === 'proposal' ? ` · ${t('conditional pass: needs an accepted paper by Aug 2031')}` : ''}</li>`);
  else if (s.milestones?.proposal === 'pass' && !s.milestones.thesisStarted) items.push(`<li>${icon('doc', 14)} ${t('Candidate. The dissertation can start from {month}.', { month: dateLabel(thesisFloor(s)) })}</li>`);
  else if (s.milestones?.thesisStarted && !s.milestones.defenseMonth) items.push(`<li>${icon('doc', 14)} ${t('Dissertation in progress. Get it approved, then schedule the defense.')}</li>`);
  if (s.jobs?.track) items.push(`<li>${icon('case', 14)} ${t('Job market: {track} track', { track: t(s.jobs.track) })}${s.jobs.offers.length ? ` · ${t('offers')}: ${s.jobs.offers.map(o => esc(t(o))).join(', ')}` : ''}</li>`);
  if (s.flags.fundingGap) items.push(`<li>${icon('money', 14)} ${t('Year-six funding gap: stipend at 70%')}</li>`);
  return `<ul class="agenda">${items.join('')}</ul>`;
}

export function requestList(s) {
  const open = s.requests.filter(r => r.status === 'open');
  if (!open.length) return `<p class="muted small">${t('No open requests. Enjoy it; it is a phase.')}</p>`;
  return open.map(r => {
    const tpl = requestById[r.templateId];
    const due = r.dueWeek - absWeek(s);
    return `<div class="request"><div class="meta"><span>${esc(lastName(s.advisor.name))} · ${esc(t(r.kind))}</span><span class="${due <= 0 ? 'overdue' : ''}">${due <= 0 ? t('due before you continue') : t('due in {n} wk', { n: due })}</span></div><p>${esc(requestText(s, r))}</p><div class="row">${btn(t('Do it (−{n} Energy)', { n: tpl.cost.energy }), 'req-do', { id: r.id, cls: 'small', disabled: s.stage !== 'plan' })}${btn(t('Push back'), 'req-push', { id: r.id, cls: 'small', disabled: s.stage !== 'plan' || r.pushed, title: t('Confidence and trust vs. their toxicity') })}${btn(t('Decline'), 'req-decline', { id: r.id, cls: 'small', disabled: s.stage !== 'plan' })}</div></div>`;
  }).join('');
}

export function projectList(s) {
  if (!s.projects.length) return `<p class="muted small">${t('No project yet. Everything starts with one idea that seemed manageable.')}</p>`;
  return s.projects.map(p => `<button class="project-row ${p.id === s.activeProjectId ? 'selected' : ''}" data-action="select-project" data-id="${p.id}" title="${esc(t('Make this the active project'))}"><span><b>${esc(p.title)}</b><span class="muted small"> · ${p.kind === 'side' ? t('side project') : p.kind === 'thesis' ? t('dissertation') : t('main project')}${p.collaborators.length > 1 ? ` · ${t('with {names}', { names: p.collaborators.slice(1).map(lastName).join(', ') })}` : ''}</span></span>${tag(t(p.status), p.status === 'Accepted' ? 'ok' : p.status === 'Rejected' ? 'bad' : ['Submitted', 'Rebuttal', 'Advisor Review'].includes(p.status) ? 'info' : '')}<span class="bars">${bar(t('Research'), p.progress, { cls: 'teal' })}${bar(t('Draft'), p.draft)}</span><span class="dia" title="${esc(t('Absolute quality: {word}. It tilts the odds. It does not decide them.', { word: diamondWord(diamonds(p)) }))}">${diamondBar(diamonds(p))} <span class="muted tiny">${esc(diamondWord(diamonds(p)))}</span></span>${p.targetVenue ? `<span class="small muted">${t('Target')}: ${esc(p.targetVenue)} · ${dateLabel(p.targetMonth)}</span>` : ''}</button>`).join('');
}

export function advisorCard(s, compact = false) {
  const a = s.advisor, mode = MODES[s.advisorMode?.id || 'normal'];
  const presenceCls = ['checkedOut', 'traveling'].includes(s.advisorMode?.id) ? 'off' : s.advisorMode?.id === 'grant' ? 'away' : s.advisorMode?.id === 'pressed' ? 'typing' : '';
  const rel = s.relationship;
  const words = rel.conflict > 60 ? t('Strained') : rel.trust > 65 && rel.satisfaction > 60 ? t('Good') : rel.satisfaction < 35 ? t('Cooling') : t('Fine, for now');
  return `<div class="advisor-card">${avatar(a.id, 48)}<span class="mode-face" title="${esc(t(mode.label))}">${faceFor(mode.face || 'ok', 22)}</span><div><b>${t('Prof. {name}', { name: a.name })}</b><div class="presence ${presenceCls}"><i></i>${esc(t(mode.presence))} · <span class="muted">${esc(t(mode.label))}</span></div>
  <div class="small muted">${esc(topics[a.topic])} · ${t('lab of {n}', { n: a.labSize })} · ${esc(s.program.name)}</div>
  ${compact ? '' : `<div class="traits" style="margin-top:6px">${['ambition', 'prestige', 'connections', 'funding'].map(k => `<span>${t(k)}<b title="${a[k]}">${band(a[k])}</b></span>`).join('')}</div>`}
  <div class="row" style="margin-top:6px;gap:12px">${mood(rel.conflict > 60 || rel.satisfaction < 35 ? 'sad' : rel.satisfaction > 65 ? 'happy' : 'flat', words)}<span class="small">${t('Pressure')} ${gauge(s.pressure, s.pressure > 60 ? 'red' : 'gold')}</span></div>
  ${a.known?.length ? `<ul class="hint-list">${a.known.map(k => `<li class="muted">${t('You know: {fact}.', { fact: k })}</li>`).join('')}</ul>` : ''}
  </div></div>`;
}

export function quickAsks(s, limit = 4) {
  const now = absWeek(s);
  const list = asks.filter(a => !(a.conditions?.maxEnergy !== undefined && s.player.stats.energy > a.conditions.maxEnergy)).slice(0, limit);
  return `<div class="asks">${list.map(a => btn(esc(a.name), 'ask', { id: a.id, cls: 'small', disabled: s.stage !== 'plan' || (s.askCooldowns[a.id] || 0) > now, title: a.desc + ((s.askCooldowns[a.id] || 0) > now ? ` (${t('asked recently ({n} wk)', { n: s.askCooldowns[a.id] - now })})` : '') })).join('')}${btn(t('More…'), 'open', { app: 'chat', cls: 'small link' })}</div>`;
}

// Keep the thesis decision reachable alongside projects as well as in the next-step prompt.
function quietDecision(s) {
  if (!canDecideThesis(s)) return '';
  return `<p>${btn(t('Decide what the thesis is'), 'decide-thesis', { cls: 'small', disabled: s.stage !== 'plan' })}</p>`;
}

const optionalPanel = (id, title, content) => `<details class="optional-panel" data-disclosure="${id}"><summary>${title}</summary><div class="optional-content">${content}</div></details>`;

function taskShortcuts(s) {
  return `<nav class="task-shortcuts" aria-label="${esc(t('Things you can do'))}">
    ${btn(`${icon('chat', 16)} ${t('Talk to advisor')}`, 'open', { app: 'chat', attrs: 'data-page="advisor"' })}
    ${btn(`${icon('paper', 16)} ${t('Work on paper')}`, 'open', { app: 'browser', attrs: 'data-page="overgrief"' })}
    ${btn(`${icon('heart', 16)} ${t('Recover energy')}`, 'open', { app: 'life', attrs: 'data-page="body"' })}
    ${btn(`${icon('people', 16)} ${t('Around your desk')}`, 'open', { app: 'life', attrs: 'data-page="living"' })}
  </nav>`;
}

export function managerApp(s, ui) {
  const tempo = s.tempo, crunch = s.crunch;
  const p = activeProject(s);
  const nextLabel = tempo === 'day' ? (daysLeftInWeek(s) <= 1 && s.week >= 3 ? t('Finish the month →') : t('End the day →')) : tempo === 'week' ? (s.week >= 3 ? t('Finish the month →') : t('Continue → week {n}', { n: s.week + 2 })) : tempo === 'season' ? t('Continue → {month} (3 months)', { month: dateLabel(s.month + 3) }) : t('Continue → {month}', { month: dateLabel(s.month + 1) });
  const objective = s.stage !== 'plan' ? t('Respond to what is on screen.') : s.focus === 'recovery' ? t('Continue to use your leave. Research and meetings wait.') : s.thesis && !s.thesis.deposited ? (canDeposit(s) ? t('Every revision is done. Deposit it, and then the margins will have opinions.') : t('You passed. Now finish the revisions — the degree is conferred on deposit, not on the defense.')) : !s.focus ? (tempo === 'day' ? t('Give today to something, then end the day. Coffee is optional. It is not.') : tempo === 'week' ? t('Decide what this week goes to, then Continue.') : t('Pick a plan for the month, then Continue. Everything else is optional.')) : !s.projects.length ? t('Start a project in the Projects box, or just Continue and see what the month brings.') : s.requests.some(r => r.status === 'open') ? t('Your advisor asked for something. Answer it (or don’t), then Continue.') : p?.status === 'Ready' && p.kind !== 'thesis' ? t(p.approvedWithout ? 'Ready to submit without the advisor’s final read. Open OpenRegret when a venue is open.' : 'A draft is approved. Submit it in Netscope → OpenRegret when a venue is open.') : p?.status === 'Rebuttal' ? t('Reviews are in. Write the rebuttal in OpenRegret this month.') : t('Plan set. Use the desktop if you want, then Continue.');
  const tempoNote = crunch?.type === 'zoom' ? tempo === 'day' ? t('You chose a closer view. This plan covers one working day.') : t('You chose a closer view. This plan covers one week.') : tempo === 'day' ? t('Days pass one at a time now. Everything counts and nothing is enough.') : tempo === 'week' ? t('Deadline weeks pass one at a time.') : tempo === 'season' ? t('Calm seasons pass three months at a time.') : remainingWeeks(s) < 4 ? t('Continue uses the remaining {n} working day(s) this month.', { n: Math.round(remainingWeeks(s) * DAYS_PER_WEEK) }) : t('Calm months pass in one step.');
  return `<div class="topstrip raised"><div><h1>${dateLabel(s.month)} ${tempo === 'day' ? `<span class="tag info">${esc(dayName(s))} · ${t('week {n}', { n: Math.min(4, s.week + 1) })}</span>` : tempo === 'week' ? `<span class="tag info">${t('Week {n} of 4', { n: Math.min(4, s.week + 1) })}</span>` : ''} ${crunch ? tag(crunchLabel(crunch), crunch.type === 'zoom' ? 'info' : 'crunch') : ''}</h1><div class="sub">${esc(semester(s.month))} · ${t('Year {n}', { n: phdYear(s.month) })} · ${esc(seasonalFlavor(s.month, s.seed + s.month))}</div></div><div class="stack right">${btn(nextLabel, 'continue', { cls: 'continue primary', disabled: s.stage !== 'plan' || !s.focus, title: s.stage !== 'plan' ? t('Answer what is on screen first.') : !s.focus ? t('Pick a plan on the left first — that is what the turn spends.') : t('Enter') })}<span class="tiny muted">${tempoNote}</span>${paceControl(s)}</div></div>
  ${journeyBar(s)}
  ${standingBanner(s)}
  ${recoveryStatus(s)}${relocationPanel(s)}${tenureNotice(s)}${supervisionStatus(s)}${ventureStatus(s)}
  ${(() => { const n = managerNextStep(s); if (!n) return ''; return `<div class="next-step"><span class="ns-mark">${icon('arrow', 18)}</span><div><b>${esc(n.title)}</b><span class="muted small">${esc(n.detail)}</span></div><span class="ns-cta">${n.cta}</span></div>`; })()}
  ${taskShortcuts(s)}
  <div class="grid-3 manager-layout">
    <div>${tempo === 'day' ? group(t('Today'), dayStrip(s)) : ''}${group(tempo === 'day' ? t('Today goes to') : tempo === 'week' ? t('This week goes to') : t('Plan for the month'), planList(s))}</div>
    <div>${s.thesis && !s.thesis.deposited ? group(t('Almost'), revisionPanel(s)) : timelinePanel(s) ? group(t('The timeline'), timelinePanel(s)) : ''}${internPanel(s) ? group(t('Summer'), internPanel(s)) : ''}${lettersPanel(s) ? group(t('Letters'), lettersPanel(s)) : ''}${group(t('Agenda'), readinessWidget(s) + agenda(s))}${group(`${t('Advisor requests')} ${s.requests.some(r => r.status === 'open') ? tag(String(s.requests.filter(r => r.status === 'open').length), 'warn') : ''}`, requestList(s))}</div>
    <div>${group(t('Projects'), projectList(s) + `<div class="row" style="margin-top:6px">${btn(t('Start main project'), 'start-project', { cls: 'small', disabled: s.stage !== 'plan' || !canStartMain(s), title: canStartMain(s) ? t('A new main project') : t('The current main project is still alive') })}${btn(t('Start side project'), 'start-side', { cls: 'small', disabled: s.stage !== 'plan' || !canStartSide(s), title: t('Month 5+, main project past 40%, one at a time. −5 Energy.') })}${s.milestones?.proposal === 'pass' && !s.milestones.thesisStarted ? btn(t('Start the dissertation'), 'start-thesis', { cls: 'small accent', disabled: s.stage !== 'plan' || s.month < thesisFloor(s), title: t('From {month}, a decent interval after the proposal. Accepted papers become chapters, and the ones you aimed at it become better ones.', { month: dateLabel(thesisFloor(s)) }) }) : ''}${s.projects.some(x => x.kind === 'thesis' && x.status === 'Ready') && (s.milestones.defenseMonth === null || s.milestones.defenseMonth === undefined) ? btn(t('Schedule the defense'), 'schedule-defense', { cls: 'small accent', disabled: s.stage !== 'plan' || !!defenseScheduleUnavailable(s), title: defenseScheduleUnavailable(s) || '' }) : ''}${btn(t('Open Overgrief'), 'open', { app: 'browser', cls: 'small link', attrs: 'data-page="overgrief"' })}</div>${quietDecision(s)}`)}
    ${optionalPanel('manager-support', t('Stuck?'), stuckPanel(s))}
    ${optionalPanel('manager-advisor', t('Advisor'), advisorCard(s) + `<div style="margin-top:8px">${quickAsks(s, 3)}</div>`)}
    ${optionalPanel('manager-notes', t('Field notes'), `<div class="notes-box">${voiced(noticeText(s))}</div>`)}</div>
  </div>`;
}


// How the month went, before the tables. A face, four bars that move, and the events as icons —
// so the shape of the month is visible in about a second and the prose is there if you want it.
const CAT_ICON = { advisor: 'user', lab: 'people', peer: 'people', research: 'research', department: 'portal',
  life: 'heart', career: 'case', holiday: 'gift', crunch: 'clock', review: 'paper', conference: 'plane',
  urgent: 'warn', divergence: 'flag', funding: 'bolt', meeting: 'chat' };

function monthAtAGlance(s, r, b) {
  const st = s.player.stats;
  // The face reads the whole month, not one number: how you are, plus how it went with them.
  const score = (st.hope - b.stats.hope) * .9 + (st.energy - b.stats.energy) * .5
    + (st.health - (b.stats.health ?? st.health)) * .7 + (s.relationship.satisfaction - b.relationship.satisfaction) * .8
    - (s.player.hidden.stress - b.stress) * .7;
  const level = score > 16 ? 'great' : score > 5 ? 'good' : score > -5 ? 'ok' : score > -16 ? 'bad' : 'awful';
  const word = { great: t('A good month.'), good: t('Better than most.'), ok: t('A month.'), bad: t('A hard one.'), awful: t('That was a bad month.') }[level];
  const cats = [...new Set(r.events.map(e => e.category).filter(Boolean))].slice(0, 8);
  return `<div class="glance">
    <div class="glance-face">${faceFor(level, 52)}<b>${esc(word)}</b></div>
    <div class="glance-bars">
      ${deltaBar(t('Hope'), b.stats.hope, st.hope)}
      ${deltaBar(t('Energy'), b.stats.energy, st.energy)}
      ${deltaBar(t('Health'), b.stats.health ?? st.health, st.health)}
      ${deltaBar(t('Advisor'), b.relationship.satisfaction, s.relationship.satisfaction)}
    </div>
    ${cats.length ? `<div class="glance-cats">${cats.map(c => `<span class="gcat" title="${esc(t(c))}">${icon(CAT_ICON[c] || 'star', 18)}</span>`).join('')}</div>` : ''}
  </div>`;
}

export function reportDialog(s) {
  const r = s.report; if (!r) return '';
  const b = r.before, st = s.player.stats;
  const delta = (label, before, after, invert = false, fmt = v => Math.round(v)) => { const d = after - before; const cls = d === 0 ? '' : (d > 0) !== invert ? 'up' : 'down'; return `<tr><td>${label}</td><td class="${cls}">${d === 0 ? '—' : (d > 0 ? '▲ ' : '▼ ') + fmt(Math.abs(d))}</td><td class="muted right">${fmt(after)}</td></tr>`; };
  const stressDelta = s.player.hidden.stress - b.stress;
  const stats = `<table class="grid delta-table">${delta(t('Hope'), b.stats.hope, st.hope)}${delta(t('Energy'), b.stats.energy, st.energy)}${delta(t('Confidence'), b.stats.confidence, st.confidence)}${delta(t('Health'), b.stats.health ?? st.health, st.health)}${delta(t('Money'), b.stats.money, st.money, false, v => money(v))}${(s.debt || b.debt) ? delta(t('Card balance'), b.debt || 0, s.debt || 0, true, v => money(v)) : ''}${delta(t('Academic capital'), b.stats.academicCapital, st.academicCapital)}${delta(t('Coursework'), b.coursework, s.coursework)}${delta(t('Readiness'), b.readiness, s.readiness)}${delta(t('Career'), b.career, s.career)}${delta(t('Trust'), b.relationship.trust, s.relationship.trust)}${delta(t('Advisor satisfaction'), b.relationship.satisfaction, s.relationship.satisfaction)}<tr><td>${t('Stress (felt)')}</td><td class="${stressDelta > 4 ? 'down' : stressDelta < -4 ? 'up' : ''}">${stressDelta > 4 ? '▲ ' + t('higher') : stressDelta < -4 ? '▼ ' + t('lower') : '—'}</td><td class="muted right">${s.player.hidden.stress > 70 ? t('high') : s.player.hidden.stress > 45 ? t('medium') : t('low')}</td></tr></table>`;
  const projects = s.projects.map(p => { const before = b.projects?.[p.id]; return `<article class="report-project"><div class="report-project-heading"><strong>${esc(p.title)}</strong>${tag(t(p.status))}</div><dl><div><dt>${t('Research')}</dt><dd>${before ? `${Math.round(before.progress)} → ${Math.round(p.progress)}` : `${t('new')} · ${Math.round(p.progress)}`}</dd></div><div><dt>${t('Draft')}</dt><dd>${before ? `${Math.round(before.draft)} → ${Math.round(p.draft)}` : Math.round(p.draft)}</dd></div></dl></article>`; }).join('');
  const meetings = r.meetings ? `<p>${t('{held} of {expected} one-on-ones held', { held: r.meetings.held, expected: r.meetings.expected })}${r.meetings.cancelled ? `, ${t('{n} cancelled', { n: r.meetings.cancelled })}` : ''}. ${esc(r.meetings.groupLine)}.</p><ul class="small muted">${r.meetings.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : r.weeks.length ? `<ul class="small">${r.weeks.map(w => `<li>${t('Week {n}', { n: w.week })}: ${esc(w.focus)}${w.leave ? ` (${t('leave')})` : ''}${w.cancelled ? ` · ${t('meeting cancelled')}` : w.held ? ` · ${t('met with advisor')}` : ''}</li>`).join('')}</ul>` : `<p class="muted small">${t('No meetings this month.')}</p>`;
  const ledgerLine = l => [`${t('Stipend')} ${money(l.stipend)}`, `${t('rent')} −${money(l.rent)}`, `${t('food')} −${money(l.food ?? 0)}`, `${t('insurance')} −${money(l.premium ?? 0)}`, ...(l.fees ? [`${t('fees')} −${money(l.fees)}`] : []), ...(l.visa ? [`${t('visa')} −${money(l.visa)}`] : []), ...(l.interest ? [`${t('card interest')} −${money(l.interest)}`] : []), ...(l.repaid ? [`${t('card repayment')} −${money(l.repaid)}`] : [])].join(' · ');
  const ledger = r.ledgers ? r.ledgers.filter(Boolean).map(l => `<p class="small">${dateLabel(l.month)}: ${ledgerLine(l)}${l.note ? ` <span class="muted">(${esc(l.note)})</span>` : ''}</p>`).join('') : r.ledger ? `<p class="small">${ledgerLine(r.ledger)}${r.ledger.note ? `<br><span class="muted">${esc(r.ledger.note)}</span>` : ''}</p>` : '';
  const events = r.events.length ? r.events.map(e => { const line = e.i18n ? say(s, '', e.i18n) : ''; const [head, ...rest] = line ? line.split(' — ') : []; return `<div class="event-line"><b>${esc(line ? head : e.title)}</b>${esc(line ? rest.join(' — ') : e.choice + (e.result ? ` — ${e.result}` : ''))}${e.rolled ? rollReadout(e.rolled) : ''}</div>`; }).join('') : `<p class="muted small">${t('A quiet month. Suspicious, but welcome.')}</p>`;
  const msNow = milestoneOf(s);
  const next = msNow && msNow.month === s.month ? t('Next: {what}.', { what: { prelim: t('the preliminary examination'), proposal: t('the thesis proposal'), defense: t('the dissertation defense') }[msNow.kind] }) : s.month >= 71 ? t('Next: the end of the funding.') : t('Next: {month}', { month: dateLabel(s.month + 1) }) + (holidays(s.month + 1).length ? ` · ${holidays(s.month + 1).map(h => esc(h.name)).join(', ')}` : '');
  return `<div class="modal"><section class="dialog wide report-statement" role="dialog" aria-modal="true" aria-labelledby="report-title"><div class="titlebar"><span class="tb-title">${icon('doc', 16)}<span>${r.monthsCovered > 1 ? t('Season statement — {from} to {to}', { from: dateLabel(r.fromMonth ?? s.month), to: dateLabel(r.throughMonth ?? (s.month + r.monthsCovered - 1)) }) : t('Monthly statement — {month}', { month: dateLabel(s.month) })}</span></span></div><div class="body">
    <h2 id="report-title">${esc(r.focus || t('A month, week by week'))}</h2>
    ${r.interruptedSeason ? `<p class="small">${esc(t('Season paused after {n} month(s). The remaining planned work has not been applied.', { n: r.interruptedSeason.monthsCovered }))} ${esc(dateLabel(r.interruptedSeason.fromMonth))}–${esc(dateLabel(r.interruptedSeason.throughMonth))}</p>` : ''}
    ${monthAtAGlance(s, r, b)}
    ${group(t('Projects'), projects || `<p class="muted small">${t('No project yet.')}</p>`)}
    ${optionalPanel('report-events', t('What happened'), events)}
    ${optionalPanel('report-numbers', t('What changed'), stats)}
    ${optionalPanel('report-money', t('Money'), ledger || `<p class="muted small">${t('First month: moving costs and a deposit you will never see again.')}</p>`)}
    ${optionalPanel('report-meetings', t('Meetings'), meetings)}
    <div class="dialog-footer"><span>${next}</span><span>${t('Autosaved.')}</span></div></div>
    <div class="buttons">${btn(msNow && msNow.month === s.month ? t('Enter the room →') : t('Continue to {month} →', { month: dateLabel(s.month + (r.advanceMonths ?? r.monthsCovered ?? 1)) }), 'dismiss-report', { cls: 'primary', attrs: 'data-default="1"' })}</div></section></div>`;
}
