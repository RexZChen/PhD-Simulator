import { chromium } from '@playwright/test';
const OUT = '/Users/rexzchen/.claude/jobs/3184f0e6/tmp/shots';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1180, height: 800 } });
page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
await page.goto('http://127.0.0.1:4173/');
await page.evaluate(async () => {
  localStorage.clear();
  const st = await import('/src/engine/state.js');
  const { dispatch } = await import('/src/engine/game.js');
  const { schools } = await import('/src/data/catalog.js');
  const paper = await import('/src/engine/paper.js');
  const { saveRun, emptyMeta } = await import('/src/engine/save.js');
  let s = st.createRun(9007, { background: 'masters', topic: 'ml', international: false });
  const poi = s.advisors.find(a => a.schoolId === schools[3].id);
  s.phase = 'admissions'; s.offers = [schools[3].id];
  s.applications = [{ schoolId: schools[3].id, effort: 'tailored', poiId: poi.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: poi.id });
  paper.createProject(s);
  s.month = 26; s.player.hidden.stress = 72;
  saveRun(localStorage, s, emptyMeta());
});
await page.reload();
await page.locator('.boot').click({ timeout: 5000 }).catch(() => {});
await page.getByRole('button', { name: /Continue the saved run/ }).click({ timeout: 8000 });
for (let i = 0; i < 5; i++) {
  const e = page.locator('#eula'); if (await e.count()) await e.check().catch(() => {});
  const n = page.locator('[data-action="wiz-next"]:not([disabled])');
  if (!(await n.count())) break;
  await n.click().catch(() => {}); await page.waitForTimeout(400);
  if (!(await page.locator('.wizard-body').count())) break;
}
await page.waitForTimeout(700);
for (let i = 0; i < 8; i++) {
  const d = page.locator('.modal .dialog').last();
  if (!(await d.count())) break;
  const b = d.locator('[data-action="close-dialog"], button:has-text("Close"), [data-action="choice"]').first();
  if (!(await b.count())) break;
  await b.click().catch(() => {}); await page.waitForTimeout(350);
}
const row = page.locator('.desk-fixtures');
console.log('fixtures visible:', await row.count(), await row.isVisible().catch(() => false));
console.log('count:', await page.locator('.desk-fixture').count());
await row.screenshot({ path: `${OUT}/30-fixtures.png` }).catch(e => console.log('shot fail', e.message));
// click each and read the status line
for (const id of ['chair', 'fridge', 'plant']) {
  await page.locator(`[data-action="fixture"][data-id="${id}"]`).click();
  await page.waitForTimeout(400);
  const line = await page.locator('.statusbar, .status').first().innerText().catch(() => '?');
  console.log(id.padEnd(7), '→', line.slice(0, 95));
}
await page.screenshot({ path: `${OUT}/31-desk.png` });
await browser.close();
