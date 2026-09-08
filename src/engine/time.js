import { focuses, internshipFocus } from '../data/catalog.js';
import { dayBlocks } from './../data/life.js';
import { focusAvailability } from '../data/calendar.js';
import { venueById } from '../data/venues.js';
import { t } from '../i18n/index.js';
import { TOTAL_MONTHS } from './state.js';

export const sprintSets = {
  deadline: [
    { id: 'experiments', name: 'Run experiments', icon: 'research', desc: 'Fill the tables. Something will break.', effects: { energy: -4, stress: 3, evidence: 8, progress: 6 }, skill: 'research', personality: 'grinder' },
    { id: 'writing', name: 'Write and revise', icon: 'paper', desc: 'Big typing budget. The intro rewrites itself, badly.', effects: { energy: -4, stress: 3, draft: 22, writingQuality: 2 }, skill: 'writing', personality: 'perfectionist' },
    { id: 'polish', name: 'Figures, tables, related work', icon: 'book', desc: 'Make it look like the results were planned.', effects: { energy: -3, stress: 2, writingQuality: 5, reproducibility: 4, draft: 10 }, skill: 'writing', personality: 'perfectionist' },
    { id: 'feedback', name: 'Get feedback', icon: 'chat', desc: 'Labmates and advisor read it. Bring snacks.', effects: { energy: -2, stress: 1, writingQuality: 3, draft: 5, trust: 2 }, skill: 'communication', personality: 'networker' },
    { id: 'coordinate', name: 'Wrangle coauthors', icon: 'people', desc: 'Merge sections, resolve comments, apologize.', effects: { energy: -2, stress: -1, scope: -3, draft: 7 }, skill: 'communication', personality: 'peoplePleaser' },
    { id: 'sleep', name: 'Sleep and eat', icon: 'moon', desc: 'A radical strategy. Advisor may notice.', effects: { energy: 14, stress: -8, satisfaction: -2 }, personality: 'boundarySetter' },
  ],
  rebuttal: [
    { id: 'writing', name: 'Draft the rebuttal', icon: 'paper', desc: 'Answer three reviewers in 5,000 characters.', effects: { energy: -5, stress: 3, writingQuality: 2 }, skill: 'writing' },
    { id: 'experiments', name: 'Run the extra experiment', icon: 'research', desc: 'The one Reviewer 2 wants. It might help.', effects: { energy: -6, stress: 3, evidence: 5 }, skill: 'research', personality: 'grinder' },
    { id: 'feedback', name: 'Ask the lab to read it', icon: 'chat', desc: 'A second opinion on your opinion.', effects: { energy: -3, writingQuality: 3, trust: 1 }, skill: 'communication' },
    { id: 'sleep', name: 'Sleep. Reviews cannot be un-read.', icon: 'moon', desc: 'Recovery.', effects: { energy: 12, stress: -8 }, personality: 'boundarySetter' },
  ],
  prelim: [
    { id: 'practice', name: 'Practice the talk', icon: 'people', desc: 'Out loud. To a wall, then to people.', effects: { energy: -5, stress: 2, readiness: 8, confidence: 2 }, skill: 'communication', personality: 'perfectionist' },
    { id: 'slides', name: 'Fix the slides', icon: 'paper', desc: 'Fewer words. Bigger fonts. One joke, maximum.', effects: { energy: -4, readiness: 5, writingQuality: 1 }, skill: 'writing' },
    { id: 'reading', name: 'Review the fundamentals', icon: 'book', desc: 'The committee will ask the basics. They always do.', effects: { energy: -5, coursework: 5, readiness: 3 }, skill: 'math' },
    { id: 'committee', name: 'Meet committee members', icon: 'chat', desc: 'Learn what each of them cares about.', effects: { energy: -4, readiness: 4, academicCapital: 2 }, skill: 'networking', personality: 'networker' },
    { id: 'sleep', name: 'Sleep', icon: 'moon', desc: 'You know the material. Let it settle.', effects: { energy: 12, stress: -8, confidence: 2 }, personality: 'boundarySetter' },
  ],
};

