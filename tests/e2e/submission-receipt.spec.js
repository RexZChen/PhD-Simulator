import { test, expect } from '@playwright/test';
import { recoverySeed, resumeRecovery } from './recovery-helpers.js';

for (const lang of ['en', 'zh']) {
  test(`submission keeps its receipt visible when planning selects another paper in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await recoverySeed(page, { lang, critical: false });
    await page.evaluate(async () => {
      const { loadSave, saveRun } = await import('/src/engine/save.js');
      const { createProject } = await import('/src/engine/paper.js');
      const { crunchSnapshot } = await import('/src/engine/time.js');
      const { run: s, meta } = loadSave(localStorage);
      Object.assign(s, { month: 10, week: 0, stage: 'plan', event: null, eventQueue: [], scheduled: [], needsBegin: false, projects: [] });
      const main = createProject(s), side = createProject(s, { kind: 'side' });
      Object.assign(main, { title: 'The paper we submitted', status: 'Ready', progress: 60, draft: 80, venueId: 'aaaight', wizardStep: 4 });
      Object.assign(side, { title: 'The paper we work on next', progress: 45, draft: 0, targetVenueId: 'aaaight', targetVenue: 'AAAIght', targetMonth: 10 });
      s.activeProjectId = main.id; s.crunch = crunchSnapshot(s); s.tempo = 'week';
      saveRun(localStorage, s, meta);
    });
    await resumeRecovery(page);
    await page.locator('.desk-icon[data-app="browser"]').click();
    await page.locator('.tabs [data-action="browser-tab"][data-id="openregret"]').click();
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);
    await page.locator('[data-action="submit"]').focus();
    await page.keyboard.press('Enter');
    const receipt = page.locator('[data-submission-receipt]');
    await expect(receipt).toBeVisible();
    await expect(receipt).toBeFocused();
    await expect(receipt).toContainText('The paper we submitted');
    await expect(receipt).toContainText('AAAIght');
    await expect(receipt).toContainText(lang === 'zh' ? '2029年10月' : 'October 2029');
    expect(await receipt.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);
    expect(after.projects.find(p => p.id === after.activeProjectId).title).toBe('The paper we work on next');
    expect(after.player.stats.energy).toBe(before.player.stats.energy - 4);
    expect([after.month, after.week]).toEqual([before.month, before.week]);
    await page.locator('[data-action="receipt-plan"]').click();
    await expect(page.locator('.plans')).toBeVisible();
    await page.locator('.desk-icon[data-app="browser"]').click();
    await expect(receipt).toHaveCount(0);
    await page.getByRole('button', { name: 'The paper we submitted', exact: true }).click();
    await expect(page.locator('.pipeline')).toContainText(lang === 'zh' ? '已提交' : 'Submitted');
    await expect(page.getByRole('group', { name: lang === 'zh' ? '投稿记录' : 'Submission history' })).toContainText('AAAIght');
    await page.reload();
    await page.locator('.boot').click();
    await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
    await page.locator('[data-action="wiz-next"]').click();
    const reloaded = await page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);
    expect(reloaded.projects.find(p => p.title === 'The paper we submitted').submissionHistory).toHaveLength(1);
  });
}
