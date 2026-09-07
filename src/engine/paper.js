import { venues, venueById, nextDeadline, acceptsThisMonth, timelineFor, topicFit, venuesForTopic } from '../data/venues.js';
import { t } from '../i18n/index.js';
import { BENCH_ENERGY, benchGrades } from '../data/bench.js';
import { acceptMail, acceptChat, restMonths, restNote } from '../data/sisyphus.js';
import { CLUSTER_ENERGY, clusterGrades } from '../data/cluster.js';
import { rebuttals, topics } from '../data/catalog.js';
import { monthOf, dateLabel } from '../data/calendar.js';
import { random, roll, clamp, pick } from './probability.js';
import { effects, log, message, chat, award, activeProject, absWeek, lastName, editable, joined, fill } from './state.js';
import { pushEvent, hooks } from './events.js';

const TITLES = {
  ml: ['Small Models, Unreasonably Large Claims', 'Attention Is Not All We Had', 'Scaling Laws for Diminishing Returns', 'Emergent Behavior in a Model We Do Not Understand'],
  nlp: ['Large Language Models Are Few-Shot Excuses', 'A Benchmark of Benchmarks', 'Tokenization Considered Harmful, Again', 'Prompting Our Way Out of Evaluation'],
  systems: ['Eventually Consistent, Occasionally Correct', 'A Distributed System With One Node', 'Zero-Copy, Some Regrets', 'Tail Latency and Other Personal Problems'],
  theory: ['Towards a Bound on Our Expectations', 'A Nearly Tight Analysis of a Loose Idea', 'On the Hardness of Finishing', 'Optimal Algorithms for a Problem We Invented'],
  hci: ['A User Study of People Who Read the Instructions', 'Designing for Users Who Will Not Use It', 'Twelve Participants and a Dream', 'Interfaces for the Chronically Interrupted'],
  robotics: ['Sim-to-Real and Back Again', 'Grasping at Straws: A Manipulation Benchmark', 'The Robot Worked Once', 'Learning to Walk Before the Deadline'],
};
const SIDE_TITLES = ['A Small Note on a Large Problem', 'Preliminary Results, Permanent Caveats', 'What We Found While Looking for Something Else', 'A Negative Result, Positively Framed'];

export function projectTitle(s, topic, kind) { return pick(s, kind === 'side' ? SIDE_TITLES : TITLES[topic] || TITLES.ml); }

export function createProject(s, { kind = 'main', collaborator = null, topic = null } = {}) {
  const projectTopic = topic || s.player.profile.topic;
  const p = {
    id: `project-${s.projects.length + 1}`, kind, title: projectTitle(s, projectTopic, kind), topic: projectTopic,
    novelty: kind === 'side' ? 50 : 45, technicalDepth: Math.round((s.player.skills.coding + s.player.skills.math) / 2), evidence: 20, writingQuality: 30, hype: 10, reproducibility: 45, topicFit: 60,
    progress: kind === 'side' ? 15 : 0, draft: 0, scope: kind === 'side' ? 20 : 35, status: 'Idea',
    collaborators: [s.advisor.name].concat(collaborator ? [collaborator] : []), originatingAdvisor: kind === 'main' ? s.advisor.id : null,
    submissionHistory: [], reviewDueWeek: null, reviewCycle: 0, reviewers: [], wizardStep: 0, venueId: null, targetVenueId: null, targetMonth: null, targetVenue: null,
    timeline: null, phaseOneDone: false, preprint: false, startedMonth: s.month, rebuttalDone: false, approvedWithout: false,
  };
  s.projects.push(p);
  s.activeProjectId = p.id;
  log(s, kind === 'side' ? t('Started a side project: “{title}.” Nobody approved this, which is the point.', { title: p.title }) : t('Started a project: “{title}.” It fits on one slide, for now.', { title: p.title }));
  return p;
}
export function createThesis(s) {
  const accepted = s.projects.filter(p => p.status === 'Accepted');
  const strong = s.projects.filter(p => p.status !== 'Accepted' && p.kind !== 'thesis' && p.progress >= 70);
  const p = {
    id: 'thesis', kind: 'thesis', title: `Towards ${TITLES[s.player.profile.topic][0].split(',')[0]}: A Dissertation`, topic: s.player.profile.topic,
    novelty: 55, technicalDepth: Math.round((s.player.skills.coding + s.player.skills.math) / 2), evidence: clamp(30 + accepted.length * 20), writingQuality: 40, hype: 10, reproducibility: 50, topicFit: 70,
    progress: clamp(20 + accepted.length * 25 + strong.length * 10), draft: clamp(accepted.length * 12), scope: 30, status: 'Drafting',
    collaborators: [s.advisor.name], originatingAdvisor: s.advisor.id, submissionHistory: [], reviewDueWeek: null, reviewCycle: 0, reviewers: [], wizardStep: 0, venueId: null, targetVenueId: null, targetMonth: null, targetVenue: null,
    timeline: null, phaseOneDone: false, preprint: false, startedMonth: s.month, rebuttalDone: false, approvedWithout: false,
  };
  s.projects.push(p); s.activeProjectId = p.id; s.milestones.thesisStarted = true; s.flags.thesisStarted = true;
  log(s, t('Started the dissertation. {n} chapter(s) already exist as papers; the introduction does not.', { n: accepted.length }));
  return p;
}
// The day after the deadline you start the next paper, precisely because the last one is out of
// your hands for three months. Blocking on Submitted and Rebuttal deleted the single most
// characteristic rhythm of CS publishing and capped the degree at a median of one accepted paper,
// against a real four to six. Rejected still blocks: deciding what a rejected paper becomes before
// starting something else is true, and it is a real decision.
export const canStartMain = s => !s.projects.some(p => p.kind === 'main' && !['Accepted', 'Abandoned', 'Submitted', 'Rebuttal'].includes(p.status)) && !s.projects.some(p => p.kind === 'thesis');
export const canStartSide = s => s.month >= 4 && !s.projects.some(p => p.kind === 'side' && !['Accepted', 'Abandoned'].includes(p.status)) && s.projects.some(p => p.kind === 'main' && p.progress >= 40);

