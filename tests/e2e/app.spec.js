import { test, expect } from '@playwright/test';

async function fresh(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.boot').click();
}
async function closeDialogs(page) {
  for (let i = 0; i < 5; i++) {
    const b = page.locator('.modal [data-action="close-dialog"], .modal [data-action="close-thread"]').first();
    if (await b.count() && await b.isVisible()) await b.click(); else break;
  }
}
async function resolveScenes(page, max = 12) {
  for (let i = 0; i < max; i++) {
    const dlg = page.locator('.modal .dialog');
    if (!(await dlg.count()) || !(await dlg.isVisible())) return;
    const title = await dlg.locator('.titlebar').first().innerText();
    if (/Monthly statement/.test(title)) { await dlg.locator('[data-action="dismiss-report"]').click(); return; }
    const choice = dlg.locator('[data-action="choice"]:not([disabled])').first();
    if (await choice.count()) await choice.click(); else return;
  }
}

// The desktop pane is a nested scroller; bring the panel into view before reaching for a button.
async function clickInPanel(page, selector, panel = '.summertalk') {
  const b = page.locator(selector);
  if (!(await b.count())) return false;
  await page.locator(panel).first().scrollIntoViewIfNeeded();
  await b.scrollIntoViewIfNeeded();
  await b.click();
  return true;
}

test('setup wizard requires the license, then the questionnaire creates an applicant', async ({ page }) => {
  await fresh(page);
  await expect(page.getByRole('heading', { name: /Setup Wizard/ })).toBeVisible();
  await page.getByRole('button', { name: /New applicant/ }).click();
  await page.getByRole('button', { name: /Next >/ }).click();
  await expect(page.getByText(/work of satire/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Next >/ })).toBeDisabled();
  await page.check('#eula');
  await page.getByRole('button', { name: /Next >/ }).click();
  await page.getByLabel('Your name').fill('Morgan Test');
  await page.selectOption('select[name="background"]', 'masters');
  await page.getByRole('button', { name: /Create applicant/ }).click();
  await closeDialogs(page);
  await expect(page.getByRole('heading', { name: /GradApply — Preparation/ })).toBeVisible();
});

test('application phase: prepare, email a professor, apply, interview, decide', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: /Randomize My Academic Fate/ }).click();
  await page.getByRole('button', { name: /Next >/ }).click();
  await page.check('#eula');
  await page.getByRole('button', { name: /Generate applicant/ }).click();
  await closeDialogs(page);
  await page.locator('[data-action="prep"][data-id="sop_draft"]').click();
  await page.locator('[data-action="prep"][data-id="letter_ask"]').first().click();
  await page.locator('[data-action="ga-school"]').first().click();
  const wrappedAdvisorRatings = await page.locator('.advisor-card .traits b').evaluateAll(nodes => nodes.filter(node => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getClientRects().length > 1;
  }).length);
  expect(wrappedAdvisorRatings).toBe(0);
  await page.locator('[data-action="ga-thread"]').first().click();
  await expect(page.locator('.modal .dialog')).toBeVisible();
  await page.locator('.modal [data-action="email"]').first().click();
  await expect(page.locator('.thread-log .msg')).toHaveCount(2);
  await closeDialogs(page);
  await page.locator('[data-action="prep"][data-id="proceed"]').click();
  await expect(page.getByRole('heading', { name: /GradApply — Programs/ })).toBeVisible();
  for (let i = 0; i < 5; i++) { await page.locator('[data-action="apply"]:not([disabled])').first().click(); await resolveScenes(page); }
  await page.locator('[data-action="admissions"]').click();
  await expect(page.getByRole('heading', { name: /GradApply — Status/ })).toBeVisible();
  while (await page.locator('[data-action="ga-thread"][data-id$=":interview"].primary').count()) {
    await page.locator('[data-action="ga-thread"][data-id$=":interview"].primary').first().click();
    for (let i = 0; i < 3; i++) await page.locator('.modal [data-action="interview"]').first().click();
    await closeDialogs(page);
  }
  await page.locator('[data-action="decisions"]').click();
  await expect(page.getByText(/Offers|Not This Cycle/).first()).toBeVisible();
});

