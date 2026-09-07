// The things that are specific to a US computer-science PhD.
//
// Every discipline has a shape and this one's is a conference calendar: a deadline in a timezone
// that exists so that nobody has to sleep, a preprint server that decides priority before any
// committee does, a rebuttal you write into a window where the scores move in front of you, and a
// publication list that is half other people's papers with your name fourth on them.
//
// Alongside it, the two things the institution reliably does to you — the letter each April that
// says satisfactory, and, if you arrived on an F-1, a fortnight in September where the number you
// need to be paid cannot be applied for until you have been in the country long enough to need it.
//
// Nothing here is a joke about academia. These are load-bearing facts of the degree, written as
// the scenes in which a person meets them for the first time.
const c = (id, text, hint, effects = {}, extra = {}) => ({ id, text, hint, effects, ...extra });
export default [

  // ── The calendar ───────────────────────────────────────────────────────────────────────────
  { id: 'cs_aoe', title: 'Anywhere on Earth', category: 'crunch', scene: 'lab', probability: .8, weight: 5, cooldown: 6,
    conditions: { tempo: 'week', crunch: 'deadline' },
    text: ['It is twenty to midnight and the abstract is not written and somebody says, without looking up, that it is Anywhere on Earth. Which is 3 a.m. tomorrow, which means there is a whole extra day sitting inside a clock that everyone in this room has known about for four years and nobody has ever once planned around.\n\nUTC minus twelve. Baker Island: no airstrip, no fresh water, population zero, and a field of forty thousand people arranging its sleep around it twice a year. Somebody opens a converter in a second tab, types it in, and reads the number out loud, and three people write it down as though they had not each already done the same sum privately at nine o’clock.',
      'The countdown on the venue page says 27:41:06, which is not a number of hours that fits inside a day. A first-year asks how that can be and gets it explained badly by one person, then correctly by another, then a third time with a diagram on the back of a printout, and says “so it is really just tomorrow afternoon,” and is right, and is told they are wrong.\n\nThe abstract is a title, six sentences and a claim you have not measured yet. {venue} closes abstracts a week before the paper, which is a rule that exists to stop exactly what this room is about to do.'],
    choices: [
      c('extra', '“So we have until tomorrow afternoon”', 'Fifteen hours that did not exist at nine o’clock', { draft: 9, evidence: 4, energy: -10, stress: 8 },
        { personality: 'grinder',
          result: 'Fifteen more hours. Nine go on related work, four on a figure that none of the three reviews will mention, and two on a bug in the seed handling, which is the only one of the three that mattered. By next winter you will be the person who says it, without looking up, to somebody else.' }),
      c('abstract', 'Register the abstract now, in twenty minutes, badly', 'It can be edited until the paper deadline. Almost nobody remembers this.', { energy: -4, stress: -3 },
        { check: { skill: 'writing', difficulty: 48 },
          successEffects: { draft: 6, writingQuality: 4, confidence: 4 }, failureEffects: { stress: 7, hype: 5 },
          successText: 'Six sentences and a title with a colon in it, registered at 11:58. Two of the six survive to camera-ready unchanged, which is a better rate than anything else you write this year.',
          failureText: 'You register a title you will spend six days regretting and an abstract that promises a general framework. The paper delivers a method. A reviewer notices the distance between those two words and opens with it.' }),
      c('midnight', 'Submit at local midnight anyway', 'A decision about sleep, dressed as a decision about the paper', { energy: 7, stress: -7, draft: -2 },
        { personality: 'boundarySetter',
          result: 'You submit at 11:52 your time and go home. Two of your five co-authors keep editing for another fifteen hours and you know that and you sleep anyway. It is the same paper. It is measurably the same paper, and you will still read the diff on Saturday morning.' }),
    ] },

  { id: 'cs_preprint', title: 'Post it or hold it', category: 'research', scene: 'lab', urgent: true, probability: 1, once: true, cooldown: 99,
    conditions: { minMonth: 12, minDraft: 60, targetSoon: true },
    text: 'It goes up at midnight or it does not, and {advisor} wants it up, because two other groups are close and a timestamp is the only thing that cannot be taken off you. The venue’s policy on this is four paragraphs long, was rewritten in June, and turns entirely on whether anybody in this room believes a reviewer will type your title into a search box.\n\n{venue} calls it a dual-submission rule in one paragraph and an anonymity rule in another, and the two paragraphs were written by different committees in different years and have never been read side by side by anybody except you, tonight. The rule as practised is: post it, keep it off the lab account, and do not give the talk until the reviews are in.',
    choices: [
      c('post', 'Post it tonight', 'A timestamp; and every reviewer can now find your name', { energy: -3, stress: -4, hope: 6, academicCapital: 4, career: 3 },
        { flags: { arxivPosted: true }, personality: 'riskTaker',
          result: 'Up at 00:14, v1, with a typo in the third sentence of the abstract that will be in the version everybody downloads. On Thursday somebody you have never met puts it on a slide in Zürich. The other two groups post nothing for five weeks, and when they do, theirs is better and yours is first, and those are two separate facts and both of them count.' }),
      c('hold', 'Hold it until the reviews are in', 'The cautious read of a policy nobody reads the same way', { stress: 7, hope: -3 },
        { check: { skill: 'research', difficulty: 55 },
          successEffects: { stress: -8, confidence: 5 }, failureEffects: { hope: -10, stress: 12, novelty: -9 },
          successText: 'Nobody posts anything. The paper goes in unposted, gets its reviews, and you will never be able to prove that the four weeks of not sleeping bought you a single thing, and you will give them as the reason for the rest of your career.',
          failureText: 'On the ninth a preprint appears from the group in the other time zone, with your framing, a weaker experiment and a better title. The timestamp on theirs is three weeks older than the one you decided not to create.' }),
      c('policy', 'Read the policy properly and email the programme chairs', 'Twenty minutes; an answer in writing', { energy: -3, stress: -5, career: 2 },
        { result: 'The reply comes in six hours, is two sentences long, and says that preprints are permitted and that authors should not take active steps to publicise them during review. You now hold, in writing, an answer that means exactly what everybody already said it meant. You keep it. In three years this will be somebody else’s argument and you will be the one in the room with the email.' }),
    ] },

  { id: 'cs_reviewer3', title: 'Reviewer 3 has not opened it', category: 'crunch', scene: 'home', probability: .9, weight: 3, cooldown: 8,
    conditions: { tempo: 'week', crunch: 'rebuttal' },
    text: 'The rebuttal went in on Tuesday and the scores are still on the screen, which is the cruelty of the design. Reviewer 1 has gone from a 4 to a 5 and thanked the authors for the clarification, and Reviewer 2 has written “I have read the rebuttal” and moved nothing at all, which took them longer than saying nothing would have.\n\nReviewer 3 gave the 2 and the paragraph about the missing baseline, and the missing baseline is from a paper published nine days after you submitted. Reviewer 3’s row says LAST VIEWED: —. The discussion period closes on Friday. There is a button marked CONTACT AC and there is no version of pressing it that reads the way you want it to read.',
    choices: [
      c('refresh', 'Refresh it', 'The honest answer, and it is not a strategy', { energy: -5, stress: 9, progress: -4 },
        { result: 'Forty times on Wednesday. Twenty-six on Thursday, and you know it is twenty-six because at some point on Thursday you started counting. The row does not change and neither does the number. Two days of work gone, and you would do it again, and in three months you will do it again.' }),
      c('ac', 'Write to the area chair', 'Two lines, factual, no adjectives', { energy: -3, stress: 4 },
        { check: { skill: 'communication', difficulty: 58 },
          successEffects: { hope: 7, stress: -8, career: 2 }, failureEffects: { stress: 9, hope: -5 },
          successText: 'The third review asks for a comparison against a method that did not exist on the submission date; here is the date, here is the paragraph. The reply is “noted, thank you” and that is the entirety of what you will ever get, and on this occasion it is enough — the score moves to a 3 before the decision and nobody tells you why.',
          failureText: '“All reviews will be considered in the discussion.” Which is the sentence they are required to send, and it is also the sentence they send when they mean it, and there is no way to tell those two apart, and you will spend the weekend trying.' }),
      c('close', 'Close the tab until the decision', 'The correct move, and almost nobody makes it', { stress: -9, energy: 6, progress: 6 },
        { personality: 'boundarySetter',
          result: 'You log out and do not log back in for six weeks. It is the highest-return decision available to you this month, and there is no venue, committee or advisor anywhere that will ever record that you made it.' }),
    ] },

  // ── The publication list is half other people's papers ─────────────────────────────────────
  { id: 'cs_fourth_name', title: 'The fourth name', category: 'research', scene: 'home', probability: .7, weight: 4, once: true, cooldown: 99,
    conditions: { minMonth: 30, maxMonth: 62 },
    text: 'An email arrives from somebody in another lab with the subject line “accepted!!” and you have to open the PDF to work out which paper it is. You are the fourth author, and it is three weeks of work from your second year that you can no longer entirely reconstruct.\n\nSection 5 is yours. The plots are your plots, redrawn in somebody else’s colours, and the sentence you wrote about why the ablation is not conclusive has been cut. It is a good paper. It has your name on it and it is not, in any sense you could defend standing up in front of a hiring committee, yours.',
    choices: [
      c('cv', 'Put it on the CV and be pleased about it', 'A real line, and it is real', { career: 4, academicCapital: 4, hope: 5 },
        { result: 'Line nine, between two of your own. A committee reading fast sees four papers where you would have said one and a half; a committee reading slowly sees exactly what it is and counts it at exactly what it is worth. Both of those committees exist and you do not get to know which one you are in front of.' }),
      c('reply', 'Reply properly, and ask what happens next', 'The move that turns one paper into three', { energy: -3, career: 3 },
        { check: { skill: 'networking', difficulty: 48 },
          successEffects: { hope: 7, academicCapital: 5 }, failureEffects: { hope: -3 },
          successText: 'They write back inside the hour with the follow-up they want to run and an offer of second author on it. Middle authorship is not a favour anybody does you. It is a channel, and it stays open for exactly as long as somebody keeps replying to things.',
          failureText: 'A thumbs-up. That is the whole channel, that was always going to be the whole channel, and it took you four days to stop checking.' }),
      c('order', 'Work out how the order was decided', 'Nobody will tell you, and you can nearly reconstruct it', { stress: 5, career: 2, hope: -4 },
        { personality: 'cynic',
          result: 'First is the student whose thesis it is. Second is whoever wrote it. Third is the postdoc who is on the market this year. Fourth is contribution, or alphabetical, or the order in which people were remembered on the Thursday afternoon somebody filled in the submission form — and there is no way to find out which, and asking would make you the person who asked.' }),
    ] },

  // ── The one thing the institution reliably says to you ─────────────────────────────────────
  { id: 'cs_annual_review', title: 'The letter that says satisfactory', category: 'department', scene: 'portal',
    forced: true, probability: 1, cooldown: 11, conditions: { months: [4], minMonth: 12 },
    text: ['The faculty met on Thursday about every student in the programme, in a room you have never been in, in an order nobody will tell you. The letter comes nine days later, is one paragraph long, and says that your progress is satisfactory.\n\nThere are three boxes on the form. The other two are “satisfactory with concerns” and “unsatisfactory,” and nobody in the history of this department has been told the difference between the first two until the year they got the second one. {advisor} wrote the paragraph. It took them, at a generous estimate, four minutes.',
      '{advisor} forwards it without a covering message, which is how you learn that it exists. Progress: satisfactory. Expected completion: as discussed. Neither of you has discussed it.\n\nSomebody in your cohort gets the same letter in the same week with one extra sentence in it, and the extra sentence is about the prelim, and they will not tell anybody for a year and everybody will know inside a fortnight.'],
    choices: [
      c('file', 'File it and get back to work', 'What the letter is for', { stress: -3, hope: -2 },
        { result: 'It goes in the folder with the others. In year five you will read all of them in a row in about ninety seconds and discover that three of the four paragraphs are the same paragraph with the year changed, and that the one that is different is from the year you thought was your worst.' }),
      c('meaning', 'Ask {advisor} what the other two boxes actually mean', 'A question with a real answer in it', { energy: -2 },
        { check: { rel: 'trust', difficulty: 48 },
          successEffects: { trust: 4, readiness: 4, stress: -5 }, failureEffects: { satisfaction: -3, stress: 4 },
          successText: '“Concerns means the department has asked me to write down a date. Unsatisfactory means the department is writing it and not me.” Said plainly, in about nine seconds. It is the most useful thing anybody has told you about this programme, it cost nothing, and you had to ask for it.',
          failureText: '“It is a formality.” It is a formality for exactly as long as it is a formality. You have been told the same thing about four other formalities, one of which was the prelim.' }),
      c('write', 'Write your own version of the year first', 'Two hours, the week before the meeting; it changes what they write', { energy: -5, career: 3, readiness: 4, stress: -3 },
        { flags: { wroteMyReview: true },
          result: 'One page: what shipped, what did not, what the next twelve months are for. Your paragraph comes back with three of your sentences in it, close to verbatim, because it was written at half past four by somebody with fourteen of these to do. This is how the paragraph has always been written and nobody tells first-years that the pen is available.' }),
    ] },

  // ── The real shape of it ───────────────────────────────────────────────────────────────────
  { id: 'cs_four_people', title: 'The four people', category: 'research', scene: 'campus', probability: .7, weight: 4, once: true, cooldown: 99,
    conditions: { minMonth: 30, maxMonth: 60 },
    text: 'You work out, on a Tuesday, standing at the printer, that there are four people alive who could read chapter three and tell you whether it is right. One is your advisor, one is on your committee, one reviewed the paper anonymously and you are fairly sure which one, and the fourth is at a company now and has stopped answering.\n\nThis is not a complaint and there is nobody to make it to. It is what the last three years were for. You made yourself into the only person in this building who can do this, deliberately, at a price, and the price is arriving now, in a corridor, in front of a printer that is out of toner.',
    choices: [
      c('email', 'Email the one who went to the company', 'They will not reply. Send it anyway.', { energy: -2, hope: 4 },
        { check: { skill: 'networking', difficulty: 52 },
          successEffects: { hope: 10, stress: -8, career: 3 }, failureEffects: { hope: -5, loneliness: 6 },
          successText: 'Nine days later, at half past midnight, four paragraphs with three real objections in them and a line at the end saying they miss this and do not say that to many people. You read it twice. You will keep it after you have stopped keeping most things.',
          failureText: 'No reply. They are not ignoring you: they have a sprint, a manager, and a child who is two. The version of them that read drafts at midnight only ever existed inside a building you are still standing in.' }),
      c('write', 'Write it for the fourth person anyway', 'A reader who is not coming still improves the chapter', { energy: -6, writingQuality: 6, draft: 5, loneliness: 3 },
        { result: 'You pick one of the four and write the chapter at them — their objections, in their order, in the tone you would use in their office. It is the best chapter in the thesis. They will never see it. Every good chapter is addressed to about two people and no acknowledgements section has ever said so.' }),
      c('undergrad', 'Explain it to somebody who cannot follow it', 'The wrong audience; the right exercise', { energy: -4, stress: -6, confidence: 4 },
        { skill: { teaching: 1 },
          result: 'Forty minutes with a second-year and a whiteboard. They follow a third of it and ask one question you cannot answer, and it turns out to be the question chapter three is actually about. Being surrounded by people who cannot help you and being helped by one of them anyway are not, apparently, contradictory.' }),
    ] },

  // ── The two seconds ────────────────────────────────────────────────────────────────────────
  { id: 'cs_two_seconds', title: 'The two seconds', category: 'career', scene: 'home', probability: .8, weight: 4, once: true, cooldown: 99,
    conditions: { flag: 'returnOffer', minMonth: 24 },
    text: 'You ask for the thing everyone told you to ask for and your voice does something on the word “startup.” There is a pause of about two seconds, and then: “That’s fair — let me see what I can do,” and forty thousand dollars moves, and you understand, too late to be useful, that the two seconds were them writing it down.\n\nThe deadline on the letter is January and the January deadline is not a real deadline, which you found out by asking one person who had asked. The forty thousand was inside the band the whole time. It was inside the band when they sent the first number. Nobody did anything wrong, and there is a document in that building with both numbers in it and it has had both numbers in it since before you interviewed.',
    choices: [
      c('again', 'Ask for the second thing as well', 'The band has a top and you are not at it', { energy: -3, confidence: 5 },
        { check: { skill: 'communication', difficulty: 56 },
          successEffects: { career: 6, hope: 6, confidence: 6 }, failureEffects: { stress: 6, hope: -3 },
          successText: 'Start date, sign-on, and which team. Two of the three move. The third moves four months later, by email, without being asked a second time — which is how you learn that the first ask is the one that gets written down and everything afterwards is somebody reading it back.',
          failureText: '“That’s where we are for this level.” Said pleasantly, and it is the sentence that ends the conversation, and you say thank you, and you are right to.' }),
      c('tell', 'Tell the two people in your cohort what the number was', 'The most useful thing anybody in this building can do', { energy: -1, hope: 5 },
        { peerBond: 8, personality: 'boundarySetter',
          result: 'Base, sign-on and refresh, in one message, to two people. One of them uses it in February and gets nine thousand more than they would have asked for. Nothing in six years of training here, at any point, from anybody, suggested that this was a thing you were allowed to do.' }),
      c('accept', 'Take it before anything breaks', 'The number is good and the fear is not irrational', { stress: -8, career: 4, hope: 4 },
        { result: 'You sign on the Thursday. It is a great deal more money than you have ever been paid and it is, as you find out about eighteen months later from somebody who started the same month, under the median for the level. You would sign it again. You would just also ask.' }),
    ] },

  // ── The second game, in the first fortnight ────────────────────────────────────────────────
  { id: 'cs_ten_days', title: 'Ten days after entry', category: 'life', scene: 'campus',
    forced: true, probability: 1, once: true, cooldown: 99, conditions: { international: true, maxMonth: 1 },
    text: 'You cannot apply for the number until you have been in the country ten days, and payroll cannot pay you until you have the number. Four people have explained this to you and none of them agreed about the ten days.\n\nThe office is a bus and a transfer away, opens at nine, and the queue starts at twenty past seven. You need the passport, the I-20, the I-94 printed off a website that was designed in 2004, and a letter from the international office that a second office has to sign. The first payroll cut-off is the fifteenth. The rent is due on the first. Nobody at {school} has said anything about the gap between those two dates because from inside the building there is no gap.',
    choices: [
      c('queue', 'Be there at twenty past seven', 'A morning gone; the shortest path there is', { energy: -6, stress: -6, money: -14 },
        { result: 'Fourth in the queue and out by ten past nine. The clerk has done this several thousand times and is neither kind nor unkind about it, which is a relief. The card arrives in the post seventeen days later. Two people in your cohort go at half past ten in week three and are still waiting in November.' }),
      c('office', 'Take it to the international office and let them run it', 'Free, correct, and three weeks slower', { energy: -3, stress: 6 },
        { check: { skill: 'communication', difficulty: 46 },
          successEffects: { stress: -8, hope: 4 }, failureEffects: { stress: 10, hope: -5 },
          successText: 'The adviser has a one-page sheet with the bus number, the opening hours and the exact wording the letter needs, and it works. The sheet has been on that desk since August. It is not on the website and there is no reason it is not on the website.',
          failureText: 'The next appointment is in nineteen days. Nineteen days is after the fifteenth. You now understand precisely what the fifteenth is, which is more than you understood this morning.' }),
      c('borrow', 'Work out how to eat until the first cheque', 'The actual month-one problem, and nobody said it existed', { stress: 8, money: -260, hope: -4 },
        { personality: 'grinder',
          result: 'Six weeks between landing and being paid, with a deposit and a first month’s rent already gone, on a card from home that charges three per cent on every transaction and a flat fee on top of that. You cook the same four ingredients until the twenty-ninth of October. Nobody in the department knows this is happening and there is no form on which it would ever appear.' }),
    ] },

  { id: 'cs_speak_screen', title: 'The screening for teaching', category: 'department', scene: 'campus',
    forced: true, probability: 1, once: true, cooldown: 99, conditions: { international: true, minMonth: 1, maxMonth: 5 },
    text: 'Twenty minutes in a room with two people from the language centre and a camera, explaining a sorting algorithm to a whiteboard as though the whiteboard were nineteen and had not done the reading. They are kind about it, and they are also writing.\n\nThe scale runs to sixty. Fifty clears you to stand in front of undergraduates. Below fifty is a semester of the accent course, twice a week, at eight in the morning, which is not a punishment and is also not nothing. Above fifty there is nothing at all — no letter, no ceremony, just your name appearing on the TA list in August. Your written English is better than that of two of the professors in this department. This is not a test of that.',
    choices: [
      c('slow', 'Slow down, and say every number out loud', 'The whole test, in one habit', { energy: -3 },
        { check: { skill: 'communication', difficulty: 45 },
          successEffects: { confidence: 7, career: 2, hope: 5 }, failureEffects: { stress: 9, confidence: -6, hope: -5 },
          successText: 'Fifty-three. Cleared, and the result arrives as a row in a portal with no covering message. What moved it was not vocabulary. It was two seconds of silence before each sentence, and you will use those two seconds for the rest of your life, including in a job talk six years from now.',
          failureText: 'Forty-six. Four points. A semester of Tuesdays and Thursdays at eight in the morning, and a spring TA line you cannot take, which is a spring TA line that somebody else takes.',
          flags: { accentCourse: 'onFail' } }),
      c('perform', 'Teach the room and ignore the camera', 'Volume, hands, and the board rather than the notes', { energy: -5, stress: 6 },
        { check: { skill: 'teaching', difficulty: 52 },
          successEffects: { confidence: 6, hope: 4, skill: { teaching: 1 } }, failureEffects: { stress: 8, confidence: -4 },
          successText: 'You teach the whiteboard rather than the raters and one of the two stops writing and starts listening, which is the tell. Fifty-eight. Nobody will ever tell you that fifty-eight is good; you find out four years later when a first-year shows you theirs and asks whether it is bad.',
          failureText: 'You go fast, because going fast is what you do when you are being watched, and the partition step arrives on the whiteboard fully formed and unexplained. Forty-eight. Two points, and a rater who says “you clearly know it” on the way out and means it as a kindness.' }),
      c('ask', 'Ask what the number is actually measuring', 'A question the two people in the room are not often asked', { energy: -2, stress: -4, hope: 3 },
        { result: 'One of them answers it honestly: comprehensibility to an undergraduate who is not trying, on an instrument validated in the nineties on a different population. She says it is the best one they have and that she does not think it is a good one, and she says this in a room with a camera in it, and neither of you knows what to do with that, so you both go back to the twenty minutes. Fifty-one. You clear it by a point and you will never mention the point to anybody.' }),
    ] },
];
