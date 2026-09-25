import { test, expect } from '@playwright/test';

async function openManager(page, { width = 1440, height = 900, textSize = 1, patent = false, consecutiveScenes = false } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto('/');
  await page.evaluate(async ({ textSize, patent, consecutiveScenes }) => {
    const { createRun } = await import('/src/engine/state.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { schools } = await import('/src/data/catalog.js');
    const { createProject } = await import('/src/engine/paper.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    localStorage.clear();
    let s = createRun(9001, { background: 'masters', topic: 'ml', international: false });
    const advisor = s.advisors.find(a => a.schoolId === schools[3].id);
    s.phase = 'admissions'; s.offers = [schools[3].id];
    s.applications = [{ schoolId: schools[3].id, effort: 'tailored', poiId: advisor.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: advisor.id });
    createProject(s);
    s.event = null; s.eventQueue = []; s.stage = 'plan'; s.focus = null;
    if (patent) {
      const { openPatent } = await import('/src/engine/patent.js');
      openPatent(s, s.projects[0].id);
      s.player.stats.energy = 3;
    }
    if (consecutiveScenes) {
      s.event = 'labmate_help'; s.eventQueue = ['labmate_needs_help'];
      s.stage = 'event'; s.eventReturn = 'plan'; s.eventVariant = 0;
    }
    const meta = emptyMeta();
    meta.settings.tips = false; meta.settings.lang = 'en'; meta.settings.textSize = textSize;
    saveRun(localStorage, s, meta);
  }, { textSize, patent, consecutiveScenes });
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('[data-action="wiz-next"]').click();
}

test('mobile vitals and desktop shortcuts remain readable inside their containers', async ({ page }, testInfo) => {
  await openManager(page, { width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath('mobile-manager.png') });
  const layout = await page.evaluate(() => {
    const vitals = document.querySelector('.vitals-mini');
    const pane = vitals.closest('.pane');
    return {
      vitalsClipped: pane.scrollWidth > pane.clientWidth + 1,
      iconWidths: [...document.querySelectorAll('.desk-icon')].map(el => el.getBoundingClientRect().width),
      clientOverflow: document.querySelector('.client').scrollWidth - document.querySelector('.client').clientWidth,
    };
  });
  expect.soft(layout.vitalsClipped).toBe(false);
  expect.soft(Math.min(...layout.iconWidths)).toBeGreaterThanOrEqual(60);
  expect(layout.clientOverflow).toBeLessThanOrEqual(1);
});

test('mobile story dialogs fit the viewport with large text', async ({ page }, testInfo) => {
  await openManager(page, { width: 390, height: 667, textSize: 4 });
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('.start-menu [data-action="tips"]').click();
  await page.screenshot({ path: testInfo.outputPath('mobile-dialog.png') });
  const bounds = await page.locator('.modal .dialog').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(667);
});

test('action errors stay visible during a story dialog', async ({ page }) => {
  await openManager(page, { patent: true });
  await page.locator('[data-action="patent-meet"][data-id="plain"]').click();
  await expect(page.getByRole('alert')).toContainText('Not enough Energy.');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('#pat-title')).toContainText('understand the invention');
});

test('a new scene opens at the beginning even when its window title stays the same', async ({ page }) => {
  await openManager(page, { width: 390, height: 500, textSize: 4, consecutiveScenes: true });
  const title = await page.locator('.dialog .titlebar').textContent();
  await expect(page.locator('.scene-progress')).toContainText('1 more scene');
  const caption = await page.locator('.dialog .scene-caption').boundingBox();
  const illustration = await page.locator('.dialog .meme').boundingBox();
  expect(caption.y + caption.height).toBeLessThanOrEqual(illustration.y);
  await page.locator('[data-action="choice"][data-id="acknowledge"]').scrollIntoViewIfNeeded();
  expect(await page.locator('.dialog .body').evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await page.locator('[data-action="choice"][data-id="acknowledge"]').click();
  await expect(page.locator('#scene-title')).toContainText('has a deadline');
  await expect(page.locator('.dialog .titlebar')).toHaveText(title);
  expect(await page.locator('.dialog .body').evaluate(el => el.scrollTop)).toBe(0);
  await expect(page.locator('.scene-progress')).toContainText('Back to your desk');
});

test('guidance leads into a turn and optional panels stay open when a plan changes', async ({ page }, testInfo) => {
  await openManager(page);
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect(page.locator('.manager-next')).toContainText('Suggested: Research');
  await page.screenshot({ path: testInfo.outputPath('desktop-manager.png') });
  await page.locator('[data-detail="manager-advisor"] > summary').click();
  await page.locator('[data-plan-suggestion]').click();
  await expect(page.locator('[data-detail="manager-advisor"]')).toHaveAttribute('open', '');
  await expect(page.locator('.manager-next')).toContainText('Research selected');
  await page.locator('[data-action="continue"][data-guide]').click();
  for (let count = 0; count < 30; count++) {
    const dialog = page.locator('.modal .dialog').last();
    await expect(dialog).toBeVisible();
    if (await dialog.locator('[data-action="dismiss-report"]').count()) break;
    // Follow the visible story choices until the turn's summary arrives.
    const choices = dialog.locator('[data-action="choice"]:enabled, [data-action="pushback"]:enabled, [data-action="summons"]:enabled');
    if (await dialog.locator('#scene-title').count()) {
      await expect(dialog.locator('.scene-progress')).toBeVisible();
      await expect(dialog.locator('.choice .pill')).toHaveCount(0);
      await expect(dialog.locator('[data-detail="scene-effects"]')).not.toHaveAttribute('open');
    }
    await expect(choices.first()).toBeVisible();
    await choices.first().click();
    await expect(page.locator('.balloon:visible, .award-toast:visible')).toHaveCount(0);
  }
  await expect(page.locator('.glance')).toBeVisible();
  await expect(page.locator('[data-detail="report-stats"]')).not.toHaveAttribute('open');
  await page.screenshot({ path: testInfo.outputPath('monthly-report.png') });
  await page.locator('[data-action="dismiss-report"]').click();
  await expect(page.locator('.manager-next')).toBeVisible();
  await expect(page.locator('.manager h1')).toContainText('October');
});

test('following preparation guidance advances to Programs without leaving the player on an old tab', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Randomize My Academic Fate/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  await page.check('#eula');
  await page.locator('[data-action="wiz-next"]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await page.locator('.guide [data-action="prep"][data-id="sop_draft"]').click();
  await page.locator('.guide [data-action="application-jump"][data-id="letters"]').click();
  await expect(page.locator('[data-application-section="letters"]')).toBeFocused();
  await page.locator('[data-action="prep"][data-id="letter_ask"]').first().click();
  await page.locator('[data-action="prep"][data-id="proceed"]:not([data-guide])').click();
  await expect(page.getByRole('heading', { name: 'GradApply — Programs' })).toBeVisible();
  await page.locator('[data-action="ga-tab"][data-id="prep"]').click();
  await expect(page.locator('.guide')).toContainText('You are reviewing an earlier step');
  await page.locator('.guide [data-action="ga-tab"][data-id="application"]').click();
  await expect(page.getByRole('heading', { name: 'GradApply — Programs' })).toBeVisible();
});