test('a saved run in play shows the manager, resolves a month, and reports', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const { createRun } = await import('/src/engine/state.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { schools } = await import('/src/data/catalog.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = createRun(8128, { background: 'masters', topic: 'ml', international: true });
    s.phase = 'admissions'; s.offers = [schools[0].id]; s.applications = [{ schoolId: schools[0].id, effort: 'generic', poiId: s.advisors[0].id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: s.advisors[0].id });
    saveRun(localStorage, s, emptyMeta());
  });
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.getByRole('button', { name: /Next >/ }).click();
  await closeDialogs(page);
  await resolveScenes(page);
  await expect(page.getByRole('heading', { name: /September 2028/ })).toBeVisible();
  await page.locator('[data-action="plan"][data-id="research"]').click();
  await page.locator('[data-action="start-project"]').click();
  await page.locator('[data-action="continue"]').click();
  await resolveScenes(page);
  await expect(page.getByRole('heading', { name: /October 2028/ })).toBeVisible();
  await page.locator('.desk-icon[data-app="chat"]').click();
  await expect(page.getByText(/Message Prof\./)).toBeVisible();
  await page.locator('.desk-icon[data-app="browser"]').click();
  await expect(page.locator('.editor-source .src-title')).toBeVisible();
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.getByRole('button', { name: /Next >/ }).click();
  await closeDialogs(page);
  await expect(page.getByRole('heading', { name: /October 2028/ })).toBeVisible();
});

test('desktop remains usable at a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fresh(page);
  await expect(page.getByRole('heading', { name: /Setup Wizard/ })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('Simplified Chinese changes the setup interface and survives navigation', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: '简体中文' }).click();
  await expect(page.getByRole('heading', { name: /博士模拟器安装向导/ })).toBeVisible();
  await page.getByRole('button', { name: /新申请者/ }).click();
  await page.getByRole('button', { name: /下一步/ }).click();
  await expect(page.getByRole('heading', { name: '许可协议' })).toBeVisible();
  await expect(page.getByText(/所有人物均为虚构/)).toBeVisible();
});

