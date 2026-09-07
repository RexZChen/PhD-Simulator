// Multi-seed balance harness.
//
// Read the headline percentages with a wide error bar. Adding two pick() calls to the milestone
// pass path — pure flavour, no mechanics — moved diligent's graduation rate from 52% to 42% over
// 120 seeds, and removing them again reproduced the old numbers exactly. The distribution did not
// change; the seeds simply landed differently once the stream shifted. So a swing of ±5 points
// between two runs of this harness is alignment, not balance, and only a change that survives
// several seed counts is a real one. Plays 40 runs in each of three styles and reports the
// distribution of endings and the state of the player at the end.
//   node scripts/balance.mjs
// diligent: answers the advisor, rests, sees a doctor.  lazy: declines everything.
// grinder: never rests, four coffees a day, skips meals.
// Healthy targets: diligent mostly graduates across a dozen distinct endings; lazy is mostly
// fired; grinder bottoms out around 35-45 health with a condition or two and is fired more often
// than not — they ignore every advisor request while visibly burning out, and since standing and
// hope both became real systems that is the outcome the model produces.

import { createRun } from '/Users/rexzchen/Codes/PhDSim/src/engine/state.js';
import { dispatch, focusOptions } from '/Users/rexzchen/Codes/PhDSim/src/engine/game.js';
import { schools } from '/Users/rexzchen/Codes/PhDSim/src/data/catalog.js';
import { interviewStep } from '/Users/rexzchen/Codes/PhDSim/src/engine/apply.js';
import { templateById } from '/Users/rexzchen/Codes/PhDSim/src/engine/events.js';
import { pushbacks } from '/Users/rexzchen/Codes/PhDSim/src/data/minigames.js';
import { questioners } from '/Users/rexzchen/Codes/PhDSim/src/data/conference.js';
import { currentBeat } from '/Users/rexzchen/Codes/PhDSim/src/engine/epilogue.js';
import { canAskTimeline } from '/Users/rexzchen/Codes/PhDSim/src/engine/timeline.js';
import { canApplyIntern } from '/Users/rexzchen/Codes/PhDSim/src/engine/internship.js';
import { availableWriters, letterCount, packetStrength } from '/Users/rexzchen/Codes/PhDSim/src/engine/letters.js';
import { openPortals, listingsFor, funnel, heatBand } from '/Users/rexzchen/Codes/PhDSim/src/engine/jobsearch.js';
import { outputDrought, droughtBand } from '/Users/rexzchen/Codes/PhDSim/src/engine/advisor.js';
import { buildCV } from '/Users/rexzchen/Codes/PhDSim/src/engine/epilogue.js';
import { activeContacts, activeContacts as ACTIVE } from '/Users/rexzchen/Codes/PhDSim/src/engine/network.js';
import { obstacleOf as OBST, doorOptions as DOORS } from '/Users/rexzchen/Codes/PhDSim/src/engine/stuck.js';
import { activeProject } from '/Users/rexzchen/Codes/PhDSim/src/engine/state.js';

const SEEDS = Number(process.argv[2] || 40);
globalThis.__SEEN = new Set(); globalThis.__AW = new Set(); globalThis.__CH = new Set();
globalThis.__OB = {}; globalThis.__BLOCK = {}; globalThis.__FIT = {};
let __k = 0;
const resolveAll = s => { let n = 0; while (s.event && n++ < 40) { const e = templateById[s.event]; globalThis.__SEEN.add(e.id); const pool = e.choices.filter(c => !c.ending && !c.minigame && !(c.requiresCoursework && s.coursework < c.requiresCoursework)); const ok = pool.find(c=>c.keepsFired) || pool.find(c=>c.firesLabmate) || (pool.length ? pool[(__k++) % pool.length] : e.choices[0]); if (ok.keepsFired) { const n = ACTIVE(s).length; globalThis.__NET = globalThis.__NET||[]; globalThis.__NET.push(n); } globalThis.__CH.add(e.id + '::' + ok.id); s = dispatch(s, { type: 'CHOICE', id: ok.id }); for (const a of (s.achievements||[])) globalThis.__AW.add(a); if (s.stage === 'minigame') s = dispatch(s, { type: 'LECTURE', worked: 9, attention: 5, caught: 1 }); } return s; };
const act = (s, a) => resolveAll(dispatch(s, a));

