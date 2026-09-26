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
      '“I think so — with one condition: {condition}.” You write it down. For once, “nearly there” has something attached that can be checked.',
      '“Yes, if {condition}. Let us put that in the plan.” You ask them to confirm the wording. A shared sentence is a better starting point than two memories.',
      'They think for a long time. “Here is what I need before we agree a date: {condition}.” You write it down before either of you can remember it differently.',
    ],
  },
  notReady: {
    id: 'notReady',
    label: 'They say the record is not ready',
    lines: [
      '“Not yet. I need a stronger research record before I can support that target.” They point to the work rather than your character. It is still not the answer you wanted.',
      '“I do not want us to agree a date the work cannot support.” You look back at the record together. The conversation is disappointing without needing a villain.',
      'They turn the laptop round to the research record. “This is what we can point to today. I need more before I can back the earlier target.” The calendar remains open beside it.',
    ],
  },
  deflect: {
    id: 'deflect',
    label: 'They move the goalposts',
    lines: [
      '“Let’s see how the year goes.” You ask what specifically would need to be true. “You’ll know.” You will not know. That is the point.',
      '“You’re not ready.” You ask what ready looks like. They say “more mature.” You ask what that means in deliverables. They look at the window.',
      '“It would be a shame to rush it after all this work.” You leave a space under “remaining work” in your notes. They do not fill it.',
      '“A serious thesis takes the time it takes.” You ask how to turn that into a plan. They repeat it more slowly, as if the problem were the delivery.',
    ],
  },
};

// The bar a reasonable advisor sets. Concrete, checkable, and agreed in the room.
export const conditions = [
  { id: 'onepaper', text: 'one more accepted paper', check: 'accepted', line: 'One more acceptance. Not a submission — an acceptance.' },
  { id: 'submitted', text: 'the last chapter submitted somewhere real', check: 'submitted', line: 'It has to be out the door, at a venue you would name at a party.' },
  { id: 'draft', text: 'a complete dissertation draft', check: 'draft', line: 'All of it. Bad, but all of it. Bad and complete beats good and partial.' },
  { id: 'handover', text: 'the pipeline documented and handed to someone', check: 'handover', line: 'Write down how the pipeline runs and make it usable by someone else. The exit plan needs fewer things that depend on finding you in the corridor.' },
];

// How the player can answer. This is the whole mechanic.
export const moves = {
  evidence: {
    id: 'evidence', label: 'Come back with the record, written down',
    hint: 'Communication + your actual file. The strongest move if the file is real.',
    line: 'You put the research record and proposed timeline on one page, including the gaps. There is now something specific to discuss. Whether they discuss it is another question.',
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
    line: 'You ask for committee input on the finishing criteria, keeping the request about the work and the proposed timeline. Even carefully neutral wording announces that this is no longer a private conversation.',
    good: 'Committee backing gives your proposal more weight. Your advisor is less pleased about how it arrived. You have gained support, not a booked defense.',
    bad: 'The request gets back to your advisor without the backing you hoped for. “We could have discussed this here.” You thought that was what you were trying to do.',
  },
  second: {
    id: 'second', label: 'Ask someone who left the lab',
    hint: 'Costs nothing. Tells you whether the objection is real.',
    line: 'You ask a former lab member how to read this response: a research gap, or a moving target? They can offer a perspective, not a signature.',
    good: null, bad: null,
  },
  offer: {
    id: 'offer', label: 'Put the offer on the table',
    hint: 'The strongest move available and the one with a shadow. Once per run.',
    line: 'You do not threaten. You say the date on the offer letter out loud, and then you stop talking, which is the whole move.',
    good: 'Something reorders itself behind their eyes. “Right. Then we make it work for spring.” The year you have been asking for arrives in nine seconds, having refused to arrive in nine months.',
    bad: '“An offer does not settle the research question.” They do not agree to the target. The offer is still there; the conversation has become harder.',
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
    'They look over what you describe. “I would start with the work they are asking for. There seems to be a real gap to discuss, even if you dislike the answer.”',
    '“Ask for the remaining work in writing. From what you have told me, I would not assume the objection is just a way to keep you.”',
  ],
  unfair: [
    'A pause. “You have a record worth discussing. If the answer never becomes a list of work, I would stop treating another paper as the whole solution.”',
    '“Ask what would count as enough, and who else can assess it. A committee can be useful when one person keeps the definition to themselves.”',
    '“Get the criteria in writing. Not because a document works miracles, but because it is harder to quietly change something both of you can read.”',
  ],
};