// ── Streaming composers: mail, chat, rebuttal ──────────────────────────────────
async function seedRun(page, mutate = '') {
  await page.goto('/');
  await page.evaluate(async (src) => {
    localStorage.clear();
    const st = await import('/src/engine/state.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { schools } = await import('/src/data/catalog.js');
    const { createProject } = await import('/src/engine/paper.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = st.createRun(4242, { background: 'masters', topic: 'ml', international: false });
    const poi = s.advisors.find(a => a.schoolId === schools[3].id);
    s.phase = 'admissions'; s.offers = [schools[3].id];
    s.applications = [{ schoolId: schools[3].id, effort: 'tailored', poiId: poi.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: poi.id });
    const p = createProject(s);
    if (src) new Function('s', 'p', 'st', src)(s, p, st);
    saveRun(localStorage, s, emptyMeta());
  }, mutate);
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  await closeDialogs(page);
  await resolveScenes(page);
}

test('mail: choosing a reply streams a draft, and sending files it under Sent', async ({ page }) => {
  await seedRun(page, `st.message(s, s.advisor.name, 'A few small comments', '183 comments added.', 'browser', 'inbox', 'advisorComments');`);
  await page.locator('.desk-icon[data-app="mail"]').click();
  await page.locator('.mail-row', { hasText: 'small comments' }).first().click();
  await page.locator('[data-action="mail-reply"]').first().click();
  await expect(page.locator('[data-action="mail-send"]')).toBeDisabled();
  await page.locator('[data-action="mail-option"]').first().click();
  await expect(page.locator('[data-action="mail-send"]')).toBeEnabled({ timeout: 5000 });
  const drafted = await page.locator('.compose-pane [data-compose-text]').innerText();
  expect(drafted.length).toBeGreaterThan(60);
  await page.locator('[data-action="mail-send"]').click();
  await page.locator('[data-action="mail-folder"][data-id="sent"]').click();
  await expect(page.locator('.mail-row')).toHaveCount(1);
});

test('chat: the composer offers lines, types one, and posts it', async ({ page }) => {
  await seedRun(page);
  await page.locator('.desk-icon[data-app="chat"]').click();
  await page.locator('[data-action="chat-menu"]').first().click();
  await expect(page.locator('.say-menu')).toBeVisible();
  expect(await page.locator('.say-item').count()).toBeGreaterThan(5);
  const mineBefore = await page.locator('.sl-msg.mine').count();
  await page.locator('.say-item:not([disabled])').first().click();
  await expect(page.locator('[data-action="chat-send"]')).toBeEnabled({ timeout: 5000 });
  await page.locator('[data-action="chat-send"]').click();
  await expect(page.locator('.sl-msg.mine')).toHaveCount(mineBefore + 1);
});

test('paper: the pipeline names the next step, and the rebuttal is written not clicked', async ({ page }) => {
  await seedRun(page, `p.progress = 18; p.draft = 0; p.status = 'Idea';`);
  await page.locator('.desk-icon[data-app="browser"]').click();
  await expect(page.locator('.pipeline .pstage.now')).toHaveCount(1);
  await expect(page.locator('.next-step b')).toContainText('35%');

  await seedRun(page, `p.progress = 80; p.draft = 100; p.status = 'Rebuttal'; p.venueId = 'neuripsy';
    p.reviewers = [{ name: 'Reviewer 1', score: 8, text: 'Strong.', confidence: 4 }, { name: 'Reviewer 2', score: 4, text: 'Unconvinced.', confidence: 5 }, { name: 'Reviewer 3', score: 6, text: 'Table 4.', confidence: 3 }];
    p.timeline = { submitted: 6, phaseOne: null, rebuttal: 8, decision: 10, conference: 15 };
    p.submissionHistory = [{ venueId: 'neuripsy', venue: 'NeurIPSy', month: 6, outcome: 'Under review', reviewers: [], quality: 62 }];`);
  await page.locator('.desk-icon[data-app="browser"]').click();
  await page.locator('.tabs [data-action="browser-tab"][data-id="openregret"]').click();
  await expect(page.locator('[data-action="rebut-send"]')).toBeDisabled();
  await page.locator('[data-action="rebut-option"]').first().click();
  await expect(page.locator('[data-action="rebut-send"]')).toBeEnabled({ timeout: 5000 });
  const letter = await page.locator('.rebuttal-pane [data-compose-text]').innerText();
  expect(letter.length).toBeGreaterThan(150);
});

// ── Day pace, the life side, the scholar page, the trip, and graduation ───────
async function seedPlay(page, mutate = '', answers = { background: 'masters', topic: 'ml', international: false }, seed = 9001, keepScene = false) {
  await page.goto('/');
  await page.evaluate(async ({ src, answers, seed }) => {
    localStorage.clear();
    const st = await import('/src/engine/state.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { schools } = await import('/src/data/catalog.js');
    const paper = await import('/src/engine/paper.js');
    const time = await import('/src/engine/time.js');
    const trip = await import('/src/engine/trip.js');
    const epi = await import('/src/engine/epilogue.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = st.createRun(seed, answers);
    const poi = s.advisors.find(a => a.schoolId === schools[3].id);
    s.phase = 'admissions'; s.offers = [schools[3].id];
    s.applications = [{ schoolId: schools[3].id, effort: 'tailored', poiId: poi.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: poi.id });
    const p = paper.createProject(s);
    if (src) new Function('s', 'p', 'st', 'paper', 'time', 'trip', 'epi', src)(s, p, st, paper, time, trip, epi);
    saveRun(localStorage, s, emptyMeta());
  }, { src: mutate, answers, seed });
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  await closeDialogs(page);
  if (!keepScene) { await resolveScenes(page); await closeDialogs(page); }
}

test('a deadline week runs day by day, with coffee, a skipped lunch, and a door to knock on', async ({ page }) => {
  await seedPlay(page, `p.progress = 62; p.draft = 45; p.status = 'Drafting';
    p.targetVenueId = 'neuripsy'; p.targetMonth = s.month; p.targetVenue = 'NeurIPSy';
    s.week = 3; s.crunch = time.crunchSnapshot(s); s.tempo = time.tempoOf(s); s.focus = null;`);
  await expect(page.locator('.daystrip')).toBeVisible();
  await expect(page.locator('.topstrip h1')).toContainText(/Monday|Tuesday|Wednesday|Thursday|Friday/);
  for (let i = 0; i < 3; i++) await page.locator('[data-action="coffee"]').click();
  await expect(page.locator('.daystrip')).toHaveClass(/jitter/);
  await page.locator('[data-action="skip-meal"]').click();
  await page.locator('[data-action="pop-in"]').click();
  await expect(page.locator('.day-note')).not.toBeEmpty();
  await expect(page.locator('[data-action="pop-in"]')).toBeDisabled();
  await page.locator('.radio-list .option:not(:disabled)').first().click();
  await page.locator('[data-action="continue"]').click();
  await resolveScenes(page);
  const after = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); const r = loadSave(localStorage).run; return { dayIndex: r.dayIndex, cups: r.caffeine.day, tempo: r.tempo }; });
  expect(after.tempo).toBe('day');
  expect(after.dayIndex).toBe(1);
  expect(after.cups).toBe(0);
});

test('Life.exe shows the body, the money, and the clinic that bills you anyway', async ({ page }) => {
  await seedPlay(page, `s.player.stats.health = 44; s.player.stats.money = 4000;`, { background: 'masters', topic: 'ml', international: true });
  await page.locator('.desk-icon[data-app="life"]').click();
  await expect(page.locator('.vitals')).toBeVisible();
  expect(await page.locator('.clinic').count()).toBeGreaterThanOrEqual(6);
  await expect(page.locator('.lifeapp')).toContainText(/insurance/i);
  const before = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); return loadSave(localStorage).run.player.stats.money; });
  await page.locator('.clinic [data-action="clinic"]').first().click();
  const after = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); return loadSave(localStorage).run.player.stats.money; });
  expect(after).toBeLessThan(before);
  await page.locator('[data-action="life-tab"][data-id="visa"]').click();
  await expect(page.locator('.lifeapp')).toContainText('F-1');
  await page.locator('[data-action="life-tab"][data-id="money"]').click();
  expect(await page.locator('.budget-list .option').count()).toBe(3);
  await page.locator('[data-action="budget"][data-id="lean"]').click();
  expect(await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); return loadSave(localStorage).run.budget; })).toBe('lean');
});

