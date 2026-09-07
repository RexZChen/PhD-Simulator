// What is still in English when you play in Chinese.
//   node scripts/i18n-audit.mjs [seeds]
// Plays real runs with the language set, records every string t() could not translate, and drops
// the ones that are already Chinese (those come from the by-id catalogs, which t() sees after the
// fact). What is left is genuinely untranslated and is printed grouped by where it came from.
//
// Playing is only half the picture. A t() literal inside src/ui runs when a component renders, and
// this script renders nothing, so no amount of simulated gameplay will ever reach it. The second
// half is therefore a static sweep: pull every single-line t('literal') out of the UI layer and
// look it up in the same flat dictionary the running game would.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { setAppLanguage } from '../src/i18n/apply.js';
import { createRun, activeProject } from '../src/engine/state.js';
import { dispatch, focusOptions } from '../src/engine/game.js';
import { schools } from '../src/data/catalog.js';
import { templateById } from '../src/engine/events.js';
import { pushbacks } from '../src/data/minigames.js';
import { questioners } from '../src/data/conference.js';
import { currentBeat } from '../src/engine/epilogue.js';
import { interviewStep } from '../src/engine/apply.js';
import { doorOptions, obstacleOf } from '../src/engine/stuck.js';
import { stuckNote } from '../src/data/stuck.js';
import { canAskTimeline } from '../src/engine/timeline.js';
import { canApplyIntern } from '../src/engine/internship.js';
import { availableWriters, letterCount } from '../src/engine/letters.js';
import { openPortals, listingsFor } from '../src/engine/jobsearch.js';
import { venuesForTopic, acceptsThisMonth } from '../src/data/venues.js';
import { monthOf } from '../src/data/calendar.js';
import { zh } from '../src/i18n/zh/index.js';
import { t } from '../src/i18n/index.js';

globalThis.__I18N_MISS = new Set();
setAppLanguage('zh');

const ROOT = new URL('..', import.meta.url).pathname;
const resolveAll = s => { let n = 0; while (s.event && n++ < 40) { const e = templateById[s.event]; const ok = e.choices.find(c => !c.ending && !c.minigame && !(c.requiresCoursework && s.coursework < c.requiresCoursework)) || e.choices[0]; s = dispatch(s, { type: 'CHOICE', id: ok.id }); if (s.stage === 'minigame') s = dispatch(s, { type: 'LECTURE', worked: 9, attention: 5, caught: 1 }); } return s; };
const act = (s, a) => resolveAll(dispatch(s, a));
const try_ = (s, a) => { try { return act(s, a); } catch { return s; } };   // energy, cooldowns, "not yet"
function advance(s) {
  if (s.stage === 'crisis') return dispatch(s, { type: 'CRISIS', id: 'treat' });
  if (s.stage === 'summons') return dispatch(s, { type: 'SUMMONS', id: ['go', 'late', 'decline'][s.month % 3] });
  // The exam tally the UI actually hands over: how many questions landed, how many you conceded,
  // how many caught you out, the composure meter, and the talk that happened before any of it.
  // Dispatching the pre-rewrite { right, hedged, wrong } scored every exam as an empty room, so
  // none of the exam prose — which branches on all of these — was ever reached.
  if (s.stage === 'minigame' && s.minigame === 'viva') return dispatch(s, { type: 'VIVA', tally: { land: 4, concede: 2, caught: 1, silent: 0, composure: 71, talk: { covered: 5, skipped: 1, wasted: 1, how: 'clean', trapSeen: true }, badCop: 'handled', stillness: 'chair' } });
  if (s.stage === 'pushback') return dispatch(s, { type: 'PUSHBACK', id: pushbacks.find(x => x.id === s.pushback.id).options[0].id });
  if (s.stage === 'minigame') return dispatch(s, { type: s.minigame === 'bench' ? 'BENCH' : 'LECTURE', worked: 9, attention: 5, caught: 1, tally: { crit: 2, hit: 2, miss: 1 } });
  if (s.stage === 'trip') {
    if (s.trip.phase === 'visa') return dispatch(s, { type: 'TRIP_VISA', id: 'normal' });
    if (s.trip.caughtScene) return dispatch(s, { type: 'TRIP_CAUGHT', id: 'honest' });
    if (s.trip.day === s.trip.talkDay && !s.trip.talkDone) return dispatch(s, { type: 'TRIP_TALK', tally: { hits: 4, hype: 1, misses: 1 } });
    if (s.trip.qa && !s.trip.qaDone) return dispatch(s, { type: 'TRIP_QA', id: questioners.find(x => x.id === s.trip.qa[s.trip.qaIndex]).best });
    return dispatch(s, { type: 'TRIP_DAY', id: ['sessions', 'coffee', 'posters', 'explore'][s.trip.day % 4] });
  }
  if (s.stage === 'commencement') return dispatch(s, { type: 'TAKE_OFFER', id: s.jobs.market[0].kind });
  if (s.stage === 'epilogue') { const b = currentBeat(s); return dispatch(s, { type: 'EPILOGUE', id: b ? b.choices[0].id : 'ok' }); }
  return s;
}

