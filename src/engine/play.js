// The everyday loop. An intention resolves to an available activity; the player does not
// have to remember which version of “work” belongs to a month, a deadline week, or a day.
import { activeProject, editable } from './state.js';
import { focusOptions, milestoneOf } from './time.js';
import { canStartMain } from './paper.js';
import { t } from '../i18n/index.js';

export function workProject(s) {
  const current = activeProject(s);
  const workable = p => editable(p) && p.status !== 'Rejected';
  return workable(current) ? current : s.projects.find(workable);
}

export function turnChoices(s) {
  const available = focusOptions(s).filter(f => !f.disabled);
  const find = (...ids) => ids.map(id => available.find(f => f.id === id)).find(Boolean);
  const p = workProject(s);
  const milestone = milestoneOf(s);
  const nearExam = milestone && milestone.month - s.month <= 6;
  const writing = p && p.status !== 'Ready' && p.progress >= 40 && p.draft < (p.kind === 'thesis' ? 90 : 60);
  const recovery = find('rest', 'sleep', 'off') || available.find(f => f.effects?.energy > 0);
  const prep = nearExam ? find('coursework', 'reading', 'practice', 'slides', 'committee')
    : s.coursework < 65 ? find('coursework', 'reading', 'practice', 'career', 'network')
      : find('career', 'network', 'practice', 'reading', 'coursework');
  let work = writing ? find('write', 'writing', 'deep') : find('research', 'experiments', 'deep');
  if (!p && !canStartMain(s)) work = null;
  // Exam weeks and internships replace the ordinary activities, but not the interaction.
  if (!work && s.crunch?.kind) work = find('practice', 'reading');
  if (available.length === 1) work = available[0];
  const choices = [];
  if (work) choices.push({ id: 'work', focus: work.id, projectId: p?.id,
    name: s.crunch?.kind ? t('Prepare for the room') : available.length === 1 ? t(work.name)
      : writing ? t('Write the paper') : p?.kind === 'thesis' ? t('Work on the dissertation') : t('Move the research forward'),
    detail: s.crunch?.kind ? t('Practice before the committee gets its turn.') : available.length === 1 ? t(work.desc)
      : p ? t('Working on “{title}”.', { title: p.title })
        : t('Move the active project forward. Ask better questions.'), icon: work.icon });
  if (prep && prep.id !== work?.id) choices.push({ id: 'prepare', focus: prep.id,
    name: ['coursework', 'reading', 'practice', 'slides', 'committee'].includes(prep.id) ? t('Get ready for the next milestone') : t('Build a life after the PhD'),
    detail: t(prep.desc), icon: prep.icon });
  // Waiting for a reader must not spend another month writing a locked manuscript.
  if (!work && choices.length < 2) {
    const other = find('network', 'career', 'life', 'feedback', 'committee');
    if (other && !choices.some(c => c.focus === other.id)) choices.push({ id: 'connect', focus: other.id,
      name: t('Make time for people'), detail: t(other.desc), icon: other.icon });
  }
  if (recovery && !choices.some(c => c.focus === recovery.id)) choices.push({ id: 'recover', focus: recovery.id,
    name: t('Go home. Be a person.'), detail: t('Recover some energy. The advisor may have opinions. The body already does.'), icon: 'moon' });
  return choices;
}

export function suggestedTurn(s) {
  const choices = turnChoices(s);
  if (s.player.stats.energy < 35 || s.player.stats.health < 45) return choices.find(c => c.id === 'recover') || choices[0];
  const ms = milestoneOf(s);
  if (ms && ms.month - s.month <= 6 && (s.coursework < 65 || s.readiness < 60))
    return choices.find(c => c.id === 'prepare') || choices[0];
  return choices[0];
}

// Keep the receipt with the run so saving in the middle of a scene does not lose the
// result. The baseline precedes writing and summons; completion waits for the scenes.
export function startTurnReceipt(s) {
  if (s.pendingReceipt) return;
  const focus = focusOptions(s).find(f => f.id === s.focus);
  if (!focus || focus.disabled) return;
  s.pendingReceipt = {
    sequence: (s.turnReceipt?.sequence || 0) + 1,
    month: s.month, week: s.week, day: s.dayIndex || 0, tempo: s.tempo,
    focus: focus.name, i18nFocus: focus.i18nName,
    before: {
      energy: s.player.stats.energy, hope: s.player.stats.hope, health: s.player.stats.health,
      coursework: s.coursework, readiness: s.readiness, career: s.career,
      projects: Object.fromEntries(s.projects.map(p => [p.id, { progress: p.progress, draft: p.draft }])),
    },
  };
}

export function finishTurnReceipt(s) {
  const pending = s.pendingReceipt;
  if (!pending?.applied || s.event || !['plan', 'report', 'milestone', 'commencement', 'ending'].includes(s.stage) && s.phase !== 'ending') return;
  const { before, applied, ...when } = pending;
  s.turnReceipt = { ...when,
    ...Object.fromEntries(['energy', 'hope', 'health'].map(k => [k, Math.round(s.player.stats[k] - before[k])])),
    ...Object.fromEntries(['coursework', 'readiness', 'career'].map(k => [k, Math.round(s[k] - before[k])])),
    projects: s.projects.map(p => ({ id: p.id, title: p.title,
      progress: Math.round(p.progress - (before.projects[p.id]?.progress || 0)),
      draft: Math.round(p.draft - (before.projects[p.id]?.draft || 0)),
    })).filter(p => p.progress || p.draft),
  };
  delete s.pendingReceipt;
}
