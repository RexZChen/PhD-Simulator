import { test, expect } from '@playwright/test';
import { recoverySeed, resumeRecovery } from './recovery-helpers.js';

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);

for (const lang of ['en', 'zh']) {
  test(`stale third-submission scene dismisses without costs or an old dice overlay in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await recoverySeed(page, { lang, critical: false });
    await page.evaluate(async () => {
      const { loadSave, saveRun } = await import('/src/engine/save.js');
      const { createProject } = await import('/src/engine/paper.js');
      const { run: s, meta } = loadSave(localStorage);
      s.month = 8; s.week = 0; s.crisis = null; s.leaveWeeks = 0;
      s.stage = 'event'; s.event = 'midphd_third_submission';
      s.eventVariant = 0; s.eventQueue = []; s.eventReturn = 'plan'; s.needsBegin = true;
      s.projects = [];
      const main = createProject(s); main.status = 'Rejected';
      main.submissionHistory = [{ venueId: 'tmlrgh', outcome: 'Reject', month: 6 }];
      const side = createProject(s, { kind: 'side' }); s.activeProjectId = side.id;
      s.lastRoll = { label: 'Communication', value: 60, difficulty: 50, odds: 59, draw: 20, success: true };
      s.player.stats.energy = 70; s.player.stats.health = 90;
      s.player.hidden.stress = 20; s.summons = { answered: true, keep: 1 };
      s.pendingTrip = null;
      saveRun(localStorage, s, meta);
    });
    await resumeRecovery(page);
    await expect(page.locator('[data-action="choice"][data-id="reframe"]')).toBeVisible();
    const before = await saved(page);
    await page.locator('[data-action="choice"][data-id="reframe"]').click();
    await expect(page.locator('[data-action="choice"]')).toHaveCount(0);
    await expect(page.locator('.roll-toast')).toHaveCount(0);
    await expect(page.locator('.plans')).toBeVisible();
    const after = await saved(page);
    expect(after.stage).toBe('plan'); expect(after.event).toBeNull();
    expect(after.needsBegin).toBe(false); expect(after.lastRoll).toBeNull();
    expect([after.month, after.week]).toEqual([before.month, before.week]);
    expect(after.player.stats).toEqual(before.player.stats);
    expect(after.player.hidden).toEqual(before.player.hidden);
    expect(after.projects).toEqual(before.projects);
    expect(after.relationship).toEqual(before.relationship);
  });
}
