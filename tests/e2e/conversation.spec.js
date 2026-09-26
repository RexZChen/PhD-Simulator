import { test, expect } from '@playwright/test';

const englishUpdate = 'Here is my current status, what remains unresolved, and what I plan to try next. Please let me know if the priority should change.';

for (const lang of ['en', 'zh']) test(`advisor history and unavailable updates remain truthful at 320px (${lang})`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/');
  await page.evaluate(async lang => {
    const { createRun, chat } = await import('/src/engine/state.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    const { asks } = await import('/src/data/asks.js');
    let s = createRun(42);
    const advisor = s.advisors[0];
    s.phase = 'admissions'; s.offers = [advisor.schoolId];
    s.applications = [{ schoolId: advisor.schoolId, poiId: advisor.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: advisor.id });
    s.stage = 'plan'; s.event = null; s.eventQueue = []; s.scheduled = [];
    s.chatMessages = []; s.month = 15; s.week = 3;
    chat(s, 'advisor', s.advisor.name, 'The last actual message.');
    s.month = 16; s.week = 1; s.advisorMode = { id: 'checkedOut' };
    chat(s, 'advisor', s.player.name, 'An earlier progress update.', { mine: true });
    const index = asks.findIndex(ask => ask.id === 'update');
    chat(s, 'advisor', s.advisor.name, 'Old narrative outcome.', { i18n: { p: `asks.${index}.success.text.0` } });
    s.chatMessages[1].time = '18:20'; s.chatMessages[2].time = '08:05';
    s.player.stats.energy = 80; s.askCooldowns = {}; s.rng = 1;
    const meta = emptyMeta(); meta.settings.lang = lang; meta.settings.textSize = 2;
    meta.settings.tips = false; meta.settings.quiet = true;
    saveRun(localStorage, s, meta);
  }, lang);
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
  await page.locator('[data-action="wiz-next"]').click();
  await page.locator('.desk-icon[data-app="chat"]').click();
  const recency = lang === 'en' ? 'Last message 2 weeks ago' : '最近一条消息在2周前';
  const noteLabel = lang === 'en' ? 'Conversation note' : '对话记录';
  await expect(page.locator('.ch-advisor .ch-topic')).toContainText(recency);
  await expect(page.locator('.sl-note')).toHaveCount(1);
  await expect(page.locator('.sl-note')).toContainText(noteLabel);
  await expect(page.locator('.sl-msg.mine .sl-who small')).toHaveText('18:20');
  await expect(page.locator('.sl-note small')).toHaveText('18:21');
  await expect(page.locator('.sl-note button')).toHaveCount(0);
  const initial = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run;
    return { times: s.chatMessages.map(m => m.time), energy: s.player.stats.energy, trust: s.relationship.trust };
  });
  expect(initial.times.slice(-2)).toEqual(['18:20', '18:21']);

  await page.locator('[data-action="chat-menu"]').first().click();
  const update = page.locator('[data-action="chat-option"][data-id="ask:update"]');
  await update.locator('xpath=ancestor::details[1]/summary').click();
  await update.click();
  await page.locator('.composer-input[data-action="compose-skip"]').click();
  const composed = page.locator('[data-compose-text]');
  if (lang === 'zh') {
    await expect(composed).toContainText(/\p{Script=Han}/u);
    await expect(composed).not.toContainText('Here is my current status');
  } else await expect(composed).toHaveText(englishUpdate);
  const draft = await composed.innerText();
  await expect(page.locator('[data-action="chat-send"]')).toBeEnabled();
  await page.locator('[data-action="chat-send"]').click();
  await expect(page.locator('.sl-msg.mine .sl-body > p').last()).toHaveText(draft);
  await expect(page.locator('.sl-note')).toHaveCount(2);
  await expect(page.locator('.sl-note button')).toHaveCount(0);
  await expect(page.locator('.sl-msg:not(.mine)')).toHaveCount(1);
  await expect(page.locator('.ch-advisor .ch-topic')).toContainText(recency);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);
  expect(after.player.stats.energy).toBe(initial.energy - 2);
  expect(after.relationship.trust).toBe(initial.trust + 3);
  expect(['conversation-note', 'automatic-reply']).toContain(after.chatMessages.at(-1).kind);
  expect(after.chatMessages.at(-1).time >= after.chatMessages.at(-2).time).toBe(true);
  const bounds = await page.locator('.sl-note').evaluateAll(nodes => nodes.map(node => ({ right: node.getBoundingClientRect().right, client: node.clientWidth, scroll: node.scrollWidth })));
  for (const box of bounds) {
    expect(box.right).toBeLessThanOrEqual(320);
    expect(box.scroll).toBeLessThanOrEqual(box.client + 1);
  }
  // A message genuinely sent in English must remain translatable in saved history.
  if (lang === 'en') {
    await page.locator('[data-action="start-menu"]').click();
    await page.locator('.start-menu [data-action="language"][data-id="zh"]').click();
    const sent = page.locator('.sl-msg.mine .sl-body > p').last();
    await expect(sent).toContainText(/\p{Script=Han}/u);
    await expect(sent).not.toContainText('Here is my current status');
    const translated = await sent.innerText();
    await page.reload();
    await page.locator('.boot').click();
    await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
    await page.locator('[data-action="wiz-next"]').click();
    await page.locator('.desk-icon[data-app="chat"]').click();
    await expect(page.locator('.sl-msg.mine .sl-body > p').last()).toHaveText(translated);
  }
});
