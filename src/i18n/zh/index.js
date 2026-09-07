import { ui } from './ui.js';
import { events } from './events.js';
import { meetings } from './meetings.js';
import { misc } from './misc.js';
import { minigames } from './minigames.js';
// The minigame prose is its own file for size; it lives in the same flat ui dictionary.
export const zh = { ui: { ...ui, ...minigames }, events, meetings, ...misc };
