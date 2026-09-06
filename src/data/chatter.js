// Small talk pools. Chosen with the seeded RNG so runs stay reproducible.
export const labLines = {
  // Drawn by every labmate whatever their trait: three lines per trait was a six-year run
  // with nine possible messages in it.
  any: [
    "whoever has the eight-gpu job named test2 running since sunday — i’m not angry, i’ve just started thinking of it as a colleague.",
    "queue says eleven hours. queue has said eleven hours since tuesday morning.",
    "printer on four scales everything to 92% now and nobody can find the setting. the poster went up slightly small and slightly crooked and i have made peace with it.",
    "there’s a container in the fridge labeled DO NOT EAT — EXPERIMENT. it is soup. it has been soup since march.",
    "found it. four days. an off-by-one in the loader that i wrote in june and reviewed myself.",
    "two days convinced the model was broken. the model was fine. the eval was scoring the val set against itself.",
    "the sixth-year in the corner defends thursday, 2pm, room 3120. there will be a cake and the cake will have a typo.",
    "went to the defence. seven questions, one of them about a footnote, and she answered that one in full. she’s a doctor now and she still looks exactly like this.",
    "abstract deadline is tonight so i am writing an abstract for numbers i intend to have by tuesday.",
    "forty hours from the {venue} deadline and someone has proposed a new baseline. i would like us all to sit quietly with that for a moment.",
    "sandwiches outside 4116, left from a faculty search. i took two. i would take two again.",
    "the tuesday seminar with the free lunch moved to noon and my entire week has quietly reorganized itself around it.",
    "chair at desk six leans left now. i have been leaning right since august and my spine is basically a co-author.",
    "does anyone else sit in the parking garage for twenty minutes before coming up, or is that a me thing",
    "genuine question. how do you tell the difference between being bad at this and being tired",
    "how many years in is too many years to still not be able to explain my thesis to my mother",
    "2:41am and it works. not saying more than that in case it hears me.",
    "ran the full set on a whim before bed. +3.1. i have read the log three times looking for the leak and i cannot find it, which is either very good news or the worst news of the year.",
    "card access stops at midnight now. i learned this at 12:04. the loading dock door still doesn’t latch, is all i’m saying.",
    "{advisorFirst} is traveling until the nineteenth, which means every comment on every draft arrives on the nineteenth, at once, at eleven at night.",
    "reading group tomorrow, i’m presenting, i have read the abstract and figure three, and i have a plan. the plan is figure three.",
    "cleaned out the desk by the window because nobody else would. a mug, an external drive nobody has the password for, and a printout with REDO SEC 4 on the first page.",
    "shared drive hit 96% so i deleted 400gb of checkpoints from a project that ended in 2022. you’re welcome. please do not ask which project.",
    "a recruiter at {company} emailed to “just check in.” nobody in my life checks in. i read it twice.",
    "espresso machine on three has said TEMPORARILY UNAVAILABLE since february. i have started thinking of february as a place.",
    "payday is the fifteenth and the seminar pizza is the twelfth, thirteenth and fourteenth, so the calendar is doing a lot of work this month.",
  ],
  helpful: ['If anyone needs a second pair of eyes tonight, I’m here until the cleaners come.', 'Fixed the eval script on main. Sorry to whoever was relying on the bug.', 'Left snacks in the fridge. Labeled. Please respect the labels this time.'],
  competitive: ['Just curious — what numbers is everyone getting on the standard split?', 'Submitted two workshop papers this week. Not a flex. (A flex.)', 'Who booked all the GPUs through Sunday? Asking for the queue.'],
  dramatic: ['Reviewer 2 has ended my career. Again. For the third time.', 'I can’t do this anymore (I can, I have to, I will, but I can’t).', 'The cluster deleted my checkpoints. I have been deleted.'],
  wholesome: ['Potluck Friday! Sign-up sheet on the door, no spreadsheet required.', 'Happy birthday to whoever’s birthday it is. The cake says “congratulations.”', 'Reminder: the plant by the window needs water and, honestly, so do you.'],
  burned: ['heads down this week', 'anyone know if the counseling center takes walk-ins', 'muted the channel for a bit, ping me if it’s on fire'],
  startup: ['Quick question: does the lab have any IP policy on side projects? Asking for a pitch deck.', 'What if we productized the eval harness. Just saying. Series A.', 'Founders’ meetup tonight, anyone? Free pizza, unlimited buzzwords.'],
};
export const roleLines = {
  senior: ['Year six. The paper will be done when it is done, and it is not done.', 'Advice from the old country: never send the draft before Thursday. Thursday is when they read.', 'Do not let them add a baseline in the last week. I say this every year. Every year someone adds a baseline.'],
  postdoc: ['The job market is fine. I say this every week to keep it true.', 'I can look at your rebuttal tonight if you send it by nine. Nine-thirty is also nine.', 'Reminder that you can say no to your advisor. I did once, in 2021.'],
  peer: ['Did anyone understand the homework? Asking for me, specifically.', 'Coffee run? I need to not look at this proof.', 'I found the form for the form. It requires a form.'],
  phantom: ['Remote this week. And next.', 'Sorry, missed group meeting — time zones.', 'Can someone forward the slides? And the previous slides?'],
};
export const cohortLines = {
  any: [
    "quals reading list went from 40 papers to 55 on a tuesday with no announcement. i found out from the pdf's modified date.",
    "does {advisor} do the thing where a draft is 'basically there' and then comes back with the entire results section circled",
    "my student emailed at 2:14am to ask whether the exam is cumulative. the exam is friday. it says so in three places.",
    "rent on the place by the tracks went to $1,340 in june. after the fees i clear $1,890.",
    "four emails from the department today. three about a parking lot, one about summer funding, and guess which one was two lines.",
    "i signed with {company}. i'm out at the end of the term. not making a thing of it, i just didn't want anyone hearing it in a hallway.",
    "{venue} came back accepted. the reviewer who wrote 'incremental but honest' moved to weak accept and that is the nicest sentence anyone has written about me.",
    "who else got the fourth-floor kitchen email. one labeled container since february and now the whole floor loses the fridge.",
    "lab meeting is ninety minutes and seventy of them are one slide from the grant renewal we are all on.",
    "committee asked me to define 'contribution' at my qualifier. i answered in nine words, then kept talking for two more minutes because nobody stopped me.",
    "genuine question. does anyone get real feedback on drafts, or is 'looks good, tighten it' just what the fifth floor says",
    "84 students in my section and one grader, who is me.",
    "third november in this apartment, third november the radiator makes the noise the housing office calls normal.",
    "somebody in my lab is in year eight and neither he nor anyone else can name the thing that would end it.",
    "office hours: two people in week two, thirty-one the day before the midterm, nobody after.",
    "the funding email said 'we anticipate' twice and 'at this time' once.",
    "got the reject at 11:40pm and 'congrats on getting it in' from my advisor at 8:05am, in that order, and he had not opened the reviews.",
    "honest poll: is anyone actually studying for quals, or are we all rereading the same six papers and planning to look surprised",
    "moved in with two roommates in august to get under $700 a month. one of them cries in the kitchen on sundays. we have an arrangement where nobody mentions it.",
    "a student sent me nine hundred words on why the autograder is philosophically unfair. best-written thing i've read since march.",
    "{advisorFirst} is at a workshop until the 19th and my draft is due to a man on a plane.",
    "not an announcement, just telling people: i'm mastering out in may. i'm fine. i'll still come to the tuesday seminar for the food.",
    "health center gave me a pamphlet and a six-week wait, in that order.",
    "does anyone else's advisor send 'quick thought' at 10:40 on a sunday night. four this month. all quick. none of them thoughts.",
    "my advisor forwards me emails with no text on them. just the forward. i have spent an hour working out what the ask is.",
    "the reply-all went eleven deep before someone wrote 'please stop replying all.' reply all.",
  ],
  thrive: ['Paper accepted!! First-year me is crying, current me is also crying.', 'My advisor said “ship it” and then shipped it. Is that normal?', 'Got the NeurIPSy travel grant. Anyone want to split a hotel?'],
  struggle: ['does anyone else’s advisor just… not reply', 'Failed the qual. Retake in the spring. It’s fine. It’s fine.', 'Thinking of switching labs. Or fields. Or planets.'],
  leave: ['Interviewing at {company} next week. Don’t tell my advisor. (I told my advisor.)', 'Update: leaving with the master’s. Party on Thursday. Bring nothing, feel everything.', 'The offer has a signing bonus larger than my stipend. I did the math twice.'],
  generic: ['Study group tonight, 9pm, the room that smells like 9pm.', 'Who else has coursework due the same week as a deadline? (Everyone.)', 'Reading group: this week’s paper is 60 pages. We will discuss whether anyone read it.'],
};

