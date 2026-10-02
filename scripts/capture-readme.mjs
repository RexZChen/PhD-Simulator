// Prepared game checkpoints rendered through the real UI; no screenshot compositing.
// Run a local Vite server first, then: node scripts/capture-readme.mjs
// Also accepts a built preview URL, e.g. http://127.0.0.1:4174/PhD-Simulator/.
// Start that preview with: npm run preview -- --port 4174 --base /PhD-Simulator/
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { candidate, conditional } from '../tests/timeline-fixtures.js';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject } from '../src/engine/paper.js';
import { decisions } from '../src/engine/apply.js';
import { schools } from '../src/data/catalog.js';
import { saveRun, emptyMeta } from '../src/engine/save.js';

const baseURL = process.argv[2] || 'http://127.0.0.1:4173/';
const output = new URL('../docs/screens/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.setDefaultTimeout(10_000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

async function open(s) {
  const storage = new Map();
  const meta = emptyMeta();
  Object.assign(meta.settings, { lang: 'en', tips: false, sound: false, quiet: true, selfPaced: true });
  const result = saveRun({ getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, s, meta);
  if (result.error) throw new Error(result.error);
  await page.goto(baseURL);
  await page.evaluate(entries => { localStorage.clear(); for (const [key, value] of entries) localStorage.setItem(key, value); }, [...storage]);
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
  await page.locator('[data-action="wiz-next"]').click();
  await page.evaluate(() => document.fonts.ready);
}

async function shot(name, locator = page) {
  await locator.screenshot({ path: new URL(`${name}.png`, output).pathname, animations: 'disabled' });
  console.log(`Captured ${name}.png`);
}

try {
  let s = candidate(4242);
  s.player.name = 'Morgan Chen';
  s.milestones.proposal = null;
  const first = s.projects[0];
  Object.assign(first, { status: 'Accepted', progress: 100, draft: 100, venueId: 'neuripsy', startedMonth: 2, submissionHistory: [{ month: 8, venueId: 'neuripsy' }] });
  const second = createProject(s, { topic: 'nlp' });
  Object.assign(second, { status: 'Accepted', progress: 100, draft: 100, venueId: 'aclmao', startedMonth: 13, submissionHistory: [{ month: 16, venueId: 'aclmao' }] });
  const current = createProject(s);
  Object.assign(current, { status: 'Drafting', progress: 65, draft: 50, preprint: true });
  s.citations = { [first.id]: 23, [second.id]: 7, [current.id]: 1 };
  s = dispatch(s, { type: 'ASK', id: 'update' });
  await open(s);
  await shot('desktop');
  await page.locator('.desk-icon[data-app="chat"]').click();
  await page.getByRole('button', { name: /Choose a message/ }).click();
  await page.locator('summary').filter({ hasText: 'Check-ins & meetings' }).click();
  await shot('labchat');
  await page.keyboard.press('Escape');
  await page.locator('.desk-icon[data-app="browser"]').click();
  await page.locator('[data-action="browser-tab"][data-id="chatphd"]').click();
  await page.locator('[data-action="chatphd-prompt"][data-id="advisor"]').click();
  await expect(page.locator('.chatphd-log .msg')).toHaveCount(2);
  await shot('chatphd');
  await page.locator('.desk-icon[data-app="scholar"]').click();
  await shot('scholar');

  const applicant = createRun(77, { name: 'Morgan Chen', background: 'masters', topic: 'ml', international: false });
  applicant.phase = 'application';
  applicant.prep = { sop: 70, gre: 162, waivers: false, proceeded: true, letters: [{ id: 'rec-0', asked: true, strength: 68 }] };
  applicant.applications = schools.slice(9, 15).map(sc => ({ schoolId: sc.id, effort: 'generic', contact: false,
    poiId: applicant.advisors.find(a => a.schoolId === sc.id).id, status: 'submitted', chance: .35 }));
  decisions(applicant);
  await open(applicant);
  await page.locator('[data-action="open"][data-app="gradapply"]').first().click();
  const offer = applicant.applications.find(a => a.status === 'admitted');
  if (!offer) throw new Error('Screenshot checkpoint has no offer');
  await page.locator(`[data-action="decision-open"][data-id="${offer.schoolId}"]`).click();
  await expect(page.locator('.pt-letter')).not.toBeEmpty();
  await shot('portal', page.locator('.dialog.portal'));

  const exam = candidate(9001);
  exam.month = 22; exam.coursework = 70; exam.readiness = 60;
  exam.milestones.prelim = null; exam.milestones.proposal = null;
  exam.stage = 'milestone'; exam.milestoneKind = 'prelim';
  await open(exam);
  await page.locator('[data-action="milestone"][data-id="balanced"]').click();
  await expect(page.locator('[data-vv]')).toHaveAttribute('data-phase', 'talk');
  await shot('room214', page.locator('[data-vv]'));

  await open(conditional('handover'));
  await page.locator('.gradtalk').scrollIntoViewIfNeeded();
  await shot('graduation', page.locator('.gradtalk'));
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser.close();
}
