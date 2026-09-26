import { test, expect } from '@playwright/test';
import { resumeRecovery } from './recovery-helpers.js';

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);

async function completionSeed(page, lang, revisions) {
  await page.goto('/');
  await page.evaluate(async ({ lang, revisions }) => {
    const { createRun } = await import('/src/engine/state.js');
    const { prepareRun, dispatch } = await import('/src/engine/game.js');
    const { beginRevisions } = await import('/src/engine/thesis.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = prepareRun(createRun(842, { background: 'masters', topic: 'ml', international: false, household: 'alone' }));
    const a = s.advisors[0];
    s.phase = 'admissions'; s.offers = [a.schoolId];
    s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: a.id });
    s = dispatch(s, { type: 'START_PROJECT' });
    const paperId = s.activeProjectId;
    s.month = 60; s.week = 0; s.stage = 'plan'; s.event = null; s.eventReturn = 'plan';
    s.eventQueue = []; s.scheduled = []; s.requests = []; s.crunch = null;
    s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass'; s.milestones.defenseMonth = null;
    s = dispatch(s, { type: 'START_THESIS' });
    const th = s.projects.find(p => p.kind === 'thesis');
    th.status = 'Drafting'; th.draft = 45; th.progress = 80;
    s = dispatch(s, { type: 'SELECT_PROJECT', id: paperId });
    s.projects.find(p => p.id === paperId).status = 'Drafting';
    s.focus = null; s.pace = 'month'; s.tempo = 'month'; s.leaveWeeks = 0;
    s.crisis = null; s.conditions = []; s.burnoutMonths = 0;
    Object.assign(s.player.stats, { health: 90, energy: revisions ? 6 : 70, money: 30000, hope: 90 });
    s.player.hidden.stress = 10;
    if (revisions) {
      const approved = s.projects.find(p => p.kind === 'thesis');
      approved.status = 'Ready'; approved.draft = 95;
      beginRevisions(s);
    }
    const meta = emptyMeta();
    Object.assign(meta.settings, { tips: false, lang, textSize: 3, quiet: true, sound: false, selfPaced: true });
    const result = saveRun(localStorage, s, meta);
    if (result.error) throw new Error(result.error);
  }, { lang, revisions });
  await resumeRecovery(page);
}

async function expectPhoneFit(page) {
  const guide = page.locator('.next-step');
  await expect(guide).toBeVisible();
  expect(await guide.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const box = await guide.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(391);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

for (const lang of ['en', 'zh']) {
  test(`phone completion guide returns to the actual dissertation in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await completionSeed(page, lang, false);
    const before = await saved(page);
    expect(before.activeProjectId).not.toBe('thesis');
    const action = page.locator('.next-step [data-action="select-project"][data-id="thesis"]');
    await expect(action).toHaveText(lang === 'zh' ? '回到毕业论文' : 'Return to the dissertation');
    await expectPhoneFit(page);
    await action.click();
    await expect.poll(async () => (await saved(page)).activeProjectId).toBe('thesis');
    await expect(page.locator('.project-row.selected')).toContainText(before.projects.find(p => p.id === 'thesis').title);
    await expect(page.locator('.next-step')).toContainText(lang === 'zh' ? '推进毕业论文' : 'Work on the dissertation');
    await expectPhoneFit(page);
  });

  test(`phone revision guide performs work and then offers recovery in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await completionSeed(page, lang, true);
    const before = await saved(page), next = before.thesis.items.find(item => item.done < item.effort);
    const action = page.locator(`.next-step [data-action="revise"][data-id="${next.id}"]`);
    await expect(action).toHaveText(lang === 'zh' ? '修改下一项 · −6 精力' : 'Revise next item · −6 Energy');
    await expectPhoneFit(page);
    await action.click();
    await expect.poll(async () => (await saved(page)).thesis.done).toBe(before.thesis.done + 1);
    const after = await saved(page);
    expect(after.thesis.items.find(item => item.id === next.id).done).toBe(next.done + 1);
    expect(after.player.stats.energy).toBe(0);
    expect(after.month).toBe(before.month);
    await expect(page.locator('.next-step')).toContainText(lang === 'zh' ? '先恢复精力，再修改' : 'Recover before revising');
    await expect(page.locator('.next-step [data-action="open"][data-app="life"]')).toBeVisible();
    await expectPhoneFit(page);
  });
}
