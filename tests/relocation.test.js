import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { relocationQuote, commitRelocation, processRelocation, transferSupportActive } from '../src/engine/relocation.js';
import { monthlyLedger, onHardTA } from '../src/engine/life.js';
import { eligible, openNext, templateById } from '../src/engine/events.js';
import { newAdvisor } from '../src/engine/advisor.js';
import { saveRun, loadSave, emptyMeta } from '../src/engine/save.js';
function student() {
  let s = createRun(442, { background: 'masters', topic: 'ml' });
  const a=s.advisors[0]; s.phase='admissions'; s.offers=[a.schoolId];
  s.applications=[{schoolId:a.schoolId,poiId:a.id,status:'admitted',funding:'RA'}];
  s=dispatch(s,{type:'ENROLL',id:a.id});s.month=30; s.stage='plan';return s;
}
test('quote is stable and pure; commitment charges exactly once without advancing time',()=>{
  const s=student();const before=structuredClone(s);const q=relocationQuote(s);
  assert.deepEqual(q,relocationQuote(s));assert.deepEqual(s,before);
  assert.notEqual(q.schoolId,s.program.id);assert.equal(q.moveMonth,31);
  const balance=s.player.stats.money-(s.debt||0);
  assert.equal(commitRelocation(s),true);assert.equal(s.month,30);
  assert.equal(s.player.stats.money-(s.debt||0),balance-1600);
  const committed=structuredClone(s);assert.equal(commitRelocation(s),false);assert.deepEqual(s,committed);
  assert.equal(processRelocation(s),false);assert.equal(s.program.id,before.program.id);
});
test('arrival changes campus and future payroll while preserving academic work and personal histories',()=>{
  const s=student();s.milestones.prelim='passed';s.coursework=77;s.readiness=65;
  s.flags.remoteAdvisor=true;s.flags.hardTA=true;s.flags.extraTA=true;s.flags.fundingGap=true;s.flags.raise=true;
  s.raLost={until:45};s.ta=true;s.housing={rentDelta:-420,commute:2};s.lifeCooldowns={roommate:999,closer:999,further:999,gym:100};
  s.funding={records:[{kind:'fellowship',amount:4000}]};s.internship={company:'Existing',start:45,end:47};
  const academic=structuredClone({milestones:s.milestones,projects:s.projects,committee:s.committee,funding:s.funding,internship:s.internship,coursework:s.coursework,readiness:s.readiness});
  const oldPeers=structuredClone(s.peers);const oldLab=structuredClone(s.labmates);const oldSchool=s.program.id;
  commitRelocation(s);const quote=relocationQuote(s);s.month=quote.moveMonth;
  assert.equal(processRelocation(s),true);
  assert.equal(s.program.id,quote.schoolId);assert.equal(s.advisor.schoolId,quote.schoolId);
  assert.equal(s.advisors.find(a=>a.id===s.advisor.id).schoolId,quote.schoolId);
  assert.deepEqual({milestones:s.milestones,projects:s.projects,committee:s.committee,funding:s.funding,internship:s.internship,coursework:s.coursework,readiness:s.readiness},academic);
  assert.deepEqual(s.housing,{rentDelta:0,commute:0});assert.deepEqual(s.lifeCooldowns,{gym:100});
  assert.equal(onHardTA(s),false);assert.equal(s.ta,false);assert.equal(s.flags.remoteAdvisor,undefined);
  assert.equal(s.flags.movedWithAdvisor,true);assert.equal(s.flags.fundingGap,undefined);
  for(const p of oldPeers){const now=s.peers.find(x=>x.id===p.id);assert.equal(now.name,p.name);assert.equal(now.bond,p.bond);assert.equal(now.schoolId,oldSchool);assert.equal(now.status,'remote');}
  for(const p of oldLab){const now=s.labmates.find(x=>x.id===p.id);assert.equal(now.name,p.name);assert.equal(now.bond,p.bond);assert.equal(now.schoolId,quote.schoolId);}
  assert.equal(s.peers.filter(x=>x.status==='active').length,2);
  assert.equal(transferSupportActive(s),true);monthlyLedger(s);assert.equal(s.ledger.stipend,quote.stipend);assert.equal(s.ledger.rent,quote.rent);
  const arrived=structuredClone(s);assert.equal(processRelocation(s),false);assert.deepEqual(s,arrived);
  s.month=s.transferSupport.until;assert.equal(transferSupportActive(s),false);
});
test('a changed advisor cancels and refunds the deposit once without relocating',()=>{
  const s=student();s.player.stats.money=100;s.debt=200;
  const school=s.program.id;commitRelocation(s);assert.equal(s.debt,1700);
  s.advisor.id='replacement';assert.equal(processRelocation(s),false);
  assert.equal(s.program.id,school);assert.equal(s.player.stats.money,100);assert.equal(s.debt,200);
  assert.equal(s.relocationHistory[0].status,'cancelled');assert.equal(s.pendingRelocation,null);
  const after=structuredClone(s);assert.equal(processRelocation(s),false);assert.deepEqual(s,after);
});