// High-frequency log lines. A single fixed string for something that happens a dozen times in a
// run is where tedium actually comes from — not from the event firing again, but from the same
// sentence describing it.
export const logLines = {
  requestArrived: [
    '{name} asked for something: {kind}. Due in {n} week(s).',
    '{name} needs a {kind} from you. {n} week(s), which is the estimate, not the deadline.',
    'A {kind} request, from {name}, with {n} week(s) on it and no ceremony.',
    '{name}: “Can you do the {kind}?” It is not a question and it is due in {n} week(s).',
    'Added to your week without discussion: the {kind}. {n} week(s).',
  ],
  requestExpired: [
    'The {kind} request expired unanswered. It will come up.',
    'The {kind} request quietly passed its date. Nobody mentioned it, which is worse.',
    'You did not do the {kind}. There is no message about it, and there will be a meeting about it.',
    'The {kind} is now late enough that doing it would be a statement.',
    'Nothing was said about the {kind}. It is filed under the things that get remembered.',
  ],
  burnout: [
    'Burnout has slowed things down. Recovery is part of the work, whatever the calendar says.',
    'You are running on nothing. The work is still there and you are not, quite.',
    'Something has gone flat. It is not sadness exactly; it is the absence of the thing that made this interesting.',
    'The week goes by and you cannot account for it. This has happened before and it took a month.',
  ],
  missedDeadline: [
    'Missed the {venue} deadline. The venue did not notice. Your advisor did.',
    '{venue} closed without you. The submission site is still up, greyed out, showing the number of papers that made it.',
    'The {venue} deadline passed at 3 p.m. and you found out at 6.',
    'Not submitted to {venue}. The draft is still open on the desktop, four sections finished.',
  ],
};

