import { esc, btn, tag } from '../helpers.js';
import { icon } from '../icons.js';
import { avatar } from '../avatars.js';
import { asks } from '../../data/asks.js';
import { channelActions } from '../../data/social.js';
import { requestById } from '../../data/requests.js';
import { absWeek, lastName, firstName, fill, entryDate, chatBody, requestText } from '../../engine/state.js';
import { MODES } from '../../engine/advisor.js';
import { composedText, isStreaming } from '../compose.js';
import { t } from '../../i18n/index.js';

const presenceOf = s => ['checkedOut', 'traveling'].includes(s.advisorMode?.id) ? 'off'
  : s.advisorMode?.id === 'grant' ? 'away' : s.advisorMode?.id === 'pressed' ? 'typing' : '';

// What the player can say right now, in this channel.
export function chatOptions(s, channel) {
  const now = absWeek(s);
  if (channel === 'advisor') {
    const open = s.requests.filter(r => r.status === 'open').flatMap(r => {
      const tpl = requestById[r.templateId];
      return [
        { group: t('About their request'), id: `req:do:${r.id}`, label: t('Do it (−{n} Energy)', { n: tpl.cost.energy }), sub: esc(requestText(s, r).slice(0, 54)), disabled: false },
        { group: t('About their request'), id: `req:push:${r.id}`, label: t('Push back'), sub: t('Confidence and trust vs. their toxicity'), disabled: !!r.pushed },
        { group: t('About their request'), id: `req:decline:${r.id}`, label: t('Decline'), sub: t('Costs goodwill. Buys the week back.'), disabled: false },
      ];
    });
    const list = asks.map(a => {
      const cd = (s.askCooldowns[a.id] || 0) - now;
      const blocked = a.conditions?.maxEnergy !== undefined && s.player.stats.energy > a.conditions.maxEnergy;
      return { group: t('Ask your advisor'), id: `ask:${a.id}`, label: t(a.name), sub: a.desc, disabled: cd > 0 || blocked, why: cd > 0 ? t('asked recently ({n} wk)', { n: cd }) : blocked ? t('only when Energy is low') : '' };
    });
    return [...open, ...list];
  }
  return (channelActions[channel] || []).map(a => {
    const cd = (s.askCooldowns[`soc:${a.id}`] || 0) - now;
    const seasonBad = a.conditions?.season === 'teaching' && ![9, 10, 11, 1, 2, 3, 4].includes(((s.month + 8) % 12) + 1);
    const early = a.conditions?.minMonth !== undefined && s.month < a.conditions.minMonth;
    return { group: t('Say something'), id: `soc:${a.id}`, label: t(a.label), sub: '', disabled: cd > 0 || seasonBad || early, why: cd > 0 ? t('said recently ({n} wk)', { n: cd }) : early ? t('not yet') : seasonBad ? t('not this term') : '' };
  });
}

export function chatDraft(s, channel, optionId) {
  const [kind, a, b] = optionId.split(':');
  if (kind === 'ask') { const spec = asks.find(x => x.id === a); return spec ? fill(s, t(spec.draft || spec.name)) : ''; }
  if (kind === 'soc') { const spec = (channelActions[channel] || []).find(x => x.id === a); return spec ? fill(s, t(spec.draft)) : ''; }
  if (kind === 'req') {
    const r = s.requests.find(x => x.id === b);
    if (!r) return '';
    return fill(s, {
      do: t('On it — I will have this back to you shortly.'),
      push: t('Could this wait until after the deadline? I am at capacity this week.'),
      decline: t('I am going to say no to this one — I need the time for the draft.'),
    }[a] || '');
  }
  return '';
}

function composer(s, ui, channel) {
  const options = chatOptions(s, channel);
  const open = !!ui.chatMenu;
  const chosen = ui.compose && ui.compose.kind === 'chat' ? ui.compose.optionId : null;
  const ready = !!(ui.compose && ui.compose.kind === 'chat' && ui.compose.done);
  const locked = s.stage !== 'plan';
  const groups = [];
  for (const o of options) { const g = groups.find(x => x.name === o.group); if (g) g.items.push(o); else groups.push({ name: o.group, items: [o] }); }
  const placeholder = channel === 'advisor'
    ? t('Message Prof. {name}', { name: lastName(s.advisor.name) })
    : t('Message #{channel}', { channel });
  return `<div class="slack-composer ${open ? 'menu-open' : ''}">
    ${open ? `<div class="say-menu">
      <div class="say-menu-head"><b>${t('What do you want to say?')}</b><span class="muted tiny">${t('Pick a line. It gets typed for you.')}</span>${btn('×', 'chat-menu-close', { cls: 'small link' })}</div>
      <div class="say-menu-body">${groups.map(g => `<div class="say-group"><div class="say-group-name">${esc(g.name)}</div>${g.items.map(o => `<button class="say-item" data-action="chat-option" data-id="${esc(o.id)}" ${o.disabled || locked ? 'disabled' : ''} title="${esc(o.why || o.sub || '')}"><b>${esc(o.label)}</b>${o.sub ? `<small>${o.sub}</small>` : ''}${o.why ? `<em>${esc(o.why)}</em>` : ''}</button>`).join('')}</div>`).join('') || `<p class="muted small" style="padding:8px">${t('Nothing to say here right now.')}</p>`}</div>
    </div>` : ''}
    <div class="composer-box">
      <div class="composer-tools">${['B', 'I', 'S'].map(x => `<span class="ctool">${x}</span>`).join('')}<span class="ctool">🔗</span><span class="ctool">≡</span></div>
      <div class="composer-input ${chosen ? '' : 'empty'}" data-compose-scroll data-action="${chosen ? 'compose-skip' : 'chat-menu'}" title="${esc(chosen ? t('Click to skip the typing.') : placeholder)}"><div class="compose-text ${isStreaming() ? 'streaming' : ''}" data-compose-text>${esc(chosen ? composedText() : '')}</div>${chosen ? '' : `<span class="composer-placeholder">${esc(placeholder)}</span>`}</div>
      <div class="composer-foot">
        <button class="cbtn" data-action="chat-menu" ${locked ? 'disabled' : ''} title="${esc(t('Choose what to say'))}">＋</button>
        <span class="muted tiny">${locked ? t('You can talk when you are planning a turn.') : ready ? t('Enter to send') : chosen ? t('Typing…') : t('Click the box to choose a line')}</span>
        <button class="cbtn send ${ready ? 'on' : ''}" data-action="chat-send" ${ready && !locked ? '' : 'disabled'} data-default="1" title="${esc(t('Send'))}">${icon('send', 15)}</button>
      </div>
    </div>
  </div>`;
}

