// Gaggle Scholar. A number that goes up, attached to a self-worth that does not.
import { t } from '../i18n/index.js';
import { meetContact } from './network.js';
import { venueById } from '../data/venues.js';
import { calendarOf } from '../data/calendar.js';
import { random, roll, clamp, pick } from './probability.js';
import { award, message, log, lastName, firstName } from './state.js';
import { firstNames, surnames } from '../data/names.js';
import { schools } from '../data/catalog.js';
import { paperQuality, diamonds } from './paper.js';

const FOREIGN = () => [t('the Technical University of Somewhere'), t('a national laboratory'), t('an institute you have to look up'), t('a company research arm'), t('a group in a country you have never visited'), t('a lab that is famous in exactly one subfield')];

// Why someone cited you. Quality gets you read; people get you cited.
function citationSource(s) {
  const advisorPull = s.advisor.connections / 100;
  const mine = (s.conferenceConnections || 0) / 14;
  const r = random(s);
  if (r < clamp(mine * .4, 0, .4)) return { kind: 'met', why: t('You met them at a conference. They said they would cite it. They did, which almost never happens.') };
  if (r < clamp(mine * .4 + advisorPull * .35, 0, .7)) return { kind: 'advisor', why: t('Your advisor is on their programme committee. The field is a small room with good acoustics.') };
  if (r < .9) return { kind: 'quality', why: t('They found it by reading. This is the only kind that has nothing to do with who you know.') };
  return { kind: 'wrong', why: t('They cite it for something it does not say. You read their sentence four times. You let it go.') };
}

// The email that makes an entire Tuesday better.
export function citationMail(s, project, n) {
  const who = `${pick(s, firstNames)} ${pick(s, surnames)}`;
  const where = roll(s, .5) ? pick(s, schools).name : pick(s, FOREIGN());
  const src = citationSource(s);
  s.flags.citedBy = who;
  message(s, t('Gaggle Scholar Alerts'), t('New citation to your article'), t('{who} at {where} cited “{title}”.\n\n{why}\n\nYou now have {n} citation(s) to this article. You will refresh this page again this week and there will be no change and you will refresh it anyway.', { who, where: t(where), title: project.title, why: src.why, n }), 'scholar', 'inbox', 'citation');
  return src;
}

// Accepted work accrues citations; preprints accrue a trickle. Called once a month.
export function accrueCitations(s) {
  s.citations = s.citations || {};
  for (const p of s.projects) {
    const accepted = p.status === 'Accepted';
    if (!accepted && !p.preprint) continue;
    const since = s.month - (accepted ? (p.submissionHistory.at(-1)?.month ?? s.month) : p.startedMonth);
    if (since < 1) continue;
    const v = accepted ? venueById[p.venueId] : null;
    const tierPull = v ? { 1: .85, 2: .5, 3: .25 }[v.tier] || .4 : .18;
    const q = diamonds(p);
    // A hump: nobody cites you for a year, then a few people do, then it tapers.
    const curve = since < 4 ? .25 : since < 10 ? 1 : since < 26 ? .8 : .45;
    const expected = tierPull * curve * (.4 + q * .17) * (1 + p.hype / 400);
    let n = Math.floor(expected);
    if (roll(s, expected - n)) n++;
    if (n) {
      const first = !Object.values(s.citations).some(v => v > 0);
      if (first) award(s, 'cited');
      s.citations[p.id] = (s.citations[p.id] || 0) + n;
      if (first || roll(s, .32)) citationMail(s, p, s.citations[p.id]);
      // Occasionally the citation comes with a person attached, which is the actually valuable half.
      if (roll(s, .14)) {
        const who = meetContact(s, { kind: roll(s, .4) ? 'prof' : roll(s, .5) ? 'postdoc' : 'student', where: 'citation' });
        if (who) {
          message(s, who.kind === 'prof' ? t('Prof. {n}', { n: lastName(who.name) }) : who.name, t('We cited your paper'),
            t('Hi — we have been building on your {title} in a project here at {org}, and I wanted to say so rather than just put it in the bibliography. If you are ever up for a call about where you are taking it next, I would be glad to.', { title: p.title, org: who.org }),
            'dashboard', 'inbox', null);
          log(s, t('Somebody who cited you introduced themselves. That happens perhaps four times in a degree and it is worth more than the citation.'));
        }
      }
    }
    else if (!(p.id in s.citations)) s.citations[p.id] = 0;
  }
  // Promises made at a coffee break, arriving on the schedule of academic publishing.
  const due = (s.pendingCites || []).filter(x => x.due <= s.month);
  if (due.length) {
    s.pendingCites = (s.pendingCites || []).filter(x => x.due > s.month);
    for (const x of due) {
      const p = s.projects.find(y => y.id === x.projectId);
      if (!p || !x.n) continue;
      s.citations[p.id] = (s.citations[p.id] || 0) + x.n;
      citationMail(s, p, s.citations[p.id]);
      log(s, t('{n} of the people you met at the conference actually cited it. That is a better hit rate than the field average.', { n: x.n }));
    }
  }
  // The one that got away: a paper someone cites for the wrong reason.
  if (s.projects.some(p => p.status === 'Accepted') && roll(s, .02)) {
    const cited = s.projects.filter(p => p.status === 'Accepted' || p.preprint);
    const p = cited[Math.floor(random(s) * cited.length)];
    if (p) { s.citations[p.id] = (s.citations[p.id] || 0) + 2 + Math.floor(random(s) * 4); s.flags.citedOddly = true; }
  }
}

