import { test, expect } from '@playwright/test';

// Vite may append a timestamp after a source edit while this shared server stays up.
const gameScript = '**/src/main.js*';

test('a slow first download shows the welcome fallback until the game starts', async ({ page }) => {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  let requested = false;
  await page.route(gameScript, async route => { requested = true; await held; await route.continue(); });
  await page.goto('/', { waitUntil: 'commit' });
  try {
    await expect(page.locator('#startup')).toBeVisible({ timeout: 1500 });
    await expect(page.locator('#startup-status')).toContainText('Starting your workspace');
    await expect(page.locator('#startup-status [lang="zh-CN"]')).toBeVisible();
    await expect(page.locator('#startup-error')).toBeHidden();
    await expect(page.locator('#startup-retry')).toBeHidden();
    await expect.poll(() => requested).toBe(true);
  } finally { release(); }
  await expect(page.locator('.wizard-page')).toBeVisible();
  await expect(page.locator('#startup')).toHaveCount(0);
  // A later gameplay exception must never resurrect the startup interface.
  await page.evaluate(() => window.dispatchEvent(new ErrorEvent('error', { message: 'after startup' })));
  await expect(page.locator('#startup')).toHaveCount(0);
});

test('a failed game download explains the problem and retry keeps browser saves', async ({ page }) => {
  await page.route(gameScript, route => route.abort('failed'));
  await page.goto('/');
  await expect(page.locator('#startup-error')).toBeVisible({ timeout: 1500 });
  await expect(page.locator('#startup-error')).toContainText('could not start');
  await expect(page.locator('#startup-error').getByText('Academic OS 未能启动。', { exact: true })).toBeVisible();
  await expect(page.locator('#startup-status')).toBeHidden();
  // Set after navigation so an initialization script cannot restore a deleted value.
  const original = '{"version":999,"run":{"name":"Preserve my original"}}';
  await page.evaluate(raw => localStorage.setItem('phdsim.academic-os.v2', raw), original);
  await page.unroute(gameScript);
  await page.getByRole('button', { name: 'Try again / 重试' }).click();
  await expect(page.locator('.wizard-page')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('phdsim.academic-os.v2'))).toBe(original);
});

test('an initialization exception offers the same startup recovery', async ({ page }) => {
  await page.route(gameScript, route => route.fulfill({
    contentType: 'application/javascript', body: 'throw new Error("startup test failure");',
  }));
  await page.goto('/');
  await expect(page.locator('#startup-error')).toBeVisible({ timeout: 1500 });
  await expect(page.getByRole('button', { name: 'Try again / 重试' })).toBeVisible();
});

test('disabled JavaScript explains how to start without pretending to load', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(baseURL);
    await expect(page.locator('#startup-noscript')).toBeVisible({ timeout: 1500 });
    await expect(page.locator('#startup-noscript')).toContainText('JavaScript is turned off');
    await expect(page.locator('#startup-status')).toBeHidden();
    await expect(page.locator('#startup-error')).toBeHidden();
  } finally { await context.close(); }
});
