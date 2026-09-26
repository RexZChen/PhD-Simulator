import { test, expect } from '@playwright/test';

async function meeting(page, event = 'meet_criticism', options = {}) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install();
  await page.goto('/');
  await page.evaluate(async ({ event, options }) => {
    const { createRun } = await import('/src/engine/state.js');
    const { prepareRun, dispatch } = await import('/src/engine/game.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = prepareRun(createRun(4242, { background: 'masters', topic: 'ml', international: false }));
    const a = s.advisors[6];
    s.phase = 'admissions'; s.offers = [a.schoolId];
    s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: a.id });
    s = dispatch(s, { type: 'START_PROJECT' });
    s.projects.find(p => p.id === s.activeProjectId).draft = 10;
    s.month = 16; s.event = event; s.eventVariant = 0; s.stage = 'event'; s.eventReturn = 'plan'; s.eventQueue = [];
    s.advisorMode = { id: 'pressed' };
    s.flags.remoteAdvisor = !!options.remote;
    const meta = emptyMeta();
    Object.assign(meta.settings, { tips: false, lang: 'en', textSize: 3, quiet: false, sound: false, selfPaced: false, untimedChoices: false }, options);
    saveRun(localStorage, s, meta);
  }, { event, options });
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
  await page.locator('[data-action="wiz-next"]').click();
}

test('meeting entrance holds the decision clock, survives pause and can be skipped by keyboard', async ({ page }) => {
  await meeting(page);
  const dialog = page.locator('[data-meeting]');
  const skip = page.getByRole('button', { name: 'Skip entrance', exact: true });
  await expect(dialog).toHaveClass(/meeting-arriving/);
  await expect(skip).toBeInViewport();
  await expect(page.locator('.scene-text')).toBeVisible();
  await page.clock.runFor(600);
  expect(await page.locator('[data-scene-bar]').evaluate(el => el.style.width)).toBe('');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const elapsed = await dialog.evaluate(el => el.style.getPropertyValue('--meeting-elapsed'));
  await page.clock.runFor(20_000);
  await expect(dialog).toHaveClass(/meeting-arriving/);
  await page.getByRole('button', { name: 'Resume conversation', exact: true }).click();
  expect(await dialog.evaluate(el => el.style.getPropertyValue('--meeting-elapsed'))).toBe(elapsed);
  await skip.focus(); await page.keyboard.press('Enter');
  await expect(skip).toBeHidden();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeFocused();
  await page.clock.runFor(300);
  expect(await page.locator('[data-scene-bar]').evaluate(el => parseFloat(el.style.width))).toBeLessThan(100);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Resume conversation', exact: true }).click();
  await expect(dialog).not.toHaveClass(/meeting-arriving/);
});

