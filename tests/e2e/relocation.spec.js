import { test, expect } from '@playwright/test';

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run);
async function resume(page) {
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
  await page.locator('[data-action="wiz-next"]').click();
}

for (const [lang, event, choice] of [['en', 'advisor_moves', 'move'], ['zh', 'advisor_leaves', 'follow']]) {
  test(`signed transfer survives reload and becomes a new campus with remote friends in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await page.goto('/');
    const original = await page.evaluate(async ({ lang, event }) => {
      const { createRun } = await import('/src/engine/state.js');
      const { prepareRun, dispatch } = await import('/src/engine/game.js');
      const { saveRun, emptyMeta } = await import('/src/engine/save.js');
      let s = prepareRun(createRun(4242, { background: 'masters', topic: 'ml', international: false }));
      const a = s.advisors[6];
      s.phase = 'admissions'; s.offers = [a.schoolId];
      s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
      s = dispatch(s, { type: 'ENROLL', id: a.id });
      s = dispatch(s, { type: 'START_PROJECT' });
      s.month = 16; s.stage = 'event'; s.event = event; s.eventVariant = 0;
      if (event === 'advisor_leaves') {
        s.month = 26;
        s.advisorTenure = {
          advisorId: s.advisor.id, schoolId: s.program.id, outcome: 'denied',
          announcedMonth: 14, departureMonth: 26, status: 'notice',
          eventId: 'advisor_tenure_denied', response: 'follow',
        };
      }
      s.eventReturn = 'report'; s.eventQueue = []; s.report.month = s.month;
      s.player.stats.money = 100; s.debt = 0; s.milestones.prelim = 'pass';
      const meta = emptyMeta();
      Object.assign(meta.settings, { lang, textSize: 3, tips: false, sound: false, quiet: true, selfPaced: true });
      saveRun(localStorage, s, meta);
      return { month: s.month, school: s.program.id, schoolName: s.program.name, peer: s.peers[0].id, committee: s.committee };
    }, { lang, event });
    await resume(page);
    const terms = page.locator('.relocation-terms');
    await expect(terms).toContainText('$1,600');
    await expect(terms).toContainText('$1,500');
    expect(await terms.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.locator(`[data-action="choice"][data-id="${choice}"]`).click();
    const signed = await saved(page);
    expect(signed.program.id).toBe(original.school);
    expect(signed.pendingRelocation.borrowed).toBe(1500);
    expect(signed.player.stats.money).toBe(0);
    expect(signed.debt).toBe(1500);
    expect(signed.achievements).not.toContain('wentwiththem');
    await resume(page);
    await page.locator('[data-action="dismiss-report"]').click();
    const arrived = await saved(page);
    expect(arrived.month).toBe(original.month + 1);
    expect(arrived.program.id).toBe(signed.pendingRelocation.schoolId);
    expect(arrived.relocationHistory).toHaveLength(1);
    expect(arrived.ledger.stipend).toBe(signed.pendingRelocation.stipend);
    expect(arrived.ledger.rent).toBe(signed.pendingRelocation.rent);
    expect(arrived.milestones.prelim).toBe('pass');
    expect(arrived.committee).toEqual(original.committee);
    expect(arrived.achievements).toContain('wentwiththem');
    await expect(page.locator('.relocation-panel')).toContainText(arrived.program.name);
    await page.locator('.desktop-icons [data-app="chat"]').click();
    await page.locator(`[data-action="chat-channel"][data-id="dm:${original.peer}"]`).click();
    await expect(page.locator('.ch-topic')).toContainText(original.schoolName);
    await expect(page.locator('.ch-topic')).toContainText(lang === 'zh' ? '异地联系' : 'Remote');
    await expect(page.locator('.slack')).not.toContainText('undefined');
    expect(await page.locator('.slack').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  });
}