test('Gaggle Scholar counts what exists and ranks you against everyone you know', async ({ page }) => {
  await seedPlay(page, `p.status = 'Accepted'; p.venueId = 'neuripsy';
    p.submissionHistory = [{ venueId: 'neuripsy', venue: 'NeurIPSy', month: 0, outcome: 'Accept', reviewers: [], quality: 74, diamonds: 4 }];
    s.citations = { [p.id]: 23 };`);
  await page.locator('.desk-icon[data-app="scholar"]').click();
  await expect(page.locator('.sch-metrics')).toContainText('23');
  expect(await page.locator('.cc-col').count()).toBeGreaterThan(2);
  await page.locator('[data-action="scholar-tab"][data-id="everyone"]').click();
  expect(await page.locator('.sch-board .lv-row').count()).toBeGreaterThanOrEqual(5);
  await expect(page.locator('.sch-board .lv-row.me')).toHaveCount(1);
});

test('a conference trip: a real city, a talk you perform, questions, and a bill', async ({ page }) => {
  test.setTimeout(45_000); // the talk runs on a clock
  await seedPlay(page, `p.status = 'Accepted'; p.venueId = 'osdisaster';
    p.novelty = 72; p.evidence = 72; p.writingQuality = 70; p.reproducibility = 68;
    p.submissionHistory = [{ venueId: 'osdisaster', venue: 'OSDIsaster', month: 2, outcome: 'Accept', reviewers: [], quality: 72, diamonds: 4 }];
    s.player.stats.money = 12000;
    trip.startTrip(s, p, 'boston');`);
  await expect(page.locator('.trip.days')).toBeVisible();
  await expect(page.locator('.trip-head h1')).toContainText('Boston');
  expect(await page.locator('.upgrade').count()).toBe(3);
  await page.locator('[data-action="trip-upgrade"][data-id="extend"]').click();
  await expect(page.locator('.trip-head p')).toContainText('5');
  // reach the talk, then perform it
  for (let i = 0; i < 4; i++) {
    if (await page.locator('[data-action="talk-intro"]').count()) break;
    await page.locator('[data-action="trip-day"][data-id="sessions"]').click();
  }
  await page.locator('[data-action="talk-intro"]').click();
  await page.locator('[data-action="talk-start"]').click();
  await expect(page.locator('.talkgame')).toBeVisible();
  expect(await page.locator('.tg-word').count()).toBe(4);
  for (let r = 0; r < 6; r++) {
    if (!(await page.locator('.tg-word').count())) break;
    await page.locator('.tg-word').first().click();
    await page.waitForTimeout(100);
  }
  await expect(page.locator('.talk-result')).toBeVisible({ timeout: 12000 });
  await page.locator('[data-action="talk-qa"]').click();
  await expect(page.locator('.qa-ask')).toBeVisible();
  for (let i = 0; i < 3; i++) {
    if (!(await page.locator('[data-action="trip-qa"]').count())) break;
    await page.locator('[data-action="trip-qa"]').first().click();
    await page.waitForTimeout(120);
  }
  const st = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); const r = loadSave(localStorage).run; return { grade: r.trip?.talk?.grade, qa: r.trip?.qaResults?.length, days: r.trip?.days, yours: r.trip?.yours }; });
  expect(st.grade).toBeTruthy();
  expect(st.qa).toBe(3);
  expect(st.days).toBe(5);
  expect(st.yours).toBeGreaterThanOrEqual(0);
});

