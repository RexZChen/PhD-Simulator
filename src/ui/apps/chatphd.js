import { esc, btn, tag } from '../helpers.js';
import { icon } from '../icons.js';
import { activeProject, editable } from '../../engine/state.js';
import { t } from '../../i18n/index.js';

export const chatPrompts = [
  { id: 'deadline', text: 'Help me think about this deadline.' },
  { id: 'advisor', text: 'How do I talk to my advisor?' },
  { id: 'sleep', text: 'I need a break.' },
];

export function chatphdApp(s) {
  const p = activeProject(s), plan = s.stage === 'plan', pending = s.chatphdPending;
  const tools = [
    ['title', 'paper', t('Brainstorm a title'), t('A little progress, a little hype.'), `+3 ${t('Draft')} · +6 ${t('Hype')}`],
    ['abstract', 'doc', t('Polish the abstract'), t('Saves Energy, moves the draft.'), `+8 ${t('Draft')}`],
    ['concept', 'book', t('Explain a concept'), t('Builds presentation readiness.'), `+4 ${t('Readiness')}`],
    ['experiment', 'research', t('Suggest an experiment'), t('A direction to test, not a guarantee.'), `+5 ${t('Research')}`],
    ['rebuttal', 'chat', t('Draft a rebuttal'), t('Only when reviews are in. Check the citations.'), t('Respond to reviews')],
  ];
  const available = id => !!p && (id === 'rebuttal' ? p.status === 'Rebuttal' : editable(p));
  const toolCards = tools.map(([id, glyph, label, desc, effect]) => {
    const why = !plan ? t('Return to planning to use a tool.')
      : pending ? t('Decide what to do with the current suggestion first.')
        : !p ? t('Start a project first.')
          : s.actions.chatphd ? t('Used this turn. Available again next turn.')
            : !available(id) ? id === 'rebuttal' ? t('Available when reviews arrive.') : t('Available while editing a project.') : '';
    return `<button class="cph-tool" data-action="chatphd" data-id="${id}" ${why ? 'disabled' : ''} title="${esc(why || desc)}">
      ${icon(glyph, 21)}<span><b>${esc(label)}</b><small>${esc(desc)}</small><em>${esc(why || effect)}</em></span></button>`;
  }).join('');
  const messages = (s.chatphdLog || []).map(m => `<div class="msg ${m.from === 'you' ? 'mine' : ''}"><span class="av" aria-hidden="true">${m.from === 'you' ? 'Y' : '✦'}</span><div><div class="who"><b>${m.from === 'you' ? t('You') : 'ChatPHD'}</b></div><p>${esc(m.text)}</p></div></div>`).join('');
  const matches = pending && p?.id === pending.projectId && available(pending.id);
  const suggestion = pending ? `<section class="cph-suggestion" tabindex="-1" aria-label="${esc(t('Review the suggestion'))}">
    <div class="cph-eyebrow">${t('Suggestion ready')}</div><h2>${t('You are still the author.')}</h2>
    <p>${esc(pending.text)}</p><p class="small">${t('Check it for 2 Energy, use it as-is and accept the risk, or discard it. Nothing is applied until you decide.')}</p>
    ${!matches ? `<p class="cph-explanation">${t('Return to the original editable project to use this suggestion, or discard it.')}</p>` : ''}
    <div class="cph-decision">${btn(t('Check it (−2 Energy)'), 'chatphd-resolve', { id: 'check', cls: 'primary', disabled: !plan || !matches || s.player.stats.energy < 2 })}${btn(t('Use as-is'), 'chatphd-resolve', { id: 'use', disabled: !plan || !matches })}${btn(t('Discard'), 'chatphd-resolve', { id: 'discard', cls: 'link', disabled: !plan })}</div>
    ${s.player.stats.energy < 2 ? `<p class="small">${t('You need {n} Energy for that.', { n: 2 })}</p>` : ''}
  </section>` : s.chatphd ? `<section class="cph-result" tabindex="-1" role="status"><b>${t('Last tool result')}</b><p>${esc(s.chatphd)}</p>${p ? btn(t('See it in your paper'), 'browser-tab', { id: 'overgrief', cls: 'small link' }) : ''}</section>` : '';
  return `<div class="webpage chatphd">
    <header class="cph-header"><div class="cph-brand"><span class="cph-mark" aria-hidden="true">✦</span><div><h1>ChatPHD</h1><p>${t('Trained on rejected manuscripts. Occasionally correct.')}</p></div></div><span class="cph-version">v4.7 · ${t('hallucination mode: on')}</span></header>
    <nav class="cph-nav" aria-label="ChatPHD">${btn(t('Research tools'), 'chatphd-view', { id: 'tools', cls: 'small' })}${btn(t('Conversation'), 'chatphd-view', { id: 'conversation', cls: 'small' })}</nav>
    <div class="cph-context"><span>${t('Working on')}<b title="${p ? esc(p.title) : ''}">${p ? esc(p.title) : t('No active project')}</b></span>${p ? tag(t(p.status)) + btn(t('Open paper'), 'browser-tab', { id: 'overgrief', cls: 'small link' }) : btn(t('Open PhD Manager'), 'open', { app: 'dashboard', cls: 'small' })}</div>
    <div class="cph-workspace"><aside class="cph-tools" tabindex="-1" aria-label="${esc(t('Research tools'))}"><div class="cph-tools-heading"><h2>${t('Research tools')}</h2><span>${s.actions.chatphd ? t('Used this turn') : t('One suggestion per turn')}</span></div>
      <p class="small">${t('Choose a tool, then decide how to use its suggestion.')}</p><div class="cph-tool-list">${toolCards}</div>
      <p class="cph-footnote">${t('Suggestions can be wrong. Your name goes on the paper.')}</p>
    </aside><section class="cph-conversation" aria-label="${esc(t('Conversation'))}">
      ${suggestion}
      <div class="chat-log chatphd-log">${messages || `<div class="cph-welcome"><span aria-hidden="true">✦</span><h2>${t('What are we stuck on?')}</h2><p>${t('Use a research tool to work on your paper, or talk through the rest of the PhD here.')}</p></div>`}</div>
      <div class="cph-prompts" aria-label="${esc(t('Conversation starters'))}">${chatPrompts.map(x => btn(t(x.text), 'chatphd-prompt', { id: x.id, cls: 'small', disabled: !plan })).join('')}</div>
      <form id="chatphd-form" class="chatphd-input"><label for="chatphd-input" class="sr-only">${t('Message ChatPHD')}</label><input id="chatphd-input" maxlength="200" placeholder="${esc(t('Type a message… (free, harmless, mostly)'))}" autocomplete="off" ${!plan ? 'disabled' : ''}><button class="btn primary" type="submit" ${!plan ? 'disabled' : ''}>${t('Send')}</button></form>
      <p class="cph-footnote">${t('Conversation is free. Research tools change your project only after you decide.')}</p>
    </section></div></div>`;
}