test('group entrance completes into a distinct room and fits Chinese enlarged text', async ({ page }) => {
  await meeting(page, 'group_public_correction', { lang: 'zh', selfPaced: true });
  await expect(page.locator('.meeting-group .meeting-projection')).toBeVisible();
  await expect(page.getByRole('button', { name: '跳过入场', exact: true })).toBeInViewport();
  await page.clock.runFor(1900);
  await expect(page.locator('[data-meeting]')).not.toHaveClass(/meeting-arriving/);
  await expect(page.locator('.meeting-caption')).toContainText('投影亮着');
  expect(await page.locator('[data-meeting]').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await page.locator('.meeting-caption').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  await page.setViewportSize({ width: 320, height: 760 });
  const room = await page.locator('.meeting-set').boundingBox();
  const caption = await page.locator('.meeting-caption').boundingBox();
  expect(caption.y).toBeGreaterThanOrEqual(room.y + room.height - 1);
  const title = await page.locator('[data-meeting] > .titlebar').boundingBox();
  const context = await page.locator('[data-meeting] .scene-context').boundingBox();
  expect(context.y).toBeGreaterThanOrEqual(title.y + title.height);
  expect(await page.locator('[data-meeting]').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.locator('[data-action="choice"][data-id="note"]').click();
  await expect(page.locator('[data-meeting]')).toHaveCount(0);
});

test('an explicit offer of rest stays supportive even during advisor pressure', async ({ page }) => {
  await meeting(page, 'meet_rest');
  await expect(page.locator('.meeting-supportive')).toBeVisible();
  await expect(page.locator('.meeting-caption')).toContainText('set the work aside');
  await expect(page.locator('[data-scene-timer]')).toHaveCount(0);
  await page.clock.runFor(20_000);
  await expect(page.getByRole('dialog')).toContainText('You look tired');
  await page.locator('[data-action="choice"][data-id="take"]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('round-table updates build pressure without inventing a slide presentation', async ({ page }) => {
  await meeting(page, 'group_round_thin', { lang: 'zh', selfPaced: true });
  await expect(page.locator('.meeting-tense .meeting-projector-off')).toBeVisible();
  await expect(page.locator('.meeting-projection i')).toHaveCount(0);
  await page.clock.runFor(1900);
  await expect(page.locator('.meeting-caption')).toContainText('快轮到你了');
  await expect(page.locator('.scene-text')).toContainText('不用幻灯片');
});

for (const event of ['meet_mid_drift', 'meet_mid_recalibrate']) {
  test(`${event} keeps its explicitly mild question calm under deadline pressure`, async ({ page }) => {
    await meeting(page, event);
    await expect(page.locator('.meeting-routine')).toBeVisible();
    await expect(page.locator('.meeting-tense, [data-scene-timer]')).toHaveCount(0);
    await page.clock.runFor(20_000);
    await expect(page.getByRole('dialog')).toContainText(event === 'meet_mid_drift' ? 'asked mildly' : 'rather than sceptical');
    await expect(page.locator('[data-action="choice"]').first()).toBeEnabled();
  });
}

test('the camera-off version of a quiet meeting does not invent a visible advisor', async ({ page }) => {
  await meeting(page, 'meet_silence', { lang: 'zh', selfPaced: true });
  await page.clock.runFor(1900);
  await expect(page.locator('.meeting-camera-off')).toBeVisible();
  await expect(page.locator('.meeting-video-person, .meeting-door')).toHaveCount(0);
  await expect(page.locator('.meeting-caption')).toContainText('摄像头依然关着');
  await page.locator('[data-action="choice"][data-id="written"]').click();
  await expect(page.locator('[data-meeting]')).toHaveCount(0);
});

for (const mode of ['quiet', 'system']) {
  test(`${mode} reduced motion shows the room immediately with no entrance delay`, async ({ page }) => {
    if (mode === 'system') await page.emulateMedia({ reducedMotion: 'reduce' });
    await meeting(page, 'meet_criticism', { quiet: mode === 'quiet' });
    await expect(page.locator('[data-meeting]')).not.toHaveClass(/meeting-arriving/);
    await expect(page.locator('[data-action="skip-meeting-arrival"]')).toBeHidden();
    await page.clock.runFor(300);
    expect(await page.locator('[data-scene-bar]').evaluate(el => parseFloat(el.style.width))).toBeLessThan(100);
  });
}

test('a cancelled appointment does not animate an advisor entering the room', async ({ page }) => {
  await meeting(page, 'meet_cancel_sick');
  await expect(page.getByRole('dialog')).toContainText('They are ill');
  await expect(page.locator('.meeting-cancelled')).toContainText('Meeting not held');
  await expect(page.locator('.call-bar, .portrait-avatar')).toHaveCount(0);
  const titlebar = page.locator('[data-meeting-missed] > .titlebar');
  const header = await titlebar.boundingBox(), name = await titlebar.locator('.tb-title').boundingBox();
  expect(name.y + name.height).toBeLessThanOrEqual(header.y + header.height);
  await expect(page.locator('[data-meeting]')).toHaveCount(0);
  await expect(page.locator('[data-scene-timer]')).toHaveCount(0);
});

for (const lang of ['en', 'zh']) {
  test(`remote meeting uses a video entrance and keeps its choices reachable in ${lang}`, async ({ page }) => {
    await meeting(page, 'meet_remote_document', { remote: true, lang, selfPaced: true });
    const dialog = page.locator('[data-meeting]');
    await expect(dialog).toHaveClass(/meeting-arriving/);
    await expect(page.locator('.meeting-door')).toHaveCount(0);
    await expect(page.locator('.meeting-calendar')).toContainText(lang === 'zh' ? '等候室' : 'waiting room');
    await page.clock.runFor(1900);
    await expect(page.locator('.meeting-video')).toBeVisible();
    await expect(page.locator('.meeting-caption')).toContainText(lang === 'zh' ? '视频接通了' : 'call connects');
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.locator('[data-action="choice"][data-id="test"]').click();
    await expect(dialog).toHaveCount(0);
  });
}


test('a deceased advisor stays in the archive without offering a live reply', async ({ page }) => {
  await meeting(page, 'advisor_dies', { lang: 'zh', quiet: true, selfPaced: true });
  await expect(page.locator('.meme')).toHaveCount(0);
  await page.locator('[data-action="choice"][data-id="committee"]').click();
  await page.locator('.desktop-icons [data-app="chat"]').click();
  const archived = page.locator('.sl-msg').filter({ hasText: '历史消息 · 已关闭回复' });
  await expect(archived).toHaveCount(1);
  await expect(archived.locator('[data-action="chat-reply"]')).toHaveCount(0);
  await expect(page.locator('.slack')).toContainText('第一次见面');
});
