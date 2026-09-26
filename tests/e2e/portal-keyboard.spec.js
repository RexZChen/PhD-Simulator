import { test, expect } from '@playwright/test';

async function resume(page) {
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
  await page.locator('[data-action="wiz-next"]').click();
}

for (const lang of ['en', 'zh']) test(`portal budget and Finance agree at 320px (${lang})`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/');
  const quote = await page.evaluate(async lang => {
    const { createRun } = await import('/src/engine/state.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { monthlyBudget } = await import('/src/engine/life.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = createRun(842, { background: 'masters', topic: 'ml', international: true });
    const a = s.advisors[0];
    s.phase = 'admissions'; s.offers = [a.schoolId];
    s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: a.id });
    s.month = 21; s.stage = 'plan'; s.event = null; s.eventQueue = []; s.scheduled = [];
    s.ledger = null; s.ta = true; s.flags.hardship = true; s.flags.summerTA = false; s.flags.summerCovered = false;
    const meta = emptyMeta(); meta.settings.tips = false; meta.settings.lang = lang; meta.settings.textSize = 2;
    saveRun(localStorage, s, meta);
    return monthlyBudget(s);
  }, lang);
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  const label = lang === 'en' ? { estimate: 'Estimated monthly budget', settled: 'This month’s settled budget', support: 'Hardship support', gross: 'Stipend (gross)' }
    : { estimate: '本月收支估算', settled: '本月已结算收支', support: '困难补助', gross: '助学金（税前）' };
  await resume(page);
  await page.locator('.desk-icon[data-app="portal"]').click();
  await expect(page.locator('.client')).toContainText(label.estimate);
  await expect(page.locator('.client tr').filter({ hasText: label.support })).toContainText(money(quote.support));
  await expect(page.locator('.client')).toContainText(money(quote.stipend));
  const ledger = await page.evaluate(async () => {
    const { monthlyLedger } = await import('/src/engine/life.js');
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const saved = loadSave(localStorage); const ledger = monthlyLedger(saved.run);
    saveRun(localStorage, saved.run, saved.meta);
    return ledger;
  });
  await resume(page);
  await page.locator('.desk-icon[data-app="portal"]').click();
  await expect(page.locator('.client')).toContainText(label.settled);
  await expect(page.locator('.client tr').filter({ hasText: label.support })).toContainText(money(ledger.support));
  await page.locator('[data-action="open"][data-app="life"][data-page="money"]').click();
  await expect(page.locator('[data-action="life-tab"][data-id="money"]')).toHaveClass(/active/);
  await expect(page.locator('.money-table tr').filter({ hasText: label.support })).toContainText(money(ledger.support));
  await expect(page.locator('.money-table')).toContainText(money(ledger.stipend));
  const net = ledger.net + ledger.refund + ledger.support - ['rent', 'food', 'premium', 'fees', 'visa', 'remit', 'interest', 'other', 'repaid'].reduce((sum, k) => sum + ledger[k], 0);
  await expect(page.locator('.money-table .total')).toContainText(money(Math.abs(net)));
  const widths = await page.locator('.client').evaluate(node => ({ client: node.clientWidth, scroll: node.scrollWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
});

test('modified and composing digit shortcuts never select game choices', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const { createRun } = await import('/src/engine/state.js');
    const { prepareRun } = await import('/src/engine/game.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    const meta = emptyMeta(); meta.settings.tips = false;
    saveRun(localStorage, prepareRun(createRun(4242)), meta);
  });
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  const result = await page.evaluate(() => {
    // Supply a real action through the actual global shortcut handler, without invoking
    // the browser's tab-switch shortcut and losing the page under test.
    const button = document.createElement('button');
    button.dataset.action = 'prep'; button.dataset.id = 'sop_draft'; button.dataset.hotkey = '1';
    document.querySelector('#app').append(button);
    const before = localStorage.getItem('phdsim.academic-os.v2');
    const cancelled = [];
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { keyCode: 229 }]) {
      const event = new KeyboardEvent('keydown', { key: '1', bubbles: true, cancelable: true, ...options });
      document.body.dispatchEvent(event);
      cancelled.push(event.defaultPrevented);
    }
    const unchanged = before === localStorage.getItem('phdsim.academic-os.v2');
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true, cancelable: true }));
    const run = JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run;
    return { cancelled, unchanged, drafted: run.prep.sopSteps.includes('draft') };
  });
  expect(result.cancelled).toEqual([false, false, false, false, false]);
  expect(result.unchanged).toBe(true);
  expect(result.drafted).toBe(true);
});
