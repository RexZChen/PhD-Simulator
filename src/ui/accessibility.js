import { t } from '../i18n/index.js';
import { esc, btn } from './helpers.js';

export function accessibilityDialog(settings) {
  const option = (id, label, detail, checked) => `<label class="comfort-option"><input type="checkbox" data-comfort="${id}" ${checked ? 'checked' : ''}><span><b>${esc(t(label))}</b><span>${esc(t(detail))}</span></span></label>`;
  return `<div class="modal"><section class="dialog narrow" role="dialog" aria-modal="true" aria-labelledby="comfort-title"><div class="titlebar"><span id="comfort-title">${t('Reading & comfort')}</span></div><div class="body">
    <p>${t('Adjust how the game feels. You can change these at any time.')}</p>
    ${option('quiet', 'Reduce visual effects', 'Keep the desktop steady, without mood tinting, decorative motion or automatic notification popups. Updates stay in their apps.', settings.quiet)}
    ${option('sound', 'Sound', 'Play interface sounds and notifications.', settings.sound)}
    ${option('untimedChoices', 'Untimed conversation choices', 'Read advisor conversation choices without a countdown.', settings.untimedChoices)}
    ${option('selfPaced', 'Self-paced activities', 'Replace reflex timers with choices in exams, talks, reading, lectures and debugging. Choices still have consequences. Applies when the next activity starts.', settings.selfPaced)}
    <div class="row"><b>${t('Text size')}</b>${btn(t('Smaller'), 'text-size', { id: 'down', disabled: (settings.textSize ?? 1) <= 0 })}${btn(t('Bigger'), 'text-size', { id: 'up', disabled: (settings.textSize ?? 1) >= 4 })}</div>
    <p class="small muted">${t('Selecting a plan does not advance time. Continue commits it. Expand details only when you want them.')}</p>
  </div><div class="buttons">${btn(t('Close'), 'close-dialog')}</div></section></div>`;
}