test('both departure choices arrange the advertised move once and survive a save before arrival', () => {
  for (const [event, choice] of [['advisor_moves', 'move'], ['advisor_leaves', 'follow']]) {
    let s = student();
    if (event === 'advisor_leaves') s.advisorTenure = {
      advisorId: s.advisor.id, schoolId: s.program.id, outcome: 'denied',
      announcedMonth: s.month - 12, departureMonth: s.month, status: 'notice',
      eventId: 'advisor_tenure_denied', response: 'follow',
    };
    s.event = event; s.eventVariant = 0; s.stage = 'event'; s.eventReturn = 'plan';
    s.eventQueue = ['advisor_retires'];
    const before = s.player.stats.money - s.debt;
    const quote = relocationQuote(s), origin = s.program.id, committee = [...s.committee];
    s.milestones.prelim = 'pass';
    s = dispatch(s, { type: 'CHOICE', id: choice });
    assert.equal(s.player.stats.money - s.debt, before - quote.cost);
    assert.equal(s.program.id, origin, 'the move has not happened yet');
    assert.equal(s.pendingRelocation.schoolId, quote.schoolId);
    assert.equal(s.flags.movedWithAdvisor, undefined);
    assert.equal(s.achievements.includes('wentwiththem'), false);
    assert.equal(s.event, null, 'another departure cannot interrupt the signed transfer');
    const values = new Map();
    const storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
    assert.equal(saveRun(storage, s, emptyMeta()).error, null);
    s = loadSave(storage).run;
    s.stage = 'report'; s.report = { monthsCovered: 1 };
    s = dispatch(s, { type: 'DISMISS_REPORT' });
    assert.equal(s.program.id, quote.schoolId);
    assert.equal(s.ledger.stipend, quote.stipend);
    assert.equal(s.ledger.rent, quote.rent);
    assert.equal(s.milestones.prelim, 'pass');
    assert.deepEqual(s.committee, committee);
    assert.equal(s.achievements.includes('wentwiththem'), true);
    assert.equal(s.relocationHistory.length, 1);
  }
});

test('a real advisor reassignment cancels a pending move and refunds the paid split immediately', () => {
  const s = student(); s.player.stats.money = 100; s.debt = 200;
  const origin = s.program.id;
  commitRelocation(s);
  newAdvisor(s);
  assert.equal(s.pendingRelocation, null);
  assert.equal(s.program.id, origin);
  assert.equal(s.debt, 200); assert.equal(s.player.stats.money, 100);
  assert.equal(s.relocationHistory[0].status, 'cancelled');
});

test('arrival closes old funding scenes and physical encounters without recasting the original peer', () => {
  const s = student(), oldPeer = s.peers[0];
  commitRelocation(s); s.month++;
  processRelocation(s);
  for (const id of ['ra_lost', 'summer_funding', 'ta_hell_grading']) assert.equal(eligible(s, templateById[id]), false);
  s.eventReturn = 'plan';
  s.eventQueue = ['ra_lost', 'comparison_recover', 'reading_group'];
  s.actorFor = { comparison_recover: { id: oldPeer.id, type: 'peer' } };
  openNext(s);
  assert.equal(s.event, 'reading_group');
  assert.notEqual(s.eventActor.id, oldPeer.id);
  assert.equal(s.peers.find(p => p.id === s.eventActor.id).schoolId, s.program.id);
  assert.equal(s.actorFor.comparison_recover, undefined);
});


test('late transfers disclose only funding months remaining within the program limit', () => {
  const s = student(); s.month = 68;
  const q = relocationQuote(s);
  assert.equal(q.supportMonths, 3);
  commitRelocation(s); s.month = q.moveMonth;
  processRelocation(s);
  assert.equal(s.transferSupport.until, 72);
  s.month = 71;
  assert.equal(relocationQuote(s), null);
});
