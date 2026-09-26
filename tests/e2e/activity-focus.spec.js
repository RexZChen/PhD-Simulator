import { test, expect } from '@playwright/test';

async function activity(page, kind) {
  await page.goto('/');
  await page.evaluate(async kind => {
    const { createRun } = await import('/src/engine/state.js');
    const { prepareRun, dispatch } = await import('/src/engine/game.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = prepareRun(createRun(4242, { background: 'masters', topic: 'ml', international: false }));
    const advisor = s.advisors[6];
    s.phase = 'admissions'; s.offers = [advisor.schoolId];
    s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: advisor.id });
    s = dispatch(s, { type: 'START_PROJECT' });
    Object.assign(s.projects[0], { progress: 60, status: 'Drafting', draft: 10 });
    s.stage = 'minigame'; s.minigame = kind;
    const meta = emptyMeta();
    Object.assign(meta.settings, { tips: false, lang: 'en', selfPaced: true });
    saveRun(localStorage, s, meta);
  }, kind);
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
}

test('debugging feedback and next log remain keyboard-readable', async ({ page }) => {
  await activity(page, 'cluster');
  const correct = await page.evaluate(async () => {
    const { clusterStages } = await import('/src/data/cluster.js');
    const lines = clusterStages.flatMap(stage => stage.lines).filter(line => line.real).map(line => line.t);
    return [...document.querySelectorAll('[data-action="cluster-line"]')].find(button => lines.includes(button.textContent)).dataset.id;
  });
  const before = await page.locator('[data-cl-title]').innerText();
  await page.locator(`[data-action="cluster-line"][data-id="${correct}"]`).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-cl-flash]')).toBeFocused();
  await expect(page.locator('[data-cl-flash]')).not.toBeEmpty();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-action="cluster-advance"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-cl-title]')).toBeFocused();
  await expect(page.locator('[data-cl-title]')).not.toHaveText(before);
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-action="cluster-line"]').first()).toBeFocused();
});

test('lecture feedback and next cue remain keyboard-readable', async ({ page }) => {
  await activity(page, 'lecture');
  const status = page.locator('[data-lec-status]');
  await expect(status).toContainText('Part 1 of 8');
  await expect(status).toContainText('They are writing on the board.');
  await page.locator('[data-action="lecture-choice"][data-id="listen"]').focus();
  await page.keyboard.press('Enter');
  await expect(status).toBeFocused();
  await expect(status).toContainText('You take notes.');
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-action="lecture-choice"][data-id="next"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(status).toBeFocused();
  await expect(status).toContainText('Part 2 of 8');
  await expect(status).not.toContainText('You take notes.');
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-action="lecture-choice"][data-id="listen"]')).toBeFocused();
});
