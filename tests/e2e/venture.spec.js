import { test, expect } from '@playwright/test';
import { resumeRecovery } from './recovery-helpers.js';
import { ventureSeed } from './venture-helpers.js';
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);
const fits = async locator => expect(await locator.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);


for (const lang of ['en', 'zh']) {
  test(`${lang}: failed cap negotiation retains visible 40 percent after reload and degree-first or board choice preserves unfinished degree`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await ventureSeed(page, lang);
    await fits(page.getByRole('dialog'));
    await expect(page.locator('.venture-shares').first()).toContainText('40%');
    await page.locator('[data-action="choice"][data-id="advisor"]').click();
    const agreed = await saved(page);
    expect(agreed.lastRoll.success).toBe(false);
    expect(agreed.venture.terms.shares).toEqual({ you: 40, advisor: 20, university: 15, cofounder: 25 });
    await resumeRecovery(page);
    const status = page.locator('.venture-status');
    await status.locator('summary').click();
    await expect(status.locator('.venture-shares')).toContainText('40%');
    await expect(status).toContainText(lang === 'zh' ? '目前没有薪酬承诺' : 'No salary is committed.');
    await fits(status);
    await page.evaluate(async () => {
      const { loadSave, saveRun } = await import('/src/engine/save.js');
      const { run, meta } = loadSave(localStorage);
      run.month = 52; run.stage = 'event'; run.event = 'spin_decide'; run.eventVariant = 0;
      saveRun(localStorage, run, meta);
    });
    await resumeRecovery(page);
    const before = await saved(page);
    await fits(page.getByRole('dialog'));
    await page.locator(`[data-action="choice"][data-id="${lang === 'en' ? 'finish' : 'board'}"]`).click();
    const after = await saved(page);
    expect(after.phase).toBe('playing'); expect(after.milestones.graduated).not.toBe(true);
    expect(after.player.stats.money).toBe(before.player.stats.money);
    expect(after.venture.commitment).toBe(lang === 'en' ? 'thesis-first' : 'board');
    await expect(status).toContainText(lang === 'en' ? 'Company tasks paused' : '董事职务');
    await fits(status);
  });

  test(`${lang}: postdeposit spinout shows exact equity without salary and can be declined without another job`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await ventureSeed(page, lang, true);
    const before = await saved(page);
    const venture = before.jobs.market.find(o => o.venture);
    const alternative = before.jobs.market.find(o => o.kind === 'unplaced');
    expect(venture.salary).toBe(0); expect(alternative).toBeTruthy();
    await page.locator('[data-action="cv-all"]').click();
    const card = page.locator(`[data-action="take-offer"][data-id="${venture.employerId}"]`);
    await expect(card).toContainText('40%');
    await expect(card).toContainText(lang === 'en' ? 'No salary is committed' : '尚无薪酬承诺');
    await fits(card);
    const fallback = page.locator(`[data-action="take-offer"][data-id="${alternative.employerId}"]`);
    await expect(fallback).toContainText(lang === 'en' ? 'your apartment, your inbox' : '你的公寓、你的收件箱');
    await expect(fallback).toContainText(lang === 'en' ? 'The hiring calendar does not move when you finish' : '招聘日历不会因为你毕业就往前挪');
    await expect(page.locator('.cv')).toContainText(lang === 'en' ? 'M.S., research thesis' : '硕士，研究型学位论文');
    await expect(page.locator('.cv')).toContainText(lang === 'en' ? 'Ph.D.,' : '博士，');
    const viewed = await saved(page);
    expect(viewed.rng).toBe(before.rng);
    expect(viewed.jobs.market).toEqual(before.jobs.market);
    await page.locator(`[data-action="take-offer"][data-id="${alternative.employerId}"]`).click();
    const after = await saved(page);
    expect(after.jobs.chosen).toBe('unplaced'); expect(after.venture.commitment).toBe('declined');
    expect(after.venture.joinedMonth).toBeNull(); expect(after.player.stats.money).toBe(before.player.stats.money);
  });
}