function advance(s) {
  // A crisis interrupts the turn and must be answered. Diligent does what it is told; the
  // grinder does the minimum; lazy ignores it and pays for that later.
  if (s.stage === 'crisis') return dispatch(s, { type: 'CRISIS', id: s.__style === 'diligent' ? 'treat' : s.__style === 'grinder' ? 'minimum' : 'ignore' });
  if (s.stage === 'pushback') { const pb = pushbacks.find(x => x.id === s.pushback.id); return dispatch(s, { type: 'PUSHBACK', id: pb.options[0].id }); }
  if (s.stage === 'summons') {
    // Diligent goes and says it is a bad week; the grinder just goes; lazy declines everything.
    const id = s.__style === 'diligent' ? 'late' : s.__style === 'grinder' ? 'go' : 'decline';
    return dispatch(s, { type: 'SUMMONS', id });
  }
  if (s.stage === 'minigame' && s.minigame === 'viva') {
    // Diligent knows their own work and says so when they do not; lazy bluffs and goes quiet.
    const tally = s.__style === 'diligent' ? { land: 4, concede: 2, caught: 0, silent: 0, composure: 82 }
      : s.__style === 'grinder' ? { land: 3, concede: 0, caught: 3, silent: 0, composure: 52 }
      : { land: 1, concede: 1, caught: 3, silent: 1, composure: 28 };
    return dispatch(s, { type: 'VIVA', tally });
  }
  if (s.stage === 'minigame') return dispatch(s, { type: 'LECTURE', worked: 9, attention: 5, caught: 1 });
  if (s.stage === 'trip') {
    if (s.trip.phase === 'visa') return dispatch(s, { type: 'TRIP_VISA', id: 'normal' });
    if (s.trip.caughtScene) return dispatch(s, { type: 'TRIP_CAUGHT', id: 'honest' });
    if (s.trip.day === s.trip.talkDay && !s.trip.talkDone) return dispatch(s, { type: 'TRIP_TALK', tally: { hits: 4, hype: 1, misses: 1 } });
    if (s.trip.qa && !s.trip.qaDone) { const q = questioners.find(x => x.id === s.trip.qa[s.trip.qaIndex]); return dispatch(s, { type: 'TRIP_QA', id: q.best }); }
    return dispatch(s, { type: 'TRIP_DAY', id: ['sessions', 'coffee', 'posters', 'explore'][s.trip.day % 4] });
  }
  if (s.stage === 'commencement') return dispatch(s, { type: 'TAKE_OFFER', id: s.jobs.market[0].kind });
  if (s.stage === 'epilogue') { const b = currentBeat(s); return dispatch(s, { type: 'EPILOGUE', id: b ? b.choices[0].id : 'ok' }); }
  return s;
}