export const paperQuality = p => p.novelty * .18 + p.technicalDepth * .15 + p.evidence * .29 + p.writingQuality * .23 + p.reproducibility * .15;
// The absolute quality of the thing itself, 1–5, independent of what any venue decides.
// It shifts the odds. It does not decide them. That is the whole joke and the whole point.
export const diamonds = p => { const q = paperQuality(p); return q >= 78 ? 5 : q >= 64 ? 4 : q >= 50 ? 3 : q >= 35 ? 2 : 1; };
export const diamondBar = n => '◆'.repeat(n) + '◇'.repeat(5 - n);
export const diamondWord = n => [t('Thin'), t('Honest work'), t('Solid'), t('Good'), t('Genuinely good')][n - 1];
export function syncProject(s) {
  for (const p of s.projects) {
    if (['Advisor Review', 'Ready', 'Submitted', 'Rebuttal', 'Accepted', 'Rejected', 'Abandoned'].includes(p.status)) continue;
    if (p.kind === 'thesis') { p.progress = Math.max(p.progress, p.draft); p.status = 'Drafting'; continue; }
    // A real draft means you are drafting, whatever the research bar says. Checking progress
    // first left a trap at progress 40-44 with a finished draft: both send-to-advisor bars met,
    // status 'Prototype', and the button refusing with a reason that was not the real one.
    p.status = p.draft >= 15 ? 'Drafting'
      : p.progress < 20 ? 'Idea'
        : p.progress < 45 ? 'Prototype'
          : 'Experiments';
  }
}


// A session at the bench. Timing is the skill and the outcome is real work, or real time lost.
// The night the job died. Evidence and reproducibility, because that is what debugging actually
// produces, and a real energy cost, because it is four in the morning.
export function clusterSession(s, result = { solved: 0, stages: 4, misses: 0, secondsLeft: 0 }) {
  const p = activeProject(s);
  if (!p) throw new Error(t('There is no project to work on.'));
  const { solved = 0, stages = 4, misses = 0 } = result;
  const evidence = solved * 6 - misses;
  const progress = solved * 4 - misses;
  p.progress = clamp(p.progress + progress);
  p.evidence = clamp((p.evidence || 0) + evidence);
  p.reproducibility = clamp((p.reproducibility || 0) + solved * 3);
  effects(s, {
    energy: -CLUSTER_ENERGY - misses,
    stress: 6 - solved,
    coding: solved,
    confidence: solved - misses,
  });
  s.lastOutputMonth = s.month;
  s.actions.cluster = true;
  const grade = solved >= stages ? 'great' : solved >= stages - 1 ? 'good' : solved >= 1 ? 'ok' : 'rough';
  log(s, joined(t(clusterGrades[grade]), ' ', t('Progress {p}, evidence {e}.', { p: progress >= 0 ? `+${progress}` : String(progress), e: evidence >= 0 ? `+${evidence}` : String(evidence) })));
  if (solved >= stages) award(s, 'fourinthemorning');
  if (misses === 0 && solved >= 1) award(s, 'notthelastline');
  return { grade, progress, evidence };
}

