// Day-pace texture: the five-minute encounters that make a deadline week feel like a week.

// Knocking on the advisor's door without an appointment. Outcome depends on their mode.
export const popIns = {
  good: [
    { id: 'unstuck', line: '“Show me.” They read for ninety seconds, point at one line, and say the thing you needed to hear three days ago.', effects: { progress: 4, evidence: 3, confidence: 3, trust: 2 }, quality: 3 },
    { id: 'framing', line: 'You explain the result out loud. Halfway through you hear the problem yourself. They let you finish anyway.', effects: { writingQuality: 4, novelty: 2, readiness: 2 }, quality: 3 },
    { id: 'cut', line: '“Cut the third experiment. Nobody will miss it.” They are right. You have been defending it for a week out of sunk cost.', effects: { scope: -8, draft: 5, stress: -5 }, quality: 2 },
    { id: 'story', line: 'They redraw your figure on the whiteboard with two fewer lines. It is now a figure someone would look at twice.', effects: { writingQuality: 5, hype: 2 }, quality: 4 },
  ],
  bad: [
    { id: 'scope', line: '“While you’re here — could we also try it on the other dataset?” The door was open. That was the mistake.', effects: { scope: 8, energy: -3, stress: 5 }, quality: -2 },
    { id: 'rushed', line: 'They are on a call, mute the mic, say “can this wait,” and unmute. It could not, and now it will.', effects: { stress: 4, hope: -2 }, quality: 0 },
    { id: 'doubt', line: '“Is this actually the paper?” Four days before the deadline, this is not a question. It is weather.', effects: { confidence: -5, stress: 7, novelty: 2 }, quality: -1 },
    { id: 'tangent', line: 'Forty minutes about a grant panel they sat on in 2019. You learn something. It is not about your paper.', effects: { energy: -4, academicCapital: 2 }, quality: 0 },
  ],
  absent: [
    { id: 'dark', line: 'The office is dark. The nameplate is confident about who works here.' },
    { id: 'headphones', line: 'Door closed, headphones visible through the glass, a hand raised in the universal gesture for “not now.”' },
    { id: 'calendar', line: 'A printed sign: “Back Thursday.” It is Thursday. It has been Thursday for some time.' },
  ],
};

// Bumping into a labmate at the printer, the kettle, the 11 p.m. elevator.
export const runIns = [
  { id: 'debug', line: '{labmateFirst} looks at your stack trace for eleven seconds and says “that’s a version thing.” It is a version thing.', effects: { progress: 3, evidence: 2, energy: 2 }, bond: 5, quality: 1 },
  { id: 'vent', line: 'You both stand by the kettle complaining about the same reviewer, who reviewed neither of your papers.', effects: { stress: -6, hope: 3 }, bond: 6, loneliness: -6 },
  { id: 'compare', line: '{labmateFirst} mentions, lightly, that they submitted two papers this cycle. The lightness is the weapon.', effects: { stress: 5, confidence: -4, pressure: 4 }, bond: 1 },
  { id: 'snack', line: '{labmateFirst} has brought food from home and made too much on purpose. You eat standing up and feel human.', effects: { health: 4, hope: 4, energy: 3 }, bond: 7, loneliness: -8 },
  { id: 'gossip', line: 'A rumour about another lab, delivered at the printer in a whisper that carries. You will not repeat it. You will remember it.', effects: { stress: -2, academicCapital: 1 }, bond: 4 },
  { id: 'ride', line: '{labmateFirst} is driving home at 1 a.m. and offers you a lift. Neither of you says anything for the first five minutes.', effects: { energy: 4, stress: -4 }, bond: 8, loneliness: -7 },
  { id: 'ask', line: '{labmateFirst} asks you for help with their pipeline. You have four days. You help anyway, for twenty minutes.', effects: { energy: -4, progress: -1 }, bond: 12, loneliness: -4 },
  { id: 'quiet', line: 'You pass in the corridor. They say “still here?” You say “still here.” This is the whole conversation and it is enough.', effects: { stress: -1 }, bond: 2, loneliness: -2 },
];

// Small ambient beats printed at the top of a day. No mechanics, just weather.
export const dayWeather = [
  'The building is empty except for the one lab that is always here. You are that lab.',
  'Someone has left a whole birthday cake in the kitchen with a note: “PLEASE.”',
  'The cluster queue says four hours. The cluster queue is lying, in a direction you cannot predict.',
  'The heating has failed in a way that is somehow both too hot and too cold.',
  'A tour group passes the window. A parent points at you. You wave.',
  'The good printer is jammed. The bad printer is available, as ever.',
  'The undergrads are gone for the day and the floor is finally quiet.',
  'It has been raining since Monday, which at least removes the question of going outside.',
  'The vending machine has been restocked with the same four things.',
  'Someone’s alarm has been going off in an empty office for twenty minutes.',
];
