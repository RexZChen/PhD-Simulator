// Group meeting.
//
// Measured across 120 runs: `group_present` fired an average of 7.8 times per run in the middle
// years, up to 17 times, in 94% of runs — one scene, every time, more often than any other event in
// the game by a factor of two. It was the single largest source of "this is repeating."
//
// The slot is right; the content was one item. These are the other things that happen when it is
// your turn, and the ones that happen when it is not.
const c = (id, text, hint, effects = {}, extra = {}) => ({ id, text, hint, effects, ...extra });
export default [

  // ── The round-the-table ────────────────────────────────────────────────────────────────────
  // The one everybody actually dreads: no slides, no warning, thirty seconds each, out loud, in
  // front of the room. What you have is what you have, and the room can tell in about four words.
  // Gated on whether the month actually produced anything, so it is the game's own record that
  // decides whether this is a fine Tuesday or the worst nine minutes of the term.
  { id: 'group_round_thin', title: '“Let’s go round the table.”', category: 'lab', scene: 'lab', probability: 1, scheduledOnly: true, cooldown: 4,
    conditions: { minMonth: 6, maxProgress: 34 },
    text: ['No slides. Thirty seconds each, out loud, what you did this week. There are nine people and you are seventh, which is enough time to rehearse it four times and still not have anything in it.',
      '{advisor} says “quickly, everyone, what have we got” and starts on the left. You are on the right. You have a fortnight of debugging and no result, and you can hear how that sounds before you say it.'],
    choices: [
      c('own', 'Say plainly that this week produced nothing', 'The bravest four seconds in the room', { energy: -3, stress: 6 },
        { check: { stat: 'confidence', difficulty: 52 },
          successEffects: { trust: 6, confidence: 5, stress: -8, satisfaction: 2 },
          failureEffects: { confidence: -8, satisfaction: -6, stress: 10, hope: -5 },
          successText: '“Nothing this week — the pipeline broke on Tuesday and I have been in it since.” {advisor} nods and moves on. It takes six seconds. You have been dreading it for two days.',
          failureText: 'It comes out as an apology with four qualifiers in it. {advisor} lets the pause run and says “right,” and the next person starts, and you sit in it for the rest of the meeting.',
          presented: true }),
      c('inflate', 'Make the debugging sound like progress', 'It works on eight of the nine people', { energy: -4, hype: 4 },
        { check: { skill: 'communication', difficulty: 58 },
          successEffects: { satisfaction: 4, confidence: 2 },
          failureEffects: { satisfaction: -8, confidence: -7, conflict: 3, stress: 9 },
          successText: 'You describe infrastructure work in the language of results. It passes. You feel the specific tiredness of having got away with something.',
          failureText: '“So what is the number?” There is no number. They ask again, in exactly the same words, which is how everybody in the room learns there is no number.',
          presented: true, personality: 'riskTaker' }),
      c('deflect', 'Give a one-line update and hand off fast', 'Small; nobody remembers it', { energy: -2, satisfaction: -2 },
        { presented: true, result: 'Eleven words and a full stop. It is the correct play about half the time and it costs a small amount of standing every single time.' }),
    ] },
  { id: 'group_round_strong', title: 'It is your turn and you have something', category: 'lab', scene: 'lab', probability: 1, scheduledOnly: true, cooldown: 4,
    conditions: { minMonth: 6, minProgress: 55 },
    text: 'Round the table, thirty seconds each. For once you have a number, and it is a good number, and you have been waiting three days for somebody to ask.',
    choices: [
      c('plain', 'State it in one sentence and stop', 'The version that lands', { energy: -2, satisfaction: 6, confidence: 7 },
        { presented: true, labBond: 2, result: 'One sentence, one number, done. {advisor} says “say that again,” and you say it again, and somebody writes it down. Under-selling a good result is the most reliable trick in this room.' }),
      c('long', 'Take the full three minutes it deserves', 'It deserves it; the room has nine people in it', { energy: -5, satisfaction: 3, hype: 4 },
        { presented: true, labBond: -3, result: 'You go long. It is genuinely interesting for ninety seconds. The last ninety are you enjoying yourself, and the eighth person on the list is watching the clock.' }),
      c('credit', 'Name the labmate whose script made it possible', 'Costs a little of the moment', { energy: -2, satisfaction: 4, confidence: 3 },
        { presented: true, labBond: 8, bond: 10, result: 'You give them the sentence. They go slightly red. That is now a person who will read your draft at eleven at night for the next four years.' }),
    ] },
  { id: 'group_public_correction', title: 'You are corrected in front of everyone', category: 'lab', scene: 'lab', probability: 1, scheduledOnly: true, cooldown: 6,
    conditions: { minMonth: 10, minToxicity: 42 },
    text: ['Two minutes in, {advisor} interrupts: “That is not what that plot shows.” The room goes very quiet and very interested, in the way rooms do.',
      'You say the number. {advisor} says “that cannot be right.” They are not being cruel. They are being loud, in a room, about your work, and it is the same thing from where you are standing.'],
    choices: [
      c('check', 'Check it live, on the screen, now', 'High risk; the only move that ends it', { energy: -5, stress: 12 },
        { check: { skill: 'research', difficulty: 55 },
          successEffects: { confidence: 12, trust: 8, satisfaction: 6, stress: -8 },
          failureEffects: { confidence: -10, satisfaction: -8, stress: 8 },
          successText: 'You pull up the notebook and walk the room through it. It is right. {advisor} says “fine — good,” and the room exhales, and something permanent changes in how they talk to you.',
          failureText: 'You pull it up. They are right. It is on the projector, at four times life size, and it takes about nine seconds to be sure.',
          presented: true }),
      c('note', '“Let me check and come back to you.”', 'The safe, correct, slightly hollow answer', { energy: -2, stress: 4, satisfaction: -2 },
        { presented: true, result: 'The meeting moves on. You check that evening. You were right. Nobody is in the room any more and you send an email that gets a thumbs up.' }),
      c('fold', 'Agree immediately and move on', 'Ends it now; costs the thing you were right about', { energy: -1, stress: -3, confidence: -6, novelty: -3 },
        { presented: true, personality: 'peoplePleaser', result: 'You say “oh — you are probably right,” which is a sentence you will replay on the walk home, because you were not probably wrong.' }),
    ] },
  { id: 'group_laughed_at', title: 'Somebody laughs', category: 'lab', scene: 'lab', probability: 1, scheduledOnly: true, cooldown: 8,
    conditions: { minMonth: 10, maxProgress: 40, minLabSize: 6 },
    text: 'You say what you have been working on. A senior student laughs — one short one, through the nose, at the back — and then says “sorry, sorry, carry on.” Nobody else reacts and everybody heard it.',
    choices: [
      c('carry', 'Carry on as though it did not happen', 'The professional move; it stays with you', { energy: -3, confidence: -5, stress: 6 },
        { presented: true, result: 'You finish your update. It is a perfectly good update. You will think about the noise for eleven days and they will not think about it again after Thursday.' }),
      c('name', '“Sorry — was there something?”', 'Four words; the room changes shape', { energy: -3, stress: 8 },
        { check: { stat: 'confidence', difficulty: 60 },
          successEffects: { confidence: 10, labBond: -2, satisfaction: 3 },
          failureEffects: { conflict: 6, labBond: -6, stress: 8, confidence: -4 },
          successText: 'They go red and say no, genuinely nothing, and apologise properly afterwards by the kettle. Nobody laughs at your updates again.',
          failureText: 'It comes out sharper than you meant. Now there are two people in a room being difficult and one of them is you, and {advisor} is watching both.',
          presented: true }),
      c('after', 'Find them afterwards', 'Slower; usually better', { energy: -3, stress: -2 },
        { bond: 4, presented: true, result: 'They are mortified. It was about something else entirely — a message on their phone — and they had not registered that you were mid-sentence. Six days of your attention, resolved in ninety seconds, by asking.' }),
    ] },
  { id: 'group_nobody_read', title: 'Nobody read it', category: 'lab', scene: 'lab', probability: 1, scheduledOnly: true, cooldown: 3,
    text: ['You circulated the draft on Sunday, as asked. It is Thursday. The question that opens the meeting is “sorry, remind me what this is?”',
      'Nine people, one of whom has opened the PDF, and you can tell which one because they are the only one not looking at the projector.'],
    choices: [
      c('walk', 'Walk them through it from the top anyway', 'Costs the meeting; buys the feedback', { energy: -6, readiness: 4 },
        { check: { skill: 'communication', difficulty: 48 }, successEffects: { confidence: 5, writingQuality: 4, satisfaction: 3 }, failureEffects: { stress: 5, confidence: -3 },
          successText: 'By slide four they are with you, and the questions in the last ten minutes are worth the first twenty.',
          failureText: 'You are re-explaining the setup at minute eighteen of a thirty-minute slot.', presented: true }),
      c('one', 'Ask for one thing: is the framing right?', 'A narrow question gets a real answer', { energy: -3, writingQuality: 5, hype: 2 },
        { presented: true, result: 'Narrowing it to one question is the trick, and somebody who has not read a word of it still knows the answer, because the answer is about the field rather than about your draft.' }),
      c('rebook', 'Say you will bring it back next week', 'A week gone; nobody objects', { stress: -2, energy: 2 }, { personality: 'boundarySetter', result: 'Everyone agrees immediately, which is how you learn that this week was never going to be the week.' }),
    ] },

  { id: 'group_someone_else', title: '{labmate} presents', category: 'lab', scene: 'lab', probability: 1, scheduledOnly: true, cooldown: 2, actor: { type: 'labmate' },
    text: ['It is not your week. {labmate} has forty slides and a result you do not entirely believe, and there are fifty minutes left.',
      '{labmate} is presenting the thing they have been presenting for four months, with three new numbers in it.'],
    choices: [
      c('question', 'Ask the question everyone is thinking', 'Useful to them; visible to the room', { energy: -3, academicCapital: 3 },
        { bond: -3, check: { skill: 'communication', difficulty: 52 }, successEffects: { confidence: 4, satisfaction: 3 }, failureEffects: { conflict: 3, confidence: -2 },
          successText: 'You ask it kindly and precisely, and {labmate} says “yeah, that is the problem,” and the room relaxes because somebody finally said it.',
          failureText: 'It lands harder than you meant. {labmate} answers, and then does not look at you for the rest of the meeting.' }),
      c('support', 'Say the thing that is working', 'Costs nothing, and is remembered', { energy: -1 },
        { bond: 8, labBond: 2, result: 'You name the one part that is genuinely good, specifically, out loud. Nobody else does this and everybody remembers who did.' }),
      c('work', 'Answer email under the table', 'Time back; a room that notices', { energy: 2, draft: 4 },
        { bond: -4, personality: 'grinder', result: 'You get forty minutes back. {advisor} looks over twice and does not say anything, which is not the same as not having noticed.' }),
    ] },

  { id: 'group_derail', title: 'The meeting is about something else now', category: 'lab', scene: 'lab', probability: 1, scheduledOnly: true, cooldown: 4,
    text: ['Someone mentions the cluster. Twenty-five minutes disappear into the cluster. Nobody in this room controls the cluster.',
      'A question about your figure becomes a question about the notation, which becomes a forty-minute discussion of notation, which resolves nothing and is enjoyed by everyone.'],
    choices: [
      c('steer', 'Steer it back to your slide', 'The unpopular, correct move', { energy: -4 },
        { check: { stat: 'confidence', difficulty: 55 }, successEffects: { readiness: 5, satisfaction: 4, progress: 3 }, failureEffects: { confidence: -4, stress: 4 },
          successText: 'You say “can we come back to slide six,” and the room does, and you get eleven real minutes.',
          failureText: 'You say it twice. The second time is audible and the meeting continues anyway.', presented: true }),
      c('ride', 'Let it run', 'Free time; nothing decided', { energy: 3, stress: -3 },
        { result: 'It is a good conversation about a real problem, and it is not your problem, and the hour is gone.' }),
      c('notes', 'Write down what they are actually arguing about', 'A thing you will use in two years', { energy: -2, novelty: 4, academicCapital: 2 },
        { personality: 'perfectionist', result: 'Underneath the notation argument is a disagreement about what counts as evidence in this subfield. That is a paragraph in your introduction, eventually.' }),
    ] },

  { id: 'group_visitor', title: 'There is a visitor in the room', category: 'lab', scene: 'lab', probability: 1, scheduledOnly: true, cooldown: 6, conditions: { minMonth: 8 },
    text: ['Someone is here from somewhere else. Nobody introduced them properly and everyone is presenting slightly better than usual.',
      'A candidate for a faculty position is sitting in, which means the whole lab is performing being a lab.'],
    choices: [
      c('shine', 'Present as though they matter, because they might', 'Higher stakes than a normal week', { energy: -7, readiness: 5 },
        { check: { skill: 'communication', difficulty: 56 }, successEffects: { confidence: 7, academicCapital: 6, career: 4 }, failureEffects: { confidence: -6, stress: 7 },
          successText: 'They ask you two questions afterwards, in the corridor, and take your email. That is what a corridor is for.',
          failureText: 'You aim it at the visitor and lose the room, and the visitor was here to see the lab rather than you.', presented: true }),
      c('normal', 'Present the way you would anyway', 'Steady; occasionally that is the win', { energy: -5, readiness: 4, confidence: 2 },
        { presented: true, result: 'You do the normal version. It is fine. Afterwards the visitor asks {advisor} who the third-year was, which is the whole thing you wanted and did not do anything to get.' }),
      c('after', 'Skip the slides and talk to them after', 'A conversation instead of a performance', { energy: -4, academicCapital: 4 },
        { result: 'Twenty minutes by the kettle, which is worth four group meetings, and which nobody records anywhere.' }),
    ] },

  { id: 'group_reading', title: 'Reading group, and nobody read', category: 'lab', scene: 'lab', probability: 1, scheduledOnly: true, cooldown: 5,
    text: 'The paper was thirty-one pages and it was circulated on Friday. The person who chose it has read it. The person who chose it is you.',
    choices: [
      c('teach', 'Teach it properly', 'An hour of your prep, an hour of their attention', { energy: -6, teaching: 4, readiness: 4, academicCapital: 3 },
        { skill: { teaching: 1 }, result: 'You end up understanding it three times better than you did on Sunday, which is the actual reason reading groups exist and nobody says so.' }),
      c('argue', 'Skip the summary; open with what is wrong with it', 'Faster, sharper, riskier', { energy: -4, novelty: 5 },
        { check: { skill: 'research', difficulty: 54 }, successEffects: { confidence: 6, evidence: 3, satisfaction: 3 }, failureEffects: { confidence: -4, conflict: 2 },
          successText: 'The objection is real and the room gets there with you, and two people go back and read it properly that night.',
          failureText: 'You attack a claim the paper does not make. Somebody has the PDF open and finds the sentence.' }),
      c('cancel', 'Suggest everybody read it and come back', 'The honest option, taken rarely', { energy: 3, stress: -3 },
        { labBond: 3, result: 'Universal, immediate relief. It does not get read next week either, but everyone is grateful about it.' }),
    ] },

  { id: 'group_your_turn_again', title: 'It is your turn again', category: 'lab', scene: 'lab', probability: 1, scheduledOnly: true, cooldown: 3, conditions: { minMonth: 14 },
    text: ['Three weeks ago you presented this. There is one new figure. The figure is good and it is one figure.',
      'You present roughly every four weeks, and a project does not produce a new result every four weeks, so about a third of these are you saying the same thing more confidently.'],
    choices: [
      c('honest', 'Say out loud that there is not much new', 'Costs a little; buys the room back', { energy: -3 },
        { check: { stat: 'trust', difficulty: 45 }, successEffects: { trust: 5, satisfaction: 3, stress: -5 }, failureEffects: { satisfaction: -5, pressure: 5 },
          successText: '“Fine. What is in the way?” Twenty minutes on the actual obstacle, which is the most useful group meeting of the term.',
          failureText: '“In three weeks?” The tone is not cruel and the sentence sits there for a fortnight.', presented: true }),
      c('stretch', 'Present the one figure as though it were four', 'It works, and it costs something invisible', { energy: -5, hype: 5, readiness: 3 },
        { presented: true, personality: 'riskTaker', result: 'It goes well. Nobody catches it. You have now learned that nobody catches it, which is a more dangerous thing to know than it sounds.' }),
      c('negative', 'Present the negative result instead', 'Nobody does this and everybody needs it', { energy: -5, evidence: 6, novelty: 3 },
        { presented: true, labBond: 4, result: 'You show the thing that did not work and exactly why. Two people in the room were about to try it. That is forty person-hours you just saved, and no venue will ever count it.' }),
    ] },
];
