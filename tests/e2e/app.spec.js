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
async function resolveScenes(page, max = 24) {
  // Scenes can stack (a choice can open a pushback, which can open a report), and the catalogue
  // is large enough now that a month can produce several. Clear whatever is modal until the
  // desktop is back, acting on the last dialog rendered.
  for (let i = 0; i < max; i++) {
    const dlg = page.locator('.modal .dialog').last();
    if (!(await dlg.count()) || !(await dlg.isVisible())) return;
    const btn = dlg.locator([
      '[data-action="choice"]:not([disabled])',
      '[data-action="pushback"]:not([disabled])',
      '[data-action="dismiss-report"]',
      '[data-action="close-dialog"]',
      '[data-action="close-thread"]',
    ].join(', ')).first();
    if (!(await btn.count())) return;
    await btn.click();
    await page.waitForTimeout(40);
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


// Choosing an approach at a milestone opens Room 214. Answer the six questions and let the
// committee's verdict land, so tests about what happens *after* the exam stay about that.
async function sitTheExam(page) {
  // The room is a timetable now: a talk with a deck, one interruption, the questions, and the
  // corridor. Walk whichever phase is up until the room closes, then clear the photograph.
  const room = page.locator('[data-vv]');
  if (!(await room.count())) return;
  // A defense is six segments and about three minutes of wall clock; give it the iterations.
  for (let i = 0; i < 240; i++) {
    if (!(await room.count())) break;
    const phase = await room.getAttribute('data-phase').catch(() => null);
    if (phase === 'talk') {
      const cut = page.locator('[data-action="exam-interrupt"]:not(.hidden)');
      if (await cut.count() && await cut.isVisible()) { await cut.click().catch(() => {}); await page.waitForTimeout(200); continue; }
      const next = page.locator('[data-action="exam-talk"][data-id="next"]');
      if (await next.count()) { await next.click().catch(() => {}); await page.waitForTimeout(200); continue; }
    }
    if (phase === 'qa') {
      const move = room.locator('[data-action="viva-move"]:not([disabled])').first();
      if (await move.count()) { await move.click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(2800); continue; }
    }
    await page.waitForTimeout(300);           // intro, clearing and the corridor are waits
  }
  await expect(page.locator('[data-vv]')).toHaveCount(0, { timeout: 25_000 });
  // Everybody stays for the photograph, and it is modal, so it is in the way until it is closed.
  const photo = page.locator('.dialog.photo [data-action="photo-close"]');
  if (await photo.count()) { await photo.click().catch(() => {}); await page.waitForTimeout(300); }
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
  // Thirty-two schools and four-question interviews make this a longer walk than it was.
  test.setTimeout(60_000);
  await fresh(page);
  await page.getByRole('button', { name: /Randomize My Academic Fate/ }).click();
  await page.getByRole('button', { name: /Next >/ }).click();
  await page.check('#eula');
  await page.getByRole('button', { name: /Generate applicant/ }).click();
  await closeDialogs(page);
  await page.locator('[data-action="prep"]:not([data-guide])[data-id="sop_draft"]').click();
  await page.locator('[data-action="prep"]:not([data-guide])[data-id="letter_ask"]').first().click();
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
  await page.locator('[data-action="prep"]:not([data-guide])[data-id="proceed"]').click();
  await expect(page.getByRole('heading', { name: /GradApply — Programs/ })).toBeVisible();
  for (let i = 0; i < 5; i++) { await page.locator('[data-action="apply"]:not([disabled])').first().click(); await resolveScenes(page); }
  await page.locator('[data-action="admissions"]:not([data-guide])').click();
  await expect(page.getByRole('heading', { name: /GradApply — Status/ })).toBeVisible();
  // Interviews draw their own questions now, so answer until the call ends rather than counting,
  // and bound the outer loop so a stuck call fails the test rather than hanging it.
  for (let call = 0; call < 12; call++) {
    const join = page.locator('[data-action="ga-thread"][data-id$=":interview"].primary');
    if (!(await join.count())) break;
    await join.first().click();
    for (let i = 0; i < 8; i++) {
      const opt = page.locator('.modal [data-action="interview"]').first();
      if (!(await opt.count())) break;
      await opt.click();
      await page.waitForTimeout(40);
    }
    await closeDialogs(page);
  }
  await expect(page.locator('[data-action="ga-thread"][data-id$=":interview"].primary')).toHaveCount(0);
  await page.locator('[data-action="decisions"]:not([data-guide])').click();
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
  await page.locator('[data-action="start-project"]:not([data-guide])').click();
  await page.locator('[data-action="continue"]:not([data-guide])').click();
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
  await page.locator('[data-action="continue"]:not([data-guide])').click();
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
  test.setTimeout(180_000);   // the defense itself is two and a half hours of timetable now
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
  await sitTheExam(page);

  // You passed, and you are not done.
  await expect(page.locator('.revisions')).toBeVisible();
  await expect(page.locator('[data-action="deposit"]:not([data-guide])')).toBeDisabled();
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
  await expect(page.locator('[data-action="deposit"]:not([data-guide])')).toBeEnabled();

  // Format review gets a couple of goes at you.
  for (let i = 0; i < 4; i++) {
    if (await page.locator('.commence').count()) break;
    await page.locator('[data-action="deposit"]:not([data-guide])').click();
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
  // Clear whatever is on screen: a scene, a report, a pushback, a tips dialog. Anything modal
  // blocks the desktop icons underneath it, so this has to be thorough rather than specific.
  for (let i = 0; i < 20; i++) {
    const modal = page.locator('.modal').first();
    if (!(await modal.count())) break;
    const btn = modal.locator('[data-action="choice"]:not([disabled]), [data-action="pushback"]:not([disabled]), [data-action="dismiss-report"], [data-action="close-dialog"], [data-action="close-thread"], .buttons button:not([disabled])').first();
    if (!(await btn.count())) break;
    await btn.click();
    await page.waitForTimeout(60);
  }

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

test('GradApply guides a new player, shows Energy as a meter, and marks what they have done', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: /New applicant/ }).click();
  await page.getByRole('button', { name: /Next >/ }).click();
  await page.check('#eula');
  await page.getByRole('button', { name: /Next >/ }).click();
  await page.getByLabel('Your name').fill('Morgan Test');
  await page.selectOption('select[name="background"]', 'undergrad');
  await page.getByRole('button', { name: /Create applicant/ }).click();

  // The startup tips must be about the screen in front of them, not a phase they cannot reach.
  await expect(page.getByText(/You are applying to graduate school/)).toBeVisible();
  await closeDialogs(page);

  // Energy is a meter, not a footnote.
  const meter = page.locator('.energy-meter');
  await expect(meter).toBeVisible();
  await expect(meter.locator('.em-track i')).toBeVisible();

  // The guide names the first move and provides the button that makes it.
  const guide = page.locator('.guide');
  await expect(guide).toContainText(/statement of purpose/i);
  await guide.locator('[data-action="prep"]').click();
  await resolveScenes(page);
  await expect(guide).toContainText(/recommendation letter/i);

  // Seven recommenders to choose between, each with a hint about what they would write.
  const recs = page.locator('.request');
  expect(await recs.count()).toBeGreaterThan(4);
  await expect(recs.first().locator('.rec-note')).not.toBeEmpty();

  // Researching a school yields real insider notes, and the school is then visibly done.
  await page.locator('.school-pick button').first().click();
  await page.locator('[data-action="prep"]:not([data-guide])[data-id="research"]').first().click();
  await resolveScenes(page);
  const insider = page.locator('.insider li');
  expect(await insider.count()).toBeGreaterThan(0);
  await expect(insider.first()).not.toBeEmpty();
  await expect(page.locator('.school-pick button.researched, .school-pick button.primary').first()).toBeVisible();

  // The statement can now be pushed past the old ceiling of 63.
  const sopAfter = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const r = loadSave(localStorage).run;
    return { steps: r.prep.sopSteps, sop: r.prep.sop, letters: r.prep.letters.length };
  });
  expect(sopAfter.letters).toBe(7);
  expect(sopAfter.steps).toContain('draft');
});