export function benchSession(s, tally = { crit: 0, hit: 0, miss: 0 }) {
  const p = activeProject(s);
  if (!p) throw new Error(t('There is no project to work on.'));
  const { crit = 0, hit = 0, miss = 0 } = tally;
  const progress = crit * 9 + hit * 5 - miss * 2;
  const evidence = crit * 4 + hit * 2 - miss;
  p.progress = clamp(p.progress + progress);
  p.evidence = clamp((p.evidence || 0) + evidence);
  effects(s, {
    energy: -BENCH_ENERGY - miss * 2,
    hope: crit * 2 - miss,
    confidence: crit * 2 - miss,
    stress: miss * 2 - crit,
  });
  s.lastOutputMonth = s.month;
  s.actions.bench = true;
  const score = crit * 2 + hit;
  const grade = score >= 8 ? 'great' : score >= 5 ? 'good' : score >= 3 ? 'ok' : 'rough';
  log(s, joined(t(benchGrades[grade]), ' ', t('Progress {p}, evidence {e}.', { p: progress >= 0 ? `+${progress}` : String(progress), e: evidence >= 0 ? `+${evidence}` : String(evidence) })));
  if (crit >= 4) award(s, 'cleanrun');
  return { grade, progress, evidence };
}

export function writeBudget(s) {
  if (s.tempo === 'week') return s.focus === 'writing' ? 25 : 8;
  return s.focus === 'write' ? 50 : 20;
}
export function write(s, amount = 5) {
  const p = activeProject(s);
  if (!p || !['Experiments', 'Drafting', 'Prototype'].includes(p.status) || (p.kind !== 'thesis' && p.progress < 35)) throw new Error(t('Build the project to 35% before drafting.'));
  const available = writeBudget(s) - (s.typed || 0);
  if (available <= 0 || p.draft >= 100) throw new Error(t('This turn’s writing session is complete.'));
  const n = Math.min(amount, available, 100 - p.draft);
  p.draft += n; s.typed = (s.typed || 0) + n;
  p.status = 'Drafting';
}

// Target a deadline. mode: true (nearest reasonable), 'top' (tier-1 nearest), 'soon' (nearest of any tier), or a venue id.
export function setTarget(s, p, mode = true) {
  if (!p || ['Submitted', 'Rebuttal', 'Accepted', 'Abandoned'].includes(p.status)) return null;
  const from = s.month + (s.week >= 2 ? 1 : 0);
  let candidates = venuesForTopic(p.topic).filter(v => !v.rolling);
  if (typeof mode === 'string' && venueById[mode]) candidates = [venueById[mode]];
  else if (mode === 'top') candidates = candidates.filter(v => v.tier === 1);
  const ranked = candidates.map(v => ({ v, at: nextDeadline(v, from, monthOf) })).filter(x => x.at < 24).sort((a, b) => a.at - b.at || a.v.tier - b.v.tier);
  const choice = (mode === true ? ranked.filter(x => x.v.tier <= 2 && x.at - s.month <= 5)[0] : ranked[0]) || ranked[0];
  if (!choice) return null;
  p.targetVenueId = choice.v.id; p.targetMonth = choice.at; p.targetVenue = choice.v.name;
  log(s, t('Target: {venue}, {month}. {when}', { venue: choice.v.name, month: dateLabel(choice.at), when: choice.at === s.month ? t('That is this month.') : t('{n} month(s) away.', { n: choice.at - s.month }) }));
  return choice;
}
export function clearTarget(s, p) { p.targetVenueId = null; p.targetMonth = null; p.targetVenue = null; }

