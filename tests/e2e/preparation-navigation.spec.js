import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const evidence = '/tmp/phdsim-preparation-navigation';
const section = (page, id) => page.locator(`.prep-nav [data-action="prep-section"][data-id="${id}"]`);
const school = (page, id) => page.locator(`.prep-school[data-id="${id}"]`);
const copy = {
  en: { advisors: 'Find a prospective advisor', field: 'Faculty field', search: 'Find a school', back: 'Back to programs', reset: 'Show all programs', empty: 'No programs match these filters. Try a shorter name or another field.', logistics: 'Tests & fees' },
  zh: { advisors: '寻找潜在导师', field: '教授的研究领域', search: '查找学校', back: '返回项目列表', reset: '显示全部项目', empty: '没有符合筛选条件的项目。试试缩短校名，或换一个领域。', logistics: '考试与费用' },
};

async function seedPreparation(page, language, { readyForGre = false, changedFaculty = false } = {}) {
  page.setDefaultTimeout(5000);
  await page.goto('/');
  const initial = await page.evaluate(async ({ language, readyForGre, changedFaculty }) => {
    const { createRun } = await import('/src/engine/state.js');
    const { prepareRun } = await import('/src/engine/game.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    const s = prepareRun(createRun(4242, { background: 'undergrad', topic: 'hci', international: false }));
    if (readyForGre) {
      s.prep.sopSteps = ['draft', 'specific'];
      for (const letter of s.prep.letters.slice(0, 3)) letter.asked = true;
      s.prep.researched = { mitt: { notes: [] }, stanfurd: { notes: [] }, caltek: { notes: [] } };
    }
    if (changedFaculty) {
      // Deliberately differ from the school's catalog specialties: this filter promises
      // faculty expertise, so it must use the people in this run, not the school label.
      s.advisors.find(a => a.schoolId === 'mitt').topic = 'hci';
      s.advisors.filter(a => a.schoolId === 'udub').forEach(a => { a.topic = 'theory'; });
    }
    const meta = emptyMeta();
    Object.assign(meta.settings, { lang: language, tips: false, sound: false, quiet: true });
    saveRun(localStorage, s, meta);
    return { energy: s.player.stats.energy, rng: s.rng,
      hciSchools: [...new Set(s.advisors.filter(a => a.topic === 'hci').map(a => a.schoolId))].sort() };
  }, { language, readyForGre, changedFaculty });
  await page.reload();
  await page.locator('.boot').click();
  await page.locator('[data-action="wiz-choice"][data-id="continue"]').click();
  await page.locator('[data-action="wiz-next"]').click();
  await expect(page.locator('.prep-desk')).toBeVisible();
  return initial;
}

async function shownSchools(page) {
  return page.locator('.prep-school').evaluateAll(nodes => nodes.map(node => node.dataset.id).sort());
}

async function expectNoOverflow(page) {
  const bounds = await page.locator('.client').evaluate(el => ({ client: el.clientWidth, scroll: el.scrollWidth,
    body: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(bounds.scroll, 'the application pane must not scroll sideways').toBeLessThanOrEqual(bounds.client + 1);
  expect(bounds.body, 'the desktop must fit the viewport').toBeLessThanOrEqual(bounds.viewport + 1);
}

for (const language of ['en', 'zh']) {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test(`${language} ${viewport.width}px: preparation tasks and faculty browsing preserve the run`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const initial = await seedPreparation(page, language);
      const words = copy[language];
      await mkdir(evidence, { recursive: true });
      await expect(page.locator('.prep-panel:visible')).toHaveCount(1);
      await expect(page.locator('#prep-statement')).toBeVisible();
      await page.screenshot({ path: `${evidence}/${language}-${viewport.width}-statement.png` });
      await expectNoOverflow(page);

      for (const id of ['letters', 'logistics', 'advisors']) {
        await section(page, id).focus();
        await page.keyboard.press('Enter');
        await expect(page.locator(`#prep-${id}`)).toBeFocused();
        await expect(page.locator('.prep-panel:visible')).toHaveCount(1);
        await expect(section(page, id)).toHaveAttribute('aria-pressed', 'true');
        await expectNoOverflow(page);
      }
      await expect(page.getByRole('heading', { name: words.advisors, exact: true })).toBeVisible();
      const field = page.getByRole('combobox', { name: words.field, exact: true });
      const query = page.getByRole('searchbox', { name: words.search, exact: true });
      await expect(field).toHaveValue('hci');
      expect(await shownSchools(page)).toEqual(initial.hciSchools);
      await page.screenshot({ path: `${evidence}/${language}-${viewport.width}-advisors.png` });

      // Search submits with Enter; it is browsing, with no preparation cost.
      await query.fill('not-a-real-school');
      await query.press('Enter');
      await expect(query).toBeFocused();
      await expect(page.getByText(words.empty, { exact: true })).toBeVisible();
      await expect(page.locator('.prep-school')).toHaveCount(0);
      await page.getByRole('button', { name: words.reset, exact: true }).click();
      await expect(field).toHaveValue('');
      await expect(query).toHaveValue('');
      await expect(page.locator('.prep-school')).toHaveCount(32);

      // The budget remains readable even at the bottom of the full school list.
      await page.locator('.client').evaluate(el => { el.scrollTop = el.scrollHeight; });
      await expect(page.locator('.prep-budget')).toBeInViewport({ ratio: 1 });
      const budget = await page.locator('.prep-budget').boundingBox();
      const pane = await page.locator('.client').boundingBox();
      expect(budget.y).toBeGreaterThanOrEqual(pane.y - 1);
      expect(budget.y).toBeLessThan(pane.y + 12);
      await page.screenshot({ path: `${evidence}/${language}-${viewport.width}-budget-bottom.png` });

      await field.selectOption('hci');
      await query.fill('WASH');
      await query.press('Enter');
      await expect(page.locator('.prep-school')).toHaveCount(1);
      await school(page, 'udub').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('.faculty-panel')).toBeFocused();
      await expect(page.locator('.advisor-card')).toHaveCount(2);
      await expectNoOverflow(page);
      await page.screenshot({ path: `${evidence}/${language}-${viewport.width}-faculty.png` });
      const back = page.getByRole('button', { name: words.back, exact: true });
      const backBounds = await back.boundingBox();
      const facultyBudget = await page.locator('.prep-budget').boundingBox();
      expect(backBounds.y, 'the sticky budget must not cover the way back to programs').toBeGreaterThanOrEqual(facultyBudget.y + facultyBudget.height);
      await page.keyboard.press('Shift+Tab');
      await expect(back).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(field).toHaveValue('hci');
      await expect(query).toHaveValue('WASH');
      await expect(school(page, 'udub')).toBeFocused();
      await expect(page.locator('.prep-school')).toHaveCount(1);
      await expect(page.locator('.prep-budget .em-val')).toHaveText(String(initial.energy));

      // A real deterministic action saves the in-memory run, exposing even a renderer
      // mutation that would have been missed by inspecting only the previous autosave.
      await section(page, 'statement').click();
      await page.locator('#prep-statement [data-id="sop_draft"]').click();
      const after = await page.evaluate(async () => {
        const s = (await import('/src/engine/save.js')).loadSave(localStorage).run;
        return { energy: s.player.stats.energy, rng: s.rng };
      });
      expect(after).toEqual({ energy: initial.energy - 6, rng: initial.rng });
    });
  }

  test(`${language}: faculty filtering retains keyboard focus and tab order`, async ({ page }) => {
    await seedPreparation(page, language);
    await section(page, 'advisors').click();
    await page.keyboard.press('Tab');
    const field = page.getByRole('combobox', { name: copy[language].field, exact: true });
    const query = page.getByRole('searchbox', { name: copy[language].search, exact: true });
    await expect(field).toBeFocused();
    await field.selectOption('systems');
    await expect(field).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(query).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#prep-school-search button[type="submit"]')).toBeFocused();
  });

  test(`${language}: the GRE guide opens Tests & fees without spending Energy`, async ({ page }) => {
    const initial = await seedPreparation(page, language, { readyForGre: true });
    const guide = page.locator('[data-guide][data-action="prep-section"][data-id="logistics"]');
    await expect(guide).toHaveText(copy[language].logistics);
    await guide.click();
    await expect(page.locator('#prep-logistics')).toBeFocused();
    await expect(page.locator('.prep-panel:visible')).toHaveCount(1);
    await expect(page.locator('#prep-logistics [data-id="gre"][data-target="skip"]')).toBeVisible();
    await expect(page.locator('.prep-budget .em-val')).toHaveText(String(initial.energy));
  });
}

test('faculty filters use this run’s professors rather than catalog school specialties', async ({ page }) => {
  const initial = await seedPreparation(page, 'en', { changedFaculty: true });
  await section(page, 'advisors').click();
  expect(await shownSchools(page)).toEqual(initial.hciSchools);
  await expect(school(page, 'mitt')).toBeVisible();
  await expect(school(page, 'mitt')).toContainText('Human–computer interaction');
  await expect(school(page, 'udub')).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Faculty field', exact: true }).selectOption('theory');
  await expect(school(page, 'udub')).toBeVisible();
  await expect(school(page, 'udub')).toContainText('Theory');
  await expect(school(page, 'udub')).not.toContainText('Human–computer interaction');
});