test('defending is not finishing: revisions, format review, then commencement', async ({ page }) => {
  test.setTimeout(45_000);
  await seedPlay(page, `s.month = 62;
    p.status = 'Accepted'; p.venueId = 'neuripsy'; p.progress = 95; p.draft = 100;
    p.submissionHistory = [{ venueId: 'neuripsy', venue: 'NeurIPSy', month: 20, outcome: 'Accept', reviewers: [], quality: 76, diamonds: 4 }];
    s.counts.accepted = 1; s.citations = { [p.id]: 30 }; s.ta = true;
    s.relationship.trust = 74; s.relationship.satisfaction = 68;
    s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass'; s.milestones.thesisStarted = true;
    s.milestones.targetGradYear = 6; s.grad = { settled: true, targetYear: 6, asked: true, rounds: 1 };
    s.jobs.track = 'industry';
    const th = paper.createThesis(s); th.draft = 96; th.status = 'Ready';
    s.milestones.defenseMonth = 62; s.stage = 'milestone'; s.milestoneKind = 'defense';`);
  await page.locator('[data-action="milestone"][data-id="balanced"]').click();

  // You passed, and you are not done.
  await expect(page.locator('.revisions')).toBeVisible();
  await expect(page.locator('[data-action="deposit"]')).toBeDisabled();
  const items = await page.locator('.rev-item').count();
  expect(items).toBeGreaterThanOrEqual(2);
  const state = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); const r = loadSave(localStorage).run; return { defense: r.milestones.defense, graduated: r.milestones.graduated, needed: r.thesis.needed }; });
  expect(state.defense).toBe('pass');
  expect(state.graduated, 'the degree is not conferred by the defense').toBe(false);

  // Work the committee's list.
  for (let i = 0; i < 14; i++) {
    const next = page.locator('.rev-item:not([disabled])').first();
    if (!(await next.count())) break;
    await page.evaluate(async () => { const { loadSave, saveRun } = await import('/src/engine/save.js'); const l = loadSave(localStorage); l.run.player.stats.energy = 90; saveRun(localStorage, l.run, l.meta); });
    await next.click();
    await resolveScenes(page);
  }
  await expect(page.locator('[data-action="deposit"]')).toBeEnabled();

  // Format review gets a couple of goes at you.
  for (let i = 0; i < 4; i++) {
    if (await page.locator('.commence').count()) break;
    await page.locator('[data-action="deposit"]').click();
    await resolveScenes(page);
  }
  await expect(page.locator('.commence')).toBeVisible();
  await expect(page.locator('.cer-read')).toContainText('Doctor of Philosophy');
  const after = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); const r = loadSave(localStorage).run; return { graduated: r.milestones.graduated, deposited: r.thesis.deposited, deferred: r.thesis.deferred }; });
  expect(after.graduated).toBe(true);
  expect(after.deposited).toBe(true);
  expect(after.deferred, 'defending in November means the ceremony is months away').toBe(true);

  await page.locator('[data-action="cv-all"]').click();
  expect(await page.locator('.cv-line').count()).toBeGreaterThanOrEqual(4);
  expect(await page.locator('.offer').count()).toBeGreaterThanOrEqual(1);
  await page.locator('.offer').first().click();

  // The ceremony you missed becomes the first thing your advisor writes about.
  await expect(page.locator('.epilogue')).toBeVisible();
  await expect(page.locator('.epi-body')).toContainText(/hooding|May/i);
  for (let i = 0; i < 8; i++) {
    if (!(await page.locator('[data-action="epilogue"]').count())) break;
    await page.locator('[data-action="epilogue"]').first().click();
    await page.waitForTimeout(60);
  }
  const fin = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); const r = loadSave(localStorage).run; return { phase: r.phase, ending: r.ending?.id, beats: r.epilogue?.done?.length }; });
  expect(fin.phase).toBe('ending');
  expect(fin.ending).toMatch(/^phd_/);
  expect(fin.beats).toBeGreaterThanOrEqual(2);
});

