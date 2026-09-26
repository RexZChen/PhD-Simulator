import { resumeRecovery } from './recovery-helpers.js';

export async function ventureSeed(page, lang, commencement = false) {
  await page.goto('/');
  await page.evaluate(async ({ lang, commencement }) => {
    const { createRun } = await import('/src/engine/state.js');
    const { dispatch } = await import('/src/engine/game.js');
    const { resolveChoice } = await import('/src/engine/events.js');
    const { doPatentMeeting, nextPatentMeeting } = await import('/src/engine/patent.js');
    const { random } = await import('/src/engine/probability.js');
    const { saveRun, emptyMeta } = await import('/src/engine/save.js');
    const { buildCV, generateOffers } = await import('/src/engine/epilogue.js');
    let s = createRun(711, { background: 'masters', topic: 'ml', international: false });
    const a = s.advisors[0]; s.phase = 'admissions'; s.offers = [a.schoolId];
    s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
    s = dispatch(s, { type: 'ENROLL', id: a.id });
    s.stage = 'plan'; s.event = null; s.eventQueue = []; s.needsBegin = false;
    s = dispatch(s, { type: 'START_PROJECT' });
    Object.assign(s.projects[0], { title: 'Published invention', status: 'Accepted', novelty: 70, evidence: 75 });
    s.counts.accepted = 1; s.month = 40;
    const choice = (event, id) => { s.event = event; s.eventVariant = 0; s.stage = 'event'; s.eventQueue = []; resolveChoice(s, id); };
    choice('spin_disclosure', 'read'); choice('spin_advisor_idea', 'keen');
    // Complete the separate patent meetings so they do not cover the company status panel.
    while (nextPatentMeeting(s)) doPatentMeeting(s, nextPatentMeeting(s).choices[0].id);
    if (commencement) {
      choice('spin_captable', 'sign'); s.month = 52; choice('spin_decide', 'finish');
      s.thesis = { deposited: true }; s.milestones.graduated = true;
      s.jobs.apps = Array.from({ length: 5 }, () => ({ stage: 'rejected' }));
      s.cv = buildCV(s); generateOffers(s, s.cv);
      s.stage = 'commencement'; s.milestoneKind = 'graduation'; s.event = null;
    } else {
      s.event = 'spin_captable'; s.eventVariant = 0; s.stage = 'event';
      for (let n = 0; n < 1000; n++) if (random({ rng: n }) > .99) { s.rng = n; break; }
    }
    s.scheduled = []; s.eventQueue = []; s.eventReturn = 'plan';
    const meta = emptyMeta(); Object.assign(meta.settings, { lang, tips: false, quiet: true, sound: false, selfPaced: true });
    const result = saveRun(localStorage, s, meta); if (result.error) throw Error(result.error);
  }, { lang, commencement });
  await resumeRecovery(page);
}
