// The plant.
//
// There is a plant on your desk. Nobody put it there for you — a PhD student is not important
// enough to be served by a real plant, and would not have time for one. It was left by whoever had
// the desk before, along with a mug and a stack of printed papers from 2027 with someone else's
// handwriting on them.
//
// Watering it is not a feature. It is not on a menu, it has no meter, it does not appear in the
// report, and nothing in the game will ever suggest you do it. It is a thing on the desk that you
// can click, the way people click things on their desk.
//
// The joke is that it is plastic, and the joke after that is that you keep watering it.

export const PLANT = {
  cooldownWeeks: 1,        // once a week is a ritual; more often is a coping mechanism
  ritual: 12,              // waterings before the room notices
  devoted: 30,
};

export const plantLines = {
  // The first time. This is the whole gag and it only lands once.
  discover: 'You water the plant. The water goes straight through, pools on the desk, and runs off the near edge onto your bag, because the plant is plastic. It has always been plastic. You have been in this room for months.',
  // Every time after. This is the actual point.
  after: [
    'You water the plastic plant. It does not need it. You do.',
    'A capful, at the base, where the soil would be if there were soil. There is a small grey disc of foam there instead and it is very slightly damp, permanently, and has been for years.',
    'You give it a little water. The leaves have a layer of dust on them that you have started to think of as seasonal.',
    'You water it. Somebody down the row watches you do it and says nothing, because they water theirs too.',
    'Water, at the base. You notice the price sticker on the bottom of the pot, still there. $3.99.',
    'You water it before you open the terminal. This is the order of operations now and you did not decide it.',
    'The plastic plant receives its water. Outside there is real weather happening to real plants.',
  ],
  // What it is doing while you are not looking at it, which is nothing.
  idle: [
    'The plant has not changed in four years. Neither of you has.',
    'The plant is exactly where it was. It has outlasted two labmates and one advisor’s sabbatical.',
    'Someone has stuck a googly eye on one of the leaves. You do not know who and you are not removing it.',
  ],
  // Twelve times. Nobody says anything, which is how you know it counts.
  noticed: 'Somebody new asks whether the plant is real. Three people answer at once, and all three of them know the answer, and one of them says “but Sam waters it” and nobody laughs, because it is not a joke to any of them.',
  devoted: 'The plant will still be there after you defend. You will not take it. Somebody will water it.',
  dry: 'The plant is fine. The plant is always fine. That is not what it is for.',
};

export const plantNote = 'A plant. It is not real. Nobody has ever mentioned it.';
