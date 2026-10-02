export async function resumeTimeline(page) {
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
  await page.locator('[data-action="wiz-next"]').click();
}

export async function seedTimeline(page, { lang = 'en', condition = 'handover', energy = 77 } = {}) {
  await page.goto('/');
  const details = await page.evaluate(async ({ lang, condition, energy }) => {
    const { setAppLanguage } = await import('/src/i18n/apply.js');
    const { conditional } = await import('/tests/timeline-fixtures.js');
    const { timelineCondition } = await import('/src/engine/timeline.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    setAppLanguage(lang);
    const s = conditional(condition);
    s.player.stats.energy = energy;
    const meta = emptyMeta();
    Object.assign(meta.settings, { lang, tips: false, sound: false, quiet: true, textSize: 2, selfPaced: true });
    const saved = saveRun(localStorage, s, meta);
    if (saved.error) throw new Error(saved.error);
    return { ...timelineCondition(s), energy, month: s.month, week: s.week };
  }, { lang, condition, energy });
  await resumeTimeline(page);
  return details;
}
