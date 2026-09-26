import { btn } from './helpers.js';
import { t } from '../i18n/index.js';

// Dialog isolation already marks the covered activity inert. Use that same boundary for
// its clock and controls, including comfort settings, pause, and other modal overlays.
export function activityPaused(selector) {
  const root = document.querySelector(selector);
  return document.hidden || !root || !!root.closest('[inert]');
}

export function activityControls() {
  return `<div class="activity-controls">${btn(t('Pause'), 'pause-activity', { cls: 'small' })}${btn(t('Reading & comfort'), 'accessibility', { cls: 'small link' })}</div>`;
}

export function activityPauseDialog() {
  return `<div class="modal"><section class="dialog narrow" role="dialog" aria-modal="true" aria-labelledby="activity-pause-title"><div class="titlebar"><span id="activity-pause-title">${t('Paused')}</span></div><div class="body"><h2>${t('Take a break')}</h2><p>${t('The activity is paused. The clock is stopped, and your next choice will wait.')}</p><p class="small muted">${t('Resume from here when you are ready.')}</p></div><div class="buttons">${btn(t('Reading & comfort'), 'accessibility')}${btn(t('Resume activity'), 'close-dialog', { cls: 'primary', attrs: 'data-default="1"' })}</div></section></div>`;
}