test('the achievements screen can always be left again', async ({ page }) => {
  await seedPlay(page, `s.month = 12;`);
  await page.locator('[data-action="collection"]').first().click();
  await expect(page.getByRole('heading', { name: /Things you.{1,3}ve survived/ })).toBeVisible();
  const back = page.locator('[data-action="back-to-game"]');
  await expect(back).toBeVisible();
  await back.click();
  await expect(page.locator('.topstrip')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Things you.{1,3}ve survived/ })).toHaveCount(0);
});

test('an effect that costs money reads as a loss, not a gain', async ({ page }) => {
  await seedPlay(page, `s.month = 12;`);
  // The Networking plan costs $60. It must not render as "Money +++".
  const net = page.locator('.option', { hasText: /Networking/ }).first();
  await expect(net).toBeVisible();
  const pills = await net.locator('.pill').allInnerTexts();
  const moneyPill = pills.find(p => /Money/i.test(p));
  expect(moneyPill).toBeTruthy();
  expect(moneyPill).toMatch(/▼/);
  expect(moneyPill).toContain('−');
  expect(moneyPill).not.toContain('+');
});

test('the journey bar shows where you are, what is done, and the next dated thing', async ({ page }) => {
  await seedPlay(page, `s.month = 30;
    s.milestones.prelim = 'pass'; s.milestones.proposal = null;
    p.targetMonth = 33; p.targetVenue = 'NeurIPSy'; p.status = 'Drafting';`);
  const bar = page.locator('.journey');
  await expect(bar).toBeVisible();
  // Six year bands, a position marker, and the terms shaded.
  expect(await bar.locator('.jb-year').count()).toBe(6);
  await expect(bar.locator('.jb-now')).toHaveCount(1);          // a zero-width rule; its bar is the visible part
  await expect(bar.locator('.jb-now i')).toBeVisible();
  expect(await bar.locator('.jb-term').count()).toBeGreaterThan(20);
  // A passed prelim reads as done; a chosen deadline gets an actual pin.
  expect(await bar.locator('.jb-mark.done').count()).toBeGreaterThan(0);
  const pin = bar.locator('.jb-mark.pin');
  expect(await pin.count()).toBe(1);
  await expect(pin).toHaveAttribute('title', /NeurIPSy/);
  // And the legend names the next thing with a date on it.
  await expect(bar.locator('.jb-next')).toContainText(/NeurIPSy|Proposal|Deadline/);
});