export function chatApp(s, ui) {
  const channel = ui.chatChannel || 'advisor';
  const msgs = s.chatMessages.filter(m => m.channel === channel);
  const unread = ch => s.chatMessages.filter(m => m.channel === ch && !m.read && !m.mine).length;
  const mode = MODES[s.advisorMode?.id || 'normal'];
  const now = absWeek(s);

  const railItem = (id, label, ic, extra = '') => {
    const n = unread(id);
    return `<button class="sl-item ${channel === id ? 'active' : ''} ${n ? 'bold' : ''}" data-action="chat-channel" data-id="${id}"><span class="sl-ic">${ic}</span><span class="sl-label">${esc(label)}</span>${extra}${n ? `<b class="sl-badge">${n}</b>` : ''}</button>`;
  };

  const rail = `<div class="slack-rail">
    <div class="sl-work"><b>${esc(s.program.name)}</b><small>${esc(t('{n} members', { n: s.labmates.length + s.peers.length + 2 }))}</small></div>
    <div class="sl-section">${t('Channels')}</div>
    ${railItem('general', 'general', '#')}
    ${railItem('cohort', 'cohort', '#')}
    <div class="sl-section">${t('Direct messages')}</div>
    ${railItem('advisor', t('Prof. {name}', { name: lastName(s.advisor.name) }), `<i class="dot ${presenceOf(s)}"></i>`)}
    <div class="sl-people">${s.labmates.map(l => `<div class="sl-person"><i class="dot ${l.role === 'phantom' ? 'off' : ''}"></i>${esc(firstName(l.name))}<span class="muted"> · ${esc(t(l.role))}</span></div>`).join('')}</div>
  </div>`;

  const head = channel === 'advisor'
    ? `<div><b>${t('Prof. {name}', { name: s.advisor.name })}</b><span class="ch-topic">${esc(t(mode.presence))} · ${esc(t(mode.label))} · ${t('1:1s {cadence}', { cadence: t(s.cadence.oneOnOne) })}</span></div>`
    : channel === 'general'
      ? `<div><b># general</b><span class="ch-topic">${t('The lab. {names} and you.', { names: s.labmates.map(l => firstName(l.name)).join(', ') })}</span></div>`
      : `<div><b># cohort</b><span class="ch-topic">${t('Other labs, same problems. {names}.', { names: s.peers.map(p => firstName(p.name)).join(', ') })}</span></div>`;

  let lastDate = null, lastSender = null;
  const rows = msgs.map(m => {
    const req = m.request ? s.requests.find(r => r.id === m.request) : null;
    const tpl = req ? requestById[req.templateId] : null;
    const md = entryDate(m);
    const divider = md !== lastDate ? `<div class="day-divider"><span>${esc(md)}</span></div>` : '';
    const grouped = md === lastDate && m.sender === lastSender;
    lastDate = md; lastSender = m.sender;
    const who = m.mine ? t('You') : m.sender;
    const actions = req ? `<div class="msg-actions">${req.status === 'open'
      ? `${tag(t('due in {n} wk', { n: Math.max(0, req.dueWeek - now) }), req.dueWeek - now <= 0 ? 'bad' : 'warn')}${btn(t('Do it (−{n})', { n: tpl.cost.energy }), 'req-do', { id: req.id, cls: 'small', disabled: s.stage !== 'plan' })}${btn(t('Push back'), 'req-push', { id: req.id, cls: 'small', disabled: s.stage !== 'plan' || req.pushed })}${btn(t('Decline'), 'req-decline', { id: req.id, cls: 'small', disabled: s.stage !== 'plan' })}`
      : tag(t(req.status), req.status === 'done' ? 'ok' : req.status === 'expired' ? 'bad' : '')}</div>` : '';
    return `${divider}<div class="sl-msg ${grouped ? 'grouped' : ''} ${m.mine ? 'mine' : ''}">
      <span class="sl-av">${grouped ? `<span class="sl-time-hover">${m.time}</span>` : avatar(m.mine ? s.player.name : (m.sender === s.advisor.name ? s.advisor.id : m.sender), 34, { bg: m.mine ? '#cfe0ee' : undefined })}</span>
      <div class="sl-body">${grouped ? '' : `<div class="sl-who"><b>${esc(who)}</b><small>${m.time}</small></div>`}<p>${esc(chatBody(s, m))}</p>${actions}</div>
    </div>`;
  }).join('') || `<div class="sl-empty muted">${t('No messages yet.')}</div>`;

  return `<div class="slack">${rail}
    <div class="slack-main">
      <div class="slack-head">${head}</div>
      <div class="chat-log slack-log">${rows}</div>
      ${composer(s, ui, channel)}
    </div>
  </div>`;
}
