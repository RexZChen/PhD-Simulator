import { eventsA } from './events-a.js';
import { eventsB } from './events-b.js';
import { eventsC } from './events-c.js';
import { eventsD } from './events-d.js';
import { eventsE } from './events-e.js';
import { eventsF } from './events-f.js';
import { eventsG } from './events-g.js';
import { eventsH } from './events-h.js';
import { eventsI } from './events-i.js';
import { outcomes } from './events-outcomes.js';

// The outcome patch is merged per choice rather than per event, so it can fill in a missing
// `result` on a choice whose text and hint are already translated in one of the files above,
// without those files having to be rewritten to add one key.
const merged = { ...eventsA, ...eventsB, ...eventsC, ...eventsD, ...eventsE, ...eventsF, ...eventsG, ...eventsH, ...eventsI };
for (const [id, patch] of Object.entries(outcomes)) {
  const e = merged[id] = { ...(merged[id] || {}) };
  e.choices = { ...(e.choices || {}) };
  for (const [choiceId, extra] of Object.entries(patch)) {
    e.choices[choiceId] = { ...(e.choices[choiceId] || {}), ...extra };
  }
}
export const events = merged;
