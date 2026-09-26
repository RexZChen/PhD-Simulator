import { test, expect } from '@playwright/test';

async function timedActivity(page, kind) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install();
  await page.goto('/');
  await page.evaluate(async kind => {
    const { createRun } = await import('/src/engine/state.js');
    const { prepareRun, dispatch } = await import('/src/engine/game.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = prepareRun(createRun(4242, { background: 'masters', topic: 'ml', international: false }));
    const a = s.advisors[6];
    s.phase = 'admissions'; s.offers = [a.schoolId];
    s.applications = [{ schoolId: a.schoolId, effort: 'tailored', poiId: a.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: a.id });
    s = dispatch(s, { type: 'START_PROJECT' });
    Object.assign(s.projects[0], { progress: 60, status: 'Drafting', draft: 10 });
    if (kind === 'viva') { s.month = 22; s.stage = 'milestone'; s.milestoneKind = 'prelim'; }
    else { s.stage = 'minigame'; s.minigame = kind; }
    const meta = emptyMeta();
    Object.assign(meta.settings, { tips: false, lang: 'en', textSize: 2, selfPaced: false });
    saveRun(localStorage, s, meta);
  }, kind);
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  if (kind === 'viva') await page.locator('[data-action="milestone"][data-id="balanced"]').click();
}

const meters = { bench: '.bq-needle', lecture: '[data-lec-time]', cluster: '[data-cl-clock]', viva: '[data-vv-clock]' };
const details = {
  bench: '[data-bq-label], [data-bq-tally], [data-bq-stage]',
  lecture: '[data-lec-caught], [data-lec-board], [data-lec-work]',
  cluster: '[data-cl-count], [data-cl-left], [data-cl-flash]',
  viva: '[data-vv-slide-title], [data-vv-composure], [data-vv-flash]',
};
async function snapshot(page, kind) {
  return page.evaluate(({ meter, detail }) => ({
    meter: document.querySelector(meter)?.getAttribute('style'),
    detail: [...document.querySelectorAll(detail)].map(node => [node.textContent, node.getAttribute('style')]),
  }), { meter: meters[kind], detail: details[kind] });
}

for (const kind of Object.keys(meters)) {
  test(`timed ${kind} pauses on a phone and resumes the same activity after comfort settings`, async ({ page }) => {
    await timedActivity(page, kind);
    await page.clock.runFor(480);
    const trigger = page.locator('[data-action="pause-activity"]');
    await expect(trigger).toBeInViewport();
    await trigger.click();
    const paused = page.getByRole('dialog', { name: 'Paused', exact: true });
    await expect(paused).toBeFocused();
    // install() still follows wall time. Freeze the test clock while the activity is paused
    // so a real animation frame cannot race the exact-state assertion after Resume.
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    const before = await snapshot(page, kind);
    await page.keyboard.press('Space');
    await page.clock.runFor(30_000);
    expect(await snapshot(page, kind)).toEqual(before);
    const comfort = paused.getByRole('button', { name: 'Reading & comfort', exact: true });
    await comfort.focus();
    await page.keyboard.press('Enter');
    const settings = page.getByRole('dialog', { name: 'Reading & comfort', exact: true });
    await expect(settings).toBeFocused();
    await page.clock.runFor(30_000);
    expect(await snapshot(page, kind)).toEqual(before);
    await settings.getByRole('button', { name: 'Close', exact: true }).focus();
    await page.keyboard.press('Space');
    await expect(paused).toBeVisible();
    await expect(comfort).toBeFocused();
    await page.clock.runFor(1000);
    expect(await snapshot(page, kind)).toEqual(before);
    await paused.getByRole('button', { name: 'Resume activity', exact: true }).click();
    await expect(trigger).toBeFocused();
    expect(await snapshot(page, kind)).toEqual(before);
    await page.clock.runFor(240);
    expect((await snapshot(page, kind)).meter).not.toEqual(before.meter);
  });
}

test('pausing timed reading preserves its feedback hold instead of skipping a paper', async ({ page }) => {
  await timedActivity(page, 'bench');
  await page.clock.runFor(120);
  await page.locator('[data-action="bench-strike"]').click();
  const before = await snapshot(page, 'bench');
  await page.locator('[data-action="pause-activity"]').click();
  await page.clock.runFor(30_000);
  expect(await snapshot(page, 'bench')).toEqual(before);
  await page.getByRole('button', { name: 'Resume activity', exact: true }).click();
  await page.clock.runFor(400);
  expect(await snapshot(page, 'bench')).toEqual(before);
  await page.clock.runFor(1500);
  expect((await snapshot(page, 'bench')).detail[0]).not.toEqual(before.detail[0]);
});