// The next academic milestone, if any: { kind, month }.
export function milestoneOf(s) {
  const m = s.milestones;
  if (!m) return s.month <= 23 ? { kind: 'prelim', month: 23 } : null;
  if (!m.prelim || m.prelim === 'retake') return { kind: 'prelim', month: m.prelimMonth };
  if (!m.proposal || m.proposal === 'conditional' || m.proposal === 'retake') return { kind: 'proposal', month: m.proposalMonth };
  if (m.defenseMonth !== null && m.defenseMonth !== undefined && !m.defense) return { kind: 'defense', month: m.defenseMonth };
  return null;
}
export function crunchOf(s) {
  if (s.phase !== 'playing') return null;
  const ms = milestoneOf(s);
  if (ms && ms.month === s.month) return { type: ms.kind === 'defense' ? 'defense' : 'prelim', kind: ms.kind, venueName: null };
  for (const p of s.projects) {
    if (p.status === 'Rebuttal' && p.timeline && p.timeline.rebuttal === s.month) return { type: 'rebuttal', project: p, venueName: p.targetVenue || venueById[p.venueId]?.name || null };
  }
  for (const p of s.projects) {
    if (p.targetMonth === s.month && !['Submitted', 'Rebuttal', 'Accepted', 'Abandoned'].includes(p.status)) return { type: 'deadline', project: p, venue: venueById[p.targetVenueId], venueName: p.targetVenue || null };
  }
  if (s.flags.zoomMonth === s.month) return { type: 'zoom', project: null, venue: null, venueName: null };
  return null;
}
// Seasons: three calm months at once, once the prelim is behind you.
export function seasonEligible(s) {
  if (s.phase !== 'playing' || s.month < 24 || s.week !== 0 || s.pace === 'month' || crunchOf(s)) return false;
  if (s.month + 3 > TOTAL_MONTHS - 1) return false;
  const horizon = s.month + 3;
  const ms = milestoneOf(s);
  if (ms && ms.month < horizon) return false;
  if (s.internship && s.internship.start < horizon && s.internship.end >= s.month) return false;
  if (s.thesis && !s.thesis.deposited) return false;          // a deposit deadline is not a calm season
  if (s.grad && s.grad.asked && !s.grad.settled) return false; // nor is an unsettled finishing date
  for (const p of s.projects) {
    if (p.targetMonth !== null && p.targetMonth !== undefined && p.targetMonth < horizon && !['Submitted', 'Rebuttal', 'Accepted', 'Abandoned'].includes(p.status)) return false;
    if (p.status === 'Advisor Review') return false;
    if (p.status === 'Rebuttal') return false;
    if (p.status === 'Submitted' && p.timeline) { for (const k of ['phaseOne', 'rebuttal', 'decision', 'conference']) if (p.timeline[k] !== null && p.timeline[k] !== undefined && p.timeline[k] >= s.month && p.timeline[k] < horizon) return false; }
    if (p.status === 'Accepted' && p.timeline?.conference !== null && p.timeline?.conference >= s.month && p.timeline?.conference < horizon) return false;
  }
  return true;
}
export const DAYS_PER_WEEK = 5;
// Day pace: the last week before a deadline runs one day at a time, and the player can
// drop into it manually during any crunch week.
export function dayEligible(s) {
  const c = s.crunch || crunchOf(s);
  if (!c) return false;
  if (s.dayOff === s.month) return false;
  if (c.type === 'deadline' || c.type === 'rebuttal') return s.week >= 3 || s.dayMode === s.month;
  return s.dayMode === s.month;
}
export const tempoOf = s => crunchOf(s) ? (dayEligible(s) ? 'day' : 'week') : seasonEligible(s) ? 'season' : 'month';
// Serializable snapshot of the crunch for the current turn.
export const crunchSnapshot = s => { const c = crunchOf(s); return c ? { type: c.type, kind: c.kind || null, venueName: c.venueName || null, projectId: c.project?.id || null, venueId: c.venue?.id || null } : null; };

export function focusOptions(s) {
  if (s.tempo === 'day') return dayBlocks.map(b => ({ ...b, desc: b.blurb, effects: { energy: b.energy, ...b.effects } }));
  if (s.internship && s.month >= s.internship.start && s.month <= s.internship.end) return [{ ...internshipFocus, locked: true }];
  const crunch = s.crunch || null;
  if (crunch) return sprintSets[crunch.type === 'defense' ? 'prelim' : crunch.type === 'zoom' ? 'deadline' : crunch.type].map(f => ({ ...f }));
  const availability = focusAvailability(s.month);
  // Research and Write need something to work on. An Accepted paper stays in s.projects forever,
  // so once the first one landed these two stayed enabled, still advertising "▲ Progress +++",
  // and silently produced nothing — for as long as the player failed to guess that the fix was to
  // start another project. Measured at 44% of a naive player's turns.
  const editable = (s.projects || []).some(p => !['Accepted', 'Abandoned'].includes(p.status));
  const noProject = editable ? null : t('No project you can work on. Start one in the Projects box.');
  return focuses.map(f => ({ ...f, disabled: availability[f.id] || (['research', 'write'].includes(f.id) ? noProject : null) }));
}
export const focusById = (s, id) => focusOptions(s).find(f => f.id === id) || null;