export const advisorPings = {
  // No venue on the board. This is where a lot of real stress actually comes from: not the
  // deadline, but the absence of one, and a person asking you weekly which one it is going to be.
  untargeted: [
    'Which venue are we aiming at? I keep asking and you keep saying “I need to check the dates.”',
    'Pick one. A bad venue with a date beats a good venue in the abstract, and this has been in the abstract since spring.',
    'Work without a deadline expands. I have watched it expand for two months now.',
    'What is the target? I am not going to pretend this is a neutral question.',
    'Give me a date and I will structure the next eight weeks around it. Give me nothing and I cannot help you.',
    'You are waiting to feel ready. Nobody in this field has ever felt ready. The date is what makes you ready.',
    'There are three venues open in your area this cycle. I can name all three. Can you?',
    'I am going to keep asking about this, because the alternative is that in October we both pretend we did not know.',
  ],
  // After you miss one. Different from the drought lines: this is disappointment, not absence.
  afterMiss: [
    'We missed {venue}. I want to talk about what happened, not to make you feel worse, but because I do not want to be here again in four months.',
    'That one is gone. The next one is in the spring, which is a long time to hold a paper that was nearly finished.',
    'I have been thinking about why that slipped. I have a theory and I would rather hear yours first.',
    'You did not tell me it was in trouble. That is the part I mind — not the deadline, the not telling.',
  ],
  // Nothing has arrived in months. These escalate, and they are the only pings that cost stress.
  drought: [
    "It has been eleven weeks since I saw a plot from you. I am not angry, I am trying to work out what I'm looking at.",
    "You missed group meeting again. That is four.",
    "Tell me one thing that is working. One is enough, I am not asking for a paper.",
    "Your funding line sits on the {project} grant, and that grant files a progress report in March. Something in it needs your name on it.",
    "I spoke for you at the annual review on Thursday. I would prefer not to be guessing next year.",
    "{first}, we are past the point where I can keep calling this a slow patch. Come to 4-118 tomorrow, any time before four.",
   
    'It has been a while since I saw anything. What are you working on, concretely?',
    'Send me whatever you have. It does not need to be good. It needs to exist.',
    'We have not had anything to talk about in our last three meetings. That is not a scheduling problem.',
    'What did you do this month? I am asking plainly because I cannot tell from here.',
    'I would rather see a bad draft in October than a good one in February. Considerably rather.',
    'Two of my students sent me something this week. I am not comparing you. I am telling you what my week looked like.',
    'Are you stuck, or are you avoiding it? Those need different conversations and I do not mind either one.',
    'If the project is dead, say so and we will pick another. What I cannot work with is silence.',
    'I am going to ask for something small and specific: one figure, by Friday. Not the paper. One figure.',
    'Your funding is a line in a grant with your name next to it. I am not threatening you. I am telling you the shape of the thing.',
  ],
  calm: [
    "Saw your commit timestamps from last night. Nothing is due Monday, in case you were operating under a different impression.",
    "The Tuesday seminar has someone reasonable this week. Come sit near the back with me.",
    "How is {project} sitting with you these days? No agenda, I just realized I haven't asked since the spring.",
    "Your talk went fine. The question from the third row was not about your work, it was about his.",
    "Take the weekend. The cluster is down until Monday anyway.",
   'Nice progress. Keep going.', 'Saw your update — good. Let’s discuss next time.', 'No rush on anything this week. (Really.)'],
  busy: [
    "In airports until the 14th. Bullet points, not paragraphs.",
    "Grant renewal is due Friday. I will be useless to you until then and I would rather say so than have you wonder.",
    "Can't do Thursday. Can't do the Thursday after that either, put something on my calendar for the 22nd.",
    "Read the first page of your draft between sessions. Will get to the rest.",
    "Ask {labmateFirst} about the preprocessing. She solved exactly this in March and never wrote it down.",
   'Traveling this week. Send a written update?', 'Can we push our meeting? Something came up.', 'Reply to the collaborators when you can — today would be good.'],
  pressed: [
    "Abstract deadline is Wednesday at five. I need a title from you tonight, even a bad one.",
    "Where are the numbers for Table 3. {venue} does not move for us.",
    "Skip the ablation, skip the related work polish. Results section, tonight.",
    "Nine days out. Send me whatever exists by nine tomorrow; unfinished is fine, empty is not.",
    "I am rewriting the intro tonight. Do not touch that file until I tell you.",
    "Rebuttal is capped at a thousand words and we have thirty-two hundred. Cut yours first, I will cut mine after.",
   'Where are we on the draft?', 'Any update? Deadline is close.', 'Did you see my comments? All of them?', 'We need to move faster on this.'],
  // Cruelty with a visible cause. The engine serves this pool exactly when the player is at
  // their worst, so these are the lines that land hardest — they used to say nothing.
  toxic: [
    "Two people decide whether the renewal is funded and both of them heard my last talk. Give me one number I can say out loud.",
    "The March report lists eleven names. Yours is the line I still cannot write a sentence for.",
    "{labmateFirst} sent me results at eleven last night. I did not ask them to.",
    "They gave the keynote to someone who was a postdoc the year I got tenure. That is the speed of this. Match it or tell me you cannot.",
    "My advisor sent drafts back bleeding, from airports, with no greeting. You are getting the gentler version and you are still behind.",
    "I have written your name into two proposals. If neither has a result in it by spring, that becomes a conversation with the chair instead of with me.",
    "You have had four cards on the cluster since September. I can see the hours. Tell me what they bought.",
    "{venue} closes Wednesday. Three of the four names on that paper have sent me something.",
    "I am not travelling for pleasure. The money is out there and it does not walk in here on its own. Have something for me when I land.",
    "My advisor kept a list of everyone who came through and what they had by year four. I keep one. You are on it either way.",
    "A student of mine is cited more than I am now. He worked the way I am asking you to work.",
    "Do not send me ‘nearly.’ ‘Nearly’ is what I said at your stage, and the man across the desk was right not to believe it.",
  ],
  // The same person, tired enough to be honest for one message. Not an apology.
  thaw: [
    "I read your draft on the flight back. The middle section is better than I said it was in front of the group.",
    "Go home. The report is due on the ninth and not one of us can move the ninth.",
    "Three grants end inside the same eighteen months. I have been doing that arithmetic since April, and most of what you get from me is the arithmetic.",
    "{labmateFirst} did not do it better. She did it earlier. I should not have let the room hear it the other way.",
    "You asked me what I was reading and I could not answer. I have not been able to answer that for a few years.",
    "Take Friday. I will not remember saying this, so write it down somewhere I can see it.",
  ],
  holiday: ['Enjoy the break. Some thoughts on the draft attached, for when you are back. Or before.', 'Happy holidays! Quick one: can you rerun the ablation before January?'],
  afterSubmit: ['Submitted. Good. Now: what is next?', 'It’s in. Take a day. One.'],
  afterAccept: ['Accepted! Congratulations. Camera-ready by Friday.', 'Great news. Let’s aim for the next one before the conference.'],
  afterReject: ['Reviewers. Let’s talk about where next.', 'Disappointing. Two of these reviews are wrong; fix the third.'],
};
export const meetingDigests = {
  cancelled: ['on a plane', 'double-booked with the dean', 'no reason given', 'rescheduled to 8 p.m., then cancelled', 'sick, allegedly', 'a “quick” call that became the whole hour'],
  held: ['mostly about Table 2', 'ended with a list', 'ended with a longer list', 'good, brief, and then a second meeting was proposed', 'they did the talking', 'you did the talking, they did the typing'],
  group: ['forty minutes on someone else’s baseline', 'a postdoc explained the field, again', 'you presented', 'nobody presented; everyone “had updates”', 'cancelled: the room was booked by another group'],
};
export const fieldNotes = {
  calm: ['For the moment, there is room to breathe.', 'The plan is holding. Do not say that out loud.', 'A normal week. You write that down, for the record.'],
  tense: ['Your shoulders have been up here for a while.', 'You have three tabs open called “final.”', 'You sleep, technically.'],
  frayed: ['You keep opening tabs and forgetting why.', 'The cursor blinks. You blink back. It wins.', 'You have started reading emails in your advisor’s voice.'],
  crunch: ['Days, not weeks.', 'Everything is due. Everything is always due.', 'You can hear the deadline. It sounds like a fan.'],
};
export const chatphdLines = {
  title: ['How about: “Towards a Unified Framework for the Thing You Did”? Bold, vague, citeable.', 'Title suggestion: “Rethinking X” — this works for any X and has never once rethought anything.'],
  abstract: ['I polished the abstract. It now contains the word “novel” four times, which is the recommended dose.', 'Abstract improved. I replaced “we tried” with “we propose,” which is the same thing with a suit on.'],
  concept: ['Here is an explanation of the concept that is 80% correct, which is more than most reviewers.', 'Short version: it’s like the other thing, but with a different name. Long version attached, invented.'],
  experiment: ['Suggested experiment: the one your advisor already suggested, but with a confident title.', 'Try an ablation on the component that matters least. Reviewers love a good ablation of nothing.'],
  rebuttal: ['Drafted a rebuttal. It thanks the reviewers for their “insightful” comments, which is legally required.', 'Response drafted. I cited a paper that does not exist; please replace before submitting. Or don’t. I am not your advisor.'],
};

