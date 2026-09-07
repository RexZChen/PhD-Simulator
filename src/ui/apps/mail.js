import { esc, btn, tag, voiced } from '../helpers.js';
import { icon } from '../icons.js';
import { avatar } from '../avatars.js';
import { repliesFor } from '../../data/replies.js';
import { fill, entryDate, mailSubject, mailBody, mailSender } from '../../engine/state.js';
import { composedText, isStreaming } from '../compose.js';
import { t } from '../../i18n/index.js';

const FOLDERS = () => [
  ['inbox', t('Inbox'), 'folder'],
  ['sent', t('Sent Items'), 'send'],
  ['junk', t('Junk Email'), 'trash'],
];

function ribbon(s, m, ui) {
  const set = m && !m.mine ? repliesFor(m) : null;
  const canReply = !!set && !m.replied && s.stage === 'plan';
  return `<div class="ribbon">
    <button class="rib" data-action="mail-reply" data-id="${m ? m.id : ''}" ${canReply ? '' : 'disabled'} title="${esc(set ? t('Write a reply') : t('This message does not need an answer.'))}">${icon('send', 20)}<span>${t('Reply')}</span></button>
    <button class="rib" disabled title="${esc(t('Not in this build.'))}">${icon('people', 20)}<span>${t('Reply All')}</span></button>
    <button class="rib" disabled title="${esc(t('Not in this build.'))}">${icon('arrow', 20)}<span>${t('Forward')}</span></button>
    <span class="rib-sep"></span>
    <button class="rib" data-action="mail-archive" data-id="${m ? m.id : ''}" ${m && !m.mine ? '' : 'disabled'} title="${esc(t('Mark as read and move on.'))}">${icon('check', 20)}<span>${t('Archive')}</span></button>
    <span class="rib-right">${m && m.action ? btn(`${icon('browser', 14)} ${t('Open related app')}`, 'open', { app: m.action, cls: 'small' }) : ''}</span>
  </div>`;
}

function composer(s, ui, m) {
  const set = repliesFor(m);
  if (!set) return '';
  const chosen = ui.compose && ui.compose.optionId ? set.options.find(o => o.id === ui.compose.optionId) : null;
  const ready = !!(ui.compose && ui.compose.done);
  return `<div class="compose-pane">
    <div class="compose-head"><b>${t('Reply')}</b><span class="muted small">${esc(t(set.hint))}</span>${btn('×', 'mail-discard', { cls: 'small link', title: t('Discard') })}</div>
    <div class="compose-fields">
      <div><span class="cf-label">${t('To')}</span><span class="cf-value">${esc(mailSender(s, m))}</span></div>
      <div><span class="cf-label">${t('Subject')}</span><span class="cf-value">${t('Re:')} ${esc(mailSubject(s, m))}</span></div>
    </div>
    <div class="compose-body sunken" data-compose-scroll data-action="compose-skip" title="${esc(t('Click to skip the typing.'))}"><div class="compose-text ${isStreaming() ? 'streaming' : ''}" data-compose-text>${esc(chosen ? composedText() : '')}</div>${chosen ? '' : `<span class="compose-placeholder">${t('Choose what to say. It will be typed for you.')}</span>`}</div>
    <div class="compose-options">${set.options.map((o, i) => `<button class="btn choice compose-opt ${ui.compose && ui.compose.optionId === o.id ? 'selected' : ''}" data-action="mail-option" data-id="${o.id}" data-mail="${m.id}" data-hotkey="${i + 1}" ${s.stage === 'plan' ? '' : 'disabled'}><span><kbd>${i + 1}</kbd></span><span><b>${esc(t(o.label))}</b></span><span class="arrow">→</span></button>`).join('')}</div>
    <div class="compose-actions">${btn(`${icon('send', 14)} ${t('Send')}`, 'mail-send', { cls: 'primary', disabled: !ready || s.stage !== 'plan', attrs: 'data-default="1"' })}${btn(t('Discard'), 'mail-discard')}<span class="muted tiny">${ready ? t('Ready to send.') : chosen ? t('Typing…') : t('Nothing written yet.')}</span></div>
  </div>`;
}

