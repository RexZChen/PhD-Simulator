// The spinout.
//
// A five-beat arc, not a random event. It only starts if the work actually justifies it — a real
// result, published, with novelty behind it — and then it runs across years, one decision at a
// time, and each decision narrows the next one.
//
// The satire writes itself and is entirely accurate: the university owns the invention you made,
// because you signed that on day one in a stack of forms nobody read to you. Your advisor, who will
// contribute a board seat and a quarterly call, is positioned for a slice roughly the size of yours.
// Everyone in the room is genuinely delighted for you. You will do all of the work.
//
// `founder` already exists as an ending — three people and a demo. This is the other kind: the one
// that comes out of the research, with the institution's hand already on it.
const c = (id, text, hint, effects = {}, extra = {}) => ({ id, text, hint, effects, ...extra });
export default [
  // ── 1. Somebody notices ────────────────────────────────────────────────────────────────────
  { id: 'spin_disclosure', title: 'A form you did not know existed', category: 'career', scene: 'portal',
    probability: .7, once: true, cooldown: 99,
    conditions: { minMonth: 24, minAccepted: 1, minQuality: 3 },
    text: ['An email from an office called Technology Transfer, which you have walked past for three years assuming it handled printers. They have read your paper. They want to know whether you have filed an invention disclosure.',
      'Somebody at a company emailed your advisor asking whether the method in your paper is available to license. Your advisor has forwarded it to you with three words: "See below. Thoughts?"'],
    choices: [
      c('file', 'File the disclosure', 'Starts something. Also signs something.', { energy: -5, academicCapital: 4, career: 5 },
        { flags: { ipDisclosed: true }, patent: true, followUps: [{ id: 'spin_advisor_idea', delay: 2 }],
          result: 'Eleven pages, four signatures, and a clause you read twice. The university owns it. You have in fact always agreed that the university owns it — it was in the enrolment paperwork, on day one, in a stack you signed in an afternoon.' }),
      c('read', 'Read the IP policy first', 'Two hours; the only two hours that matter', { energy: -4, career: 3 },
        { flags: { ipDisclosed: true, ipInformed: true }, patent: true, followUps: [{ id: 'spin_advisor_idea', delay: 2 }], achievement: 'readthepolicy',
          skill: { writing: 1 },
          result: 'Forty pages. Section 4.2 is the whole thing: assignment is automatic, the split is fixed, and the inventor share is a number you would have guessed too high. You now know more about this than anyone else in your lab, which will be worth a specific amount of money later.' }),
      c('ignore', 'Delete it and get back to work', 'A door closes quietly', { energy: 1, progress: 4 },
        { flags: { ipIgnored: true }, personality: 'grinder',
          result: 'You have a deadline. It is a real deadline. In four years somebody else will license something adjacent and you will remember this email with unusual precision.' }),
    ] },

  // ── 2. The suggestion ──────────────────────────────────────────────────────────────────────
  { id: 'spin_advisor_idea', title: '“Have you thought about spinning this out?”', category: 'advisor', scene: 'office', speaker: 'advisor',
    probability: 1, scheduledOnly: true, once: true, cooldown: 99, conditions: { flag: 'ipDisclosed' },
    text: ['They ask it lightly, at the end of a meeting about something else, in the tone people use for an idea they have already had for a while.\n\n“There is a company in this. Not now — after you defend. I would obviously stay involved. Board, mostly. Maybe a day a month on the technical side, if you needed it.”\n\nA day a month.',
      '“I have done this twice.” They have done this twice. One of them worked, and the thing that worked is on their slides at every talk, and the person who wrote the code for it is now at a bank.\n\n“You would run it, of course. I would just be on the board. And available.”'],
    choices: [
      c('keen', 'Say yes before they finish the sentence', 'Enthusiasm now; the terms get set later, without you', { hope: 10, career: 8, energy: -2 },
        { flags: { ventureKeen: true }, followUps: [{ id: 'spin_captable', delay: 3 }], personality: 'riskTaker',
          result: 'They are delighted. Genuinely delighted — this is a person who likes building things and you have just agreed to build one. Nothing about the arrangement has been discussed and both of you now believe it has been.' }),
      c('role', '“What would your role be, concretely?”', 'The single most valuable question in this arc', { energy: -3 },
        { check: { stat: 'confidence', difficulty: 54 },
          successEffects: { career: 6, confidence: 6, academicCapital: 3 },
          failureEffects: { satisfaction: -5, stress: 4 },
          successText: 'A pause. Then, to their credit, a straight answer: board seat, advisory shares, no operational involvement, and they say the number out loud. It is a large number and you now know it three years before you would otherwise have known it.',
          failureText: '“Oh — supportive, mostly. We can work it out.” The sentence is designed not to be answerable and you have used your one chance to ask it cold.',
          flags: { ventureAsked: true }, followUps: [{ id: 'spin_captable', delay: 3 }] }),
      c('finish', '“I would want to finish the thesis first.”', 'Correct, and it costs the momentum', { hope: -2, stress: -6, readiness: 4 },
        { flags: { ventureDeferred: true }, followUps: [{ id: 'spin_captable', delay: 6 }], personality: 'boundarySetter',
          result: '“Of course. Of course.” They mean it. They also mention it to two people at a conference in March, and by the time you defend, the thing has a name that you did not choose.' }),
      c('no', '“I do not want to run a company.”', 'Closes the arc. A real answer.', { hope: 4, stress: -8, career: -4 },
        { flags: { ventureNo: true },
          result: 'They accept it immediately and without a flicker, which tells you they have been turned down before and that it genuinely does not matter to them. The relief lasts about six weeks and then you think about it again.' }),
    ] },

  // ── 3. The arithmetic ──────────────────────────────────────────────────────────────────────
  { id: 'spin_captable', title: 'The cap table', category: 'career', scene: 'office',
    probability: 1, scheduledOnly: true, once: true, cooldown: 99,
    conditions: { notFlag: 'ventureNo' },
    text: ['A lawyer from the licensing office draws it on a whiteboard and everybody in the room is smiling.\n\nThe university takes a slice for the IP it owns. Your advisor takes a slice for the board seat and the name. A cofounder you have not met yet takes a slice for doing the commercial half. What is left is yours, and it is the biggest single number on the board, and it is not as big as the three of them together.\n\nEverybody is delighted for you. They are not being cynical. This is simply what the shape is.',
      'Four boxes on a whiteboard. Yours is the largest. You are also the only person in the room whose box requires them to work eighty hours a week for four years, and this is not represented on the whiteboard.'],
    choices: [
      c('sign', 'Sign it', 'The most common outcome, by a distance', { career: 8, hope: 6, energy: -4 },
        { flags: { ventureTerms: 'standard' },
          result: 'You sign. It is a genuinely good deal by the standards of this university and a strange one by the standards of arithmetic, and both of those are true at once.' }),
      c('advisor', 'Ask, out loud, what your advisor’s slice is for', 'The question nobody in the room wants asked', { energy: -4, stress: 8 },
        { check: { rel: 'trust', difficulty: 56 },
          successEffects: { career: 12, confidence: 10, academicCapital: 5, satisfaction: 3 },
          failureEffects: { satisfaction: -10, conflict: 8, hope: -5 },
          successText: 'The room goes quiet. Then your advisor says, "Fair question," and halves it themselves, in front of the lawyer, without being asked twice. You will not fully understand what that cost them until you are on the other side of it.',
          failureText: '“The credibility of the affiliation.” Said pleasantly. The lawyer looks at the table. The number does not move and something between you and your advisor does.',
          flags: { ventureTerms: 'renegotiated' }, achievement: 'askedthenumber' }),
      c('university', 'Negotiate the university’s share instead', 'Safer target; smaller prize', { energy: -5, career: 5 },
        { check: { skill: 'communication', difficulty: 52 },
          successEffects: { career: 5, confidence: 5 }, failureEffects: { stress: 5 },
          successText: 'You get two points back and a milestone clause. The licensing officer is almost pleased — nobody negotiates and they have a mandate to be negotiated with.',
          failureText: '“The policy is the policy.” The policy is the policy. It is on page four of the thing you did or did not read.',
          flags: { ventureTerms: 'standard' } }),
      c('walk', 'Walk away from the whole thing', 'Ends the arc. Keeps the work.', { hope: 3, stress: -6, career: -6 },
        { flags: { ventureNo: true },
          result: 'You publish it instead, fully, with the code. Six people build on it in eighteen months, none of them pay you anything, and one of them thanks you in a talk. That is a different currency and it does spend.' }),
    ] },

  // ── 4. What it costs while you are still a student ─────────────────────────────────────────
  { id: 'spin_two_jobs', title: 'You have two jobs and one of them is not paying you', category: 'career', scene: 'home',
    probability: .8, cooldown: 5, conditions: { flag: 'ventureTerms', notFlag: 'ventureNo', minMonth: 34 },
    text: ['A term sheet, a customer call, and a chapter, all this week. Two of those have people waiting on them and the third is the one that gets you a doctorate.',
      'The cofounder — who is good, and fast, and does not have a thesis — sends eleven messages between nine and eleven at night. Every one of them is reasonable.'],
    choices: [
      c('thesis', 'Protect the thesis', 'The degree is the thing you came for', { progress: 8, draft: 8, career: -4, energy: -6 },
        { personality: 'boundarySetter', result: 'You block out three days and do not answer anything. The company survives three days without you. It turns out most weeks it can survive three days without you, and knowing that is worth the three days.' }),
      c('company', 'Give the week to the company', 'It is the exciting one; that is the trap', { career: 8, money: 900, progress: -8, draft: -6, stress: 6 },
        { personality: 'riskTaker', result: 'It is a very good week. You are quick and useful and people say so out loud, which the thesis has never once done. The chapter is where it was in March.' }),
      c('tell', 'Tell your advisor how much time it is taking', 'They set this up; they own some of this', { energy: -3 },
        { check: { rel: 'trust', difficulty: 48 },
          successEffects: { satisfaction: 6, trust: 6, stress: -10, progress: 4 },
          failureEffects: { satisfaction: -6, pressure: 8, stress: 6 },
          successText: '“Then do less of it until you deposit.” They say it about the company they suggested, without defensiveness, and they mean it, and the pressure comes off for four months.',
          failureText: '“That is the job.” Which job. Neither of you specifies and the meeting ends.' }),
    ] },
  { id: 'spin_advisor_absent', title: 'A day a month', category: 'career', scene: 'office',
    probability: .7, once: true, cooldown: 99, conditions: { flag: 'ventureTerms', notFlag: 'ventureNo', minMonth: 36 },
    text: 'It has been five months. Your advisor has attended one call, for nineteen minutes, from an airport, and made one introduction, which was excellent and closed a customer.\n\nThat introduction was worth more than anything you did in March. Both of those facts are true and you are holding them at the same time.',
    choices: [
      c('accept', 'Decide that the introduction was the deal', 'The mature reading', { hope: 4, career: 4, stress: -5 },
        { result: 'One door opened by somebody with thirty years of standing is worth more than a hundred of your emails, and pretending otherwise would be a nice feeling and a wrong one.' }),
      c('resent', 'Keep a private tally', 'It is accurate and it corrodes', { stress: 6, hope: -4, satisfaction: -3 },
        { personality: 'cynic', flags: { ventureResent: true },
          result: 'Nineteen minutes and one email against four hundred hours. The arithmetic is correct and carrying it around costs more than the shares are worth.' }),
      c('use', 'Ask for three more introductions, specifically', 'Use the asset you actually bought', { energy: -3, career: 10, academicCapital: 5 },
        { check: { advisor: 'connections', difficulty: 50 },
          successEffects: { money: 2200, hope: 6 }, failureEffects: { satisfaction: -3 },
          successText: 'They make all three that afternoon. Two go nowhere and one becomes the thing that keeps the company alive through the following winter. This is what the board seat is for and almost nobody asks.',
          failureText: '“Let me think about who would be right.” Nobody is ever right. It is not malice; it is a calendar.' }),
    ] },

  // ── 5. The fork, at the end ────────────────────────────────────────────────────────────────
  { id: 'spin_decide', title: 'Full time, or not', category: 'career', scene: 'home', urgent: true,
    probability: 1, once: true, cooldown: 99,
    conditions: { flag: 'ventureTerms', notFlag: 'ventureNo', minMonth: 52 },
    text: ['The seed round is contingent on a full-time founder. You are four months from depositing. The investors are polite about it and the politeness has a date attached.',
      'Your cofounder asks the question directly, which you have been admiring them for not asking for eleven weeks: are you doing this, or are you not?'],
    choices: [
      c('go', 'Take it. Run the company.', 'Ends the run. Everything you built, pointed at one thing.', {}, { ending: 'spinout' }),
      c('finish', 'Deposit first, join after', 'The answer everyone gives; it works about half the time', { stress: 10, draft: 10, career: -3 },
        { flags: { ventureAfter: true }, personality: 'grinder',
          result: 'They agree to wait four months. The round closes on a smaller number with a different lead. You deposit in June and join in July, into a company that made eleven decisions without you and is slightly not the one you designed.' }),
      c('board', 'Stay academic; take a board seat and shares', 'Become the person your advisor is', { hope: 6, career: 6, academicCapital: 6, money: 1800 },
        { flags: { ventureBoard: true }, achievement: 'theotherside',
          result: 'You keep the shares, take the board seat, and commit to a day a month.\n\nYou will attend about half of those. It is not cynicism and it is not a betrayal of anything; it is a calendar, and you understand your advisor completely now, and you are never going to be able to un-understand it.' }),
    ] },
];
