// Internships. Applications open every August; whether you actually go is decided by a
// person who has a reason to want you here. The excuses are drawn from the real calendar.

// Seven summers. The deltas land at the end of it, and one of them takes research away.
export const internTypes = {
  research: { id: 'research', label: 'Research internship at a lab that publishes', salary: 8500,
    blurb: 'Twelve weeks on a problem adjacent to your thesis, with a mentor who will read your draft.',
    skills: { research: 6, coding: 1, writing: 3, communication: 2, networking: 2 },
    career: 8, capital: 6, paperChance: .45, sponsors: true, advisorLike: 14, mentorSenior: 78, returnBias: .06 },
  sde: { id: 'sde', label: 'Software engineering at a big company', salary: 11000,
    blurb: 'Ship a feature to production. Ownership from day one, and a hoodie in a size you did not choose.',
    skills: { research: -5, coding: 8, writing: -1, communication: 2, networking: 1 },
    career: 14, capital: 0, paperChance: .02, sponsors: true, advisorLike: -10, mentorSenior: 44, returnBias: .18 },
  mle: { id: 'mle', label: 'Applied ML / MLE', salary: 10000,
    blurb: 'Halfway between the two. You will ship something and also read three papers about it.',
    skills: { research: 1, coding: 5, math: 1, communication: 2, networking: 1 },
    career: 11, capital: 1, paperChance: .18, sponsors: true, advisorLike: -2, mentorSenior: 55, returnBias: .15 },
  natlab: { id: 'natlab', label: 'National laboratory summer associate', salary: 5200,
    blurb: 'The project is the closest thing on this board to your thesis chapter, by some distance.',
    skills: { research: 5, coding: 2, math: 3, writing: 2, networking: 2 },
    career: 3, capital: 7, paperChance: .35, usPersonOnly: true, advisorLike: 10, mentorSenior: 72, returnBias: -.05 },
  startup: { id: 'startup', label: 'A startup that has heard of you', salary: 6000,
    blurb: 'Four engineers, one problem, no process. You will touch everything and own none of it.',
    skills: { research: -2, coding: 6, communication: 3, networking: 3 },
    career: 12, capital: 0, paperChance: .08, sponsors: false, advisorLike: -4, mentorSenior: 40, returnBias: .10 },
  quant: { id: 'quant', label: 'Quantitative research at a trading firm', salary: 19000,
    blurb: 'A dataset, a desk, and a question nobody has written down. Two rounds are mental arithmetic under a clock.',
    skills: { research: -8, coding: 4, math: 6, writing: -1 },
    career: 10, capital: 0, paperChance: 0, sponsors: true, advisorLike: -22, mentorSenior: 50, returnBias: .12 },
  teaching: { id: 'teaching', label: 'Summer instructor, introductory programming', salary: 1800,
    blurb: 'Nine students, one whiteboard, one room with a window that opens.',
    skills: { research: 1, writing: 2, communication: 5, teaching: 8, networking: 2 },
    career: 2, capital: 3, paperChance: .05, onCampus: true, advisorLike: 8, mentorSenior: 60, returnBias: null },
};