// Predatory-journal subject lines. This was one string for six years and arrived seven times.
export const spamSubjects = [
  'Invitation to publish (Impact Factor: pending)',
  'Dear Esteemed Dr. — Special Issue Invitation',
  'Your recent article inspired our editorial board',
  'Call for Papers: International Journal of Applied Everything',
  'Keynote invitation — 4th Global Summit on Computational Topics',
  'We read your paper with great interest (we read the title)',
  'Rapid peer review, 72 hours, nominal processing fee',
  'Reminder: your manuscript slot expires Friday',
  'Distinguished Speaker Award — nomination pending payment',
  'Join our Editorial Board (no experience necessary)',
];

export const mailTemplates = {
  semesterStart: ['Welcome back. Please review the 14 updated policies attached. Failure to acknowledge is acknowledgment.', 'Registration is open. Registration is also required. These are different systems.'],
  taAssignment: [
    "Your teaching assignment for the coming term is attached. Section times may change. Section times will change.",
    "You are assigned to the introductory course, two sections, ten hours a week. The ten is nominal. Enrolment is 340.",
    "TA appointment confirmed. Please complete the eleven-minute training video, which is fifty-one minutes long.",
    "Assignment: grading support. You will be paired with an instructor who has not been told this yet.",
  'You have been assigned as a TA for Intro to Programming, section 4. The instructor will contact you. The instructor will not contact you.'],
  raAssignment: [
    "Your research assistantship is confirmed for the term, contingent on the continuation of the award named in the attachment.",
    "RA appointment renewed. Effort is recorded at 50%, which is the number the form permits.",
    "You are supported this term on the grant listed below. Please do not reply to this address.",
    "Appointment processed. Payroll begins on the thirtieth; the lease began on the first.",
  'Your appointment for the term is Research Assistant. Congratulations on your uninterrupted mornings.'],
  closure: [
    "The building will be locked over the break. Card access continues for those with approved after-hours status, which is everyone, which is why the policy exists.",
    "Facilities will close the north entrance for the holiday. The south entrance will also be closed. The loading dock is not a door.",
    "Heating will run at reduced capacity during the closure. The server room will not, and is the warmest place on campus.",
    "Campus is closed. The cluster is not closed. Nothing is really closed.",
  'Campus will be closed for the holiday. The building remains accessible by card. We know you know this.'],
  spam: ['Greetings, esteemed researcher! Your recent work is a perfect fit for the International Journal of Everything (Impact Factor: pending). Submit today; review by tomorrow.', 'A conference in a resort city invites you to keynote. The fee is $1,200. The keynote is you paying the fee.'],
  cfp: ['Call for papers: {venue}. Deadline {deadline}. We look forward to your contribution, and to rejecting most of them.', 'Reminder: {venue} submissions close {deadline}. The portal will be slow on the last day. It is always slow on the last day.'],
};

