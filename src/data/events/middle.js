// The middle years.
//
// Months 18 to 48: after the prelim, before the job market. It is the longest stretch of a PhD and
// it had the thinnest event pool — measured over 120 runs, a third of everything a player saw in
// this band was something they had already seen, the worst repeat rate of any period in the game.
//
// It is also the stretch with the least external structure. Year one has coursework and a cohort;
// year six has a deadline and a market. Years three and four have a project, an advisor, and a very
// long corridor. So these are not milestones — they are the texture of a long middle: the drift,
// the comparison, the competence arriving without anyone mentioning it, and the specific loneliness
// of being the only person on earth who knows what you are working on.
const c = (id, text, hint, effects = {}, extra = {}) => ({ id, text, hint, effects, ...extra });
const MID = { minMonth: 18, maxMonth: 50 };
export default [

  // ── The boulder rolls back ─────────────────────────────────────────────────────────────────
  { id: 'next_project', title: 'A question at the end of a good meeting', category: 'advisor', scene: 'office', speaker: 'advisor',
    probability: 1, scheduledOnly: true, cooldown: 0,
    text: ['The meeting is nearly over. It has been a good one — the paper is out, the reviews are behind you, and for eleven minutes nobody has said the word "deadline."\n\nThen, warmly, and with what is unmistakably real curiosity: “So — what are you actually curious about for the next one?”\n\nThe next one. The paper came out a few weeks ago.',
      '“Now that that is done.” A pause of about half a second, which is the entire holiday. “What is the next project?”\n\nThey are not being cruel. They are asking the best question they know how to ask, in the only register they have, and it is the question that got them here too.'],
    choices: [
      c('ready', 'You have an answer, and it is a good one', 'The boulder, picked up on purpose', { novelty: 8, satisfaction: 8, confidence: 6, hope: 4, energy: -3 },
        { result: 'You have been thinking about it for three weeks without admitting you were thinking about it. They light up. You are already halfway up the hill and you were the one who started walking.' }),
      c('blank', '“I have not thought about it. I finished it on Tuesday.”', 'True; not the answer the question wants', { stress: 6, satisfaction: -4, hope: -2 },
        { result: '“Of course, of course.” They mean it, and they ask again in nine days, and they will keep asking, gently, because a lab without a next project is a lab with nothing in the pipeline and they can feel it from where they sit.' }),
      c('rest', '“Can I have a month before we start the next one?”', 'The sentence almost nobody says', { energy: 14, stress: -14, hope: 8, satisfaction: -3 },
        { flags: { askedForTime: true }, personality: 'boundarySetter', achievement: 'askedforamonth',
          result: '“Take two weeks.” You asked for a month and got two weeks, which is more than you have had in three years, and you will spend the first four days of it unable to work out what to do with yourself.' }),
      c('their', 'Ask what they would want you to do next', 'Faster; theirs, not yours', { progress: 8, dependency: 8, satisfaction: 6, novelty: -4 },
        { result: 'They have an answer ready. They have had it ready for a fortnight. It is a good project and you will do it well and in year five you will not be certain whose it was.' }),
    ] },
  // ── The work itself ────────────────────────────────────────────────────────────────────────
  { id: 'mid_reread', title: 'You reread your own code from year one', category: 'research', scene: 'lab', probability: 0.62, cooldown: 9, conditions: { ...MID },
    text: ['You open a file you wrote nineteen months ago to reuse one function. It is bad. It is genuinely bad, and you can see exactly why you wrote it that way, and you remember being proud of it.',
      'A variable called `tmp2`. A comment that says `# fix this`. A commit message that says `ok`. All of it yours, and all of it from a person who no longer exists.'],
    choices: [
      c('rewrite', 'Rewrite it properly', 'A day gone; a foundation that holds', { energy: -7, coding: 4, reproducibility: 6, progress: 2 }, { skill: { coding: 1 }, result: 'Four hours. It is now eighty lines shorter and you understand the problem better than you did when you were solving it.' }),
      c('wrap', 'Wrap it and never look inside again', 'Fast, and it will be back', { energy: -2, progress: 5, reproducibility: -4 }, { personality: 'grinder', result: 'It works. There is now a function in your pipeline that you are afraid of, and it will surface in month forty-one at the worst possible time.' }),
      c('note', 'Notice how much better you have got', 'Nothing changes except you', { hope: 6, confidence: 5 }, { result: 'Nobody has told you that you improved, because improvement in research is invisible from the inside and nobody thinks to mention it. This is the only evidence you will get, and it is real evidence.' }),
    ] },
  { id: 'mid_dead_branch', title: 'Eleven weeks on a branch that goes nowhere', category: 'research', scene: 'lab', probability: 0.67, cooldown: 10, conditions: { ...MID, minProgress: 25 },
    text: ['It was a good idea. It is still a good idea. It does not work, and you have known that for about nine days without saying it out loud to anyone including yourself.',
      'The experiment has now failed in four distinct ways, each of which taught you something, none of which is a result.'],
    choices: [
      c('kill', 'Kill it today', 'The whole skill, in one decision', { energy: -3, stress: -8, hope: -4, progress: 4 }, { skill: { research: 1 }, personality: 'boundarySetter', result: 'Deciding fast is worth more than being right, and it takes about three years to learn that, and you have just learned it eleven weeks late instead of eleven months late.' }),
      c('onemore', 'One more configuration', 'It is never one more configuration', { energy: -8, stress: 6, progress: -3 }, { personality: 'perfectionist', result: 'It is not one more configuration. It is four, and a weekend, and the same answer.' }),
      c('salvage', 'Write up what it rules out', 'A negative result nobody will publish and you will use', { energy: -5, evidence: 7, writingQuality: 3 }, { result: 'Two pages, in your own notes, that will become a paragraph of the related work and will stop you doing this again in year five.' }),
    ] },
  { id: 'mid_scooped_partial', title: 'Somebody published half of it', category: 'research', scene: 'lab', probability: 0.60, cooldown: 11, conditions: { ...MID, minProgress: 25 },
    text: 'A preprint, Tuesday, from a group you have heard of. It is not your paper. It is the first half of your paper, done differently, and done well.',
    choices: [
      c('cite', 'Cite them and sharpen what is left', 'The professional move, and it works', { energy: -5, novelty: 5, writingQuality: 4, hope: -3 },
        { check: { skill: 'research', difficulty: 50 }, successEffects: { confidence: 5, progress: 4 }, failureEffects: { stress: 6, scope: 6 },
          successText: 'Losing the first half turns out to make the second half legible. The paper is better and you will never say that out loud.',
          failureText: 'What is left is thinner than you want it to be and you spend two weeks trying to make it not be.' }),
      c('race', 'Race the second half out', 'Speed over everything', { energy: -12, stress: 12, draft: 14, progress: 6, reproducibility: -6 }, { personality: 'riskTaker' }),
      c('email', 'Email them', 'The move nobody thinks of', { energy: -3, academicCapital: 4 },
        { check: { skill: 'networking', difficulty: 48 }, successEffects: { hope: 8, career: 4 }, failureEffects: { hope: -3 },
          successText: 'They reply in four hours, delighted, and suggest coordinating rather than competing. This happens far more often than anyone expects and almost nobody tries it.',
          failureText: 'No reply. Which is also an answer, and a common one, and not about you.' }),
    ] },
  { id: 'mid_reviewer2', title: 'You are Reviewer 2 now', category: 'review', scene: 'home', probability: 0.64, cooldown: 8, conditions: { ...MID, minAccepted: 1 },
    text: ['{advisor} has forwarded you three papers to review "for the practice." The deadline is Sunday. The practice is real; so is the fact that this is their reviewing load.',
      'Your first review as an actual reviewer. The paper is mediocre and you can see precisely which reviewer you are about to become.'],
    choices: [
      c('generous', 'Write the review you wish you had got', 'Slow, specific, and a kindness', { energy: -8, writingQuality: 5, academicCapital: 3 },
        { skill: { writing: 1 }, result: 'Three hours on a paper by someone you will never meet, with two concrete suggestions and a sentence naming the part that is good. You have just done for a stranger the thing nobody did for you.' }),
      c('fast', 'Score it and move on', 'Ninety minutes; the field runs on this', { energy: -3, stress: -2 },
        { personality: 'cynic', result: 'Weak reject, four sentences, submitted at 11:52 on Sunday. It is exactly the review you complained about in March. Now you know how it happens.' }),
      c('harsh', 'Be as hard on it as your last reviewer was on you', 'Cathartic; the wrong kind of catharsis', { energy: -4, stress: -6, hope: -3 },
        { personality: 'cynic', achievement: 'reviewer2', result: 'It feels good for about eleven minutes. You reread it on Monday and soften two sentences, which is the part of this that matters.' }),
    ] },

  // ── The long corridor ──────────────────────────────────────────────────────────────────────
  { id: 'mid_undergrad_asks', title: 'An undergraduate asks what you do', category: 'department', scene: 'campus', probability: 0.67, cooldown: 8, conditions: { ...MID },
    text: 'They are nineteen, they are considering a PhD, and they ask what you actually do all day. It is a completely sincere question and you have about forty seconds.',
    choices: [
      c('honest', 'Tell them the truth, including the bad parts', 'Costs nothing; changes a life, possibly', { energy: -2, hope: 3 },
        { result: 'You say the thing about the middle years. They go quiet and then ask a much better question. Four years from now they will remember this conversation and you will not.' }),
      c('sell', 'Give them the good version', 'Kind, and slightly a lie', { energy: -2, academicCapital: 2 },
        { result: 'You describe the version on the website. They are excited. You watch yourself doing it and file the feeling away.' }),
      c('reflect', 'Try to answer it properly and discover you cannot', 'A question that follows you home', { stress: 4, hope: -2, novelty: 4 },
        { result: 'You get three sentences in and realise you cannot compress two years into forty seconds, and that the inability to say it simply might be a problem with the work rather than with the forty seconds.' }),
    ] },
  { id: 'mid_cohort_thins', title: 'Your cohort is smaller than it was', category: 'peer', scene: 'campus', probability: 0.62, cooldown: 12, conditions: { minMonth: 22, maxMonth: 50 }, actor: { type: 'peer' },
    text: ['You started with eleven. There are seven. Nobody announced any of the four and each of them has a completely different story, and two of them are doing better than you are.',
      'The cohort group chat has been quiet since February. Someone posts a job announcement. Six people react. Nobody types.'],
    choices: [
      c('reach', 'Message the one you were closest to', 'Two hours you did not have', { energy: -4, hope: 6, stress: -6 }, { peerBond: 8, result: 'They are fine. Genuinely fine, and doing something they like, and it takes forty minutes of talking before either of you admits you were worried the other one had judged them.' }),
      c('count', 'Do the arithmetic', 'A number you cannot unsee', { hope: -7, stress: 6, career: 3 }, { personality: 'cynic', result: 'Four out of eleven, at month twenty-six. You look up whether that is normal. It is normal. That is somehow not the reassurance it sounds like.' }),
      c('nothing', 'Let it be', 'The most common response, and not a bad one', { stress: -2 }, { result: 'You do not have the capacity this month, and knowing that about yourself is not nothing.' }),
    ] },
  { id: 'mid_wedding', title: 'Everybody you know is doing something else', category: 'life', scene: 'home', probability: 0.64, cooldown: 10, conditions: { ...MID },
    text: ['A wedding, a promotion, a mortgage, a baby, in four separate messages, in one week. You are on a stipend, in a shared flat, three years into something you cannot explain at a table.',
      'Your friend from undergrad has been made a senior something. You look up what they earn. You do this at eleven at night and then cannot sleep.'],
    choices: [
      c('go', 'Go to the thing and enjoy it', 'Money and a weekend; a life', { money: -420, energy: -4, hope: 9, stress: -8 }, { flags: { social: true }, result: 'You have a genuinely good time and nobody asks you when you finish, except one person, who asks kindly, and you answer honestly and it is fine.' }),
      c('skip', 'Send a message and stay in', 'Progress; a small absence that accrues', { progress: 6, draft: 4, hope: -5 }, { personality: 'grinder', result: 'You get real work done. The photographs appear on Sunday and you look at them for longer than you meant to.' }),
      c('reframe', 'Do the arithmetic on what you are buying', 'The honest ledger', { hope: -3, confidence: 5, career: 3 },
        { result: 'Six years of lower income for a thing almost nobody gets to do. Written down, it is a defensible trade and it does not feel like one in a week with four messages in it.' }),
    ] },
  { id: 'mid_expertise', title: 'You are the person who knows', category: 'lab', scene: 'lab', probability: 0.62, cooldown: 9, conditions: { minMonth: 24, maxMonth: 50 },
    text: ['A second-year asks you a question and you answer it completely, without checking anything, in about eleven seconds. Then you stand there for a moment afterwards.',
      '{advisor} says “ask {you}, they know that part” — about a part you did not know existed two years ago.'],
    choices: [
      c('teach', 'Sit down and explain it properly', 'An hour; a person who will remember', { energy: -5, teaching: 5, labBond: 6, hope: 4 }, { skill: { teaching: 1 }, achievement: 'mentor', result: 'It takes an hour and you enjoy every minute of it, which is information about what you should do next that you will ignore for another two years.' }),
      c('point', 'Point them at the documentation', 'Four minutes; the honest limit', { energy: -1, stress: -1 }, { result: 'There is no documentation. You both know there is no documentation. You write three lines of it, which is more than existed this morning.' }),
      c('notice', 'Notice what has happened to you', 'The quiet one', { confidence: 8, hope: 6, readiness: 4 },
        { result: 'Somewhere in the last two years you became one of maybe four hundred people on earth who understands this properly. There was no day it happened and nobody sent an email.' }),
    ] },

  // ── The advisor, at length ─────────────────────────────────────────────────────────────────
  { id: 'mid_forgot', title: 'They have forgotten a decision you made together', category: 'advisor', scene: 'office', speaker: 'advisor', probability: 0.67, cooldown: 7, conditions: { ...MID },
    text: ['“Why are you using that split?” Because you agreed it in March. There is an email. You are deciding, right now, whether to find the email.',
      '{advisor} proposes, with enthusiasm, the approach you spent six weeks talking them out of in the spring.'],
    choices: [
      c('email', 'Find the email', 'Correct, and it costs something', { energy: -3 },
        { check: { rel: 'trust', difficulty: 55 }, successEffects: { trust: 4, confidence: 4 }, failureEffects: { satisfaction: -5, conflict: 4 },
          successText: '“So we did.” They laugh, genuinely, and it is fine, and now they trust your memory more than their own on this project — which is a real transfer of something.',
          failureText: 'Being right in this particular way turns out to cost more than it buys, and you can watch it costing.' }),
      c('redo', 'Just do it their way again', 'Cheap now; expensive by the fourth time', { energy: -6, progress: -5, stress: 4 }, { personality: 'peoplePleaser', result: 'You do it again. It gives the same answer it gave in March. Nobody remembers this happening, including, eventually, you.' }),
      c('doc', 'Start a decisions file', 'Two minutes a week, for the rest of the degree', { energy: -2, reproducibility: 5, stress: -5 }, { flags: { decisionsFile: true }, result: 'One shared document, dated entries, one line each. It will resolve nine arguments over the next three years and neither of you will ever mention that it is doing that.' }),
    ] },
  { id: 'mid_their_idea', title: 'Your idea comes back with their name on it', category: 'advisor', scene: 'office', speaker: 'advisor', probability: 0.57, cooldown: 12, conditions: { minMonth: 20, maxMonth: 50, minProgress: 18 },
    text: 'In the group meeting they describe the direction — the one you proposed in a one-to-one in November — as something "we should look at." Not maliciously. They have genuinely forgotten where it came from, which is worse and also better.',
    choices: [
      c('claim', 'Say, lightly, that you had suggested it', 'True; how it lands is a coin flip', { energy: -2 },
        { check: { skill: 'communication', difficulty: 54 }, successEffects: { confidence: 6, satisfaction: 4, trust: 3 }, failureEffects: { conflict: 5, satisfaction: -4 },
          successText: '“Did you? Good.” Said without embarrassment, and afterwards they attribute it correctly, twice, unprompted.',
          failureText: 'It comes out as a claim rather than a note, in front of the lab, and the temperature of the room changes.' }),
      c('let', 'Let it go and get the project', 'The trade almost everyone makes', { progress: 6, satisfaction: 4, confidence: -4 }, { personality: 'peoplePleaser', result: 'You get to work on it, with their enthusiasm behind it, which is worth more than the credit and costs a specific thing you will feel in year five.' }),
      c('write', 'Put it in writing tonight', 'Quiet, and it works', { energy: -3, academicCapital: 3, confidence: 3 }, { result: 'A short email: "Following up on the direction from November — here is the plan." Dated, attributed, unaggressive. This is the entire technique and nobody teaches it.' }),
    ] },
  { id: 'mid_praise_landed', title: 'They say something good and mean it', category: 'advisor', scene: 'office', speaker: 'advisor', probability: 0.52, cooldown: 12, conditions: { ...MID, minSatisfaction: 46 },
    text: 'Not at a meeting. In a corridor, about a specific thing, unprompted, with a detail in it that proves they actually read it.',
    choices: [
      c('take', 'Take it', 'Harder than it sounds', { hope: 10, confidence: 8, stress: -6 }, { result: 'You say thank you and do not immediately explain what is wrong with the thing they praised. This takes conscious effort and is a skill.' }),
      c('deflect', 'Deflect it', 'The reflex', { hope: 2, confidence: -2 }, { personality: 'perfectionist', result: 'You list two problems with it before they have finished the sentence. They look briefly tired. You will think about their face later.' }),
      c('ask', 'Ask what specifically', 'Turns a compliment into information', { hope: 6, writingQuality: 4, readiness: 3 }, { result: '“The framing in section three.” Now you know which of your instincts is the good one, which is worth more than the compliment was.' }),
    ] },

  // ── Money, admin, and the building ─────────────────────────────────────────────────────────
  { id: 'mid_desk_move', title: 'The lab is moving offices', category: 'department', scene: 'campus', probability: 0.57, cooldown: 14, conditions: { ...MID },
    text: 'A reorganisation nobody asked for. You have two weeks, a roll of tape, and a decision about which of four boxes of printed papers you have not opened since year one.',
    choices: [
      c('purge', 'Throw almost all of it away', 'Lighter; a small grief', { energy: -4, stress: -6, hope: 3 }, { result: 'Two boxes to recycling, including every printed paper you highlighted in year one and never read again. The highlighting was the reading. You knew that.' }),
      c('window', 'Fight for the desk by the window', 'Petty; correct', { energy: -3, stress: 4, hope: 6 }, { labBond: -3, personality: 'riskTaker', result: 'You get it. Somebody else does not. This will matter to your mood for two years, which is an embarrassing amount, and it is true.' }),
      c('whatever', 'Take whatever desk is left', 'No fight; no window', { energy: -2, labBond: 4, hope: -3 }, { personality: 'peoplePleaser', result: 'You end up next to the printer. For twenty-six months you will be the person who knows the printer.' }),
    ] },
  { id: 'mid_reimbursement', title: 'The reimbursement from March', category: 'department', scene: 'portal', probability: 0.62, cooldown: 7, conditions: { ...MID },
    text: ['Four hundred and eleven dollars, submitted in March, rejected in May for a missing form, resubmitted in June, and currently in a state the portal describes as "pending pending."',
      'The travel office needs the original boarding pass. It was a phone. There was no boarding pass. There has not been a boarding pass since 2019.'],
    choices: [
      c('chase', 'Chase it properly', 'Three emails and a phone call', { energy: -4, stress: 3, money: 411 }, { result: 'Paid in eleven days after you cc the department administrator, who was the answer the entire time and whom nobody told you about.' }),
      c('drop', 'Let it go', 'Four hundred dollars for your Tuesday back', { stress: -4, hope: -3 }, { personality: 'boundarySetter', result: 'You write it off. It is the correct decision at your hourly rate and it will annoy you at intervals for a year.' }),
      c('advisor', 'Ask your advisor to lean on it', 'Spends a little of something else', { energy: -1, money: 411, satisfaction: -3 }, { result: 'One email from a professor and it is paid on Thursday. You have learned exactly how much a title is worth in this building, and it is worth four hundred and eleven dollars in about nine minutes.' }),
    ] },
  { id: 'mid_ta_again', title: 'You are teaching again', category: 'department', scene: 'campus', probability: 0.62, cooldown: 10, conditions: { ...MID, season: 'teaching' },
    text: ['The assignment says two sections. The reality is two sections, office hours, and the grading of two hundred and forty problem sets, which was not in the assignment.',
      'The professor teaching it has taught it for nineteen years and has strong views about how it should be taught, all of which arrive on the Friday before it starts.'],
    choices: [
      c('good', 'Actually teach it well', 'Costs the research; a thing you will be proud of', { energy: -10, teaching: 8, progress: -6, hope: 5 }, { skill: { teaching: 1 }, result: 'Your evaluations are the best in the department and no committee in your future will ever ask to see them.' }),
      c('minimum', 'Do the minimum competently', 'The rational allocation', { energy: -5, teaching: 2, progress: 3 }, { personality: 'grinder', result: 'It is fine. Nobody complains. Two students who would have caught fire do not, and you will never know which two.' }),
      c('swap', 'Try to swap out of it', 'A favour asked, and a precedent', { energy: -3, satisfaction: -4, progress: 5 }, { check: { rel: 'satisfaction', difficulty: 58 }, successEffects: { stress: -8 }, failureEffects: { stress: 6, conflict: 3 }, successText: 'They find someone. You do not ask what it cost them to find someone.', failureText: '“Everyone is teaching this term.” Everyone is teaching this term.' }),
    ] },

  // ── The middle of the middle ───────────────────────────────────────────────────────────────
  { id: 'mid_why_again', title: 'A Tuesday in year three', category: 'life', scene: 'lab', probability: 0.67, cooldown: 8, conditions: { minMonth: 26, maxMonth: 46 },
    text: ['Nothing is wrong. The project is fine, the advisor is fine, the money is fine. You have been at your desk for two hours and have not opened anything.',
      'You realise you cannot remember what you were excited about. Not that you are not excited — that you cannot remember the content of the original excitement.'],
    choices: [
      c('walk', 'Go outside for an hour in the middle of the day', 'Illegal-feeling; effective', { energy: 8, stress: -10, hope: 5 }, { personality: 'boundarySetter', result: 'Nobody notices. Nobody was ever going to notice. You have been performing presence for an audience that does not exist.' }),
      c('reread', 'Reread your own statement of purpose', 'A conversation with a stranger', { hope: 6, novelty: 4, confidence: -2 },
        { result: 'The person who wrote it was naive about six things and right about one, and the one is still the reason. You had forgotten the reason. It was in a document on your own computer the whole time.' }),
      c('push', 'Push through it', 'Sometimes this is correct', { energy: -6, progress: 6, stress: 5, hope: -3 }, { personality: 'grinder', result: 'You get two hours of real work done after the two empty ones, which is how most days in year three actually go and nobody says so.' }),
    ] },
  { id: 'mid_advisor_human', title: 'Something is going on with them', category: 'advisor', scene: 'office', probability: 0.54, cooldown: 12, conditions: { ...MID },
    text: ['Three cancellations, a short email, and a meeting where they were not really in the room. It is not about you and you have spent a week assuming it is about you.',
      'They mention, in passing, in the middle of a sentence about your figures, that their father is ill. Then they carry on about the figures.'],
    choices: [
      c('space', 'Give them room without making it a thing', 'Costs you a month of momentum', { progress: -4, stress: 3, trust: 8, satisfaction: 5 }, { result: 'You handle your own work for six weeks and do not ask for anything. They notice. They do not say so for about a year, and then they do.' }),
      c('ask', 'Ask if they are alright', 'A sentence most students never say to an advisor', { energy: -2 },
        { check: { advisor: 'caring', difficulty: 50 }, successEffects: { trust: 12, satisfaction: 8, hope: 5 }, failureEffects: { satisfaction: -3, stress: 3 },
          successText: 'They tell you. Briefly, and then they change the subject, and something in the relationship is different afterwards in a way neither of you names.',
          failureText: '“Fine, fine.” The wall goes back up so fast that you can see the shape of what is behind it.' }),
      c('own', 'Use the gap to become independent', 'The silver lining nobody wants', { energy: -6, progress: 8, confidence: 7, dependency: -8 }, { personality: 'grinder', result: 'Six weeks of no supervision turn out to be the most productive six weeks of the degree, which is a fact you will find annoying for years.' }),
    ] },
  { id: 'mid_conference_alone', title: 'You go to the talk alone', category: 'peer', scene: 'campus', probability: 0.57, cooldown: 9, conditions: { ...MID },
    text: 'A visiting speaker in your exact area. Nobody else from the lab comes, because everybody has a deadline, because everybody always has a deadline.',
    choices: [
      c('question', 'Ask a question in front of forty people', 'Four seconds of adrenaline', { energy: -3 },
        { check: { stat: 'confidence', difficulty: 52 }, successEffects: { confidence: 8, academicCapital: 5, hope: 4 }, failureEffects: { confidence: -5, stress: 5 },
          successText: 'They say "that is a good question" and mean it, and answer for two minutes, and find you afterwards.',
          failureText: 'It comes out backwards. They answer a question you did not ask. You sit down at approximately the speed of light.' }),
      c('after', 'Wait and talk to them afterwards', 'Fewer people; more signal', { energy: -4, academicCapital: 4, novelty: 4 },
        { result: 'Eleven minutes by the coffee urn. They tell you which of their results they do not believe, which is a thing people only say standing up, in person, to one other person.' }),
      c('leave', 'Slip out at the end', 'An hour spent; nothing risked', { energy: -2, readiness: 2, novelty: 2 }, { result: 'A good talk, absorbed, and no trace of you in the room. This is the default and it is why the corridor matters more than the talk.' }),
    ] },
];