export function sendAdvisor(s, latencyWeeks) {
  s.lastOutputMonth = s.month;
  const p = activeProject(s);
  if (p?.kind === 'thesis') { if (p.draft < 90 || p.status !== 'Drafting') throw new Error(t('The dissertation needs a 90% draft before the committee reads it.')); }
  else if (!p) throw new Error(t('There is no project to send.'));
  else if (['Advisor Review', 'Ready', 'Submitted', 'Rebuttal', 'Accepted', 'Abandoned'].includes(p.status))
    throw new Error(t('That draft is already with someone. Its status is “{status}”.', { status: t(p.status) }));
  else if (p.draft < 60 || p.progress < 40)
    throw new Error(t('Reach 40% research and 60% draft progress first. You are at {r}% and {d}%.', { r: Math.round(p.progress), d: Math.round(p.draft) }));
  p.status = 'Advisor Review'; p.reviewCycle++;
  p.reviewDueWeek = absWeek(s) + latencyWeeks;
  log(s, t('Sent the draft to {advisor}. Estimated reply: {n} week(s). Estimates are a genre.', { advisor: lastName(s.advisor.name), n: latencyWeeks }));
  chat(s, 'advisor', s.player.name, t('Draft attached. Comments welcome (a normal amount).'), { mine: true });
}
export function skipApproval(s) {
  const p = activeProject(s);
  if (!p || p.status !== 'Advisor Review') throw new Error(t('There is no pending advisor review.'));
  p.status = 'Ready'; p.reviewDueWeek = null; p.approvedWithout = true;
  const quiet = ['checkedOut', 'traveling'].includes(s.advisorMode?.id);
  effects(s, quiet ? { satisfaction: -2, stress: 4 } : { satisfaction: -9, trust: -4, stress: 6 });
  log(s, quiet ? t('Proceeding without the advisor’s read. They are unreachable; this is technically their fault.') : t('Proceeding without the advisor’s final read. They will find out at the conference.'));
}

export function acceptanceChance(p, venue, reviewers, bonus = 0) {
  const score = reviewers.length ? reviewers.reduce((a, r) => a + r.score, 0) / reviewers.length : paperQuality(p) / 10;
  // Quality is a thumb on the scale, not a verdict: a five-diamond paper is far from certain
  // and a two-diamond paper is far from doomed. The floor and ceiling are deliberate.
  return clamp(venue.baseline + (paperQuality(p) - 50) * .0045 + (score - 5) * .055 + topicFit(venue, p.topic) + bonus
    - (Math.max(0, p.hype - venue.hypeTolerance) * .003) + (p.approvedWithout ? -.03 : 0) + (p.preprint ? .01 : 0), .08, .86);
}
export function canSubmitNow(s, venue) {
  if (!venue) return false;
  if (acceptsThisMonth(venue, s.month, monthOf)) return true;
  return s.flags.extensionFor === venue.id && s.flags.extensionMonth === s.month;
}
export function submit(s) {
  s.lastOutputMonth = s.month;
  const p = activeProject(s), venue = venueById[p?.venueId];
  if (!p || p.status !== 'Ready' || p.wizardStep !== 4 || !venue) throw new Error(t('Complete all four submission checks first.'));
  if (!canSubmitNow(s, venue)) throw new Error(t('{venue} is not accepting submissions this month. Next deadline: {month}.', { venue: venue.name, month: dateLabel(nextDeadline(venue, s.month, monthOf)) }));
  p.status = 'Submitted'; p.reviewers = []; p.wizardStep = 0; p.rebuttalDone = false; p.phaseOneDone = false;
  p.timeline = timelineFor(venue, s.month, monthOf);
  p.submissionHistory.push({ venueId: venue.id, venue: venue.name, month: s.month, date: dateLabel(s.month), outcome: 'Under review', reviewers: [], quality: paperQuality(p), diamonds: diamonds(p) });
  if (p.targetVenueId) { s.counts.deadlinesMade++; if (s.report?.before && p.draft >= 100 && (s.report.before.projects?.[p.id]?.draft ?? 100) < 100) award(s, 'deadlineGoblin'); }
  clearTarget(s, p);
  if (p.kind === 'side') award(s, 'sideQuest');
  effects(s, { energy: -4, stress: 6, pressure: -20, satisfaction: 6 });
  s.scheduled.push({ id: 'week_after', week: absWeek(s) + 1 });
  log(s, t('Submitted “{title}” to {venue}. Decision expected {month}.', { title: p.title, venue: venue.name, month: dateLabel(p.timeline.decision) }));
  message(s, 'OpenRegret', t('Submission received: {venue}', { venue: venue.name }), t('Your manuscript has entered the system. {rebuttal}Decisions are expected in {month}. The system makes no promises.', { rebuttal: p.timeline.rebuttal !== null ? t('Reviews and a rebuttal window are expected in {month}. ', { month: dateLabel(p.timeline.rebuttal) }) : '', month: dateLabel(p.timeline.decision) }), 'browser');
  chat(s, 'advisor', s.advisor.name, pick(s, [t('Submitted. Good. Now: what is next?'), t('It’s in. Take a day. One.'), t('Nice. Let’s not talk about it until the reviews.')]));
}
export function preprint(s) {
  const p = activeProject(s);
  if (!p || p.preprint) throw new Error(t('This project already has a preprint.'));
  if (!['Ready', 'Submitted', 'Advisor Review', 'Drafting'].includes(p.status) || p.draft < 85) throw new Error(t('A preprint needs a draft at 85% or more.'));
  p.preprint = true; s.counts.preprints++; s.flags.preprinted = true;
  effects(s, { academicCapital: 3, hype: 4, confidence: 3, energy: -2 });
  award(s, 'preprint');
  log(s, t('Posted “{title}” to arXive. It has a timestamp now, which is the only thing that cannot be scooped.', { title: p.title }));
}