export function mailApp(s, ui) {
  const folder = ui.mailFolder || 'inbox';
  const list = s.inbox.filter(m => (m.folder || 'inbox') === folder);
  const m = s.inbox.find(x => x.id === ui.selectedMail && (x.folder || 'inbox') === folder) || list[0] || null;
  const unread = f => s.inbox.filter(x => (x.folder || 'inbox') === f && !x.read).length;
  const composing = !!(m && ui.compose && ui.compose.mailId === m.id);
  const set = m && !m.mine ? repliesFor(m) : null;

  const folders = FOLDERS().map(([id, label, ic]) => {
    const n = unread(id);
    return `<button class="mf ${folder === id ? 'active' : ''}" data-action="mail-folder" data-id="${id}">${icon(ic, 14)}<span>${label}</span>${n ? `<b class="mf-count">${n}</b>` : ''}</button>`;
  }).join('');

  const rows = list.map(x => `<button class="mail-row ${x.read ? '' : 'unread'} ${m && m.id === x.id ? 'selected' : ''}" data-action="read-mail" data-id="${x.id}">
    <span class="mr-bar"></span>
    <span class="mr-from">${esc(x.mine ? `${t('To')}: ${mailSender(s, x)}` : mailSender(s, x))}</span>
    <span class="mr-date">${esc(entryDate(x))}</span>
    <span class="mr-subject">${esc(mailSubject(s, x))}</span>
    <span class="mr-preview">${esc(mailBody(s, x).replace(/\s+/g, ' ').slice(0, 68))}${mailBody(s, x).length > 68 ? '…' : ''}</span>
    ${x.replied ? `<span class="mr-flag" title="${esc(t('Answered'))}">${icon('send', 12)}</span>` : repliesFor(x) && !x.mine ? `<span class="mr-flag needs" title="${esc(t('Can be answered'))}">●</span>` : ''}
  </button>`).join('') || `<div class="mail-empty muted">${t('Nothing here. Enjoy it.')}</div>`;

  const reading = m ? `
    <div class="read-head">
      <h2>${esc(mailSubject(s, m))}</h2>
      <div class="read-meta">${avatar(m.sender, 34)}<div><b>${esc(mailSender(s, m))}</b><div class="muted small">${m.mine ? `${t('From')}: ${t('you')}` : `${t('To')}: ${t('you')}`}</div></div><span class="read-date muted small">${esc(entryDate(m))}</span></div>
    </div>
    <div class="read-body">${voiced(mailBody(s, m))}</div>
    ${m.replied && set ? `<div class="note">${t('You answered this: “{label}”', { label: t((set.options.find(o => o.id === m.replied) || {}).label || '') })}</div>` : ''}
    ${composing ? composer(s, ui, m) : set && !m.replied ? `<div class="reply-prompt">${btn(`${icon('send', 14)} ${t('Reply')}`, 'mail-reply', { id: m.id, cls: 'primary', disabled: s.stage !== 'plan' })}<span class="muted small">${esc(t(set.hint))}</span></div>` : ''}
  ` : `<div class="mail-empty muted">${icon('mail', 40)}<p>${t('Select a message.')}</p></div>`;

  return `<div class="outlook">
    ${ribbon(s, m, ui)}
    <div class="outlook-body">
      <div class="mail-folders">${folders}<div class="mf-stat tiny muted">${t('{n} messages · {u} unread', { n: s.inbox.length, u: s.inbox.filter(x => !x.read).length })}</div>${s.inbox.some(x => !x.read) ? btn(t('Mark all read'), 'read-all-mail', { cls: 'small' }) : ''}</div>
      <div class="mail-list sunken">${rows}</div>
      <div class="mail-read sunken">${reading}</div>
    </div>
  </div>`;
}

// Text that gets streamed into the compose box for a given mail + option.
export function draftFor(s, mailId, optionId) {
  const m = s.inbox.find(x => x.id === mailId);
  const set = m && repliesFor(m);
  const o = set && set.options.find(x => x.id === optionId);
  return o ? fill(s, t(o.draft)) : '';
}
