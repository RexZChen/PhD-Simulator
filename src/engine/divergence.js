// The two endings nobody plans for: the one where they end it, and the one where you do.
// Both are latent. Both are reachable from month four. Neither is a punishment.
import { t } from '../i18n/index.js';
import { random, roll, clamp, pick } from './probability.js';
import { effects, log, message, chat, finish, award, activeProject, absWeek, lastName, firstName } from './state.js';
import { pushEvent } from './events.js';
import { dateLabel } from '../data/calendar.js';

export const STANDING_WARN = 38, STANDING_WRITTEN = 28, STANDING_PROBATION = 20;

// How much patience your advisor has left. Recomputed monthly, moves slowly on purpose.
export function updateStanding(s) {
  if (s.phase !== 'playing') return;
  const rel = s.relationship, a = s.advisor;
  const prev = s.standing ?? 60;
  let d = 0;
  d += (rel.satisfaction - 50) * .09;
  d += rel.trust > 62 ? 1.2 : rel.trust < 32 ? -1.4 : 0;
  d -= rel.conflict > 55 ? 2.2 : rel.conflict > 35 ? .8 : 0;
  d -= (s.counts.deadlinesMissed - (s.tracked?.missed || 0)) * 5;
  d -= (s.counts.requestsExpired - (s.tracked?.expired || 0)) * 3.5;
  d -= (s.counts.requestsDeclined - (s.tracked?.declined || 0)) * 1.6;
  d += (s.counts.requestsDone - (s.tracked?.done || 0)) * 1.4;
  d += (s.counts.accepted - (s.tracked?.accepted || 0)) * 14;
  d -= (a.toxicity - 40) * .022;
  d += a.caring > 65 ? .6 : 0;
  d += s.meetingStats.held > (s.tracked?.held || 0) ? .8 : -.6;
  d += (prev < 50 ? 1.1 : 0); // people forgive, slowly, if nothing new happens
  s.tracked = { missed: s.counts.deadlinesMissed, expired: s.counts.requestsExpired, declined: s.counts.requestsDeclined, done: s.counts.requestsDone, accepted: s.counts.accepted, held: s.meetingStats.held };
  s.standing = clamp(prev + d);
  escalate(s, prev);
}

const WARN_LINES = () => [
  t('I want to be straight with you: I am not seeing enough. Let’s fix that before it becomes a conversation with the department.'),
  t('Can we talk tomorrow? Not about the paper. About the pace.'),
  t('I have been patient. I would like to see that patience earn something this month.'),
];

function escalate(s, prev) {
  const st = s.standing, a = s.advisor;
  if (s.month < 4 || s.milestones.graduated) return;

  // Probation clock.
  if (s.probation) {
    if (s.month >= s.probation.until) {
      if (st >= 35 || s.counts.accepted > (s.probation.acceptedAt || 0)) {
        s.probation = null; s.warnings = 1; s.standing = clamp(st + 8);
        log(s, t('The improvement plan closed without incident. Nobody says well done. The absence of a meeting is the well done.'));
        message(s, t('Graduate Studies'), t('Academic standing restored'), t('Your improvement plan has concluded and your standing is restored to good. This letter will remain in your file, where it will be read by nobody, forever.'), 'portal', 'inbox', 'policies');
        effects(s, { hope: 8, stress: -8, confidence: 5 });
      } else {
        pushEvent(s, 'dismissal');
      }
    }
    return;
  }

  if (st < STANDING_PROBATION && (s.warnings || 0) >= 2) {
    s.probation = { since: s.month, until: s.month + 4, acceptedAt: s.counts.accepted, terms: [t('A written progress report every two weeks.'), t('A submitted manuscript or a defended milestone within four months.'), t('Attendance at every group meeting, minuted.')] };
    log(s, t('You are on a formal improvement plan. Four months. Written terms. A copy in your file.'));
    message(s, t('Graduate Studies'), t('Notice: academic improvement plan'), t('Following consultation with your advisor, you are placed on a four-month improvement plan effective immediately. Terms are attached. Failure to meet them may result in withdrawal of funding and dismissal from the program. Support resources are listed on page four, in six-point type.'), 'portal', 'inbox', 'probation');
    chat(s, 'advisor', a.name, t('You saw the letter. I did not enjoy writing it. I would very much like to tear it up in four months.'));
    effects(s, { hope: -14, stress: 18, confidence: -10 });
    pushEvent(s, 'probation_talk');
    return;
  }
  if (st < STANDING_WRITTEN && (s.warnings || 0) === 1) {
    s.warnings = 2;
    log(s, t('A written warning. It is polite, and it is a document.'));
    message(s, a.name, t('Putting this in writing'), t('I have raised these concerns verbally and I am now putting them in writing, which the department requires and which I dislike. The specific issues are: pace, follow-through, and communication. I am not writing to end anything. I am writing so that neither of us can later say we did not know.'), 'chat', 'inbox', 'writtenWarning');
    effects(s, { hope: -10, stress: 14, confidence: -8, satisfaction: -4 });
    pushEvent(s, 'written_warning');
    return;
  }
  if (st < STANDING_WARN && !(s.warnings || 0)) {
    s.warnings = 1;
    chat(s, 'advisor', a.name, pick(s, WARN_LINES()));
    log(s, t('{name} has started using the word “concerns.”', { name: lastName(a.name) }));
    effects(s, { stress: 9, hope: -5 });
    pushEvent(s, 'first_warning');
  }
}