test('Slack: you can react, answer one person, and take it to a DM', async ({ page }) => {
  await seedPlay(page, `s.month = 8; s.player.stats.energy = 90;
    s.chatMessages.push({ id: 'seed-1', channel: 'general', month: 8, week: 0, phase: 'playing',
      time: '11:14', sender: s.labmates[0].name, body: 'the cluster is down again and i am losing my mind', read: true });`);
  await page.locator('[data-action="open"][data-app="chat"]').first().click();
  await page.locator('[data-action="chat-channel"][data-id="general"]').click();

  const msg = page.locator('.sl-msg', { hasText: /cluster is down/ }).first();
  await expect(msg).toBeVisible();

  // React: free, and it registers.
  await msg.locator('.rx-add .rx.add').hover();
  await msg.locator('.rx-menu [data-reaction="sob"]').click();
  await resolveScenes(page);
  await expect(page.locator('.sl-msg', { hasText: /cluster is down/ }).locator('.rx.mine')).toBeVisible();

  // Reply: this message invites one, and answering it costs energy and builds a bond.
  const before = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const r = loadSave(localStorage).run;
    return { energy: r.player.stats.energy, msgs: r.chatMessages.length };
  });
  const reply = page.locator('.sl-msg', { hasText: /cluster is down/ }).locator('.rx.word').first();
  await expect(reply).toBeVisible();
  await reply.click();
  await resolveScenes(page);
  const after = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const r = loadSave(localStorage).run;
    return { energy: r.player.stats.energy, msgs: r.chatMessages.length, replied: r.chatMessages.find(m => m.id === 'seed-1')?.repliedWith };
  });
  expect(after.replied).toBeTruthy();
  expect(after.msgs).toBeGreaterThan(before.msgs + 1);   // your line, and theirs back

  // A DM channel exists for a labmate, and asking uses it.
  const dmRail = page.locator('[data-action="chat-channel"][data-id^="dm:"]').first();
  await expect(dmRail).toBeVisible();
  await dmRail.click();
  await resolveScenes(page);
  const opener = page.locator('[data-action="dm-send"]').first();
  await expect(opener).toBeVisible();
  await opener.click();
  await resolveScenes(page);
  const dm = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const r = loadSave(localStorage).run;
    return r.chatMessages.filter(m => (m.channel || '').startsWith('dm:')).length;
  });
  expect(dm).toBeGreaterThanOrEqual(2);
});

test('text size is adjustable from the tray and it sticks', async ({ page }) => {
  await seedPlay(page, `s.month = 6;`);
  const read = () => page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  const base = await read();
  await page.locator('.tray-text [data-id="up"]').click();
  const bigger = await read();
  expect(bigger).toBeGreaterThan(base);
  await page.locator('.tray-text [data-id="up"]').click();
  expect(await read()).toBeGreaterThan(bigger);
  await page.locator('.tray-text [data-id="down"]').click();
  await page.locator('.tray-text [data-id="down"]').click();
  await page.locator('.tray-text [data-id="down"]').click();
  const smaller = await read();
  expect(smaller).toBeLessThan(base);
  // It survives a reload, because a text-size preference that resets is not a preference.
  await page.reload();
  await page.locator('.boot').click();
  expect(await read()).toBe(smaller);
  // And the ends of the scale disable rather than doing nothing.
  await expect(page.locator('.tray-text [data-id="down"]')).toBeDisabled();
});

test('the whole turn fits on screen: every plan option and the button that spends it', async ({ page }) => {
  await seedPlay(page, `s.month = 30;`);
  // The plan is the only mandatory input in the game, and it is re-made every month. If the list
  // does not fit, Rest is the option below the fold — and Rest is the one the balance punishes you
  // for never taking.
  const m = await page.evaluate(() => {
    const sc = document.querySelector('.client');
    const opts = [...document.querySelectorAll('.radio-list.plans .option')];
    const cont = document.querySelector('[data-action="continue"]:not([data-guide])');
    const sb = sc.getBoundingClientRect();
    return {
      options: opts.length,
      visible: opts.filter(o => o.getBoundingClientRect().bottom <= sb.bottom).length,
      rowH: Math.round(opts[0].getBoundingClientRect().height),
      continueVisible: cont ? cont.getBoundingClientRect().bottom <= sb.bottom : false,
      bodyScrollsX: document.body.scrollWidth > document.body.clientWidth,
    };
  });
  expect(m.options).toBeGreaterThan(5);
  expect(m.visible).toBe(m.options);
  expect(m.rowH).toBeLessThan(70);
  expect(m.continueVisible).toBe(true);
  expect(m.bodyScrollsX).toBe(false);
  // The description is still there for the option you are actually weighing.
  await page.locator('[data-action="plan"][data-id="rest"]').click();
  await expect(page.locator('.option.selected .muted')).toBeVisible();
});

test('the vitals follow you when the sidebar is too narrow to exist', async ({ page }) => {
  await seedPlay(page, `s.month = 20; s.player.stats.energy = 8; s.player.stats.health = 45;`);
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.setViewportSize({ width: 1000, height: 900 });
  await expect(page.locator('.sidebar')).toBeHidden();
  // Hiding them without replacing them meant choosing a plan blind to what it costs.
  const mini = page.locator('.vitals-mini');
  await expect(mini).toBeVisible();
  await expect(mini).toContainText('8');
  await expect(mini).toContainText('45');
});

test('the desktop never gets brighter as you get worse', async ({ page }) => {
  // Stress and health both tinted .desktop with `filter`, which does not compose: the later rule
  // won, and health's tint is the milder one.
  const read = async () => page.locator('.desktop').evaluate(el => getComputedStyle(el).filter);
  const sat = f => Number((f.match(/saturate\(([\d.]+)\)/) || [])[1] ?? 1);
  await seedPlay(page, `s.player.hidden.stress = 80; s.player.stats.health = 95;`);
  const stressedOnly = sat(await read());
  await seedPlay(page, `s.player.hidden.stress = 80; s.player.stats.health = 45;`);
  const stressedAndRundown = sat(await read());
  expect(stressedOnly).toBeLessThan(1);
  expect(stressedAndRundown).toBeLessThanOrEqual(stressedOnly);
});

