// The endings nobody plans for, and the ones you cannot argue with.
//
// Everything else in this game is a trade you make. These are not. They fire because of what has
// already happened to you — money you started with, a body you kept overdrawing, a mind nobody
// checked on — and most of them do not offer you a real choice, because at that point there is not
// one. The register is the same as everywhere else: the institution is absurd, the person never is.
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

  // ── The one where the body stops asking ────────────────────────────────────────────────────
  { id: 'ambulance', title: 'You do not remember the corridor', category: 'life', scene: 'home', urgent: true,
    probability: 1, once: true, cooldown: 99, conditions: { maxHealth: 30, minLowHealth: 12, minMonth: 14 },
    text: ['A labmate finds you and does not spend any time deciding. The ceiling tiles of the fourth floor become the ceiling tiles of a corridor become a ceiling you have not seen before, and there is a plastic band on your wrist with your name spelled almost right.\n\nA doctor uses the phrase “for some time now.” A form on the tray says MEDICAL WITHDRAWAL and has been filled in by someone in an office, on your behalf, correctly.',
      'The last thing you remember clearly is deciding to finish the paragraph. You did not finish the paragraph.\n\nSomeone from the department comes on Thursday with a plant and a form. The plant is nice. The form has already been signed by three people and processed by a fourth, and your name is on the line where the student agrees.'],
    choices: [
      c('withdraw', 'There is nothing to decide', 'The decision was made without you, which is the point', {}, { ending: 'hospital' }),
      c('discharge', 'Sign yourself out against advice', 'There is a form for this too. It is one page and you can leave in an hour.', { health: -6, stress: 14, hope: -8, energy: -6 },
        { flags: { signedOut: true }, personality: 'grinder', achievement: 'signedout',
          result: 'The nurse does not argue, which is worse than arguing. You sign the page that says you were advised and declined, and you are at your desk on Monday, and the paragraph is still not finished.' }),
    ] },
  { id: 'flatline', title: 'The acknowledgements section', category: 'life', scene: 'home', urgent: true,
    probability: 1, once: true, cooldown: 99, conditions: { flag: 'signedOut', maxHealth: 14, minLowHealth: 22 },
    text: 'You have told three people this month that you are fine. Two of them believed you because it was easier and one of them did not and said so, and you told them you would go on Monday.\n\nThere is a copy of the form you signed in a file somewhere with your signature on the line that says you were advised and declined.\n\nIt is not Monday.',
    choices: [
      c('end', '—', 'There is no move here. That is the whole point of this one.', {}, { ending: 'posthumous' }),
    ] },

  // ── The one where nobody asked how you were ────────────────────────────────────────────────
  { id: 'special_care', title: 'A room with a window that opens four inches', category: 'life', scene: 'home', urgent: true,
    probability: 1, once: true, cooldown: 99, conditions: { minStress: 91, maxHope: 8, minHighStress: 18, minMonth: 20 },
    text: ['You are not sure how you got to the counselling centre and you are quite sure you did not walk there alone. The intake person is kind and fast and has a laminated card of questions, and somewhere around question nine the tone of the room changes and a second person comes in.\n\nThey use the phrase “a higher level of care.” It is nobody\'s fault that this is the first time in four years anyone has asked you these questions in this order.',
      'It is a Tuesday and you have been awake since Sunday and you have written two thousand words that are not words. Someone from the lab calls a number that is on a poster in the kitchen that you have walked past six hundred times.\n\nThe facility is forty minutes away and pleasant in the way of places that have thought hard about not looking like what they are. The window opens four inches. There is a reason the window opens four inches.'],
    choices: [
      c('go', 'Go, because everyone in the room has already decided', 'Ends the run somewhere safe, which is not nothing', {}, { ending: 'institution' }),
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
