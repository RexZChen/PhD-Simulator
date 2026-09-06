import { schools } from '../data/catalog.js';
import { t, t as tr } from '../i18n/index.js';
import { emailOpeners, emailFollowUps, studentOpeners, studentFlavor, interviewQuestions, visitQuestions } from '../data/threads.js';
import { recommenderPools, LETTERS_EXPECTED } from '../data/recommenders.js';
import { insiderNotes, poolsFor, NOTE_SOURCES } from '../data/insider.js';
import { firstNames, surnames } from '../data/names.js';
import { random, roll, clamp, pick, pickWeighted, jitter } from './probability.js';
import { effects, log, message, finish, lastName, firstName } from './state.js';
import { openNext } from './events.js';

// ---- Preparation (fall 2027) ----
export function initPrep(s) {
  const bg = s.player.profile.background;
  const pool = recommenderPools[bg] || recommenderPools.undergrad;
  const used = new Set();
  const name = () => { let n; do { n = `${pick(s, firstNames)} ${pick(s, surnames)}`; } while (used.has(n)); used.add(n); return n; };
  s.prep = {
    sop: bg === 'masters' ? 20 : 10, sopSteps: [], gre: null, waivers: false, waiverRolled: false, proceeded: false, researched: {},
    // Seven people you could ask, and Energy for perhaps four. The note is a true hint; the
    // numbers behind it are not shown, because you do not get to see them in life either.
    letters: pool.map((w, i) => ({
      id: `rec-${i}`, name: `${w.relation.includes('manager') || w.relation.includes('engineer') || w.relation.includes('director') || w.relation.includes('collaborator') ? '' : 'Prof. '}${name()}`.trim(),
      relation: w.relation, note: w.note,
      strength: clamp(jitter(s, w.base, 11)), reliability: clamp(jitter(s, w.rel, 14)),
      asked: false, reminded: false, status: 'pending',
    })),
  };
  s.threads = {};
  for (const a of s.advisors) { a.openings = random(s) < .2 ? 0 : random(s) < .6 ? 1 : 2; a.fitBonus = 0; }
}
export const prepEnergy = s => s.player.stats.energy;
export function prepAction(s, id, target) {
  const p = s.prep, st = s.player.stats;
  const spend = (energy, money = 0) => { if (st.energy < energy) throw new Error(t('Not enough Energy ({n} needed). Rest is not available before applications; the deadline is.', { n: energy })); if (st.money < money) throw new Error(t('Not enough money.')); effects(s, { energy: -energy, money: -money }); };
  switch (id) {
    case 'sop_draft': if (p.sopSteps.includes('draft')) throw new Error(t('The statement is drafted. It has a journey.')); spend(6); p.sop = clamp(p.sop + 30); p.sopSteps.push('draft'); log(s, t('Drafted the statement of purpose. It uses the word “passion” twice, which is the legal limit.')); break;
    case 'sop_friend': if (!p.sopSteps.includes('draft')) throw new Error(t('Draft it first.')); if (p.sopSteps.includes('friend')) throw new Error(t('Your friend has read it. They have opinions; they are done.')); spend(4); { const ok = roll(s, .5 + (s.player.skills.writing - 50) / 150); p.sop = clamp(p.sop + (ok ? 18 : 8)); p.sopSteps.push('friend'); log(s, ok ? t('A friend cut the second paragraph. It was the best cut of your life.') : t('A friend asked what your research question is. An excellent question.')); } break;
    case 'sop_mentor': if (!p.sopSteps.includes('draft')) throw new Error(t('Draft it first.')); if (p.sopSteps.includes('mentor')) throw new Error(t('Your recommender already gave notes.')); spend(3); p.sop = clamp(p.sop + 15); p.sopSteps.push('mentor'); s.flags.sopRevised = true; log(s, t('Your strongest recommender returned the statement with 40 comments and one “nice.”')); break;
    case 'sop_specific': {
      if (!p.sopSteps.includes('draft')) throw new Error(t('Draft it first.'));
      if (p.sopSteps.includes('specific')) throw new Error(t('The statement already names a question. Naming two would be worse.'));
      spend(5);
      const read = Object.keys(p.researched).length;
      const gain = read >= 3 ? 14 : 6;
      p.sop = clamp(p.sop + gain);
      p.sopSteps.push('specific');
      log(s, read >= 3
        ? t('You cut “I am passionate about artificial intelligence” and wrote the actual question you want to answer, naming two people who are already answering it. Researching those programs is what made that paragraph possible.')
        : t('You replaced the passion sentence with a research question. It is a real question, but it is not aimed at anyone in particular yet — you have not read enough programs to aim it.'));
      break;
    }
    case 'sop_cut': {
      if (!p.sopSteps.includes('draft')) throw new Error(t('There is nothing to cut yet.'));
      if (p.sopSteps.includes('cut')) throw new Error(t('It is two pages. Cutting further would remove the argument.'));
      spend(4); p.sop = clamp(p.sop + 12); p.sopSteps.push('cut');
      log(s, t('Cut it from four pages to two. Everything you deleted was true, and none of it was doing any work.'));
      break;
    }
    case 'sop_reread': {
      if (!p.sopSteps.includes('draft')) throw new Error(t('Draft it first.'));
      const n = p.sopSteps.filter(x => x === 'reread').length;
      if (n >= 3) throw new Error(t('You have read it aloud three times. It is finished, and re-reading it now is a way of not sending it.'));
      spend(3); p.sop = clamp(p.sop + [8, 5, 3][n]); p.sopSteps.push('reread');
      log(s, [
        t('You read it aloud and heard the two sentences that were doing nothing. They are gone.'),
        t('You left it for a week and came back. One paragraph had been in the wrong place the entire time.'),
        t('Another pass. You changed four words and put one of them back.'),
      ][n]);
      break;
    }
    case 'gre': if (p.gre !== null) throw new Error(t('Already decided.')); if (target === 'skip') { p.gre = 'skipped'; log(s, t('Skipped the GRE. “Optional” is a word with a range of meanings.')); break; } spend(8, 220); { const score = clamp(Math.round(145 + s.player.skills.math / 5 + (random(s) - .5) * 8), 130, 170); p.gre = score; log(s, t('GRE done. Quant {score}. The test center chair was designed by a rival.', { score })); } break;
    case 'waiver': if (p.waiverRolled) throw new Error(t('Already requested.')); spend(3); p.waiverRolled = true; p.waivers = roll(s, .45 + (s.player.skills.communication - 50) / 150 + (st.money < 2500 ? .2 : 0)); log(s, p.waivers ? t('Fee waivers approved for most programs. A rare kindness from a portal.') : t('Fee waiver denied: your “demonstrated need” was not demonstrated on the right form.')); break;
    case 'letter_ask': { const l = p.letters.find(x => x.id === target); if (!l || l.asked) throw new Error(t('Already asked.')); spend(2); l.asked = true; log(s, t('Asked {name} ({relation}) for a letter. They said “of course,” which is a promise in a tone.', { name: l.name, relation: t(l.relation) })); } break;
    case 'letter_remind': { const l = p.letters.find(x => x.id === target); if (!l || !l.asked || l.reminded) throw new Error(t('Ask first; remind once.')); spend(2); l.reminded = true; l.reliability = clamp(l.reliability + 25); log(s, t('Reminded {name}. Politely. Twice, in one email.', { name: l.name })); } break;
    case 'research': {
      const school = schools.find(x => x.id === target);
      if (!school || p.researched[target]) throw new Error(t('Already researched.'));
      spend(1);
      // Three notes drawn from the pools this school's own numbers put it in. Two people can
      // describe the same department differently and both be telling the truth.
      const pools = poolsFor(school);
      const seen = new Set();
      const notes = [];
      for (let i = 0; i < 3; i++) {
        const pool = pools[Math.floor(random(s) * pools.length)];
        const avail = insiderNotes[pool].filter(x => !seen.has(x));
        if (!avail.length) continue;
        const line = pick(s, avail);
        seen.add(line);
        notes.push({ line, from: pick(s, NOTE_SOURCES) });
      }
      p.researched[target] = { notes };
      log(s, t('Read up on {school}: the website, a forum thread, and someone who actually goes there.', { school: school.name }));
      break;
    }
    case 'proceed': if (!p.letters.some(l => l.asked)) throw new Error(t('Ask at least one recommender first. Letters do not write themselves; recommenders barely do.')); p.proceeded = true; s.phase = 'application'; effects(s, { energy: 15 }); log(s, t('December. The portals open. The portals are slow.')); message(s, 'GradApply', t('Application season is open'), t('Deadlines are December 15 for most programs. Fees are $75 unless waived. Name a professor of interest in each application; it routes your file.'), null); break;
    default: throw new Error(t('Unknown preparation step.'));
  }
}

