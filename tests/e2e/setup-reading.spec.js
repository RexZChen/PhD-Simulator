import { test, expect } from '@playwright/test';

for (const lang of ['en', 'zh']) test(`${lang}: setup keeps its short notice and full disclaimer readable on a small phone`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/');
  await page.locator('.boot').click();
  await page.locator(`[data-action="language"][data-id="${lang}"]`).click();
  await page.locator('[data-action="wiz-choice"][data-id="new"]').click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'A+', exact: true }).click();
  await page.locator('[data-action="wiz-next"]').click();
  const next = page.locator('[data-action="wiz-next"]');
  await expect(page.getByRole('heading', { name: lang === 'en' ? 'Before you begin' : '开始之前' })).toBeVisible();
  await expect(next).toBeDisabled();
  const disclosure = page.locator('.setup-disclaimer');
  await expect(disclosure.locator('p')).toBeHidden();
  await disclosure.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(disclosure.locator('p')).toBeVisible();
  expect(await page.locator('.wizard-page').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.locator('#eula').focus();
  await page.keyboard.press('Space');
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.locator('input[name="name"]')).toBeVisible();
});
