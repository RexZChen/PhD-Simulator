import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { monthlyBudget, monthlyLedger } from '../src/engine/life.js';
import { portalApp } from '../src/ui/apps/portal.js';
import { dateLabel } from '../src/data/calendar.js';

function student(month) {
  let s = createRun(842, { background: 'masters', topic: 'ml', international: true });
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.month = month; s.ledger = null;
  return s;
}

test('monthly budget is pure and agrees with settled payroll across funding and expense cases', () => {
  for (const [month, setup] of [[0, s => {}], [16, s => { s.flags.cat = true; s.flags.remitting = true; s.debt = 3000; }],
    [21, s => { s.ta = true; }], [64, s => { s.flags.fundingGap = true; s.flags.hardship = true; }],
    [19, s => { s.withheld = 2500; }], [21, s => { s.internship = { start: 21, end: 23, salary: 6000 }; }]]) {
    const s = student(month); setup(s);
    const before = structuredClone(s), quote = monthlyBudget(s);
    assert.deepEqual(s, before, 'rendering a forecast must not mutate payroll or RNG');
    const ledger = monthlyLedger(s);
    for (const key of ['stipend', 'tax', 'net', 'refund', 'support', 'rent', 'food', 'premium', 'fees', 'visa', 'remit', 'interest', 'other']) assert.equal(quote[key], ledger[key], key);
    const bills = ['rent', 'food', 'premium', 'fees', 'visa', 'remit', 'other', 'interest'].reduce((sum, k) => sum + quote[k], 0);
    assert.equal(s.player.stats.money - s.debt - (before.player.stats.money - before.debt), quote.net + quote.refund + quote.support - bills);
  }
});

test('portal distinguishes estimates from recorded bills and reflects retakes and passed exams', () => {
  const s = student(21); s.ta = true; s.milestones.prelim = 'retake'; s.milestones.prelimMonth = 29;
  let html = portalApp(s, {});
  assert.match(html, /Estimated monthly budget/);
  assert.ok(html.includes(`Retake scheduled: ${dateLabel(29)}.`));
  assert.ok(!html.includes('Scheduled August 2030.'));
  assert.match(html, /Withholding/); assert.match(html, /Insurance premium/);
  assert.match(html, /data-page="money"/);
  s.ledger = monthlyLedger(s);
  s.milestones.prelim = 'pass';
  html = portalApp(s, {});
  assert.match(html, /This month’s settled budget/);
  assert.match(html, /Preliminary examination passed/);
  s.milestones.prelim = 'conditional';
  assert.match(portalApp(s, {}), /accepted publication is required/);
});
