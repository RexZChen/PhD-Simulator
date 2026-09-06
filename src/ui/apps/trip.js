import { esc, btn, group, tag, money, note, bar } from '../helpers.js';
import { icon } from '../icons.js';
import { avatar } from '../avatars.js';
import { cities, flights, hotels, questioners, talkSlots, tripActivities, caughtScenes } from '../../data/conference.js';
import { tripCity, tripProject, tripVenue, TRIP_DAYS, upgradeOptions } from '../../engine/trip.js';
import { diamondBar, diamonds } from '../../engine/paper.js';
import { dateLabel } from '../../data/calendar.js';
import { fill, lastName } from '../../engine/state.js';
import { t } from '../../i18n/index.js';

const DAY_LABEL = n => [t('Day one'), t('Day two'), t('Day three'), t('Day four')][n] || t('Day {n}', { n: n + 1 });

// ── The border ────────────────────────────────────────────────────────────────
function visaScreen(s) {
  const trip = s.trip, city = cities[trip.cityId];
  const need = trip.need;
  const fee = { schengen: 105, canada: 185, uk: 140, easy: 60, hard: 195, evisa: 45 }[need.kind] || 0;
  const risk = Math.round(need.risk * 100);
  const blurb = {
    schengen: t('A Schengen short-stay visa. An appointment at a consulate in another city, a bank statement, a letter from your department, and proof you intend to come back.'),
    canada: t('A Canadian temporary resident visa. Biometrics at an application centre, and a processing time that is a range rather than a number.'),
    uk: t('A UK standard visitor visa. The online form asks for every country you have visited in ten years, by month.'),
    easy: t('A short-stay visa, usually straightforward, occasionally not.'),
    hard: t('A full visa application. An interview slot, six weeks minimum, and a folder of documents proving you are a real person doing a real thing.'),
    evisa: t('An electronic travel authorisation. Twenty minutes online and a small fee.'),
  }[need.kind];
  return `<div class="trip visa-screen">
    <div class="trip-head"><h1>${icon('plane', 22)} ${t('{venue} is in {city}', { venue: trip.venueName, city: t(city.name) })}</h1>
      <p class="muted">${t('Your paper is accepted. There is one more gate between you and the room.')}</p></div>
    <div class="cols two">
      <div>${group(t('The application'), `<p class="small">${esc(blurb)}</p>
        <table class="grid"><tr><td>${t('Fee')}</td><td class="num">${money(fee)}</td></tr>
        <tr><td>${t('Typical processing')}</td><td class="num">${t('{n} weeks', { n: need.weeks })}</td></tr>
        <tr><td>${t('Rough chance of a problem')}</td><td class="num">${risk}%</td></tr></table>
        <p class="tiny muted">${s.player.profile.international ? t('Your classmate with the other passport books a flight and goes. You file a folder. Both of you are doing a PhD.') : t('You are travelling on a passport that opens most doors. This is luck, not merit, and it is worth noticing.')}</p>`)}</div>
      <div>${group(t('How you file'), `<div class="radio-list">
        <button class="option" data-action="trip-visa" data-id="normal"><span class="radio"></span>${icon('doc', 22)}<span><b>${t('File it the ordinary way')}</b><span class="muted">${t('The fee, the queue, the wait. Usually fine.')}</span></span></button>
        <button class="option" data-action="trip-visa" data-id="rush"><span class="radio"></span>${icon('warn', 22)}<span><b>${t('Pay for expedited processing (+$240)')}</b><span class="muted">${t('Slightly better odds, definitely worse for the account.')}</span></span></button>
        <button class="option" data-action="trip-visa" data-id="skip"><span class="radio"></span>${icon('home', 22)}<span><b>${t('Do not go')}</b><span class="muted">${t('A co-author presents. You save the money and lose the room.')}</span></span></button>
      </div>`)}</div>
    </div></div>`;
}

// ── The talk ──────────────────────────────────────────────────────────────────
function talkIntro(s) {
  const p = tripProject(s), venue = tripVenue(s);
  return `<div class="trip talk-intro">
    <div class="trip-head"><h1>${t('Your session')}</h1><p class="muted">${t('“{title}” · {venue} · a room whose name is a number', { title: p?.title || '', venue: venue?.name || '' })}</p></div>
    <div class="stage-strip"><div class="stage-screen">${esc(p?.title || '')}<small>${esc(s.player.name.toUpperCase())} · ${esc(s.program.name.toUpperCase())}</small></div><div class="stage-seats">${Array.from({ length: 18 }, (_, i) => `<i class="${i % 5 === 3 ? 'empty' : ''}"></i>`).join('')}</div><span class="scene-caption">${t('TWELVE MINUTES. THEN QUESTIONS.')}</span></div>
    ${note(t('You have twelve minutes and six slides. Build the talk by picking the phrase that belongs in each section before the clock runs out. Hype words play well in the room and badly in the Q&A.'))}
    <div class="row" style="margin-top:8px">${btn(t('Take the podium →'), 'talk-start', { cls: 'primary', attrs: 'data-default="1"' })}</div>
  </div>`;
}

