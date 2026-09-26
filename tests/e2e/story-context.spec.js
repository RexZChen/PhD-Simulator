import { test, expect } from '@playwright/test';
import { recoverySeed, resumeRecovery } from './recovery-helpers.js';

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);

for (const lang of ['en', 'zh']) {
  test(`an early saved mock oral cannot charge for an exam eleven months away in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await recoverySeed(page, { lang, critical: false });
    await page.evaluate(async () => {
      const { loadSave, saveRun } = await import('/src/engine/save.js');
      const { run: s, meta } = loadSave(localStorage);
      s.month = 9; s.week = 4; s.event = 'coursework_qual_morning';
      s.milestones.prelim = null; s.milestones.prelimMonth = 20;
      s.eventQueue = []; s.eventReturn = 'plan'; s.needsBegin = false;
      s.lastRoll = { label: 'Communication', value: 60, difficulty: 50, odds: 59, draw: 20, success: true };
      saveRun(localStorage, s, meta);
    });
    await resumeRecovery(page);
    await expect(page.getByRole('dialog')).toContainText(lang === 'zh' ? '模拟' : 'mock');
    const before = await saved(page);
    await page.locator('[data-action="choice"][data-id="honest"]').click();
    await expect(page.locator('[data-action="choice"], .roll-toast')).toHaveCount(0);
    await expect(page.locator('.plans')).toBeVisible();
    const after = await saved(page);
    for (const key of ['player', 'milestones', 'readiness', 'rng', 'month', 'week', 'seen']) {
      expect(after[key]).toEqual(before[key]);
    }
    expect(after.lastRoll).toBeNull();
  });

  test(`a late graduation conversation agrees a future date without booking a defense in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await recoverySeed(page, { lang, critical: false });
    await page.evaluate(async () => {
      const { loadSave, saveRun } = await import('/src/engine/save.js');
      const { run: s, meta } = loadSave(localStorage);
      s.month = 64; s.week = 0; s.stage = 'plan'; s.event = null;
      s.eventQueue = []; s.scheduled = []; s.needsBegin = false;
      s.counts.accepted = 3; s.readiness = 90;
      Object.assign(s.advisor, { caring: 100, toxicity: 0, ambition: 0 });
      Object.assign(s.relationship, { trust: 100, satisfaction: 100 });
      s.grad = null; s.thesis = null;
      saveRun(localStorage, s, meta);
    });
    await resumeRecovery(page);
    await page.locator('[data-action="ask-timeline"]').click();
    const panel = page.locator('.gradtalk');
    await expect(panel).toContainText(lang === 'zh' ? '2034年3月' : 'March 2034');
    await expect(panel).toContainText(lang === 'zh' ? '并非正式预约' : 'not a booking');
    expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const s = await saved(page);
    expect(s.grad.targetMonth).toBe(66); expect(s.grad.targetYear).toBe(6);
    expect(s.milestones.defenseMonth).toBeNull(); expect(s.milestones.graduated).toBe(false);
  });
}
