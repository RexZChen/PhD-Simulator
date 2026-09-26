import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, chat, chatBody, fill, lastName, entryText } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { newAdvisor, doRequest } from '../src/engine/advisor.js';
import { createProject } from '../src/engine/paper.js';
import { eligible, resolveChoice, choiceUnavailable } from '../src/engine/events.js';
import { eventById } from '../src/data/events.js';
import { cohortLines } from '../src/data/chatter.js';
import { meetings } from '../src/data/meetings.js';
import { buildCV } from '../src/engine/epilogue.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { provenanceOf } from '../src/i18n/index.js';
import { replyOptionsFor, replyTo, archivedMessage } from '../src/engine/slack.js';

function student() {
  let s = createRun(4242);
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.month = 22; s.event = null; s.eventQueue = []; s.stage = 'plan';
  createProject(s);
  return s;
}
function scene(s, event, choice) {
  s.event = event; s.stage = 'event'; s.eventReturn = 'plan';
  resolveChoice(s, choice);
}

test('handover preserves paper authors and milestones, closes old requests and returns pending internal reads', () => {
  const s = student(), old = { ...s.advisor };
  const p = s.projects[0];
  s.projects = ['Drafting', 'Advisor Review', 'Submitted', 'Accepted'].map((status, i) => ({ ...structuredClone(p), id: `p-${i}`, status, draft: 80, reviewDueWeek: 100 }));
  const papers = structuredClone(s.projects);
  s.requests = [{ id: 'r-open', status: 'open' }, { id: 'r-done', status: 'done' }];
  s.milestones.prelim = 'pass'; s.coursework = 80;
  s.askCooldowns = { meeting: 120, 'soc:coffee': 120 };
  s.flags.remoteAdvisor = true; s.flags.tenureDenied = true; s.letterDrag = 5;
  s.jobs.secret = { disclosed: true, discovered: true, reaction: 'anger' };
  s.eventQueue = ['meet_criticism', 'advisor_leaves', 'rent_hike'];
  s.scheduled = [{ id: 'advisor_leaves', week: 120 }, { id: 'job_offers', week: 120 }];
  newAdvisor(s, 'deceased');
  assert.notEqual(s.advisor.id, old.id);
  assert.equal(s.formerAdvisors[0].reason, 'deceased');
  assert.equal(s.formerAdvisors[0].searchDisclosure.reaction, 'anger');
  assert.deepEqual(s.projects.map(p => p.collaborators), papers.map(p => p.collaborators));
  assert.deepEqual(s.projects.slice(2), papers.slice(2), 'external review and published record stay intact');
  assert.equal(s.projects[1].status, 'Drafting'); assert.equal(s.projects[1].reviewDueWeek, null); assert.equal(s.projects[1].draft, 80);
  assert.equal(s.milestones.prelim, 'pass'); assert.equal(s.coursework, 80);
  assert.equal(s.requests[0].status, 'withdrawn'); assert.equal(s.requests[0].advisorId, old.id);
  assert.equal(s.requests[1].status, 'done');
  assert.throws(() => doRequest(s, 'r-open'));
  assert.deepEqual(s.askCooldowns, { 'soc:coffee': 120 });
  assert.equal(s.flags.remoteAdvisor, undefined); assert.equal(s.flags.tenureDenied, undefined); assert.equal(s.letterDrag, 0);
  assert.deepEqual(s.jobs.secret, { disclosed: false, discovered: false });
  assert.deepEqual(s.eventQueue, ['rent_hike']); assert.deepEqual(s.scheduled, [{ id: 'job_offers', week: 120 }]);
});

test('repeated handovers never resurrect departed advisors or reuse their identity', () => {
  const s = student(), ids = new Set([s.advisor.id]);
  for (let i = 0; i < 4; i++) {
    newAdvisor(s, 'deceased');
    assert.equal(ids.has(s.advisor.id), false);
    assert.doesNotMatch(s.advisor.name, /Replacement/);
    ids.add(s.advisor.id);
  }
});

