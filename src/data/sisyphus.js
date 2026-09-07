// The boulder, and the exact moment it rolls back down.
//
// An acceptance is the best day of the year. It is congratulated in writing, congratulated out loud
// in front of the lab — where the compliment is doing a second job on everybody else in the room —
// and then, a specific number of weeks later, a question arrives that is genuinely warm, genuinely
// curious, and puts you back at the bottom of the hill.
//
// The interval is the whole design. An Empire Builder asks within a fortnight. An Academic Parent
// gives you two months. Nobody ever says "take a break" and means a length of time.

// Written, within a day. This one is unambiguously kind.
export const acceptMail = [
  { subject: 'Congratulations', body: 'Really pleased for you — this was a hard one and you stayed with it much longer than most people would have.\n\nEnjoy this. Genuinely. It does not happen often enough to waste.' },
  { subject: 'Well done', body: 'Saw the notification. Excellent.\n\nI have forwarded it to the chair, and to two people who should have cited you last year and now will have to.' },
  { subject: '(no subject)', body: 'YES.\n\nThat is the whole email. I will send a longer one and I will not, so: yes.' },
  { subject: 'Congratulations — nicely done', body: 'The reviewers were harder on this than they needed to be and you answered all of it without getting defensive, which is a thing about half of people never learn.\n\nTell your family. They have been waiting for something they can understand.' },
];

export const acceptChat = [
  '🎉 {venue}!! Extremely well deserved. Do not open a laptop tomorrow.',
  'Congratulations. That is a real paper at a real venue and nobody can take it off you.',
  'Just saw. Delighted. Genuinely one of the better weeks I have had this term.',
  '👏 That is two years of work and about four people on earth know how hard it was. I am one of them.',
];

// Out loud, at group meeting, in front of everybody. Warm, sincere, and doing a second job.
export const acceptVerbal = [
  '“Before we start — {you} had a paper accepted at {venue} this week.” A round of applause that is genuine and lasts about four seconds. Then: “Which is what happens when somebody stays with one problem for two years.”\n\nEverybody in the room hears the second sentence. It is aimed at the room. It is also completely true, which is what makes it work.',
  '“{you} got into {venue}.” They say the venue name slightly slowly, so that it lands. “Third submission. Third.” They look around the table on the word.\n\nTwo people write something down. One of them is not writing down congratulations.',
  '“This is what it looks like when the rebuttal is done properly.” They put your rebuttal on the screen. Your actual rebuttal, with your sentences in it, in front of nine people.\n\nIt is the proudest four minutes of your year and you would still rather they had asked first.',
  '“Everyone — {venue} for {you}.” Applause. Then, to the room, pleasantly: “It is a good venue. It is not out of reach for anybody sitting here.”\n\nThe compliment is yours. The sentence after it belongs to somebody else.',
];

// And then, {n} weeks later.
export const nextProject = {
  title: 'A question at the end of a good meeting',
  text: [
    'The meeting is nearly over. It has been a good one — the paper is out, the reviews are behind you, and for eleven minutes nobody has said the word "deadline."\n\nThen, warmly, and with what is unmistakably real curiosity: “So — what are you actually curious about for the next one?”\n\nThe next one. The paper came out {n} week(s) ago.',
    '“Now that that is done.” A pause of about half a second, which is the entire holiday. “What is the next project?”\n\nThey are not being cruel. They are asking the best question they know how to ask, in the only register they have, and it is the question that got them here too.',
  ],
  choices: [
    { id: 'ready', text: 'You have an answer, and it is a good one', hint: 'The boulder, picked up on purpose', effects: { novelty: 8, satisfaction: 8, confidence: 6, hope: 4, energy: -3 },
      result: 'You have been thinking about it for three weeks without admitting you were thinking about it. They light up. You are already halfway up the hill and you were the one who started walking.' },
    { id: 'blank', text: '“I have not thought about it. I finished it on Tuesday.”', hint: 'True; not the answer the question wants', effects: { stress: 6, satisfaction: -4, hope: -2 },
      result: '“Of course, of course.” They mean it, and they ask again in nine days, and they will keep asking, gently, because a lab without a next project is a lab with nothing in the pipeline and they can feel it from where they sit.' },
    { id: 'rest', text: '“Can I have a month before we start the next one?”', hint: 'The sentence almost nobody says', effects: { energy: 14, stress: -14, hope: 8, satisfaction: -3 },
      flags: { askedForTime: true },
      result: '“Take two weeks.” You asked for a month and got two weeks, which is more than you have had in three years, and you will spend the first four days of it unable to work out what to do with yourself.' },
    { id: 'their', text: 'Ask what they would want you to do next', hint: 'Faster; theirs, not yours', effects: { progress: 8, dependency: 8, satisfaction: 6, novelty: -4 },
      result: 'They have an answer ready. They have had it ready for a fortnight. It is a good project and you will do it well and in year five you will not be certain whose it was.' },
  ],
};

// How long the good feeling lasts, in months, before the question. Ambition and management both
// shorten it; a warm advisor lengthens it a little, and nobody makes it longer than about a season.
export function restMonths(a) {
  const raw = 2.6 - (a.ambition - 50) / 34 - (a.management - 50) / 60 + (a.caring - 50) / 70;
  return Math.max(0, Math.min(3, Math.round(raw)));
}

export const restNote = [
  'Nobody said take a break. Somebody said “enjoy this,” which is not a length of time.',
  'The word "next" was used before the acceptance email had been open for a week.',
  'The gap between the best day of the year and the question about the next one is measured in weeks, and it is shorter every time.',
];
