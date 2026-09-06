// Defending is not finishing. This is the part between.
import { t } from '../i18n/index.js';
import { revisionItems, formatFaults, postDefensePings, hooding } from '../data/thesis.js';
import { monthOf, nextIndexFor, dateLabel } from '../data/calendar.js';
import { random, roll, clamp, pick, pickWeighted, shuffle } from './probability.js';
import { effects, log, message, chat, award, lastName, vars } from './state.js';

export const COMMENCEMENT_MONTH = 5;   // May, when the robes come out

// Called the moment the committee says yes. You are Doctor; you are not done.
export function beginRevisions(s) {
  const th = s.projects.find(p => p.kind === 'thesis');
  const quality = th ? Math.round(th.draft) : 60;
  // A rough defense and a demanding committee mean a longer list.
  const n = clamp(Math.round(2 + (100 - quality) / 22 + (s.program.difficulty - 60) / 25 + (s.milestones.defenseAttempts > 1 ? 1 : 0)), 2, 5);
  const chosen = [];
  const pool = [...revisionItems];
  for (let i = 0; i < n && pool.length; i++) {
    const item = pickWeighted(s, pool, x => x.weight);
    pool.splice(pool.indexOf(item), 1);
    chosen.push({ id: item.id, label: item.label, effort: item.effort, done: 0, line: item.line });
  }
  s.thesis = {
    items: chosen,
    needed: chosen.reduce((a, x) => a + x.effort, 0),
    done: 0,
    defendedMonth: s.month,
    dueMonth: s.month + 3,
    deposited: false,
    depositMonth: null,
    formatFails: 0,
    nagged: 0,
  };
  s.milestones.defense = 'pass';
  s.milestones.graduated = false;
  log(s, t('Passed, with revisions. The committee signs the form that says you passed and hands you a second form that says what you must change first.'));
  chat(s, 'advisor', s.advisor.name, t(pick(s, postDefensePings.early)));
  message(s, t('Graduate Studies'), t('Defense result: PASS (conditional on revisions)'),
    t('Congratulations, Doctor. Your degree is conferred once the revised dissertation is deposited and passes the format review. The deposit deadline for this term is {month}. You are, until then, in a state the university has a form for and no word for.', { month: dateLabel(s.thesis.dueMonth) }),
    'portal', 'inbox', 'policies');
  return s.thesis;
}

export const revisionsLeft = s => s.thesis ? Math.max(0, s.thesis.needed - s.thesis.done) : 0;
export const canDeposit = s => !!s.thesis && !s.thesis.deposited && s.thesis.done >= s.thesis.needed;

// A session of revising. Slower when you have already mentally left.
export function revise(s, itemId) {
  const th = s.thesis;
  if (!th || th.deposited) throw new Error(t('There is nothing left to revise, which is a sentence you did not believe you would read.'));
  const item = th.items.find(x => x.id === itemId);
  if (!item) throw new Error(t('That is not on the committee’s list.'));
  if (item.done >= item.effort) throw new Error(t('That one is done. Genuinely done. Leave it.'));
  if (s.player.stats.energy < 6) throw new Error(t('Not enough Energy.'));
  const drag = s.jobs?.taken ? .7 : 1;                       // starting the job costs you here
  const gain = roll(s, clamp(.55 * drag + s.player.skills.writing / 260, .25, .95)) ? 1 : 0;
  item.done += gain || 1;                                     // it always moves; sometimes it moves worse
  th.done = th.items.reduce((a, x) => a + Math.min(x.done, x.effort), 0);
  effects(s, { energy: -6, stress: gain ? -1 : 3, hope: gain ? 1 : -1 });
  log(s, `${t(item.label)}. ${t(item.line)}`);
  if (canDeposit(s)) {
    log(s, t('Every item on the list is crossed off. There is a moment of nothing where the relief should be.'));
    chat(s, 'advisor', s.advisor.name, t('That is all of them. Deposit it. Do not read it again — you will only find things.'));
  }
  return item;
}