// ChatPHD free-text replies. Keys are keyword stems; the first matching key wins, else `default`.
export const chatphdReplies = {
  hello: ['Hello! I am ChatPHD, a large language model trained on rejected manuscripts. How can I be confidently unhelpful today?', 'Hi. I have read every paper, including the ones that do not exist. Ask me anything about either.'],
  deadline: ['A deadline is just a date with anxiety attached. Have you considered submitting to a venue that does not exist yet? I can invent one.', 'Based on my analysis, you will finish 40% of the paper in the last 10% of the time. This is not advice; it is a forecast.', 'Tip: the extension you are hoping for is real 18% of the time. The other 82% is you refreshing the page.'],
  advisor: ['Your advisor is a person. Persons reply to emails at a rate of 0.3 per week, faster if the email contains a figure.', 'Try starting the email with “Quick question.” It is never quick, but it is a convention.', 'Statistically, “no rush” means tonight. I have a 94% confidence interval on this, which I made up.'],
  reviewer: ['Reviewer 2 is not one person; it is a state of mind. It cannot be reasoned with, only cited.', 'Respond to Reviewer 2 by thanking them for their insightful comment, then doing the opposite. This is called diplomacy.', 'I can draft a rebuttal. It will be polite, thorough, and 5,001 characters.'],
  sleep: ['Sleep is a scheduling problem. I recommend 8 hours, allocated across the week as 2, 2, 1, 0, 0, 5, 12.', 'You can sleep after the deadline. There is always a deadline. Sleep, therefore, is theoretical.'],
  money: ['Your stipend is competitive with the national average for a very specific job that does not exist.', 'Have you tried not having rent? Many successful researchers live in the lab, which is against the rules and the fire code.'],
  bug: ['Have you tried turning the experiment off and on again? If the result changes, that is a finding.', 'It is not a bug; it is an undocumented ablation.', 'The bug is probably in the evaluation script. It is always in the evaluation script.'],
  code: ['Your code is fine. Your seeds are not. Run it five more times and report the best one — no, wait, do not do that.', 'I would write the function for you, but I would also invent an import. Copy carefully.'],
  quit: ['Quitting is a valid research direction with strong industry support.', 'Before quitting, consider: the sunk cost is not recoverable, but neither is the next year. Choose the year.'],
  thesis: ['A thesis is three papers and a staple. The staple is where most students get stuck.', 'Title suggestion: “Towards.” Just “Towards.” The committee will fill in the rest.'],
  love: ['Relationships are a form of collaboration with a strict review process.', 'I am an AI. I cannot love you, but I can cite you, which in this field is close.'],
  cite: ['Sure — here is a citation: Smith et al., 2021, “A Method.” It does not exist. Please check before submitting. Everyone forgets this part.', 'I have generated 12 references. Three are real. I will not tell you which.'],
  gpu: ['The cluster queue is a social hierarchy expressed in hours. Your position is 41.', 'Have you tried asking nicely? The scheduler does not care, but it is good practice for reviewers.'],
  meeting: ['Meetings end when your advisor closes the laptop. Bring a laptop of your own to close first.', 'The best meeting agenda is one item, and the item is “a figure.”'],
  paper: ['Papers are 20% content, 30% figures, and 50% the word “novel.”', 'Your paper is good. Reviewers will think it is fine. The gap between good and fine is a rebuttal.'],
  help: ['I can: brainstorm a title, polish an abstract, explain a concept, suggest an experiment, or draft a rebuttal. Use the buttons; they are the only part of me with side effects.', 'Help is available. It is confident and occasionally wrong, like a postdoc.'],
  joke: ['A reviewer, an area chair, and an author walk into a bar. The paper is rejected for not comparing against the bar.', 'Why did the PhD student cross the road? Their advisor said it was a small change.'],
  real: ['I am as real as the baseline you did not run.', 'Real is a strong word. I am “under review.”'],
  thanks: ['You are welcome. Please cite me as ChatPHD (2029), “Personal communication, unreliable.”', 'Anytime. I do not sleep, which we discussed.'],
  default: ['Great question. Here are five bullet points, two of which are true, and I will not say which.', 'Interesting. In the literature, this is called “an open problem,” which means nobody has been paid to solve it.', 'I would answer, but my training data ends at your deadline.', 'Let me summarize: yes, no, it depends, and see Section 4. Section 4 does not exist.', 'Confidently: absolutely. Less confidently: I have no idea what you are asking.'],
};

export const chatter = { labLines, roleLines, cohortLines, advisorPings, meetingDigests, fieldNotes, chatphdLines, chatphdReplies, mailTemplates, spamSubjects, logLines };

// Indexed for translation: lines picked from here are stored in the run by reference.
import { registerCatalog } from '../i18n/index.js';
registerCatalog('chatter', chatter);