function reject(s, p, reason) {
  p.status = 'Rejected'; p.timeline = null; p.reviewDueWeek = null;
  s.flags.recentReject = true;
  p.submissionHistory.at(-1).outcome = reason;
  s.counts.rejected++;
  effects(s, { hope: -8 - (s.player.stats.hope < 30 ? 4 : 0), confidence: -6, stress: 9, satisfaction: -3 });
  s.player.personality.cynic++;
  const dq = diamonds(p);
  log(s, t('{venue}: {reason}. The project still exists. So do you.', { venue: p.submissionHistory.at(-1).venue, reason: t(reason) }));
  if (dq >= 4) log(s, t('For the record: this was a {bar} paper. It was rejected anyway. That is the machine, not you.', { bar: diamondBar(dq) }));
  message(s, 'OpenRegret', `${t(reason)}: ${p.submissionHistory.at(-1).venue}`, t('We received many excellent submissions. Yours can be revised, reframed, expanded, or sent elsewhere. It cannot be un-read.'), 'browser', 'inbox', 'decisionReject');
  if (['checkedOut', 'traveling'].includes(s.advisorMode?.id)) return;
  chat(s, 'advisor', s.advisor.name, pick(s, s.advisor.caring > 60 ? [t('Reviewers. Let’s talk about where next. This is normal.'), t('Disappointing, not surprising. Two of these reviews are wrong; fix the third.')] : [t('I told you it needed the other baseline.'), t('Let’s discuss. Bring a plan.')]));
}
// The reviews.
//
// The text used to be drawn from the reviewer's disposition and the score from a quality model,
// with nothing joining them, so a reviewer could hand you a 7 and write "the authors should
// consider whether this is a paper". A person who did this for a living spotted it in one run.
// The most reliable fact about a review is that you can predict the number from the first
// sentence, and decoupling them destroys the dread and the joke at the same time. So the band
// comes first and the disposition only chooses the flavour inside it.
const REVIEW_TEXT = {
  warm: {
    empirical: ['The empirical results are convincing. I would like one more seed and I am aware that is a lot to ask in the rebuttal period.', 'Table 2 is doing a lot of lifting and, unusually, it can take the weight.'],
    theory: ['The construction in Section 3 is clean and I checked it. Theorem 2 is the paper.', 'The bound is tighter than I expected and the proof is shorter than it needs to be, which I mean as a compliment.'],
    repro: ['The code runs. I ran it. This should not be remarkable and it is.', 'Reproduced Table 4 on the first attempt. Raising my score for that alone, which tells you something about this field.'],
    mild: ['A real contribution, clearly written. My concerns are all presentational.', 'I enjoyed reading this, which I do not write often. Accept.', 'Incremental but honest, and honest is rarer. Weak accept.'],
  },
  borderline: {
    empirical: ['The empirical results are interesting; the baselines need work.', 'More seeds, more datasets, more everything.', 'The gains are within noise on two of the four benchmarks and the text does not say so.'],
    theory: ['The theoretical novelty is not yet clear.', 'Theorem 1 appears to be a restatement of the assumption.', 'What is the bound in the general case?'],
    repro: ['I could not reproduce Table 4.', 'Hyperparameters appear to have been chosen by vibes.', 'The appendix promises a release "upon publication", which is a promise about a different paper.'],
    mild: ['A promising contribution, with room for clearer framing.', 'Well written. I have concerns I cannot articulate, so I will lower the score instead.', 'Good work. The related work is missing my paper.', 'I am between a 5 and a 6 and I will decide during the discussion period, which is to say the area chair will decide.'],
  },
  hostile: {
    empirical: ['The authors should evaluate on the other four benchmarks, at the larger scale, with the ablation. I recognise this is roughly six months of compute.', 'Why not just use a bigger model?', 'The comparison is against a baseline the authors implemented themselves. I would want the authors’ numbers checked against the original.'],
    theory: ['I am unconvinced this problem needs to exist.', 'The assumption in Section 2 removes the difficulty, and the rest of the paper solves what is left.', 'This is a special case of a result from 2016 that is not cited.'],
    repro: ['The code link is a 404, which is itself a result.', 'Nothing here can be checked, and the authors appear comfortable with that.'],
    mild: ['The authors should consider whether this is a paper.', 'The contribution is not commensurate with the venue. I would encourage submission to a workshop.', 'I have read the rebuttal. The authors did not address my concern.'],
  },
};
const bandOf = score => (score >= 7 ? 'warm' : score >= 5 ? 'borderline' : 'hostile');

