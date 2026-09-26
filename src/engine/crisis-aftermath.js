import { t } from '../i18n/index.js';
import { afterCrisis } from '../data/crisis.js';
import { clamp, exactly, pick, pickWeighted } from './probability.js';
import { chat, log, activeLabmates } from './state.js';

// Geography changes the channel, not whether someone cares. Availability and the
// current mode govern a reply; caring governs what that reply offers.
export function crisisAftermath(s, leaveWeeks) {
  const advisor = s.advisor, mode = s.advisorMode?.id || 'normal';
  const modeReach = { attentive: .2, normal: 0, pressed: -.1, grant: -.15, traveling: -.3, checkedOut: -.55 }[mode] || 0;
  const reachable = exactly(s, clamp(advisor.availability / 100 + modeReach, 0, 1));
  const result = { advisorId: advisor.id, response: 'unavailable', movedRequests: 0, leaveWeeks };
  if (!reachable) log(s, t(afterCrisis.advisor.unavailable, { name: advisor.name }));
  else {
    const caring = clamp(advisor.caring) / 100;
    result.response = pickWeighted(s, ['practical', 'acknowledge', 'work'], id => ({
      practical: caring * 2, acknowledge: 1, work: (1 - caring) * 2 + (mode === 'pressed' ? .5 : 0),
    })[id]);
    let line = afterCrisis.advisor[result.response];
    if (result.response === 'practical') {
      if (leaveWeeks > 0) {
        for (const request of s.requests || []) {
          if (request.status !== 'open' || request.advisorId !== advisor.id || !Number.isFinite(request.dueWeek)) continue;
          request.dueWeek += leaveWeeks;
          result.movedRequests++;
        }
        line = result.movedRequests ? line.leave : line.noRequests;
        if (result.movedRequests) log(s, t('Prof. {name} extended {count} open request deadlines by {weeks} weeks. Venue deadlines are unchanged.', {
          name: advisor.name, count: result.movedRequests, weeks: leaveWeeks,
        }));
      } else line = line.postponed;
    }
    chat(s, 'advisor', advisor.name, t(line), {
      allowedReplyIds: result.response === 'work' ? [] : ['crisis_ack'],
    });
  }
  const labmate = pick(s, activeLabmates(s));
  if (labmate) {
    result.labmateId = labmate.id;
    chat(s, 'general', labmate.name, t(pick(s, afterCrisis.lab)), {
      senderId: labmate.id, allowedReplyIds: ['crisis_ack'],
    });
  }
  log(s, t(pick(s, afterCrisis.self)));
  return result;
}
