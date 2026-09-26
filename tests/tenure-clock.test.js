import test from 'node:test';
import assert from 'node:assert/strict';
import { openTenureEvent, tenureEventEligible, maintainTenure, clearAdvisorTenure, completeTenureDeparture, resolveTenureChoice, tenureAnnouncement } from '../src/engine/tenure.js';
import late from '../src/data/events/late.js';
import succession from '../src/data/events/succession.js';
import { tenureStoryEvents, tenureStoryZh } from '../src/i18n/zh/tenure-story.js';
const student = (rng=1) => ({rng, month:27, advisor:{id:'pi-a', schoolId:'campus', stage:'pre_tenure', prestige:55}, program:{id:'campus'}, advisors:[{id:'pi-a',stage:'pre_tenure'}], flags:{}, pressure:50, mutators:['tenure','rentspike'], seen:{}});
test('announcement commits once before response; alternate scenes and responses cannot reroll',()=>{
  for (let seed=1;seed<15;seed++) {
    const s=student(seed), initial=s.rng;
    const r=openTenureEvent(s,'tenure_result');assert.notEqual(s.rng,initial);
    const after=s.rng, outcome=r.outcome;
    assert.equal(openTenureEvent(s,'tenure_result'),r);
    assert.equal(openTenureEvent(s,'advisor_tenure_denied'),null);
    assert.equal(tenureEventEligible(s,'advisor_tenure_denied'),false);
    assert.equal(resolveTenureChoice(s,'tenure_result','support'),true);
    assert.equal(resolveTenureChoice(s,'tenure_result','congrats'),false);
    assert.equal(r.outcome,outcome);assert.equal(s.rng,after);
    const snapshot=structuredClone(s);tenureAnnouncement(s,'tenure_result');tenureEventEligible(s,'advisor_leaves');assert.deepEqual(s,snapshot);
  }
});
test('both denial routes provide twelve months from announcement, not absolute month30',()=>{
  for(const id of ['tenure_result','advisor_tenure_denied']){
    let s;
    for(let seed=1;seed<100;seed++){s=student(seed);openTenureEvent(s,id);if(s.advisorTenure.outcome==='denied')break;}
    assert.equal(s.advisorTenure.outcome,'denied');assert.equal(s.advisorTenure.departureMonth,39);
    for(const month of [27,30,38]){s.month=month;assert.equal(tenureEventEligible(s,'advisor_leaves'),false);}
    s.month=39;assert.equal(tenureEventEligible(s,'advisor_leaves'),true);
    resolveTenureChoice(s,'advisor_leaves','follow');s.pendingRelocation={};assert.equal(tenureEventEligible(s,'advisor_leaves'),false);
    completeTenureDeparture(s);s.program.id='new';s.advisor.schoolId='new';
    assert.equal(tenureEventEligible(s,'advisor_leaves'),false);assert.equal(s.advisorTenureHistory.length,1);
    assert.equal(s.flags.tenureDenied,undefined);
  }
});
test('grant stops tenure pressure source and updates advisor catalog',()=>{
  let s;for(let seed=1;seed<100;seed++){s=student(seed);if(openTenureEvent(s,'tenure_result').outcome==='granted')break;}
  assert.equal(s.advisor.stage,'mid_career');assert.equal(s.advisors[0].stage,'mid_career');
  assert.deepEqual(s.mutators,['rentspike']);assert.equal(s.pressure,35);
  maintainTenure(s);assert.equal(s.pressure,35);assert.equal(tenureEventEligible(s,'advisor_leaves'),false);
});
test('legacy unknown denial gets fresh notice; global seen cannot deny a successor',()=>{
  const s=student();s.month=42;s.flags.tenureDenied=true;s.seen={advisor_tenure_denied:1,tenure_result:1};
  const rng=s.rng;maintainTenure(s);assert.equal(s.advisorTenure.departureMonth,54);maintainTenure(s);assert.equal(s.rng,rng);
  clearAdvisorTenure(s);s.advisor.id='pi-b';s.advisor.stage='pre_tenure';s.formerAdvisors=[{id:'pi-a',departedMonth:42}];
  assert.equal(tenureEventEligible(s,'tenure_result'),false);s.month=54;
  assert.equal(tenureEventEligible(s,'tenure_result'),true);assert.equal(tenureEventEligible(s,'advisor_tenure_denied'),true);
  openTenureEvent(s,'advisor_tenure_denied');assert.equal(s.advisorTenure.advisorId,'pi-b');assert.equal(s.advisorTenure.departureMonth,66);
  assert.equal(s.advisorTenureHistory[0].advisorId,'pi-a');
});
test('load maintenance archives stale identity instead of migrating its denial onto new PI',()=>{
  const s=student();openTenureEvent(s,'advisor_tenure_denied');s.advisor.id='pi-b';maintainTenure(s);
  assert.equal(s.advisorTenure,undefined);assert.equal(s.flags.tenureDenied,undefined);
  assert.equal(s.advisorTenureHistory[0].resolution,'superseded');
});
test('changed story fields have Chinese and no tenure response rolls',()=>{
  for(const e of [...late,...succession].filter(e=>tenureStoryEvents[e.id])){
    const zh=tenureStoryEvents[e.id];assert.ok(zh.title);assert.ok(zh.text);
    for(const c of e.choices){assert.equal(c.check,undefined);for(const key of ['text','hint','result'])if(c[key])assert.ok(zh.choices[c.id][key],`${e.id}/${c.id}/${key}`);}
  }
  assert.equal(Object.keys(tenureStoryZh).length,2);
});
