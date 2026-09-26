import { esc } from './helpers.js';
import { avatar } from './avatars.js';
import { activeLabmates } from '../engine/state.js';
import { t } from '../i18n/index.js';

// Atmosphere follows the actual scene. A cancelled appointment is not an entrance.
export function meetingContext(s, e) {
  const group = e.id.startsWith('group_') || e.id === 'firstyear_lab_first_group_meeting';
  if (!group && (e.category !== 'meeting' || e.conditions?.cancelled)) return null;
  const kindness = e.tone === 'supportive';
  const calm = kindness || e.tone === 'routine';
  const cameraOff = e.id === 'meet_silence' && (s.eventVariant || 0) % 2 === 0;
  const tense = !calm && (['group_public_correction', 'group_laughed_at', 'group_round_thin', 'meet_criticism'].includes(e.id)
    || (s.crunch && s.crunch.type !== 'zoom') || s.advisorMode?.id === 'pressed' || s.advisor?.toxicity > 55 || s.relationship?.conflict > 45);
  const supportive = kindness || (e.tone !== 'routine' && !tense && s.advisor?.caring >= 65);
  const remote = !!s.flags?.remoteAdvisor || cameraOff;
  const roundtable = ['group_round_thin', 'group_round_strong'].includes(e.id);
  const specific = {
    group_round_thin: ['The updates move around the table. Your turn is getting closer.'],
    group_round_strong: ['The updates move around the table. This time, you have something to show.'],
    group_reading: ['The paper is open. The discussion will establish who else opened it.'],
    group_nobody_read: ['Your draft is on screen. Around the table, people find the first page.'],
    group_someone_else: ['Someone else is presenting. You are still expected to have a question.'],
    group_your_turn_again: ['One new figure. A whole meeting slot.'],
    meet_reading: ['The reading list is open. So is the question of how much you read.'],
    meet_rebuttal: ['The reviews are open. First, agree on what they are actually asking.'],
  }[e.id];
  const lines = cameraOff ? ['The call connects. Their camera stays off.']
    : e.id === 'meet_rest' ? ['They set the work aside for a moment.']
    : specific ? specific
    : remote
    ? group
      ? tense ? ['The room goes quiet. Your advisor fills the screen.']
        : ['The lab gathers around the table. Your advisor joins on screen.']
      : tense ? ['The call connects. For a moment, neither of you speaks.']
        : supportive ? ['They join the call and turn their attention to you.']
          : ['Your notes are open. The call has begun.']
    : group
    ? tense ? ['The projector is on. The side conversations stop.', 'Another update. Everyone is listening now.']
      : ['Laptops open. Coffee down. Someone finds the agenda.', 'The projector takes a moment. Nobody counts it as meeting time.']
    : tense ? ['Your notes are open. They look up.', 'The door closes. Your notes are suddenly very short.']
      : supportive ? ['They turn away from the monitor and make room for your notes.', 'Two chairs. Your notes. Time to work out what is stuck.']
        : ['They close one tab. Your update is the next one.', 'You have an agenda. You will find out whether they have the same one.'];
  return { group, remote, cameraOff, roundtable, tone: tense ? 'tense' : supportive ? 'supportive' : 'routine',
    line: lines[((s.month || 0) + (s.week || 0) + (s.seen?.[e.id] || 0)) % lines.length] };
}

export function meetingRoom(s, e, context) {
  const { group, remote, cameraOff, roundtable, tone, line } = context;
  const people = group ? activeLabmates(s).slice(0, 4) : [];
  return `<div class="meeting-room ${group ? 'meeting-group' : 'meeting-private'} ${remote ? 'meeting-remote' : ''} meeting-${tone}" data-meeting-room>
    <div class="meeting-set" aria-hidden="true">
      <div class="meeting-window"></div><div class="meeting-wall-clock"></div><div class="meeting-ceiling-light"></div>
      ${remote ? `<div class="meeting-video ${cameraOff ? 'meeting-camera-off' : ''}">${cameraOff ? `<div class="meeting-camera-label">${esc(t('Camera off'))}</div>` : `<div class="meeting-video-person">${avatar(s.advisor.id, 84, { bg: 'transparent' })}</div>`}<div class="meeting-video-name">${esc(s.advisor.name)}</div><div class="meeting-video-controls"><i></i><i></i><i></i></div></div>`
        : `${group ? roundtable ? '<div class="meeting-projection meeting-projector-off"></div>' : '<div class="meeting-projection"><i></i><i></i><i></i></div>' : '<div class="meeting-books"></div><div class="meeting-monitor"></div>'}<div class="meeting-pi">${avatar(s.advisor.id, 104, { bg: 'transparent' })}</div>`}
      ${people.map((person, i) => `<div class="meeting-colleague" style="--seat:${i}">${avatar(person.id, 62, { bg: 'transparent' })}</div>`).join('')}
      <div class="meeting-table"></div><div class="meeting-notes"></div><div class="meeting-folder"></div>
      ${remote ? '' : '<div class="meeting-door"></div>'}<div class="meeting-shade"></div>
    </div>
    <div class="meeting-calendar" aria-hidden="true"><span>${esc(t(remote ? 'Video call · waiting room' : 'Calendar · now'))}</span><b>${esc(t(group ? 'Lab meeting' : 'One-on-one'))}</b><small>${esc(s.advisor.name)}</small><div class="meeting-calendar-line"></div></div>
    <div class="meeting-caption"><b>${esc(t(cameraOff ? 'Connected · camera off' : remote ? 'Your advisor is on screen' : group ? 'Around the table' : 'Your appointment'))}</b><span>${esc(t(line))}</span></div>
  </div>`;
}

let arrival = null;
let timer = null;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const meetingArriving = () => !!arrival && arrival.left > 0;

function finish(focus = false) {
  if (arrival) arrival.left = 0;
  clearInterval(timer); timer = null;
  const dialog = document.querySelector('[data-meeting]');
  dialog?.classList.remove('meeting-arriving', 'meeting-motion-paused');
  const skip = dialog?.querySelector('[data-action="skip-meeting-arrival"]');
  // Automatic completion must not strand keyboard focus on a hidden skip button.
  if (focus || document.activeElement === skip) dialog?.querySelector('[data-action="pause-scene"]')?.focus();
  if (skip) skip.hidden = true;
}
export function skipMeetingArrival() { finish(true); }

// DOM is rebuilt by the shell. Keep the entrance's elapsed time, just like the scene clock.
export function syncMeetingArrival(s, settings, paused) {
  const dialog = document.querySelector('[data-meeting]');
  clearInterval(timer); timer = null;
  if (!dialog) { arrival = null; return; }
  const key = [s.seed, s.event, s.month, s.week, s.dayIndex, s.seen?.[s.event]].join('|');
  if (arrival?.key !== key) arrival = { key, total: 1800, left: 1800 };
  if (settings.quiet || reducedMotion() || !arrival.left) { finish(); return; }
  const skip = dialog.querySelector('[data-action="skip-meeting-arrival"]');
  if (skip) skip.hidden = false;
  dialog.style.setProperty('--meeting-elapsed', `${arrival.left - arrival.total}ms`);
  dialog.classList.add('meeting-arriving');
  const paintPause = () => {
    const stopped = document.hidden || paused();
    dialog.classList.toggle('meeting-motion-paused', stopped);
    return stopped;
  };
  paintPause();
  timer = setInterval(() => {
    if (settings.quiet || reducedMotion()) { finish(); return; }
    if (paintPause()) return;
    arrival.left = Math.max(0, arrival.left - 50);
    if (!arrival.left) finish();
  }, 50);
}