// ---- Guidance ----------------------------------------------------------------
// The single next thing worth doing, named plainly, with the button that does it. A new player
// should never have to guess what this screen wants; the difficulty is meant to be the choices,
// not the interface.
export function nextStep(s) {
  const p = s.prep;
  if (s.phase === 'prep') {
    if (!p.sopSteps.includes('draft'))
      return { title: t('Start by drafting your statement of purpose'), detail: t('It is the one document every program reads. Everything else on this screen improves it or supports it.'), action: 'prep', id: 'sop_draft', label: t('Draft the statement (−6 Energy)') };
    if (!p.letters.some(l => l.asked))
      return { title: t('Ask someone for a recommendation letter'), detail: t('Programs want three. Pick people who actually remember your work — the note under each name is a real hint.'), action: null, label: t('Use the “Ask for a letter” buttons on the right') };
    if (Object.keys(p.researched).length < 3)
      return { title: t('Research a few programs before you write about them'), detail: t('One Energy each, and it tells you what people who are actually there say. It also makes your statement specific, which is worth more than anything else you can do to it.'), action: null, label: t('Pick a school on the right, then “Research this program”') };
    if (!p.sopSteps.includes('specific'))
      return { title: t('Name the actual research question in your statement'), detail: t('You have read enough programs to aim it now. This is the single largest improvement left.'), action: 'prep', id: 'sop_specific', label: t('Name the question (−5 Energy)') };
    if (p.letters.filter(l => l.asked).length < LETTERS_EXPECTED)
      return { title: t('You are short of letters'), detail: t('Most programs want three. Two is a file with a hole in it.'), action: null, label: t('Ask another recommender on the right') };
    if (p.gre === null)
      return { title: t('Decide about the GRE'), detail: t('“Optional” is a word with a range of meanings. Exam-style programs still peek at it; everyone else genuinely does not care.'), action: null, label: t('Take it or skip it, in the middle column') };
    if (s.player.stats.energy > 12)
      return { title: t('Keep improving the statement, or go to the programs'), detail: t('Every remaining Energy point is worth more in the statement than it is in December. But you can leave now if you would rather spread the applications wider.'), action: 'prep', id: 'proceed', label: t('Proceed to applications →') };
    return { title: t('You are nearly out of Energy. Go to the programs.'), detail: t('Nothing left here is worth the last of it. December is where the money goes.'), action: 'prep', id: 'proceed', label: t('Proceed to applications →') };
  }
  if (s.phase === 'application') {
    if (!s.applications.length)
      return { title: t('Apply to your first program'), detail: t('Pick a professor of interest in the row, then press Apply. Aim for four to eight programs across the odds range — some you should get, some you probably will not.'), action: null, label: t('Choose a professor in a row below, then Apply') };
    if (s.applications.length < 4)
      return { title: t('Apply to a few more'), detail: t('{n} so far. One acceptance is all you need, and nobody can tell you in advance which one it will be.', { n: s.applications.length }), action: null, label: t('Keep applying, or submit what you have') };
    return { title: t('Submit, and then wait'), detail: t('{n} applications is a reasonable spread. After this it is out of your hands until March, which is the hardest part.', { n: s.applications.length }), action: 'admissions', id: null, label: t('Submit and wait →') };
  }
  if (s.phase === 'interviews') {
    const pending = s.applications.filter(a => a.interview && !a.interview.done);
    if (pending.length)
      return { title: t('You have {n} interview(s) waiting', { n: pending.length }), detail: t('A short video call with your professor of interest: three questions. Answer honestly — they are better at spotting a rehearsed answer than you are at giving one.'), action: null, label: t('Press “Join the call” on a row below') };
    return { title: t('Nothing to do but wait'), detail: t('Decisions arrive in March. Waitlists move in April. The portal has one button and it is Refresh.'), action: 'decisions', id: null, label: t('Refresh the portal →') };
  }
  if (s.phase === 'admissions') {
    if (!s.offers.length)
      return { title: t('No offers yet'), detail: t('If anything is waitlisted, April can still move. If not, this is a year that did not work, and that is a far more common story than the internet suggests.'), action: null, label: '' };
    return { title: t('Visit, ask questions, then choose'), detail: t('An advisor matters more than a ranking, and you cannot tell which is which from a website. Ask the professor, and ask their students — the students are the ones who will tell you the truth, tiredly.'), action: null, label: t('Use “Talk to the professor” and “Ask a current student”') };
  }
  return null;
}