// What your advisor says, and why. Every {token} is filled from the actual run.
export const hijackLines = {
  deadline: [
    '“And {venue}? The deadline is the second week of July. You want to write that on a laptop somebody else owns, in a building where the wifi logs everything?”',
    '“{venue} is in July. I have been building our submission plan around you since March. When were you going to mention that the plan had a hole in it?”',
    '“Look at the calendar. {venue} closes on the fourteenth. You will be in a session about the values.”',
  ],
  rebuttal: [
    '“What about {project}? The rebuttal window is July. I am not writing it, and nobody else in this lab is going to write it, because they are your numbers and only you know which ones are load-bearing.”',
    '“{project} comes back from review while you are gone. You want to be answering Reviewer 2 over a corporate VPN, at eleven at night, on the one week they schedule the intern social.”',
    '“The camera-ready for {project} is due while you are gone. It is four hours of work. It is four hours you will not have, because your calendar will belong to somebody else.”',
  ],
  owed: [
    '“The draft of {project} has been with me since April and I have been feeling guilty about it every week. If you leave, that guilt goes away, and it turns into your problem in September. I would rather it stayed my problem.”',
    '“You owe me {project}. Not in a debt way. In a — it is nearly there, and nearly there is where papers go to die.”',
  ],
  venue: [
    '“There is a {venue} deadline this summer. I had it in my head that this was the summer we finally got that one out. Apparently only one of us had that in their head.”',
    '“{venue} closes in the summer. Three uninterrupted months, no teaching, no classes, no committee. That window comes once a year and you are proposing to spend it in an open-plan office.”',
  ],
  milestone: [
    '“Your {milestone} is in August. You are going to prepare for it in the evenings, after eight hours of somebody else’s priorities. People tell me they will. I have watched them not.”',
  ],
  none: [
    '“The summer is when we make progress. It is the only three months without teaching, without classes, without the department wanting something. And you want to spend it somewhere else.”',
    '“I am not going to say no. I am going to say that I have had four students do this, and two of them never came back to the work in quite the same way, and I do not know in advance which two you are.”',
    '“It’s momentum, mostly. You have momentum right now.” You ask what momentum means in deliverables. They look at the window.',
    '“Is it the money?” — asked in a tone that makes it impossible to say yes.',
  ],
};

export const stanceLines = {
  bless: [
    '“Go. Obviously go. I did two of them and one of them is the reason I have a job.”',
    '“Take it. Ask them what they think is hard — that is the only thing worth bringing back. Everything else is under NDA anyway.”',
    '“Yes. And do the thing nobody does: keep a file of every problem they mention that they are not working on. That file is your next three papers.”',
    '“Good. Twelve weeks of being the least experienced person in a room is worth two of my seminars and I am aware of how that sounds.”',
  ],
  trade: [
    '“Fine. Get {condition} out the door before you leave and I will stop having opinions about your summer.”',
    '“Go. One condition: a message every second Friday. Not a report. Three lines. I want to know you still work here.”',
    '“Go, and come back with something I can use. Not their code — I know you cannot bring their code. An idea. A person. A problem they have given up on.”',
  ],
  forbid: [
    '“No. I fund you twelve months a year and I expect twelve months of work. That is what the appointment says.” It is not what the appointment says. You have read the appointment.',
    '“If you go, I will not be able to prioritise your paper in the autumn. That is not a threat, it is a description of my calendar.” It is both, and you both know which part.',
    '“Then go. But do not come to me in October and ask why the project stalled.”',
  ],
};

// What you can say back. 'go' is always available, always works, and is never free.
export const internMoves = {
  plan: { id: 'plan', label: 'Bring a written plan for the summer',
    hint: 'Writing and communication, against every objection they actually made.',
    line: 'You do not argue. You send one page: the deadline with a date beside it, who covers what, which weeks you are reachable, and what lands in September. It is impossible to answer with a feeling.',
    good: 'They read it twice. “Alright. This is a plan.” The objection was real and you answered the real objection, which is rarer than either of you expected.',
    bad: 'They skim it. “I don’t disagree with any of this.” Nothing moves. A plan is only as good as the willingness to be moved by one.' },
  money: { id: 'money', label: 'Say the number out loud',
    hint: 'The move nobody makes. Works on someone who cares; lands badly on someone who does not.',
    line: '“It is {salary} a month. My stipend is {stipend}. I am not telling you this to win an argument. I am telling you because you asked why and that is why.”',
    good: 'Something changes in the room. “…Right.” A long pause. “Yes. Go. And come and see me about the summer funding situation in September, because that is my problem, not yours.”',
    bad: '“We all made that trade.” They did. It was 1998 and rent was different, and neither of you is going to say that.' },
  connection: { id: 'connection', label: 'Tell them who the mentor is',
    hint: 'Networking. Turns your leaving into their acquisition.',
    line: '“The manager is {mentor}. They ran the group that wrote the paper you assigned me in my first year.”',
    good: 'You watch them recalculate in real time. “Oh. Well. That is different.” It is not different. It is the same twelve weeks. But it is different.',
    bad: '“I do not know them.” Said in a way that closes the subject and files the name away for later.' },
  ask_labmate: { id: 'ask_labmate', label: 'Ask someone in the lab who went',
    hint: 'Costs nothing. Tells you whether the objection is about the work.',
    line: 'You find {labmate}, who interned two summers ago, and ask the only question that matters: what did it actually cost?' },
  go: { id: 'go', label: 'Go anyway',
    hint: 'Always available. Always works. Never free.',
    line: '“I have thought about it. I am going to take it.” You do not add a reason. A reason invites a negotiation about the reason.' },
  decline: { id: 'decline', label: 'Turn the offer down',
    hint: 'The common answer, and not a failure of nerve.',
    line: 'You write the hardest email of the year and it is four sentences long. You delete the version with the explanation in it, because the explanation was for you.' },
};

