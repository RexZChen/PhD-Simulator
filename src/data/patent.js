// The patent.
//
// It is not an event. It is a process with its own calendar, and the calendar is the joke: roughly
// a year from the first meeting to a filing, then a rejection — the first office action is a
// rejection almost every time, and nobody warns a first-time inventor about that — then several
// more months of argument, conducted by lawyers, at a cost you never see, about the meaning of
// sentences you wrote.
//
// The invention share is the other half. At most US universities the inventor's cut of licensing
// income is split among the named inventors, and the person who did the work is one name on a list
// that includes the person who suggested the direction. Seventy-thirty is not unusual and is not
// negotiable, and the paperwork calls it "in accordance with policy."

export const PATENT = {
  meetings: 3,          // back-and-forth with the innovation office before anything is filed
  fileAfter: 12,        // months from first meeting to a filing that appears anywhere
  actionAfter: 10,      // months from filing to the first office action, which is a rejection
  grantAfter: 8,        // months of argument after that, if you keep going
  advisorShare: 70,     // per cent, of the inventors' portion
};

// The innovation office, working out what your paper says. It is written down. They ask anyway.
export const patentMeetings = [
  { id: 'p_meet1', title: 'The innovation office would like to understand the invention',
    text: ['A lawyer, a paralegal, and a screen share. They have your paper open. The first question is “so, in plain language, what does it do?” and you answer it, and then you answer it again forty minutes later in different words.',
      'Two hours scheduled. They have read the abstract. The method is in section three, with a diagram, and they ask you to describe the diagram out loud while looking at the diagram.'],
    choices: [
      { id: 'plain', text: 'Explain it as plainly as you can', hint: 'The whole skill; also exhausting', effects: { energy: -6, writingQuality: 4 }, gain: 1,
        result: 'You get it down to two sentences a non-specialist can hold. It takes ninety minutes and it is the best abstract you have ever written, and it will never appear in a paper.' },
      { id: 'precise', text: 'Insist on the precise formulation', hint: 'Correct; slows everything down', effects: { energy: -7, stress: 4 }, gain: 1,
        result: 'You will not let them write "essentially" and you are right not to, because "essentially" is where a claim goes to die. They write it down with visible patience.' },
      { id: 'defer', text: 'Let them summarise it and nod', hint: 'Fast, and it will cost you in the claims', effects: { energy: -2 }, gain: 0,
        result: 'Their summary is eighty per cent right. The twenty per cent is the part that makes it novel and it is now the part that is not in the draft.' },
    ] },
  { id: 'p_meet2', title: '“And what would somebody do with this?”',
    text: ['Meeting two. A different lawyer, who has not been briefed by the first one, asks the same question with a slightly different verb.',
      'They want an application. Not the research contribution — an application, with a customer in it, that a examiner in Virginia will find plausible.'],
    choices: [
      { id: 'use', text: 'Invent three concrete applications on the spot', hint: 'Salesmanship; a real skill', effects: { energy: -5, hype: 4, career: 3 }, gain: 1,
        result: 'You make up three uses, two of which are plausible and one of which somebody actually builds four years later, having read the patent.' },
      { id: 'honest', text: '“I do not know yet. That is what research is.”', hint: 'True; unhelpful here', effects: { energy: -3, stress: 3 }, gain: 0,
        result: 'The lawyer, kindly: "I understand. I do need something for the box." There is a box. The box must contain something.' },
      { id: 'ask', text: 'Ask what makes a claim survive', hint: 'Turn the meeting into a lesson', effects: { energy: -4, career: 4 }, gain: 1,
        result: 'Twenty minutes on claim construction from somebody who does it every day. It is genuinely the most useful thing anyone teaches you this year and it has nothing to do with your field.' },
    ] },
  { id: 'p_meet3', title: 'The claims, one more time',
    text: 'Draft four. They have broadened claim one to the point where you think it covers a bicycle, and narrowed claim seven to the point where it covers only your exact experiment.',
    choices: [
      { id: 'push', text: 'Push back on both', hint: 'Costs a fortnight; it is your name on it', effects: { energy: -6, stress: 4 }, gain: 2,
        result: 'You get claim one narrowed to something defensible and claim seven widened to something worth having. This is the single highest-leverage hour of the entire process.' },
      { id: 'sign', text: 'Sign it off', hint: 'They do this professionally. Mostly.', effects: { energy: -2 }, gain: 1,
        result: 'They do know what they are doing. They also have eleven other files this month and yours is not the one keeping anybody awake.' },
      { id: 'advisor', text: 'Send it to your advisor to review', hint: 'A second reader who has done this before', effects: { energy: -3, satisfaction: 3 }, gain: 1,
        result: 'They read it in an evening and flag two things. Both are real. This is the part of the seventy per cent that is actually earned, and it is about four hours of work.' },
    ] },
];

