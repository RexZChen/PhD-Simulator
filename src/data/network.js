// The people you meet who are not in your lab.
//
// A PhD produces a second, invisible organisation chart: the person from the poster next to yours,
// the postdoc who answered your email at midnight, the professor who asked the good question. These
// people are worth more than almost anything else the degree gives you, and the game had them as a
// number called `connections`.
//
// Two things make this a game rather than a contact list. First, they drift: regard decays without
// contact, and below a floor they simply stop replying, which is not cruelty, it is what a busy
// person's inbox does. Second, a collaboration is a real cost — their work competes with your work
// for the same finite month, and the bigger the ask, the bigger both halves are. That trade is the
// hidden challenge of the middle years and nobody warns you about it either.

export const REGARD_FADE = 18;          // below this they stop replying
export const REGARD_DECAY = 1.6;        // per month without contact
export const NETWORK_MAX = 9;           // more than this and none of them are real

export const contactKinds = {
  prof: {
    id: 'prof', label: 'Professor', letters: true, clout: [55, 92],
    note: 'Can write you a letter. Has forty other people who also want one.',
  },
  postdoc: {
    id: 'postdoc', label: 'Postdoc', letters: false, clout: [30, 58],
    note: 'On the market themselves. The most useful person in any building and the least secure.',
  },
  researcher: {
    id: 'researcher', label: 'Research scientist', letters: true, clout: [42, 74],
    note: 'Industry lab. Publishes, sometimes. Can hire, eventually.',
  },
  student: {
    id: 'student', label: 'PhD student elsewhere', letters: false, clout: [12, 34],
    note: 'Your actual cohort, distributed across nine time zones. Will outlast every professor here.',
  },
};

// Where you met. It sets the opening regard and colours the first exchange.
export const metWhere = {
  conference: { id: 'conference', label: 'at {venue}', regard: [40, 62] },
  poster: { id: 'poster', label: 'at the poster next to yours', regard: [44, 66] },
  seminar: { id: 'seminar', label: 'after their seminar', regard: [30, 50] },
  review: { id: 'review', label: 'through a review you wrote', regard: [34, 54] },
  citation: { id: 'citation', label: 'because they cited you', regard: [46, 68] },
  intern: { id: 'intern', label: 'over a summer', regard: [52, 74] },
  intro: { id: 'intro', label: 'through an introduction', regard: [38, 58] },
};

// A short discussion. Cheap, and the whole system runs on it, because a relationship that is only
// ever used for asks is not a relationship and everybody can feel that.
export const talkLines = {
  prof: [
    'Twenty minutes on a call. They spend eleven of them on a tangent about a paper from 2011 and the tangent turns out to be the answer to your chapter three.',
    'They reply to your question with three sentences and a PDF. The PDF is their own unpublished note from four years ago and it is better than the published version.',
    'You ask what they are working on. They tell you, at length, with obvious delight, and you remember that people do this because they like it.',
    'They ask how the thesis is going and then, unusually, wait for the real answer rather than the polite one.',
  ],
  postdoc: [
    'Forty minutes, most of it about the job market, and you come away with a spreadsheet template and a genuinely alarming amount of candour.',
    'They tell you which parts of their pipeline are held together with tape. It saves you three weeks and they do not appear to think it was a favour.',
    'A long message thread about a bug that turns into a long message thread about whether either of you should stay in academia.',
  ],
  researcher: [
    'A call from a room with a very good microphone. They cannot say what the team is doing and manage to be useful anyway.',
    'They read your draft on a flight and send back comments that are shorter and sharper than any review you have had.',
    'You ask what would make this publishable at their lab. The answer is one experiment and it is not the one you expected.',
  ],
  student: [
    'Two hours of messages that start about a baseline and end about advisors. You both feel considerably better afterwards.',
    'They send you their failed version of the same idea, unprompted, with a note saying “so you do not lose the fortnight I lost.”',
    'A shared document of things nobody told either of you. It is now four pages long.',
  ],
};