function makeReviewers(s, p) {
  const v = venueById[p.venueId];
  const noisy = s.mutators.includes('reviewers') ? 1.5 : 1;
  // Three used to be the number everywhere. The big venues now routinely assign four to six, and
  // the fourth reviewer is very often the one who decides it.
  const n = 3 + (random(s) < .55 ? 1 : 0) + (random(s) < .22 ? 1 : 0);
  return Array.from({ length: n }, (_, i) => {
    const r = { name: t('Reviewer {n}', { n: i + 1 }), theory: random(s), empirical: random(s), novelty: random(s), writing: random(s), reproducibility: random(s), familiarity: random(s), harshness: random(s) };
    const w = r.theory + r.empirical + r.novelty + r.writing + r.reproducibility;
    const weighted = (p.technicalDepth * r.theory + p.evidence * r.empirical + p.novelty * r.novelty + p.writingQuality * r.writing + p.reproducibility * r.reproducibility) / w;
    // Overclaiming costs you here, the way it costs you at a conference: `trip.js` already makes
    // every hostile question 40% worse if you hyped the talk, and the paper pipeline had `hype`
    // feeding acceptance with nothing ever coming back at you. A reviewer who is already inclined
    // to be hard reads "a general framework for" as a promise and marks against the promise.
    const overclaim = Math.max(0, p.hype - (v?.hypeTolerance ?? 45)) / 100;
    r.score = Math.round(clamp(weighted / 10 + (random(s) - .5) * 4 * noisy - (r.harshness - .5) * 3 - (r.harshness > .55 ? overclaim * 12 : 0), 1, 10));
    const band = REVIEW_TEXT[bandOf(r.score)];
    const lens = r.empirical > .65 ? 'empirical' : r.theory > .65 ? 'theory' : r.reproducibility > .6 ? 'repro' : 'mild';
    r.text = t(pick(s, band[lens] || band.mild));
    r.confidence = 3 + Math.round(random(s) * 2);
    return r;
  });
}
export function decide(s, p, bonus) {
  const v = venueById[p.venueId];
  if (!p.reviewers.length) { p.reviewers = makeReviewers(s, p); p.submissionHistory.at(-1).reviewers = structuredClone(p.reviewers); }
  if (s.flags.rebuttalBonus) { bonus += .05; s.flags.rebuttalBonus = false; }
  if (!roll(s, acceptanceChance(p, v, p.reviewers, bonus))) { reject(s, p, 'Reject'); return; }
  const distinction = random(s);
  const result = distinction > .985 ? 'Award nomination' : distinction > .94 ? 'Oral' : distinction > .8 ? 'Spotlight' : 'Accept';
  p.status = 'Accepted'; s.lastAcceptMonth = s.month; p.submissionHistory.at(-1).outcome = result;
  s.counts.accepted++;
  const capital = { 1: 22, 2: 16, 3: 8 }[v.tier] + (result === 'Accept' ? 0 : 6);
  effects(s, { academicCapital: capital, hope: 14, confidence: 12, satisfaction: 12, stress: -10, pressure: -15 });
  award(s, 'accepted');
  if (p.submissionHistory.filter(h => /Reject/.test(h.outcome)).length >= 2) award(s, 'thirdTime');
  if (s.flags.wasScooped) award(s, 'scooped');
  const aq = diamonds(p);
  log(s, t('{venue}: {result}. You read the email twice, then a third time for the word “pleased.”', { venue: v.name, result: t(result) }));
  // Congratulations, in writing, within a day. This part is unambiguously kind.
  const note = pick(s, acceptMail);
  message(s, s.advisor.name, t(note.subject), t(note.body), 'dashboard', 'inbox', null);
  chat(s, 'advisor', s.advisor.name, fill(s, t(pick(s, acceptChat))).replace('{venue}', v.name));
  // Out loud at the next group meeting, where the compliment is doing a second job on the room.
  s.flags.acceptPraise = true;
  s.lastAcceptVenue = v.name;
  // And then the question. The interval is the whole point: an Empire Builder asks within a
  // fortnight, an Academic Parent gives you two months, and nobody ever names a length of rest.
  const rest = restMonths(s.advisor);
  s.scheduled.push({ id: 'next_project', week: absWeek(s) + Math.max(2, rest * 4), restMonths: rest });
  log(s, t(pick(s, restNote)));
  if (aq <= 2) log(s, t('Between you and the reviewers: this was a {bar} paper. Sometimes the lottery pays out. Take it.', { bar: diamondBar(aq) }));
  message(s, 'OpenRegret', t('Decision: {result} — {venue}', { result: t(result), venue: v.name }), t('We are pleased to inform you. {conf}', { conf: p.timeline?.conference !== null && p.timeline?.conference !== undefined ? t('The conference is in {month}.', { month: dateLabel(p.timeline.conference) }) : t('Camera-ready instructions will follow, in a font of their choosing.') }), 'browser', 'inbox', 'decisionAccept');
  chat(s, 'advisor', s.advisor.name, pick(s, [t('Accepted! Congratulations. Camera-ready by Friday.'), t('Great news. Let’s aim for the next one before the conference.'), t('Well done. Now the hard part: the talk.')]));
}
export function rebut(s, id) {
  const p = activeProject(s), c = rebuttals.find(x => x.id === id);
  if (p?.status !== 'Rebuttal' || !c) throw new Error(t('No rebuttal is currently open.'));
  const st = s.player.stats, sk = s.player.skills;
  let bonus = { careful: (sk.writing + st.energy) / 1200, weakest: sk.communication / 950, experiments: .13, confident: (st.confidence - 45) / 400, panic: (random(s) - .55) * .25, advisor: (s.advisor.availability + s.relationship.trust) / 1300 - (['checkedOut', 'traveling'].includes(s.advisorMode?.id) ? .1 : 0) }[id];
  if (st.energy < c.energy) bonus -= .08;
  effects(s, { energy: -c.energy, stress: id === 'panic' ? 10 : 3 });
  if (id === 'experiments') p.evidence = clamp(p.evidence + 7);
  p.rebuttalDone = true; p.pendingBonus = bonus;
  log(s, t('Rebuttal submitted: {name}. Now the waiting, which is also a skill.', { name: c.name }));
  p.status = 'Submitted'; // back to waiting for the decision month
  p.afterRebuttal = true;
}
export function recycle(s, id) {
  const p = activeProject(s);
  if (p?.status !== 'Rejected' || !['revise', 'reframe', 'expand', 'abandon'].includes(id)) throw new Error(t('Choose a revision strategy for a rejected project.'));
  s.flags.recentReject = false; // the question has been answered; the ask goes away with it
  if (id === 'abandon') { p.status = 'Abandoned'; clearTarget(s, p); effects(s, { hope: -3, stress: -12 }); log(s, t('Abandoned the project. The lessons remain, unlike the code.')); return; }
  p.status = 'Drafting'; p.draft = id === 'expand' ? 40 : 55; p.reviewCycle = 0; p.reviewers = []; p.approvedWithout = false;
  effects(s, id === 'revise' ? { evidence: 10, reproducibility: 8, energy: -6 } : id === 'reframe' ? { hype: 8, writingQuality: 6, energy: -4 } : { novelty: 12, scope: 12, evidence: 10, energy: -10 });
  log(s, t('Reopened the paper: {how}. Its submission history stays attached, like a limp.', { how: t(id) }));
}

