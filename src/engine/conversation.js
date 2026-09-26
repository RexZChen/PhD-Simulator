import { t, readSource } from '../i18n/index.js';

const phase = m => !m.phase || m.phase === 'ending' ? 'playing' : m.phase;
const period = m => `${phase(m)}:${m.month || 0}`;
const minutes = time => /^\d{2}:\d{2}$/.test(time || '')
  ? Math.min(1439, Number(time.slice(0, 2)) * 60 + Number(time.slice(3))) : 480;
const clock = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const after = (candidate, previous) => Math.min(1439, Math.max(candidate, previous == null ? 0 : previous + 1));

export function nextChatTime(s, hour, minute) {
  const key = period(s);
  const previous = s.chatMessages.filter(m => period(m) === key).reduce((n, m) => Math.max(n, minutes(m.time)), -1);
  return clock(after(hour * 60 + minute, previous < 0 ? null : previous));
}

// Old clocks were independent random decorations. Keep the stored conversation order,
// repairing only backwards times; loading and rendering must never draw new randomness.
export function normalizeChatHistory(s) {
  const latest = new Map();
  for (const m of s.chatMessages || []) {
    const key = period(m);
    const minute = after(minutes(m.time), latest.get(key));
    m.time = clock(minute); latest.set(key, minute);
  }
}

export function isConversationNote(m) {
  if (m?.kind === 'conversation-note') return true;
  if (m?.mine) return false;
  // Legacy asks stored the narrator's outcome in the advisor's message bubble.
  if (/^asks\.\d+\.(?:success|failure)\.text\.\d+$/.test(m?.i18n?.p || '')) return true;
  return ['(no reply)', '(read, no reply)'].includes(readSource(m?.body, m?.i18n));
}

export function isAutomaticReply(m) {
  return m?.kind === 'automatic-reply' || readSource(m?.body, m?.i18n)?.startsWith('Auto-reply:');
}

export function advisorPresence(s) {
  const last = (s.chatMessages || []).findLast(m => !m.mine && !isConversationNote(m) && !isAutomaticReply(m)
    && (m.senderId ? m.senderId === s.advisor?.id : m.sender === s.advisor?.name));
  if (!last || phase(last) !== phase(s)) return t('No recent message recorded');
  const weeks = Math.max(0, (s.month - last.month) * 4 + s.week - (last.week || 0));
  if (!weeks) return s.tempo === 'day' && (last.dayIndex || 0) !== (s.dayIndex || 0) ? t('Last message this week') : t('Message received this turn');
  return weeks === 1 ? t('Last message 1 week ago') : t('Last message {n} weeks ago', { n: weeks });
}
