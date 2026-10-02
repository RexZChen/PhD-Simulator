import { createRun } from '../src/engine/state.js';
import { dispatch } from '../src/engine/game.js';
import { openTimeline } from '../src/engine/timeline.js';

export function candidate(seed = 842) {
  let s = createRun(seed, { background: 'masters', topic: 'ml' });
  const a = s.advisors[0];
  s.phase = 'admissions'; s.offers = [a.schoolId];
  s.applications = [{ schoolId: a.schoolId, poiId: a.id, status: 'admitted', funding: 'RA' }];
  s = dispatch(s, { type: 'ENROLL', id: a.id });
  s.month = 38; s.stage = 'plan'; s.event = null; s.eventQueue = []; s.scheduled = [];
  s.milestones.prelim = 'pass'; s.milestones.proposal = 'pass'; s.counts.accepted = 2; s.readiness = 80;
  Object.assign(s.advisor, { caring: 50, toxicity: 40, ambition: 50, funding: 50 });
  Object.assign(s.relationship, { trust: 50, satisfaction: 50 }); s.standing = 60;
  s = dispatch(s, { type: 'START_PROJECT' });
  Object.assign(s.projects.at(-1), { progress: 60, draft: 50, status: 'Drafting' });
  return s;
}

export function conditional(id, before = () => {}) {
  for (let seed = 1; seed <= 80; seed++) {
    const s = candidate(seed); before(s); openTimeline(s);
    if (s.grad.stance === 'conditional' && s.grad.condition === id) return s;
  }
  throw new Error(`No deterministic conditional fixture for ${id}`);
}
