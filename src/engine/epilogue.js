// What you leave with, what it is worth on a market, and the twenty years after.
import { t } from '../i18n/index.js';
import { internTypes } from '../data/internships.js';
import { fundingLines, fundingScore } from './funding.js';
import { cvSections, epilogueBeats, advisorNews } from '../data/epilogue.js';
import { SECTION_MAX } from '../data/employers.js';
import { employers, employersFor, slateOdds, gateFor, drawWeather, weatherLine } from './market.js';
import { trackById, ACADEMIC } from '../data/tracks.js';
import { venueById } from '../data/venues.js';
import { random, roll, clamp, pick, shuffle } from './probability.js';
import { effects, log, message, award, lastName, firstName, fill, activeLabmates } from './state.js';
import { myProfile } from './scholar.js';
import { diamonds } from './paper.js';

// ── The CV ────────────────────────────────────────────────────────────────────
// Every line is something that happened in the run. The score is the argument the CV makes.
export function buildCV(s) {
  const accepted = s.projects.filter(p => p.status === 'Accepted');
  const prof = myProfile(s);
  const tier1 = accepted.filter(p => venueById[p.venueId]?.tier === 1).length;
  const lines = [];

  lines.push({ section: 'education', text: t('Ph.D., {school} — {year}', { school: s.program.name, year: 2028 + Math.floor(s.month / 12) }), points: 6 });
  if (s.player.profile.background === 'masters') lines.push({ section: 'education', text: t('M.S., research thesis, before all this'), points: 1 });

  for (const p of accepted) {
    const v = venueById[p.venueId];
    const outcome = p.submissionHistory.at(-1)?.outcome || 'Accept';
    lines.push({ section: 'publications', text: t('“{title}.” {venue}{extra}', { title: p.title, venue: v?.name || '', extra: outcome !== 'Accept' ? ` (${t(outcome)})` : '' }), points: (v?.tier === 1 ? 11 : v?.tier === 2 ? 7 : 3) + (outcome !== 'Accept' ? 4 : 0) });
  }
  const preprints = s.projects.filter(p => p.preprint && p.status !== 'Accepted').length;
  if (preprints) lines.push({ section: 'publications', text: t('{n} preprint(s), under review or under a rock', { n: preprints }), points: preprints * 2 });
  if (!accepted.length) lines.push({ section: 'publications', text: t('Work in progress. This section is shorter than you wanted and longer than it looks.'), points: 0 });

  lines.push({ section: 'citations', text: t('{n} citations · h-index {h}', { n: prof.total, h: prof.h }), points: clamp(Math.round(prof.total / 9) + prof.h * 2, 0, 24) });
  if (s.conferenceConnections) lines.push({ section: 'talks', text: t('{n} conference presentation(s), {c} of them in cities you actually saw', { n: accepted.length, c: (s.citiesVisited || []).length }), points: Math.min(10, (s.citiesVisited || []).length * 2 + accepted.length * 2) });
  if (s.meetingStats.presented) lines.push({ section: 'talks', text: t('{n} group-meeting presentations, several of them under duress', { n: s.meetingStats.presented }), points: Math.min(5, Math.round(s.meetingStats.presented / 2)) });
  if (s.counts.reviewed) lines.push({ section: 'talks', text: t('Reviewed for {n} venue(s). Nobody thanks you; the field runs on it.', { n: s.counts.reviewed }), points: 3 });
  const taTerms = s.counts.taSemesters || (s.ta ? 1 : 0);
  if (taTerms) lines.push({ section: 'teaching', text: t('Teaching assistant, {n} semesters. Office hours, held.', { n: taTerms }), points: Math.min(8, taTerms * 2) });
  if (s.player.skills.teaching > 55) lines.push({ section: 'teaching', text: s.player.skills.teaching > 70 ? t('Students ask for you by name at registration') : t('Guest lecture, and the students did not leave'), points: s.player.skills.teaching > 70 ? 4 : 2 });
  if (s.flags.pedagogyCert) lines.push({ section: 'teaching', text: t('Completed the teaching certificate nobody made you do'), points: 3 });
  // What the summer was worth depends entirely on who is reading the file.
  for (const h of (s.intern?.history || []).slice(0, 3)) {
    const ty = internTypes[h.typeId];
    if (!ty) continue;
    if (h.typeId === 'teaching') lines.push({ section: 'teaching', text: t('Instructor of record, one summer course. Nine students, all of whom passed.'), points: 6 });
    else if (['research', 'natlab'].includes(h.typeId)) lines.push({ section: 'awards', text: h.paper ? t('Research internship, {company} — one workshop paper out of it', { company: h.employer }) : t('Research internship, {company}', { company: h.employer }), points: h.paper ? 6 : 5 });
    else lines.push({ section: 'awards', text: t('{label}, {company}', { label: t(ty.label), company: h.employer }), points: 3 });
    if (h.returned) lines.push({ section: 'people', text: t('A return offer from {company}, held open past the point of politeness', { company: h.employer }), points: 2 });
  }
  const intern = !(s.intern?.history || []).length && (s.internship || s.lastInternship);
  if (intern) lines.push({ section: 'awards', text: t('Research internship, {company}', { company: intern.company || s.company }), points: 5 });
  // Money is its own section. On an academic search it is the line read first; in industry
  // nobody opens it. Lumping it in with awards made a grant compete with a best-paper.
  for (const f of fundingLines(s)) lines.push({ section: 'funding', ...f });
  if (s.flags.fellow && !fundingLines(s).length) lines.push({ section: 'funding', text: t('Departmental fellowship'), points: 6 });
  if (s.achievements.includes('accepted') && tier1 >= 2) lines.push({ section: 'awards', text: t('Two top-venue papers, which is the whole ballgame on this market'), points: 6 });
  if (s.flags.collabOffer) lines.push({ section: 'awards', text: t('External collaboration, begun at a coffee break'), points: 4 });

  const trust = s.relationship.trust, sat = s.relationship.satisfaction;
  const letter = trust > 68 && sat > 60 ? { text: t('A letter from {advisor} that says the specific things, not the general ones', { advisor: t('Prof. {name}', { name: lastName(s.advisor.name) }) }), points: 12 }
    : trust > 45 ? { text: t('A letter from {advisor}. Warm, accurate, and three paragraphs long.', { advisor: t('Prof. {name}', { name: lastName(s.advisor.name) }) }), points: 7 }
      : { text: t('A letter from {advisor}. It confirms the dates of your enrolment.', { advisor: t('Prof. {name}', { name: lastName(s.advisor.name) }) }), points: 2 };
  lines.push({ section: 'people', ...letter });
  if (s.committee?.length) lines.push({ section: 'people', text: t('{n} committee members who answered every email', { n: s.committee.length }), points: Math.min(4, s.committee.length) });
  if ((s.conferenceConnections || 0) >= 6) lines.push({ section: 'people', text: t('A letter from someone at another institution who has never met your advisor'), points: 3 });

  const score = clamp(lines.reduce((a, l) => a + l.points, 0), 0, 100);
  return { lines, score, sections: cvSections, axes: axesOf(lines) };
}