export const citationCounts = s => s.projects
  .filter(p => p.status === 'Accepted' || p.preprint)
  .map(p => ({ id: p.id, title: p.title, n: s.citations?.[p.id] || 0, venue: venueById[p.venueId]?.name || t('preprint'), year: calendarOf(p.submissionHistory.at(-1)?.month ?? p.startedMonth).year, diamonds: diamonds(p), status: p.status }))
  .sort((a, b) => b.n - a.n);

export function hIndex(counts) {
  const sorted = [...counts].sort((a, b) => b - a);
  let h = 0;
  for (let i = 0; i < sorted.length; i++) if (sorted[i] >= i + 1) h = i + 1;
  return h;
}
export const i10 = counts => counts.filter(n => n >= 10).length;

export function myProfile(s) {
  const papers = citationCounts(s);
  const counts = papers.map(p => p.n);
  const total = counts.reduce((a, b) => a + b, 0);
  const byYear = {};
  for (const p of papers) byYear[p.year] = (byYear[p.year] || 0) + p.n;
  return { name: s.player.name, papers, total, h: hIndex(counts), i10: i10(counts), byYear, affiliation: s.program?.name || '' };
}

// Everyone else's numbers, generated once and then grown, so the leaderboard is stable.
function seedProfile(s, key, { base, growth, papers }) {
  s.scholar = s.scholar || {};
  if (!s.scholar[key]) s.scholar[key] = { total: base, papers, born: s.month };
  return s.scholar[key];
}
export function otherProfiles(s) {
  const a = s.advisor;
  const out = [];
  if (a) {
    const base = Math.round((a.prestige * 140 + a.connections * 60) * (1 + a.ambition / 200));
    const prof = seedProfile(s, `adv:${a.id}`, { base, growth: a.ambition, papers: Math.round(30 + a.prestige * 1.8) });
    const grown = prof.total + Math.round((s.month - prof.born) * (a.ambition / 5 + 6));
    out.push({ key: `adv:${a.id}`, name: t('Prof. {name}', { name: a.name }), role: t('your advisor'), total: grown, h: Math.round(Math.sqrt(grown) * .78), papers: prof.papers, kind: 'advisor' });
  }
  for (const l of s.labmates) {
    const years = { senior: 5, postdoc: 7, peer: 2, phantom: 4 }[l.role] || 3;
    const prof = seedProfile(s, `lab:${l.id}`, { base: Math.round(years * (l.role === 'postdoc' ? 46 : 17) + l.bond), papers: Math.max(1, Math.round(years * (l.role === 'postdoc' ? 1.6 : .7))) });
    const grown = prof.total + Math.round((s.month - prof.born) * (l.role === 'postdoc' ? 2.4 : 1.1));
    out.push({ key: `lab:${l.id}`, name: l.name, role: t(l.role), total: grown, h: Math.round(Math.sqrt(grown) * .72), papers: prof.papers, kind: 'labmate' });
  }
  for (const p of s.peers) {
    const boost = p.fate === 'thrive' ? 2.1 : p.fate === 'leave' ? .5 : 1;
    const prof = seedProfile(s, `peer:${p.id}`, { base: Math.round(28 * boost + p.bond), papers: Math.max(1, Math.round(2 * boost)) });
    const grown = prof.total + Math.round((s.month - prof.born) * 1.3 * boost);
    out.push({ key: `peer:${p.id}`, name: p.name, role: t('cohort'), total: grown, h: Math.round(Math.sqrt(grown) * .7), papers: prof.papers, kind: 'peer' });
  }
  return out;
}

// The line you tell yourself while looking at someone else's page.
export function comparison(s) {
  const me = myProfile(s);
  const others = otherProfiles(s).filter(o => o.kind !== 'advisor');
  const ahead = others.filter(o => o.total > me.total).length;
  if (!me.papers.length) return t('You have no indexed work yet. The page is a mirror with nothing in it.');
  if (ahead === 0) return t('You are, on paper, ahead of everyone you know here. This will feel good for about four minutes.');
  if (ahead >= others.length) return t('Everyone you know has more citations than you. Most of them started earlier. You know this and it does not help.');
  return t('{n} of the people you know have more citations than you. You have looked at this page {k} times this month.', { n: ahead, k: 3 + (s.month % 5) });
}
