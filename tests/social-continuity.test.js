import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, chatBody, absWeek } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { socialOptions, socialAction } from '../src/engine/social.js';
import { chatOptions, chatDraft } from '../src/ui/apps/chat.js';
import { createProject } from '../src/engine/paper.js';
import { socialStories } from '../src/data/social.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { t } from '../src/i18n/index.js';

function enrolled() {
  const s = createRun(4242, { background: 'masters', topic: 'ml', international: false });
  const a = s.advisors[6];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, status: 'admitted', funding: 'RA', poiId: a.id }];
  return dispatch(s, { type: 'ENROLL', id: a.id });
}

test('cohort choices follow milestones rather than returning to a passed exam', () => {
  const s = enrolled();
  assert.match(socialAction(s, 'cohort', 'commiserate').label, /qualifier/);
  for (const result of ['pass', 'conditional']) {
    s.milestones.prelim = result;
    assert.equal(socialAction(s, 'cohort', 'commiserate').label, 'Compare proposal doubts');
    assert.equal(socialAction(s, 'cohort', 'study').label, 'Trade proposal outlines');
  }
  s.milestones.proposal = 'pass';
  assert.match(socialAction(s, 'cohort', 'commiserate').label, /dissertation/);
  assert.match(socialAction(s, 'cohort', 'study').label, /mock defense/);
  s.milestones.defense = 'pass';
  assert.match(socialAction(s, 'cohort', 'commiserate').label, /paperwork/);
  assert.equal(socialAction(s, 'cohort', 'study'), null);
});

test('preview is pure; actual conversations rotate and retain their place after reload', () => {
  let s = enrolled();
  s.milestones.prelim = 'pass';
  const drafts = [], replies = [];
  for (let i = 0; i < 6; i++) {
    const before = JSON.stringify(s);
    const preview = chatDraft(s, 'cohort', 'soc:commiserate');
    assert.equal(chatDraft(s, 'cohort', 'soc:commiserate'), preview);
    assert.equal(JSON.stringify(s), before, 'opening the menu must not advance RNG or dialogue');
    s = dispatch(s, { type: 'SOCIAL', channel: 'cohort', id: 'commiserate' });
    const posts = s.chatMessages.filter(m => m.channel === 'cohort').slice(-2);
    assert.equal(chatBody(s, posts[0]), preview, 'the promised draft is what gets sent');
    drafts.push(preview); replies.push(chatBody(s, posts[1]));
    if (i >= 2) {
      assert.equal(new Set(drafts.slice(-3)).size, 3);
      assert.equal(new Set(replies.slice(-3)).size, 3);
    }
    s = JSON.parse(JSON.stringify(s));
    s.month += 2;
  }
});

test('changing life stage does not bypass the shared conversation cooldown', () => {
  let s = dispatch(enrolled(), { type: 'SOCIAL', channel: 'cohort', id: 'commiserate' });
  s.milestones.prelim = 'pass';
  const option = socialAction(s, 'cohort', 'commiserate');
  assert.match(option.label, /proposal/);
  assert.equal(option.disabled, true);
  const before = JSON.stringify(s);
  assert.throws(() => dispatch(s, { type: 'SOCIAL', channel: 'cohort', id: 'commiserate' }), /recently/);
  assert.equal(JSON.stringify(s), before);
  assert.ok(s.askCooldowns['soc:commiserate'] > absWeek(s));
});

test('study actions use the current stage and show the same costs the engine enforces', () => {
  let s = enrolled();
  s.month = 9; // June: no problem-set group during summer.
  assert.equal(socialAction(s, 'cohort', 'study').disabled, true);
  assert.throws(() => dispatch(s, { type: 'SOCIAL', channel: 'cohort', id: 'study' }), /term/);
  s.milestones.prelim = 'pass';
  const before = { readiness: s.readiness, coursework: s.coursework, energy: s.player.stats.energy };
  assert.equal(socialAction(s, 'cohort', 'study').disabled, false, 'proposal practice can happen in summer');
  s = dispatch(s, { type: 'SOCIAL', channel: 'cohort', id: 'study' });
  assert.equal(s.readiness, before.readiness + 6);
  assert.equal(s.coursework, before.coursework);
  assert.equal(s.player.stats.energy, before.energy - 4);
  s.askCooldowns = {}; s.player.stats.energy = 1;
  const ui = chatOptions(s, 'cohort').find(a => a.id === 'soc:study');
  assert.equal(ui.cost, 4); assert.equal(ui.disabled, true);
  assert.match(ui.why, /Energy/);
  assert.throws(() => dispatch(s, { type: 'SOCIAL', channel: 'cohort', id: 'study' }), /Energy/);
});

test('reviewer advice appears only when its effects can help the paper under discussion', () => {
  const s = enrolled();
  assert.equal(socialAction(s, 'general', 'ask_lab'), null);
  const p = createProject(s);
  p.status = 'Rejected'; p.submissionHistory.push({ outcome: 'Reject' });
  assert.ok(socialAction(s, 'general', 'ask_lab'));
  p.status = 'Submitted';
  assert.equal(socialAction(s, 'general', 'ask_lab'), null);
  assert.throws(() => dispatch(s, { type: 'SOCIAL', channel: 'general', id: 'ask_lab' }), /cannot|not something/);
});

test('all stage conversations translate and old chat history follows language changes', () => {
  let s = enrolled(); s.milestones.proposal = 'pass'; s.milestones.prelim = 'pass';
  s = dispatch(s, { type: 'SOCIAL', channel: 'cohort', id: 'commiserate' });
  const old = s.chatMessages.filter(m => m.channel === 'cohort').slice(-2);
  const english = old.map(m => chatBody(s, m));
  try {
    setAppLanguage('zh');
    for (const stages of Object.values(socialStories)) for (const story of Object.values(stages)) {
      for (const source of [story.label, story.hint, ...story.exchanges.flat()].filter(Boolean)) {
        assert.notEqual(t(source), source, source);
      }
    }
    assert.ok(old.every((m, i) => chatBody(s, m) !== english[i]));
    assert.match(socialOptions(s, 'cohort')[0].label, /mock defense/); // catalog remains English; rendering translates.
  } finally { setAppLanguage('en'); }
});
