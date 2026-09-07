// The things on the desk.
//
// None of these is a feature. They are not on a menu, they have no meters, they never appear in the
// monthly report, and nothing in the game will ever suggest you touch them. They are objects at the
// edge of the screen that you can click, the way people touch things on their desk while the rest
// of them is thinking about something else.
//
// The rule they all share, and the reason none of them unbalances anything: a fixture only does
// something when you are already having a bad time. Above the line it is a few points of relief;
// below it, it is a sentence and no numbers at all. A ritual is not a resource, and nobody waters a
// plastic plant on a good day.
//
// The plant's prose is unchanged from when it shipped alone — the Chinese dictionary is keyed by the
// English source string, so editing these would silently drop the translations.

export const PLANT = { cooldownWeeks: 1, ritual: 12, devoted: 30 };
export const CHAIR = { cooldownWeeks: 1, ritual: 15 };
export const FRIDGE = { cooldownWeeks: 1, throwAt: 6 };

export const plantLines = {
  discover: 'You water the plant. The water goes straight through, pools on the desk, and runs off the near edge onto your bag, because the plant is plastic. It has always been plastic. You have been in this room for months.',
  after: [
    'You water the plastic plant. It does not need it. You do.',
    'A capful, at the base, where the soil would be if there were soil. There is a small grey disc of foam there instead and it is very slightly damp, permanently, and has been for years.',
    'You give it a little water. The leaves have a layer of dust on them that you have started to think of as seasonal.',
    'You water it. Somebody down the row watches you do it and says nothing, because they water theirs too.',
    'Water, at the base. You notice the price sticker on the bottom of the pot, still there. $3.99.',
    'You water it before you open the terminal. This is the order of operations now and you did not decide it.',
    'The plastic plant receives its water. Outside there is real weather happening to real plants.',
  ],
  idle: [
    'The plant has not changed in four years. Neither of you has.',
    'The plant is exactly where it was. It has outlasted two labmates and one advisor’s sabbatical.',
    'Someone has stuck a googly eye on one of the leaves. You do not know who and you are not removing it.',
  ],
  noticed: 'Somebody new asks whether the plant is real. Three people answer at once, and all three of them know the answer, and one of them says “but Sam waters it” and nobody laughs, because it is not a joke to any of them.',
  devoted: 'The plant will still be there after you defend. You will not take it. Somebody will water it.',
  dry: 'The plant is fine. The plant is always fine. That is not what it is for.',
};
export const plantNote = 'A plant. It is not real. Nobody has ever mentioned it.';

// ── The chair ─────────────────────────────────────────────────────────────────────────────────
// Somebody lowers it. You raise it. This continues for six years and is never once discussed.
export const chairLines = {
  discover: 'The chair is at its lowest setting again. You are sitting with your chin near the desk like a child at an adult table. You pull the lever and it comes up, and it takes about four seconds, and you have now done this an unknown number of times.',
  after: [
    'Lowered again. You raise it. There is nobody here at this hour and there was nobody here at that hour either.',
    'All the way down. You raise it back to where it was and you do not think about it, which is itself the interesting part.',
    'The lever, the hiss, the eleven centimetres. Whoever does this has never once mentioned it and neither have you.',
    'Down again. You have started to notice it before you sit, which means it has been going on long enough to have changed how you approach a chair.',
    'You raise it, and this time you look around the room properly first, and there is nothing to see, because there never is.',
    'It is down. You wonder briefly whether it is the cleaner, and then you feel bad for wondering, and then you raise the chair.',
    'Raised. Somebody at some point tightened the armrests to a height that is not for you either.',
  ],
  idle: [
    'The chair is where you left it. This never lasts.',
    'The chair is at your height. Enjoy it; it is Tuesday.',
  ],
  // Fifteen times. Still nobody has said anything, which is the joke and also just what happens.
  noticed: 'Fifteen times. You have raised this chair fifteen times and nobody has ever said a word about it, and you have never said a word about it, and there is a person in this building who has lowered it fifteen times and has also never said anything. The two of you have had an entire relationship and neither of you knows the other exists.',
};
export const chairNote = 'A chair. It is lower than you left it.';

// ── The fridge ────────────────────────────────────────────────────────────────────────────────
// There is a yogurt in it. It has a name on it in marker. The date has been in the past for a long
// time, and it goes further into the past every time you look, which is arithmetic and feels like
// something worse.
export const fridgeLines = {
  discover: 'The lab fridge. Somebody’s lunch, four cans of an energy drink that was discontinued, and a yogurt with a name written on the lid in marker. The date on it is in the past. The name is not anybody who currently works here.',
  after: [
    'The yogurt is still there. The date on it is now further in the past than it was last time, which is how dates work and which nevertheless feels like something is happening.',
    'You open it, look at nothing, and close it. This is the fourth time today and it is not about food.',
    'Somebody has put a passive-aggressive sign inside the fridge, facing outward, which means it can only be read by people who are already opening it.',
    'The yogurt has been joined by a second yogurt with a different name on it. Neither name is on the current group roster.',
    'There is a tupperware in here that has moved from “someone’s lunch” to “an experiment” without anybody performing the transition.',
    'You open the fridge for a reason you do not have and stand in the cold for nine seconds, which is the actual function of a lab fridge.',
  ],
  // The click that does something. Nobody thanks you and somebody will be upset.
  thrown: 'You throw the yogurt out. It goes in the bin, the bin goes out on Thursday, and it is the single most useful thing anybody has done in this room this month.',
  slack: 'who threw out my yogurt. it had my NAME on it',
  slackAfter: 'not accusing anyone. just. it had my name on it',
  after_thrown: [
    'The fridge is noticeably better. Nobody has mentioned it, and one person in this lab is quietly furious, and you know which one, and neither of you will ever raise it.',
    'A new yogurt has appeared, with a name on it, and a date, and it will be here when you defend.',
    'The passive-aggressive sign has been replaced with a more passive-aggressive sign.',
  ],
  idle: ['The fridge hums. It is the only thing in this building that is definitely working.'],
};
export const fridgeNote = 'A fridge. There is a yogurt in it with somebody’s name on it.';

// The registry. `slot` is where the state lives on the run — one key each, so the plant's shipped
// saves keep working untouched.
export const fixtures = {
  plant: { id: 'plant', slot: 'plant', label: 'A plant', note: plantNote, cooldown: PLANT.cooldownWeeks },
  chair: { id: 'chair', slot: 'chair', label: 'A chair', note: chairNote, cooldown: CHAIR.cooldownWeeks },
  fridge: { id: 'fridge', slot: 'fridge', label: 'A fridge', note: fridgeNote, cooldown: FRIDGE.cooldownWeeks },
  // Not a page in the operating system — a board on the wall by the desk, which is what it is.
  board: { id: 'board', slot: 'board', label: 'A whiteboard', note: 'A whiteboard. It costs nothing and it is not for anything.', opens: 'board' },
};
export const fixtureOrder = ['plant', 'chair', 'fridge', 'board'];
