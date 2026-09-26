import { resumeRecovery } from './recovery-helpers.js';
export { resumeRecovery as resumeSupervision };

export async function supervisionSeed(page, { lang = 'en', branch = 'retirement', accepted = true } = {}) {
  await page.goto(page.url().startsWith('http') ? new URL('/', page.url()).href : '/');
  await page.evaluate(async ({ lang, branch, accepted }) => {
    const { createRun } = await import('/src/engine/state.js');
    const { prepareRun, dispatch } = await import('/src/engine/game.js');
    const { openNext } = await import('/src/engine/events.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = prepareRun(createRun(842, { background: 'masters', topic: 'ml', international: false, household: 'alone' }));
    const a = s.advisors[0];
    s.phase = 'admissions'; s.offers = [a.schoolId];
    s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: a.id });
    s = dispatch(s, { type: 'START_PROJECT' });
    s.month = branch === 'retirement' ? 28 : 27; s.week = 0;
    s.event = null; s.eventReturn = 'plan'; s.stage = 'plan'; s.eventQueue = []; s.scheduled = [];
    s.advisor.stage = branch === 'retirement' ? 'late' : 'pre_tenure';
    Object.assign(s.player.stats, { health: 90, energy: 90, money: 30000, hope: 90 });
    s.player.hidden.stress = 10; s.standing = 90; s.relationship.satisfaction = accepted ? 100 : 0; s.relationship.trust = 80;
    s.advisor.funding = 100; s.pressure = 20; s.crisis = null; s.lastCrisisMonth = -99;
    s.conditions = []; s.requests = []; s.burnoutMonths = 0; s.pace = 'month'; s.tempo = 'month'; s.focus = 'research';
    s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass'; s.milestones.defenseMonth = null;
    s.projects[0].progress = 40; s.projects[0].draft = 20;
    s.report = { before: { stats: { ...s.player.stats }, stress: s.player.hidden.stress,
      relationship: { ...s.relationship }, coursework: s.coursework, readiness: s.readiness,
      career: s.career, debt: s.debt, projects: { [s.projects[0].id]: { progress: 40, draft: 20 } } },
      month: s.month, events: [], weeks: [], days: [], monthsCovered: 1 };
    s.eventQueue = [branch === 'retirement' ? 'advisor_retires' : 'advisor_tenure_denied'];
    openNext(s); s.rng = 1;
    if (branch === 'departure') {
      s = dispatch(s, { type: 'CHOICE', id: 'follow' });
      s.month = 39; s.week = 0; s.stage = 'plan'; s.event = null; s.eventQueue = ['advisor_leaves'];
      openNext(s);
    }
    const meta = emptyMeta();
    Object.assign(meta.settings, { tips: false, lang, textSize: 3, quiet: true, sound: false, selfPaced: true });
    saveRun(localStorage, s, meta);
  }, { lang, branch, accepted });
  await resumeRecovery(page);
}
