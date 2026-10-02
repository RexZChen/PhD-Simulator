// The patent, as a clock rather than an event.
//
// Stages run on months, not on choices: meetings → filed → (a year) → office action, which is a
// rejection → (months of argument) → granted or abandoned. The player answers at each gate and then
// waits, which is the honest shape of it, and means the thing shows up on the Scholar profile
// roughly a year after they stopped thinking about it.
import { PATENT, patentFiled, patentGranted, patentAbandoned, patentMeetings, officeAction } from '../data/patent.js';
import { t } from '../i18n/index.js';
import { random, roll, clamp, pick } from './probability.js';
import { effects, log, message, award, activeProject, lastName, firstName } from './state.js';

export const ensurePatent = s => s.patent || null;
export const patentStage = s => s.patent?.stage || null;
export const patentPending = s => !!s.patent && !['granted', 'abandoned'].includes(s.patent.stage);
const identity = person => person ? { id: person.id, name: person.name } : null;
export const validPatentProvenance = p => p == null || (typeof p === 'object' && !Array.isArray(p)
  && (p.inventor == null || (typeof p.inventor === 'object'
    && typeof p.inventor.id === 'string' && typeof p.inventor.name === 'string')));

function recordedInventor(s) {
  const pt = s.patent;
  if (!pt) return null;
  if (pt.inventor !== undefined) return pt.inventor;
  const disclosures = (s.history || []).filter(h => h.month === pt.startedMonth
    && h.i18n?.ev === 'spin_disclosure' && ['file', 'read'].includes(h.i18n.ch)
    && typeof h.i18n.b?.project === 'string' && h.i18n.b.project.length > 0
    && typeof pt.title === 'string' && pt.title.toLowerCase().includes(h.i18n.b.project.toLowerCase()));
  if (disclosures.length !== 1) return null;
  const b = disclosures[0].i18n.b;
  const surname = b.advisor?.r?.s === 'Prof. {name}' ? b.advisor.r.v?.name : null;
  const people = [...new Map([s.advisor, ...(s.advisors || []), ...(s.formerAdvisors || [])]
    .filter(p => p?.id && p?.name).map(p => [p.id, p])).values()];
  const matches = people.filter(p => b.advisor === p.name
    || (surname && lastName(p.name) === surname && firstName(p.name) === b.advisorFirst));
  return matches.length === 1 ? identity(matches[0]) : null;
}

export function normalizePatent(s) {
  if (s.patent && s.patent.inventor === undefined) s.patent.inventor = recordedInventor(s);
}

// Starts when the disclosure is filed. `quality` carries how well the meetings went into the odds.
export function openPatent(s, projectId) {
  if (s.patent) return s.patent;
  const p = s.projects.find(x => x.id === projectId) || activeProject(s);
  s.patent = {
    stage: 'meetings', meeting: 0, quality: 0,
    inventor: identity(s.advisor), project: p ? { id: p.id, title: p.title } : null, school: identity(s.program),
    title: p ? t('Method and system for {t}', { t: (p.title || '').toLowerCase() }) : t('Method and system'),
    startedMonth: s.month, filedMonth: null, actionMonth: null, decidedMonth: null,
    outcome: null, share: { advisor: PATENT.advisorShare, you: 100 - PATENT.advisorShare },
  };
  message(s, t('Innovation Office'), t('Invention disclosure received'),
    t('Thank you for your disclosure. Before we can proceed to a filing we will need to schedule a few short conversations to understand the invention. Please use the attached scheduling link, which does not work in this browser.'), 'portal', 'inbox', null);
  return s.patent;
}

// The next meeting the office wants, or null if the meetings are done.
export const nextPatentMeeting = s => (s.patent && s.patent.stage === 'meetings' ? patentMeetings[s.patent.meeting] || null : null);