export const patentFiled = [
  'Filed. A number, a date, and a line that will appear on your Google Scholar profile in about a year, indexed next to your papers as though it were one.',
  'The application goes in. You are, as of this afternoon, a named inventor on a document you are not allowed to change, describing a thing you built in a room with no windows.',
];

// The first office action is a rejection. Almost always. Nobody tells first-time inventors this.
export const officeAction = {
  text: ['A document arrives. It is forty-one pages and it rejects every claim.\n\nThis is normal. This is so normal that the lawyers have a form response. It is still, for about two hours, the most demoralising piece of paper you have ever been sent, and it is written in a register that makes a Reviewer 2 look warm.',
    'Non-final rejection. Claims 1 through 14: obvious in light of prior art. The prior art is a 1998 patent about something adjacent, held by a company that no longer exists, and you have read it four times and it is not the same thing.'],
  choices: [
    { id: 'fight', text: 'Work through it with the lawyer, claim by claim', hint: 'Three weekends; it is how these are won', effects: { energy: -9, stress: 6, writingQuality: 3 }, odds: .3,
      good: 'You find the distinction — one sentence, in the 1998 document, that concedes exactly what your method does not need. The lawyer says "that is the argument" and drafts around it.',
      bad: 'You do the work and the argument is thin and the lawyer says so, gently, and files it anyway because filing something is the job.' },
    { id: 'lawyer', text: 'Leave it entirely to the lawyer', hint: 'They are competent; they are not you', effects: { energy: -2, stress: 3 }, odds: .16,
      good: 'They handle it. It works. You find out by email, in a sentence, four months later.',
      bad: 'Their response argues a point you would not have argued, because they do not know which part of this is actually new. It is rejected again.' },
    { id: 'narrow', text: 'Narrow the claims until they are certain to be allowed', hint: 'A patent nobody can infringe is a patent nobody needs a licence for', effects: { energy: -5, career: -3 }, odds: .62,
      good: 'Allowed. It covers your exact experiment and almost nothing else, and it will sit on your CV being technically a patent for the rest of your life.',
      bad: 'Even narrowed, the examiner is not persuaded. There is a phone interview. There is always a phone interview.' },
  ],
};

export const patentGranted = [
  'Granted. Two years and four months after a meeting about what your paper says.\n\nThere is a certificate. It is genuinely beautiful — a heavy paper stock, a gold seal, and a red ribbon — and it arrives in a cardboard tube addressed to the department. Your name is on it, second, after your advisor\'s, because that is alphabetical and also because that is how it goes.',
];
export const patentAbandoned = [
  'Abandoned. The office declined to keep paying the fees on a claim set nobody had licensed, which is the correct commercial decision and is not how it feels.\n\nIt stays on your Scholar profile as an application, forever, with the word "pending" that will never resolve.',
];

export const patentShare = 'The inventors\' share is split in accordance with policy: {advisor}% to the senior inventor, {you}% to you. You wrote it, you built it, you sat through six meetings explaining what a matrix is. The split was set in 1994 by a committee and is not, the form notes, subject to appeal.';

export const patentNote = 'Somewhere between one and two per cent of university patents ever earn more than they cost to file. This is one of the ones that will not, almost certainly, and it is on your CV forever, which is the part that is actually worth something.';
