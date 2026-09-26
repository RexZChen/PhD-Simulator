import { test, expect } from '@playwright/test';

async function resume(page) {
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
}

async function seed(page, phase = 'playing') {
  await page.goto('/');
  await page.evaluate(async phase => {
    const { createRun } = await import('/src/engine/state.js');
    const { prepareRun, dispatch } = await import('/src/engine/game.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = prepareRun(createRun(4242, { background: 'masters', topic: 'ml', international: false }));
    if (phase === 'playing') {
      const a = s.advisors[6];
      s.phase = 'admissions'; s.offers = [a.schoolId];
      s.applications = [{ schoolId: a.schoolId, effort: 'tailored', poiId: a.id, status: 'admitted', funding: 'RA' }];
      s = dispatch(s, { type: 'ENROLL', id: a.id });
    }
    const meta = emptyMeta(); meta.settings.tips = false; meta.settings.lang = 'en';
    saveRun(localStorage, s, meta);
  }, phase);
  await resume(page);
}

test('phone navigation keeps readable app names and phase tabs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, 'prep');
  const dock = page.locator('.desk-icon');
  const widths = await dock.evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().width));
  expect(Math.min(...widths), 'app icons must scroll rather than shrink into single-letter columns').toBeGreaterThanOrEqual(60);
  const tabs = page.locator('.ga-tabs');
  await expect(tabs).toBeVisible();
  expect(await tabs.innerText()).not.toContain(',');
  const bounds = await tabs.boundingBox();
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  const window = await page.locator('.window').boundingBox();
  const dockBounds = await page.locator('.desktop-icons').boundingBox();
  expect(window.y + window.height).toBeLessThanOrEqual(dockBounds.y);
  await page.locator('[data-action="prep-section"][data-id="advisors"]:not([data-guide])').click();
  await expect(page.locator('#prep-advisors')).toBeInViewport();
});

test('dashboard shortcuts reach their named pages and optional details stay open after actions', async ({ page }) => {
  await seed(page);
  await page.locator('[data-action="start-project"][data-guide]').click();
  await page.getByRole('button', { name: 'Work on paper', exact: true }).click();
  await expect(page.locator('.editor-source')).toBeVisible();
  await page.locator('.desk-icon[data-app="dashboard"]').click();
  const details = page.locator('[data-disclosure="manager-support"]');
  await expect(details).not.toHaveAttribute('open');
  await details.locator('summary').click();
  await page.locator('[data-action="plan"][data-id="rest"]').click();
  await expect(details).toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Talk to advisor', exact: true }).click();
  await expect(page.getByRole('button', { name: /Choose a message/ })).toBeVisible();
  await page.getByRole('button', { name: /Choose a message/ }).click();
  await expect(page.locator('.say-menu')).toBeVisible();
});

test('desk interactions remain reachable on a phone in both languages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.getByRole('button', { name: 'Around your desk', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Water the plant', exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'Open the whiteboard', exact: true }).click();
  await expect(page.locator('[data-wb-surface]')).toBeVisible();
  await page.locator('[data-action="board-close"]').click();
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="language"][data-id="zh"]').click();
  await expect(page.getByRole('button', { name: '打开白板', exact: true })).toBeInViewport();
  await page.getByRole('button', { name: '给植物浇水', exact: true }).click();
  await expect(page.locator('.desk-note')).toBeVisible();
});

test('advisor messages group choices and explain energy before composing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { run, meta } = loadSave(localStorage);
    run.milestones.prelim = 'pass'; run.player.stats.energy = 1;
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  await page.getByRole('button', { name: 'Talk to advisor', exact: true }).click();
  await page.getByRole('button', { name: /Choose a message/ }).click();
  await expect(page.locator('.say-group[open]')).toHaveCount(0);
  await page.locator('.say-group summary').filter({ hasText: 'Check-ins & meetings' }).click();
  await expect(page.locator('[data-id="ask:timeline"]')).toHaveCount(0);
  const update = page.locator('[data-id="ask:update"]');
  await expect(update).toBeDisabled();
  await expect(update).toContainText('2 Energy');
  await expect(update).toContainText('Not enough Energy.');
  await page.locator('.say-group summary').filter({ hasText: 'Time off & support' }).click();
  await expect(page.locator('[data-id="ask:sick"]')).toBeVisible();
  await page.locator('[data-action="chat-menu-close"]').click();
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="language"][data-id="zh"]').click();
  await page.locator('.choose-message').click();
  await expect(page.locator('.say-menu')).toContainText('汇报与会面');
  await expect(page.locator('.say-menu')).toContainText('休假与支持');
});

