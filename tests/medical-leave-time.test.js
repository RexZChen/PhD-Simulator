import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { createProject } from '../src/engine/paper.js';
import { seasonEligible } from '../src/engine/time.js';
import { templateById, choiceUnavailable } from '../src/engine/events.js';
import { reportDialog } from '../src/ui/apps/manager.js';
import { dateLabel } from '../src/data/calendar.js';
function student(tempo, leave, seed = 442) {
  let s=createRun(seed,{background:'masters',topic:'ml'});const a=s.advisors[0];
  s.phase='admissions';s.offers=[a.schoolId];s.applications=[{schoolId:a.schoolId,poiId:a.id,status:'admitted',funding:'RA'}];
  s=dispatch(s,{type:'ENROLL',id:a.id});s.month=30;s.week=0;s.stage='plan';s.event=null;s.eventQueue=[];s.scheduled=[];
  s.projects=[];createProject(s);s.tempo=tempo;s.pace='month';s.focus=tempo==='day'?'deep':tempo==='week'?'experiments':'research';
  s.crunch=tempo==='month'?null:{type:'deadline',projectId:s.activeProjectId};s.dayIndex=0;s.leaveWeeks=leave;
  s.player.stats.energy=30;s.player.hidden.stress=40;s.player.stats.health=70;s.burnoutMonths=0;
  s.cadence={oneOnOne:'weekly',group:'weekly'};s.requests=[];s.report={before:{stats:{...s.player.stats},stress:s.player.hidden.stress,relationship:{...s.relationship},coursework:s.coursework,readiness:s.readiness,career:s.career,debt:s.debt,projects:{[s.projects[0].id]:{progress:s.projects[0].progress}}},weeks:[],days:[]};
  return s;
}
for(const [tempo,weeks] of [['day',.2],['week',1],['month',4]])test(`${tempo} leave consumes elapsed time without planned work, meetings or new requests`,()=>{
  const s=student(tempo,weeks);const progress=s.projects[0].progress;const skill=s.player.skills.research;const held=s.meetingStats.held;
  const next=dispatch(s,{type:'CONTINUE'});
  assert.equal(next.leaveWeeks,0);assert.equal(next.projects[0].progress,progress);assert.equal(next.player.skills.research,skill);
  assert(next.player.stats.energy>s.player.stats.energy);assert.equal(next.meetingStats.held,held);assert.equal(next.requests.length,0);assert.notEqual(next.stage,'summons');
  if(tempo==='day'){assert.equal(next.dayIndex,1);assert.equal(next.report.days[0].leave,.2);}
});
test('partial day leave grants only the uncovered fraction of work',()=>{
  const full=student('day',0);full.summons={answered:true,keep:1};
  const half=structuredClone(full);half.leaveWeeks=.1;
  const baseline=full.projects[0].progress;
  const a=dispatch(full,{type:'CONTINUE'}),b=dispatch(half,{type:'CONTINUE'});
  assert.equal(b.leaveWeeks,0);assert(Math.abs((b.projects[0].progress-baseline)*2-(a.projects[0].progress-baseline))<1e-9);
  assert(b.player.stats.energy>a.player.stats.energy);
});
test('five day turns exhaust exactly one week of leave without floating-point residue',()=>{
  let s=student('day',1);
  for(let i=0;i<5;i++) {s.stage='plan';s.event=null;s.eventQueue=[];s.tempo='day';s.focus='deep';s=dispatch(s,{type:'CONTINUE'});}
  assert.equal(s.leaveWeeks,0);assert.equal(s.week,1);
});
test('a planned recovery interval prevents a twelve-week season from absorbing the leave',()=>{
  const s=student('month',1);s.pace='auto';s.milestones.prelim='pass';s.milestones.proposal='pass';
  assert.equal(seasonEligible(s),false);
});

