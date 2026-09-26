// One answer to “what can I say now?” for the menu, draft, and action dispatcher.
// Reading the menu never consumes randomness or advances the conversation.
import { channelActions, socialStories } from '../data/social.js';
import { isTeachingTerm } from '../data/calendar.js';
import { absWeek, activeProject, editable } from './state.js';
import { t } from '../i18n/index.js';

export function cohortStage(s) {
  if (s.milestones.defense === 'pass') return 'deposit';
  if (s.milestones.proposal === 'pass') return 'thesis';
  if (['pass', 'conditional'].includes(s.milestones.prelim)) return 'proposal';
  return 'prelim';
}

export function socialOptions(s, channel) {
  const stage = cohortStage(s);
  const p = activeProject(s);
  return (channelActions[channel] || []).flatMap(base => {
    if (base.id === 'study' && stage === 'deposit') return [];
    if (base.id === 'ask_lab' && !(p && editable(p) && p.submissionHistory?.some(h => /reject/i.test(h.outcome)))) return [];
    if (base.conditions?.minMonth > s.month) return [];
    const story = socialStories[base.id]?.[stage] || socialStories[base.id]?.any;
    const key = `${channel}:${base.id}:${socialStories[base.id]?.[stage] ? stage : 'any'}`;
    const count = s.socialVisits?.[key] || 0;
    // Stable first variant across reloads; different seeds start at different points.
    const offset = [...key].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, s.seed);
    const exchange = story?.exchanges?.[(offset + count) % story.exchanges.length];
    const a = { ...base, ...story, ...(exchange ? { draft: exchange[0], reply: () => exchange[1] } : {}), storyKey: key };
    const remaining = Math.max(0, (s.askCooldowns[`soc:${a.id}`] || 0) - absWeek(s));
    const why = remaining ? t('said recently ({n} wk)', { n: remaining })
      : a.conditions?.season === 'teaching' && !isTeachingTerm(s.month) ? t('not this term')
      : s.player.stats.energy < (a.cost?.energy || 0) ? t('Not enough Energy.') : '';
    return [{ ...a, disabled: !!why, why }];
  });
}

export const socialAction = (s, channel, id) => socialOptions(s, channel).find(a => a.id === id) || null;