const venuesMod = import('/Users/rexzchen/Codes/PhDSim/src/data/venues.js');
const calMod = import('/Users/rexzchen/Codes/PhDSim/src/data/calendar.js');
async function run(seed, style) {
  let s = createRun(seed, { background: ['masters', 'undergrad', 'industry', 'theory'][seed % 4], topic: ['ml', 'nlp', 'systems', 'theory', 'hci', 'robotics'][seed % 6], international: seed % 3 === 0 });
  s = act(s, { type: 'PREP', id: 'sop_draft' });
  s = act(s, { type: 'PREP', id: 'letter_ask', target: 'rec-0' });
  s = act(s, { type: 'PREP', id: 'proceed' });
  for (const school of schools.slice(6, 22)) { if (s.player.stats.energy < 3 || s.player.stats.money < 75) break; s = act(s, { type: 'APPLY', schoolId: school.id, effort: 'generic', contact: false, poiId: s.advisors.find(a => a.schoolId === school.id).id }); }
  s = act(s, { type: 'ADMISSIONS' });
  // Each interview draws its own questions now, so answer whatever is actually asked.
  for (const app of s.applications.filter(a => a.interview)) {
    for (let n = 0; n < 8; n++) {
      const live = s.applications.find(a => a.schoolId === app.schoolId);
      if (!live?.interview || live.interview.done) break;
      const q = interviewStep(live);
      if (!q) break;
      s = act(s, { type: 'INTERVIEW', schoolId: app.schoolId, id: q.options[0].id });
    }
  }
  s = act(s, { type: 'DECISIONS' });
  if (!s.offers.length && s.applications.some(a => a.waitlisted)) s = act(s, { type: 'WAIT_APRIL' });
  if (!s.offers.length) return { ending: 'no_offer', month: 0 };
  s = act(s, { type: 'ENROLL', id: s.advisors.find(a => a.schoolId === s.offers[0]).id });
  s.__style = style;
  let guard = 0, minHealth = 100, maxDebt = 0, clinics = 0, trips = 0, coffees = 0;
  while (['playing', 'epilogue'].includes(s.phase) && guard++ < 1400) {
    const before = s.stage + ':' + s.month + ':' + s.week + ':' + (s.dayIndex || 0);
    if (s.stage === 'plan') {
      // The people outside the lab. Diligent keeps in touch and delivers; the grinder takes the
      // work and never writes; lazy lets every one of them fade.
      if (style !== 'lazy') {
        const owing = activeContacts(s).find(c => c.task);
        if (owing) { try { s = act(s, { type: 'DO_COLLAB', id: owing.id }); } catch { /* no energy */ } }
        else {
          // Diligent keeps in touch and takes on one collaboration at a time, and only when their
          // own project is not the thing that is behind. That is the balance the system is about.
          if (style === 'diligent') for (const c of activeContacts(s)) { if (s.stage !== 'plan') break; try { s = act(s, { type: 'NET_TALK', id: c.id }); } catch { /* spoke already */ } }
          const mine = activeProject(s);
          const room = s.player.stats.energy > 55 && (!mine || mine.progress > 45) && s.month - (s.lastCollab || -9) >= 6;
          if (room) {
            const best = activeContacts(s).sort((a, b) => b.regard - a.regard)[0];
            const want = best && best.regard > 76 ? 'huge' : 'real';
            if (best) { try { s = act(s, { type: 'NET_COLLAB', id: best.id, size: want }); s.lastCollab = s.month; } catch { /* not yet */ } }
          }
        }
      }
      if (style === 'diligent') for (const r of s.requests.filter(r => r.status === 'open')) { try { s = act(s, { type: 'REQUEST_DO', id: r.id }); } catch {} }
      // Year four: have the conversation, push once, and take the sixth year rather than drift.
      if (canAskTimeline(s) && !s.milestones.graduated) {
        try { s = act(s, { type: 'ASK_TIMELINE' }); } catch {}
        if (s.grad && !s.grad.settled) {
          for (const mv of ['evidence', 'date', 'committee']) { if (s.grad.settled) break; try { s = act(s, { type: 'TIMELINE_MOVE', id: mv }); } catch {} }
          if (!s.grad.settled && (s.grad.rounds || 0) >= 3) { try { s = act(s, { type: 'TIMELINE_MOVE', id: 'accept' }); } catch {} }
        }
      }
      // Year four onward: actually apply. Diligent tailors; grinder blankets; lazy barely tries.
      if (s.month >= 42 && !s.milestones.graduated && s.stage === 'plan' && style !== 'lazy') {
        const effort = style === 'diligent' ? 'tailored' : 'standard';
        const cap = style === 'diligent' ? 22 : 14;
        // An academic keeps room for the faculty season instead of filling up on industry in July.
        const academicMinded = s.player.profile.ambition === 'academic';
        const order = openPortals(s).sort((a, b) => (academicMinded ? ['crab', 'pipeline', 'linkedout'] : ['linkedout', 'pipeline', 'crab']).indexOf(a)
          - (academicMinded ? ['crab', 'pipeline', 'linkedout'] : ['linkedout', 'pipeline', 'crab']).indexOf(b));
        const reserve = academicMinded && !openPortals(s).includes('crab') ? 8 : 0;   // keep slots for September
        for (const pid of order) {
          if ((s.jobs?.apps?.length || 0) >= cap) break;
          // Apply where there is a chance, not only where the letterhead is nicest.
          const board = listingsFor(s, pid).filter(e => !e.gate.blocked && !e.sponsorBlocked)
            .sort((a, b) => a.difficulty - b.difficulty);
          for (const e of board.slice(0, 4)) {
            if ((s.jobs?.apps?.length || 0) >= cap - (pid === 'linkedout' ? reserve : 0)) break;
            if (s.player.stats.energy < 6) break;
            try { s = act(s, { type: 'JOB_APPLY', id: e.id, effort }); } catch {}
          }
        }
        // Diligent says it out loud rather than being found out.
        if (style === 'diligent' && (s.jobs?.apps?.length || 0) >= 3 && !s.jobs.secret.disclosed && !s.jobs.secret.discovered) {
          try { s = act(s, { type: 'JOB_DISCLOSE' }); } catch {}
        }
      }
      // Year four onward: line up letters. Lazy leaves it too late and files three.
      if (s.month >= 42 && !s.letters?.closed && s.player.stats.energy > 20) {
        const want = style === 'lazy' ? 3 : 5;
        // An informed candidate asks people who know the work, and leaves the chair for last.
        const risk = { advisor: 0, postdocmate: 1, committee: 2, collaborator: 2, mentor: 3, senior: 8, chair: 9 };
        while (letterCount(s) < want && s.stage === 'plan') {
          const w = [...availableWriters(s)].sort((a, b) => (risk[a.kind] ?? 5) - (risk[b.kind] ?? 5))[0];
          if (!w) break;
          try { s = act(s, { type: 'ASK_LETTER', id: w.id }); } catch { break; }
        }
      }
      // Every August: apply, then have the conversation. Diligent asks; grinder goes regardless.
      if (canApplyIntern(s) && style !== 'lazy') {
        try { s = act(s, { type: 'INTERN_APPLY' }); } catch {}
      }
      if (s.intern && s.intern.offers.length && !s.intern.talk && s.stage === 'plan') {
        // Diligent is on the academic track and picks accordingly; grinder takes the money.
        const rank = style === 'grinder'
          ? o => ({ quant: 0, sde: 1, mle: 2, startup: 3, research: 4, natlab: 5, teaching: 6 })[o.typeId]
          : o => ({ research: 0, natlab: 1, teaching: 2, mle: 3, sde: 4, startup: 5, quant: 6 })[o.typeId];
        const want = [...s.intern.offers].sort((a, b) => rank(a) - rank(b))[0];
        try { s = act(s, { type: 'INTERN_TALK', id: want.id }); } catch {}
      }
      if (s.intern && s.intern.talk && !s.intern.talk.settled && s.stage === 'plan') {
        if (style === 'diligent') for (const mv of ['ask_labmate', 'plan', 'connection', 'money']) { if (s.intern.talk.settled) break; try { s = act(s, { type: 'INTERN_MOVE', id: mv }); } catch {} }
        if (!s.intern.talk.settled) { try { s = act(s, { type: 'INTERN_MOVE', id: style === 'grinder' ? 'go' : 'decline' }); } catch {} }
      }
      // Defending is not finishing: work the committee's list, then deposit.
      if (s.thesis && !s.thesis.deposited) {
        for (let i = 0; i < 6; i++) {
          const next = s.thesis.items.find(x => x.done < x.effort);
          if (!next || s.player.stats.energy < 8) break;
          try { s = act(s, { type: 'REVISE', id: next.id }); } catch { break; }
        }
        for (let i = 0; i < 3; i++) { if (s.stage !== 'plan') break; try { s = act(s, { type: 'DEPOSIT' }); } catch { break; } }
      }
      try { const ob = OBST(s); globalThis.__OB[ob.id] = (globalThis.__OB[ob.id]||0)+1;
        for (const o of DOORS(s)) { if (o.blocked) globalThis.__BLOCK[o.blocked]=(globalThis.__BLOCK[o.blocked]||0)+1; else globalThis.__BLOCK['(open) '+o.id]=(globalThis.__BLOCK['(open) '+o.id]||0)+1; if (o.fits) globalThis.__FIT[o.id+'/'+ob.id]=(globalThis.__FIT[o.id+'/'+ob.id]||0)+1; } } catch(e){ globalThis.__OBERR = e.message; }
      if (s.stage !== 'plan') { s = resolveAll(advance(s)); continue; }
      if (style === 'diligent' && s.player.stats.health < 55 && s.conditions?.length && s.player.stats.money > 900) { try { s = act(s, { type: 'CLINIC', id: 'primary' }); clinics++; } catch {} }
      if (s.tempo === 'day' && s.player.stats.energy < 45) { const cups = style === 'grinder' ? 4 : 1; for (let i = 0; i < cups; i++) { try { s = act(s, { type: 'COFFEE' }); coffees++; } catch { break; } } }
      if (style === 'grinder' && s.tempo === 'day') { try { s = act(s, { type: 'SKIP_MEAL' }); } catch {} }
      if (!s.focus) {
        const opts = focusOptions(s).filter(f => !f.disabled);
        const p0 = s.projects.find(x => x.id === s.activeProjectId);
        let want = 'research';
        if (style !== 'grinder' && s.player.stats.energy < 30) want = 'rest';
        else if (style !== 'grinder' && s.player.stats.health < 45) want = 'life';
        else if (s.month < 10 && s.coursework < 55) want = 'coursework';
        else if (p0 && p0.progress >= 40 && p0.draft < 100) want = 'write';
        else if (s.crunch) want = p0 && p0.draft < 90 ? 'writing' : 'experiments';
        const o = opts.find(f => f.id === want) || opts[0];
        if (o) s = act(s, { type: 'PLAN', id: o.id });
      }
      { const pw = s.projects.find(x => x.id === s.activeProjectId); if (pw && ['Drafting','Experiments','Prototype'].includes(pw.status) && pw.progress >= 35) { for (let i = 0; i < 12; i++) { try { s = act(s, { type: 'WRITE', amount: 5 }); } catch { break; } } } }
      { const pt = s.projects.find(x => x.id === s.activeProjectId); if (pt && !pt.targetVenueId && pt.progress >= 45 && pt.status !== 'Accepted') { try { s = act(s, { type: 'SET_TARGET', id: 'neuripsy' }); } catch {} } }
      { const pr = s.projects.find(x => x.id === s.activeProjectId); if (pr && pr.status === 'Rejected') { try { s = act(s, { type: 'RECYCLE', id: 'revise' }); } catch {} } }
      { const pb2 = s.projects.find(x => x.id === s.activeProjectId); if (pb2 && pb2.status === 'Rebuttal') { try { s = act(s, { type: 'REBUT', id: 'careful' }); } catch {} } }
      if (!s.projects.length) { try { s = act(s, { type: 'START_PROJECT' }); } catch {} }
      if (s.milestones.proposal === 'pass' && !s.milestones.thesisStarted && s.month >= 54) { try { s = act(s, { type: 'START_THESIS' }); } catch {} }
      const p = s.projects.find(x => x.id === s.activeProjectId);
      if (p && p.status === 'Drafting' && p.draft >= 60 && p.progress >= 40) { try { s = act(s, { type: 'SEND_ADVISOR' }); } catch {} }
      if (p && p.status === 'Ready' && p.kind !== 'thesis') {
        const { venuesForTopic, acceptsThisMonth } = await venuesMod;
        const { monthOf } = await calMod;
        const open = venuesForTopic(p.topic).filter(v => acceptsThisMonth(v, s.month, monthOf));
        if (open.length) { for (let i = 0; i < 5; i++) { try { s = act(s, { type: 'WIZARD', venueId: open[0].id }); } catch { break; } } try { s = act(s, { type: 'SUBMIT' }); } catch {} }
      }
      { const th = s.projects.find(x => x.kind === 'thesis');
        if (th && th.status === 'Drafting' && th.draft >= 90) { try { s = act(s, { type: 'SELECT_PROJECT', id: th.id }); s = act(s, { type: 'SEND_ADVISOR' }); } catch {} }
        if (th && th.status === 'Ready' && (s.milestones.defenseMonth === null || s.milestones.defenseMonth === undefined)) { try { s = act(s, { type: 'SCHEDULE_DEFENSE' }); } catch {} } }
      try { s = act(s, { type: 'CONTINUE' }); } catch { break; }
    }
    if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' });
    if (s.stage === 'milestone') s = act(s, { type: 'MILESTONE', id: 'balanced' });
    if (s.trip) trips++;
    s = resolveAll(advance(s));
    minHealth = Math.min(minHealth, s.player.stats.health ?? 100);
    maxDebt = Math.max(maxDebt, s.debt || 0);
    const after = s.stage + ':' + s.month + ':' + s.week + ':' + (s.dayIndex || 0) + ':' + (s.epilogue?.index ?? '');
    if (after === before && !['plan', 'report', 'milestone'].includes(s.stage)) break;
  }
  for (const a of (s.achievements||[])) globalThis.__AW.add(a);
  for (const k of Object.keys(s.seen||{})) globalThis.__SEEN.add(k);
  return { cvDist: (() => { try { const cv = buildCV(s); const by = {}; for (const l of cv.lines) by[l.section] = (by[l.section]||0)+l.points; return { ...by, score: cv.score }; } catch { return null; } })(), diag: s.ending?.id === 'abd' ? {
    grad: s.grad ? `${s.grad.stance}/${s.grad.settled ? 'settled y' + s.grad.targetYear : 'open'}/r${s.grad.rounds}` : 'never asked',
    thesisStarted: !!s.milestones.thesisStarted,
    thesisStatus: (s.projects.find(p => p.kind === 'thesis') || {}).status || 'none',
    thesisDraft: Math.round((s.projects.find(p => p.kind === 'thesis') || {}).draft || 0),
    defenseMonth: s.milestones.defenseMonth ?? null,
  } : null, endMoney: Math.round(s.player.stats.money), endDebt: Math.round(s.debt || 0), intl: s.player.profile.international ? 1 : 0, ledger: s.ledger, tripCost: s.lastTrip ? 1 : 0, ending: s.ending?.id || `stuck:${s.stage}`, month: s.month, minHealth: Math.round(minHealth), maxDebt, clinics, trips, coffees, accepted: s.counts.accepted, cites: Object.values(s.citations || {}).reduce((a, b) => a + b, 0), warnings: s.warnings || 0, quit: Math.round(s.quitPressure || 0), standing: Math.round(s.standing ?? 60), conds: (s.conditions || []).length, crises: s.lastCrisisMonth !== undefined ? 1 : 0, interns: s.counts.internships || 0, drought: outputDrought(s), letters: letterCount(s), packet: Math.round(packetStrength(s).score), sent: funnel(s).sent, screens: funnel(s).screens, jobOffers: funnel(s).offers, silent: funnel(s).silent, found: s.jobs?.secret?.discovered ? 1 : 0, dark: packetStrength(s).darkHorse ? 1 : 0, internHow: (s.intern?.history || []).map(h => h.how).join('+') || 'none', internType: (s.intern?.history || []).map(h => h.typeId).join('+') || 'none', research: Math.round(s.player.skills.research), net: activeContacts(s).length, netDone: (s.contacts||[]).reduce((a,c)=>a+c.done,0), netFaded: (s.contacts||[]).filter(c=>c.status!=='active').length };
}


