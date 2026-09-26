import { test, expect } from '@playwright/test';
import { supervisionSeed, resumeSupervision } from './supervision-helpers.js';

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);
const fits = async locator => expect(await locator.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);

for (const lang of ['en', 'zh']) {
  test(`emeritus consultation changes actual work and stays used after reload in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await supervisionSeed(page, { lang });
    const before = await saved(page);
    const choice = page.locator('[data-action="choice"][data-id="coadvise"]');
    await expect(choice).toContainText(lang === 'zh' ? '4点精力' : '4 Energy');
    await fits(page.getByRole('dialog'));
    await choice.click();
    const agreed = await saved(page);
    expect(agreed.advisor.id).not.toBe(before.advisor.id);
    expect(agreed.supervision.mentor.id).toBe(before.advisor.id);
    const status = page.locator('.supervision-status');
    await expect(status).toContainText(agreed.advisor.name);
    await expect(status).toContainText(before.advisor.name);
    await fits(status);
    await page.locator('[data-action="emeritus-consult"]').click();
    const consulted = await saved(page);
    expect(consulted.player.stats.energy).toBe(agreed.player.stats.energy - 4);
    expect(consulted.readiness).toBe(agreed.readiness + 3);
    const project = s => s.projects.find(p => p.id === s.activeProjectId);
    expect(project(consulted).progress).toBe(project(agreed).progress + 4);
    await resumeSupervision(page);
    await expect(page.locator('[data-action="emeritus-consult"]')).toBeDisabled();
    await expect(status).toContainText(lang === 'zh' ? '下个月' : 'next month');
    expect((await saved(page)).supervision.lastConsultMonth).toBe(before.month);
  });

  test(`handover terms identify the retained project and exact support months in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await supervisionSeed(page, { lang });
    const before = await saved(page);
    const choice = page.locator('[data-action="choice"][data-id="inherit_lab"]');
    await expect(choice).toContainText('$3,900');
    await expect(choice).toContainText(lang === 'zh' ? '维护每月消耗4点精力' : 'Maintenance: −4 Energy');
    await choice.click();
    const signed = await saved(page);
    expect(signed.supervision.projectId).toBe(before.activeProjectId);
    expect(signed.supervision.from).toBe(before.month + 1);
    expect(signed.supervision.until).toBe(before.month + 4);
    await resumeSupervision(page);
    const status = page.locator('.supervision-status');
    await expect(status).toContainText(before.projects.find(p => p.id === before.activeProjectId).title);
    await expect(status).toContainText(lang === 'zh' ? '2031年2月至2031年4月' : 'February 2031 through April 2031');
    await fits(status);
    expect((await saved(page)).supervision).toEqual(signed.supervision);
  });

  test(`denial gives a dated year of notice without charging for an unarranged move in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await supervisionSeed(page, { lang, branch: 'denial' });
    const before = await saved(page);
    await expect(page.locator('.tenure-scene-notice')).toContainText(lang === 'zh' ? '还剩12个月' : '12 months remaining');
    await expect(page.locator('.meme')).toHaveCount(0);
    await fits(page.getByRole('dialog'));
    await page.locator('[data-action="choice"][data-id="follow"]').click();
    const after = await saved(page);
    expect(after.advisorTenure.departureMonth).toBe(after.month + 12);
    expect(after.advisorTenure.response).toBe('follow');
    expect(after.pendingRelocation).toBeFalsy();
    expect(after.program.id).toBe(before.program.id);
    expect(after.player.stats.money).toBe(before.player.stats.money);
    await resumeSupervision(page);
    const status = page.locator('.supervision-status');
    await expect(status).toContainText(lang === 'zh' ? '尚未安排转校' : 'No transfer is arranged');
    await expect(status).toContainText(lang === 'zh' ? '2031年12月' : 'December 2031');
    await fits(status);
  });

  test(`the end of the notice offers a real transfer or a local successor in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await supervisionSeed(page, { lang, branch: 'departure' });
    const before = await saved(page);
    expect(before.month).toBe(before.advisorTenure.departureMonth);
    await expect(page.locator('.relocation-terms')).toContainText('$1,600');
    await fits(page.getByRole('dialog'));
    await page.locator('[data-action="choice"][data-id="stay"]').click();
    const after = await saved(page);
    expect(after.advisor.id).not.toBe(before.advisor.id);
    expect(after.program.id).toBe(before.program.id);
    expect(after.advisorTenure).toBeUndefined();
    expect(after.advisorTenureHistory.at(-1).status).toBe('resolved');
    expect(after.player.stats.money).toBe(before.player.stats.money);
    await expect(page.locator('.tenure-scene-notice')).toHaveCount(0);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });
}