// Advance every paper according to the calendar. Called at the start of each turn.
export function processPapers(s) {
  const now = absWeek(s);
  for (const p of s.projects) {
    if (p.status === 'Advisor Review' && p.reviewDueWeek !== null && now >= p.reviewDueWeek) {
      const comments = Math.round(10 + (100 - s.advisor.management) * 1.5 + s.advisor.ambition * .6);
      p.writingQuality = clamp(p.writingQuality + 5 + s.advisor.management / 15);
      p.draft = clamp(p.draft - 6); p.reviewDueWeek = null;
      if (p.reviewCycle === 1 && roll(s, (s.advisor.ambition - s.advisor.management + 40) / 200)) {
        p.scope = clamp(p.scope + 10); p.status = 'Drafting'; effects(s, { energy: -6, stress: 7 });
        message(s, s.advisor.name, t('A few small comments'), t('{n} comments added. Revise to 60% draft progress and send it back. “The next pass will be quick.”', { n: comments }), 'browser', 'inbox', 'advisorComments');
        chat(s, 'advisor', s.advisor.name, pick(s, [t('Comments in the doc. Mostly small. Some structural.'), t('{n} comments. Don’t panic. (Some panic.)', { n: comments })]));
      } else {
        p.status = 'Ready';
        message(s, s.advisor.name, t('Ready when you are'), t('{n} comments, but no blockers. Pick a venue in OpenRegret and submit when the deadline is open.', { n: comments }), 'browser', 'inbox', 'advisorReady');
        chat(s, 'advisor', s.advisor.name, pick(s, [t('Looks good. Submit.'), t('Fine to submit. Fix the typos in Section 3 first (all of it).')]));
      }
      log(s, p.status === 'Ready' ? t('Advisor approved the manuscript.') : t('Advisor requested a revision. “Small,” apparently.'));
    }
    if (p.status !== 'Submitted' || !p.timeline) continue;
    const v = venueById[p.venueId];
    if (p.timeline.phaseOne !== null && !p.phaseOneDone && s.month >= p.timeline.phaseOne) {
      p.phaseOneDone = true;
      if (roll(s, .12 + (55 - paperQuality(p)) * .003 + (s.flags.marginRisk ? .05 : 0))) { reject(s, p, 'Phase-One Reject'); continue; }
    }
    if (!p.reviewers.length && s.month >= (p.timeline.rebuttal ?? p.timeline.decision) && s.week === 0 && !p.afterRebuttal) {
      if (roll(s, .04 + Math.max(0, p.hype - v.hypeTolerance) * .008 + (s.flags.marginRisk ? .04 : 0))) { reject(s, p, 'Desk Reject'); continue; }
      p.reviewers = makeReviewers(s, p);
      p.submissionHistory.at(-1).reviewers = structuredClone(p.reviewers);
      if (paperQuality(p) >= 65 && p.reviewers.some(r => r.score <= 4)) award(s, 'reviewer2');
      if (p.timeline.rebuttal !== null && s.month <= p.timeline.rebuttal) {
        p.status = 'Rebuttal';
        message(s, 'OpenRegret', t('Reviews are available: {venue}', { venue: v.name }), t('Three people have read the same paper and reached different conclusions. The rebuttal window closes at the end of the month.'), 'browser', 'inbox', 'reviewsIn');
        log(s, t('Reviews arrived: {scores}. Rebuttal window open this month.', { scores: p.reviewers.map(r => r.score).join(' / ') }));
        continue;
      }
    }
    if (s.month >= p.timeline.decision && s.week === 0) decide(s, p, p.pendingBonus || 0);
  }
  for (const p of s.projects) {
    if (p.status === 'Accepted' && p.timeline?.conference === s.month && s.week === 0 && !p.conferenceDone) { p.conferenceDone = true; s.activeProjectId = p.id; if (hooks.conference) hooks.conference(s, p); else pushEvent(s, 'conference_travel'); }
  }
}
// Rebuttal windows close at month end; if nothing was sent, the decision uses the reviews as they are.
export function closeRebuttals(s) {
  for (const p of s.projects) if (p.status === 'Rebuttal' && p.timeline && s.month > p.timeline.rebuttal) { p.status = 'Submitted'; p.afterRebuttal = true; p.pendingBonus = -.02; log(s, t('The rebuttal window closed without a response. The reviews stand, unchallenged.')); }
}
export { venues, venueById, nextDeadline, acceptsThisMonth, timelineFor, venuesForTopic };