// The ask. Size is the whole design: a small favour is nearly free and buys little, and the huge one
// is a month of your life and can change the run.
export const collabAsks = {
  small: {
    id: 'small', label: 'Something small', weeks: 1,
    cost: { energy: -8, progress: -4 },
    reward: { regard: 10, academicCapital: 3, career: 2 },
    tasks: [
      'Run their baseline on your setup and send the numbers.',
      'Read fourteen pages and say whether the argument holds.',
      'Reproduce one figure. Just the one. It will not be just the one.',
      'Sanity-check a proof they are ninety per cent sure of.',
    ],
  },
  real: {
    id: 'real', label: 'A real piece of work', weeks: 2,
    cost: { energy: -16, progress: -10, stress: 6 },
    reward: { regard: 20, academicCapital: 7, career: 5, evidence: 6 },
    tasks: [
      'Own the experiments section. All of it, including the appendix nobody reads.',
      'Take their half-finished pipeline and make it run on data it has never seen.',
      'Write the related work and the rebuttal. Both. In three weeks.',
      'Build the evaluation harness the whole collaboration will use, which means everyone will find its bugs.',
    ],
  },
  huge: {
    id: 'huge', label: 'The one that eats a month', weeks: 4,
    cost: { energy: -26, progress: -22, stress: 14, draft: -8 },
    reward: { regard: 34, academicCapital: 14, career: 12, evidence: 12, hope: 6 },
    tasks: [
      'Be first author on the joint paper. Their deadline, not yours.',
      'Lead the multi-site study. Four groups, three time zones, one shared spreadsheet that somebody will break.',
      'Port the entire thing to their infrastructure before their grant report is due.',
      'Write the survey everyone keeps saying somebody should write.',
    ],
  },
};

export const collabDone = {
  small: 'Done, on time, without being chased. That is rarer than it sounds and they notice it more than the work.',
  real: 'It lands, it works, and they say so to somebody else, which is the part that matters.',
  huge: 'A month of your life, and at the end of it there is a thing with both your names on it and a person who will pick up the phone for the rest of your career.',
};

export const collabMissed = {
  small: 'You do not get to it. It was two days of work. Neither of you mentions it again and something small is gone.',
  real: 'The deadline passes. They do it themselves at eleven at night and say “no problem at all,” and mean about sixty per cent of that.',
  huge: 'It collapses, publicly, with three other people watching. They are gracious about it. You will think about this in the shower for two years.',
};

// What happens when you stop being someone they email.
export const fadeLines = [
  '{name} has not replied in five weeks. There is no falling-out and no explanation. Their inbox simply reordered itself and you are below the fold now.',
  'You send {name} a follow-up. It is the third follow-up. You decide, quietly, not to send a fourth.',
  '{name} moved institutions and the old address bounces. You could find the new one in about four minutes. You do not.',
];

export const rekindleLines = [
  '{name} replies after eleven weeks, apologises for nothing, and picks the conversation up exactly where it was.',
  'You see {name} across a room at a conference and they come over first, which resolves a question you had been carrying.',
];

// Asking a professor for a letter, outside your committee. Their regard is the whole gate.
export const letterAsk = {
  yes: '“Of course. Send me the CV, the statement, and a paragraph reminding me what you did — I will not remember the details and I would rather write it right.” That last sentence is what a good letter costs and almost nobody asks for it.',
  lukewarm: '“Happy to.” Two words, sent in nine seconds, from a phone. You will never know what is in it, and neither will you know that this is the one that hurt.',
  no: '“I do not think I know your work well enough to write you a strong one, and a weak one is worse than none.” It is the kindest sentence in this entire game and it does not feel like it today.',
};

export const introLines = {
  yes: '“You should talk to {who}.” The email goes out that afternoon with you cc\'d, which is a different thing entirely from being told to reach out.',
  no: 'They say they will think about who would be right. They are not being evasive; they are being careful, because an introduction spends their credit and not yours.',
};

export const netNote = 'People you met who are not in your lab. They drift if you never write, and below a certain point they stop replying — which is not personal and does not feel that way.';
