// Scenes that hand control to a real-time minigame, and the pressure beats around meetings.

export const lectureLines = {
  intro: 'Two hours of a course you are taking because the form said so. Your deadline is in nine days. The lecturer writes on the board with their back to the room, and then, at intervals they choose, turns round.',
  great: 'You get most of a section written under the desk. You also, accidentally, learn something about convexity.',
  good: 'A decent haul. You have a paragraph and a vague sense of what chapter four was about.',
  poor: 'You get almost nothing done and absorb almost nothing. The worst of both, achieved in a single afternoon.',
  caught: 'Called on twice, and the third time they simply stop and wait until you close the laptop. The room waits with them. You will remember this at 3 a.m. in eleven years.',
};

// When the advisor does not accept your first answer.
export const pushbacks = [
  { id: 'timeline', text: '“And when.” Not a question. They want a date and they are going to wait for one.',
    options: [
      { id: 'date', label: 'Give a real date you can hit', effects: { trust: 6, satisfaction: 5, pressure: 4 }, line: 'You name a date two weeks later than they wanted and you hold their eye while you say it. They write it down. It is now real.' },
      { id: 'soon', label: '“Soon.”', effects: { satisfaction: -6, trust: -3 }, line: '“Soon.” They repeat it back to you and let it sit in the room until it sounds as bad as it is.' },
      { id: 'their', label: 'Take the date they want', effects: { satisfaction: 8, stress: 10, pressure: 8 }, line: 'You agree to their date. You both know. One of you will be awake for it.' },
    ] },
  { id: 'evidence', text: '“Show me the number.” They have turned the laptop round.',
    options: [
      { id: 'show', label: 'Show them, including the bad column', effects: { trust: 8, evidence: 4, confidence: 3 }, line: 'You show the whole table. They look at the bad column for a long moment and say “good, you knew.”' },
      { id: 'partial', label: 'Show the good half', effects: { satisfaction: 4, trust: -5 }, line: 'They ask what the other setting did. You say you would have to check. They know you know.' },
      { id: 'later', label: 'Say you will send it after', effects: { satisfaction: -4, stress: 5 }, line: '“Send it tonight.” It is 6 p.m. That was not a suggestion.' },
    ] },
  { id: 'why', text: '“Why is this the right problem?” They ask it flatly, the way you would ask about the weather.',
    options: [
      { id: 'defend', label: 'Make the case', effects: { confidence: 6, novelty: 4, trust: 4 }, line: 'You make the case in four sentences. They poke it twice; it holds. “Alright. Go.”' },
      { id: 'honest', label: '“I am not sure any more.”', effects: { hope: -4, trust: 6, scope: -6 }, line: 'It is the hardest sentence in the language and it buys you the only useful conversation of the month.' },
      { id: 'freeze', label: 'Say nothing useful', effects: { confidence: -6, satisfaction: -5, stress: 7 }, line: 'You talk for ninety seconds without saying anything. You hear yourself doing it and cannot stop.' },
    ] },
  { id: 'more', text: '“That is not enough for a paper and you know it.”',
    options: [
      { id: 'scope', label: 'Propose exactly what you will add', effects: { scope: 6, evidence: 5, satisfaction: 6, energy: -4 }, line: 'One experiment, named, with a date. They accept it because it is specific.' },
      { id: 'push', label: 'Say it is enough, and say why', effects: { confidence: 4 }, check: true, line: 'You hold the line. Sometimes this works.' },
      { id: 'fold', label: 'Agree to whatever they want', effects: { scope: 12, energy: -8, satisfaction: 5, stress: 8 }, line: 'You agree to everything. The list is four items long by the time you leave the room.' },
    ] },
];

export const hesitationLines = [
  'The pause goes on a beat too long. “…Take your time,” they say, meaning the opposite.',
  'You say nothing. They fill the silence with a decision, and it is theirs, not yours.',
  'You are still choosing when they move on. The moment closes.',
];
