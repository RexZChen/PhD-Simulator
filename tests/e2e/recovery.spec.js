import { test, expect } from '@playwright/test';
import { recoverySeed, resumeRecovery } from './recovery-helpers.js';
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);

for (const lang of ['en', 'zh']) {
  test(`recovery has an honest quote, survives reload, and spends leave instead of research in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await recoverySeed(page, { lang });
    const quote = page.locator('.recovery-terms');
    await expect(quote).toContainText('$240'); await expect(quote).toContainText('$200');
    expect(await quote.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const before = await saved(page);
    await page.locator('[data-action="choice"][data-id="recover"]').click();
    await expect(page.locator('.recovery-status')).toContainText('20');
    await expect(page.locator('.plans [data-id="recovery"]')).toBeVisible();
    const after = await saved(page);
    expect(after.phase).toBe('playing'); expect(after.leaveWeeks).toBe(4);
    expect(after.player.stats.money).toBe(0); expect(after.debt).toBe(200);
    await resumeRecovery(page);
    await expect(page.locator('.recovery-status')).toContainText('20');
    await page.locator('.topstrip [data-action="continue"]').click();
    const used = await saved(page);
    expect(used.leaveWeeks).toBe(0);
    expect(used.projects[0].progress).toBe(before.projects[0].progress);
    expect(used.projects[0].draft).toBe(before.projects[0].draft);
    expect(used.report.meetings).toMatchObject({ held: 0, expected: 0, present: false });
    expect(used.phase).toBe('playing');
  });
}

test('fast-forward pauses at a crisis in its real month and resumes after care', async ({ page }) => {
  await recoverySeed(page, { season: true, critical: true });
  const before = await saved(page);
  await page.locator('.topstrip [data-action="continue"]').click();
  await expect(page.locator('.dialog.crisis')).toBeVisible();
  const paused = await saved(page);
  expect(paused.month).toBe(before.month + 1);
  expect(paused.lastSeasonReport.monthsCovered).toBe(1);
  expect(paused.crisis.resolved).toBe(false);
  await resumeRecovery(page);
  await expect(page.locator('.dialog.crisis')).toBeVisible();
  await page.locator('[data-action="crisis"][data-id="treat"]').click();
  await expect(page.locator('.dialog.crisis')).toHaveCount(0);
  await expect(page.locator('.recovery-status')).toContainText('10');
  expect((await saved(page)).month).toBe(paused.month);
});

test('a healthy fast-forward produces one report with matching dates and one remaining month to advance', async ({ page }) => {
  await recoverySeed(page, { season: true, critical: false });
  const before = await saved(page);
  await page.locator('.topstrip [data-action="continue"]').click();
  const completed = await saved(page);
  expect(completed.month).toBe(before.month + 2);
  // These are authored choices; the test deliberately chooses an available continuing option.
  for (let i = 0; i < 12 && await page.locator('[data-action="choice"]').count(); i++) {
    const id = await page.evaluate(async () => {
      const { templateById, choiceUnavailable } = await import('/src/engine/events.js');
      const s = JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run;
      return templateById[s.event].choices.find(c => !c.ending && !c.minigame && !choiceUnavailable(s, c)).id;
    });
    await page.locator(`[data-action="choice"][data-id="${id}"]`).click();
  }
  await expect(page.getByRole('dialog')).toContainText('January 2031');
  await expect(page.getByRole('dialog')).toContainText('March 2031');
  await expect(page.locator('[data-action="dismiss-report"]')).toContainText('April 2031');
  await page.locator('[data-action="dismiss-report"]').click();
  expect((await saved(page)).month).toBe(before.month + 3);
});
