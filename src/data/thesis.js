// The months between defending and being done, which nobody warns you about.
// You passed. You are called Doctor. You are also still writing.

// What the committee wants before it will sign. Drawn by how the defense went.
export const revisionItems = [
  { id: 'chapter4', label: 'Rewrite Chapter 4', weight: 3, effort: 3, line: 'Chapter 4 was fine in the room and is not fine on the page. It was always going to be Chapter 4.' },
  { id: 'relatedwork', label: 'Expand the related work', weight: 3, effort: 2, line: 'Twelve more citations, including two by a committee member, which is either rigour or arithmetic.' },
  { id: 'limitations', label: 'Write an honest limitations section', weight: 2, effort: 2, line: 'They want you to say what it cannot do. You have been saying it for years, out loud, to nobody.' },
  { id: 'experiment', label: 'Run the experiment they asked about', weight: 2, effort: 4, line: 'It was one question in a two-hour defense. It is now three weeks.' },
  { id: 'framing', label: 'Reframe the introduction', weight: 2, effort: 2, line: '“Tell the story you told in the talk, not the one in the paper.” The talk was better. You know it was better.' },
  { id: 'figures', label: 'Redo every figure at print resolution', weight: 2, effort: 1, line: 'Vector, not raster. Consistent axes. One font. It takes a weekend and improves nothing except the thing itself.' },
  { id: 'appendix', label: 'Move half of it to an appendix', weight: 2, effort: 1, line: 'The chapter you were proudest of goes to the back. It is still there. Nobody will read it there either.' },
  { id: 'typos', label: 'Fix the 340 typos your second reader found', weight: 3, effort: 1, line: 'They read all of it. Every page. You had assumed nobody would ever read all of it.' },
  { id: 'permissions', label: 'Get copyright permission for your own figures', weight: 1, effort: 1, line: 'You must formally request permission from a publisher to reuse a figure you drew, in a thesis about work you did.' },
];

// The formatting check, which is not about the research.
export const formatFaults = [
  'The margins are 1.0 inch. The margins must be 1.0 inch. The machine disagrees and does not elaborate.',
  'Page 3 of the front matter has a page number. It must not have a page number.',
  'Your name appears as “Alex Student” on the title page and “Student, Alex” in the abstract. Pick one; the university has.',
  'The table of contents lists a section that you renamed in March. It has been wrong since March.',
  'A single figure caption is in 11pt. Everything else is 12pt. The machine found it in four seconds.',
  'The PDF has an embedded font that is not on the approved list. There is an approved list.',
];

// Your advisor, who is delighted, and still not finished with you.
export const postDefensePings = {
  early: [
    'Congratulations, Doctor. Now: Chapter 4.',
    'Well done in there. Genuinely. Send me the revision plan by Friday.',
    'You were good. The committee liked it more than they let on. Two of them want changes, and one of them is right.',
  ],
  chasing: [
    'How are the revisions? No rush — the deposit deadline is the 15th.',
    'Second reader sent their marked-up copy. It is thorough. I am sorry.',
    'Any movement on the limitations section? It is the last thing between you and never thinking about this again.',
    'I know you have started the job. Finish the thesis. People do not finish the thesis.',
  ],
  late: [
    'You are three weeks past. I am not chasing you as your advisor; I am chasing you as someone who has seen this go badly.',
    'Every year one person does not deposit. Every year it is someone who defended well.',
  ],
  done: [
    'Deposited. That is it. That is the whole thing. Go and be a person for a fortnight.',
    'The library has it. Nobody will read it and it will exist forever, which is more than most things manage.',
    'Signed. Filed. Done. I am going to say something I do not say often: I am proud of you.',
  ],
};

// The ceremony, months later, in a rented gown.
export const hooding = {
  subject: 'Are you coming back in May?',
  body: 'The department needs numbers for the hooding ceremony. You defended in {month}, so you are already Doctor on paper and have been for a while — but the gown, the hood, the walk across the stage and the part where I get to put it over your head all happen in May.\n\nIt is not compulsory. It costs a flight you now, technically, earn enough to afford. Your family would like it more than you will admit.\n\nEither way: you did the thing.',
  choices: [
    { id: 'come', label: 'Fly back for it', line: 'You rent a gown that does not fit and stand in a line of people you spent six years with and barely know. Your advisor gets the hood the wrong way round on the first try, in front of everyone, and you both laugh in a way neither of you has laughed in the lab. Your family takes 200 photographs. You keep four.', effects: { hope: 18, trust: 12, money: -700 } },
    { id: 'family', label: 'Fly back, and bring whoever kept you alive', line: 'You bring the person who cooked when you could not, or the parent who never once asked when you would be finished. They meet your advisor. The two of them talk for twenty minutes about you as though you are not standing there. It is the best part of the day.', effects: { hope: 24, trust: 12, money: -1400 }, needs: 'social' },
    { id: 'skip', label: 'Skip it — you have a job now', line: 'You are three weeks into the new role and taking a Thursday off feels impossible in a way it will not, in hindsight, have actually been. Your advisor mails the hood in a box. You find it two moves later, still in the box, and it is the first time any of it makes you cry.', effects: { hope: 6, trust: -2 } },
    { id: 'later', label: 'Ask if you can do it next year instead', line: 'They say yes, of course, people do it all the time. You go the following May with a year of distance and enjoy it more than you would have. The photographs are better because you are, by then, sleeping.', effects: { hope: 14, trust: 6, money: -700 } },
  ],
};
