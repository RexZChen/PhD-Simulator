import { test, expect } from '@playwright/test';
import { recoverySeed, resumeRecovery } from './recovery-helpers.js';

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);

async function seedCrisis(page, lang, unavailable) {
  await recoverySeed(page, { lang });
  await page.evaluate(async unavailable => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { openCrisis, resolveCrisis } = await import('/src/engine/life.js');
    const { run: s, meta } = loadSave(localStorage);
    s.event = null; s.eventQueue = []; s.chatMessages = [];
    s.advisor.availability = unavailable ? 0 : 100; s.advisor.caring = 100;
    s.advisorMode = { id: unavailable ? 'checkedOut' : 'attentive', until: s.month + 2 };
    s.requests = [
      { id: 'owned', advisorId: s.advisor.id, advisorName: s.advisor.name, text: 'Current request', kind: 'figure', templateId: 'figure', createdWeek: 64, status: 'open', dueWeek: 80 },
      { id: 'old', advisorId: 'former', advisorName: 'Former Advisor', text: 'Former request', kind: 'figure', templateId: 'figure', createdWeek: 64, status: 'open', dueWeek: 80 },
      { id: 'closed', advisorId: s.advisor.id, advisorName: s.advisor.name, text: 'Completed request', kind: 'figure', templateId: 'figure', createdWeek: 64, status: 'done', dueWeek: 80 },
    ];
    s.labmates.forEach((mate, i) => { mate.status = i === 1 ? 'active' : 'left'; });
    openCrisis(s, 'collapse');
    // Choose a reproducible support branch; the live resolution still comes from the UI.
    for (let seed = 0; seed < 30; seed++) {
      const probe = structuredClone(s); probe.rng = seed;
      resolveCrisis(probe, 'treat');
      if (probe.crisis.aftermath.response === (unavailable ? 'unavailable' : 'practical')) { s.rng = seed; break; }
    }
    saveRun(localStorage, s, meta);
  }, unavailable);
  await resumeRecovery(page);
  await expect(page.locator('.dialog.crisis')).toBeVisible();
}

for (const lang of ['en', 'zh']) {
  test(`crisis support preserves ownership and translates the actual outcome in ${lang}`, async ({ page }) => {
    await seedCrisis(page, lang, false);
    await page.locator('[data-action="crisis"][data-id="treat"]').click();
    const s = await saved(page);
    expect(s.requests.map(r => r.dueWeek)).toEqual([82, 80, 80]);
    expect(s.crisis.aftermath.movedRequests).toBe(1);
    expect(s.crisis.weeks).toBe(2);
    const logText = await page.evaluate(async () => {
      const { entryText } = await import('/src/engine/state.js');
      const s = JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run;
      return s.history.map(h => entryText(s, h)).join('\n');
    });
    expect(logText).toContain(lang === 'zh' ? '将1项待完成任务的截止日期顺延了2周' : 'extended 1 open request deadlines by 2 weeks');
    await page.locator('.desk-icon[data-app="chat"]').click();
    await page.locator('[data-action="chat-channel"][data-id="advisor"]').click();
    await expect(page.locator('.chat-log')).toContainText(lang === 'zh' ? '已按你的休假时长顺延' : 'I have moved our pending requests');
    const reply = page.locator('.chat-log [data-action="chat-reply"]');
    await expect(reply).toHaveCount(1);
    await expect(reply).toHaveAttribute('data-kind', 'crisis_ack');
    await expect(reply).toHaveText(lang === 'zh' ? '道谢，暂不汇报工作' : 'Thank them; no work update');
    await reply.click();
    await expect(page.locator('.chat-log')).toContainText(lang === 'zh' ? '现在不用再回复了' : 'No need to answer again now.');
    await expect(page.locator('.chat-log [data-action="chat-reply"]')).toHaveCount(0);
    expect((await saved(page)).player.stats.energy).toBe(s.player.stats.energy);
    await resumeRecovery(page);
    expect((await saved(page)).requests.map(r => r.dueWeek)).toEqual([82, 80, 80]);
  });

  test(`unavailable advisor sends no invented reply and a real labmate offers help in ${lang}`, async ({ page }) => {
    await seedCrisis(page, lang, true);
    await page.locator('[data-action="crisis"][data-id="treat"]').click();
    const s = await saved(page);
    expect(s.requests.map(r => r.dueWeek)).toEqual([80, 80, 80]);
    expect(s.chatMessages.filter(m => m.channel === 'advisor')).toHaveLength(0);
    const mate = s.labmates.find(m => m.status === 'active');
    const message = s.chatMessages.find(m => m.channel === 'general');
    expect(message.senderId).toBe(mate.id); expect(message.sender).toBe(mate.name);
    await page.locator('.desk-icon[data-app="chat"]').click();
    await page.locator('[data-action="chat-channel"][data-id="advisor"]').click();
    await expect(page.locator('.chat-log .sl-msg')).toHaveCount(0);
    await page.locator('[data-action="chat-channel"][data-id="general"]').click();
    await expect(page.locator('.chat-log')).toContainText(mate.name);
    await expect(page.locator('.chat-log')).toContainText(lang === 'zh' ? /送点吃的|帮你接过去|不用跟上实验室群聊/ : /bring you something to eat|task I could take off|keep up with the lab chat/);
    const reply = page.locator('.chat-log [data-action="chat-reply"]');
    await expect(reply).toHaveCount(1);
    await expect(reply).toHaveAttribute('data-kind', 'crisis_ack');
    await expect(reply).toHaveText(lang === 'zh' ? '道谢，暂不汇报工作' : 'Thank them; no work update');
    await reply.click();
    await expect(page.locator('.chat-log')).toContainText(lang === 'zh' ? '我现在没有工作进度可以补充' : 'I do not have a work update to add right now.');
    await expect(page.locator('.chat-log')).toContainText(lang === 'zh' ? '现在不用再回复了' : 'No need to answer again now.');
    await expect(page.locator('.chat-log [data-action="chat-reply"]')).toHaveCount(0);
    const answered = await saved(page);
    expect(answered.chatMessages.at(-1).senderId).toBe(mate.id);
    expect(answered.chatMessages.at(-1).sender).toBe(mate.name);
    expect(answered.player.stats.energy).toBe(s.player.stats.energy);
  });
}