test('advisor requests keep their full context and responses together', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { absWeek, chat } = await import('/src/engine/state.js');
    const { run, meta } = loadSave(localStorage);
    run.player.stats.energy = 4;
    run.requests = [
      { id: 'read-test', templateId: 'read', kind: 'reading', text: 'Read chapters 3–6 before our next meeting. The appendix contains the comparison we need.', dueWeek: absWeek(run) + 1, status: 'open' },
      { id: 'cover-test', templateId: 'cover', kind: 'teaching', text: 'Cover the Thursday lecture. The slides are mostly done.', dueWeek: absWeek(run) + 2, status: 'open', pushed: true },
    ];
    for (const r of run.requests) chat(run, 'advisor', run.advisor.name, r.text, { request: r.id });
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  await page.getByRole('button', { name: 'Talk to advisor', exact: true }).click();
  await expect(page.locator('[data-action="req-do"][data-id="cover-test"]')).toBeDisabled();
  const shortcut = page.getByRole('button', { name: '2 open request(s)', exact: true });
  await shortcut.click();
  await expect(page.locator('.say-group').filter({ hasText: 'About their request' })).toHaveAttribute('open', '');
  await expect(page.locator('.say-menu')).toBeFocused();
  await expect(page.locator('.desktop-icons')).toHaveAttribute('inert', '');
  await page.keyboard.press('Tab');
  await expect(page.locator('.say-menu').getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(shortcut).toBeFocused();
  await expect(page.locator('.desktop-icons')).not.toHaveAttribute('inert');
  await page.getByRole('button', { name: /Choose a message/ }).click();
  await page.locator('.say-group > summary').filter({ hasText: 'About their request' }).click();
  await expect(page.locator('.say-count').first()).toHaveText('2 requests');
  const read = page.locator('.say-request[data-request="read-test"]');
  const cover = page.locator('.say-request[data-request="cover-test"]');
  await read.locator('summary').click();
  await expect(read).toContainText('The appendix contains the comparison we need.');
  await expect(read).toContainText('due in 1 wk');
  await expect(read.locator('[data-id="req:decline:read-test"]')).toBeInViewport();
  await read.locator('summary').click();
  await cover.locator('summary').click();
  await expect(cover.locator('[data-id="req:do:cover-test"]')).toBeDisabled();
  await expect(cover).toContainText('You need 6 Energy for that.');
  await expect(cover.locator('[data-id="req:push:cover-test"]')).toBeDisabled();
  await expect(cover).toContainText('You already pushed back on this one.');
  await cover.locator('[data-id="req:decline:cover-test"]').click();
  await expect(page.locator('[data-action="chat-send"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.say-menu')).toHaveCount(0);
  await page.getByRole('button', { name: /Choose a message/ }).click();
  await page.locator('.say-group > summary').filter({ hasText: 'About their request' }).click();
  await expect(page.locator('.say-request')).toHaveCount(1);
  await expect(read).toBeVisible();
});

test('paper writing uses the remaining allowance and offers a clear next step', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { createProject } = await import('/src/engine/paper.js');
    const { run, meta } = loadSave(localStorage);
    const p = createProject(run); p.progress = 50; p.draft = 5; p.status = 'Drafting'; run.typed = 5;
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  await page.getByRole('button', { name: 'Work on paper', exact: true }).click();
  await page.getByRole('button', { name: 'Write for this turn (+15)', exact: true }).click();
  await expect(page.locator('.next-step')).toContainText('Writing session complete');
  await expect(page.getByRole('progressbar', { name: 'Draft', exact: true })).toHaveAttribute('aria-valuenow', '20');
  await page.getByRole('button', { name: 'Choose next plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'September 2028', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Work on paper', exact: true }).click();
  await expect(page.locator('[data-action="write"]')).toBeDisabled();
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="language"][data-id="zh"]').click();
  await expect(page.locator('.next-step')).toContainText('本轮写作已完成');
});