// The file as a reader sees it: each axis normalised to 0-100 against what buildCV can
// actually emit, so an employer's thresholds mean the same thing on every axis.
export function axesOf(lines) {
  const raw = {};
  for (const l of lines) raw[l.section] = (raw[l.section] || 0) + l.points;
  return Object.fromEntries(Object.keys(SECTION_MAX).map(k => [k, clamp(Math.round(100 * (raw[k] || 0) / SECTION_MAX[k]), 0, 100)]));
}
export const fileVector = (s, cv) => (cv || buildCV(s)).axes;

// ── The market ────────────────────────────────────────────────────────────────
function salary(s, range) {
  const [lo, hi] = range;
  return Math.round((lo + random(s) * (hi - lo)) / 1000) * 1000;
}
export function generateOffers(s, cv) {
  s.jobs = s.jobs || {};
  if (!s.jobs.weather) drawWeather(s);

  // If you actually ran a search, the ending is the search. Nothing is re-rolled at the end:
  // what you got is what you got, and the applications tab already told you.
  const landed = (s.jobs.apps || []).filter(a => a.stage === 'offer');
  if (landed.length) {
    const offers = landed.map(a => {
      const e = employers.find(x => x.id === a.employerId);
      return { kind: e.track, employerId: e.id, name: e.name, org: t(e.kind), where: t(e.where),
        salary: salary(s, e.salary), months: e.months ?? 12, equity: e.equity || 'none',
        catch: t(e.catch), hook: t(e.hook), prestige: e.prestige, permanence: e.permanence, ceiling: e.ceiling };
    }).slice(0, 4);
    s.jobs.market = offers;
    s.jobs.offers = [...new Set(offers.map(o => o.kind))];
    s.jobs.weatherLine = weatherLine(s);
    s.jobs.fromSearch = true;
    return offers;
  }
  // A search that produced nothing is not the same as never having searched. Say which.
  if ((s.jobs.apps || []).length >= 5) {
    const gap = employers.find(e => e.id === 'open_cycle');
    const offers = [{ kind: 'unplaced', employerId: gap ? gap.id : null, name: gap ? gap.name : t('nothing signed yet'),
      org: t(gap ? gap.kind : 'the cycle, still open'), where: t(gap ? gap.where : 'your apartment, your inbox'),
      salary: 0, months: 12, equity: 'none', catch: t(gap ? gap.catch : ''), hook: t(gap ? gap.hook : ''),
      prestige: 1, permanence: 0, ceiling: 5 }];
    s.jobs.market = offers;
    s.jobs.offers = ['unplaced'];
    s.jobs.weatherLine = weatherLine(s);
    s.jobs.fromSearch = true;
    return offers;
  }
  const track = s.jobs.track || (s.player.profile.ambition === 'academic' ? 'tenure_track' : 'product_eng');
  const hedge = s.jobs.hedge || null;
  // Each catalog entry stands for a class of employer, not one posting — the applicant counts
  // on the posting are the volume. One draw per class, so breadth of the board is the only
  // thing that compounds.
  const slate = employers.filter(e => !e.noSelection && (e.cap ?? 1) > 0 && !gateFor(s, e).blocked
    && (e.track === track || e.track === hedge || roll(s, .35)));   // you did not apply everywhere
  const won = [], shortlists = [];
  for (const e of slate) {
    // The committee draw: made once per employer, multiplies everything, and volume cannot
    // average it away. This is why a perfect file strikes out.
    const mood = .35 + random(s) * 1.5;
    const odds = slateOdds(s, cv, e, 1, e.track === track ? 'tailored' : 'standard');
    const p = clamp(odds.per * mood, .004, .34);
    if (roll(s, p)) won.push({ e, odds, mood });
    else if (p > .03 && roll(s, .12)) shortlists.push(e.id);
  }
  s.jobs.shortlists = shortlists;
  // Nobody juggles nine offers. Keep the best few by fit, one per off-track class.
  won.sort((a, b) => b.odds.fit - a.odds.fit);
  const kept = [];
  for (const w of won) {
    if (kept.length >= 4) break;
    if (w.e.track !== track && kept.some(k => k.e.track === w.e.track)) continue;
    kept.push(w);
  }
  const offers = kept.map(({ e }) => ({
    kind: e.track, employerId: e.id, name: e.name, org: t(e.kind), where: t(e.where),
    salary: salary(s, e.salary), months: e.months ?? 12, equity: e.equity || 'none',
    catch: t(e.catch), hook: t(e.hook), prestige: e.prestige, permanence: e.permanence, ceiling: e.ceiling,
  }));
  if (!offers.length) {
    const gap = employers.find(e => e.id === 'open_cycle');
    offers.push({ kind: 'unplaced', employerId: gap ? gap.id : null, name: gap ? gap.name : t('nothing signed yet'),
      org: t(gap ? gap.kind : 'the cycle, still open'), where: t(gap ? gap.where : 'your apartment, your inbox'),
      salary: 0, months: 12, equity: 'none', catch: t(gap ? gap.catch : ''), hook: t(gap ? gap.hook : ''),
      prestige: 1, permanence: 0, ceiling: 5 });
  }
  s.jobs.market = offers;
  s.jobs.offers = [...new Set(offers.map(o => o.kind))];
  s.jobs.weatherLine = weatherLine(s);
  return offers;
}

