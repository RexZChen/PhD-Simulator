// The endings nobody plans for, and the ones you cannot argue with.
//
// These interruptions arise from the run, but the player still has choices about what follows.
// The institution is the target of the satire; illness is not a verdict on a person.
const c = (id, text, hint, effects = {}, extra = {}) => ({ id, text, hint, effects, ...extra });
export default [
  // ── The one where the money calls ──────────────────────────────────────────────────────────
  { id: 'family_business', title: 'A phone call at an unusual hour', category: 'life', scene: 'home',
    probability: .32, once: true, cooldown: 99, conditions: { minMonth: 14, background: ['industry', 'changer'] },
    text: ['Your father has been putting off this conversation for two years, which you can tell because he has clearly written it down. The business is doing well. That is the problem. It is doing well and there is nobody to hand it to, and the accountant has started saying the word “succession” in a tone.',
      'It is not an emergency. That is what your mother says first, twice, which is how you know the shape of it. The firm needs someone whose name is on the door. There is exactly one of those left and they are in a windowless office in another country writing a related-work section.'],
    choices: [
      c('take', 'Fly home and take it', 'Ends the run with a title, just not that one', {}, { ending: 'inherit' }),
      c('refuse', 'Say no, and mean it', 'Hope and resolve; a conversation that does not end', { hope: 8, confidence: 6, stress: 6, satisfaction: 2 }, { flags: { refusedInheritance: true }, personality: 'grinder', achievement: 'saidnotomoney' }),
      c('defer', 'Ask for two years', 'Buys time. Two years is a long time to a business and nothing to a PhD.', { stress: -4, money: 4200, hope: -3 }, { flags: { inheritanceDeferred: true } }),
    ] },
  { id: 'family_business_return', title: 'Two years, as agreed', category: 'life', scene: 'home',
    probability: .55, once: true, cooldown: 99, conditions: { flag: 'inheritanceDeferred', minMonth: 38 },
    text: 'Nobody reminds you. That is the worst version. The accountant has stopped saying “succession” and started saying “wind down,” and the difference between those two words is about forty people who have worked there longer than you have been alive.',
    choices: [
      c('take', 'Go', 'The two years are up and the arithmetic has not improved', {}, { ending: 'inherit' }),
      c('stay', 'Stay. Let it wind down.', 'A cost that does not appear on any bar in this game', { hope: -10, stress: 10, money: 9000, confidence: 4 }, { personality: 'grinder' }),
    ] },

  // Sustained strain interrupts the plan; it does not determine the rest of a life.
  { id: 'ambulance', title: 'The work cannot continue on the same terms', category: 'life', scene: 'home', urgent: true,
    probability: 1, once: true, cooldown: 99, conditions: { maxHealth: 30, minLowHealthStreak: 4, minMonth: 14 },
    text: ['Your health has stayed low through several months. Today the work stops. When you contact student support, the first form asks for an expected return date before asking what needs to change.',
      'The next deadline is on the calendar. So is a health appointment. The department asks whether you need leave or withdrawal; the two forms look almost identical, but they do very different things.'],
    choices: [
      c('recover', 'Arrange four weeks of leave and care', 'Continue the run with recovery support; care costs apply', {}, { medicalRecovery: true,
        result: 'You choose leave, not withdrawal. You send a list of work that needs to wait. The office asks you to put the same list into its own template.' }),
      c('withdraw', 'Choose medical withdrawal and end this run', 'Leave the programme; your completed work remains part of your record', {}, { ending: 'hospital' }),
      c('discharge', 'Postpone the support plan and keep working for now', 'No leave now; health and stress worsen, and support may need revisiting', { health: -6, stress: 14, hope: -8, energy: -6 },
        { flags: { signedOut: true }, result: 'You postpone the arrangement. The work stays on the calendar, along with the unresolved need for support. You can still change course.' }),
    ] },
  // Keep this id for saved runs. It now offers renewed support, never a scripted death.
  { id: 'flatline', title: 'The support plan needs another look', category: 'life', scene: 'home', urgent: true,
    probability: 1, once: true, cooldown: 99, conditions: { flag: 'signedOut', maxHealth: 14, minLowHealthStreak: 3 },
    text: 'You postponed a support plan, and your health is still very low. That earlier answer does not have to be your answer now. Student support reopens the case. The system asks for a new form because the old form has been closed.',
    choices: [
      c('recover', 'Reopen the plan: four weeks of leave and care', 'Continue with support; the earlier postponement does not lock you out', {}, { medicalRecovery: true,
        result: 'You accept help and arrange the leave. The previous refusal stays in an old form; it does not decide what you are allowed to ask for today.' }),
      c('withdraw', 'Choose medical withdrawal and end this run', 'Step away from the programme rather than resume the workload', {}, { ending: 'hospital' }),
    ] },
  { id: 'special_care', title: 'Making room for support', category: 'life', scene: 'home', urgent: true,
    probability: 1, once: true, cooldown: 99, conditions: { minStress: 91, maxHope: 8, minHighStressStreak: 6, minMonth: 20 },
    text: ['High stress has become the background of the work, and there is very little hope left in it. In the support appointment, someone asks what could stop for a while. It is a different question from what you could finish faster.',
      'You ask for help changing the workload. The support office discusses leave and withdrawal as separate options. The department wants a completion estimate. For now, you are trying to make a plan for the next month.'],
    choices: [
      c('recover', 'Arrange four weeks of leave and support', 'Continue the run with less immediate strain; care costs apply', {}, { medicalRecovery: true,
        result: 'You choose time away from the workload. There will be another conversation about what comes next. Today, you do not have to supply the whole answer.' }),
      c('go', 'Choose medical withdrawal and end this run', 'End this programme here; care and your future are not graded by the degree', {}, { ending: 'institution' }),
    ] },

  // ── The one where nobody notices you are still here ────────────────────────────────────────
  { id: 'perpetual', title: 'The badge still works', category: 'department', scene: 'campus', urgent: true,
    probability: 1, once: true, cooldown: 99, conditions: { minMonth: 70, maxHope: 45, notFlag: 'graduated' },
    text: 'The seventh-year form is one page and requires two signatures and nobody has ever been refused. A first-year asks whether you are staff, which is a completely reasonable question: you have been in this building longer than the coffee machine, the carpet, and two of the three people on your committee.\n\nThe field marked “expected completion” has had four different dates in it. You have both stopped filling it in honestly and neither of you has mentioned that.',
    choices: [
      c('stay', 'Sign it again', 'Year seven. Then eight. The badge still works.', {}, { ending: 'perpetual' }),
      c('go', 'Hand in the badge', 'Leave, at last, on your own terms', {}, { ending: 'quit_walk' }),
    ] },
];