// ── Quitting ──────────────────────────────────────────────────────────────────
// Pressure is a reading, never a verdict. The player always chooses.
export function updateQuitPressure(s) {
  if (s.phase !== 'playing') return;
  const st = s.player.stats, hid = s.player.hidden;
  let p = 0;
  p += st.hope < 25 ? 26 : st.hope < 40 ? 14 : st.hope > 65 ? -12 : 0;
  p += st.health < 35 ? 18 : st.health < 50 ? 8 : 0;
  p += (hid.loneliness || 0) > 70 ? 14 : (hid.loneliness || 0) > 55 ? 7 : 0;
  p += hid.stress > 75 ? 12 : 0;
  p += (s.debt || 0) > 20000 ? 30 : (s.debt || 0) > 6000 ? 12 : (s.debt || 0) > 2500 ? 5 : 0;
  p += s.relationship.conflict > 60 ? 10 : 0;
  p += s.burnoutMonths > 0 ? 8 : 0;
  p += s.probation ? 12 : 0;
  p -= s.counts.accepted * 7;
  p -= s.milestones.prelim === 'pass' ? 6 : 0;
  p -= s.milestones.proposal === 'pass' ? 8 : 0;
  p -= s.flags.partner ? 5 : 0;
  p -= s.flags.therapy ? 4 : 0;
  const target = clamp(p, 0, 100);
  s.quitPressure = clamp((s.quitPressure || 0) * .68 + target * .32);
  if ((s.debt || 0) > 22000 && !s.flags.consideringLeaving) { s.flags.consideringLeaving = true; pushEvent(s, 'the_decision'); return; }
  if (s.quitPressure > 55 && !s.flags.consideringLeaving && s.month >= 6 && roll(s, .35)) pushEvent(s, 'considering_leaving');
  else if (s.quitPressure > 78 && s.flags.consideringLeaving && roll(s, .3)) pushEvent(s, 'the_decision');
}
export const quitBand = s => (s.quitPressure || 0) > 75 ? 'critical' : (s.quitPressure || 0) > 55 ? 'high' : (s.quitPressure || 0) > 35 ? 'some' : 'low';

// ── The two endings ───────────────────────────────────────────────────────────
export function fired(s) {
  const years = Math.max(1, Math.round(s.month / 12));
  finish(s, 'fired', t('Removed From the Program'),
    t('The letter is two paragraphs and uses the word “unfortunately” once. Your funding ends at the term. You are given a key deadline for vacating the desk and a list of resources.\n\nHere is what the letter does not say. You spent {years} year(s) learning to read a paper properly, to build a thing that did not exist, to sit with a problem past the point where it is fun. Nobody can take that back out of you. The people in this field who will matter to your life are not the ones who signed this.\n\nSome of the best researchers you will meet were removed from a program once. Many of them will not tell you. This is not the end of the work. It is the end of this arrangement.', { years }));
  award(s, 'removed');
}
export function quit(s, how) {
  const years = Math.max(1, Math.round(s.month / 12));
  const texts = {
    walk: t('You write four sentences and send them before you can revise them into a hedge. The reply comes in an hour and it is kinder than you expected.\n\nYou leave with {years} year(s) of knowing how to find out whether something is true. That is not a consolation prize; it is the actual skill, and most of the world does not have it. You will use it on Monday, at something else.\n\nA PhD is not a test of whether you are clever enough. It is a test of whether you want this specific life for six years. Wanting a different one is an answer, not a failure.', { years }),
    health: t('The doctor said one sentence and you finally heard it. You take the leave, and then the leave becomes a decision.\n\nThere is a version of this where you stayed and finished and it cost you something you could not get back. You will never know if that was the real one. What you know is that you chose the body you have to live in for the next fifty years over a document.\n\nYou were not weak. You were paying attention.', { years }),
    money: t('The arithmetic stopped working. Not dramatically — nobody threw you out. The card balance just quietly became larger than the point.\n\nYou take the job. The first paycheque clears and you sit in your car for a while. Six months later you are reading papers again, on the train, for no reason, because it turns out you like this and only hated being broke.\n\nThe research was never the problem.', { years }),
  };
  finish(s, 'quit', t('You Chose to Leave'), texts[how] || texts.walk);
  award(s, 'chosen_exit');
}
