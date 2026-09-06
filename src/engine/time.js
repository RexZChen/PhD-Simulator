import { focuses, internshipFocus } from '../data/catalog.js';
import { dayBlocks } from './../data/life.js';
import { focusAvailability } from '../data/calendar.js';
import { venueById } from '../data/venues.js';
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
  return focuses.map(f => ({ ...f, disabled: availability[f.id] || null }));
}
export const focusById = (s, id) => focusOptions(s).find(f => f.id === id) || null;