// ── The years after ───────────────────────────────────────────────────────────
export function startEpilogue(s, chosen) {
  const offer = (s.jobs.market || []).find(o => o.kind === chosen) || (s.jobs.market || [])[0];
  s.jobs.chosen = chosen;
  s.jobs.taken = offer || null;
  s.phase = 'epilogue';
  s.stage = 'epilogue';
  s.epilogue = { year: 0, index: 0, beats: pickBeats(s), done: [], citations: myProfile(s).total, note: null };
  log(s, offer && offer.salary ? t('You take the job at {name}. {salary} a year, which is more money than you have ever seen and less than your undergraduate roommate makes.', { name: offer.name, salary: `$${offer.salary.toLocaleString('en-US')}` })
    : t('You graduate without an offer in hand. September is further away than it sounds and closer than it feels.'));
  return s.epilogue;
}

function pickBeats(s) {
  const has = {
    abandoned: s.projects.some(p => p.status === 'Abandoned' || (p.status !== 'Accepted' && p.kind === 'side')),
    faculty: ACADEMIC.includes(s.jobs.chosen),   // 'faculty' is not a track id; the real ones are tenure_track etc.
    deferredCeremony: !!(s.thesis && s.thesis.deferred),
    // Filed and not yet decided when you left. Thirty months is longer than anybody's last two
    // years, so this is the only place the process can honestly finish.
    patentPending: !!s.patent && !['granted', 'abandoned'].includes(s.patent.stage),
  };
  const pool = epilogueBeats.filter(b => !b.needs || has[b.needs]);
  const finals = pool.filter(b => b.choices.some(c => c.final));
  const rest = shuffle(s, pool.filter(b => !b.choices.some(c => c.final)));
  // Two beats are promised rather than drawn. The hooding is the ceremony you deferred, and the
  // patent is the only way a thirty-month process that started in year three ever gets an ending.
  // Leaving either to the shuffle means a player who did the whole thing hears nothing about it.
  const hood = pool.find(b => b.id === 'hooding');
  const pat = pool.find(b => b.id === 'patent_granted');
  const promised = [hood, pat].filter(Boolean);
  const chosen = rest.filter(b => !promised.includes(b)).slice(0, 4 - promised.length).concat(promised).sort((a, b) => a.when - b.when);
  const last = pick(s, finals.length ? finals : [epilogueBeats.find(b => b.id === 'student_email')]);
  return [...chosen, last].filter(Boolean).map(b => b.id);
}