test('late advisor review exposes deadline trade-offs before the editor on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { createProject, setTarget } = await import('/src/engine/paper.js');
    const { run, meta } = loadSave(localStorage);
    run.month = 32; run.week = 0; run.milestones.prelim = 'pass';
    const p = createProject(run);
    Object.assign(p, { progress: 60, draft: 87, status: 'Advisor Review', reviewDueWeek: 132 });
    setTarget(run, p, 'neuripsy');
    meta.settings.textSize = 2;
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  await page.getByRole('button', { name: 'Work on paper', exact: true }).click();
  const next = page.locator('.next-step');
  await expect(next).toContainText('The review may miss your deadline');
  await expect(next).toContainText('Reply in 4 week(s); target closes in 4.');
  await expect(next.getByRole('button', { name: 'Skip the advisor’s read', exact: true })).toBeInViewport();
  await expect(next.getByRole('button', { name: 'Skip the advisor’s read', exact: true })).toBeDisabled();
  await next.getByRole('button', { name: 'Review deadlines', exact: true }).click();
  await expect(page.locator('.address')).toContainText('openregret');
  await page.locator('[data-action="set-target"][data-id="aaaight"]').click();
  await page.getByRole('button', { name: 'Overgrief', exact: true }).click();
  await expect(next).toContainText('Your advisor is reading');
  await expect(next.getByRole('button', { name: 'Choose next plan', exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { run, meta } = loadSave(localStorage);
    Object.assign(run.projects.at(-1), { targetVenueId: 'neuripsy', targetVenue: 'NeurIPSy', targetMonth: 32 });
    run.advisorMode = { id: 'traveling' };
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  await page.getByRole('button', { name: 'Work on paper', exact: true }).click();
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="language"][data-id="zh"]').click();
  await expect(next).toContainText('审阅可能赶不上截止日期');
  await next.getByRole('button', { name: '跳过导师审阅', exact: true }).click();
  await expect(next.locator('[data-action="browser-tab"][data-id="openregret"]')).toBeVisible();
  const status = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const { run } = loadSave(localStorage);
    return run.projects.at(-1).status;
  });
  expect(status).toBe('Ready');
});

test('a completed dissertation draft points to committee review', async ({ page }) => {
  await seed(page);
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { createProject } = await import('/src/engine/paper.js');
    const { run, meta } = loadSave(localStorage);
    const p = createProject(run); p.kind = 'thesis'; p.draft = 90; p.status = 'Drafting'; run.typed = 20;
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  await page.getByRole('button', { name: 'Work on paper', exact: true }).click();
  await page.locator('.next-step').getByRole('button', { name: 'Send to advisor', exact: true }).click();
  await expect(page.locator('.next-step')).toContainText('The committee is reading');
});

test('keyboard selects a plan without advancing time and retains focus after rendering', async ({ page }) => {
  await seed(page);
  const rest = page.locator('[data-action="plan"][data-id="rest"]');
  await rest.focus();
  await page.keyboard.press('Enter');
  await expect(rest).toHaveClass(/selected/);
  await expect(rest).toBeFocused();
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect(page.locator('[data-action="continue"]')).toBeVisible();
});

test('dialog keyboard navigation stays inside and returns to its opener', async ({ page }) => {
  await seed(page);
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="tips"]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeFocused();
  const close = dialog.locator('[data-action="close-dialog"]');
  await close.focus();
  await page.keyboard.press('Tab');
  await expect(dialog.locator('summary')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0);
});

test('reading preferences persist and untimed choices do not expire', async ({ page }) => {
  await seed(page);
  await page.getByRole('button', { name: 'Reading & comfort', exact: true }).click();
  await page.locator('[data-comfort="quiet"]').check();
  await page.locator('[data-comfort="untimedChoices"]').check();
  await page.locator('[data-comfort="sound"]').uncheck();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await resume(page);
  await page.getByRole('button', { name: 'Reading & comfort', exact: true }).click();
  await expect(page.locator('[data-comfort="quiet"]')).toBeChecked();
  await expect(page.locator('[data-comfort="untimedChoices"]')).toBeChecked();
  await expect(page.locator('[data-comfort="sound"]')).not.toBeChecked();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { run, meta } = loadSave(localStorage);
    run.stage = 'event'; run.event = 'meet_progress'; run.advisor.toxicity = 80;
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  await expect(page.getByText('Take your time. Choose when you are ready.')).toBeVisible();
  await expect(page.locator('[data-scene-timer]')).toBeHidden();
  await page.clock.install();
  await page.clock.fastForward(20_000);
  await expect(page.locator('[data-action="choice"]').first()).toBeVisible();
});

