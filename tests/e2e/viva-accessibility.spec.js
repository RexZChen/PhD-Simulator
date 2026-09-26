import { test, expect } from '@playwright/test';

test('self-paced exams keep keyboard readers on the new question, interruption and feedback', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
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
    s.month = 22; s.stage = 'milestone'; s.milestoneKind = 'prelim';
    const meta = emptyMeta();
    Object.assign(meta.settings, { tips: false, lang: 'en', selfPaced: true });
    saveRun(localStorage, s, meta);
  });
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  await page.locator('[data-action="milestone"][data-id="balanced"]').click();

  let interrupted = false;
  for (let n = 0; n < 30 && await page.locator('[data-vv][data-phase="talk"]').count(); n++) {
    const advance = page.locator('[data-action="exam-advance"]:visible');
    if (await advance.count()) {
      await expect(page.locator('[data-vv-flash]')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(advance).toBeFocused();
      await page.keyboard.press('Enter');
    } else if (await page.locator('[data-vv-interrupt]:not(.hidden)').count()) {
      interrupted = true;
      await expect(page.locator('[data-vv-interrupt]')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.locator('.ex-talk [data-action="exam-interrupt"]')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-vv-slidebox]')).toBeFocused();
    } else {
      const next = page.locator('[data-action="exam-talk"][data-id="next"]');
      await next.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-vv-reading]')).toBeFocused();
    }
  }
  expect(interrupted).toBe(true);
  await expect(page.locator('[data-vv]')).toHaveAttribute('data-phase', 'qa');
  await expect(page.locator('[data-vv-q]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-action="viva-move"]').first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-vv-flash]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-action="exam-advance"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-vv-q]')).toBeFocused();

  const nextAnswer = page.locator('[data-action="viva-move"]').first();
  await nextAnswer.focus();
  const mutations = await page.evaluate(async () => {
    const { repaintViva } = await import('/src/ui/viva.js');
    const note = document.querySelector('[data-vv-pacing-note]');
    const observer = new MutationObserver(() => {});
    observer.observe(note, { childList: true, subtree: true, characterData: true });
    repaintViva(); repaintViva();
    const count = observer.takeRecords().length;
    observer.disconnect();
    return count;
  });
  expect(mutations).toBe(0);
  await expect(nextAnswer).toBeFocused();
  await expect(page.locator('[data-vv-pacing-note]')).toHaveAttribute('aria-live', 'polite');
});