// The live minigame board. main.js paints it on an interval; this is only the frame.
export function talkBoard(s) {
  return `<div class="trip talkgame">
    <div class="tg-head"><b data-tg-slot>${t('Motivation')}</b><span class="tg-clock"><i data-tg-bar></i></span><span data-tg-score class="tg-score">0</span></div>
    <div class="tg-stage"><div class="tg-audience">${Array.from({ length: 24 }, (_, i) => `<i class="a${i % 4}"></i>`).join('')}</div><div class="tg-slide" data-tg-slide></div></div>
    <div class="tg-words" data-tg-words></div>
    <p class="tiny muted" data-tg-note>${t('Click the phrase that belongs in this section. Filler wastes the slot; hype costs you later.')}</p>
  </div>`;
}

function talkResult(s) {
  const trip = s.trip, talk = trip.talk;
  const grades = { great: t('That was a good talk'), good: t('That went fine'), ok: t('That happened'), rough: t('You got through it') };
  return `<div class="trip talk-result">
    <div class="trip-head"><h1>${esc(grades[talk.grade])}</h1><p class="muted">${t('Poise {n} · {hits} sections landed · {hype} hype word(s) · {miss} lost slot(s)', { n: talk.poise, hits: talk.hits, hype: talk.hype, miss: talk.misses })}</p></div>
    <div class="scene-text"><span class="speaker">${t('The room')}</span>${esc(talk.line)}</div>
    ${talk.hype >= 2 ? note(t('You used the big words. Somebody near the front wrote them down.'), 'warn') : ''}
    <div class="row" style="margin-top:10px">${btn(t('Take questions →'), 'talk-qa', { cls: 'primary', attrs: 'data-default="1"' })}</div>
  </div>`;
}

function qaScreen(s) {
  const trip = s.trip;
  const qid = trip.qa[trip.qaIndex];
  const q = questioners.find(x => x.id === qid);
  const last = trip.qaResults?.at(-1);
  return `<div class="trip qa">
    <div class="trip-head"><h1>${t('Questions')}</h1><p class="muted">${t('Question {n} of {m}', { n: trip.qaIndex + 1, m: trip.qa.length })}</p></div>
    ${last ? `<div class="qa-prev ${last.good ? 'good' : 'bad'}">${esc(last.line)}</div>` : ''}
    <div class="qa-ask ${q.tone}">
      ${avatar(q.id + s.seed, 44)}
      <div><span class="qa-who">${esc(t(q.who))}</span><p>${esc(t(q.text))}</p></div>
    </div>
    <div class="choices timed" data-timer="14">
      ${Object.entries(q.options).map(([id, o], i) => `<button class="btn choice" data-action="trip-qa" data-id="${id}" data-hotkey="${i + 1}"><span><kbd>${i + 1}</kbd></span><span><b>${esc(t(o.label))}</b></span><span class="arrow">→</span></button>`).join('')}
    </div>
    <div class="timer-bar"><i data-qa-timer></i></div>
    <p class="tiny muted">${t('Fourteen seconds. Silence is also an answer, and a worse one.')}</p>
  </div>`;
}

// ── The days ──────────────────────────────────────────────────────────────────
function caughtScreen(s) {
  const scene = caughtScenes.find(x => x.id === s.trip.caughtScene.id);
  const labels = {
    back: [t('Go back to the venue'), t('The idea is good. Your afternoon is gone.')],
    later: [t('“Can it wait until tomorrow?”'), t('It can. There will be a small cost in atmosphere.')],
    honest: [t('Tell them exactly where you are and why'), t('Risky. Occasionally it is the best thing you ever do.')],
    join: [t('Ask if they want to see the rest of it'), t('Three hours with your advisor as a person.')],
    awkward: [t('Pretend you were both leaving'), t('Nobody is fooled and everybody is grateful.')],
  };
  return `<div class="trip caught">
    <div class="trip-head"><h1>${t('Found')}</h1></div>
    <div class="scene-text"><span class="speaker">${t('Prof. {name}', { name: lastName(s.advisor.name) })}</span>${esc(fill(s, t(scene.text)).replace('{place}', s.trip.caughtScene.place))}</div>
    <div class="choices">${scene.choices.map((id, i) => `<button class="btn choice" data-action="trip-caught" data-id="${id}" data-hotkey="${i + 1}"><span><kbd>${i + 1}</kbd></span><span><b>${esc(labels[id][0])}</b><small class="muted">${esc(labels[id][1])}</small></span><span class="arrow">→</span></button>`).join('')}</div>
  </div>`;
}