test('the archive stays open: Scholar and the other tabs after the run concludes', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const st = await import('/src/engine/state.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { schools } = await import('/src/data/catalog.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    let s = st.createRun(9001, { background: 'masters', topic: 'ml', international: false });
    s.phase = 'admissions'; s.offers = [schools[0].id];
    s.applications = [{ schoolId: schools[0].id, effort: 'generic', poiId: s.advisors[0].id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: s.advisors[0].id });
    s.month = 60;
    st.finish(s, 'phd_product_eng', 'Software Engineer', 'They bring you in at mid-level.');
    saveRun(localStorage, s, emptyMeta());
  });
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Review the last run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  await closeDialogs(page);
  // Six years of mail, citations and a submission history are the point of having played; the
  // desktop does not get taken away at the end.
  for (const app of ['scholar', 'mail', 'browser', 'calendar']) {
    await page.locator(`[data-action="open"][data-app="${app}"]`).first().dblclick();
    await expect(page.locator('.window .client')).toBeVisible();
    await expect(page.locator(`[data-action="open"][data-app="${app}"]`).first()).toHaveClass(/active/);
  }
});

test('Room 214 runs the hour: you present, they ask, you wait in the corridor', async ({ page }) => {
  // A prelim is a talk, four questions and twelve seconds in a corridor, and it takes about a
  // minute of real time to walk. That is the feature; the default 20s budget is not enough for it.
  test.setTimeout(120_000);
  await seedPlay(page, `
    s.month = 22; s.coursework = 70; s.readiness = 60;
    s.stage = 'milestone'; s.milestoneKind = 'prelim';
  `, undefined, 9001, true);
  const approach = page.locator('[data-action="milestone"][data-id="balanced"]');
  await expect(approach).toBeVisible();
  await approach.click();
  const room = page.locator('[data-vv]');
  await expect(room).toBeVisible();

  // A prelim opens on the talk, not on a question. The deck is real and the clock is running.
  await expect(room).toHaveAttribute('data-phase', 'talk');
  await expect(page.locator('[data-vv-slide-title]')).not.toBeEmpty();
  await expect(page.locator('[data-vv-seg]')).toContainText('40');

  // Click through the deck. Somewhere in it, one of them decides to be the difficult one; that
  // has to be reachable, because in a real room it always is.
  let interrupted = false;
  for (let i = 0; i < 80; i++) {
    if (!(await room.count())) break;
    if ((await room.getAttribute('data-phase').catch(() => null)) !== 'talk') break;
    const cut = page.locator('[data-action="exam-interrupt"]:not(.hidden)');
    if (await cut.count() && await cut.isVisible()) {
      interrupted = true;
      await expect(page.locator('[data-vv-interrupt]')).not.toBeEmpty();
      await cut.click().catch(() => {});
      await page.waitForTimeout(220);
      continue;
    }
    const next = page.locator('[data-action="exam-talk"][data-id="next"]');
    if (await next.count()) await next.click().catch(() => {});
    await page.waitForTimeout(220);
  }
  expect(interrupted, 'one of them always decides to be the difficult one').toBe(true);

  // Then the questions, which is the exam this used to be all of.
  await expect(room).toHaveAttribute('data-phase', 'qa', { timeout: 15_000 });
  await expect(page.locator('[data-vv-q]')).not.toBeEmpty();
  for (let i = 0; i < 5; i++) {
    if (!(await room.count())) break;
    if ((await room.getAttribute('data-phase')) !== 'qa') break;
    const btn = room.locator('[data-action="viva-move"]:not([disabled])').first();
    await btn.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(2800);
  }

  // And then you are put outside while they decide, out loud, without you.
  if (await room.count()) {
    await expect(room).toHaveAttribute('data-phase', 'corridor', { timeout: 25_000 });
    const thing = page.locator('[data-action="exam-corridor"]').first();
    if (await thing.count()) {
      await thing.click().catch(() => {});
      await expect(page.locator('[data-vv-flash]')).not.toBeEmpty();
      await expect(thing).toBeDisabled();
    }
  }

  await expect(page.locator('[data-vv]')).toHaveCount(0, { timeout: 20_000 });
  const st = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const run = loadSave(localStorage)?.run;
    return { stage: run?.stage, prelim: run?.milestones?.prelim, viva: run?.viva };
  });
  expect(st.viva).toBeFalsy();
  expect(['pass', 'conditional', 'retake', 'fail']).toContain(st.prelim);
});

test('the plant is on the desk, not on a menu, and it is plastic', async ({ page }) => {
  await seedPlay(page, "s.month = 26; s.player.hidden.stress = 72;");
  const plant = page.locator('.desk-plant');
  await expect(plant).toBeVisible();
  // It is never labelled, never badged, and never mentioned by the interface.
  await expect(plant).toHaveText('');
  const before = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    return loadSave(localStorage)?.run?.player.hidden.stress;
  });
  await plant.click();
  await expect(page.locator('.statusbar, .status')).toContainText(/water/i, { timeout: 4000 });
  const after = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const run = loadSave(localStorage)?.run;
    return { stress: run?.player.hidden.stress, watered: run?.plant?.watered, found: run?.plant?.found };
  });
  expect(after.watered).toBe(1);
  expect(after.found).toBe(true);
  expect(after.stress).toBeLessThan(before);
});

