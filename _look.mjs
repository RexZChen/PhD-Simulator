import { chromium } from '@playwright/test';
const OUT = '/Users/rexzchen/.claude/jobs/3184f0e6/tmp/look';
import { execSync } from 'child_process';
execSync(`mkdir -p ${OUT}`);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
await page.goto('http://127.0.0.1:4173/');
await page.locator('.boot').click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(500);

// New applicant → questionnaire → application phase
await page.getByRole('button', { name: /New applicant/ }).click({ timeout: 8000 });
for (let i = 0; i < 6; i++) {
  const e = page.locator('#eula'); if (await e.count()) await e.check().catch(() => {});
  const n = page.locator('[data-action="wiz-next"]:not([disabled]), [data-action="wiz-start"]:not([disabled])');
  if (!(await n.count())) break;
  await n.first().click().catch(() => {});
  await page.waitForTimeout(500);
  if (!(await page.locator('.wizard-body').count())) break;
}
await page.waitForTimeout(900);
for (let i = 0; i < 6; i++) {
  const d = page.locator('.modal .dialog').last();
  if (!(await d.count())) break;
  const b = d.locator('[data-action="close-dialog"], button:has-text("Close"), [data-action="choice"]').first();
  if (!(await b.count())) break;
  await b.click().catch(() => {}); await page.waitForTimeout(300);
}
await page.screenshot({ path: `${OUT}/01-prep.png` });

// Create the applicant, then walk into the application phase.
const create = page.getByRole('button', { name: /Create applicant/ });
if (await create.count()) { await create.click(); await page.waitForTimeout(1200); }
for (let i = 0; i < 6; i++) {
  const d = page.locator('.modal .dialog').last();
  if (!(await d.count())) break;
  const b = d.locator('[data-action="close-dialog"], button:has-text("Close"), [data-action="choice"]').first();
  if (!(await b.count())) break;
  await b.click().catch(() => {}); await page.waitForTimeout(300);
}
await page.screenshot({ path: `${OUT}/02-prep-phase.png` });
console.log('phase now:', await page.evaluate(async () => {
  const { loadSave } = await import('/src/engine/save.js');
  return loadSave(localStorage)?.run?.phase;
}));
// push to the application phase
for (let i = 0; i < 12; i++) {
  const proceed = page.locator('[data-action="prep"][data-id="proceed"]');
  if (await proceed.count() && await proceed.first().isEnabled().catch(() => false)) { await proceed.first().click().catch(() => {}); await page.waitForTimeout(900); break; }
  const any = page.locator('[data-action="prep"]:not([disabled])').first();
  if (!(await any.count())) break;
  await any.click().catch(() => {}); await page.waitForTimeout(400);
  for (let k = 0; k < 4; k++) {
    const d = page.locator('.modal .dialog').last();
    if (!(await d.count())) break;
    const b = d.locator('[data-action="close-dialog"], button:has-text("Close"), [data-action="choice"]').first();
    if (!(await b.count())) break;
    await b.click().catch(() => {}); await page.waitForTimeout(250);
  }
}
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/03-application.png`, fullPage: false });
console.log('phase now:', await page.evaluate(async () => {
  const { loadSave } = await import('/src/engine/save.js');
  return loadSave(localStorage)?.run?.phase;
}));
const m = await page.evaluate(() => {
  const root = document.querySelector('.client') || document.body;
  const txt = (root.innerText || '').trim();
  const sizes = {};
  let smallest = 99, smallCount = 0;
  for (const el of root.querySelectorAll('*')) {
    if (!el.textContent?.trim() || el.children.length) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    sizes[Math.round(fs)] = (sizes[Math.round(fs)] || 0) + 1;
    smallest = Math.min(smallest, fs);
    if (fs < 12) smallCount++;
  }
  const rows = document.querySelectorAll('.school-row, .apply-row, tr, .listview > *').length;
  return { words: txt.split(/\s+/).length, sizes, smallest, under12: smallCount, rows,
    clientH: root.scrollHeight, viewH: root.clientHeight };
});
console.log('APPLICATION PAGE:', JSON.stringify(m, null, 1));
await browser.close();