function daysScreen(s) {
  const trip = s.trip, city = tripCity(s), p = tripProject(s);
  const isTalkDay = trip.day === trip.talkDay && !trip.talkDone;
  const seen = trip.seenAttractions.length;
  return `<div class="trip days">
    <div class="trip-head">
      <h1>${icon('plane', 20)} ${esc(t(city.name))} · ${esc(trip.venueName)}</h1>
      <p class="muted">${DAY_LABEL(trip.day)} ${t('of {n}', { n: trip.days || TRIP_DAYS })} · ${esc(t(city.blurb))}</p>
    </div>
    <div class="cols main-side">
      <div>
        ${isTalkDay ? `<div class="talk-today">${icon('warn', 18)}<div><b>${t('You present today.')}</b><span class="muted small">${t('“{title}” — {bar}', { title: p?.title || '', bar: p ? diamondBar(diamonds(p)) : '' })}</span></div>${btn(t('Go to your session →'), 'talk-intro', { cls: 'primary', attrs: 'data-default="1"' })}</div>`
      : `<div class="radio-list">${tripActivities.map(x => `<button class="option" data-action="trip-day" data-id="${x.id}">${'<span class="radio"></span>'}${icon(x.icon, 22)}<span><b>${esc(t(x.name))}</b><span class="muted">${esc(t(x.blurb))}</span>${x.explore && seen ? `<span class="tiny muted">${t('You have skipped out {n} time(s) already.', { n: seen })}</span>` : ''}</span></button>`).join('')}</div>`}
        ${trip.note ? note(esc(trip.note)) : ''}
      </div>
      <div>
        ${group(t('The trip'), `<table class="grid">
          <tr><td>${t('Flight')}</td><td>${esc(t(flights[trip.flight].name))}</td></tr>
          <tr><td>${t('Staying')}</td><td>${esc(t(hotels[trip.hotel].name))}</td></tr>
          <tr><td>${t('Cost to you')}</td><td class="num">${money(trip.yours)}</td></tr>
          <tr><td>${t('Covered by the lab')}</td><td class="num">${money(trip.covered)}</td></tr>
        </table><p class="tiny muted">${esc(t(flights[trip.flight].blurb))} ${esc(t(hotels[trip.hotel].blurb))}</p>`)}
        ${group(t('Spend money on this trip'), `<div class="upgrades">${upgradeOptions(s).map(x => `<button class="upgrade ${x.afford && x.can ? '' : 'off'}" data-action="trip-upgrade" data-id="${x.id}" ${x.afford && x.can ? '' : 'disabled'}><span><b>${esc(t(x.name))}</b><small class="muted">${esc(!x.can ? x.why : !x.afford ? t('Not with what is in the account.') : t(x.blurb))}</small></span><b class="up-cost">${money(x.cost)}</b></button>`).join('')}</div>
          <p class="tiny muted">${t('In the account: {n}. Nobody will reimburse any of this.', { n: money(s.player.stats.money) })}${(trip.tourCredits || 0) ? ' · ' + t('{n} booked outing(s) waiting', { n: trip.tourCredits }) : ''}</p>`)}
        ${group(t('So far'), `<div class="row between"><span>${t('Real conversations')}</span><b>${trip.connections}</b></div>
          <div class="row between"><span>${t('People who said they will cite it')}</span><b>${trip.cites}</b></div>
          <div class="row between"><span>${t('City, seen')}</span><b>${seen} / ${city.attractions.length}</b></div>
          ${trip.talk ? `<div class="row between"><span>${t('The talk')}</span><b>${esc({ great: t('landed'), good: t('fine'), ok: t('survived'), rough: t('rough') }[trip.talk.grade])}</b></div>` : ''}`)}
      </div>
    </div>
  </div>`;
}

export function tripScreen(s, ui) {
  const trip = s.trip;
  if (!trip) return '';
  if (trip.phase === 'visa') return visaScreen(s);
  if (trip.caughtScene) return caughtScreen(s);
  if (ui.talkStage === 'intro' && !trip.talkDone) return talkIntro(s);
  if (ui.talkStage === 'game' && !trip.talkDone) return talkBoard(s);
  if (trip.talk && !trip.qa) return talkResult(s);
  if (trip.talkDone && trip.qa && !trip.qaDone && ui.talkStage === 'qa') return qaScreen(s);
  if (trip.talk && trip.qa && !trip.qaDone && ui.talkStage !== 'qa') return talkResult(s);
  return daysScreen(s);
}