test('04:12: the error is never the last line', async ({ page }) => {
  test.setTimeout(60_000);
  await seedPlay(page, `p.progress = 45; p.status = 'Experiments'; s.player.stats.energy = 80;`);
  await page.locator('[data-action="open"][data-app="browser"]').first().dblclick();
  const start = page.locator('[data-action="cluster-start"]');
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.locator('[data-cl-log]')).toBeVisible();
  await expect(page.locator('.cl-line')).not.toHaveCount(0);

  // Clicking the line that raised is the instinct, and it costs you the reservation.
  const before = await page.locator('[data-cl-left]').innerText();
  const decoy = page.locator('.cl-line', { hasText: /Traceback|OutOfMemoryError|loss=nan|slurmstepd|Cleaning up/ }).first();
  if (await decoy.count()) {
    await decoy.click();
    await expect(page.locator('[data-cl-flash]')).not.toHaveClass(/hidden/);
    expect(await page.locator('[data-cl-left]').innerText()).not.toBe(before);
  }

  // Then find the line that is actually the problem, in each of the four logs.
  const realLines = await page.evaluate(async () => {
    const { clusterStages } = await import('/src/data/cluster.js');
    return clusterStages.map(st => st.lines.find(l => l.real).t);
  });
  for (let i = 0; i < 4; i++) {
    if (!(await page.locator('[data-cl-log]').count())) break;
    for (const text of realLines) {
      const line = page.locator('.cl-line', { hasText: text.slice(0, 40) });
      if (await line.count()) { await line.first().click().catch(() => {}); break; }
    }
    await page.waitForTimeout(3200);
  }

  // It resolves into a turn rather than hanging, and it spends the action.
  await expect(page.locator('[data-cl]')).toHaveCount(0, { timeout: 20_000 });
  const st = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const run = loadSave(localStorage)?.run;
    return { stage: run?.stage, minigame: run?.minigame, done: run?.actions?.cluster, evidence: run?.projects?.[0]?.evidence };
  });
  expect(st.stage).toBe('plan');
  expect(st.minigame).toBeFalsy();
  expect(st.done).toBe(true);
  expect(st.evidence).toBeGreaterThan(0);
});

test('the second org chart: people outside the lab, and the work they cost you', async ({ page }) => {
  await seedPlay(page, `
    s.month = 20; p.progress = 60; p.status = 'Drafting'; s.player.stats.energy = 95;
    const net = st.__net;
  `);
  // Meet two people the way a conference would produce them.
  await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { meetContact } = await import('/src/engine/network.js');
    const save = loadSave(localStorage);
    const s = save.run;
    meetContact(s, { kind: 'prof', where: 'poster', venue: 'NeurIPSy', regard: 60 });
    meetContact(s, { kind: 'student', where: 'conference', regard: 40 });
    saveRun(localStorage, s, save.meta);
  });
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  await closeDialogs(page);
  await resolveScenes(page);
  await closeDialogs(page);

  await page.locator('[data-action="open"][data-app="chat"]').first().dblclick();
  const rail = page.locator('.sl-item.net');
  await expect(rail).toHaveCount(2);
  // They are shown with a face, which is what makes them people rather than a number.
  await expect(rail.first().locator('svg.avatar')).toBeVisible();
  await rail.first().click();
  await expect(page.locator('.net-panel')).toBeVisible();

  // A short conversation is cheap and moves how you stand.
  const before = await page.evaluate(async () => (await import('/src/engine/save.js')).loadSave(localStorage).run.contacts[0].regard);
  await page.locator('[data-action="net-talk"]').click();
  const after = await page.evaluate(async () => (await import('/src/engine/save.js')).loadSave(localStorage).run.contacts[0].regard);
  expect(after).toBeGreaterThan(before);
  await expect(page.locator('[data-action="net-talk"]')).toBeDisabled();

  // A collaboration is a real cost: it comes out of your own project.
  await page.locator('[data-action="net-collab"]:not([disabled])').first().click();
  await expect(page.locator('.net-task')).toBeVisible();
  await expect(page.locator('.sl-badge.owe')).toBeVisible();
  const mid = await page.evaluate(async () => {
    const s = (await import('/src/engine/save.js')).loadSave(localStorage).run;
    return { energy: s.player.stats.energy, progress: s.projects[0].progress };
  });
  await page.locator('[data-action="net-do"]').click();
  const done = await page.evaluate(async () => {
    const s = (await import('/src/engine/save.js')).loadSave(localStorage).run;
    return { energy: s.player.stats.energy, progress: s.projects[0].progress, task: s.contacts[0].task, done: s.contacts[0].done };
  });
  expect(done.energy).toBeLessThan(mid.energy);
  expect(done.progress).toBeLessThan(mid.progress);
  expect(done.task).toBeFalsy();
  expect(done.done).toBe(1);
});

