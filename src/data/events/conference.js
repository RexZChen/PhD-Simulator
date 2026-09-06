const c = (id, text, hint, effects = {}, extra = {}) => ({ id, text, hint, effects, ...extra });
export default [
  { id: 'conference_travel', title: 'The conference', category: 'career', scene: 'conference', probability: 1, scheduledOnly: true, cooldown: 0,
    text: ['“{project}” is at {venue} this month. The hotel is $340 a night. The reception has shrimp. You do the math on both.', 'Conference week. Your talk is at 8:30 a.m. in a room named after a donor. The coffee is named after nothing.'],
    choices: [c('go', 'Go, present, survive on receptions', 'Travel costs unless funded; capital, hope, contacts', { energy: -8, academicCapital: 8, hope: 8, confidence: 5 }, { travel: true, personality: 'networker', flags: { social: true } }),
      c('remote', 'Present remotely', 'Cheap; less visible', { academicCapital: 3, stress: -2, hope: 2 }),
      c('skip', 'Let {advisor} present it', 'No cost; a missed room', { hope: -3, satisfaction: -4, academicCapital: 1 }, { personality: 'cynic' })] },
  { id: 'cpt', title: 'Work authorization', category: 'life', scene: 'portal', probability: 1, scheduledOnly: true, cooldown: 99,
    text: 'The internship needs a work authorization form signed by three offices, one of which only exists on Tuesdays.',
    choices: [c('early', 'Start the paperwork now', 'Energy → done on time', { energy: -6, stress: 4 }, { check: { skill: 'communication', difficulty: 45 }, successEffects: { hope: 3 }, failureEffects: { money: -200, stress: 6 }, successText: 'Approved with a week to spare. You frame the email.', failureText: 'Approved the day before the start date, after an expedite fee.' }),
      c('late', 'Deal with it later', 'Future you again', { stress: -1 }, { followUps: [{ id: 'cpt_late', delay: 1 }], personality: 'cynic' })] },
  { id: 'cpt_late', title: 'The start date is Monday', category: 'life', scene: 'portal', probability: 1, scheduledOnly: true, cooldown: 99,
    text: 'The authorization is “in review.” Your manager asks if you can start remotely, unpaid, “just to get going.”',
    choices: [c('wait', 'Wait for the approval', 'Lose two weeks of pay', { money: -1800, stress: 8 }), c('escalate', 'Escalate through the international office', 'Communication check', { energy: -5 }, { check: { skill: 'communication', difficulty: 55 }, successEffects: { stress: -2 }, failureEffects: { money: -1800, stress: 10 }, successText: 'A director signs it at 4:58 p.m. on Friday.', failureText: 'The office is closed for a training about efficiency.' })] },
];