export function doPatentMeeting(s, choiceId) {
  const pt = s.patent;
  const m = nextPatentMeeting(s);
  if (!pt || !m) throw new Error(t('There is no meeting scheduled.'));
  const opt = m.choices.find(c => c.id === choiceId);
  if (!opt) throw new Error(t('That is not one of the options.'));
  if (s.player.stats.energy < -(opt.effects.energy || 0)) throw new Error(t('Not enough Energy.'));
  effects(s, opt.effects);
  pt.quality += opt.gain;
  pt.meeting++;
  log(s, t(opt.result));
  if (pt.meeting >= PATENT.meetings) {
    pt.stage = 'drafting';
    pt.filedMonth = s.month + PATENT.fileAfter;
    log(s, t('The innovation office has what it needs. A filing takes about a year, during which nobody will contact you about it.'));
  }
  return pt;
}

// The office action gate: answered once, then months of silence again.
export function answerOfficeAction(s, choiceId) {
  const pt = s.patent;
  if (!pt || pt.stage !== 'action') throw new Error(t('There is nothing to respond to.'));
  const opt = officeAction.choices.find(c => c.id === choiceId);
  if (!opt) throw new Error(t('That is not one of the options.'));
  if (s.player.stats.energy < -(opt.effects.energy || 0)) throw new Error(t('Not enough Energy.'));
  effects(s, opt.effects);
  // Quality of the original claim drafting carries all the way to here, which is the point of it.
  const odds = clamp(opt.odds + pt.quality * .07, .08, .9);
  const won = roll(s, odds);
  pt.responded = choiceId;
  pt.wonAction = won;
  pt.stage = 'responded';
  pt.decidedMonth = s.month + PATENT.grantAfter;
  log(s, t(won ? opt.good : opt.bad));
  return pt;
}

// Monthly tick. This is where the waiting actually happens.
export function patentMonth(s) {
  const pt = s.patent;
  if (!pt) return;
  if (pt.stage === 'drafting' && s.month >= pt.filedMonth) {
    pt.stage = 'filed';
    pt.actionMonth = s.month + PATENT.actionAfter;
    log(s, t(pick(s, patentFiled)));
    message(s, t('Innovation Office'), t('Application filed'),
      t('Your application has been filed and will publish in due course. It will appear on indexing services automatically. No action is required from you at this time, and none will be for some months.'), 'portal', 'inbox', null);
    award(s, 'namedinventor');
  }
  if (pt.stage === 'filed' && s.month >= pt.actionMonth) {
    pt.stage = 'action';
    message(s, t('Innovation Office'), t('Non-final rejection — action required'),
      t('The examiner has issued a non-final rejection of all claims. This is a normal step and not a reflection of the merit of the invention. Our outside counsel will prepare a response; your input on the technical distinctions would be valuable. Please respond within sixty days.'), 'portal', 'inbox', null);
    log(s, t('An office action. Forty-one pages, and it rejects every claim, and this is completely normal, and nobody tells first-time inventors that.'));
  }
  if (pt.stage === 'responded' && s.month >= pt.decidedMonth) {
    if (pt.wonAction) {
      pt.stage = 'granted'; pt.outcome = 'granted';
      effects(s, { academicCapital: 8, career: 6, hope: 8 });
      log(s, t(pick(s, patentGranted)));
      award(s, 'patentgranted');
    } else {
      pt.stage = 'abandoned'; pt.outcome = 'abandoned';
      effects(s, { hope: -5, career: 2 });
      log(s, t(pick(s, patentAbandoned)));
    }
  }
}

// What Google Scholar shows. A pending application is indexed like a paper, which is accurate and
// is one of the stranger facts about how the record works.
export function patentEntry(s) {
  const pt = s.patent;
  if (!pt || !pt.filedMonth || s.month < pt.filedMonth) return null;
  const inventor = recordedInventor(s);
  const year = 2028 + Math.floor((pt.filedMonth + 8) / 12);
  return {
    title: pt.title,
    venue: pt.stage === 'granted' ? t('US Patent — granted') : pt.stage === 'abandoned' ? t('US Patent Application — abandoned') : t('US Patent Application — pending'),
    year, patent: true,
    inventors: inventor ? t('{advisor} and you, in that order', { advisor: t('Prof. {n}', { n: lastName(inventor.name) }) })
      : t('Inventor names are unavailable in this record.'),
    n: pt.stage === 'granted' ? 1 + Math.floor(random(s) * 3) : 0,
  };
}
