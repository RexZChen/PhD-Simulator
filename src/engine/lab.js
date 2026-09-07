import { labLines, roleLines, cohortLines, mailTemplates, spamSubjects, fieldNotes } from '../data/chatter.js';
import { t } from '../i18n/index.js';
import { venues, nextDeadline, fitsTopic } from '../data/venues.js';
import { monthOf, holidays, dateLabel, isTeachingTerm } from '../data/calendar.js';
import { random, roll, pick, clamp, pickFresh } from './probability.js';
import { chat, message, effects, log, fill, vars, activeLabmates } from './state.js';

// Lab and cohort chatter for a new month, plus department mail. Called at month start.

// A pool cannot outrun the pigeonhole, but it can refuse to repeat itself twice in a season.
// Keep a short memory per channel and draw from what has not been said lately.
const RECENT = 22;
function freshLine(s, channel, pool) {
  s.saidRecently = s.saidRecently || {};
  const recent = s.saidRecently[channel] || [];
  const unsaid = pool.filter(x => !recent.includes(x));
  const line = pick(s, unsaid.length ? unsaid : pool);
  s.saidRecently[channel] = [...recent, line].slice(-RECENT);
  return line;
}

export function monthlyChatter(s) {
  const active = s.labmates.filter(l => l.status === 'active');
  const count = 1 + Math.floor(random(s) * 3);
  for (let i = 0; i < count && active.length; i++) {
    const who = pick(s, active);
    // Trait and role lines stay characterful; the shared pool is what stops a six-year run
    // repeating the same nine messages.
    // Their own trait and role weigh double so they still sound like themselves, but everyone
    // can reach the whole room's worth of material rather than nine lines of it.
    const own = [...(labLines[who.trait] || []), ...(roleLines[who.role] || [])];
    const others = Object.entries(labLines).filter(([k]) => k !== 'any' && k !== who.trait).flatMap(([, v]) => v);
    const pool = [...own, ...own, ...others, ...labLines.any];
    chat(s, 'general', who.name, fill(s, freshLine(s, 'general', pool)));
  }
  if (s.peers.length && roll(s, .75)) {
    const who = pick(s, s.peers.filter(p => p.status === 'active'));
    if (who) {
      const fated = (who.fate === 'thrive' && s.month >= 3) || (who.fate === 'struggle' && s.month >= 4) || (who.fate === 'leave' && s.month >= 8);
      const pool = [...(fated ? cohortLines[who.fate] : cohortLines.generic), ...cohortLines.any];
      chat(s, 'cohort', who.name, vars(fill(s, freshLine(s, 'cohort', pool)), { company: s.company }));
    }
  }
  // Bonds decay slowly without contact; wholesome labmates hold the room together.
  for (const l of activeLabmates(s)) l.bond = clamp(l.bond - (l.trait === 'wholesome' ? 0 : 1));
  for (const p of s.peers) p.bond = clamp(p.bond - 1);
}

export function monthlyMail(s) {
  const m = monthOf(s.month);
  if (m === 9 || m === 1) {
    message(s, t('Graduate Studies'), m === 9 ? t('Welcome back: 14 updated policies') : t('Spring registration is open (and required)'), pickFresh(s, 'mail:semester', mailTemplates.semesterStart), 'portal', 'inbox', 'policies');
    message(s, t('Department Payroll'), m === 9 ? t('Appointment for the fall term') : t('Appointment for the spring term'), pickFresh(s, 'mail:payroll', s.ta ? mailTemplates.taAssignment : mailTemplates.raAssignment), 'portal', 'inbox', 'payroll');
  }
  for (const h of holidays(s.month)) if (['Thanksgiving', 'Winter break', 'Spring break'].includes(h.name) && roll(s, .8)) message(s, t('Facilities'), t('{holiday}: building hours', { holiday: h.name }), pickFresh(s, 'mail:closure', mailTemplates.closure));
  // CFP reminders two months before a relevant deadline.
  for (const v of venues) {
    if (v.rolling || !fitsTopic(v, s.player.profile.topic) || v.topics.includes('any')) continue;
    const next = nextDeadline(v, s.month, monthOf);
    if (next - s.month === 2 && roll(s, .7)) message(s, t('{venue} Program Chairs', { venue: v.name }), t('Call for papers: {venue}', { venue: v.name }), vars(pickFresh(s, 'mail:cfp', mailTemplates.cfp), { venue: v.name, deadline: dateLabel(next) }), 'browser', 'inbox', 'cfp');
  }
  if (roll(s, .2)) message(s, t('Editorial Office'), pickFresh(s, 'mail:spamsubject', spamSubjects), pickFresh(s, 'mail:spam', mailTemplates.spam), null, 'junk', 'spam');
}

export function fieldNote(s) {
  const stress = s.player.hidden.stress;
  const pool = s.tempo === 'week' ? fieldNotes.crunch : stress > 70 ? fieldNotes.frayed : stress > 45 ? fieldNotes.tense : fieldNotes.calm;
  return pick(s, pool);
}