test('every school is a different place, and every interview is a different conversation', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: /Randomize My Academic Fate/ }).click();
  await page.getByRole('button', { name: /Next >/ }).click();
  await page.check('#eula');
  await page.getByRole('button', { name: /Generate applicant/ }).click();
  await closeDialogs(page);

  // Researching a program tells you what the place is like, not only what it ranks.
  await page.locator('[data-action="ga-school"]').first().click();
  await page.locator('[data-action="prep"][data-id="research"]').first().click();
  const vibe = page.locator('.campus');
  await expect(vibe).toBeVisible();
  expect(await vibe.locator('dd').count()).toBeGreaterThanOrEqual(5);
  const first = await vibe.innerText();

  // A different school is a different place.
  await page.locator('[data-action="ga-school"]').nth(3).click();
  await page.locator('[data-action="prep"][data-id="research"]').first().click();
  await expect(page.locator('.campus')).toBeVisible();
  expect(await page.locator('.campus').innerText()).not.toBe(first);

  // And the interviews are not the same three questions for everyone.
  const sets = await page.evaluate(async () => {
    const { createRun } = await import('/src/engine/state.js');
    const { pickInterview } = await import('/src/engine/apply.js');
    const s = createRun(4242, { background: 'masters', topic: 'ml', international: true });
    const out = new Set();
    for (let i = 0; i < 25; i++) out.add(pickInterview(s, { poiId: s.advisors[i % s.advisors.length].id }).join(','));
    return out.size;
  });
  expect(sets).toBeGreaterThan(15);
});

test('knocking on the door is a different person every time, and you can see it', async ({ page }) => {
  await seedPlay(page, `p.progress = 62; p.draft = 45; p.status = 'Drafting';
    p.targetVenueId = 'neuripsy'; p.targetMonth = s.month; p.targetVenue = 'NeurIPSy';
    s.week = 3; s.crunch = time.crunchSnapshot(s); s.tempo = time.tempoOf(s); s.focus = null;
    s.advisor.availability = 95; s.advisorMode = { id: 'attentive', until: s.month + 3, since: s.month };`);
  await page.locator('[data-action="pop-in"]').click();
  // The door is drawn, stamped, and animated rather than being one line of grey text.
  const door = page.locator('.door-scene');
  await expect(door).toBeVisible();
  await expect(door.locator('.door-stamp')).not.toBeEmpty();
  await expect(door.locator('svg')).toBeVisible();
  await expect(page.locator('.day-note')).not.toBeEmpty();

  // Twenty-eight outcomes behind one door, so the same week does not read the same way twice.
  const spread = await page.evaluate(async () => {
    const { popIns } = await import('/src/data/day.js');
    return { good: popIns.good.length, bad: popIns.bad.length, absent: popIns.absent.length };
  });
  expect(spread.good + spread.bad + spread.absent).toBeGreaterThan(20);
});

test('an achievement lands on screen instead of in a log nobody re-reads', async ({ page }) => {
  // survivor is awarded at the start of month 12 if hope is still above 60. Seed month 11 and
  // take the turn, so the toast comes from the engine rather than from the test.
  await seedPlay(page, `s.month = 11; s.player.stats.hope = 88; s.player.stats.energy = 90;
    s.achievements = []; s.focus = 'rest';`);
  await expect(page.locator('.award-toast')).toHaveCount(0);
  await page.locator('[data-action="continue"]:not([data-guide])').click();
  await resolveScenes(page);
  const toast = page.locator('.award-toast').first();
  await expect(toast).toBeVisible({ timeout: 10_000 });
  await expect(toast).toContainText(/Achievement unlocked/i);
  await expect(toast.locator('span')).not.toBeEmpty();
});

test('the patent is a process with its own clock, and it lands on Scholar', async ({ page }) => {
  await seedPlay(page, `
    s.month = 26; p.status = 'Accepted'; p.progress = 80; s.counts.accepted = 1;
    s.player.stats.energy = 100;
  `);
  // Filing the disclosure starts a two-and-a-half-year clock.
  const st = await page.evaluate(async () => {
    const { loadSave, saveRun } = await import('/src/engine/save.js');
    const { openPatent, doPatentMeeting, nextPatentMeeting, patentMonth, patentEntry, answerOfficeAction } = await import('/src/engine/patent.js');
    const save = loadSave(localStorage);
    const s = save.run;
    openPatent(s, s.projects[0].id);
    const stages = [`${s.patent.stage} m${s.month}`];
    for (let i = 0; i < 3; i++) { s.player.stats.energy = 100; doPatentMeeting(s, nextPatentMeeting(s).choices[0].id); }
    stages.push(`${s.patent.stage} m${s.month}`);
    let filed = null, action = null;
    for (let m = s.month; m <= 70; m++) {
      s.month = m; const before = s.patent.stage; patentMonth(s);
      if (s.patent.stage !== before) stages.push(`${s.patent.stage} m${m}`);
      if (s.patent.stage === 'filed' && filed === null) filed = m;
      if (s.patent.stage === 'action' && action === null) {
        action = m;
        // The office action is a gate on the desktop, which is the point of it — answer it.
        s.player.stats.energy = 100;
        answerOfficeAction(s, 'fight');
      }
    }
    saveRun(localStorage, s, save.meta);
    return { stages, filed, action, entry: patentEntry(s) };
  });
  // Meetings, then about a year to a filing, then a rejection.
  expect(st.stages[0]).toContain('meetings');
  expect(st.filed).toBeGreaterThan(35);
  expect(st.action).toBeGreaterThan(st.filed);
  expect(st.entry).toBeTruthy();
  expect(st.entry.venue).toMatch(/Patent/);
  expect(st.entry.inventors).toMatch(/Prof\./);

  // And Scholar lists it next to the papers.
  await page.reload();
  await page.locator('.boot').click();
  await page.getByRole('button', { name: /Continue the saved run/ }).click();
  await page.locator('[data-action="wiz-next"]').click();
  await closeDialogs(page);
  await resolveScenes(page);
  await closeDialogs(page);
  await page.locator('[data-action="open"][data-app="scholar"]').first().dblclick();
  await expect(page.locator('.patent-row')).toBeVisible();
  await expect(page.locator('.patent-row')).toContainText(/Patent/);
});