// ── One pace control ─────────────────────────────────────────────────────────────────────────
// The three tempo switches lived in three different places with three different conditions, and
// `zoom` (week) disappeared at month 24 exactly as `pace` (season) appeared, so the controls
// swapped position halfway through the run. A player cannot build a mental model out of that.
//
// This is the single source of truth: the four speeds, whether each is available right now, and —
// when it is not — the reason, in a sentence, rather than the control simply not being there.
export const PACES = ['season', 'month', 'week', 'day'];

export function paceOptions(s) {
  const c = crunchOf(s);
  const forced = c && c.type !== 'zoom';
  const tempo = s.tempo || tempoOf(s);
  const why = {
    season: s.month < 24 ? 'Seasons open once the prelim is behind you.'
      : forced ? 'Not while there is a deadline this month.'
      : s.week !== 0 ? 'Only at the start of a month.'
      : !seasonEligible(s) ? 'Something on the calendar needs this month one at a time.' : null,
    month: forced ? 'A deadline this month takes it week by week.' : null,
    week: forced || s.week === 0 ? null : 'The month is already under way.',
    day: !c ? 'Day pace is for deadline weeks.'
      : s.dayOff === s.month ? 'You stepped back out of day pace this month.'
      : (c.type === 'deadline' || c.type === 'rebuttal') && s.week < 3 ? 'The last week of a deadline month.'
      : null,
  };
  return PACES.map(id => ({ id, active: tempo === id, disabled: why[id] || null }));
}

// Move to a pace. Returns the note to log, or throws with the reason it is not available.
export function setPace(s, id) {
  const opt = paceOptions(s).find(o => o.id === id);
  if (!opt) throw new Error('That is not a pace.');
  if (opt.disabled) throw new Error(opt.disabled);
  if (opt.active) return null;
  const c = crunchOf(s);
  // Clear whatever the old pace was holding on to, then set the new one.
  if (id !== 'day') s.dayOff = c ? s.month : s.dayOff;
  if (id === 'season') { s.pace = 'auto'; s.flags.zoomMonth = -1; }
  if (id === 'month') { s.pace = 'month'; s.flags.zoomMonth = -1; s.dayOff = s.month; }
  if (id === 'week') { s.pace = 'month'; s.flags.zoomMonth = s.month; s.dayOff = s.month; }
  if (id === 'day') { s.dayOff = -1; s.dayMode = s.month; }
  return { season: 'Letting calm seasons pass in one step.', month: 'Taking it month by month.', week: 'Taking this month week by week.', day: 'Day by day: five working days, and every hour visible.' }[id];
}

// Whether the afternoon is available. After the prelim, before the proposal, and only once.
// Deliberately not exposed anywhere that lists "things you could do this month".
export const canDecideThesis = s => s.phase === 'playing' && !s.thesisIdea
  && s.milestones?.prelim === 'pass' && s.milestones?.proposal !== 'pass'
  && s.month >= 24 && s.month <= 52;

// The middle: after the prelim is passed, before the proposal is. The stretch with no external
// structure — year one has coursework and a cohort, year six has a deadline and a market, and
// years three and four have a project, an advisor, and a very long corridor. The UI stops naming
// an end date in here, because nobody names one in life either.
export const inTheMiddle = s => s.phase === 'playing'
  && s.milestones?.prelim === 'pass' && s.milestones?.proposal !== 'pass'
  && !s.thesis && !s.milestones?.thesisStarted;

// When the dissertation can start.
//
// This was a fixed calendar month, and it was fixed at two different values: the engine refused
// before month 44 and the button was disabled until 54, so ten months of the engine's rule were
// unreachable and nobody could tell. It is anchored to the proposal now instead of to the
// calendar, which is both how it works and the thing that makes deciding early worth anything —
// an early proposal is only an early finish if you are allowed to start writing.
// The floor is 46 — September of year four — not 40. Measured at 40: runs that had decided early
// started a dissertation in month 42 on one accepted paper, defended it thin, and finished the
// year on a revisions list they could not clear. Defending is not finishing, and starting is not
// either. An early proposal still buys six months against the old fixed month 54; it does not buy
// permission to write a dissertation you do not have yet.
export const thesisFloor = s => Math.max(46, (s.milestones?.proposalMonth ?? 44) + 8);
export const canStartThesis = s => s.milestones?.proposal === 'pass'
  && !s.milestones?.thesisStarted && s.month >= thesisFloor(s);