// The format review, which is not about the research and never was.
export function deposit(s) {
  const th = s.thesis;
  if (!th) throw new Error(t('There is no dissertation to deposit.'));
  if (th.deposited) throw new Error(t('It is deposited. It has been deposited. Stop opening the portal.'));
  if (th.done < th.needed) throw new Error(t('The committee’s list is not finished.'));
  effects(s, { energy: -5, stress: 4 });
  // The machine that checks margins does not love you, and gets a couple of goes.
  if (th.formatFails < 2 && roll(s, th.formatFails === 0 ? .62 : .35)) {
    th.formatFails++;
    const fault = pick(s, formatFaults);
    log(s, `${t('Format review: rejected.')} ${t(fault)}`);
    message(s, t('Thesis Office'), t('Format review: revisions required'),
      t('Your submission did not pass format review. {fault} Please correct and resubmit. This review concerns formatting only; the content of your dissertation is not evaluated here, and we would like to stress that we have not read it.', { fault: t(fault) }),
      'portal', 'inbox', 'policies');
    effects(s, { stress: 6, hope: -3 });
    return { ok: false, fault: t(fault) };
  }
  th.deposited = true;
  th.depositMonth = s.month;
  s.milestones.graduated = true;
  const ceremony = nextIndexFor(COMMENCEMENT_MONTH, s.month);
  th.ceremonyMonth = ceremony;
  // If you defended after the ceremony, you are a doctor for months before anyone claps.
  th.deferred = monthOf(s.month) > COMMENCEMENT_MONTH || ceremony > s.month + 1;
  award(s, 'deposited');
  if (th.formatFails === 0) award(s, 'margins');
  effects(s, { hope: 16, stress: -18, confidence: 8 });
  log(s, t('Deposited. The library has it. It is done, and the doneness takes several days to arrive.'));
  chat(s, 'advisor', s.advisor.name, t(pick(s, postDefensePings.done)));
  message(s, t('Graduate Studies'), t('Degree conferred'),
    t('Your dissertation has been accepted and your degree is conferred as of today. {ceremony} Your student email will be deactivated in ninety days. Thank you for your years with us.',
      { ceremony: th.deferred
        ? t('The hooding ceremony for your cohort takes place in {month}; you will be contacted separately about attending.', { month: dateLabel(ceremony) })
        : t('The hooding ceremony is this {month}.', { month: dateLabel(ceremony) }) }),
    'portal', 'inbox', 'degreeConferred');
  return { ok: true, deferred: th.deferred, ceremony };
}

// Monthly: the advisor chases, and the deadline does not move.
export function revisionMonth(s) {
  const th = s.thesis;
  if (!th || th.deposited) return;
  const late = s.month > th.dueMonth;
  const pool = late ? postDefensePings.late : th.nagged > 0 ? postDefensePings.chasing : postDefensePings.early;
  if (roll(s, late ? .9 : .55)) { chat(s, 'advisor', s.advisor.name, t(pick(s, pool))); th.nagged++; }
  if (late) {
    effects(s, { stress: 5, hope: -2, satisfaction: -2 });
    if (s.month === th.dueMonth + 1) message(s, t('Graduate Studies'), t('Deposit deadline passed'),
      t('Our records show your dissertation has not been deposited. Degrees are conferred at the end of each term; missing this one moves your conferral, and any employment contingent on it, by a term. Support is available and consists of this email.'),
      'portal', 'inbox', 'policies');
  }
}

// Years later, the department wants numbers for the ceremony you skipped.
export function hoodingBeat(s) {
  const th = s.thesis;
  if (!th || !th.deferred) return null;
  return {
    subject: t(hooding.subject),
    body: vars(t(hooding.body), { month: dateLabel(th.defendedMonth) }),
    choices: hooding.choices.filter(c => !c.needs || s.flags[c.needs]),
  };
}
export function resolveHooding(s, id) {
  const c = hooding.choices.find(x => x.id === id);
  if (!c) throw new Error(t('That is not one of the things you could do.'));
  const { money, trust, ...rest } = c.effects || {};
  effects(s, { ...rest, ...(trust ? { trust } : {}) });
  if (money) effects(s, { money });
  if (id !== 'skip') award(s, 'hooded');
  log(s, t(c.line));
  return t(c.line);
}
