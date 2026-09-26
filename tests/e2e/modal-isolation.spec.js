import { test, expect } from '@playwright/test';

async function accessibilityTree(page) {
  // Playwright's DOM-derived snapshots do not account for native inert.
  // Inspect Chrome's accessibility tree, which assistive tools consume.
  const session = await page.context().newCDPSession(page);
  try {
    const { nodes } = await session.send('Accessibility.getFullAXTree');
    return nodes.filter(node => !node.ignored).map(node => `${node.role?.value}: ${node.name?.value || ''}`).join('\n');
  } finally { await session.detach(); }
}

async function seed(page, scene = false) {
  await page.goto('/');
  await page.evaluate(async scene => {
    const { createRun } = await import('/src/engine/state.js');
    const { prepareRun, dispatch } = await import('/src/engine/game.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let run = prepareRun(createRun(4242, { background: 'masters', topic: 'ml', international: false }));
    const advisor = run.advisors[6];
    run.phase = 'admissions'; run.offers = [advisor.schoolId];
    run.applications = [{ schoolId: advisor.schoolId, effort: 'tailored', poiId: advisor.id, status: 'admitted', funding: 'RA' }];
    run = dispatch(run, { type: 'ENROLL', id: advisor.id });
    if (scene) { run.stage = 'event'; run.event = 'meet_progress'; run.eventVariant = 0; }
    const meta = emptyMeta();
    Object.assign(meta.settings, { tips: false, lang: 'en', untimedChoices: true });
    saveRun(localStorage, run, meta);
  }, scene);
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
}

test('nested scene dialogs expose only the front layer and return focus to each opener', async ({ page }) => {
  await seed(page, true);
  expect((await accessibilityTree(page)).match(/^dialog:/gm)).toHaveLength(1);
  await expect(page.locator('.desktop-icons')).toHaveAttribute('inert', '');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect((await accessibilityTree(page)).match(/^dialog:/gm)).toHaveLength(1);
  let tree = await accessibilityTree(page);
  expect(tree).toContain('dialog: Paused');
  expect(tree).not.toContain('dialog: Where are we?');
  expect(tree).not.toContain('navigation: Desktop');
  await page.getByRole('button', { name: 'Saved runs', exact: true }).click();
  expect((await accessibilityTree(page)).match(/^dialog:/gm)).toHaveLength(1);
  tree = await accessibilityTree(page);
  expect(tree).not.toContain('dialog: Paused');
  expect(tree).not.toContain('dialog: Where are we?');
  expect(tree).toContain('Saved runs');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Saved runs', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Resume conversation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeFocused();
  expect((await accessibilityTree(page)).match(/^dialog:/gm)).toHaveLength(1);
  expect(await accessibilityTree(page)).toContain('dialog: Where are we?');
});

test('closing the last dialog restores the page without removing pre-existing inert state', async ({ page }) => {
  await seed(page);
  await page.evaluate(() => {
    const retained = document.createElement('aside');
    retained.id = 'retained-inert'; retained.inert = true;
    retained.textContent = 'Hidden fixture'; document.body.append(retained);
    const background = document.createElement('aside');
    background.id = 'background-fixture'; background.textContent = 'Background fixture';
    document.body.append(background);
  });
  const opener = page.getByRole('button', { name: 'Reading & comfort', exact: true });
  await opener.click();
  await expect(page.locator('#background-fixture')).toHaveAttribute('inert', '');
  expect(await accessibilityTree(page)).not.toContain('Background fixture');
  const close = page.getByRole('button', { name: 'Close', exact: true });
  await close.focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-comfort="quiet"]')).toBeFocused();
  await close.click();
  await expect(opener).toBeFocused();
  await expect(page.locator('.desktop-icons')).not.toHaveAttribute('inert');
  await expect(page.locator('#background-fixture')).not.toHaveAttribute('inert');
  await expect(page.locator('#retained-inert')).toHaveAttribute('inert', '');
  const tree = await accessibilityTree(page);
  expect(tree).toContain('navigation: Desktop');
  expect(tree).toContain('Background fixture');
  expect(tree).not.toContain('Hidden fixture');
});