test('the optional questionnaire is optional, and answering it changes the story', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: /New applicant/ }).click();
  await page.getByRole('button', { name: /Next >/ }).click();
  await page.check('#eula');
  await page.getByRole('button', { name: /Next >/ }).click();

  // Collapsed by default, so ten required fields are still ten required fields.
  const block = page.locator('.optional-block');
  await expect(block).toBeVisible();
  await expect(block.locator('select')).toHaveCount(5);
  expect(await block.evaluate(el => el.open)).toBe(false);

  // Leaving them alone must produce a run with nulls, not defaults that gate things.
  await page.getByRole('button', { name: /Create applicant/ }).click();
  await closeDialogs(page);
  const skipped = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    const p = loadSave(localStorage)?.run?.player?.profile;
    return { why: p?.whyHere, house: p?.household, fear: p?.fear };
  });
  expect(skipped.why).toBeNull();
  expect(skipped.house).toBeNull();
  expect(skipped.fear).toBeNull();

  // And the seven conversations they unlock are gated on them, both ways.
  const gates = await page.evaluate(async () => {
    const { createRun } = await import('/src/engine/state.js');
    const { eligible } = await import('/src/engine/events.js');
    const { eventById } = await import('/src/data/events.js');
    const mk = extra => { const s = createRun(3, { background: 'masters', topic: 'ml', international: false, ...extra });
      s.phase = 'playing'; s.month = 32; s.player.hidden.stress = 70; s.projects = []; return s; };
    const off = mk({});
    const on = mk({ whyHere: 'question', household: 'kids', fear: 'fraud', dealbreaker: 'health' });
    const ids = ['opt_the_question', 'opt_small_child', 'opt_fraud', 'opt_dealbreaker'];
    return ids.map(id => ({ id, off: eligible(off, eventById[id], {}), on: eligible(on, eventById[id], {}) }));
  });
  for (const g of gates) {
    expect(g.off, `${g.id} must not fire for a player who skipped`).toBe(false);
    expect(g.on, `${g.id} must fire for a player who answered`).toBe(true);
  }
});

test('the month can be read before it is read: a face, bars that move, and icons', async ({ page }) => {
  await seedPlay(page, `s.month = 20; s.player.stats.energy = 90;`);
  if (!(await page.locator('[data-action="plan"]').first().count())) test.skip(true, 'no plan this seed');
  await page.locator('[data-action="plan"]').first().click();
  await page.locator('[data-action="continue"]:not([data-guide])').click();
  // A summons can land on the way out of the turn; answer it and continue.
  // A summons or a scene can land on the way out of the turn; clear whatever is modal first.
  for (let i = 0; i < 12; i++) {
    if (await page.locator('.glance').count()) break;
    const b = page.locator('.modal [data-action="summons"], .modal [data-action="choice"], .modal [data-action="pushback"], .modal [data-action="close-dialog"]').first();
    if (!(await b.count()) || !(await b.isVisible())) break;
    await b.click().catch(() => {});
    await page.waitForTimeout(80);
  }
  await expect(page.locator('.glance')).toBeVisible({ timeout: 10_000 });

  // The face says how it went before any of the tables do.
  await expect(page.locator('.glance .face-svg')).toBeVisible();
  const level = await page.locator('.glance .face-svg').getAttribute('class');
  expect(level).toMatch(/great|good|ok|bad|awful/);

  // Four bars that animate from where the number was to where it is.
  await expect(page.locator('.glance .dbar')).toHaveCount(4);
  const anim = await page.locator('.glance .dbar-fill').first().evaluate(el => getComputedStyle(el).animationName);
  expect(anim).toContain('dbar-grow');
  const dir = await page.locator('.glance .dbar').first().getAttribute('class');
  expect(dir).toMatch(/up|down|flat/);
});

test('an unscheduled meeting takes a piece of the turn you already chose', async ({ page }) => {
  await seedPlay(page, `s.month = 20;`);
  const shape = await page.evaluate(async () => {
    const { createRun } = await import('/src/engine/state.js');
    const { maybeSummons, answerSummons, summonsKeep } = await import('/src/engine/summons.js');
    const mk = () => { const s = createRun(5, { background: 'masters', topic: 'ml', international: false });
      s.phase = 'playing'; s.month = 20; s.contacts = []; s.counts = {};
      s.advisor = { ambition: 70, management: 60, caring: 60, id: 'a', name: 'A B' };
      s.advisorMode = { id: 'attentive' };
      s.relationship = { trust: 60, satisfaction: 60, conflict: 0, dependency: 20 };
      while (!maybeSummons(s, { crunch: false })) { s.summons = null; }
      return s; };
    const out = {};
    for (const move of ['go', 'late', 'decline']) { const s = mk(); answerSummons(s, move); out[move] = summonsKeep(s); }
    return out;
  });
  // Going costs the turn; naming the deadline recovers most of it; declining costs the relationship.
  expect(shape.go).toBeLessThan(0.7);
  expect(shape.late).toBeGreaterThan(shape.go);
  expect(shape.decline).toBe(1);
});

test('the advisor’s mood is a face, not a sentence you have to parse', async ({ page }) => {
  await seedPlay(page, `s.month = 20; s.advisorMode = { id: 'checkedOut', until: s.month + 3, since: s.month };`);
  // On the manager card, next to their avatar.
  await expect(page.locator('.advisor-card .mode-face .face-svg')).toBeVisible();
  expect(await page.locator('.advisor-card .mode-face .face-svg').getAttribute('class')).toContain('awful');

  // And in LabChat, where the advisor is the whole point of the screen.
  await page.locator('[data-action="open"][data-app="chat"]').first().dblclick();
  await expect(page.locator('.ch-advisor .face-svg')).toBeVisible();

  // A different mode is a different face.
  await seedPlay(page, `s.month = 20; s.advisorMode = { id: 'attentive', until: s.month + 3, since: s.month };`);
  expect(await page.locator('.advisor-card .mode-face .face-svg').getAttribute('class')).toContain('great');
});

