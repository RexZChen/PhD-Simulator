import { test, expect } from '@playwright/test';
import { seedTimeline, resumeTimeline } from './timeline-helpers.js';

for (const lang of ['en', 'zh']) {
  test(`graduation handover records the named work and focuses its receipt (${lang})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const c = await seedTimeline(page, { lang });
    const panel = page.locator('[data-timeline-condition="handover"]');
    await panel.scrollIntoViewIfNeeded();
    await expect(panel).toContainText(c.projectTitle);
    await expect(panel).toContainText(c.recipientName);
    const action = panel.locator('[data-action="timeline-document"]');
    await expect(action).toBeEnabled();
    await action.focus();
    await page.keyboard.press('Enter');
    const receipt = page.locator('[data-timeline-receipt]');
    await expect(receipt).toBeFocused();
    await expect(receipt).toContainText(c.projectTitle);
    await expect(receipt).toContainText(c.recipientName);
    await expect(page.locator('[data-action="timeline-document"]')).toHaveCount(0);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);
    expect(saved.player.stats.energy).toBe(c.energy - 6);
    expect([saved.month, saved.week]).toEqual([c.month, c.week]);
    expect(saved.grad.conditionHandover.projectId).toBe(c.projectId);
    expect(saved.grad.conditionHandover.recipientId).toBe(c.recipientId);
    expect(saved.milestones.defenseMonth).toBeNull();
    await resumeTimeline(page);
    await receipt.scrollIntoViewIfNeeded();
    await expect(receipt).toContainText(c.recipientName);
    expect(await receipt.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.locator('.desk-icon[data-app="chat"]').click();
    await page.locator(`[data-action="chat-channel"][data-id="dm:${c.recipientId}"]`).click();
    await expect(page.getByRole('region', { name: lang === 'en' ? 'Conversation history' : '聊天记录' })).toContainText(c.projectTitle);
  });

  test(`handover explains insufficient energy before a click (${lang})`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await seedTimeline(page, { lang, energy: 5 });
    const panel = page.locator('[data-timeline-condition="handover"]');
    await panel.scrollIntoViewIfNeeded();
    await expect(panel.locator('[data-action="timeline-document"]')).toBeDisabled();
    await expect(panel).toContainText(lang === 'en' ? 'Not enough Energy (6 needed).' : '精力不足（需要 6）。');
    expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  });
}
