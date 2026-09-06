// Recommendation letters. Four minimum, for faculty jobs and postdocs only; industry asks
// for referees it never calls. The number is easy. What is in them is not, and you never
// find out — which is the entire problem with them.

export const LETTERS_REQUIRED = 4;

// Who can be asked, and what each one is actually worth. `reach` is how far outside your
// advisor's orbit they sit — a letter from inside the lab says less than one from outside it.
export const writerKinds = {
  advisor: {
    id: 'advisor', label: 'Your advisor', reach: 0, mandatory: true,
    blurb: 'The one letter every committee reads first and the only one that cannot be missing.',
    note: 'Absent it, the file reads as a question nobody wants to ask out loud.',
  },
  committee: {
    id: 'committee', label: 'A committee member', reach: 2,
    blurb: 'They have read the dissertation. That is rarer among your letter writers than you think.',
    note: 'Different department, usually. Committees like hearing from outside the lab.',
  },
  collaborator: {
    id: 'collaborator', label: 'An external collaborator', reach: 3,
    blurb: 'Someone at another institution who has seen you work, not just seen you present.',
    note: 'The strongest letter available to you that your advisor did not arrange.',
  },
  mentor: {
    id: 'mentor', label: 'Your internship mentor', reach: 2,
    blurb: 'Industry senior. Reads well for industry research, thinner for a tenure-track search.',
    note: 'They will write it in one sitting and it will be warm and slightly generic.',
  },
  senior: {
    id: 'senior', label: 'A senior professor in the department', reach: 1,
    blurb: 'Prestigious, busy, and has spoken to you perhaps eleven times.',
    note: 'A big name who barely knows you is the classic way to acquire a dark horse.',
  },
  postdocmate: {
    id: 'postdocmate', label: 'The postdoc who supervised you day to day', reach: 0,
    blurb: 'Knows your work in more detail than anyone, including you.',
    note: 'Junior, so committees weight it down no matter how good it is.',
  },
  chair: {
    id: 'chair', label: 'The department chair', reach: 1,
    blurb: 'Will confirm you existed, on letterhead, with a seal.',
    note: 'A formality that fills a slot and moves nothing.',
  },
};

// What they say when you ask. Not whether they say yes — whether they mean it.
export const askLines = {
  warm: [
    '“Yes. Send me your materials and the list, and give me three weeks — not because it takes three weeks, but because that is when I will do it.”',
    '“Of course. Write me two paragraphs about what you think your contribution is. Not for me to copy. For you to have written it down.”',
    '“Happily. And send me the list of places, because I know people at four of them and a letter is not the only thing I can do.”',
  ],
  dutiful: [
    '“Sure, send the details.” No question about the work, no request for materials, no date.',
    '“Yes, that is fine.” It arrives eleven minutes before the portal closes and you will never see it.',
    '“Remind me in October.” You remind them in October. “Remind me in November.”',
  ],
  hedged: [
    '“I can write you a letter.” The stress is on *can*, and it is doing an enormous amount of work.',
    '“I would be happy to — though you should know I do not think I can speak to the research in much detail.”',
    '“Are you sure I am the right person? I want you to have the strongest possible file.” This is a real question and the honest answer is no.',
  ],
  refused: [
    '“I do not think I know your work well enough to write you a strong letter, and a lukewarm one is worse than none.” This is the kindest thing anyone does for you all year.',
    '“I am writing for two others in your area and I do not think I can write a third that helps you.” True, and also a sentence with a floor under it.',
  ],
};

// What the packet looks like from outside, once it is closed. The player sees this; the
// committee sees something else.
export const packetVerdicts = {
  strong: 'Four letters, three of them from people who have read the work rather than watched the talk, and one from outside the institution entirely. This is the file the advice column describes.',
  solid: 'Enough letters, from people who know you. It is a normal, competent file and normal competent files get interviews.',
  thin: 'The number is met. Two of them will say you were enrolled, which committees can read at a hundred paces.',
  inside: 'Every letter comes from inside your advisor’s orbit. Committees notice, and read it as a smaller world than you have actually lived in.',
  short: 'Not enough letters. Faculty searches and postdocs will not open the file at all.',
};

// The dark horse. One writer says something quiet and fatal, and nobody ever tells you.
export const darkHorseLines = [
  'strong technically, though I would characterise the independence as still developing',
  'a good student in a very well-supported environment',
  'I would rank them in the upper half of students I have supervised',
  'has done what was asked, consistently and well',
  'I am confident they will find a good position somewhere',
];

export const RANK_NOTE = 'Every letter is confidential. You waive the right to read them on the first form, because not waiving it is worse.';
