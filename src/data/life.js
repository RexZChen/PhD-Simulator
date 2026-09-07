// The life side of the simulation: what a body costs, what insurance does not cover,
// and the small daily decisions that add up to a person.

// Chronic-ish conditions. Each one drags until it is treated; some get worse if ignored.
export const conditions = {
  rsi: { name: 'Wrist pain', blurb: 'Fourteen hours of typing a day for six years. Who could have predicted.', clinic: 'primary', drag: { energy: -1.2, writingQuality: -.6 }, worsens: 'rsi_bad', months: 6 },
  rsi_bad: { name: 'Tendonitis', blurb: 'The brace is beige. Everything medical is beige.', clinic: 'specialist', drag: { energy: -2.4, writingQuality: -1.4, progress: -1 }, months: 99 },
  insomnia: { name: 'Insomnia', blurb: 'You lie down at midnight and review your own reviewers until three.', clinic: 'primary', drag: { energy: -1.6, health: -.4 }, worsens: null, months: 5 },
  gastritis: { name: 'Stomach trouble', blurb: 'Coffee on an empty stomach is a research method, apparently.', clinic: 'primary', drag: { energy: -1.3, health: -.5 }, worsens: 'ulcer', months: 5 },
  ulcer: { name: 'Ulcer', blurb: 'The doctor asks about stress. You laugh. The doctor does not.', clinic: 'urgent', drag: { energy: -2.4, health: -1 }, months: 99 },
  back: { name: 'Back pain', blurb: 'The chair was free. The chair was free for a reason.', clinic: 'primary', drag: { energy: -1.4 }, months: 6 },
  flu: { name: 'The department flu', blurb: 'It went around group meeting. It is going around you.', clinic: 'primary', drag: { energy: -2.4, health: -.8, progress: -2 }, months: 2 },
  anxiety: { name: 'Anxiety', blurb: 'Your heart rate has opinions about email notifications.', clinic: 'therapy', drag: { energy: -1.2, hope: -.8, health: -.3 }, worsens: null, months: 8 },
  toothache: { name: 'A tooth', blurb: 'Student dental covers “basic.” This tooth is a graduate-level tooth.', clinic: 'dental', drag: { energy: -.9, health: -.4 }, worsens: 'abscess', months: 4 },
  abscess: { name: 'Dental abscess', blurb: 'The receptionist says “oh” in a way that costs money.', clinic: 'urgent', drag: { energy: -2.6, health: -1.4 }, months: 99 },
  burnedout: { name: 'Exhaustion', blurb: 'Not tired. Emptied.', clinic: 'therapy', drag: { energy: -2, hope: -1.5 }, months: 6 },
};

// Where you can go when the body files a complaint. `list` is the sticker price;
// insurance takes its cut in engine/life.js, and then bills you again in two months.
export const clinics = [
  { id: 'campus', name: 'Campus health center', list: 60, wait: 'a three-week wait for a fifteen-minute appointment',
    blurb: 'Free-ish, staffed by people who are kind and overbooked. They will suggest hydration.',
    treats: ['flu', 'back', 'insomnia'], energy: -2, effects: { stress: -2, health: 4 } },
  { id: 'primary', name: 'Primary care', list: 240, wait: 'next Thursday, 8:40 a.m., across town',
    blurb: 'A real doctor with a real chart. They ask how many hours you sleep and you round up.',
    treats: ['rsi', 'insomnia', 'gastritis', 'back', 'flu'], energy: -4, effects: { stress: -4, health: 6 } },
  { id: 'specialist', name: 'Specialist referral', list: 620, wait: 'six weeks, and a form your advisor must not see',
    blurb: 'The one with the machine. The machine is the expensive part.',
    treats: ['rsi', 'rsi_bad', 'back'], energy: -6, effects: { stress: -3, health: 8 } },
  { id: 'dental', name: 'Dental clinic', list: 480, wait: 'they can see you at 7 a.m. or never',
    blurb: '“Basic” dental means they will look at it and tell you it is not basic.',
    treats: ['toothache', 'abscess'], energy: -4, effects: { stress: -3, health: 5 } },
  { id: 'therapy', name: 'Counseling center', list: 150, wait: 'an eleven-week waitlist you forgot you were on',
    blurb: 'Fifty minutes in which nobody asks about your draft. You cry in week three and it helps.',
    treats: ['anxiety', 'burnedout', 'insomnia'], energy: -2, effects: { stress: -14, hope: 6, health: 4 }, flags: { therapy: true } },
  { id: 'urgent', name: 'Urgent care', list: 950, wait: 'now, which is the whole point',
    blurb: 'Open late, for people whose problems are also open late.',
    treats: ['ulcer', 'abscess', 'gastritis', 'flu'], energy: -6, effects: { stress: -6, health: 14 }, surprise: .55 },
  { id: 'er', name: 'Emergency room', list: 3400, wait: 'four hours in a plastic chair',
    blurb: 'You will be fine. The bill will not be.',
    treats: ['ulcer', 'abscess', 'flu', 'gastritis'], energy: -8, effects: { stress: -4, health: 26 }, surprise: .85 },
];
export const clinicById = Object.fromEntries(clinics.map(c => [c.id, c]));

