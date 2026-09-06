// Replies the player can send from the Mail app. Matched on a mail's stable `kind` tag, never
// on its subject line, so replies keep working in any language. Each option carries the draft
// that gets streamed into the compose box, plus a small, honest effect. Replying is cheap but
// not free, and each mail can be answered once.
//
// Placeholders available in `draft`: {first} {name} {advisor} {advisorFirst} {school} {venue}
// {company} {project}. They are filled by fill() in state.js.

const o = (id, label, draft, effects = {}, extra = {}) => ({ id, label, draft, effects, ...extra });

export const replySets = {
  advisorComments: {
    hint: 'Your advisor wants a revision. What you promise here, you will owe.',
    options: [
      o('friday', 'Promise a revision by Friday',
        'Hi {advisorFirst},\n\nThank you for the comments — genuinely useful. I will work through all of them and have a revised draft back to you by Friday.\n\nBest,\n{first}',
        { satisfaction: 5, stress: 4, draft: 3, energy: -1 }, { personality: 'peoplePleaser' }),
      o('blocking', 'Ask which comments actually block submission',
        'Hi {advisorFirst},\n\nThere are a lot of comments here and I want to spend the time where it matters. Which of them do you consider blocking for submission, and which are nice-to-have?\n\nBest,\n{first}',
        { energy: -1 }, { check: { advisor: 'management', difficulty: 50 }, successEffects: { scope: -10, progress: 4, trust: 3 }, failureEffects: { stress: 5 }, successText: 'A numbered list comes back within the hour. Four blockers. You can see the shape of the week now.', failureText: '“All of them are blocking.” There are 183 of them.' }),
      o('scope', 'Say honestly that this is two weeks of work',
        'Hi {advisorFirst},\n\nHaving read through these, this is closer to two weeks of work than one. I can do the full pass, or I can do the top third and we submit on schedule. I would rather you choose than have me guess.\n\nBest,\n{first}',
        { confidence: 4, satisfaction: -4, stress: -5, energy: -1 }, { personality: 'boundarySetter' }),
    ],
  },
  advisorReady: {
    hint: 'Approved. You can just say thank you, or push for one more pass.',
    options: [
      o('thanks', 'Thank them and confirm you are submitting',
        'Hi {advisorFirst},\n\nThank you — I will get it into the submission system this cycle and send you the confirmation.\n\nBest,\n{first}',
        { satisfaction: 4, trust: 2 }),
      o('section4', 'Ask for one more look at the weakest section',
        'Hi {advisorFirst},\n\nBefore I submit: I am still not happy with the evaluation section. If you have twenty minutes for one more pass I think it would meaningfully help the reviews.\n\nBest,\n{first}',
        { writingQuality: 4, energy: -2 }, { check: { advisor: 'availability', difficulty: 45 }, successEffects: { writingQuality: 4, evidence: 3, trust: 2 }, failureEffects: { stress: 3 }, successText: 'Marked up and returned the same evening. The section is better.', failureText: '“Looks fine. Send it.” They did not open it.' }),
    ],
  },
  decisionAccept: {
    hint: 'Accepted. This is the one email you get to enjoy.',
    options: [
      o('cameraReady', 'Confirm the camera-ready',
        'Dear organisers,\n\nThank you — we are delighted. We will submit the camera-ready version by the deadline and register an author for the conference.\n\nBest regards,\n{name}',
        { satisfaction: 3, academicCapital: 2, hope: 3 }),
      o('travel', 'Ask your advisor whether the lab covers travel',
        'Hi {advisorFirst},\n\n{venue} accepted the paper. Does the lab have travel funding for this, or should I apply for the department grant?\n\nBest,\n{first}',
        { energy: -1 }, { check: { advisor: 'funding', difficulty: 50 }, successEffects: { trust: 2, hope: 4 }, failureEffects: { hope: -2 }, flags: { travelFunded: 'onSuccess' }, successText: '“Expense it.” Two words, and a flight you do not have to think about.', failureText: '“Apply for the department grant.” The department grant is $200 and closed in March.' }),
    ],
  },
  decisionReject: {
    hint: 'Rejected. You can close the tab, or extract something from it.',
    options: [
      o('meta', 'Request the meta-review',
        'Dear programme chairs,\n\nThank you for the reviews. Would it be possible to receive the meta-review? We would like to understand which of the concerns the committee weighted most heavily before we revise.\n\nBest regards,\n{name}',
        { energy: -1, reproducibility: 3, evidence: 2 }, { personality: 'perfectionist' }),
      o('vent', 'Forward it to your advisor with one dry sentence',
        'Hi {advisorFirst},\n\nReviews attached. Reviewer 2 is unconvinced the problem exists. The problem exists.\n\nBest,\n{first}',
        { stress: -5, trust: 2 }, { personality: 'cynic' }),
    ],
  },
  reviewsIn: {
    hint: 'The rebuttal window is open. Set expectations before you write it.',
    options: [
      o('plan', 'Send your advisor the scores and a plan',
        'Hi {advisorFirst},\n\nReviews are in. I have read them twice. My plan for the rebuttal is to answer the evaluation concern with numbers and to concede the framing point rather than fight it. Anything you would do differently?\n\nBest,\n{first}',
        { trust: 4, energy: -1 }, { flags: { rebuttalBonus: true } }),
      o('alone', 'Say nothing and start writing',
        '(no reply sent — you open the rebuttal form instead)',
        { confidence: 2, stress: 2 }, { personality: 'independent', silent: true }),
    ],
  },
  cfp: {
    hint: 'A deadline exists. You can pretend you did not see it.',
    options: [
      o('aim', 'Ask your advisor whether to aim for it',
        'Hi {advisorFirst},\n\n{venue} has its call out. Given where the project is, is that a realistic target for us, or should we plan for the cycle after?\n\nBest,\n{first}',
        { pressure: 5, satisfaction: 3, energy: -1 }),
      o('ignore', 'Archive it',
        '(archived without reading past the first line)',
        { stress: -2 }, { personality: 'boundarySetter', silent: true }),
    ],
  },
  spam: {
    hint: 'The International Journal of Everything would like to hear from you.',
    options: [
      o('unsubscribe', 'Click unsubscribe',
        'Dear Editorial Office,\n\nPlease remove {name} from this and all associated mailing lists.\n\nRegards,\n{name}',
        { stress: -1 }, { note: 'You are added to two more lists.' }),
      o('submit', 'Reply asking about the fee, purely out of curiosity',
        'Dear Editorial Office,\n\nOut of curiosity: what is the article processing charge, and is peer review included at that price?\n\nRegards,\n{name}',
        { hope: 1 }, { note: 'The reply arrives in four minutes. It is 900 words and does not name a number.' }),
    ],
  },
  payroll: {
    hint: 'Payroll requires acknowledgement of the appointment you already have.',
    options: [
      o('confirm', 'Acknowledge the appointment',
        'To whom it may concern,\n\nConfirming receipt and acceptance of the appointment described below.\n\nRegards,\n{name}',
        {}, { note: 'A second email asks you to confirm that you confirmed.' }),
    ],
  },
  policies: {
    hint: 'Fourteen updated policies. Nobody has read them, including the sender.',
    options: [
      o('ack', 'Acknowledge all fourteen policies',
        'Confirming that I have read and understood all fourteen updated policies.\n\n{name}',
        {}, { note: 'You have read one and a half.' }),
      o('question', 'Ask which policy actually changed',
        'Hello,\n\nCould you point me to which of the fourteen policies changed from last year? The document does not appear to mark revisions.\n\nThanks,\n{name}',
        { energy: -1 }, { note: 'The answer is “all of them have been reviewed,” which is not the question you asked.' }),
    ],
  },
  defenseScheduled: {
    hint: 'A room, a date, and a machine that checks your margins.',
    options: [
      o('confirm', 'Confirm the room and the projector',
        'Hello,\n\nConfirming the defense slot below. Could you also confirm the room has a working projector and an HDMI adapter? I would rather find out now than that morning.\n\nThank you,\n{name}',
        { readiness: 3, stress: -3 }),
    ],
  },
  prelimPass: {
    hint: 'You are a candidate now, pending forty-one forms.',
    options: [
      o('thanks', 'Thank the committee',
        'Dear committee,\n\nThank you for your time and for the questions — particularly the one about the baseline, which I have been thinking about since.\n\nWith thanks,\n{name}',
        { academicCapital: 2, hope: 3, readiness: 2 }),
    ],
  },

  healthNudge: {
    hint: 'Student Health has noticed you exist. You can book, defer, or lie.',
    options: [
      o('book', 'Book the appointment',
        'Hi,\n\nYes — I would like to book. Any time works, which I appreciate is not a sentence you hear often from a graduate student. Please put me in the first slot you have.\n\nThanks,\n{first}',
        { stress: -4, hope: 3 }, { flags: { bookedCare: true }, personality: 'boundarySetter', note: 'Booked. It is six weeks out. It is on the calendar, which is most of the work.' }),
      o('after', 'Ask to book after the deadline',
        'Hi,\n\nThank you for following up. Could I book something after the {venue} deadline? Things are unusually compressed until then and I would rather come in able to answer questions.\n\nBest,\n{first}',
        { stress: 3, health: -2 }, { personality: 'grinder', note: 'Deferred. The body files this under “noted.”' }),
      o('fine', 'Say you are fine',
        'Hi,\n\nThanks — I think it has settled on its own. I will get in touch if it comes back.\n\nBest,\n{first}',
        { health: -4, stress: 2 }, { personality: 'cynic', note: 'It has not settled. You both know this.' }),
    ],
  },
  surpriseBill: {
    hint: 'A bill that is not a bill. You can pay it, fight it, or file it in the drawer.',
    options: [
      o('pay', 'Just pay it',
        'To whom it may concern,\n\nPayment attached. I would appreciate written confirmation that this closes the account for this visit.\n\nRegards,\n{name}',
        { stress: -5 }, { note: 'Paid. The relief is out of proportion to the amount, which tells you something.' }),
      o('appeal', 'Appeal it',
        'To whom it may concern,\n\nI am disputing this charge. The provider was in network and I was not informed that any part of the care would be billed separately. Please send an itemised statement and the network status of every party billed.\n\nRegards,\n{name}',
        { energy: -4, stress: 4 }, { check: { skill: 'writing', difficulty: 48 }, successEffects: { money: 400, hope: 5 }, failureEffects: { stress: 4 }, successText: 'Eleven weeks later, a letter: adjusted. You saved four hundred dollars with a paragraph.', failureText: 'A form letter about the terms of your plan. The terms of your plan are that you pay.', personality: 'boundarySetter' }),
      o('drawer', 'Put it in the drawer',
        'Hi,\n\nAcknowledging receipt. I will be in touch.\n\n{first}',
        { stress: 6 }, { personality: 'cynic', note: 'The drawer now has a theme. It will send another one.' }),
    ],
  },
  writtenWarning: {
    hint: 'This one is in your file. What you write back is also in your file.',
    options: [
      o('plan', 'Reply with dates and deliverables',
        'Hi {advisorFirst},\n\nThank you for writing this down; it is clearer than the conversations have been. Here is what I am committing to: a full draft of {project} in four weeks, a written update every second Friday, and no missed group meetings. If any of those slips I will tell you before it slips, not after.\n\n{first}',
        { standing: 8, satisfaction: 6, trust: 5, stress: 3 }, { personality: 'independent' }),
      o('context', 'Tell them what has actually been happening',
        'Hi {advisorFirst},\n\nI want to give you context rather than excuses. The last months have been harder than I have let on — health and money, mostly, neither of which I wanted to bring into a research meeting. That is my error, not yours. I am dealing with both. I am still committed to this work.\n\n{first}',
        { stress: -6, hope: 4 }, { check: { advisor: 'caring', difficulty: 50 }, successEffects: { standing: 12, trust: 10, satisfaction: 6 }, failureEffects: { standing: -2, satisfaction: -3 }, successText: 'They reply in twenty minutes: “Thank you for telling me. Come and see me. Bring nothing.”', failureText: 'They reply in four days: “Understood. Let’s focus on the deliverables.”', personality: 'boundarySetter' }),
      o('nothing', 'Acknowledge receipt and nothing else',
        'Hi {advisorFirst},\n\nReceived, understood.\n\n{first}',
        { standing: -3, stress: 5 }, { personality: 'cynic', note: 'Six words. They will read them more times than you wrote them.' }),
    ],
  },
  probation: {
    hint: 'A formal plan with formal terms. There is a form, and there is a person.',
    options: [
      o('sign', 'Sign and return the terms',
        'Dear Graduate Studies,\n\nSigned copy attached. I have read the terms and I intend to meet them. I would like the fortnightly reports to go to my advisor and to this office so there is no ambiguity about what was submitted and when.\n\nRegards,\n{name}',
        { standing: 6, stress: -4, readiness: 3 }, { flags: { planAccepted: true } }),
      o('support', 'Ask what support actually exists',
        'Dear Graduate Studies,\n\nSigned copy attached. Page four lists support resources. Could you tell me which of them have availability this term, and whether the counselling waitlist applies to students on an improvement plan? I would rather use what exists than discover later that it did not.\n\nRegards,\n{name}',
        { energy: -3 }, { check: { skill: 'communication', difficulty: 45 }, successEffects: { standing: 6, stress: -10, hope: 8 }, failureEffects: { stress: 3 }, successText: 'A real reply from a real person, with two names and a direct line. It helps more than the plan does.', failureText: 'A PDF you already have, attached again, with “please see page four.”', personality: 'boundarySetter' }),
    ],
  },

  citation: {
    hint: 'Someone cited you. You can be normal about this, or you can be honest.',
    options: [
      o('thanks', 'Email them and say thank you',
        'Hi,\n\nI saw you cited our paper — thank you, and thank you for reading it properly; your framing in section 4 is better than ours. If it is useful, the code and the two failure cases we could not fix are in the repo.\n\nBest,\n{first}',
        { hope: 6, academicCapital: 3, energy: -1 }, { personality: 'networker', note: 'They reply the same day. Two years later they are on your job talk committee.' }),
      o('screenshot', 'Screenshot it and send it to one person',
        'look',
        { hope: 8, stress: -3 }, { silent: true, note: 'You send it to the person who has heard about this paper for two years. They reply with six exclamation marks.' }),
      o('nothing', 'Read it eleven times and do nothing',
        'no reply sent',
        { hope: 4 }, { silent: true, personality: 'cynic', note: 'You keep the tab open for three days.' }),
    ],
  },
  collabOffer: {
    hint: 'A stranger wants to work with you. Your advisor has feelings about strangers.',
    options: [
      o('yes', 'Say yes, and loop in your advisor',
        'Hi,\n\nYes — I would like that. Copying {advisor} so we are all in the same thread from the start, which I have learned is the difference between a collaboration and a misunderstanding.\n\nWhat does your timeline look like?\n\nBest,\n{first}',
        { hope: 6, academicCapital: 4, satisfaction: 3 }, { flags: { collabActive: true }, personality: 'networker', note: 'Your advisor replies “good, but keep it bounded,” which is as close as they get to enthusiasm.' }),
      o('quiet', 'Say yes without telling your advisor',
        'Hi,\n\nYes, I am interested. Let’s start small and see whether it goes anywhere before we make it official.\n\n{first}',
        { hope: 5, academicCapital: 3, stress: 5 }, { flags: { collabActive: true, collabSecret: true }, personality: 'independent', note: 'They will find out at a conference, from someone else, in about four months.' }),
      o('no', 'Say the timing is wrong',
        'Hi,\n\nThank you — genuinely tempting. I am finishing my dissertation and I have learned the hard way what I can and cannot take on. Can I write to you when I am through it?\n\nBest,\n{first}',
        { stress: -4, hope: -2 }, { personality: 'boundarySetter', note: 'You do write to them, eventually. They are still interested.' }),
    ],
  },
  visaDenied: {
    hint: 'There is no appeal. There is only what you do next.',
    options: [
      o('coauthor', 'Ask a co-author to present',
        'Hi {advisorFirst},\n\nThe visa was refused, with no reason given and no appeal. Could you or one of the group present? I will send the slides and a script, and I will join the Q&A by video if the room can take it.\n\n{first}',
        { stress: -6, satisfaction: 2 }, { note: 'They present it. They say your name four times, which you notice on the recording.' }),
      o('remote', 'Ask the chairs for a remote slot',
        'Dear chairs,\n\nMy visa was refused and I cannot travel. Is a remote presentation possible? I appreciate this is extra work for the AV team and I will be online an hour early.\n\nRegards,\n{name}',
        { energy: -3, academicCapital: 2 }, { check: { skill: 'communication', difficulty: 42 }, successEffects: { hope: 6, confidence: 4 }, failureEffects: { hope: -4 }, successText: 'They say yes, and they say it kindly, and they make it work.', failureText: '“Unfortunately we are unable to support remote presentations this year.” The word unfortunately again.' }),
    ],
  },
  visaDelayed: {
    hint: 'Administrative processing. Nobody can tell you how long.',
    options: [
      o('wait', 'Wait, and prepare both versions',
        'Hi {advisorFirst},\n\nStill in administrative processing. I am preparing to present in person and remotely and will know which about two days beforehand. Sorry for the ambiguity; it is not mine to resolve.\n\n{first}',
        { stress: 4, readiness: 3 }, { personality: 'perfectionist', note: 'The passport arrives four days late. You watch the session from your kitchen.' }),
      o('escalate', 'Ask the international office to inquire',
        'Dear International Student Services,\n\nMy visa application has been in administrative processing for six weeks and I have a conference presentation. Is there anything the university can do — a letter, an inquiry, anything?\n\nRegards,\n{name}',
        { energy: -4 }, { check: { skill: 'communication', difficulty: 50 }, successEffects: { stress: -8, hope: 6 }, failureEffects: { stress: 6 }, successText: 'They send a letter on letterhead. It probably does nothing. It arrives eight days later, approved.', failureText: '“Unfortunately we have no visibility into consular decisions.” True, and unhelpful, and not their fault.' }),
    ],
  },
};

export const replyKinds = Object.keys(replySets);
export const repliesFor = mail => (mail && mail.kind && replySets[mail.kind]) || null;
