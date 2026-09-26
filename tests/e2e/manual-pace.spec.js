import { test, expect } from '@playwright/test';

for (const lang of ['en', 'zh']) test(`calm week keeps ordinary activities and allows a closer day (${lang})`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(async lang => {
    const { createRun } = await import('/src/engine/state.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { createProject } = await import('/src/engine/paper.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = createRun(731, { background: 'masters', topic: 'ml', international: false });
    const a = s.advisors[0];
    s.phase = 'admissions'; s.offers = [a.schoolId];
    s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: a.id });
    const p = createProject(s);
    Object.assign(p, { status: 'Advisor Review', reviewDueWeek: 40, targetMonth: 10, targetVenueId: 'aaaight', targetVenue: 'AAAIght' });
    Object.assign(s, { month: 7, week: 0, stage: 'plan', event: null, eventQueue: [], scheduled: [], needsBegin: false, requests: [] });
    s.summons = { answered: true };
    // A save from the old weekly menu may still have its obsolete sleep sprint selected.
    s.flags.zoomMonth = s.month; s.crunch = { type: 'zoom' }; s.tempo = 'week'; s.focus = 'sleep';
    const meta = emptyMeta();
    Object.assign(meta.settings, { lang, quiet: true, tips: false, textSize: 3, selfPaced: true, untimedChoices: true });
    saveRun(localStorage, s, meta);
  }, lang);
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
  await page.locator('[data-action="wiz-next"]').click();
  await expect(page.locator('.topstrip [data-action="continue"]')).toBeDisabled();
  await page.locator('[data-action="set-pace"][data-id="week"]').click();
  await expect(page.locator('.topstrip')).toContainText(lang === 'zh' ? '本次计划只占用一周' : 'This plan covers one week');
  await expect(page.locator('.topstrip .tag.crunch')).toHaveCount(0);
  for (const id of ['coursework', 'career', 'network', 'rest']) await expect(page.locator(`[data-action="plan"][data-id="${id}"]`)).toBeEnabled();
  await page.locator('[data-action="set-pace"][data-id="day"]').click();
  await expect(page.locator('.topstrip')).toContainText(lang === 'zh' ? '本次计划只占用一个工作日' : 'This plan covers one working day');
  await page.locator('[data-action="plan"][data-id="career"]').click();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);
  await page.locator('.topstrip [data-action="continue"]').click();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);
  expect(after.career - before.career).toBeCloseTo(17 / 20);
  expect([after.month, after.week, after.dayIndex]).toEqual([7, 0, 1]);
  expect(after.player.stats.money).toBe(before.player.stats.money);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