export const currentBeat = s => epilogueBeats.find(b => b.id === s.epilogue?.beats?.[s.epilogue.index]) || null;

export function beatText(s, beat) {
  const mate = activeLabmates(s)[0]?.name || t('a labmate');
  const accepted = s.projects.filter(p => p.status === 'Accepted');
  const venue = venueById[accepted.at(-1)?.venueId]?.name || t('a venue you know');
  return fill(s, t(beat.text))
    .replace('{labmate}', firstName(mate))
    .replace('{venue}', venue)
    .replace('{advisorNews}', t(pick(s, advisorNews)));
}

export function answerBeat(s, choiceId) {
  const beat = currentBeat(s);
  if (!beat) throw new Error(t('There is nothing waiting.'));
  const choice = beat.choices.find(c => c.id === choiceId);
  if (!choice) throw new Error(t('That is not one of the things you could do.'));
  const ep = s.epilogue;
  ep.done.push({ id: beat.id, year: beat.when, subject: t(beat.subject), line: fill(s, t(choice.line)) });
  if (choice.effects?.citations) ep.citations += choice.effects.citations;
  if (choice.effects?.hope) effects(s, { hope: choice.effects.hope });
  if (choice.effects?.trust) effects(s, { trust: choice.effects.trust });
  if (choice.effects?.capital) effects(s, { academicCapital: choice.effects.capital });
  ep.note = fill(s, t(choice.line));
  ep.index++;
  if (beat.id === 'hooding' && choiceId !== 'skip') award(s, 'hooded');
  if (choice.final || ep.index >= ep.beats.length) { ep.finished = true; award(s, 'lifelong'); }
  return ep.note;
}