// How you live between paychecks.
export const budgets = {
  lean: { name: 'Lean', food: 320, blurb: 'Rice, lentils, and the lab’s leftover pizza. It works until it doesn’t.', health: -1.6, hope: -.8, social: -1 },
  normal: { name: 'Normal', food: 680, blurb: 'Groceries, occasionally a restaurant, one coffee you did not make yourself.', health: 0, hope: 0, social: 0 },
  comfortable: { name: 'Comfortable', food: 1040, blurb: 'You buy the good olive oil. You are aware this is a personality.', health: 1.2, hope: 1, social: 1.2 },
};

// Small things you can do with a day. Cooldowns are in weeks.
export const lifeActions = [
  { id: 'cook', name: 'Cook a real meal', icon: 'home', cooldown: 1, cost: { energy: 3, money: 14 }, effects: { health: 4, hope: 2, stress: -2 },
    line: 'You cook something with more than one colour in it. It takes forty minutes you did not have and gives back an evening you did not expect.' },
  { id: 'sleep', name: 'Sleep eight hours, on purpose', icon: 'moon', cooldown: 1, cost: {}, effects: { energy: 10, health: 5, stress: -6 },
    line: 'You put the laptop in another room. The room is two metres away and it is enough.' },
  { id: 'walk', name: 'Walk somewhere with no purpose', icon: 'sun', cooldown: 2, cost: { energy: 2 }, effects: { hope: 5, stress: -6, health: 2, loneliness: -3 },
    line: 'You walk to the river, or the parking structure, or whatever this city has. It is better than the building.' },
  { id: 'gym', name: 'Go to the campus gym', icon: 'people', cooldown: 1, cost: { energy: 5 }, effects: { health: 7, stress: -5, energy: 2 },
    line: 'Twenty minutes on a machine that goes nowhere. Your body, ancient and stupid, is delighted.', flags: { resolutionHealth: true } },
  { id: 'call', name: 'Call someone who is not in academia', icon: 'chat', cooldown: 2, cost: { energy: 2 }, effects: { hope: 6, loneliness: -12, stress: -4 },
    line: 'They ask what you did today. You try to explain. They say “that sounds hard,” which is the correct answer.' },
  { id: 'cohortdinner', name: 'Cook dinner with the cohort', icon: 'people', cooldown: 3, cost: { energy: 5, money: 25 }, effects: { hope: 7, loneliness: -16, stress: -7 }, peerBond: 8,
    line: 'Four graduate students, one wok, an argument about whether the qualifier is a hazing ritual. (It is.)', personality: 'networker' },
  { id: 'hobby', name: 'Do the hobby you had before', icon: 'star', cooldown: 3, cost: { energy: 4 }, effects: { hope: 9, stress: -8, loneliness: -5 },
    line: 'The guitar / the bouldering wall / the half-finished novel. You are bad at it now. You were bad at it then, too, and happier.' },
  { id: 'errands', name: 'Do the pile of admin', icon: 'doc', cooldown: 2, cost: { energy: 6 }, effects: { stress: -9, hope: 2 },
    line: 'Reimbursement forms, the dentist’s voicemail, the parcel from March. The pile is not smaller. The pile is now known.' },
  { id: 'tutor', name: 'Tutor undergrads this weekend', icon: 'book', cooldown: 2, cost: { energy: 9 }, effects: { money: 380, stress: 3 }, offCampus: true,
    line: 'Two hours of explaining recursion to someone who will out-earn you in fourteen months.', personality: 'grinder' },
  { id: 'gig', name: 'Take a weekend contract', icon: 'case', cooldown: 4, cost: { energy: 14 }, effects: { money: 950, stress: 6, progress: -3 }, offCampus: true, conditions: { minMonth: 12 },
    line: 'A startup pays you real money to do in a weekend what your thesis does in six years, badly, for free.' },
  { id: 'sellgear', name: 'Sell something you do not use', icon: 'trash', cooldown: 6, cost: { energy: 3 }, effects: { money: 260, hope: -2 },
    line: 'The bike trainer, the second monitor, the espresso machine from the optimistic year. Someone drives over at 9 p.m. with cash.' },
  { id: 'foodbank', name: 'Visit the campus food pantry', icon: 'folder', cooldown: 3, cost: { energy: 2 }, effects: { money: 180, hope: -4, stress: -3 }, conditions: { maxMoney: 400 },
    line: 'It is behind the chapel and open Tuesdays. Two people from your cohort are already in line. Nobody makes eye contact; everybody nods.' },
];

