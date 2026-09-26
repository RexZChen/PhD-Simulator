import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { commitRelocation } from '../src/engine/relocation.js';
import { hardTaMonth, onHardTA } from '../src/engine/life.js';
function student(month) {
  let s=createRun(842,{background:'masters',topic:'ml'});const a=s.advisors[0];
  s.phase='admissions';s.offers=[a.schoolId];s.applications=[{schoolId:a.schoolId,poiId:a.id,status:'admitted',funding:'RA'}];
  s=dispatch(s,{type:'ENROLL',id:a.id});s.month=month;s.milestones.prelim='pass';s.milestones.proposal='pass';
  s.player.stats.health=100;s.player.stats.hope=90;s.player.stats.energy=100;s.standing=90;s.quitPressure=0;
  s.advisor.funding=10;s.flags.fellow=false;s.flags.loan=false;s.flags.finishFast=false;s.advisor.tenurePressure=0;
  s.flags.remoteAdvisor=true;return s;
}
function advance(s,n=1){s.stage='report';s.event=null;s.eventQueue=[];s.report={monthsCovered:n};return dispatch(s,{type:'DISMISS_REPORT'});}
test('report advancement relocates before payroll and covers each month in a summer season',()=>{
  let s=student(32);commitRelocation(s);const quote=s.pendingRelocation;
  s=advance(s,3);assert.equal(s.month,35);assert.equal(s.relocationHistory.length,1);
  assert.equal(s.report.ledgers.length,3);
  for(const ledger of s.report.ledgers){assert.equal(ledger.stipend,quote.stipend);assert.equal(ledger.rent,quote.rent);}
  assert.equal(s.ta,false);assert.equal(s.transferSupport.from,33);
  s=advance(s);assert.equal(s.month,36);assert.equal(s.ta,false);assert.equal(s.ledger.stipend,quote.stipend);
});
test('year-six guarantee suppresses reduced funding; expiry restores it before that month payroll',()=>{
  let s=student(49);s.advisor.funding=55;commitRelocation(s);s=advance(s);
  for(let month=51;month<=61;month++) s=advance(s);
  assert.equal(s.month,61);assert.equal(s.ledger.stipend,s.program.stipend);assert.equal(s.flags.fundingGap,undefined);
  s=advance(s);assert.equal(s.month,62);assert.equal(s.transferSupport.expiryNotified,true);
  assert.equal(s.ledger.stipend,Math.round(s.program.stipend*.7));
});
test('expired summer guarantee resumes ordinary TA summer shortfall',()=>{
  let s=student(32);commitRelocation(s);s=advance(s);
  for(let month=34;month<=45;month++)s=advance(s);
  assert.equal(s.month,45);assert.equal(s.ta,true);assert.equal(s.ledger.stipend,Math.round(s.program.stipend*.4));
});
test('departmental guarantee survives advisor succession and respects real internship salary',()=>{
  let s=student(30);commitRelocation(s);s=advance(s);
  s.advisor={...s.advisor,id:'local-successor',funding:0};
  s.flags.hardTA=true;s.raLost={until:45};
  const before=structuredClone(s);hardTaMonth(s);assert.deepEqual(s,before);assert.equal(onHardTA(s),false);
  s.internship={start:32,end:34,company:'Existing employer',typeId:'research',salary:12345};
  s=advance(s);assert.equal(s.ledger.stipend,12345);assert.equal(s.ta,false);
  s.internship=null;s=advance(s);assert.equal(s.ledger.stipend,s.program.stipend);assert.equal(s.ta,false);
});

test('guaranteed remaining summer disables the request and rejects it without cost or RNG', async()=>{
  const { ask }=await import('../src/engine/advisor.js');
  const { chatOptions }=await import('../src/ui/apps/chat.js');
  const { transferCoversRemainingSummer }=await import('../src/engine/relocation.js');
  for(const month of [18,21,22,23]) {
    const s=student(month);
    s.transferSupport={schoolId:s.program.id,advisorId:'previous-advisor',from:month===23?23:18,until:24};
    s.askCooldowns={};s.flags.summerCovered=false;
    const before=structuredClone(s);
    assert.equal(transferCoversRemainingSummer(s),true);
    const option=chatOptions(s,'advisor').find(x=>x.id==='ask:summer_money');
    assert.equal(option.disabled,true);assert.match(option.why,/remaining summer/);
    assert.throws(()=>ask(s,'summer_money'),/remaining summer/);
    assert.deepEqual(s,before);
  }
});

test('a guarantee ending before August is paid leaves the request usable',async()=>{
  const { ask }=await import('../src/engine/advisor.js');
  const { chatOptions }=await import('../src/ui/apps/chat.js');
  const { transferCoversRemainingSummer }=await import('../src/engine/relocation.js');
  for(const month of [18,21,22,23]) {
    const s=student(month);
    s.transferSupport={schoolId:s.program.id,from:18,until:23};
    s.askCooldowns={};s.flags.summerCovered=false;
    s.advisorMode={id:'attentive',since:month,until:month+2};
    assert.equal(transferCoversRemainingSummer(s),false);
    assert.equal(chatOptions(s,'advisor').find(x=>x.id==='ask:summer_money').disabled,false);
    const energy=s.player.stats.energy;
    assert.doesNotThrow(()=>ask(s,'summer_money'));
    assert.equal(s.player.stats.energy,energy-2);
    assert(s.askCooldowns.summer_money>month*4);
  }
  const s=student(22);
  s.transferSupport={schoolId:'other-campus',from:0,until:70};
  assert.equal(transferCoversRemainingSummer(s),false);
});
