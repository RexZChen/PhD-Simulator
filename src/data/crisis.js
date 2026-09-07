// A health crisis is the one thing the game will not let you plan around. Everything else is a
// trade you make; this is a week that is taken from you. The point is not the punishment — it is
// what happens afterwards, when the calendar has not moved and nobody adjusts anything.

export const CRISIS_HEALTH = 24;        // below this, the body stops negotiating
export const CRISIS_COOLDOWN = 10;      // months

export const crises = {
  collapse: {
    id: 'collapse', title: 'The floor of the fourth-floor kitchen',
    text: ['You stand up too fast and the room goes grey at the edges, and then you are sitting on the floor with your back against the dishwasher and someone is asking if you can hear them. You can. You would rather not be asked.',
      'It is not dramatic. You simply stop being able to continue, in the middle of a Tuesday, and a labmate walks you to the health centre because you are arguing about whether you need to go.'],
    weeks: 2, cost: 240,
  },
  infection: {
    id: 'infection', title: 'The thing you left for three weeks',
    text: ['It was fine and then it was not fine, and the nurse uses the word “urgent” in a tone that suggests she has said it several times already and you were not listening.',
      'Three weeks of telling yourself it would settle. It did not settle. The clinic can see you today, which is the sentence you did not want to hear.'],
    weeks: 2, cost: 620,
  },
  breakdown: {
    id: 'breakdown', title: 'A Wednesday you do not remember agreeing to',
    text: ['You have been awake for most of two days and the thing you are looking at has stopped meaning anything. You read the same line eleven times. Then you are crying in a stairwell, which is at least a private stairwell.',
      'The counselling service has a six-week wait and a same-day line for people who are not okay right now. You use the second number, which is its own kind of admission.'],
    weeks: 3, cost: 180,
  },
};

// What you do about it. None of these are free, and the cheapest one is the most expensive.
export const crisisMoves = {
  treat: {
    id: 'treat', label: 'Do what they tell you',
    hint: 'Weeks off, a bill, and a body that keeps working afterwards',
    line: 'You take the antibiotics, or the leave, or the referral. You do the thing. It costs two weeks you did not have and it is the reason you are still here in year six.',
    effects: { health: 26, stress: -10, hope: 4 },
  },
  minimum: {
    id: 'minimum', label: 'Do the minimum and get back to it',
    hint: 'Half the recovery, half the time, and it comes back',
    line: 'You take the prescription and none of the rest. You are at your desk on Thursday. It half-works, which is the worst amount for a thing like this to work.',
    effects: { health: 12, stress: -2, energy: -6 },
    recurs: true,
  },
  ignore: {
    id: 'ignore', label: 'Tell them you will come back next week',
    hint: 'No time lost now. A worse version of this, later.',
    line: 'You do not go back. Nothing terrible happens for eleven weeks, and then something does, and it is the same thing with more of it.',
    effects: { health: 4, stress: 6, hope: -6 },
    recurs: true, worse: true,
  },
};

// Afterwards. The calendar did not move, and nobody adjusts anything. This is the honest part:
// not cruelty, just a system with no slot for it.
export const afterCrisis = {
  advisor: [
    '“Feeling better? Good.” A pause of exactly the right length. “Where are we on the draft?”',
    '“I heard. That sounds rough.” Then, in the same breath and the same tone: “So what is the plan for the deadline?”',
    '“Take the time you need.” The deadline has not moved. Neither of you mentions that the deadline has not moved.',
    '“You should have told me sooner.” It is kindly meant. It is also the third thing they say, after the two about the experiments.',
    'They do not mention it at all. The meeting is about the figures. You cannot tell whether this is tact or whether they do not know.',
  ],
  lab: [
    'Someone left soup in the fridge with your name on it. No note. You know who it was and you do not say so, because saying so would make it a thing.',
    '{labmateFirst} covered your section for a week and refuses to let you thank them properly, which is its own small violence.',
    'The lab is normal with you, immediately and completely, and you cannot decide whether that is the kindest or the loneliest thing.',
  ],
  self: [
    'You are back. Nothing about the timeline has changed and everything about your relationship to it has.',
    'The two weeks are gone and the deadline is where it was. You do the arithmetic once and then decide not to do it again.',
    'You have started answering “how are you” differently, and only to two people.',
  ],
};

export const CRISIS_NOTE = 'You cannot plan around this one. That is what makes it different from every other thing in this game.';
