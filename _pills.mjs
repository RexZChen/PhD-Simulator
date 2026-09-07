import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
  s = dispatch(s, { type: 'ENROLL', id: poi.id }); paper.createProject(s); s.month = 26;
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
await page.waitForTimeout(600);
for (let i = 0; i < 8; i++) {
  const d = page.locator('.modal .dialog').last();
  if (!(await d.count())) break;
  const b = d.locator('[data-action="close-dialog"], button:has-text("Close"), [data-action="choice"]').first();
  if (!(await b.count())) break;
  await b.click().catch(() => {}); await page.waitForTimeout(300);
}
// Any element whose content is wider than its box = clipped
const overflow = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('.plan-list *, .group *, .advisor-card *, .stuck-door *')) {
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
      out.push({ cls: el.className, tag: el.tagName, scroll: el.scrollWidth, client: el.clientWidth, text: (el.textContent || '').trim().slice(0, 48) });
    }
  }
  return out.slice(0, 14);
});
console.log('clipped elements:', JSON.stringify(overflow, null, 1));
const pillRow = page.locator('.plan-list .pills, .plan-list .effects').first();
if (await pillRow.count()) console.log('pill row box:', JSON.stringify(await pillRow.boundingBox()));
await browser.close();
