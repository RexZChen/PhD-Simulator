import { test, expect } from '@playwright/test';
import { resumeRecovery } from './recovery-helpers.js';

for (const lang of ['en', 'zh']) test(`${lang}: rebuttal addresses four actual reviews and cannot follow a paper switch`, async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async lang => {
    const { createRun } = await import('/src/engine/state.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { createProject } = await import('/src/engine/paper.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = createRun(731, { background: 'masters', topic: 'ml', international: false });
    const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
    s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: a.id }); const p = createProject(s);
    Object.assign(p, { title: 'First manuscript', status: 'Rebuttal', venueId: 'icmlater',
      timeline: { submitted: 4, phaseOne: null, rebuttal: 6, decision: 8, conference: 10 },
      submissionHistory: [{ venueId: 'icmlater', venue: 'ICMLater', month: 4, outcome: 'Under review', reviewers: [], quality: 60 }],
      reviewers: [
        { score: 6, confidence: 4, text: 'The empirical results are interesting; the baselines need work.' },
        { score: 5, confidence: 4, text: 'The theoretical novelty is not yet clear.' },
        { score: 3, confidence: 4, text: 'The code link is a 404, which is itself a result.' },
        { score: 6, confidence: 4, text: 'A promising contribution, with room for clearer framing.' },
      ] });
    s.projects.push({ ...structuredClone(p), id: 'project-2', title: 'Second manuscript' });
    Object.assign(s, { month: 6, week: 0, stage: 'plan', event: null, eventQueue: [], needsBegin: false,
      tempo: 'week', focus: null, activeProjectId: p.id,
      crunch: { type: 'rebuttal', projectId: p.id, venueId: 'icmlater', venueName: 'ICMLater', kind: null } });
    s.player.stats.energy = 90;
    const meta = emptyMeta(); Object.assign(meta.settings, { lang, tips: false, sound: false, quiet: true });
    localStorage.clear(); saveRun(localStorage, s, meta);
  }, lang);
  await resumeRecovery(page);
  await page.locator('.desk-icon[data-app="browser"]').click();
  await page.locator('.tabs [data-action="browser-tab"][data-id="openregret"]').click();
  await expect(page.locator('.reviews .review')).toHaveCount(4);
  await page.locator('[data-action="rebut-option"][data-id="careful"]').click();
  await expect(page.locator('[data-action="rebut-send"]')).toBeEnabled({ timeout: 5000 });
  const text = await page.locator('[data-compose-text]').innerText();
  expect(text).toMatch(lang === 'en' ? /code, configuration/ : /代码、配置/);
  expect(text).not.toContain('404'); // The review remains visible above; the reply need not repeat it.
  expect(text).toMatch(lang === 'en' ? /Reviewer 4/ : /评审.*4|审稿.*4/);
  expect(text).not.toMatch(/added the missing baseline|rerun every experiment|Table 6/);
  if (lang === 'zh') expect(text).not.toMatch(/Reviewer|We will|Response:/);
  await page.locator('[data-action="select-project"][data-id="project-2"]').click();
  await expect(page.locator('[data-action="rebut-send"]')).toBeDisabled();
  await expect(page.locator('[data-compose-text]')).toHaveCount(0);
  await page.locator('[data-action="rebut-option"][data-id="weakest"]').click();
  await expect(page.locator('[data-action="rebut-send"]')).toBeEnabled({ timeout: 5000 });
  expect(await page.locator('[data-compose-text]').innerText()).toContain('Second manuscript');
  await page.locator('[data-action="rebut-send"]').click();
  const papers = await page.evaluate(() => JSON.parse(localStorage.getItem('phdsim.academic-os.v2')).run.projects);
  expect(papers[0].status).toBe('Rebuttal'); expect(papers[1].status).toBe('Submitted');
  expect(papers[1].rebuttalDone).toBe(true);
});
