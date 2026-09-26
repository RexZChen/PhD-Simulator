// The shell is replaced on every action. Keep keyboard position across that replacement,
// and keep modal navigation inside the frontmost dialog.
const controls = 'button, a[href], input, select, textarea, summary, [tabindex]';
const visible = node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length && !node.closest('[inert]');
const frontDialog = () => [...document.querySelectorAll('.modal [role="dialog"], .say-menu[role="dialog"]')].at(-1);
const signature = node => node ? JSON.stringify([node.tagName, node.id, { ...node.dataset }, node.getAttribute('name'), node.getAttribute('href')]) : null;
let frames = [];
const isolated = new Set();
// Animation state is not dialog identity. Otherwise a nested Pause/Save round trip
// forgets its opener when the room entrance completes or changes its paused class.
const dialogKey = dialog => JSON.stringify([dialog.id, dialog.getAttribute('aria-labelledby'), dialog.getAttribute('aria-label'),
  [...dialog.classList].filter(name => !['meeting-arriving', 'meeting-motion-paused'].includes(name)).join(' ')]);

function isolateDialog(dialog) {
  // Only undo attributes we supplied. A caller's pre-existing inert state is theirs.
  for (const node of isolated) node.removeAttribute('inert');
  isolated.clear();
  if (!dialog) return;
  // Walk the active branch so siblings at every level (including older modal layers)
  // disappear from both keyboard and accessibility navigation.
  for (let branch = dialog; branch && branch !== document.body; branch = branch.parentElement) {
    for (const sibling of branch.parentElement?.children || []) {
      if (sibling === branch || sibling.hasAttribute('inert')) continue;
      sibling.setAttribute('inert', '');
      isolated.add(sibling);
    }
  }
}

export function captureFocus() {
  const active = document.activeElement;
  return { key: active?.matches(controls) ? signature(active) : null, modal: !!frontDialog() };
}

export function restoreFocus(previous) {
  const dialogs = [...document.querySelectorAll('.modal [role="dialog"], .say-menu[role="dialog"]')];
  const dialog = dialogs.at(-1);
  const keys = dialogs.map(dialogKey);
  let shared = 0;
  while (shared < frames.length && shared < keys.length && frames[shared].id === keys[shared]) shared++;
  const returning = shared < frames.length && shared === keys.length;
  const key = returning ? frames[shared].opener : previous.key;
  frames = frames.slice(0, shared);
  for (let i = shared; i < keys.length; i++) frames.push({ id: keys[i], opener: i === keys.length - 1 ? previous.key : null });
  isolateDialog(dialog);
  const scope = dialog || document;
  const match = key && [...scope.querySelectorAll(controls)].find(node => visible(node) && signature(node) === key);
  if (match) match.focus({ preventScroll: true });
  else if (dialog) {
    // Read the scene first, rather than preselecting a consequential choice.
    dialog.tabIndex = -1;
    dialog.focus({ preventScroll: true });
  }

}

export function containDialogTab(event) {
  if (event.key !== 'Tab') return;
  const dialog = frontDialog();
  if (!dialog) return;
  const items = [...dialog.querySelectorAll(controls)].filter(visible);
  const index = items.indexOf(document.activeElement);
  if (!items.length) { event.preventDefault(); dialog.focus(); return; }
  if (index < 0 || (event.shiftKey ? index === 0 : index === items.length - 1)) {
    event.preventDefault();
    items[event.shiftKey ? items.length - 1 : 0].focus();
  }
}
