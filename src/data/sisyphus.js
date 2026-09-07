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
