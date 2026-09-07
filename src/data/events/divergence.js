// The escalation ladder, and the door that is always unlocked.
const c = (id, text, hint, effects = {}, extra = {}) => ({ id, text, hint, effects, ...extra });
export default [
  { id: 'first_warning', title: 'A conversation about the pace', category: 'advisor', scene: 'office', speaker: 'advisor', probability: 1, scheduledOnly: true, cooldown: 4,
    text: ['{advisor} closes the door, which they never do. “I want to have this conversation now, while it is still a conversation.”', '“I am not angry. I am going to say some things that will sound like anger.” They are not angry. It sounds like anger.'],
    choices: [
      c('plan', 'Agree a concrete plan, in writing, now', 'Management check → standing recovers', { energy: -5 }, { check: { advisor: 'management', difficulty: 45 }, successEffects: { trust: 8, satisfaction: 10, standing: 12, readiness: 4 }, failureEffects: { satisfaction: 4, stress: 5 }, successText: 'You leave with five bullet points and two dates. It is the most useful hour of the month.', failureText: 'You leave with a feeling and no dates. The feeling does not have a deadline.', personality: 'independent' }),
      c('context', 'Tell them what has actually been going on', 'Honest; depends on whether they can hear it', { energy: -3 }, { advisorResponse: true, effects2: {}, successEffects: {}, standing: 6, personality: 'boundarySetter' }),
      c('nod', 'Absorb it and say you will do better', 'Cheapest now, most expensive later', { stress: 6, satisfaction: 3, confidence: -5 }, { personality: 'peoplePleaser' }),
    ] },

  { id: 'written_warning', title: 'The letter', category: 'advisor', scene: 'portal', probability: 1, scheduledOnly: true, cooldown: 4,
    text: ['You read it four times looking for the sentence that says it is not that bad. The sentence is not there.', 'It is copied to the graduate director. That is the part that makes your ears ring.'],
    choices: [
      c('respond', 'Write a measured reply with a real plan', 'Writing check → standing recovers', { energy: -7 }, { check: { skill: 'writing', difficulty: 50 }, successEffects: { standing: 14, trust: 6, satisfaction: 8, confidence: 4 }, failureEffects: { standing: 2, stress: 6 }, successText: 'Three paragraphs, no defensiveness, two dates. They reply: “Thank you. This is what I needed.”', failureText: 'You rewrite it eleven times. The version you send is the eighth, and it is the defensive one.', personality: 'perfectionist' }),
      c('director', 'Take it to the graduate director yourself', 'Networking check → an ally, or a file', { energy: -6, stress: 4 }, { check: { skill: 'networking', difficulty: 55 }, successEffects: { standing: 10, academicCapital: 3, hope: 6 }, failureEffects: { standing: -4, conflict: 8 }, successText: 'The director has seen forty of these. They ask two questions nobody else asked and make one phone call.', failureText: '“I’d encourage you to work this out with your advisor directly.” The door was never open.', personality: 'networker' }),
      c('quiet', 'Say nothing and try to out-work it', 'Grinder. Sometimes it works.', { energy: -10, stress: 10, progress: 6, draft: 4 },
        { personality: 'grinder',
          draft: { to: 'To: {advisor}', subject: 'Re: Academic progress — response', body: 'Dear {advisor},\n\nI have read the letter. I want to respond to the second paragraph, because I do not think it is accurate, and because if it stays on the file unanswered then it is the record.\n\nIn the twelve months it covers I' } }),
    ] },

  { id: 'probation_talk', title: 'Four months', category: 'advisor', scene: 'office', speaker: 'advisor', probability: 1, scheduledOnly: true, cooldown: 6,
    text: ['“I want you to hear this from me and not from the letter. I think you can do this. The plan exists so that the department can see you doing it.”', 'The terms are on the table between you, printed, with a place for two signatures. Neither of you looks at it for a while.'],
    choices: [
      c('sign', 'Sign it and treat it as a schedule', 'A hard four months with a shape', { stress: 6, readiness: 6, standing: 6 }, { flags: { planAccepted: true }, personality: 'grinder' }),
      c('terms', 'Negotiate one of the terms', 'Confidence check', { energy: -4 }, { check: { stat: 'confidence', difficulty: 58 }, successEffects: { standing: 8, trust: 6, stress: -6 }, failureEffects: { conflict: 6, standing: -3 }, successText: '“Fine. Monthly, not fortnightly.” One sentence, two hours of your life back every month.', failureText: '“The terms are the terms.” They are, at this point, not really theirs either.', personality: 'boundarySetter' }),
      c('leave', 'Say that you would rather leave than do this', 'Ends the run, on your terms', {}, { ending: 'quit_walk' }),
    ] },

  { id: 'dismissal', title: 'The meeting with two people in it', category: 'advisor', scene: 'portal', probability: 1, scheduledOnly: true, cooldown: 99,
    text: ['Your advisor and the graduate director are both in the room. Nobody offers you coffee. There is a document face-down on the table and it stays face-down for nine minutes.', 'You already know. You knew in the corridor from the way the director said your first name.'],
    choices: [
      c('appeal', 'Appeal. Make the case for one more term.', 'A real chance, weighted by everything you built', { energy: -8, stress: 10 }, { check: { stat: 'confidence', difficulty: 62 }, successEffects: { standing: 26, hope: 10, trust: 6 }, failureEffects: {}, successText: 'You lay out what exists, what is close, and what you need. The director writes down two things. One more term.', failureText: 'You make the case. It is a good case. It is late.', appeal: true }),
      c('accept', 'Accept it', 'End the run', {}, { ending: 'fired' }),
      c('master', 'Ask to leave with the master’s instead', 'Requires 55 coursework', { }, { requiresCoursework: 55, ending: 'master' }),
    ] },

  { id: 'considering_leaving', title: 'The thought you have been having', category: 'life', scene: 'home', probability: 1, scheduledOnly: true, cooldown: 6,
    text: ['It arrives on a Tuesday, fully formed, while you are doing something else: you could just stop. Not fail. Stop. The thought is not dramatic. That is what makes it serious.', 'A friend from undergrad posts about their promotion. You are happy for them. You are also doing arithmetic you have not done before.'],
    choices: [
      c('sit', 'Sit with it. Do not decide anything today.', 'Honest; the pressure stays but so do you', { stress: -4, hope: 2 }, { flags: { consideringLeaving: true } }),
      c('talk', 'Talk to someone who left', 'Cohort. They are extremely easy to find.', { energy: -3, hope: 6, stress: -8 }, { flags: { consideringLeaving: true }, peerBond: 6, personality: 'networker' }),
      c('reasons', 'Write down why you came', 'It either still lands or it does not', { energy: -2 }, { check: { stat: 'hope', difficulty: 45 }, successEffects: { hope: 14, confidence: 6 }, failureEffects: { hope: -4 }, successText: 'You read the list. Three of the five reasons are still true. Three is enough.', failureText: 'You read the list. It was written by someone who did not know what this costs. You are not angry at them.', flags: { consideringLeaving: true } }),
    ] },

  { id: 'the_decision', title: '“Do you want to keep doing this?”', category: 'life', scene: 'home', probability: 1, scheduledOnly: true, cooldown: 8, prerequisites: ['consideringLeaving'],
    text: ['Someone who loves you asks it without an agenda, which is the only way the question can be asked. You notice you do not answer immediately.', 'It is 2 a.m. and the cluster job has failed again and you say it out loud to an empty room: do I want to keep doing this?'],
    choices: [
      c('stay', 'Yes. Not today, but yes.', 'You choose it, which is different from enduring it', { hope: 16, confidence: 8, stress: -10 }, { flags: { chose: true }, achievement: 'chose', personality: 'grinder' }),
      c('walk', 'No. And it is a relief to say it.', 'End the run on your own terms', {}, { ending: 'quit_walk' }),
      c('health', 'No — because of what this is doing to me', 'End the run, for the body', {}, { ending: 'quit_health', conditions: {} }),
      c('money', 'No — the arithmetic stopped working', 'End the run, for the money', {}, { ending: 'quit_money' }),
    ] },
].map(e => ({ scene: 'office', ...e }));