import { events as ALLEV } from '/Users/rexzchen/Codes/PhDSim/src/data/events.js';
import { meetings as ALLMEET } from '/Users/rexzchen/Codes/PhDSim/src/data/meetings.js';
for (const style of ['diligent', 'lazy', 'grinder']) {
  for (let seed = 1; seed <= SEEDS; seed++) { try { await run(seed, style); } catch (err) { console.log('run err', style, seed, err.message); } }
}
const seen = globalThis.__SEEN;
const missing = [...ALLEV, ...ALLMEET].filter(e => !seen.has(e.id));
console.log('TOTAL', ALLEV.length + ALLMEET.length, 'seen', seen.size, 'MISSING', missing.length);
for (const e of missing) console.log('  MISS', e.id, '|', JSON.stringify(e.conditions||{}), e.prerequisites?('prereq='+e.prerequisites):'');
console.log('OBSTACLES', JSON.stringify(globalThis.__OB));
console.log('OBERR', globalThis.__OBERR);
console.log('DOORS', JSON.stringify(globalThis.__BLOCK, null, 1));
console.log('FITS', JSON.stringify(globalThis.__FIT));
// unseen choices
const unseenCh = [];
for (const e of [...ALLEV, ...ALLMEET]) for (const c of e.choices||[]) if (!globalThis.__CH.has(e.id+'::'+c.id)) unseenCh.push(e.id+'::'+c.id);
console.log('UNSEEN CHOICES', unseenCh.length);
console.log('NET AT keepsFired', JSON.stringify(globalThis.__NET));
console.log('AWARDED', [...globalThis.__AW].sort().join(' '));