test('year four: asking to finish, being deflected, and pushing back', async ({ page }) => {
  await seedPlay(page, `s.month = 38;
    s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass';
    s.counts.accepted = 2; s.readiness = 72;
    s.advisor.caring = 20; s.advisor.toxicity = 78; s.advisor.ambition = 92;
    s.relationship.trust = 40; s.relationship.satisfaction = 38;
    s.player.skills.communication = 85; s.player.skills.networking = 80; s.player.stats.confidence = 80;`);
  await expect(page.locator('[data-action="ask-timeline"]')).toBeVisible();
  await page.locator('[data-action="ask-timeline"]').click();
  await resolveScenes(page);
  await expect(page.locator('.gradtalk.deflect')).toBeVisible();
  await expect(page.locator('.gradtalk-line')).not.toBeEmpty();

  // Asking someone who left tells you whether the objection was ever about the work.
  await page.locator('[data-action="timeline-move"][data-id="second"]').click();
  await resolveScenes(page);
  await expect(page.locator('.gradtalk .truth-bad')).toBeVisible();

  // The three real moves are each usable once.
  for (const id of ['evidence', 'date', 'committee']) {
    const b = page.locator(`[data-action="timeline-move"][data-id="${id}"]`);
    if (!(await b.count()) || await b.isDisabled()) continue;
    await b.click();
    await resolveScenes(page);
    if (await page.locator('.gradtalk.settled').count()) break;
  }
  const g = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); const r = loadSave(localStorage).run; return { asked: r.grad.asked, used: r.grad.used, settled: r.grad.settled, target: r.grad.targetYear, knows: r.grad.knowsTruth }; });
  expect(g.asked).toBe(true);
  expect(g.knows).toBe('unfair');
  expect(g.used.length).toBeGreaterThanOrEqual(2);
  // Either you got the year, or you can come back next term. Never a dead end.
  if (!g.settled) await expect(page.locator('.gradtalk')).toContainText(/raise it again|month/i);
  else expect(g.target).toBe(5);
});

test('the lecture minigame turns dodged attention into draft progress', async ({ page }) => {
  test.setTimeout(60_000); // the lecture runs in real time
  await seedPlay(page, `p.progress = 60; p.draft = 10; p.status = 'Drafting';
    s.event = 'lecture_dodge'; s.stage = 'event'; s.eventReturn = 'plan'; s.eventVariant = 0;`,
    { background: 'masters', topic: 'ml', international: false }, 9001, true);
  await expect(page.locator('.dialog h2').first()).toContainText('required course');
  await page.locator('[data-action="choice"][data-id="dodge"]').click();
  await expect(page.locator('.lecture')).toBeVisible();
  const deadline = Date.now() + 32000;
  while (Date.now() < deadline) {
    if (!(await page.locator('.lecture').count())) break;
    const cls = await page.locator('.lecture').getAttribute('class', { timeout: 1000 }).catch(() => null);
    if (!cls) break;
    const looking = cls.includes('looking'), working = cls.includes('working');
    if (looking === working) await page.locator('[data-action="lecture-toggle"]').click({ timeout: 800 }).catch(() => {});
    await page.waitForTimeout(150);
  }
  const res = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); const r = loadSave(localStorage).run; return { stage: r.stage, worked: r.lectureResult?.worked, draft: Math.round(r.projects[0].draft) }; });
  expect(res.stage).not.toBe('minigame');
  expect(res.worked).toBeGreaterThan(0);
  expect(res.draft).toBeGreaterThan(10);
});