export const labmateVerdicts = {
  fair: [
    '“Honestly? They were right. I lost the thread on my project and it took until January to find it again. Worth it anyway. Both things are true.”',
    '“Mine said the same and mine meant it. The summer cost me a paper cycle. I would still go.”',
  ],
  unfair: [
    '“They said the exact same sentence to me. Word for word. I went. Nothing happened. The paper came out in November like it was always going to.”',
    '“It was never about the deadline. It was about the twelve weeks. I went, they sulked for a month, and then it was over and I had a job offer.”',
  ],
};

// Coming home. What they say depends on how you left and what you brought back.
export const returnLines = {
  blessedPaper: 'You put the workshop paper on the table. They read the abstract standing up. “This is good.” A pause you could park a car in. “This is good.” They are never going to say the other sentence and you have stopped needing them to.',
  blessedNothing: '“Good summer?” “Yeah.” “Good.” And that is it — that is genuinely it — and you spend the following week waiting for a bill that never arrives.',
  hijackedPaper: 'You put the workshop paper on the table. They read it properly, which takes eleven minutes of silence. “Right.” Then, with visible effort: “That was a good use of the summer.” You will replay that sentence for a year.',
  hijackedNothing: '“How was it?” “Good.” “Good.” And then, not cruelly — in the flat voice of somebody doing arithmetic — “So we’re where we were in May.” It is true. That is the entire problem with it.',
  forbidden: 'They do not ask. Three weeks go by and they do not ask. Then, in a corridor, without breaking stride: “Did you learn anything?” You say yes. They say “Good,” and keep walking. That was the thaw.',
  rough: 'Nobody at the company said anything unkind, because companies do not. There was simply no return offer and no mention of one, and on the last Friday your badge stopped working at 6 p.m. while you were still at your desk.',
};

export const CPT_NOTE = 'Curricular Practical Training: authorised through the university, one form, three weeks, and a signature from a person who is on leave until the fourteenth. Twelve months of it total, ever, and every month you use is a month you cannot use after you graduate.';

// Who is hiring. Fictional, like everything else with a payroll in this game.
export const internEmployers = {
  research: ['Hexadecimal Labs Research', 'Cloudvale Research', 'The Bramble Institute', 'Lexicon.ai Research'],
  sde: ['Cloudvale', 'Overfit Technologies', 'Latency Zero', 'Nimbus Robotics'],
  mle: ['Lexicon.ai', 'Gradient Descent LLC', 'Stochastic Parrot Inc.', 'Cloudvale Applied'],
  natlab: ['Pinebrook National Laboratory', 'Coldwater National Laboratory', 'The Feldspar Institute for Applied Science'],
  startup: ['Fathom (Series A)', 'Tesselate', 'Nine Kettles', 'Corvid Compute'],
  quant: ['Bitter Lesson Capital', 'Meridian Quantitative', 'Halberd Trading', 'Second Moment Partners'],
  teaching: [],
};
