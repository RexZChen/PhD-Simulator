// How a file is read. One scorer, used by the market preview and by the offers screen,
// so nothing the game tells you in year five is contradicted at commencement.
import { t } from '../i18n/index.js';
import { employers, SECTION_MAX } from '../data/employers.js';
import { trackById, ACADEMIC } from '../data/tracks.js';
import { random, roll, clamp, jitter, pick } from './probability.js';

export { employers, SECTION_MAX };
export const employersFor = track => employers.filter(e => e.track === track);
export const employerById = id => employers.find(e => e.id === id) || null;

// Base rates derive from difficulty, never authored per employer, so the catalog cannot
// drift out of tune with itself.
export const BASE_BY_DIFFICULTY = {
  1: { screen: .45, invite: .62, offer: .55 },
  2: { screen: .30, invite: .50, offer: .42 },
  3: { screen: .22, invite: .42, offer: .34 },
  4: { screen: .16, invite: .36, offer: .30 },
  5: { screen: .12, invite: .32, offer: .26 },
};

// Signed, about -1.0 (far short) to +0.6 (comfortably over). Being over-qualified is capped:
// nobody gets the job twice for the same paper.
export function fitScore(axes, e) {
  const want = e.wants || {};
  let sum = 0, wsum = 0;
  for (const [d, floor] of Object.entries(want)) {
    const w = e.weights?.[d] ?? 1;
    sum += w * clamp(((axes[d] ?? 0) - floor) / 45, -1, .6);
    wsum += w;
  }
  return wsum ? sum / wsum : 0;
}

// Crossing tracks costs something, and it costs less in the direction the field pretends is down.
export function offTrackPenalty(s, e) {
  const track = s.jobs?.track;
  if (!track || e.track === track || e.track === s.jobs?.hedge) return 0;
  const from = ACADEMIC.includes(track), to = ACADEMIC.includes(e.track);
  if (from && !to) return -.05;
  if (!from && to) return -.10;
  return -.05;
}

export function boosts(s, e, effort = 'standard') {
  const skills = s.player.skills;
  const skillGap = Object.entries(e.skills || {})
    .reduce((a, [k, need]) => a + clamp(((skills[k] ?? 50) - need) / 60, -.5, .25), 0);
  const letterTier = s.relationship.trust > 68 && s.relationship.satisfaction > 60 ? 1
    : s.relationship.trust > 45 ? .5 : 0;
  const prestige = Math.max(s.program.prestige, s.advisor.prestige);
  return (((s.jobs?.packet?.quality ?? 50) - 50) / 400)
    + letterTier * .10 * (e.letterMatters ?? 1)
    + ((s.advisor.connections - 50) / 600) * (e.networkMatters ?? 1)
    + ((prestige - 78) / 700) * (e.prestigeMatters ?? 0)
    + (e.prestigeFloor && prestige < e.prestigeFloor
      ? (s.advisor.connections > 70 && s.relationship.trust > 60 ? -.04 : -.12) : 0)
    + Math.min(.05, (s.conferenceConnections || 0) * .004)
    + skillGap
    + (e.internPref && s.flags.internDone ? .07 : 0)
    + (e.topicPref?.includes(s.player.profile.topic) ? .06 : 0)
    + (e.internationalBonus && s.player.profile.international ? .06 : 0)
    + offTrackPenalty(s, e)
    + (effort === 'tailored' ? .05 : effort === 'blanket' ? -.03 : 0)
    + (s.mutators.includes('freeze') && ACADEMIC.includes(e.track) ? -.06 : 0)
    + (s.mutators.includes('boom') && ['industry_research', 'product_eng', 'founder'].includes(e.track) ? .05 : 0);
}

// A hard no is a hard no, and the posting says so before you spend anything on it.
export function gateFor(s, e) {
  if (e.gate === 'citizen' && s.player.profile.international && !s.flags.permanentResident)
    return { blocked: true, why: t('This position requires US citizenship. The posting says so in the second line.') };
  if (e.sponsors === false && s.player.profile.international && !s.flags.permanentResident)
    return { blocked: true, why: t('This employer does not sponsor work visas. The form asks; the form is the whole conversation.') };
  if (e.gate === 'teachingProof' && (s.counts.taSemesters || 0) < 2 && !s.flags.extraTA)
    return { blocked: true, why: t('They want evidence you have taught. Two semesters of it, minimum, and you have none.') };
  if (e.gate === 'topVenue' && !s.projects.some(p => p.status === 'Accepted'))
    return { blocked: true, why: t('The search asks for a publication record. You do not have one yet.') };
  return { blocked: false, why: '' };
}

// The three gates. Fit matters least at the screen — that is where 300 files are cut in an
// afternoon — and most in the room, which is where all the drama lives.
export function slateOdds(s, cv, e, n = 1, effort = 'standard', delta = 0) {
  const B = BASE_BY_DIFFICULTY[e.difficulty] || BASE_BY_DIFFICULTY[3];
  const fit = fitScore(cv.axes, e), b = boosts(s, e, effort);
  const screen = clamp(B.screen + fit * .12 + b * .5, .02, .55);
  const invite = clamp(B.invite + fit * .26 + b, .05, .80);
  const offer = clamp(B.offer + fit * .22 + b + delta, .05, .70);
  const per = clamp(screen * invite * offer * (1 + (s.jobs?.weather || 0)), .012, .28);
  return { screen, invite, offer, per, any: 1 - Math.pow(1 - per, n), fit, blocked: gateFor(s, e).blocked };
}

// How the market feels this year. One draw, printed as prose, never as a number.
export function drawWeather(s) {
  const w = jitter(s, 0, 6) / 100
    + (s.mutators.includes('freeze') ? -.06 : 0)
    + (s.mutators.includes('boom') ? .05 : 0);
  s.jobs.weather = clamp(w, -.14, .12);
  return s.jobs.weather;
}
export const weatherLine = s => {
  const w = s.jobs?.weather || 0;
  return w < -.06 ? t('Searches are down this year. Four postings you bookmarked in October were cancelled in November.')
    : w < -.02 ? t('A thinner year than last year. Everyone says so, in the way people say it when they are hoping to be contradicted.')
      : w > .06 ? t('Everyone is hiring. This will not be true in eighteen months and everyone knows it and nobody says it.')
        : w > .02 ? t('An ordinary year. The postings go up in October and the good ones close before you have finished the statement.')
          : t('A flat year. No wave to ride and none to be caught under.');
};

// Applicant counts and the things a posting will not tell you until later.
export function openBoard(s) {
  const cycle = employers.filter(e => !e.noSelection && (e.cap ?? 1) > 0);
  s.jobs.board = cycle.map(e => ({
    employerId: e.id,
    applicants: e.applicants ? e.applicants[0] + Math.floor(random(s) * (e.applicants[1] - e.applicants[0] + 1)) : 0,
    slots: e.slots ?? 1,
    internalCandidate: roll(s, .18),   // hidden until after the on-site
    cancelled: null,
  }));
  return s.jobs.board;
}
