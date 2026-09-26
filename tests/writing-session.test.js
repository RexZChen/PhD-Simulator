import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject, writeBudget } from '../src/engine/paper.js';
import { browserApp } from '../src/ui/apps/browser.js';
import { setAppLanguage } from '../src/i18n/apply.js';

function writer() {
  let s = createRun(4242, { background: 'masters', topic: 'ml' });
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.stage = 'plan'; s.event = null;
  const p = createProject(s); p.progress = 50; p.status = 'Experiments';
  return s;
}

test('one writing session equals the existing paragraph actions without spending time or extra resources', () => {
  for (const [tempo, focus, typed] of [['month', 'research', 5], ['month', 'write', 0], ['week', 'writing', 8], ['week', 'research', 5]]) {
    const s = writer(); Object.assign(s, { tempo, focus, typed });
    if (tempo === 'week' && focus === 'writing') s.crunch = { type: 'deadline', projectId: s.activeProjectId }; // A writing sprint needs a real target.
    let paragraphs = structuredClone(s);
    while (paragraphs.typed < writeBudget(paragraphs)) paragraphs = dispatch(paragraphs, { type: 'WRITE' });
    const session = dispatch(s, { type: 'WRITE_SESSION' });
    assert.deepEqual(session, paragraphs);
    assert.throws(() => dispatch(session, { type: 'WRITE_SESSION' }), /complete/);
  }
});

test('writing sessions obey the manuscript cap and research gate', () => {
  const s = writer(); s.projects[0].draft = 98;
  const next = dispatch(s, { type: 'WRITE_SESSION' });
  assert.equal(next.projects[0].draft, 100);
  assert.equal(next.typed, 2);
  const early = writer(); early.projects[0].progress = 34;
  assert.throws(() => dispatch(early, { type: 'WRITE_SESSION' }), /35%/);
});

test('editor guidance distinguishes a locked review from insufficient research and exhausted writing', () => {
  try {
    for (const lang of ['en', 'zh']) {
      setAppLanguage(lang);
      const s = writer(), p = s.projects.find(x => x.id === s.activeProjectId);
      Object.assign(p, { status: 'Advisor Review', draft: 66, progress: 41, reviewDueWeek: 8 });
      const locked = browserApp(s, { browserTab: 'overgrief' });
      const zone = locked.match(/id="typing-zone".*?<\/div>/s)?.[0];
      assert.match(zone, lang === 'zh' ? /这一版正在由导师审阅/ : /This version is with your advisor/);
      assert.doesNotMatch(zone, /35%|class="cursor"/);
      p.status = 'Drafting'; s.typed = writeBudget(s);
      const used = browserApp(s, { browserTab: 'overgrief' }).match(/id="typing-zone".*?<\/div>/s)?.[0];
      assert.match(used, lang === 'zh' ? /本轮写作已完成/ : /Writing session complete/);
      assert.doesNotMatch(used, /class="cursor"/);
      p.status = 'Ready'; p.approvedWithout = true;
      for (const browserTab of ['overgrief', 'openregret']) {
        const ready = browserApp(s, { browserTab });
        assert.match(ready, lang === 'zh' ? /跳过导师最终审阅/ : /without the advisor’s final read/);
        assert.doesNotMatch(ready, /Approved by your advisor|Approved\. Open|通过了。等有投稿场所/);
      }
    }
  } finally { setAppLanguage('en'); }
});
