const c = (id, text, hint, effects = {}, extra = {}) => ({ id, text, hint, effects, ...extra });
export default [
  { id: 'burnout', title: 'The cursor keeps blinking', category: 'life', scene: 'home', probability: 1, cooldown: 6, urgent: true, conditions: { minStress: 78 },
    text: ['You have read the same paragraph six times. It has not become a different paragraph. This may need more than coffee.', 'You cry in the stairwell, efficiently, between two meetings. You are getting good at it. That is the problem.'],
    choices: [c('leave', 'Take a recovery month', 'Rest and a temporary reduction in pace', { energy: 20, stress: -22, hope: 6 }, { flags: { recovery: true }, personality: 'boundarySetter' }),
      c('continue', 'Ask for support and keep going', 'Advisor care affects the response', { stress: -5, energy: 8 }, { advisorResponse: true }),
      c('exit', 'Leave the program', 'End this run on your own terms', {}, { ending: 'burnout' })] },
  { id: 'conflict', title: 'This arrangement is no longer working', category: 'advisor', scene: 'office', speaker: 'advisor', probability: 1, cooldown: 5, urgent: true, conditions: { minConflict: 70 },
    text: 'Another meeting ends with neither of you agreeing on what was agreed. The graduate director has a form for this. It is called “Change of Advisor,” and it has a “reason” field with 200 characters.',
    choices: [c('mediate', 'Ask the graduate director to mediate', 'Communication check → lower conflict', { energy: -8 }, { check: { skill: 'communication', difficulty: 55 }, successEffects: { conflict: -30, trust: 8 }, failureEffects: { conflict: 5, hope: -5 }, successText: 'A three-way meeting. Awkward, useful, and the first agenda in months.', failureText: '“We take these matters seriously.” A calendar invite for six weeks from now.' }),
      c('exit', 'End the advising relationship', 'End this slice with an advisor breakdown', {}, { ending: 'advisor' })] },
  { id: 'missed_deadline', title: 'The deadline passed', category: 'advisor', scene: 'office', speaker: 'advisor', probability: 1, scheduledOnly: true, cooldown: 0,
    text: ['The {venue} deadline came and went. {advisor} does not mention it in the meeting. That is how you know it is being mentioned.', '“We missed {venue}.” {advisor} says “we” the way an airline says “we” about a delay.'],
    choices: [c('own', 'Own it and propose the next venue', 'Confidence check', { energy: -2 }, { check: { stat: 'confidence', difficulty: 50 }, successEffects: { trust: 3, pressure: -6 }, failureEffects: { satisfaction: -8, pressure: 6 }, successText: '“Fine. But the next one is real.” They are all real.', failureText: '“I need to see more urgency.” You have nothing but urgency; it just does not compile.', target: true }),
      c('quiet', 'Say nothing; aim for the next deadline', 'Pressure lingers', { satisfaction: -5, pressure: 4, stress: 3 }, { target: true, personality: 'cynic' })] },
];