// Where the run is, precisely enough that "nothing moved" means nothing moved. The old detector
// keyed on stage:month:week, which reads as frozen for two stages that legitimately advance on
// their own clock: a conference walks days inside one week, and the epilogue walks beats inside
// no month at all. That aborted every epilogue after its first beat of five, and cut a conference
// short the moment the player was caught at a museum, because being caught adds a scene without
// spending a day. So the key carries the sub-clocks too, and, as a backstop for whatever sub-clock
// is invented next, the length of the history log: a turn that produced a line did something.
const progress = s => [s.stage, s.phase, s.month, s.week, s.dayIndex, s.event, s.minigame,
  s.epilogue?.index, s.trip?.phase, s.trip?.day, s.trip?.qaIndex, s.trip?.caughtScene?.id,
  s.trip?.activities?.length, s.history?.length, s.inbox?.length].join('|');

// ── The played half ───────────────────────────────────────────────────────────
function playSeed(seed) {
  const row = { seed, plan: 0, month: 0, enrolled: false, ending: null, stopped: null, died: null };
  let s;
  try {
    s = createRun(seed, { background: ['masters', 'undergrad', 'industry', 'theory'][seed % 4], topic: ['ml', 'nlp', 'systems', 'theory', 'hci', 'robotics'][seed % 6], international: seed % 3 === 0 });
    s = act(s, { type: 'PREP', id: 'sop_draft' });
    s = act(s, { type: 'PREP', id: 'letter_ask', target: 'rec-0' });
    s = act(s, { type: 'PREP', id: 'proceed' });
    for (const sc of schools.slice(6, 22)) {
      if (s.player.stats.energy < 3 || s.player.stats.money < 75) break;
      try { s = act(s, { type: 'APPLY', schoolId: sc.id, effort: 'generic', contact: seed % 2 === 0, poiId: s.advisors.find(a => a.schoolId === sc.id).id }); } catch { break; }
    }
    s = act(s, { type: 'ADMISSIONS' });
    for (const app of s.applications.filter(a => a.interview)) {
      for (let n = 0; n < 12; n++) {
        const cur = s.applications.find(a => a.schoolId === app.schoolId && a.interview && !a.interview.done);
        const q = cur && interviewStep(cur);
        if (!q) break;
        s = act(s, { type: 'INTERVIEW', schoolId: app.schoolId, id: q.options[n % q.options.length].id });
      }
    }
    s = act(s, { type: 'DECISIONS' });
    if (!s.offers.length && s.applications.some(a => a.waitlisted)) s = act(s, { type: 'WAIT_APRIL' });
    if (!s.offers.length) { row.stopped = 'no offer'; return row; }
    s = act(s, { type: 'ENROLL', id: s.advisors.find(a => a.schoolId === s.offers[0]).id });
    row.enrolled = true;
    let guard = 0;
    while (['playing', 'epilogue'].includes(s.phase) && guard++ < 1400) {
      const before = progress(s);
      if (s.stage === 'plan') {
        row.plan++; row.month = Math.max(row.month, s.month);
        for (const r of s.requests.filter(r => r.status === 'open')) s = try_(s, { type: 'REQUEST_DO', id: r.id });
        // The stuck door and its obstacle prose. Read the labels every turn; only knock when there
        // is energy to spare, because knocking on all four doors every week is how this harness
        // used to put its player in hospital in year four.
        const ob = obstacleOf(s); t(ob.label); t(ob.hint); t(stuckNote);
        for (const d of doorOptions(s)) {
          t(d.label); t(d.hint);
          if (d.blocked || s.stage !== 'plan' || s.player.stats.energy < 30) continue;
          s = try_(s, { type: 'STUCK_ASK', id: d.id });
        }
        // Year four: the timeline conversation, which is the only thing that makes year six a
        // decision instead of a drift into ABD.
        if (canAskTimeline(s) && !s.milestones.graduated && s.stage === 'plan') {
          s = try_(s, { type: 'ASK_TIMELINE' });
          if (s.grad && !s.grad.settled) {
            for (const mv of ['evidence', 'date', 'committee']) { if (s.grad.settled) break; s = try_(s, { type: 'TIMELINE_MOVE', id: mv }); }
            if (!s.grad.settled && (s.grad.rounds || 0) >= 3) s = try_(s, { type: 'TIMELINE_MOVE', id: 'accept' });
          }
        }
        // Defending is not finishing. Working the committee's list and depositing is what turns
        // stage 'plan' into stage 'commencement', which is where the endgame prose lives.
        if (s.thesis && !s.thesis.deposited) {
          for (let i = 0; i < 6; i++) { const next = s.thesis.items.find(x => x.done < x.effort); if (!next || s.player.stats.energy < 8) break; s = try_(s, { type: 'REVISE', id: next.id }); }
          for (let i = 0; i < 3 && s.stage === 'plan'; i++) s = try_(s, { type: 'DEPOSIT' });
        }
        // The job search and the letters: a year of prose that only opens after month 42.
        if (s.month >= 42 && !s.milestones.graduated && s.stage === 'plan') {
          for (const pid of openPortals(s)) {
            if ((s.jobs?.apps?.length || 0) >= 18 || s.player.stats.energy < 8) break;
            for (const e of listingsFor(s, pid).filter(x => !x.gate.blocked && !x.sponsorBlocked).sort((a, b) => a.difficulty - b.difficulty).slice(0, 4)) {
              if ((s.jobs?.apps?.length || 0) >= 18 || s.player.stats.energy < 8) break;
              s = try_(s, { type: 'JOB_APPLY', id: e.id, effort: 'tailored' });
            }
          }
          if ((s.jobs?.apps?.length || 0) >= 3 && !s.jobs.secret.disclosed && !s.jobs.secret.discovered) s = try_(s, { type: 'JOB_DISCLOSE' });
          while (letterCount(s) < 5 && s.stage === 'plan' && s.player.stats.energy > 20) {
            const w = availableWriters(s)[0];
            if (!w) break;
            const n = letterCount(s);
            s = try_(s, { type: 'ASK_LETTER', id: w.id });
            if (letterCount(s) === n) break;
          }
        }
        if (canApplyIntern(s) && s.stage === 'plan') s = try_(s, { type: 'INTERN_APPLY' });
        if (s.intern?.offers?.length && !s.intern.talk && s.stage === 'plan') s = try_(s, { type: 'INTERN_TALK', id: s.intern.offers[0].id });
        if (s.intern?.talk && !s.intern.talk.settled && s.stage === 'plan') {
          for (const mv of ['ask_labmate', 'plan', 'connection', 'money']) { if (s.intern.talk.settled) break; s = try_(s, { type: 'INTERN_MOVE', id: mv }); }
          if (!s.intern.talk.settled) s = try_(s, { type: 'INTERN_MOVE', id: 'go' });
        }
        // Keeping the player alive is a coverage concern: a run that ends in hospital in year four
        // audits nothing after year four.
        if (s.player.stats.health < 55 && s.conditions?.length && s.player.stats.money > 900) s = try_(s, { type: 'CLINIC', id: 'primary' });
        if (s.tempo === 'day' && s.player.stats.energy < 45) s = try_(s, { type: 'COFFEE' });
        if (s.stage !== 'plan') { s = resolveAll(advance(s)); continue; }
        if (!s.focus) {
          const opts = focusOptions(s).filter(f => !f.disabled);
          const p = activeProject(s);
          let want = 'research';
          if (s.player.stats.energy < 30) want = 'rest';
          else if (s.player.stats.health < 45) want = 'life';
          else if (s.month < 10 && s.coursework < 55) want = 'coursework';
          else if (p && p.progress >= 40 && p.draft < 100) want = 'write';
          else if (s.crunch) want = p && p.draft < 90 ? 'writing' : 'experiments';
          const o = opts.find(f => f.id === want) || opts[0];
          if (o) s = try_(s, { type: 'PLAN', id: o.id });
        }
        // The paper pipeline, in the order the game expects it: draft, target, advisor, submit,
        // then whatever the reviewers did to you.
        if (!s.projects.length) s = try_(s, { type: 'START_PROJECT' });
        for (let i = 0; i < 12 && s.stage === 'plan'; i++) { const p = activeProject(s); if (!p || !['Drafting', 'Experiments', 'Prototype'].includes(p.status) || p.progress < 35) break; const d = p.draft; s = try_(s, { type: 'WRITE', amount: 5 }); if (activeProject(s)?.draft === d) break; }
        { const p = activeProject(s);
          if (p && !p.targetVenueId && p.progress >= 45 && p.status !== 'Accepted') s = try_(s, { type: 'SET_TARGET', id: 'neuripsy' });
          if (p && p.status === 'Rejected') s = try_(s, { type: 'RECYCLE', id: 'revise' });
          if (p && p.status === 'Rebuttal') s = try_(s, { type: 'REBUT', id: 'careful' });
          if (p && p.status === 'Drafting' && p.draft >= 60 && p.progress >= 40) s = try_(s, { type: 'SEND_ADVISOR' }); }
        { const p = activeProject(s);
          if (p && p.status === 'Ready' && p.kind !== 'thesis' && s.stage === 'plan') {
            const open = venuesForTopic(p.topic).filter(v => acceptsThisMonth(v, s.month, monthOf));
            if (open.length) { for (let i = 0; i < 5; i++) { const before = s.wizard?.step; s = try_(s, { type: 'WIZARD', venueId: open[0].id }); if (s.wizard?.step === before) break; } s = try_(s, { type: 'SUBMIT' }); }
          } }
        if (s.milestones.proposal === 'pass' && !s.milestones.thesisStarted && s.month >= 54) s = try_(s, { type: 'START_THESIS' });
        { const th = s.projects.find(p => p.kind === 'thesis');
          if (th && th.status === 'Drafting' && th.draft >= 90) { s = try_(s, { type: 'SELECT_PROJECT', id: th.id }); s = try_(s, { type: 'SEND_ADVISOR' }); }
          if (th && th.status === 'Ready' && s.milestones.defenseMonth == null) s = try_(s, { type: 'SCHEDULE_DEFENSE' }); }
        if (s.stage === 'plan') { try { s = act(s, { type: 'CONTINUE' }); } catch { row.stopped = 'CONTINUE refused'; break; } }
      }
      if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' });
      if (s.stage === 'milestone') s = act(s, { type: 'MILESTONE', id: 'balanced' });
      s = resolveAll(advance(s));
      if (before === progress(s) && !['plan', 'report', 'milestone'].includes(s.stage)) { row.stopped = `stalled at ${s.stage}`; break; }
    }
    if (guard >= 1400) row.stopped = 'ran out of guard';
    row.ending = s.ending?.id || null;
    row.month = Math.max(row.month, s.month);
  } catch (e) { row.died = `@ ${s?.phase}/${s?.stage} m${s?.month}: ${e && e.message}`; }
  return row;
}

