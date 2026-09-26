// A health crisis is the one thing the game will not let you plan around. Everything else is a
// trade you make; this is a week that is taken from you. The point is not the punishment — it is
// what happens afterwards, when the calendar has not moved and nobody adjusts anything.

export const CRISIS_HEALTH = 24;        // below this, the body stops negotiating
export const CRISIS_COOLDOWN = 10;      // months

export const crises = {
  collapse: {
    id: 'collapse', title: 'The floor of the fourth-floor kitchen',
    text: ['The room goes grey at the edges. You sit down on the kitchen floor while someone checks whether you can hear them. A meeting reminder lights up your phone. It has no idea where you are.',
      'You cannot keep working. Someone stays with you while you arrange help. Your open laptop still shows the task you expected to finish next.'],
    weeks: 2, cost: 240,
  },
  infection: {
    id: 'infection', title: 'A health problem that cannot wait',
    text: ['You explain what has changed. The clinic offers an urgent appointment. The booking form still asks whether you can fit it around your normal schedule.',
      'The symptoms are getting harder to work around. The clinic can see you today. Your calendar has no empty space, so something on it will have to move.'],
    weeks: 2, cost: 620,
  },
  breakdown: {
    id: 'breakdown', title: 'A Wednesday you do not remember agreeing to',
    text: ['You read the same line without taking it in. In the stairwell, away from the screen, you begin to cry. For a while the next task is simply too much.',
      'The counselling service lists routine appointments and an urgent contact. You reach for the urgent number. The form asks for your availability; what you need is help making room.'],
    weeks: 3, cost: 180,
  },
};

// Responses trade modeled recovery, leave, and costs; the prose does not promise a medical outcome.
export const crisisMoves = {
  treat: {
    id: 'treat', label: 'Make room for care and follow-up',
    hint: 'More recovery; weeks of leave and a bill',
    line: 'You arrange care and time away from work. It does not settle everything today. You send the necessary messages, including one to explain why a form about your absence will itself be late.',
    effects: { health: 26, stress: -10, hope: 4 },
  },
  minimum: {
    id: 'minimum', label: 'Fit care into the smallest gap you can make',
    hint: 'Less recovery and less leave; recurrence remains a risk',
    line: 'You make a limited arrangement and keep much of the work on your calendar. Some pressure eases. The follow-up and the unfinished work are still competing for the same space.',
    effects: { health: 12, stress: -2, energy: -6 },
    recurs: true,
  },
  ignore: {
    id: 'ignore', label: 'Postpone follow-up for now',
    hint: 'No leave or bill now; higher stress and greater recurrence risk',
    line: 'You postpone the next step. The work calendar stays intact; that is the immediate relief. The health problem is unresolved, and fitting it in later may be harder.',
    effects: { health: 4, stress: 6, hope: -6 },
    recurs: true, worse: true,
  },
};

// Immediate responses, including after postponement. Do not assume leave has already elapsed.
export const afterCrisis = {
  advisor: {
    practical: {
      leave: 'I have moved our pending requests back by your leave period. Conference deadlines still need a separate decision.',
      noRequests: 'There are no pending requests from me to move. Take your leave; we can review the next steps afterward.',
      postponed: 'If you decide to take time away, tell me which commitments need revisiting.',
    },
    acknowledge: 'Thanks for telling me. You do not need to attach a work update to this message.',
    work: 'I have seen your message. When you can, tell me what this means for the current work plan.',
    unavailable: 'Your message to Prof. {name} is sent. There is no reply yet.',
  },
  lab: [
    'Could I bring you something to eat? No work update needed.',
    'Is there a small task I could take off your list?',
    'You do not need to keep up with the lab chat today. I can pass along anything that needs an answer.',
  ],
  self: [
    'You look at the work calendar again. The health interruption is real even where the schedule has no box for it.',
    'You start sorting what can wait from what needs an answer. The list is smaller than before. It is still a list.',
    '“How are you?” does not have to mean “Are you working again?” You notice who leaves room for a different answer.',
  ],
};

export const CRISIS_NOTE = 'These choices change recovery, leave, and costs in this run. Work deadlines do not move automatically.';
