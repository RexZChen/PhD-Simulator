// What is still in English when you play in Chinese.
//   node scripts/i18n-audit.mjs [seeds]
// Plays real runs with the language set, records every string t() could not translate, and drops
// the ones that are already Chinese (those come from the by-id catalogs, which t() sees after the
// fact). What is left is genuinely untranslated and is printed grouped by where it came from.
import { setAppLanguage } from '../src/i18n/apply.js';
import { createRun } from '../src/engine/state.js';
import { dispatch, focusOptions } from '../src/engine/game.js';
import { schools } from '../src/data/catalog.js';
import { templateById } from '../src/engine/events.js';
import { pushbacks } from '../src/data/minigames.js';
import { questioners } from '../src/data/conference.js';
import { currentBeat } from '../src/engine/epilogue.js';
import { interviewStep } from '../src/engine/apply.js';
import { doorOptions, obstacleOf } from '../src/engine/stuck.js';
import { stuckNote } from '../src/data/stuck.js';
import { t } from '../src/i18n/index.js';

globalThis.__I18N_MISS = new Set();
setAppLanguage('zh');

const resolveAll = s => { let n = 0; while (s.event && n++ < 40) { const e = templateById[s.event]; const ok = e.choices.find(c => !c.ending && !c.minigame && !(c.requiresCoursework && s.coursework < c.requiresCoursework)) || e.choices[0]; s = dispatch(s, { type: 'CHOICE', id: ok.id }); if (s.stage === 'minigame') s = dispatch(s, { type: 'LECTURE', worked: 9, attention: 5, caught: 1 }); } return s; };
const act = (s, a) => resolveAll(dispatch(s, a));
function advance(s) {
  if (s.stage === 'crisis') return dispatch(s, { type: 'CRISIS', id: 'treat' });
  if (s.stage === 'summons') return dispatch(s, { type: 'SUMMONS', id: ['go', 'late', 'decline'][s.month % 3] });
  if (s.stage === 'minigame' && s.minigame === 'viva') return dispatch(s, { type: 'VIVA', tally: { right: 4, hedged: 2, wrong: 1 } });
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

const SEEDS = Number(process.argv[2] || 12);
// Coverage, printed every time. This harness once threw on the first varied interview, took every
// seed with it, and went on reporting a confident zero for a year of gameplay prose it never
// reached. A zero that comes from not looking is worse than a number.
const COVER = { plan: 0, enrolled: 0, month: 0, died: [] };
for (let seed = 1; seed <= SEEDS; seed++) {
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
    if (!s.offers.length) continue;
    s = act(s, { type: 'ENROLL', id: s.advisors.find(a => a.schoolId === s.offers[0]).id });
    COVER.enrolled++;
    let guard = 0;
    while (['playing', 'epilogue'].includes(s.phase) && guard++ < 900) {
      const before = s.stage + ':' + s.month + ':' + s.week;
      if (s.stage === 'plan') {
        COVER.plan++; COVER.month = Math.max(COVER.month, s.month);
        for (const r of s.requests.filter(r => r.status === 'open')) { try { s = act(s, { type: 'REQUEST_DO', id: r.id }); } catch { /* energy */ } }
        if (!s.projects.length) { try { s = act(s, { type: 'START_PROJECT' }); } catch { /* not yet */ } }
        const ob = obstacleOf(s); t(ob.label); t(ob.hint); t(stuckNote);
        for (const d of doorOptions(s)) {
          t(d.label); t(d.hint); if (d.blocked) continue;
          try { s = act(s, { type: 'STUCK_ASK', id: d.id }); } catch { /* energy */ }
        }
        if (!s.focus) s = act(s, { type: 'PLAN', id: focusOptions(s).find(f => !f.disabled).id });
        s = act(s, { type: 'CONTINUE' });
      }
      if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' });
      if (s.stage === 'milestone') s = act(s, { type: 'MILESTONE', id: 'balanced' });
      s = resolveAll(advance(s));
      if (before === s.stage + ':' + s.month + ':' + s.week && !['plan', 'report', 'milestone'].includes(s.stage)) break;
    }
  } catch (e) { COVER.died.push(`seed ${seed} @ ${s?.phase}/${s?.stage}: ${e && e.message}`); }
}

const cjk = /[㐀-鿿豈-﫿]/;
const misses = [...globalThis.__I18N_MISS].filter(x => x && x.trim() && !cjk.test(x) && !/^[\s\d.,:%$+\-—·|/()]*$/.test(x));
console.log(`coverage: ${COVER.enrolled}/${SEEDS} seeds enrolled, ${COVER.plan} planning turns played, deepest month ${COVER.month}`);
for (const d of [...new Set(COVER.died)].slice(0, 6)) console.log('  died: ' + d);
console.log(`untranslated strings reached in ${SEEDS} runs: ${misses.length}`);
if (COVER.plan < SEEDS * 20 || COVER.month < 40) {
  console.log('COVERAGE TOO LOW — the harness is stalling before the late game; the zero above means nothing.');
  process.exitCode = 1;
}
for (const m of misses.sort((a, b) => b.length - a.length)) console.log('  ' + JSON.stringify(m));
