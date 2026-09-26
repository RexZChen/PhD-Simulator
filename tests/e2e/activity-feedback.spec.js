import { test, expect } from '@playwright/test';

async function startPresentation(page, lang, selfPaced = true) {
  await page.goto('/');
  await page.evaluate(async ({ lang, selfPaced }) => {
    const { createRun } = await import('/src/engine/state.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    const { startTrip } = await import('/src/engine/trip.js');
    let s = createRun(4242, { background: 'masters', topic: 'ml', international: false });
    const a = s.advisors[6];
    s.phase = 'admissions'; s.offers = [a.schoolId];
    s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: a.id });
    s = dispatch(s, { type: 'START_PROJECT' });
    const p = s.projects[0]; p.status = 'Accepted'; p.venueId = 'osdisaster';
    p.submissionHistory = [{ venueId: 'osdisaster', venue: 'OSDIsaster', month: 2, outcome: 'Accept', reviewers: [], quality: 72, diamonds: 4 }];
    s.player.stats.money = 12000;
    startTrip(s, p, 'boston');
    const meta = emptyMeta(); meta.settings.tips = false; meta.settings.selfPaced = selfPaced; meta.settings.lang = lang; meta.settings.textSize = 2;
    saveRun(localStorage, s, meta);
  }, { lang, selfPaced });
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
  await page.locator('[data-action="wiz-next"]').click();
  // Freeze before the activity starts; a browser round trip makes Date.now() a past target.
  await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2030-01-01T00:01:00Z'));
  for (let i = 0; i < 4 && !(await page.locator('[data-action="talk-intro"]').count()); i++) await page.locator('[data-action="trip-day"][data-id="sessions"]').click();
  await page.locator('[data-action="talk-intro"]').click();
  await page.locator('[data-action="talk-start"]').click();
}

for (const lang of ['en', 'zh']) {
  test(`self-paced talk explains each choice and waits on the final section (${lang})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await startPresentation(page, lang);
    for (let i = 0; i < 6; i++) {
      await expect(page.locator('[data-tg-slot]')).toContainText(`${i + 1}/6`);
      const button = page.locator('[data-tg-pick]').first();
      const phrase = await button.textContent();
      await button.focus();
      await page.keyboard.press('Enter');
      const feedback = page.locator('[data-tg-feedback]');
      await expect(feedback).toBeFocused();
      await expect(feedback).toContainText(phrase);
      await expect(feedback).toContainText(lang === 'en' ? /strengthens the talk|raises the stakes|without strengthening/ : /说服力|更难应付/);
      await expect(page.locator('[data-tg-words]')).toBeHidden();
      await page.clock.fastForward(30_000);
      await expect(page.locator('[data-tg-slot]')).toContainText(`${i + 1}/6`);
      await expect(feedback).toBeVisible();
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-tg-advance]')).toBeFocused();
      await page.keyboard.press('Enter');
      if (i < 5) await expect(page.locator('[data-tg-slot]')).toBeFocused();
    }
    await expect(page.locator('[data-tg-slot]')).toHaveCount(0);
    await expect(page.locator('[data-action="talk-qa"]')).toBeVisible();
    await page.locator('[data-action="talk-qa"]').click();
    for (let question = 0; question < 3; question++) {
      await page.locator('[data-action="trip-qa"]').first().click();
      await expect(page.locator(question < 2 ? '.qa-prev' : '[data-qa-result]')).toBeFocused();
    }
    await expect(page.locator('[data-qa-result]')).toContainText(lang === 'en' ? 'Q&A complete' : '问答结束');
  });
}

test('timed presentation and Q&A clocks stop behind Pause and resume from the same state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startPresentation(page, 'en', false);
  await page.clock.runFor(1000);
  const talkState = async () => ({
    section: await page.locator('[data-tg-slot]').textContent(),
    phrases: await page.locator('[data-tg-pick]').allTextContents(),
    width: await page.locator('[data-tg-bar]').evaluate(el => el.style.width),
    score: await page.locator('[data-tg-score]').textContent(),
  });
  const beforeTalk = await talkState();
  expect(parseFloat(beforeTalk.width)).toBeLessThan(100);
  await page.locator('.talkgame [data-action="pause-activity"]').click();
  const pause = page.getByRole('dialog', { name: 'Paused', exact: true });
  await expect(pause).toBeVisible();
  await page.clock.runFor(30_000);
  expect(await talkState()).toEqual(beforeTalk);
  await pause.getByRole('button', { name: 'Resume activity', exact: true }).click();
  expect(await talkState()).toEqual(beforeTalk);
  await page.clock.runFor(1000);
  expect(parseFloat((await talkState()).width)).toBeLessThan(parseFloat(beforeTalk.width));
  await page.clock.runFor(4000);
  await expect(page.locator('[data-tg-slot]')).toContainText('2/6');
  for (let i = 0; i < 5; i++) await page.locator('[data-tg-pick]').first().click();
  await expect(page.locator('[data-action="talk-qa"]')).toBeVisible();
  await page.locator('[data-action="talk-qa"]').click();
  await page.clock.runFor(1000);
  const qaState = async () => ({
    question: await page.locator('.qa-ask').textContent(),
    count: await page.locator('.trip.qa .trip-head p').textContent(),
    answers: await page.locator('[data-action="trip-qa"]').allTextContents(),
    width: await page.locator('[data-qa-timer]').evaluate(el => el.style.width),
  });
  const beforeQa = await qaState();
  expect(parseFloat(beforeQa.width)).toBeLessThan(100);
  await page.locator('.trip.qa [data-action="pause-activity"]').click();
  await expect(pause).toBeVisible();
  await page.clock.runFor(30_000);
  expect(await qaState()).toEqual(beforeQa);
  await expect(page.locator('.qa-prev')).toHaveCount(0);
  await pause.getByRole('button', { name: 'Resume activity', exact: true }).click();
  expect(await qaState()).toEqual(beforeQa);
  await page.clock.runFor(1000);
  expect(parseFloat((await qaState()).width)).toBeLessThan(parseFloat(beforeQa.width));
  await page.clock.runFor(13_000);
  await expect(page.locator('.trip.qa .trip-head p')).not.toHaveText(beforeQa.count);
  await expect(page.locator('.qa-prev')).toBeVisible();
  await page.clock.runFor(14_100);
  await expect(page.locator('.trip.qa .trip-head p')).toContainText('3 of 3');
  await page.clock.runFor(14_100);
  await expect(page.locator('[data-qa-result]')).toContainText('0/3 answers landed');
  await expect(page.locator('[data-action="trip-day"][data-id="coffee"]')).toBeVisible();
});
