import { labLines, roleLines, cohortLines, mailTemplates, fieldNotes } from '../data/chatter.js';
import { t } from '../i18n/index.js';
import { venues, nextDeadline, fitsTopic } from '../data/venues.js';
import { monthOf, holidays, dateLabel, isTeachingTerm } from '../data/calendar.js';
import { random, roll, pick, clamp } from './probability.js';
import { chat, message, effects, log, fill, vars } from './state.js';

// Lab and cohort chatter for a new month, plus department mail. Called at month start.
export function monthlyChatter(s) {
  const active = s.labmates.filter(l => l.status === 'active');
  const count = 1 + Math.floor(random(s) * 3);
  for (let i = 0; i < count && active.length; i++) {
    const who = pick(s, active);
    const pool = roll(s, .55) ? labLines[who.trait] : roleLines[who.role];
    chat(s, 'general', who.name, fill(s, pick(s, pool)));
  }
  if (s.peers.length && roll(s, .75)) {
    const who = pick(s, s.peers.filter(p => p.status === 'active'));
    if (who) {
      const pool = (who.fate === 'thrive' && s.month >= 3) || (who.fate === 'struggle' && s.month >= 4) || (who.fate === 'leave' && s.month >= 8) ? cohortLines[who.fate] : cohortLines.generic;
      chat(s, 'cohort', who.name, vars(fill(s, pick(s, pool)), { company: s.company }));
    }
  }
  // Bonds decay slowly without contact; wholesome labmates hold the room together.
  for (const l of s.labmates) l.bond = clamp(l.bond - (l.trait === 'wholesome' ? 0 : 1));
  for (const p of s.peers) p.bond = clamp(p.bond - 1);
}

export function monthlyMail(s) {
  const m = monthOf(s.month);
  if (m === 9 || m === 1) {
    message(s, t('Graduate Studies'), m === 9 ? t('Welcome back: 14 updated policies') : t('Spring registration is open (and required)'), pick(s, mailTemplates.semesterStart), 'portal', 'inbox', 'policies');
    message(s, t('Department Payroll'), m === 9 ? t('Appointment for the fall term') : t('Appointment for the spring term'), s.ta ? mailTemplates.taAssignment[0] : mailTemplates.raAssignment[0], 'portal', 'inbox', 'payroll');
  }
  for (const h of holidays(s.month)) if (['Thanksgiving', 'Winter break', 'Spring break'].includes(h.name) && roll(s, .8)) message(s, t('Facilities'), t('{holiday}: building hours', { holiday: h.name }), mailTemplates.closure[0]);
  // CFP reminders two months before a relevant deadline.
  for (const v of venues) {
    if (v.rolling || !fitsTopic(v, s.player.profile.topic) || v.topics.includes('any')) continue;
    const next = nextDeadline(v, s.month, monthOf);
    if (next - s.month === 2 && roll(s, .7)) message(s, t('{venue} Program Chairs', { venue: v.name }), t('Call for papers: {venue}', { venue: v.name }), vars(pick(s, mailTemplates.cfp), { venue: v.name, deadline: dateLabel(next) }), 'browser', 'inbox', 'cfp');
  }
  if (roll(s, .2)) message(s, t('Editorial Office'), t('Invitation to publish (Impact Factor: pending)'), pick(s, mailTemplates.spam), null, 'junk', 'spam');
}

export function fieldNote(s) {
  const stress = s.player.hidden.stress;
  const pool = s.tempo === 'week' ? fieldNotes.crunch : stress > 70 ? fieldNotes.frayed : stress > 45 ? fieldNotes.tense : fieldNotes.calm;
  return pick(s, pool);
}