test('archived advisor messages cannot generate a new reply from the former or deceased PI', () => {
  for (const reason of ['deceased', 'reassigned']) {
    const s = student();
    const m = s.chatMessages.find(m => m.sender === s.advisor.name && m.channel === 'advisor');
    const options = replyOptionsFor(s, m);
    assert.ok(options.length, 'the original live conversation invited a reply');
    newAdvisor(s, reason);
    assert.equal(archivedMessage(s, m), true);
    assert.deepEqual(replyOptionsFor(s, m), []);
    const before = structuredClone(s);
    assert.throws(() => replyTo(s, m.id, options[0].id));
    assert.deepEqual(s, before, 'an archived reply creates no message or costs');
    assert.equal(archivedMessage(s, s.chatMessages.at(-1)), false, 'the successor remains reachable');
  }
});

test('saved translated conversations keep the original speaker and cast after succession, including legacy refs', () => {
  setAppLanguage('en');
  const s = student(), old = { ...s.advisor };
  const template = cohortLines.any[1];
  chat(s, 'advisor', old.name, fill(s, template));
  const fresh = s.chatMessages.at(-1);
  s.chatMessages.push({ ...structuredClone(fresh), id: 'legacy', senderId: undefined, i18n: { ...provenanceOf(template), f: 1 } });
  newAdvisor(s);
  const saved = JSON.parse(JSON.stringify(s));
  try {
    for (const lang of ['zh', 'en']) {
      setAppLanguage(lang);
      for (const id of [fresh.id, 'legacy']) {
        const m = saved.chatMessages.find(x => x.id === id);
        assert.equal(m.senderId, old.id);
        assert.ok(chatBody(saved, m).includes(lastName(old.name)));
        assert.ok(!chatBody(saved, m).includes(lastName(saved.advisor.name)));
        if (lang === 'zh') assert.match(chatBody(saved, m), /圈起来/);
      }
    }
  } finally { setAppLanguage('en'); }
});

test('the bereavement outcome survives the handover and cannot modify an accepted paper', () => {
  const s = student();
  s.projects[0].status = 'Accepted';
  const c = eventById.advisor_dies.choices.find(x => x.id === 'finish_it');
  assert.ok(choiceUnavailable(s, c));
  s.event = 'advisor_dies'; const before = structuredClone(s);
  assert.throws(() => resolveChoice(s, 'finish_it'), /editable/);
  assert.deepEqual(s, before, 'blocked choice consumes neither costs nor RNG');
  s.projects[0].status = 'Drafting'; s.projects[0].draft = 20;
  scene(s, 'advisor_dies', 'finish_it');
  assert.equal(s.projects[0].draft, 38);
  assert.match(entryText(s, s.history.at(-1)), /acknowledgement/);
  assert.equal(s.formerAdvisors[0].reason, 'deceased');
  try { setAppLanguage('zh'); assert.match(entryText(s, s.history.at(-1)), /致谢/); }
  finally { setAppLanguage('en'); }
});

test('industry referral books a real internship, keeps future work off the CV and prevents double booking', () => {
  const s = student(), money = s.player.stats.money;
  scene(s, 'advisor_industry', 'follow_intern');
  assert.equal(s.player.stats.money, money);
  assert.equal(s.internship.mentorAdvisorId, s.advisor.id);
  assert.equal(s.internship.company, s.company);
  assert.equal(s.flags.remoteAdvisor, true);
  assert.equal(buildCV(s).lines.some(x => /Research internship/.test(x.text)), false);
  s.event = 'advisor_industry'; const before = structuredClone(s);
  assert.throws(() => resolveChoice(s, 'follow_intern'), /already have/);
  assert.deepEqual(s, before);
});

test('remote advisors cannot appear in the office and retain a varied eligible meeting pool', () => {
  let s = student(); s.flags.remoteAdvisor = true; s.tempo = 'day';
  s.projects[0].progress = 30; s.projects[0].draft = 10;
  const before = structuredClone(s);
  assert.throws(() => dispatch(s, { type: 'POP_IN' }), /off campus/);
  assert.deepEqual(s, before);
  const pool = meetings.filter(e => eligible(s, e, { cancelled: false }));
  assert.ok(pool.length >= 6);
  assert.ok(pool.every(e => e.remoteOnly || e.remoteCompatible));
  assert.ok(pool.some(e => e.id === 'meet_remote_document'));
  s.projects[0].draft = 0;
  assert.equal(eligible(s, meetings.find(e => e.id === 'meet_remote_document')), false);
  s.projects[0].status = 'Accepted';
  assert.equal(eligible(s, meetings.find(e => e.id === 'meet_remote_reply')), false);
  s.flags.remoteAdvisor = false;
  assert.equal(eligible(s, meetings.find(e => e.id === 'meet_remote_document')), false);
});