test('mail, chat and the log follow the language, mid-run', async ({ page }) => {
  test.setTimeout(45_000);
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('/');
  // Play a few months in English, then switch to Chinese from the Start menu.
  await page.evaluate(async () => {
    localStorage.clear();
    const st = await import('/src/engine/state.js');
    const { dispatch, focusOptions } = await import('/src/engine/game.js');
    const { schools } = await import('/src/data/catalog.js');
    const { createProject } = await import('/src/engine/paper.js');
    const { templateById } = await import('/src/engine/events.js');
    const { setAppLanguage } = await import('/src/i18n/apply.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    setAppLanguage('en');
    const resolveAll = s => { let n = 0; while (s.event && n++ < 30) { const e = templateById[s.event]; const c = e.choices.find(x => !x.ending && !x.minigame) || e.choices[0]; s = dispatch(s, { type: 'CHOICE', id: c.id }); if (s.stage === 'minigame') s = dispatch(s, { type: 'LECTURE', worked: 9, attention: 4, caught: 0 }); } return s; };
    const act = (s, a) => resolveAll(dispatch(s, a));
    let s = st.createRun(3131, { background: 'masters', topic: 'ml', international: true });
    const poi = s.advisors.find(a => a.schoolId === schools[3].id);
    s.phase = 'admissions'; s.offers = [schools[3].id];
    s.applications = [{ schoolId: schools[3].id, effort: 'tailored', poiId: poi.id, status: 'admitted', funding: 'RA' }];
    s = act(s, { type: 'ENROLL', id: poi.id });
    createProject(s);
    for (let i = 0; i < 8 && s.phase === 'playing'; i++) {
      if (s.stage === 'plan') { if (!s.focus) { const o = focusOptions(s).find(f => !f.disabled); if (o) s = act(s, { type: 'PLAN', id: o.id }); } s = act(s, { type: 'CONTINUE' }); }
      if (s.stage === 'report') s = act(s, { type: 'DISMISS_REPORT' });
      if (s.stage === 'milestone') s = act(s, { type: 'MILESTONE', id: 'balanced' });
      if (!['plan', 'report', 'milestone'].includes(s.stage)) break;
    }
    const meta = emptyMeta(); meta.settings.lang = 'en'; meta.settings.tips = false;
    saveRun(localStorage, s, meta);
  });
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  for (let i = 0; i < 4; i++) { const c = page.locator('[data-action="close-dialog"]').first(); if (await c.count()) await c.click(); else break; }
  for (let i = 0; i < 10; i++) { const d = page.locator('.modal [data-action="choice"]').first(); if (await d.count()) await d.click(); else break; }

  const grab = async () => {
    await page.locator('.desk-icon[data-app="mail"]').click();
    const mailRow = (await page.locator('.mail-row .mr-subject').first().innerText()).trim();
    await page.locator('.mail-row').first().click();
    const mailBody = (await page.locator('.read-body').innerText()).trim().slice(0, 90);
    await page.locator('.desk-icon[data-app="chat"]').click();
    await page.locator('[data-action="chat-channel"][data-id="general"]').click();
    const chatLine = (await page.locator('.sl-msg .sl-body p').last().innerText()).trim().slice(0, 90);
    await page.locator('.desk-icon[data-app="dashboard"]').click();
    const note = (await page.locator('.notes-box').innerText()).trim().slice(0, 80);
    return { mailRow, mailBody, chatLine, note };
  };

  const han = x => /[一-鿿]/.test(x);
  const latin = x => /[A-Za-z]{4}/.test(x);
  const en = await grab();
  for (const [k, v] of Object.entries(en)) expect(v, `${k} should be English`).toMatch(/[A-Za-z]{4}/);

  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="language"][data-id="zh"]').click();
  const zh = await grab();
  for (const [k, v] of Object.entries(zh)) expect(han(v), `${k} should have switched to Chinese, got: ${v}`).toBe(true);

  await page.locator('[data-action="start-menu"]').click();
  await page.locator('[data-action="language"][data-id="en"]').click();
  const back = await grab();
  expect(back, 'switching back restores the original text exactly').toEqual(en);
  expect(errs, 'no console errors').toEqual([]);
});

test('the summer: applying in August, an advisor who wants it back, and going anyway', async ({ page }) => {
  // August of year two, a strong applicant, and an advisor with every reason to say no.
  await seedPlay(page, `s.month = 11;
    s.counts.accepted = 2;
    s.player.skills.coding = 92; s.player.skills.research = 85; s.player.skills.networking = 80;
    s.advisor.caring = 12; s.advisor.toxicity = 85; s.advisor.ambition = 95; s.advisor.funding = 88;
    s.relationship.trust = 25; s.relationship.satisfaction = 25;
    p.status = 'Rebuttal'; p.progress = 70; p.draft = 80;`);

  const apply = page.locator('[data-action="intern-apply"]');
  await expect(apply).toBeVisible();
  await apply.click();
  await resolveScenes(page);

  const offer = page.locator('[data-action="intern-talk"]').first();
  if (!(await offer.count())) {
    // Forty applications and thirty-four silences is a legitimate outcome; the panel must say so.
    await expect(page.locator('.summertalk')).toBeVisible();
    return;
  }
  await offer.click();
  await resolveScenes(page);

  // They object, and the objection names something really on the calendar.
  await expect(page.locator('.summertalk.hijack, .summertalk.forbid')).toBeVisible();
  await expect(page.locator('.summertalk-line')).not.toBeEmpty();

  // Asking a labmate costs nothing with the advisor and settles nothing.
  const before0 = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); return loadSave(localStorage).run.relationship.satisfaction; });
  if (await clickInPanel(page, '[data-action="intern-move"][data-id="ask_labmate"]')) {
    const before = before0;
    await resolveScenes(page);
    const after = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); const r = loadSave(localStorage).run; return { sat: r.relationship.satisfaction, knows: r.intern.talk.knowsTruth, settled: r.intern.talk.settled }; });
    expect(after.sat).toBe(before);
    expect(['fair', 'unfair']).toContain(after.knows);
    expect(after.settled).toBe(false);
  }

  // Going anyway always works, and the bill arrives in the relationship.
  const before = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); const r = loadSave(localStorage).run; return { sat: r.relationship.satisfaction, trust: r.relationship.trust }; });
  await clickInPanel(page, '[data-action="intern-move"][data-id="go"]');
  await resolveScenes(page);
  const after = await page.evaluate(async () => { const { loadSave } = await import('/src/engine/save.js'); const r = loadSave(localStorage).run; return { internship: r.internship, sat: r.relationship.satisfaction, trust: r.relationship.trust, drag: r.letterDrag || 0 }; });
  expect(after.internship).toBeTruthy();
  expect(after.sat).toBeLessThan(before.sat);
  expect(after.trust).toBeLessThan(before.trust);
  expect(after.drag).toBeGreaterThan(0);
  await expect(page.locator('.summertalk.settled')).toBeVisible();
});