test('scene pause holds the timer and choices while allowing a saved checkpoint', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install();
  await seed(page);
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { run, meta } = loadSave(localStorage);
    run.stage = 'event'; run.event = 'meet_progress'; run.eventQueue = ['tax_day'];
    run.eventVariant = 0;
    run.advisor.toxicity = 80; meta.settings.untimedChoices = false; meta.settings.selfPaced = false;
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  // This check measures the conversation clock; the entrance has its own pause test.
  const entrance = page.locator('[data-action="skip-meeting-arrival"]:visible');
  if (await entrance.count()) await entrance.click();
  await page.clock.runFor(500);
  await expect(page.locator('.scene-context')).toContainText('1 more scene queued');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = page.getByRole('dialog', { name: 'Paused', exact: true });
  await expect(paused).toBeFocused();
  const before = await page.locator('[data-scene-bar]').getAttribute('style');
  expect(parseFloat(before.match(/[\d.]+/)[0])).toBeLessThan(100);
  await page.keyboard.press('1');
  await page.clock.runFor(30_000);
  await expect(paused).toBeVisible();
  expect(await page.locator('[data-scene-bar]').getAttribute('style')).toBe(before);
  await paused.getByRole('button', { name: 'Saved runs', exact: true }).click();
  await page.locator('[data-action="slot-save"][data-id="1"]').click();
  const saved = await page.evaluate(async () => (await import('/src/engine/save.js')).readSlot(localStorage, 1));
  expect(saved.event).toBe('meet_progress');
  expect(saved.eventQueue).toEqual(['tax_day']);
  await page.keyboard.press('Escape');
  await expect(paused).toBeVisible();
  await paused.getByRole('button', { name: 'Resume conversation', exact: true }).click();
  await page.clock.runFor(500);
  await expect(paused).toHaveCount(0);
  expect(await page.locator('[data-scene-bar]').getAttribute('style')).not.toBe(before);
  await expect(page.locator('#scene-title')).toHaveText('Where are we?');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await paused.getByRole('button', { name: 'Saved runs', exact: true }).click();
  await page.locator('[data-action="slot-load"][data-id="1"]').click();
  await expect(paused).toHaveCount(0);
  await expect(page.locator('#scene-title')).toHaveText('Where are we?');
  const restoredEntrance = page.locator('[data-action="skip-meeting-arrival"]:visible');
  if (await restoredEntrance.count()) await restoredEntrance.click();
  await page.clock.runFor(500);
  expect(parseFloat((await page.locator('[data-scene-bar]').getAttribute('style')).match(/[\d.]+/)[0])).toBeLessThan(100);
});

test('portable backup downloads, previews without changes, and restores all saved progress', async ({ page }) => {
  await seed(page);
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="saves"]').click();
  await page.locator('[data-action="slot-save"][data-id="1"]').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup', exact: true }).click();
  const download = await downloadPromise;
  const { readFile } = await import('node:fs/promises');
  const original = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(original.data.slots['1'].player.name).toBe(original.data.run.player.name);
  const oldName = original.data.run.player.name;
  original.data.run.player.name = 'Backup Test Student';
  const upload = { name: 'my-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(original)) };
  await page.locator('#backup-file').setInputFiles(upload);
  await expect(page.getByRole('heading', { name: 'Restore this backup?' })).toBeVisible();
  await expect(page.locator('.backup-preview')).toContainText('Backup Test Student');
  expect(await page.evaluate(async () => (await import('/src/engine/save.js')).loadSave(localStorage).run.player.name)).toBe(oldName);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('.backup-preview')).toHaveCount(0);
  await page.locator('#backup-file').setInputFiles(upload);
  await page.getByRole('button', { name: 'Replace saves and reload', exact: true }).click();
  await expect(page.locator('.boot')).toBeVisible();
  const restored = await page.evaluate(async () => {
    const { loadSave, readSlot } = await import('/src/engine/save.js');
    return { name: loadSave(localStorage).run.player.name, slot: readSlot(localStorage, 1).player.name };
  });
  expect(restored).toEqual({ name: 'Backup Test Student', slot: oldName });
});

test('invalid backup leaves saves intact and shows a readable error on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="saves"]').click();
  const before = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  await page.locator('#backup-file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.locator('.note-line')).toContainText('not a valid Academic OS backup');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(before);
  await expect(page.locator('[data-action="backup-restore"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Download backup', exact: true })).toBeVisible();
});

test('phone venue entries label their fields and keep target actions reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.locator('[data-action="start-project"][data-guide]').click();
  await page.getByRole('button', { name: 'Work on paper', exact: true }).click();
  await page.getByRole('button', { name: 'OpenRegret', exact: true }).click();
  const entry = page.locator('.venue-table .lv-row').first();
  await entry.scrollIntoViewIfNeeded();
  await expect(entry.getByText('Next deadline', { exact: true })).toBeVisible();
  await expect(entry.getByText('Selectivity', { exact: true })).toBeVisible();
  const bounds = await entry.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await entry.getByRole('button', { name: 'Target', exact: true }).click();
  await expect(entry.getByRole('button', { name: 'Targeted', exact: true })).toBeDisabled();
});

