import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const KEY = 'phdsim.academic-os.v2';
const copy = {
  en: {
    notice: 'this build cannot resume that archived run',
    count: 'Preserved originals: 1',
    explanation: 'This build cannot resume these saves.',
    backupCount: 'Preserved originals in this backup: 1',
    warning: 'It also replaces the 1 preserved originals on this device.',
    download: 'Download backup',
  },
  zh: {
    notice: '此版本无法继续这份存档',
    count: '保留的原始存档：1份',
    explanation: '此版本无法继续这些存档。',
    backupCount: '此备份包含的原始存档：1份',
    warning: '此操作也会替换设备上保留的1份原始存档。',
    download: '下载备份',
  },
};

for (const lang of ['en', 'zh']) test(`${lang}: unsupported original survives settings and new-run setup, and backup cancellation is nondestructive`, async ({ page }) => {
  await page.goto('/');
  const original = await page.evaluate(async ({ key, lang }) => {
    const { createRun, VERSION } = await import('/src/engine/state.js');
    const { emptyMeta } = await import('/src/engine/save.js');
    const run = createRun(969, { name: 'Preserve this original' });
    run.version = VERSION + 1;
    const meta = emptyMeta();
    meta.settings.lang = lang; meta.settings.tips = false;
    const raw = JSON.stringify({ version: VERSION, run, meta, slots: {} }, null, 2);
    localStorage.setItem(key, raw);
    return raw;
  }, { key: KEY, lang });
  const disk = () => page.evaluate(key => localStorage.getItem(key), KEY);
  await page.reload();
  await page.locator('.boot').click();
  await expect(page.locator('.wizard-page')).toContainText(copy[lang].notice);
  await expect(page.locator('[data-action="wiz-choice"][data-id="continue"]')).toBeDisabled();
  expect(await disk()).toBe(original);

  // This is a real settings action, not a direct engine save. It must archive atomically.
  await page.locator(`.wizard-page [data-action="language"][data-id="${lang}"]`).click();
  expect(JSON.parse(await disk()).recovery).toEqual([original]);
  await page.locator('[data-action="wiz-choice"][data-id="random"]').click();
  await page.locator('[data-action="wiz-next"]').click();
  await page.locator('#eula').check();
  await page.locator('[data-action="wiz-next"]').click();
  await expect(page.locator('.ga-tabs')).toBeVisible();
  const afterNewRun = JSON.parse(await disk());
  expect(afterNewRun.run.version).toBeLessThan(JSON.parse(original).run.version);
  expect(afterNewRun.recovery).toEqual([original]);

  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="saves"]').click();
  await expect(page.locator('.backup-controls')).toContainText(copy[lang].count);
  await expect(page.locator('.backup-controls')).toContainText(copy[lang].explanation);
  const downloadPending = page.waitForEvent('download');
  await page.getByRole('button', { name: copy[lang].download, exact: true }).click();
  const download = await downloadPending;
  const text = await readFile(await download.path(), 'utf8');
  expect(JSON.parse(text).data.recovery).toEqual([original]);
  expect(JSON.parse(text).data.run.seed).toBe(afterNewRun.run.seed);

  const beforePreview = await disk();
  await page.locator('#backup-file').setInputFiles({ name: 'preserved-save.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.locator('.backup-preview')).toContainText(copy[lang].backupCount);
  await expect(page.locator('.backup-preview')).toContainText(copy[lang].warning);
  await expect(page.locator('[data-action="backup-restore"]')).toBeVisible();
  expect(await disk()).toBe(beforePreview);
  await page.locator('[data-action="backup-cancel"]').click();
  await expect(page.locator('.backup-preview')).toHaveCount(0);
  expect(await disk()).toBe(beforePreview);
  await expect(page.locator('.backup-controls')).toContainText(copy[lang].count);

  await page.reload();
  await page.locator('.boot').click();
  await expect(page.locator('[data-action="wiz-choice"][data-id="continue"]')).toBeEnabled();
  await expect(page.locator('.wizard-page')).toContainText(copy[lang].notice);
  expect(JSON.parse(await disk()).recovery).toEqual([original]);
});

test('oversized escaped recovery data downloads exact raw bytes after a failed settings save', async ({ page }) => {
  await page.goto('/');
  const original = JSON.stringify({ version: 999, payload: '"'.repeat(1400000) });
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: KEY, raw: original });
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('.wizard-page [data-action="language"][data-id="en"]').click();
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(original);
  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="saves"]').click();
  await expect(page.locator('.backup-controls')).toContainText('Original files are recovery data, not restorable backups for this build.');
  await page.locator('[data-action="backup-export"]').click();
  await expect(page.getByText('This backup is too large. Choose a file smaller than 5 MB.', { exact: true })).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original 1', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('academic-os-original-1.json');
  expect(await readFile(await download.path(), 'utf8')).toBe(original);
  await expect(page.getByText('Original download started. This build cannot resume this recovery data.', { exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(original);
});