// ── The rendered half ─────────────────────────────────────────────────────────
// Single-line, non-interpolated t('...') / t("...") only, which is the overwhelming majority and
// is enough to be useful. `t(` must not be the tail of an identifier or a property access, or the
// sweep starts reporting the arguments of split() and parseInt(); template literals are skipped
// entirely because a ${} in the source is never a dictionary key.
const T_CALL = /(?<![\w.$])t\(\s*(['"])((?:\\.|(?!\1)[^\\\n])*)\1\s*(?:\)|,)/g;
const unescape_ = x => x.replace(/\\(['"\\nt])/g, (m, c) => ({ n: '\n', t: '\t' }[c] ?? c));
function jsFiles(dir) { const out = []; for (const e of readdirSync(dir)) { const p = join(dir, e); if (statSync(p).isDirectory()) out.push(...jsFiles(p)); else if (p.endsWith('.js')) out.push(p); } return out; }
function scanUi() {
  const found = new Set(), missing = new Map();
  for (const f of jsFiles(join(ROOT, 'src/ui'))) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(T_CALL)) {
      const lit = unescape_(m[2]);
      if (!lit.trim() || cjk.test(lit) || PUNCT.test(lit)) continue;
      found.add(lit);
      if (Object.prototype.hasOwnProperty.call(zh.ui, lit)) continue;
      const line = src.slice(0, m.index).split('\n').length;
      if (!missing.has(lit)) missing.set(lit, `${relative(ROOT, f)}:${line}`);
    }
  }
  return { total: found.size, missing };
}

const cjk = /[\u3400-\u9fff\uf900-\ufaff]/;
const PUNCT = /^[\s\d.,:%$+\-—·|/()]*$/;
// The school names are the joke and misc.js translates only their taglines, on purpose. They reach
// t() anyway — a job offer's name is an institution's name — so exempt them by identity rather than
// leaving thirty-two puns sitting in a list of things somebody is supposed to translate.
const PROPER = new Set(schools.map(x => x.name));

const SEEDS = Number(process.argv[2] || 12);
// Coverage, printed every time. This harness once threw on the first varied interview, took every
// seed with it, and went on reporting a confident zero for a year of gameplay prose it never
// reached. A zero that comes from not looking is worse than a number. Later it enrolled ten seeds
// and graduated none of them, and reported that as a zero too — so the floor below is per seed,
// and the distribution is printed, because a sum lets one deep run stand in for eleven dead ones.
const rows = [];
for (let seed = 1; seed <= SEEDS; seed++) rows.push(playSeed(seed));

const misses = [...globalThis.__I18N_MISS].filter(x => x && x.trim() && !cjk.test(x) && !PUNCT.test(x) && !PROPER.has(x));
const ui = scanUi();

const enrolled = rows.filter(r => r.enrolled).length;
const finished = rows.filter(r => r.ending).length;
const graduated = rows.filter(r => r.ending?.startsWith('phd_')).length;
const deep = rows.filter(r => r.month >= 40).length;
const early = rows.filter(r => r.enrolled && r.month < 24).length;
const died = rows.filter(r => r.died);
console.log(`coverage: ${enrolled}/${SEEDS} enrolled, ${finished} reached an ending, ${graduated} graduated, ${deep} got past month 40, ${rows.reduce((a, r) => a + r.plan, 0)} planning turns`);
console.log('per seed: ' + rows.map(r => `${r.seed}:m${r.month}/${r.plan}t/${r.died ? 'DIED' : r.ending || r.stopped || 'open'}`).join('  '));
for (const d of died.slice(0, 6)) console.log(`  died: seed ${d.seed} ${d.died}`);
console.log(`untranslated strings reached in ${SEEDS} played run(s): ${misses.length}`);
console.log(`untranslated t() literals in src/ui (${ui.total} scanned): ${ui.missing.size}`);

// Per-seed floors. One deep seed must not be able to stand in for the rest, so these count seeds,
// not turns: most of them have to individually get to the late game, half of them have to finish,
// and a seed that dies of an exception is a harness bug rather than a hard life.
const FLOOR = { deep: Math.ceil(SEEDS * 0.6), finished: Math.ceil(SEEDS * 0.5), graduated: Math.max(1, Math.floor(SEEDS * 0.2)) };
const fail = [];
if (died.length) fail.push(`${died.length} seed(s) threw`);
if (deep < FLOOR.deep) fail.push(`only ${deep} seeds reached month 40 (need ${FLOOR.deep})`);
if (finished < FLOOR.finished) fail.push(`only ${finished} seeds reached an ending (need ${FLOOR.finished})`);
if (graduated < FLOOR.graduated) fail.push(`only ${graduated} seeds graduated (need ${FLOOR.graduated}) — the endgame prose is unaudited`);
if (early > SEEDS / 4) fail.push(`${early} enrolled seeds never got past month 24`);
if (fail.length) {
  console.log('COVERAGE TOO LOW — ' + fail.join('; ') + '. The zero above means nothing.');
  process.exitCode = 1;
}
if (ui.missing.size) { console.log('UI LITERALS UNTRANSLATED — listed below with the file and line that renders them.'); process.exitCode = 1; }
for (const m of misses.sort((a, b) => b.length - a.length)) console.log('  ' + JSON.stringify(m));
for (const [lit, where] of [...ui.missing].sort((a, b) => a[1].localeCompare(b[1]))) console.log(`  ui ${where}  ${JSON.stringify(lit)}`);