async function selfPacedCheckpoint(page, kind) {
  await seed(page);
  await page.evaluate(async kind => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { dispatch } = await import('/src/engine/game.js');
    let { run, meta } = loadSave(localStorage);
    run = dispatch(run, { type: 'START_PROJECT' });
    run.projects[0].progress = 60; run.projects[0].status = 'Drafting'; run.projects[0].draft = 10;
    meta.settings.selfPaced = true;
    if (kind === 'viva') { run.month = 22; run.stage = 'milestone'; run.milestoneKind = 'prelim'; }
    else { run.stage = 'minigame'; run.minigame = kind; }
    saveRun(localStorage, run, meta);
  }, kind);
  await resume(page);
}

for (const quiet of [false, true]) {
  test(`graduation notifications stay compact with reduced effects ${quiet ? 'on' : 'off'}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    await page.evaluate(async quiet => {
      const { loadSave, saveRun } = await import('/src/engine/save.js');
      const { beginRevisions } = await import('/src/engine/thesis.js');
      const { run, meta } = loadSave(localStorage);
      run.month = quiet ? 56 : 62; run.stage = 'plan'; // May ceremony vs November conferral.
      beginRevisions(run);
      run.thesis.items.forEach(item => { item.done = item.effort; });
      run.thesis.done = run.thesis.needed;
      run.rng = 1; // First format review passes and awards both deposit achievements.
      meta.settings.quiet = quiet; meta.settings.sound = true;
      saveRun(localStorage, run, meta);
    }, quiet);
    await resume(page);
    await page.locator('[data-action="deposit"]:not([data-guide])').click();
    const awarded = await page.evaluate(async () => {
      const { loadSave } = await import('/src/engine/save.js');
      return loadSave(localStorage).run.achievements;
    });
    expect(awarded).toEqual(expect.arrayContaining(['deposited', 'margins']));
    if (quiet) {
      await expect(page.locator('.award-toast')).toHaveCount(0);
      await expect(page.locator('.balloon')).toHaveCount(0);
    } else {
      const toast = page.locator('.award-toast');
      await expect(toast).toHaveCount(1);
      await expect(toast).toContainText('2 achievements added');
      expect((await toast.boundingBox()).height).toBeLessThan(844 * .35);
      await expect(page.locator('.balloon')).toHaveCount(1);
      await expect(page.locator('.balloon')).not.toBeVisible();
      await toast.getByRole('button', { name: 'Dismiss', exact: true }).click();
      await expect(toast).toHaveCount(0);
    }
    await expect(page.locator('.cer-banner')).toContainText(quiet ? 'COMMENCEMENT' : 'DEGREE CONFERRED');
    await expect(page.locator('.ceremony')).toContainText(quiet ? 'Nine seconds, after all that.' : 'The ceremony is in May 2034');
    if (!quiet) await expect(page.locator('.ceremony')).not.toContainText('The hood goes');
    await page.locator('[data-action="start-menu"]').click();
    await page.locator('[data-action="language"][data-id="zh"]').click();
    await expect(page.locator('.cer-banner')).toContainText(quiet ? '毕业典礼' : '学位已授予');
    await expect(page.locator('.ceremony')).toContainText(quiet ? '台上只有九秒钟' : '2034年5月');
  });
}

test('self-paced reading resumes, waits for decisions, and finishes without a reflex timer', async ({ page }) => {
  await selfPacedCheckpoint(page, 'bench');
  await page.clock.install();
  await page.clock.fastForward(60_000);
  await expect(page.locator('[data-action="bench-careful"]')).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.locator('[data-action="bench-careful"]').click();
    await expect(page.locator('[data-action="bench-next"]')).toBeVisible();
    await page.clock.fastForward(10_000);
    await expect(page.locator('[data-action="bench-next"]')).toBeVisible();
    await page.locator('[data-action="bench-next"]').click();
  }
  await expect(page.locator('.bench')).toHaveCount(0);
});

test('self-paced lecture lets the player finish through deliberate listening choices', async ({ page }) => {
  await selfPacedCheckpoint(page, 'lecture');
  await page.clock.install();
  await page.clock.fastForward(60_000);
  for (let i = 0; i < 8; i++) {
    await page.locator('[data-action="lecture-choice"][data-id="listen"]').click();
    await page.locator('[data-action="lecture-choice"][data-id="next"]').click();
  }
  await expect(page.locator('[data-lec]')).toHaveCount(0);
  const result = await page.evaluate(async () => (await import('/src/engine/save.js')).loadSave(localStorage).run.lectureResult);
  expect(result.attention).toBe(26); expect(result.worked).toBe(0); expect(result.caught).toBe(0);
});

test('self-paced exam waits on the talk and proceeds through the full room', async ({ page }) => {
  await selfPacedCheckpoint(page, 'viva');
  await page.locator('[data-action="milestone"][data-id="balanced"]').click();
  await page.clock.install();
  await page.clock.fastForward(120_000);
  await expect(page.locator('[data-vv]')).toHaveAttribute('data-phase', 'talk');
  for (let i = 0; i < 120 && await page.locator('[data-vv]').count(); i++) {
    const next = page.locator('[data-action="exam-advance"]:visible');
    const interrupt = page.locator('[data-action="exam-interrupt"]:visible:not([data-id="ignore"])');
    const slide = page.locator('[data-action="exam-talk"][data-id="next"]:visible:not(:disabled)');
    const answer = page.locator('[data-action="viva-move"]:visible:not(:disabled)').first();
    if (await next.count()) await next.click();
    else if (await interrupt.count()) {
      await expect(page.locator('[data-action="exam-talk"][data-id="next"]')).toBeDisabled();
      await expect(page.locator('[data-action="exam-talk"][data-id="hold"]')).toBeDisabled();
      await interrupt.click();
    }
    else if (await slide.count()) await slide.click();
    else await answer.click();
  }
  await expect(page.locator('[data-vv]')).toHaveCount(0);
});

test('self-paced debugging waits and resolves through explicit feedback steps', async ({ page }) => {
  await selfPacedCheckpoint(page, 'cluster');
  await page.clock.install();
  await page.clock.fastForward(120_000);
  await expect(page.locator('[data-cl-left]')).toContainText('no timer');
  for (let round = 0; round < 4; round++) {
    const correct = await page.evaluate(async () => {
      const { clusterStages } = await import('/src/data/cluster.js');
      const lines = clusterStages.flatMap(stage => stage.lines).filter(line => line.real).map(line => line.t);
      return [...document.querySelectorAll('[data-action="cluster-line"]')].find(button => lines.includes(button.textContent)).dataset.id;
    });
    await page.locator(`[data-action="cluster-line"][data-id="${correct}"]`).click();
    await page.clock.fastForward(20_000);
    await expect(page.locator('[data-action="cluster-advance"]')).toBeVisible();
    await page.locator('[data-action="cluster-advance"]').click();
  }
  await expect(page.locator('[data-cl]')).toHaveCount(0);
});

test('self-paced conference talk and questions wait for the player', async ({ page }) => {
  await seed(page);
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { startTrip } = await import('/src/engine/trip.js');
    let { run, meta } = loadSave(localStorage);
    run = dispatch(run, { type: 'START_PROJECT' });
    const p = run.projects[0]; p.status = 'Accepted'; p.venueId = 'osdisaster';
    p.submissionHistory = [{ venueId: 'osdisaster', venue: 'OSDIsaster', month: 2, outcome: 'Accept', reviewers: [], quality: 72, diamonds: 4 }];
    run.player.stats.money = 12000; startTrip(run, p, 'boston'); meta.settings.selfPaced = true;
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  for (let i = 0; i < 4 && !(await page.locator('[data-action="talk-intro"]').count()); i++) await page.locator('[data-action="trip-day"][data-id="sessions"]').click();
  await page.locator('[data-action="talk-intro"]').click();
  await page.locator('[data-action="talk-start"]').click();
  await page.clock.install(); await page.clock.fastForward(120_000);
  await expect(page.locator('[data-tg-slot]')).toContainText('1/6');
  for (let i = 0; i < 6; i++) {
    await page.locator('[data-tg-pick]').first().click();
    await page.locator('[data-tg-advance]').click();
  }
  await page.locator('[data-action="talk-qa"]').click();
  await page.clock.fastForward(120_000);
  await expect(page.getByText('Take your time. Choose when you are ready.')).toBeVisible();
  await page.locator('[data-action="trip-qa"]').first().click();
  await expect(page.locator('.qa-prev')).toBeVisible();
});

test('ChatPHD previews survive reload and checking applies the tool with a clear return path', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { createProject } = await import('/src/engine/paper.js');
    const { run, meta } = loadSave(localStorage);
    const p = createProject(run);
    Object.assign(p, { progress: 50, draft: 25, status: 'Drafting' });
    meta.settings.textSize = 2;
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  await page.getByRole('button', { name: 'Work on paper', exact: true }).click();
  await page.getByRole('button', { name: 'ChatPHD', exact: true }).click();
  await expect(page.locator('.cph-tool')).toHaveCount(5);
  await page.getByRole('navigation', { name: 'ChatPHD', exact: true }).getByRole('button', { name: 'Conversation', exact: true }).click();
  await expect(page.locator('#chatphd-input')).toBeFocused();
  await page.getByRole('navigation', { name: 'ChatPHD', exact: true }).getByRole('button', { name: 'Research tools', exact: true }).click();
  await expect(page.locator('.cph-tools')).toBeFocused();
  await page.locator('[data-action="chatphd"][data-id="abstract"]').click();
  await expect(page.locator('.cph-suggestion')).toBeFocused();
  const before = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const { run } = loadSave(localStorage);
    return { draft: run.projects.at(-1).draft, text: run.chatphdPending.text };
  });
  expect(before.draft).toBe(25);
  await resume(page);
  await page.getByRole('button', { name: 'Work on paper', exact: true }).click();
  await page.getByRole('button', { name: 'ChatPHD', exact: true }).click();
  await expect(page.locator('.cph-suggestion')).toContainText(before.text);
  await page.getByRole('button', { name: 'Check it (−2 Energy)', exact: true }).click();
  await expect(page.locator('.cph-result')).toBeFocused();
  await expect(page.locator('.cph-result')).toContainText('You checked the suggestion');
  await page.getByRole('button', { name: 'See it in your paper', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'Draft', exact: true })).toHaveAttribute('aria-valuenow', '33');
  await page.getByRole('button', { name: 'ChatPHD', exact: true }).click();
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="language"][data-id="zh"]').click();
  await page.getByRole('button', { name: '该怎么和导师沟通？', exact: true }).click();
  await expect(page.locator('.chatphd-log .msg.mine')).toContainText('该怎么和导师沟通？');
  await expect(page.locator('#chatphd-input')).toBeFocused();
  await expect(page.locator('.cph-tool')).toHaveCount(5);
});

test('connected app navigation reaches Scholar details and its real manuscript shortcut', async ({ page }) => {
  await seed(page);
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { createProject } = await import('/src/engine/paper.js');
    const { run, meta } = loadSave(localStorage);
    const p = createProject(run);
    Object.assign(p, { progress: 60, draft: 90, status: 'Drafting', preprint: true });
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  const nav = page.getByRole('navigation', { name: 'Desktop', exact: true });
  await nav.getByRole('button', { name: 'Gaggle Scholar', exact: true }).click();
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(nav.getByRole('button', { name: 'Gaggle Scholar', exact: true })).toHaveAttribute('aria-current', 'page');
  const rail = await nav.boundingBox();
  const window = await page.locator('.window').boundingBox();
  expect(Math.abs(rail.x + rail.width - window.x)).toBeLessThanOrEqual(2);
  await page.locator('.sch-paper-detail summary').click();
  await expect(page.locator('.sch-paper-detail')).toHaveAttribute('open', '');
  await expect(page.locator('.sch-paper-expanded')).toContainText('preprint');
  await page.getByRole('button', { name: 'People you know', exact: true }).click();
  await expect(page.locator('.sch-person')).not.toHaveCount(0);
  await page.getByRole('button', { name: 'My profile', exact: true }).click();
  await page.getByRole('button', { name: 'OpenRegret →', exact: true }).click();
  await expect(page.locator('.address')).toContainText('openregret.net');
});

test('cohort conversations move past prelims, explain their cost, and retain translated history', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { run, meta } = loadSave(localStorage);
    run.month = 28; run.milestones.prelim = 'pass'; run.player.stats.energy = 8;
    meta.settings.textSize = 2;
    saveRun(localStorage, run, meta);
  });
  await resume(page);
  await page.locator('.desk-icon[data-app="chat"]').click();
  await page.locator('[data-action="chat-channel"][data-id="cohort"]').click();
  await page.getByRole('button', { name: /Choose a message/ }).click();
  const study = page.locator('[data-action="chat-option"][data-id="soc:study"]');
  await expect(study).toContainText('Trade proposal outlines');
  await expect(study).toContainText('4 Energy');
  await expect(study).toBeInViewport();
  await expect(page.locator('.say-menu')).not.toContainText('qualifier');
  await study.click();
  await expect(page.locator('[data-action="chat-send"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.chat-log')).toContainText('You each cut one claim');
  const saved = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    return loadSave(localStorage).run;
  });
  expect(saved.player.stats.energy).toBe(4);
  expect(saved.readiness).toBeGreaterThanOrEqual(6);
  await page.getByRole('button', { name: /Choose a message/ }).click();
  await expect(study).toBeDisabled();
  await expect(study).toContainText('said recently');
  await page.keyboard.press('Escape');
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="language"][data-id="zh"]').click();
  await expect(page.locator('.chat-log')).toContainText('你们各删掉一个过大的论断');
  await expect(page.locator('.chat-log')).toContainText('交换开题提纲吗');
  await page.getByRole('button', { name: /选择要说的话/ }).click();
  await expect(page.locator('.say-menu')).toContainText('聊聊开题的困惑');
  await expect(page.locator('.say-menu')).not.toContainText('资格考');
  await page.keyboard.press('Escape');
  const senior = saved.labmates.find(person => person.role === 'senior');
  await page.locator(`[data-action="chat-channel"][data-id="dm:${senior.id}"]`).click();
  await page.locator('[data-action="dm-send"][data-opener="proposal_scope"]').click();
  await expect(page.locator('[data-action="dm-send"][data-opener="advisor_read"]')).toBeInViewport();
  await expect(page.locator('.dm-discussed')).not.toHaveAttribute('open');
  await expect(page.locator('.dm-discussed summary')).toContainText('聊过的话题（1）');
  await expect(page.locator('[data-action="dm-send"][data-opener="proposal_scope"]')).toHaveCount(0);
});

test('Chinese window menus remain horizontal, readable and inside a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await seed(page);
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { run, meta } = loadSave(localStorage);
    meta.settings.textSize = 2; meta.settings.lang = 'zh';
    saveRun(localStorage, run, meta);
  });
  await page.reload(); await page.locator('.boot').click();
  await page.getByRole('button', { name: /继续已保存的进度/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  for (const id of ['file', 'edit', 'view', 'help']) {
    const button = page.locator(`[data-action="menu"][data-id="${id}"]`);
    const metrics = await button.evaluate(n => {
      const range = document.createRange(); range.selectNodeContents(n);
      return { lines: range.getClientRects().length, width: n.getBoundingClientRect().width };
    });
    expect(metrics.lines).toBe(1);
    expect(metrics.width).toBeGreaterThan(35);
    await button.click();
    const menu = page.locator('.mb-drop');
    await expect(menu).toBeVisible();
    const bounds = await menu.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    // Hovering the menu title must not leave white option text on the gray surface.
    await button.hover();
    const colors = await menu.locator('.mb-item:not(:disabled)').first().evaluate(n => ({
      ink: getComputedStyle(n).color,
      paper: getComputedStyle(n.closest('.mb-drop')).backgroundColor,
    }));
    expect(colors.ink).toBe('rgb(16, 16, 16)');
    expect(colors.paper).toBe('rgb(198, 198, 198)');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  }
});

test('a Chinese-created lab message keeps its reply choices and can be answered', async ({ page }) => {
  await seed(page);
  const messageId = await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { setAppLanguage } = await import('/src/i18n/apply.js');
    const { labLines } = await import('/src/data/chatter.js');
    const { chat } = await import('/src/engine/state.js');
    const { run, meta } = loadSave(localStorage);
    setAppLanguage('zh');
    chat(run, 'general', run.labmates[0].name, labLines.any[5]);
    run.player.stats.energy = 20;
    saveRun(localStorage, run, meta);
    return run.chatMessages.at(-1).id;
  });
  await resume(page);
  await page.locator('.desk-icon[data-app="chat"]').click();
  await page.locator('[data-action="chat-channel"][data-id="general"]').click();
  const options = page.locator(`[data-action="chat-reply"][data-id="${messageId}"]`);
  const english = await options.evaluateAll(nodes => nodes.map(n => n.dataset.kind));
  expect(english).toContain('help');
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="language"][data-id="zh"]').click();
  expect(await options.evaluateAll(nodes => nodes.map(n => n.dataset.kind))).toEqual(english);
  const help = page.locator(`[data-action="chat-reply"][data-id="${messageId}"][data-kind="help"]`);
  await expect(help).toContainText('提出帮个实在的忙');
  await help.click();
  await expect(options).toHaveCount(0);
  const result = await page.evaluate(async id => {
    const { loadSave } = await import('/src/engine/save.js');
    const { run } = loadSave(localStorage);
    return { energy: run.player.stats.energy, reply: run.chatMessages.find(m => m.id === id).repliedWith };
  }, messageId);
  expect(result).toEqual({ energy: 16, reply: 'help' });
  await expect(page.locator('.chat-log .sl-msg').last()).toContainText(/[\u3400-\u9fff]/);
});
