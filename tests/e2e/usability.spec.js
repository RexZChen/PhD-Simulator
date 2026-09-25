import { test, expect } from '@playwright/test';

async function openManager(page, { width = 1440, height = 900, textSize = 1, patent = false, consecutiveScenes = false, paperStatus = null, request = false } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto('/');
  await page.evaluate(async ({ textSize, patent, consecutiveScenes, paperStatus, request }) => {
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
    const paper = createProject(s);
    if (paperStatus) Object.assign(paper, { status: paperStatus, progress: 60, draft: 80 });
    if (request) {
      const { requests } = await import('/src/data/requests.js');
      const tpl = requests[0];
      s.requests = [{ id: 'test-request', templateId: tpl.id, kind: tpl.kind, text: tpl.text[0], status: 'open', dueWeek: 1 }];
    }
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
  }, { textSize, patent, consecutiveScenes, paperStatus, request });
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

async function finishTurn(page) {
  for (let count = 0; count < 30; count++) {
    const dialog = page.locator('.modal .dialog').last();
    if (!await dialog.count()) break;
    const choices = dialog.locator('[data-action="choice"]:enabled, [data-action="pushback"]:enabled, [data-action="summons"]:enabled');
    await expect(dialog.locator('[data-scene-timer]')).toHaveCount(0);
    await expect(choices.first()).toBeVisible();
    await choices.first().click();
    await expect(page.locator('.balloon:visible, .award-toast:visible')).toHaveCount(0);
  }
  await expect(page.locator('.modal')).toHaveCount(0);
}

test('one click spends a turn and its result returns to the desk without a report popup', async ({ page }, testInfo) => {
  await openManager(page);
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect(page.locator('.turn-choice.suggested')).toContainText('Move the research forward');
  await page.screenshot({ path: testInfo.outputPath('desktop-desk.png') });
  await page.locator('[data-action="play-turn"][data-id="work"]').click();
  await finishTurn(page);
  await expect(page.locator('.desk-receipt')).toBeVisible();
  await expect(page.locator('.desk-heading')).toContainText('October');
  await expect(page.locator('.desk-receipt')).toContainText('Research +');
  await page.screenshot({ path: testInfo.outputPath('turn-result.png') });
});

test('Enter activates the focused recovery choice instead of an unrelated default action', async ({ page }) => {
  await openManager(page);
  await page.locator('[data-action="play-turn"][data-id="recover"]').focus();
  await page.keyboard.press('Enter');
  await finishTurn(page);
  await expect(page.locator('.desk-receipt')).toContainText('Rest');
});

test('the short application flow previews costs and applies the selected slate', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Randomize My Academic Fate/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  await page.check('#eula');
  await page.locator('[data-action="wiz-next"]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await page.locator('[data-action="prep-statement"][data-id="basic"]').click();
  for (let i = 0; i < 3; i++) await page.locator('[data-action="prep"][data-id="letter_ask"]:enabled').first().click();
  await page.screenshot({ path: testInfo.outputPath('application-ready.png') });
  await page.locator('[data-action="prep"][data-id="proceed"]').click();
  await expect(page.getByRole('heading', { name: 'Where will you send the file?' })).toBeVisible();
  await page.locator('[data-action="ga-tab"][data-id="prep"]').click();
  await expect(page.locator('.guide')).toContainText('You are reviewing an earlier step');
  await expect(page.locator('[data-action="prep-statement"]')).toHaveCount(0);
  await page.locator('.guide [data-action="ga-tab"][data-id="application"]').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.application-shortlist > div')).toHaveCount(6);
  expect(await page.locator('.client').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath('mobile-shortlist.png') });
  await page.locator('[data-action="apply-slate"]').click();
  await finishTurn(page);
  await expect(page.locator('.application-focus')).toContainText('6 application(s) prepared');
  await page.locator('[data-action="admissions"]').click();
  await expect(page.getByRole('heading', { name: 'GradApply — Status' })).toBeVisible();
});

test('an advisor request queues the chosen turn and answering it resumes that turn once', async ({ page }) => {
  await openManager(page, { request: true });
  await page.locator('[data-action="play-turn"][data-id="recover"]').click();
  await expect(page.locator('.desk-pending')).toBeVisible();
  await expect(page.locator('.desk-heading')).toContainText('September');
  await page.locator('[data-action="req-do"]').click();
  await finishTurn(page);
  await expect(page.locator('.desk-pending')).toHaveCount(0);
  await expect(page.locator('.desk-receipt')).toContainText('Rest');
  await expect(page.locator('.desk-heading')).toContainText('October');
});

test('an approved paper submits from the desk; a manuscript with the advisor does not offer writing', async ({ page }) => {
  await openManager(page, { paperStatus: 'Ready' });
  await page.locator('[data-type="SUBMIT_PAPER"]').first().click();
  await expect(page.locator('.desk-paper')).toContainText('Submitted');
  await expect(page.locator('[data-type="START_PROJECT"]')).toBeVisible();
  await openManager(page, { paperStatus: 'Advisor Review' });
  await expect(page.locator('.desk-task')).toContainText('The draft is on another desk.');
  await expect(page.locator('[data-action="play-turn"][data-id="work"]')).toHaveCount(0);
  await expect(page.locator('[data-action="play-turn"][data-id="recover"]')).toBeEnabled();
});

test('the desk stays within a 320px viewport at the largest text setting', async ({ page }) => {
  await openManager(page, { width: 320, height: 740, textSize: 4 });
  expect(await page.locator('.client').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-action="play-turn"][data-id="recover"]')).toBeEnabled();
});