// ---- Email threads with prospective advisors ----
const openingsLine = a => a.openings === 0 ? t('I am not taking students this year, though the committee may still route your file to me.') : a.openings === 1 ? t('I am taking one student this year.') : t('I am taking one or two students this year.');
const fundingWord = a => a.funding > 70 ? t('not a concern') : a.funding > 45 ? t('fine for the first two years') : t('tight; first-years usually TA');
function hintFor(s, a, trait) {
  const lines = { caring: a.caring > 60 ? t('they cover for students when life happens') : a.caring < 40 ? t('they do not ask how you are doing, and they mean it') : t('they are fine; fine is underrated'), availability: a.availability > 65 ? t('they read drafts the same day') : a.availability < 35 ? t('email is a void; catch them in the hallway') : t('they are reachable if you know which app'), toxicity: a.toxicity > 55 ? t('two students left last year and nobody says why') : a.toxicity < 25 ? t('nobody has left the lab angry') : t('they have moods; learn the calendar'), management: a.management > 65 ? t('every project has a date by which it is cut or shipped') : a.management < 35 ? t('they have never finished a project on the original plan') : t('about half the meetings have an agenda') };
  const pool = trait ? [lines[trait]] : Object.values(lines);
  const line = pick(s, pool);
  a.known = [...(a.known || []), line].filter((x, i, arr) => arr.indexOf(x) === i);
  return line;
}
export function email(s, advisorId, templateId) {
  const a = s.advisors.find(x => x.id === advisorId); if (!a) throw new Error(t('No such professor.'));
  const key = `${advisorId}:email`;
  const t = s.threads[key] || (s.threads[key] = { kind: 'email', advisorId, schoolId: a.schoolId, messages: [], stage: 0, followUp: null, done: false });
  if (t.done) throw new Error(tr('This thread has run its course. Faculty inboxes are finite; yours is not.'));
  const school = schools.find(x => x.id === a.schoolId);
  const fill = txt => txt.replace('{last}', lastName(a.name)).replace('{topic}', school.topics[0]).replace('{student}', t.student || 'a student').replace('{openingsLine}', openingsLine(a)).replace('{fundingWord}', fundingWord(a)).replace('{hint}', () => hintFor(s, a));
  if (t.stage === 0) {
    const tpl = emailOpeners.find(x => x.id === templateId); if (!tpl) throw new Error(tr('Choose a template.'));
    if (s.player.stats.energy < tpl.cost) throw new Error(tr('Not enough Energy ({n}).', { n: tpl.cost }));
    effects(s, { energy: -tpl.cost });
    t.messages.push({ from: 'you', text: fill(tpl.text) });
    let pool = tpl.outcomes;
    if (tpl.check) { const val = s.player.skills[tpl.check.skill]; const ok = roll(s, clamp(.5 + (val - tpl.check.difficulty) / 110, .1, .9)); pool = ok ? tpl.success : tpl.failure; }
    const o = pickWeighted(s, pool, x => x.w);
    if (o.effect?.student) { t.student = `${pick(s, firstNames)} ${pick(s, surnames)}`; s.threads[`${advisorId}:student`] = { kind: 'student', advisorId, schoolId: a.schoolId, student: t.student, messages: [{ from: 'them', text: tr('Hi! {name} said you had questions. Ask away — I have twelve minutes and a strong opinion.', { name: lastName(a.name) }) }], asked: [], done: false }; }
    if (o.reply === null) { t.messages.push({ from: 'them', text: tr('(no reply. Eleven days pass. Then twelve.)') }); t.done = true; log(s, tr('Emailed {name}. Silence, professionally delivered.', { name: lastName(a.name) })); }
    else { t.messages.push({ from: 'them', text: fill(tr(o.reply)) }); a.fitBonus = (a.fitBonus || 0) + (o.effect?.fit || 0); if (o.effect?.openings) a.openingsKnown = true; if (o.effect?.hint) hintFor(s, a); if (o.effect?.followUp) { t.followUp = o.effect.followUp; t.stage = 1; } else t.done = true; log(s, tr('Emailed {name}: {how}', { name: lastName(a.name), how: o.effect?.fit > 0 ? tr('a real reply.') : tr('a reply, technically.') })); }
    return t;
  }
  const fu = (emailFollowUps[t.followUp] || []).find(x => x.id === templateId); if (!fu) throw new Error(tr('Choose a follow-up.'));
  if (s.player.stats.energy < fu.cost) throw new Error(tr('Not enough Energy ({n}).', { n: fu.cost }));
  effects(s, { energy: -fu.cost });
  t.messages.push({ from: 'you', text: fu.label });
  t.messages.push({ from: 'them', text: fill(fu.reply) });
  a.fitBonus = (a.fitBonus || 0) + (fu.effect?.fit || 0);
  t.done = true;
  log(s, tr('Followed up with {name}.', { name: lastName(a.name) }));
  return t;
}
export function askStudentThread(s, advisorId, questionId) {
  const a = s.advisors.find(x => x.id === advisorId);
  const t = s.threads[`${advisorId}:student`];
  if (!a || !t) throw new Error(tr('No student contact for this lab yet.'));
  const q = studentOpeners.find(x => x.id === questionId); if (!q) throw new Error(tr('Choose a question.'));
  if (t.asked.includes(q.id)) throw new Error(tr('Already asked.'));
  if (s.player.stats.energy < q.cost) throw new Error(tr('Not enough Energy ({n}).', { n: q.cost }));
  effects(s, { energy: -q.cost });
  t.asked.push(q.id);
  const truthful = random(s) < .8;
  const line = truthful ? hintFor(s, a, q.reveal) : pick(s, [tr('it depends on the year, honestly'), tr('the lab moves extremely fast'), tr('you need to be very independent')]);
  t.messages.push({ from: 'you', text: q.label });
  t.messages.push({ from: 'them', text: `${pick(s, studentFlavor)}${line}.` });
  if (t.asked.length >= 3) t.done = true;
  log(s, tr('A student in {name}’s lab said: {line}.', { name: lastName(a.name), line }));
  return t;
}

