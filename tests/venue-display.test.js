import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject } from '../src/engine/paper.js';
import { browserApp } from '../src/ui/apps/browser.js';
import { setAppLanguage } from '../src/i18n/apply.js';

function author(month) {
  let s = createRun(4242, { background: 'masters', topic: 'ml', international: false });
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.month = month; s.stage = 'plan'; s.event = null;
  const p = createProject(s);
  Object.assign(p, { status: 'Ready', draft: 100, progress: 100, venueId: 'kddish', wizardStep: 4 });
  return s;
}

test('submission confirmation and deadline list show the actual review cycle in either language', () => {
  try {
    for (const lang of ['en', 'zh']) {
      setAppLanguage(lang);
      for (const [month, review, decision, conference] of [
        [10, ['October 2029', '2029年10月'], ['November 2029', '2029年11月'], ['August 2030', '2030年8月']],
        [17, ['April 2030', '2030年4月'], ['May 2030', '2030年5月'], ['August 2030', '2030年8月']],
      ]) {
        const s = author(month), i = lang === 'zh' ? 1 : 0;
        const confirmation = browserApp(s, { browserTab: 'openregret' });
        assert.ok(confirmation.includes(review[i]), `${lang}: reviews at ${review[i]}`);
        assert.ok(confirmation.includes(decision[i]), `${lang}: decision at ${decision[i]}`);
        const deadlines = browserApp(s, { browserTab: 'deadlines' });
        const row = deadlines.match(/<tr><td><b>KDDish<\/b>.*?<\/tr>/s)?.[0];
        assert.ok(row, 'the KDDish deadline is visible');
        assert.ok(row.includes(decision[i]), `${lang}: list decision at ${decision[i]}`);
        assert.ok(row.includes(conference[i]), `${lang}: list conference at ${conference[i]}`);
      }
    }
  } finally { setAppLanguage('en'); }
});
