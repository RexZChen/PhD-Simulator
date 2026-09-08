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

  // ── The decision nobody schedules ──────────────────────────────────────────────────────────
  //
  // Nothing in a PhD tells you when to stop collecting results and start deciding what the story
  // is. The people who finish in five years are the ones who decided early and then defended the
  // decision; the people who finish in eight are the ones who kept waiting to be told. There is no
  // form for it, no committee meeting, no email. So there is no prompt for it here either: this
  // scene is `scheduledOnly` and the only way to reach it is to notice a line in the Manager that
  // nothing draws attention to. Finding it is the mechanic.
  { id: 'thesis_decide', title: 'What the thesis is', category: 'research', scene: 'lab',
    probability: 1, scheduledOnly: true, once: true, cooldown: 99,
    text: ['You have papers, or the beginnings of them, and they are about adjacent things. Nobody has asked you what the dissertation is. Nobody is going to — the proposal will ask, in eighteen months, and by then the answer will be whatever the papers happen to have been.\n\nYou could decide now instead. Not what you have done. What it is for.',
      'The whiteboard has three things on it and a line connecting two of them. The third one is the interesting one and it does not connect to anything yet.\n\nThere is no form for this. There is no meeting for it. There is a version of the next three years where you know what you are building, and a version where you find out afterwards, and the only difference between them is an afternoon.'],
    choices: [
      c('question', 'Name the question, and let the results be evidence for it', 'The version that finishes. Also the version that has to say no to things.', { hope: 8, readiness: 6, energy: -4, confidence: 5 },
        { decidesThesis: 'question', personality: 'independent', achievement: 'decidedit',
          result: 'You write one sentence and it takes four hours and it is not a good sentence yet. But everything after this is either evidence for it or is not, and that is a question you can now ask about a piece of work, which you could not this morning.\n\nNobody notices. There is no version of this where anybody notices.' }),
      c('method', 'Name the method, and let the problems be applications of it', 'Safer, and it ages differently', { hope: 6, readiness: 5, energy: -4 },
        { decidesThesis: 'method', personality: 'perfectionist', achievement: 'decidedit',
          result: 'A thesis about a technique is easier to write and easier to examine and it dates faster, and you know all three of those things and you pick it anyway, because it is true about what you have actually been doing.\n\nIt turns out to be the right call. It also turns out to be the reason a search committee will ask, in four years, what you are interested in beyond it.' }),
      c('artefact', 'Name the thing you are building, and let the papers describe it', 'The systems answer. The examiners will want it to be more than the thing.', { hope: 7, readiness: 4, energy: -5, progress: 5 },
        { decidesThesis: 'artefact', personality: 'grinder', achievement: 'decidedit',
          result: 'The dissertation is the system and the chapters are the parts of it, which is honest and which means that when it works you are done and when it does not you are also done, differently.\n\nYou put the architecture diagram on the second page. You will redraw it eleven times and the eleventh one will be the first page.' }),
      c('later', 'Not yet — there is a result coming that might change it', 'The most reasonable sentence in this file', { stress: -3 },
        { flags: { deferredThesis: true },
          result: 'It is entirely reasonable. The result does come, in about five months, and it is good, and it does not change what the thesis is, because there was not one yet for it to change.\n\nYou will have this same afternoon again. Possibly several times.' }),
    ] },


  // ── What the optional answers actually buy ─────────────────────────────────────────────────
  // Each of these exists only for a player who told the questionnaire something. Answering
  // "rather not say" costs nothing and removes nothing except these particular conversations.
  { id: 'opt_the_question', title: 'The question you came here with', category: 'research', scene: 'lab',
    probability: .55, once: true, cooldown: 99, conditions: { minMonth: 26, maxMonth: 52, whyHere: ['question'] },
    text: 'You came here with one question. You are three years in and you have not worked on it once — everything has been adjacent to it, funded near it, publishable beside it.\n\nIt is still there. You can still state it in one sentence.',
    choices: [
      c('go', 'Spend a month on it', 'Nobody will fund this month', { energy: -12, progress: -8, novelty: 14, hope: 12, satisfaction: -4 },
        { flags: { workedOnIt: true }, personality: 'independent',
          result: 'Four weeks, unfunded, unsanctioned, on the actual question. You get nowhere near an answer and you come back knowing why it is hard, which is the first real progress anyone has made on it including you.' }),
      c('fold', 'Fold it into the current project', 'The compromise that usually works', { novelty: 6, progress: 4, hope: 4 },
        { result: 'You bend the current project three degrees toward it. Nobody notices. It is now about eleven per cent your question, which over four years is not nothing.' }),
      c('later', '“After the degree.”', 'The most common answer, and it is usually true', { hope: -4, stress: -3 },
        { result: 'And you might. People do. It sits in a file called `later/` with nine other things and about one of those ten gets opened.' }),
    ] },
  { id: 'opt_prove_it', title: 'The person you were proving it to', category: 'life', scene: 'home',
    probability: .5, once: true, cooldown: 99, conditions: { minMonth: 30, whyHere: ['prove'] },
    text: 'You came here to prove you could. Somewhere in the last year that stopped being about them and you did not notice it happening, and now you cannot work out whether that is growth or just fatigue.',
    choices: [
      c('own', 'Decide it is yours now', 'A quiet, load-bearing reframe', { hope: 10, confidence: 8, stress: -8 },
        { result: 'The motivation that got you in is not the one that gets you out, and swapping it over is a thing almost nobody notices doing, and it is the reason some people finish.' }),
      c('tell', 'Tell them how it is going', 'They will not understand and will be delighted', { energy: -3, hope: 6 },
        { result: 'They understand about a fifth of it and are proud of all of it, which turns out to be exactly the right ratio and not what you thought you wanted.' }),
      c('still', 'Notice you are still proving it', 'Honest', { stress: 5, confidence: 4, hope: -3 },
        { personality: 'grinder', result: 'Still them. Four years later, in a different country, at eleven at night. That is a lot of fuel and it does burn dirty.' }),
    ] },
  { id: 'opt_partner_far', title: 'Two cities', category: 'life', scene: 'home',
    probability: .5, cooldown: 10, conditions: { minMonth: 14, household: ['partnerFar'] },
    text: ['A flight every six weeks, a shared calendar, and a running argument about whose turn it is that neither of you is actually having.',
      'They ask, not for the first time, roughly how long this has left. You give the honest number. There is a pause on the line that is about four seconds longer than the connection.'],
    choices: [
      c('go', 'Book the flight you cannot afford', 'Money and a weekend; the relationship', { money: -480, energy: -4, hope: 10, stress: -8 }, { flags: { social: true } }),
      c('plan', 'Make an actual plan with dates in it', 'Harder than flying', { energy: -4, stress: -6, hope: 6 },
        { flags: { twoBodyPlan: true }, result: 'Two hours and a spreadsheet and one difficult sentence each. It does not solve it. It converts a dread into a problem, which is a much better category of thing.' }),
      c('work', 'Stay and work the weekend', 'It adds up in both directions', { progress: 8, draft: 5, hope: -6 }, { personality: 'grinder' }),
    ] },
  { id: 'opt_small_child', title: 'The nursery closes at six', category: 'life', scene: 'home',
    probability: .55, cooldown: 8, conditions: { minMonth: 10, household: ['kids'] },
    text: ['Six o\'clock is not a preference. It is a fence, and the deadline is on the other side of it, and the lab has a culture of ordering food at seven.',
      'They are ill again. Nursery will not take them. It is the third time this term and the third time you have moved a meeting and said the words "sorry, childcare" to somebody who said "of course" and meant it and also noted it.'],
    choices: [
      c('fence', 'Hold the fence', 'The correct call; visibly costly', { energy: 4, stress: -6, progress: -5, hope: 6 },
        { personality: 'boundarySetter', result: 'You leave at ten to six every day for four years. Everybody adjusts. Two people privately organise their own lives better because you did it first and never said a word about it.' }),
      c('nights', 'Work after they are asleep', 'It works and it is not free', { energy: -9, progress: 8, health: -3, stress: 5 },
        { personality: 'grinder', result: 'Nine until one, four nights a week. The work is real and it is the worst-quality work you do, and you are the only person who will ever know which parts of the thesis were written at midnight.' }),
      c('say', 'Say out loud, once, what your constraints are', 'A sentence that reorganises a lab', { energy: -2 },
        { check: { advisor: 'caring', difficulty: 45 },
          successEffects: { satisfaction: 6, trust: 8, stress: -10 }, failureEffects: { satisfaction: -4, stress: 5 },
          successText: '“Then we do not schedule things after five.” Said once, in front of the lab, and it holds for three years because they said it in front of the lab.',
          failureText: '“Of course, whatever you need.” The Thursday meeting stays at five thirty.' }),
    ] },
  { id: 'opt_parent_care', title: 'The call from home', category: 'life', scene: 'home',
    probability: .5, cooldown: 9, conditions: { minMonth: 12, household: ['parent'] },
    text: 'It is not an emergency this time. It is the fourth call this month that is not an emergency, and the arithmetic of being nine hundred miles away is not improved by any of them being fine.',
    choices: [
      c('go', 'Go for a week', 'The week; and you would go again', { money: -380, energy: -6, progress: -8, hope: 8, stress: -6 },
        { result: 'A week of driving to appointments and sitting in waiting rooms and being, for seven days, the person you are outside of this. The project is where you left it. So is everything else.' }),
      c('systems', 'Build the systems so you do not have to go', 'Unromantic; it is what actually helps', { energy: -6, money: -220, stress: -8 },
        { flags: { careSystems: true }, result: 'A pill organiser, a neighbour with a key, and a shared calendar. It is the least emotional response available and it is the one that gets you both through the next two years.' }),
      c('carry', 'Carry it', 'What most people do', { stress: 9, hope: -5, energy: -3 }, { result: 'You carry it. Nobody in the building knows. It shows up as being slightly slower at everything, which reads to everyone else as being slightly slower at everything.' }),
    ] },
  { id: 'opt_fraud', title: 'The specific two a.m. one', category: 'life', scene: 'home',
    probability: .5, cooldown: 9, conditions: { minMonth: 16, fear: ['fraud'] },
    text: 'It arrives the way it always does: not as a thought but as a certainty, fully formed, at two in the morning, that everybody else understands something you have been faking for three years.',
    choices: [
      c('evidence', 'Go and look at what you have actually done', 'The only thing that works on this', { energy: -3, confidence: 8, stress: -8 },
        { result: 'A paper, a talk, four people who cite you, and a second-year who asks you things. It does not dissolve the feeling. It sits next to it, which turns out to be enough.' }),
      c('say', 'Say it to one person', 'It is more common than the building admits', { energy: -2, hope: 8, stress: -9 },
        { labBond: 5, result: 'They say "oh, constantly," in the tone of somebody discussing the weather, and something in your chest lets go about four inches.' }),
      c('work', 'Work until it stops', 'It does stop. It comes back.', { energy: -7, progress: 6, stress: 4, health: -2 }, { personality: 'grinder' }),
    ] },
  { id: 'opt_dealbreaker', title: 'The line you drew before you started', category: 'divergence', scene: 'home',
    probability: .6, once: true, cooldown: 99, conditions: { minMonth: 30, minStress: 62, dealbreaker: ['health', 'money', 'meaning'] },
    text: 'Before any of this you decided what would make you leave. You wrote it down, or you said it to somebody, and you have not thought about it in two years.\n\nYou are close to it. Not past it. Close enough to have noticed.',
    choices: [
      c('hold', 'Hold the line you drew', 'Trust the person who drew it', { hope: 8, stress: -12, energy: 6, progress: -4 },
        { flags: { heldTheLine: true }, personality: 'boundarySetter', achievement: 'heldtheline',
          result: 'You stop, deliberately, before the thing you said you would stop before. The version of you who set that line had more perspective than the version reading it, which is exactly why you set it then.' }),
      c('move', 'Move the line', 'Everyone does this. It is worth noticing you did.', { stress: 6, hope: -4, progress: 6 },
        { personality: 'grinder', result: 'You move it. Not far. You will move it again, not far, and the distance is only visible from about four years away.' }),
      c('reread', 'Go and read what you actually wrote', 'A conversation with a more sensible person', { energy: -2, hope: 5, confidence: 4 },
        { result: 'They were right about two things and naive about one, and the two things are still true, and you had forgotten you knew them.' }),
    ] },

  // ── The year the money went ────────────────────────────────────────────────────────────────
  // Fired in 100% of runs at month 0 before this: `urgent` bypasses the probability roll and there
  // were no conditions at all, so the scene about losing your funding arrived before you had any.
  // A grant not renewing is a real and common thing; it happens in the middle years, to about a
  // third of students, and never in the first term.
  { id: 'ra_lost', title: 'The renewal did not come through', category: 'advisor', scene: 'office', speaker: 'advisor', urgent: true,
    probability: 1, once: true, cooldown: 99,
    conditions: { minMonth: 16, maxMonth: 54, maxFunding: 54 },
    text: ['{advisor} closes the door, which they do not usually do.\n\n“The renewal did not come through. I have appealed and I will not win. I can cover you until the end of May and after that the department will pick you up as a TA.”\n\nA pause. “You will not lose any money. I want to be clear about that first, because everybody hears the other thing first.”',
      'It is in the budget spreadsheet before it is in a conversation. Your name moves from one column to another, and the column it moves to is the one with the course numbers in it, and the total at the bottom does not change.'],
    choices: [
      c('thanks', 'Thank them for keeping you whole', 'It genuinely was not nothing', { satisfaction: 6, trust: 6, hope: -4 },
        { hardTa: true, result: 'They spent three weeks arranging this and did not mention that until you thanked them. Somebody in your cohort at another school found out by not being paid.' }),
      c('ask', 'Ask what it means for the timeline', 'The question with the real answer in it', { energy: -2, stress: 4 },
        { hardTa: true, result: '“Realistically? A year.” They say it straight, which is the kindest available version, and neither of you pretends the year is going to come back from somewhere.' }),
      c('other', 'Ask whether there is another lab with money', 'Reasonable. Also a sentence with a shape.', { stress: 6, satisfaction: -6 },
        { hardTa: true, flags: { lookedElsewhere: true },
          result: 'They answer it seriously, name two people, and offer to make the call. And something has been said in the room that cannot be unsaid, and both of you carry it into the next meeting.' }),
      c('loan', 'Ask about a loan instead, to keep the research time', 'Buys the year back. With money you do not have.', { stress: 8, hope: 4, money: 11000 },
        { hardTa: true, flags: { hardTaLoan: true }, personality: 'riskTaker',
          result: 'It is possible. It is about eleven thousand dollars for the year, at a rate that is not designed for people on a stipend, and it buys you the only thing nobody else can sell you.' }),
    ] },
  { id: 'ta_hell_grading', title: 'Two hundred and forty problem sets', category: 'department', scene: 'campus',
    probability: .8, cooldown: 3, conditions: { flag: 'hardTA' },
    text: ['The other TA has stopped answering messages. There is no third TA. The professor is at a workshop and has said, warmly, to use your judgement.',
      'You have been grading since seven. It is now ten past eleven and you are on number one hundred and sixty and every one of them has made the same mistake, which means the lecture was the problem, which means you should say something, which is not your call.'],
    choices: [
      c('rubric', 'Build a rubric and grade fast', 'Four hours to save twenty', { energy: -7, teaching: 4, stress: -4 },
        { result: 'It takes four hours to build and saves twenty over the term, and you will hand it to the next TA, who will not know that it took four hours.' }),
      c('careful', 'Give every one of them a real comment', 'The thing you would have wanted', { energy: -12, teaching: 7, progress: -4, hope: 3 },
        { skill: { teaching: 1 }, result: 'Eleven hours. Two students email to say it was the first useful feedback they have had at this university. You put those emails in a folder that has four things in it.' }),
      c('fast', 'Tick, tick, tick', 'Nobody checks', { energy: -3, teaching: -2, stress: 3 },
        { personality: 'cynic', result: 'Ninety minutes. Nobody checks. Nobody has ever checked. You are slightly worse at your job than you were in September and you can feel the exact shape of the compromise.' }),
    ] },
  { id: 'ta_hell_research', title: 'You open the project file', category: 'research', scene: 'lab',
    probability: .8, cooldown: 3, conditions: { flag: 'hardTA' },
    text: 'For the first time in five weeks. You spend nineteen minutes remembering what the variables mean and then the office hours you moved twice start.',
    choices: [
      c('hour', 'Take one hour, every week, defended', 'A very small amount; the difference between stalled and dead', { energy: -4, progress: 5, stress: -4 },
        { flags: { defendedHour: true }, personality: 'boundarySetter',
          result: 'One hour a week is nothing and it is not nothing: it means that in May the project is where it was in September rather than somewhere you cannot find.' }),
      c('none', 'Close it again', 'Honest about the capacity you have', { energy: 3, progress: -6, hope: -5 },
        { result: 'You are teaching seventeen hours a week and grading nine. There is no version of this where the research also happens, and pretending otherwise is how people end up doing neither.' }),
      c('nights', 'Take it out of sleep', 'It works. For about six weeks.', { energy: -10, progress: 9, stress: 9, health: -5 },
        { personality: 'grinder', result: 'It works for about six weeks. You will be able to point to what you did in those six weeks and you will not be able to point to what it cost, because that arrives in March.' }),
    ] },
  { id: 'ta_hell_seen', title: 'Somebody notices what is happening to your year', category: 'department', scene: 'campus',
    probability: .6, cooldown: 5, conditions: { flag: 'hardTA' },
    text: ['A committee member, in the corridor: “I have not seen anything from you since the autumn.” They do not mean it as an accusation and it is not received as one.',
      'A first-year, sincerely: “How do you get any research done?” You do not have an answer that is both true and encouraging, so you give the encouraging one.'],
    choices: [
      c('explain', 'Explain exactly what happened to the funding', 'The record matters later', { energy: -2, career: 3 },
        { flags: { taOnRecord: true },
          result: 'They did not know. They say so, and they write it down, and in two years when somebody asks why year four is thin there is a person in the room who can answer it.' }),
      c('shrug', 'Shrug it off', 'Easier; nobody remembers the reason', { hope: -4, stress: 3 },
        { result: 'The gap in the record stays a gap in the record. Nobody is deliberately unfair about it. Nobody has the context either, and context does not survive on its own.' }),
      c('ask', 'Ask them to raise it with the department', 'Uses somebody else’s standing', { energy: -3, stress: 4 },
        { check: { rel: 'satisfaction', difficulty: 50 },
          successEffects: { energy: 8, progress: 5, hope: 6 }, failureEffects: { hope: -3 },
          successText: 'They do. There is a partial RA line for the spring from a teaching-relief fund nobody had mentioned. It is one course lighter and one course is enormous.',
          failureText: 'They mean to. Term ends. It is a genuinely busy building and this was, for them, one corridor conversation.' }),
    ] },

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