// ---- Applications and decisions ----
export function applicationQuality(s, application) {
  const p = s.prep;
  const letters = p.letters.filter(l => l.asked);
  const letterScore = letters.length ? letters.reduce((a, l) => a + l.strength, 0) / Math.max(3, letters.length) : 20;
  return clamp(.75 + (p.sop - 50) / 250 + (letterScore - 55) / 300 + (application.effort === 'tailored' ? .12 : 0) + (s.flags.sopRevised ? .04 : 0), .5, 1.3);
}
export function admissionChance(s, school, application = { effort: 'generic', contact: false, poiId: null }) {
  const skills = s.player.skills;
  const strength = (skills.research * .4 + skills.writing * .25 + skills.math * .2 + skills.communication * .15) / 60;
  const topic = s.player.profile.topic;
  const fit = school.topics[0] === topic ? 1.3 : school.topics.includes(topic) ? 1.1 : .85;
  const poi = application.poiId ? s.advisors.find(a => a.id === application.poiId) : null;
  const demand = poi ? (poi.openings === 0 ? .55 : poi.openings === 1 ? 1 : 1.1) * (1 + (poi.fitBonus || 0)) : .95;
  const gre = s.prep?.gre && s.prep.gre !== 'skipped' ? (school.structure === 'exam' ? 1 + (s.prep.gre - 158) / 100 : 1) : (school.structure === 'exam' ? .96 : 1);
  return clamp(school.baseline * strength * fit * applicationQuality(s, application) * demand * gre * (application.contact ? 1.02 : 1) * (s.flags.interviewed ? 1.03 : 1) * (s.flags.backupLetter ? .95 : 1), .03, .9);
}
export const applicationCost = (s, effort, contact) => ({ money: s.prep?.waivers ? 0 : 75, energy: (effort === 'tailored' ? 7 : 3) + (contact ? 3 : 0) });
export function apply(s, a) {
  const school = schools.find(x => x.id === a.schoolId);
  if (!school || !['generic', 'tailored'].includes(a.effort) || s.applications.some(x => x.schoolId === school.id)) throw new Error(t('Choose a school you have not applied to.'));
  const poi = s.advisors.find(x => x.id === a.poiId && x.schoolId === school.id) || s.advisors.find(x => x.schoolId === school.id);
  const cost = applicationCost(s, a.effort, a.contact);
  if (s.player.stats.money < cost.money || s.player.stats.energy < cost.energy) throw new Error(t('Not enough Money or Energy for that application.'));
  effects(s, { money: -cost.money, energy: -cost.energy });
  s.applications.push({ schoolId: school.id, effort: a.effort, contact: !!a.contact, poiId: poi.id, status: 'submitted' });
  log(s, t('Applied to {school} (POI: {poi}).', { school: school.name, poi: lastName(poi.name) }));
  const next = { 1: 'fee', 3: 'letter' }[s.applications.length];
  if (next && !s.prep.waivers) { s.eventQueue.push(next); s.eventReturn = 'plan'; openNext(s); }
  else if (next === 'letter') { s.eventQueue.push(next); s.eventReturn = 'plan'; openNext(s); }
}
export function submitAll(s) {
  if (!s.applications.length) throw new Error(t('Apply to at least one program first.'));
  // Letters arrive (or not) at the deadline.
  for (const l of s.prep.letters) if (l.asked) { l.status = roll(s, l.reliability / 100) ? 'on time' : 'late'; if (l.status === 'late') l.strength = clamp(l.strength - 15); }
  const late = s.prep.letters.filter(l => l.status === 'late');
  if (late.length) log(s, t('{names} submitted late. The portal accepted it with a red timestamp.', { names: late.map(l => l.name).join(t(' and ')) }));
  for (const app of s.applications) {
    const school = schools.find(x => x.id === app.schoolId);
    app.chance = admissionChance(s, school, app);
    app.interview = school.prestige > 78 && roll(s, .45) ? { questions: [], step: 0, delta: 0, done: false } : null;
    app.status = app.interview ? 'interview' : 'under review';
  }
  s.phase = 'interviews';
  effects(s, { energy: 30, stress: -5 });
  log(s, t('Winter break. You sleep like an undergraduate for two weeks and wake up an applicant again.'));
  const invites = s.applications.filter(a => a.interview);
  log(s, invites.length ? t('Applications submitted. {n} interview invitation(s) arrive in January.', { n: invites.length }) : t('Applications submitted. No interviews; some programs decide from the file alone.'));
  for (const app of invites) { const school = schools.find(x => x.id === app.schoolId); const poi = s.advisors.find(x => x.id === app.poiId); message(s, t('{school} Admissions', { school: school.name }), t('Interview request — {school}', { school: school.name }), t('{name} would like to schedule a 30-minute video interview. Please indicate availability using the attached spreadsheet, which does not open.', { name: poi.name }), null); }
}
export function interviewAnswer(s, schoolId, optionId) {
  const app = s.applications.find(a => a.schoolId === schoolId && a.interview && !a.interview.done); if (!app) throw new Error(t('No interview pending there.'));
  const poi = s.advisors.find(x => x.id === app.poiId);
  const q = interviewQuestions[app.interview.step]; const o = q.options.find(x => x.id === optionId); if (!o) throw new Error(t('Choose an answer.'));
  let good = true;
  if (o.check) { const val = o.check.skill ? s.player.skills[o.check.skill] : s.player.stats[o.check.stat]; good = roll(s, clamp(.5 + (val - o.check.difficulty) / 110, .1, .9)); }
  const delta = good ? o.good : o.bad;
  app.interview.delta += delta;
  let reply = good ? o.goodReply : o.badReply;
  if (o.reveal && good) reply = reply.replace('{hint}', hintFor(s, poi, o.reveal));
  app.interview.questions.push({ them: q.them, you: o.label, reply });
  app.interview.step++;
  if (app.interview.step >= interviewQuestions.length) { app.interview.done = true; app.status = 'under review'; app.chance = clamp(app.chance * (1 + app.interview.delta), .03, .92); log(s, t('Interview with {name} finished. {how}', { name: lastName(poi.name), how: app.interview.delta > .05 ? t('It went well.') : app.interview.delta < 0 ? t('It went.') : t('It was fine, in the way of dentists.') })); }
  return app;
}
export function decisions(s) {
  if (s.applications.some(a => a.interview && !a.interview.done)) throw new Error(t('Finish your interviews first. They are on the calendar; the calendar is on your wall.'));
  for (const app of s.applications) {
    const school = schools.find(x => x.id === app.schoolId);
    const r = random(s) * (.7 + random(s) * .6);
    app.accepted = r < app.chance;
    app.waitlisted = !app.accepted && r < app.chance + .12;
    app.status = app.accepted ? 'admitted' : app.waitlisted ? 'waitlisted' : 'rejected';
    if (app.accepted) { s.offers.push(school.id); const poi = s.advisors.find(x => x.id === app.poiId); app.funding = poi.fellowship ? 'fellowship' : poi.funding > 55 ? 'RA' : 'TA'; }
    message(s, t('{school} Admissions', { school: school.name }), app.accepted ? t('An offer of admission — {school}', { school: school.name }) : app.waitlisted ? t('Waitlist — {school}', { school: school.name }) : t('Your application — {school}', { school: school.name }), app.accepted ? t('We would be delighted to welcome you. Funding: {funding}. Visit days are in April; please respond by April 15.', { funding: app.funding === 'fellowship' ? t('a first-year fellowship') : app.funding === 'RA' ? t('a research assistantship') : t('a teaching assistantship') }) : app.waitlisted ? t('You have been placed on the waitlist. This is neither a yes nor a no; it is a chair in a hallway. We will update you by April 15.') : t('We regret to inform you. This decision is not a measurement of your worth, says the template.'));
  }
  s.phase = 'admissions';
  effects(s, { energy: 18 });
  log(s, t('March. {offers} offer(s), {waitlists} waitlist(s), from {n} applications.', { offers: s.offers.length, waitlists: s.applications.filter(a => a.waitlisted).length, n: s.applications.length }));
  if (!s.offers.length && !s.applications.some(a => a.waitlisted)) finish(s, 'no_offer', t('Not This Cycle'), t('There were more qualified applicants than places. Your story can take another route. Or another seed.'));
}
export function waitForApril(s) {
  const wl = s.applications.filter(a => a.waitlisted && !a.resolved);
  if (!wl.length) throw new Error(t('Nothing is pending on a waitlist.'));
  for (const app of wl) {
    app.resolved = true;
    const school = schools.find(x => x.id === app.schoolId);
    if (roll(s, .35)) { app.accepted = true; app.waitlisted = false; app.status = 'admitted'; s.offers.push(school.id); app.funding = 'TA'; message(s, t('{school} Admissions', { school: school.name }), t('Offer from the waitlist — {school}', { school: school.name }), t('A spot has opened. Funding is a teaching assistantship. Please respond within 72 hours, which is how long the offer lasts and how long you will think about it.')); log(s, t('{school} came through from the waitlist. Someone else said no; you say thank you to a stranger.', { school: school.name })); }
    else { app.status = 'rejected'; message(s, t('{school} Admissions', { school: school.name }), t('Waitlist update — {school}', { school: school.name }), t('We are unable to offer admission this year. We wish you the best in your endeavors, a phrase we have never once meant unkindly.')); log(s, t('{school}: the waitlist did not move.', { school: school.name })); }
  }
  if (!s.offers.length) finish(s, 'no_offer', t('Not This Cycle'), t('The waitlists did not move. Your story can take another route. Or another seed.'));
}
export function visit(s, advisorId, questionId) {
  const a = s.advisors.find(x => x.id === advisorId);
  if (!a || !s.offers.includes(a.schoolId)) throw new Error(t('Visit days are for schools that admitted you.'));
  const key = `${advisorId}:visit`;
  const t = s.threads[key] || (s.threads[key] = { kind: 'visit', advisorId, schoolId: a.schoolId, messages: [{ from: 'them', text: tr('“Thanks for coming out. The weather is not usually like this.” The weather is exactly like this.') }], asked: [], done: false });
  const q = visitQuestions.find(x => x.id === questionId); if (!q) throw new Error(tr('Choose a question.'));
  if (t.asked.includes(q.id)) throw new Error(tr('Already asked.'));
  if (s.player.stats.energy < 3) throw new Error(tr('Not enough Energy. Visit days are long; the coffee is short.'));
  effects(s, { energy: -3 });
  t.asked.push(q.id);
  t.messages.push({ from: 'you', text: q.label });
  t.messages.push({ from: 'them', text: q.replies[q.select(a)] });
  if (q.reveal) { a.revealedTraits = [...(a.revealedTraits || []), q.reveal]; }
  if (t.asked.length >= 3) t.done = true;
  log(s, tr('Visit day at {school}: asked {name} about {topic}.', { school: schools.find(x => x.id === a.schoolId).name, name: lastName(a.name), topic: tr(q.id) }));
  return t;
}
export function askStudentVisit(s, advisorId) {
  const a = s.advisors.find(x => x.id === advisorId);
  if (!a || !s.offers.includes(a.schoolId)) throw new Error(t('You can only ask about advisors at schools that admitted you.'));
  if (a.revealed >= a.hints.length) throw new Error(t('The students have told you everything they are willing to say.'));
  if (s.player.stats.energy < 4) throw new Error(t('Not enough Energy to make small talk.'));
  effects(s, { energy: -4 });
  a.revealed++;
  log(s, t('A student in {name}’s lab: “{hint}”', { name: lastName(a.name), hint: t(a.hints[a.revealed - 1]) }));
}