function seasonStudent(critical=false, seed=442) {
  const s=student('month',0,seed);s.pace='auto';s.tempo='season';s.focus='research';
  s.milestones.prelim='pass';s.milestones.proposal='pass';s.milestones.defenseMonth=null;
  s.player.stats.money=50000;s.player.stats.health=critical?10:90;s.player.stats.energy=critical?50:90;
  s.player.hidden.stress=critical?40:10;s.relationship.satisfaction=80;s.advisor.funding=100;
  s.crisis=null;s.lastCrisisMonth=-99;s.conditions=[];s.pressure=20;s.weekLog=[];
  return s;
}
test('healthy season executes three real monthly chunks and dismisses only the final month',()=>{
  const s=seasonStudent();const start=s.month;
  s.advisor.ambition=0; // This fixture is calm; request interruptions have their own regression.
  let next=dispatch(s,{type:'CONTINUE'});
  assert.equal(next.month,start+2);
  assert.equal(next.report.monthsCovered,3);assert.equal(next.report.fromMonth,start);assert.equal(next.report.throughMonth,start+2);
  assert.equal(next.report.advanceMonths,1);
  assert(next.projects[0].progress>s.projects[0].progress);
  for(let i=0;next.event && i<20;i++){const c=templateById[next.event].choices.find(c=>!c.ending&&!c.minigame&&!choiceUnavailable(next,c));assert(c);next=dispatch(next,{type:'CHOICE',id:c.id});}
  assert.equal(next.stage,'report');
  const html=reportDialog(next);assert(html.includes(dateLabel(start)));assert(html.includes(dateLabel(start+2)));
  const after=dispatch(next,{type:'DISMISS_REPORT'});assert.equal(after.month,start+3);
});
test('season stops at the first crisis boundary without applying remaining months work',()=>{
  const s=seasonStudent(true);const next=dispatch(s,{type:'CONTINUE'});
  assert.equal(next.month,s.month+1);assert.equal(next.stage,'crisis');assert.equal(next.crisis.resolved,false);
  assert.equal(next.lastSeasonReport.monthsCovered,1);assert.equal(next.lastSeasonReport.throughMonth,s.month);
  const monthly=structuredClone(s);monthly.pace='month';monthly.tempo='month';monthly.summons={answered:true,keep:1};
  const ordinary=dispatch(monthly,{type:'CONTINUE'});
  assert(Math.abs((next.projects[0].progress-s.projects[0].progress)-.9*(ordinary.projects[0].progress-s.projects[0].progress))<1e-9);
  const held=structuredClone(next);
  assert.throws(()=>dispatch(next,{type:'CONTINUE'}));assert.deepEqual(next,held);
  const recovered=dispatch(next,{type:'CRISIS',id:'treat'});
  assert.equal(recovered.month,next.month);assert.equal(recovered.crisis.resolved,true);assert.equal(recovered.stage,'plan');
  assert(recovered.leaveWeeks>0);
  const planned=dispatch(recovered,{type:'PLAN',id:'research'});
  const resumed=dispatch(planned,{type:'CONTINUE'});assert.notEqual(resumed.stage,'crisis');
});
test('legacy multi-month report cannot advance past an unresolved crisis',()=>{
  const s=seasonStudent(true);s.stage='report';s.report.monthsCovered=3;
  const next=dispatch(s,{type:'DISMISS_REPORT'});assert.equal(next.month,s.month+1);assert.equal(next.stage,'crisis');
});

test('a new advisor request returns control before fast-forward can expire it',()=>{
  const s=seasonStudent(false,3);
  let next=dispatch(s,{type:'CONTINUE'});
  assert(next.requests.length>0, 'this seed issues an advisor request');
  assert.equal(next.counts.requestsExpired || 0,0);
  assert(next.requests.every(r=>r.status==='open'));
  assert(next.report.monthsCovered<3);
  for(let i=0;next.event && i<20;i++) {
    const c=templateById[next.event].choices.find(c=>!c.ending&&!c.minigame&&!choiceUnavailable(next,c));
    assert(c);next=dispatch(next,{type:'CHOICE',id:c.id});
  }
  assert.equal(next.stage,'report');
  next=dispatch(next,{type:'DISMISS_REPORT'});
  assert.equal(next.stage,'plan');
  assert.equal(next.week,0);
  assert.equal(seasonEligible(next),false);
  assert(next.requests.every(r=>r.status==='open' && r.dueWeek>next.month*4));
  const answered=dispatch(next,{type:'REQUEST_DO',id:next.requests[0].id});
  assert.notEqual(answered.requests[0].status,'open');
  assert.equal(answered.counts.requestsExpired || 0,0);
});
