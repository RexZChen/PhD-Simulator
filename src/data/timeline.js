// "Can I graduate next year?" — the conversation that decides whether the PhD is five
// years or six, and which almost never turns on the research alone.

// What your advisor says when you finally ask. Four stances, and only one of them is a yes.
export const stances = {
  yes: {
    id: 'yes',
    label: 'They say yes',
    lines: [
      'They do not hesitate, which tells you they had already decided. “Next spring. Start the job market in the autumn and we will build the thesis around what you have.”',
      '“I wondered when you were going to ask.” They open a calendar. “Defense in May. That gives us the autumn for the last paper and the winter to write.”',
      '“Yes.” One word, and then twenty minutes of practical planning, and you realise you had braced for a fight that was never coming.',
    ],
  },
  conditional: {
    id: 'conditional',
    label: 'They name a condition',
    lines: [
      '“I think so — with one thing.” They name it. It is specific, it is achievable, and it is written down before you leave the room. This is what a fair answer looks like.',
      '“Realistically? Yes, if {condition}. I am not going to move that once we agree it.” They do not move it. Not every advisor is the story you have heard.',
      'They think for a long time. “Get me {condition} and I will write the letter in October.” It is more than you wanted to do and less than you feared.',
    ],
  },
  notReady: {
    id: 'notReady',
    label: 'They say not yet, and they are right',
    lines: [
      '“Honestly? No. Not because of you — because there is not a thesis there yet.” They walk you through what is missing. It is a short list and every item on it is true.',
      '“I would be doing you harm.” They mean it. You go home angry and, four days later, look at your own record and stop being angry.',
      'They turn the laptop round and show you the shape of what you have. It is not a dissertation. It is three quarters of one, and three quarters is not a number the university accepts.',
    ],
  },
  deflect: {
    id: 'deflect',
    label: 'They move the goalposts',
    lines: [
      '“Let’s see how the year goes.” You ask what specifically would need to be true. “You’ll know.” You will not know. That is the point.',
      '“You’re not ready.” You ask what ready looks like. They say “more mature.” You ask what that means in deliverables. They look at the window.',
      '“It would be a shame to rush it after all this work.” They said the same sentence last year about a different piece of work.',
      '“I have never had a student finish in five.” This is presented as a law of nature rather than a description of their own practice.',
    ],
  },
};

// The bar a reasonable advisor sets. Concrete, checkable, and agreed in the room.
export const conditions = [
  { id: 'onepaper', text: 'one more accepted paper', check: 'accepted', line: 'One more acceptance. Not a submission — an acceptance.' },
  { id: 'submitted', text: 'the last chapter submitted somewhere real', check: 'submitted', line: 'It has to be out the door, at a venue you would name at a party.' },
  { id: 'draft', text: 'a complete dissertation draft by the winter', check: 'draft', line: 'All of it. Bad, but all of it. Bad and complete beats good and partial.' },
  { id: 'handover', text: 'the pipeline documented and handed to someone', check: 'handover', line: 'You are the only person who can run it. That is a problem they are asking you to solve before you leave.' },
];

// How the player can answer. This is the whole mechanic.
export const moves = {
  evidence: {
    id: 'evidence', label: 'Come back with the record, written down',
    hint: 'Communication + your actual file. The strongest move if the file is real.',
    line: 'You do not argue. You send a one-page document: papers, status, citations, teaching, the timeline, the gap. It is impossible to answer with a feeling.',
    good: 'They read it twice. “Alright. This is a case.” The tone in the room changes because the thing on the table is now evidence rather than your character.',
    bad: 'They skim it. “I don’t disagree with any of this.” Nothing happens. A document is only as strong as the person’s willingness to be moved by one.',
  },
  date: {
    id: 'date', label: 'Name a date and hold it',
    hint: 'Confidence. Says the thing out loud and refuses to unsay it.',
    line: '“I am planning to defend in May. I would like your support. I am telling you rather than asking because I have thought about it for a long time.”',
    good: 'Something recalibrates. They are not used to it and, to their credit, they respect it. “May. Alright. Then we work backwards.”',
    bad: '“That is not your decision alone.” It is, partly, and you both know which part — but not today, and not without a cost.',
  },
  committee: {
    id: 'committee', label: 'Take it to your committee',
    hint: 'Networking. Real leverage, and it changes the relationship.',
    line: 'You email the two committee members who answered every email and ask, neutrally, what they would want to see before signing. They answer in three days with a list.',
    good: 'The list is shorter than your advisor’s and it is in writing from people your advisor cannot easily overrule. A meeting is scheduled. The word “timeline” appears in an agenda.',
    bad: 'One of them forwards your email to your advisor with “thought you should see this.” The next meeting is cold in a way that lasts a term.',
  },
  second: {
    id: 'second', label: 'Ask someone who left the lab',
    hint: 'Costs nothing. Tells you whether the objection is real.',
    line: 'You find the student who graduated two years ago and ask the only question that matters: was it about the work?',
    good: null, bad: null,
  },
  offer: {
    id: 'offer', label: 'Put the offer on the table',
    hint: 'The strongest move available and the one with a shadow. Once per run.',
    line: 'You do not threaten. You say the date on the offer letter out loud, and then you stop talking, which is the whole move.',
    good: 'Something reorders itself behind their eyes. “Right. Then we make it work for spring.” The year you have been asking for arrives in nine seconds, having refused to arrive in nine months.',
    bad: '“Then you should take it.” Said evenly, and meant as an ending. The room is very quiet and you have spent something you cannot get back.',
  },
  accept: {
    id: 'accept', label: 'Accept the extra year',
    hint: 'The common answer. A year is a year.',
    line: 'You say “that makes sense,” and mean about sixty percent of it. A sixth year is the median outcome and it is not a defeat; it is just longer.',
  },
};

// What the ex-student tells you, which is the truth the game otherwise hides.
export const secondOpinions = {
  fair: [
    'They think for a second. “With mine? It was about the work. When I had the papers, they signed. Annoying, but straight.”',
    '“Honestly — if they said not yet, it is probably not yet. Mine never played games with the timeline.”',
  ],
  unfair: [
    'A pause on the line. “It was never about the work. I finished the year I stopped asking and started telling.”',
    '“Same words. Word for word, actually — ‘more mature.’ I got out by going to the committee. I would do it a year earlier if I could.”',
    '“They kept me a seventh year and I had more papers than you do now. Get it in writing or it is not real.”',
  ],
};