// ── Getting it back ───────────────────────────────────────────────────────────────────────────
// Energy is the thing the whole game spends, and running out used to be a wall: every action that
// might have restored it cost some to take. So there is always a way back now, and every one of
// them is paid for out of something else — your body, your money, your standing, or the month.
// `recharge` groups them in Life.exe; the honest ones cost nothing you have and everything you are
// going to want later.
export const recharges = [
  { id: 'carnap', name: 'Twenty minutes in the car', icon: 'moon', cooldown: 1, recharge: true, cost: {}, effects: { energy: 7, health: -1 },
    line: 'You set an alarm for twenty minutes and sleep in the driver’s seat in a car park you pay for monthly. You wake up before it goes off, every time, and you never once feel rested and you always feel better.' },
  { id: 'crash', name: 'Sleep in the lab', icon: 'moon', cooldown: 2, recharge: true, cost: {}, effects: { energy: 15, health: -5, stress: 3 },
    line: 'There is a couch on the fourth floor and everybody knows what it is for and nobody says so. You wake at 05:40 with a keyboard pattern on your face and forty uninterrupted minutes before anyone arrives, and those forty minutes are the most productive of the week.' },
  { id: 'delivery', name: 'Order it instead of cooking', icon: 'home', cooldown: 1, recharge: true, cost: { money: 34 }, effects: { energy: 8, health: -3, hope: 2, stress: -2 },
    line: 'Thirty-four dollars to not stand up. You do the arithmetic on what that is per hour of your stipend, decide not to finish the arithmetic, and eat it at the desk.' },
  { id: 'skipseminar', name: 'Skip the thing you said you would go to', icon: 'clock', cooldown: 2, recharge: true, cost: {}, effects: { energy: 10, stress: -5, satisfaction: -5 },
    line: 'You do not go to the seminar. You get the afternoon back and it is a good afternoon. Your advisor mentions, four days later and entirely pleasantly, that the speaker asked after their students.' },
  { id: 'homeweekend', name: 'Go home for the weekend', icon: 'plane', cooldown: 6, recharge: true, cost: { money: 190 }, effects: { energy: 18, hope: 11, loneliness: -18, progress: -4, stress: -8 },
    conditions: { minMonth: 6 },
    line: 'Four hours each way. Your mother has made too much food and asks when you finish, and you say the thing you always say, and for two days nobody uses the word “contribution” at you.' },
  // The one everybody in the building knows about and nobody writes down.
  { id: 'borrowed', name: 'Take the one your labmate gave you', icon: 'bolt', cooldown: 5, recharge: true, cost: {}, effects: { energy: 26, stress: -6, health: -7 },
    conditions: { minMonth: 8 }, flags: { borrowedFocus: true },
    line: 'It is prescribed to somebody else and it is in an unlabelled section of a pill organiser and the person who gave it to you was being kind. You get eleven hours that feel like a superpower and you do not sleep that night, and the day after the day after is the price, and you will pay it then rather than now, which is the entire appeal.' },
];

export const lifeActionById = Object.fromEntries([...lifeActions, ...recharges].map(a => [a.id, a]));

// Coffee. The engine's only renewable resource, and a liar.
export const COFFEE = {
  boost: { energy: 9, stress: 2 },
  costMoney: 4,
  jitterAt: 3,     // third cup in a day starts the shakes
  crashAt: 5,      // fifth is a medical event with a receipt
  lines: [
    'The first cup of the day. The world sharpens by one notch.',
    'Second cup. You are now operating at what other people call “normal.”',
    'Third cup. Your hands have a small opinion about this. Ignore it.',
    'Fourth. The screen has a faint shimmer around the edges. Productive shimmer.',
    'Fifth cup. Your heart is doing something syncopated. This is a decision you made.',
  ],
};

// What the day is made of, in day-pace mode.
export const dayBlocks = [
  { id: 'deep', name: 'Deep work', icon: 'research', blurb: 'Door closed, notifications off, the good hours.', energy: -9, effects: { progress: 5, evidence: 3 }, quality: 1.2 },
  { id: 'writing', name: 'Writing', icon: 'paper', blurb: 'Words into the document, in an order.', energy: -8, effects: { draft: 9, writingQuality: 1.2 }, quality: 1 },
  { id: 'debug', name: 'Debugging the pipeline', icon: 'computer', blurb: 'It worked on Tuesday. It is Wednesday.', energy: -8, effects: { evidence: 4, reproducibility: 2 }, quality: .8 },
  { id: 'figures', name: 'Figures and tables', icon: 'browser', blurb: 'Make the truth legible.', energy: -6, effects: { writingQuality: 2.5, draft: 4 }, quality: 1.1 },
  { id: 'reading', name: 'Reading related work', icon: 'book', blurb: 'Someone did half of this in 2019. Find out which half.', energy: -5, effects: { novelty: 2, readiness: 2, coursework: 2 }, quality: .9 },
  { id: 'admin', name: 'Email, forms, TA grading', icon: 'mail', blurb: 'The work that is not the work.', energy: -5, effects: { stress: -3, coursework: 2 }, quality: 0 },
  { id: 'rest', name: 'Actually rest', icon: 'moon', blurb: 'A day off inside a deadline. Radical.', energy: 14, effects: { stress: -9, health: 3, hope: 3 }, quality: 0 },
];
export const dayBlockById = Object.fromEntries(dayBlocks.map(b => [b.id, b]));