test('the advisor card is a card, not a column: the face is a badge and the text has room', async ({ page }) => {
  // Regression guard. The mood face was added as a third child of a two-column grid
  // (48px avatar + 1fr text), which pushed the entire text block into the 48px column: the name
  // broke one word per line and the card ran 565px tall inside a 318px box. Every existing test
  // still passed, because they all asserted the face EXISTS — none of them looked at the layout.
  await seedPlay(page, "s.month = 26;");
  const card = page.locator('.advisor-card').first();
  await expect(card).toBeVisible();
  const box = await card.boundingBox();
  expect(box.height, 'the advisor card has collapsed into the avatar column').toBeLessThan(260);
  // The name must have the width of the text column, not of the avatar.
  const name = card.locator('b').first();
  const nb = await name.boundingBox();
  expect(nb.width, 'the name is wrapping inside the 48px avatar column').toBeGreaterThan(110);
  // And the face is still there, overlapping the portrait rather than taking a column of its own.
  await expect(card.locator('.mode-face')).toBeVisible();
  const face = await card.locator('.mode-face').boundingBox();
  expect(face.x).toBeLessThan(nb.x);
});

test('the scene art carries the time, the season, and how you are', async ({ page }) => {
  // A calm month in the middle of a normal day.
  await seedPlay(page, `s.month = 8; s.player.hidden.stress = 20; s.caffeine = { day: 0, week: 0, month: 0 };`, undefined, 9001, true);
  // Drive the strip directly across states — it is a pure function of the run.
  const shots = await page.evaluate(async () => {
    const { sceneDialog } = await import('/src/ui/scenes.js');
    const { loadSave } = await import('/src/engine/save.js');
    const base = loadSave(localStorage).run;
    const grab = mut => {
      const s = structuredClone(base);
      Object.assign(s, { event: 'burnout' });
      mut(s);
      const html = sceneDialog(s);
      const m = html.match(/class="scene-strip ([^"]+)"/);
      return { cls: m ? m[1] : '', cups: (html.match(/s-cups" data-n="(\d+)"/) || [])[1], board: (html.match(/s-board"><i style="width:(\d+)%/) || [])[1] };
    };
    return {
      winterNight: grab(s => { s.month = 4; s.tempo = 'day'; s.dayIndex = 4; }),
      summerDay: grab(s => { s.month = 10; s.tempo = 'day'; s.dayIndex = 1; }),
      frayed: grab(s => { s.player.hidden.stress = 85; }),
      coffee: grab(s => { s.caffeine = { day: 3, week: 3, month: 2 }; s.event = 'labmate_help'; }),
    };
  });
  // Month 4 is December here: winter, and the fifth block of the day is night.
  expect(shots.winterNight.cls).toContain('sn-winter');
  expect(shots.winterNight.cls).toContain('t-night');
  // Month 10 is June: summer, and the second block is daytime.
  expect(shots.summerDay.cls).toContain('sn-summer');
  expect(shots.summerDay.cls).toContain('t-day');
  // Stress desaturates the room.
  expect(shots.frayed.cls).toContain('m-frayed');
  // And the coffee you drank is on the desk.
  expect(Number(shots.coffee.cups)).toBeGreaterThan(0);
});

test('the whiteboard writes something other than what you drew, and rewards losing track of time', async ({ page }) => {
  await seedPlay(page, `s.month = 14;`);
  await page.locator('[data-action="open"][data-app="whiteboard"]').first().dblclick();
  const surf = page.locator('[data-wb-surface]');
  await expect(surf).toBeVisible();
  await expect(page.locator('.wb-mark')).toHaveCount(0);

  // Clicking puts an equation there, not your stroke.
  const box = await surf.boundingBox();
  await page.mouse.click(box.x + 80, box.y + 60);
  await expect(page.locator('.wb-mark')).toHaveCount(1);
  expect((await page.locator('.wb-mark').first().innerText()).length).toBeGreaterThan(1);

  // Keep going and it fills; the marks are varied rather than the same one repeated.
  for (let i = 0; i < 17; i++) {
    await page.mouse.click(box.x + 40 + (i * 53) % (box.width - 90), box.y + 30 + (i * 71) % (box.height - 70));
    await page.waitForTimeout(20);
  }
  const texts = await page.locator('.wb-mark').allInnerTexts();
  expect(texts.length).toBe(18);
  expect(new Set(texts).size).toBeGreaterThan(9);

  // A burst of clicks inside the window is worth something, once a month.
  const flowed = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    return loadSave(localStorage)?.run?.counts?.boardFlow || 0;
  });
  expect(flowed).toBeGreaterThan(0);

  // And it erases.
  await page.locator('[data-action="wb-erase"]').click();
  await expect(page.locator('.wb-mark')).toHaveCount(0);

  // The marks are session UI, not run state — a save must not carry a list of doodles.
  const saved = await page.evaluate(async () => {
    const { loadSave } = await import('/src/engine/save.js');
    return JSON.stringify(loadSave(localStorage)?.run || {});
  });
  expect(saved).not.toContain('LayerNorm');
});
