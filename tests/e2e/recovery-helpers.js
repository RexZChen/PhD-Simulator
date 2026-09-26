export async function resumeRecovery(page) {
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
  await page.locator('[data-action="wiz-next"]').click();
}

export async function recoverySeed(page, { lang = 'en', season = false, critical = true } = {}) {
  await page.goto(page.url().startsWith('http') ? new URL('/', page.url()).href : '/');
  await page.evaluate(async ({ lang, season, critical }) => {
    const { createRun } = await import('/src/engine/state.js');
    const { prepareRun, dispatch } = await import('/src/engine/game.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = prepareRun(createRun(842, { background: 'masters', topic: 'ml', international: false, household: 'alone' }));
    const a = s.advisors[0];
    s.phase = 'admissions'; s.offers = [a.schoolId];
    s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: a.id });
    s = dispatch(s, { type: 'START_PROJECT' });
    s.month = season ? 28 : 16; s.week = 0;
    s.stage = season ? 'plan' : 'event'; s.event = season ? null : 'ambulance';
    s.eventVariant = 0; s.eventQueue = []; s.eventReturn = 'plan';
    s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass'; s.milestones.defenseMonth = null;
    s.player.stats.health = critical ? 10 : 90;
    s.player.stats.energy = critical ? 50 : 90;
    s.player.stats.money = season ? 50000 : 40; s.debt = 0;
    s.player.hidden.stress = critical ? 40 : 10;
    s.standing = 90; s.player.stats.hope = 90; s.relationship.satisfaction = 80;
    s.advisor.funding = 100; s.pressure = 20; s.crisis = null; s.lastCrisisMonth = -99;
    if (season) s.advisor.ambition = 0; // Isolate care/calendar behavior from a newly issued request.
    s.conditions = []; s.requests = []; s.weekLog = []; s.burnoutMonths = 0;
    s.pace = season ? 'auto' : 'month'; s.tempo = season ? 'season' : 'month';
    s.focus = 'research'; s.summons = { answered: true, keep: 1 };
    s.insurance.deductibleLeft = 300;
    s.report = { before: { stats: { ...s.player.stats }, stress: s.player.hidden.stress,
      relationship: { ...s.relationship }, coursework: s.coursework, readiness: s.readiness,
      career: s.career, debt: s.debt, projects: { [s.projects[0].id]: { progress: s.projects[0].progress, draft: s.projects[0].draft } } },
      month: s.month, events: [], weeks: [], days: [], monthsCovered: 1 };
    const meta = emptyMeta();
    Object.assign(meta.settings, { tips: false, lang, textSize: 3, quiet: true, sound: false, selfPaced: true });
    saveRun(localStorage, s, meta);
  }, { lang, season, critical });
  await resumeRecovery(page);
}