test('the job board: the sponsorship checkbox closes an application in the same afternoon', async ({ page }) => {
  // Year four, international, letters in hand.
  await seedPlay(page, `s.month = 44;
    s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass';
    s.counts.accepted = 3; s.readiness = 75; s.player.stats.energy = 100;
    s.player.profile.international = true;
    p.status = 'Accepted'; p.venueId = 'neuripsy';
    s.letters = { asked: [0,1,2,3].map(i => ({ id: 'w'+i, kind: i ? 'committee' : 'advisor', name: 'Writer '+i, status: 'yes', reach: 2, quality: 66, darkHorse: false })), closed: false };`);

  await page.locator('[data-action="open"][data-app="browser"]').first().click();
  await page.locator('[data-action="browser-tab"][data-id="jobs"]').click();
  await expect(page.getByRole('heading', { name: /LinkedOut/ })).toBeVisible();

  // The question is on the page, and it has two boxes and no third one.
  await expect(page.getByText(/require sponsorship/i)).toBeVisible();
  await expect(page.getByText(/There is no third box/)).toBeVisible();

  // A posting that does not sponsor still lets you apply, and answers the same afternoon.
  const blocked = page.locator('.listing', { hasText: /Does not sponsor/ }).first();
  await expect(blocked).toBeVisible();
  const name = (await blocked.locator('b').first().innerText()).trim();
  await blocked.locator('[data-action="job-apply"][data-effort="standard"]').click();
  await resolveScenes(page);

  const st = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const r = loadSave(localStorage).run;
    return { apps: r.jobs.apps.map(a => ({ name: a.name, stage: a.stage, why: a.why })), inbox: r.inbox.length };
  });
  const app = st.apps.find(a => a.name === name);
  expect(app).toBeTruthy();
  expect(app.stage).toBe('rejected');
  expect(app.why).toBe('sponsorship');
  await expect(page.locator('.app-row', { hasText: name })).toBeVisible();
  await expect(page.getByText(/closed inside the hour on work authorisation/)).toBeVisible();
});

test('the job board: a normal application waits, and the advisor can be told before they find out', async ({ page }) => {
  await seedPlay(page, `s.month = 44;
    s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass';
    s.counts.accepted = 3; s.readiness = 75; s.player.stats.energy = 100;
    s.player.profile.international = false; s.advisor.caring = 80;
    p.status = 'Accepted'; p.venueId = 'neuripsy';`);

  await page.locator('[data-action="open"][data-app="browser"]').first().click();
  await page.locator('[data-action="browser-tab"][data-id="jobs"]').click();
  // Domestic candidates never see the work-authorisation fieldset at all.
  await expect(page.getByText(/require sponsorship/i)).toHaveCount(0);

  const first = page.locator('.listing:not(.blocked)').first();
  await first.locator('[data-action="job-apply"][data-effort="standard"]').click();
  await resolveScenes(page);
  const after = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const r = loadSave(localStorage).run;
    return { n: r.jobs.apps.length, stage: r.jobs.apps[0]?.stage, quiet: r.jobs.apps[0]?.quiet, heat: r.jobs.heat };
  });
  expect(after.n).toBe(1);
  expect(after.stage).toBe('submitted');
  expect(after.quiet).toBe(true);
  expect(after.heat).toBeGreaterThan(0);

  // Saying it yourself clears the heat and, with this advisor, buys you an ally.
  await page.locator('[data-action="job-disclose"]').click();
  await resolveScenes(page);
  const told = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const r = loadSave(localStorage).run;
    return { heat: r.jobs.heat, disclosed: r.jobs.secret.disclosed, reaction: r.jobs.secret.reaction };
  });
  expect(told.heat).toBe(0);
  expect(told.disclosed).toBe(true);
  expect(told.reaction).toBe('ally');
});
