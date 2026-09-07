// The one who does not finish.
//
// Every lab has one and nobody writes it down. Somebody who was at the next desk for three years
// is told, in a meeting you are not in, that this is not working out — and then the lab does not
// discuss it. Not out of cruelty: out of the specific self-protective silence of people who have
// just watched something happen to somebody who is exactly like them.
//
// The arc runs across years on purpose, because that is the honest shape of it. The tell comes
// first and you do not read it as a tell. Then it happens. Then the room closes over it in about
// nine days. And then, much later, the only question that was ever actually yours: whether you are
// still in touch, which is a thing that requires you to do something and almost nobody does.
//
// The payoff is the point. Keeping in touch turns them into a contact in your network — a real one,
// with their own trajectory, who is out there doing well — and years later that is worth more than
// anything you got from the person who let them go.
const c = (id, text, hint, effects = {}, extra = {}) => ({ id, text, hint, effects, ...extra });

export default [
  { id: 'fired_tell', title: 'They have stopped coming in', category: 'lab', scene: 'lab', speaker: 'narrator',
    actor: { type: 'labmate' }, probability: .34, once: true, cooldown: 99,
    conditions: { minMonth: 16, maxMonth: 54, minBond: 40 },
    text: ['{labmate} has not been in for nine days. Their monitor is off, which it never is, and there is a jacket on the back of their chair that has been on the back of their chair the entire time.\n\nWhen they do come in they ask you something odd, in a flat voice, about whether the handbook says anything about a written warning. You say you do not know. You do not know. You go and read the handbook that evening, alone, and it says a great deal.',
      'The 1:1s move. {labmate}’s slot goes from Tuesday to Thursday, then to “let us find a time,” which in this building is a tense rather than a plan. They start replying to things at four in the morning. In group meeting they present a slide you have seen before and nobody says so, which is worse than if somebody had.'],
    choices: [
      c('ask', 'Ask them, directly, if they are all right', 'The thing almost nobody does', { energy: -3, labBond: 8, stress: 4 },
        { followUps: [{ id: 'fired_told', delay: 3 }],
          result: 'You ask. They say “yeah, no, it is fine” and then, forty seconds later, without either of you having moved, they tell you the real version. It takes four minutes. You are the first person they have told and you can tell, because of how fast it comes out once it starts.' }),
      c('cover', 'Cover for them in group meeting', 'Costs you something you will not get back', { energy: -6, stress: 6, labBond: 10, satisfaction: -4 },
        { followUps: [{ id: 'fired_told', delay: 3 }],
          result: 'You say their pipeline is blocked on your numbers, which is not true and is close enough to true that nobody follows it up. It buys them three weeks. Three weeks is not nothing and it is also not what they needed.' }),
      c('nothing', 'Say nothing. It is not your business.', 'The reasonable choice. It is also the common one.', { stress: 3 },
        { followUps: [{ id: 'fired_told', delay: 3 }],
          result: 'You do not ask, because asking would make it real, and because you are four days from a deadline, and because some part of you has already decided this is a thing that happens to other people.' }),
    ] },

  { id: 'fired_told', title: 'It is not working out', category: 'lab', scene: 'lab', speaker: 'narrator',
    scheduledOnly: true, once: true, cooldown: 99, conditions: { minMonth: 16 },
    text: 'It happens in an office with the door closed and you are not in it. You know it happened because {fired} comes out and goes straight to the stairwell rather than the lift, and because your advisor’s next meeting starts on time.\n\nThe phrase is “not a good fit.” It is always “not a good fit,” and the thing about that phrase is that it is unfalsifiable and everybody in the field agrees to keep using it. There is a master’s degree available. There is a departure date. There is, somewhere, a form.',
    choices: [
      c('stairwell', 'Go and find them in the stairwell', 'Nothing you say will help. Go anyway.', { energy: -4, stress: 8, hope: -4, labBond: 6 },
        { firesLabmate: true, followUps: [{ id: 'fired_room', delay: 1 }], achievement: 'thestairwell',
          result: 'They are on the half-landing between three and four, sitting down, and they apologise to you for being upset, which is the thing you will still be angry about in ten years — they apologise to you. You sit down on the step as well. Neither of you says anything useful and you both stay there for about twenty minutes, and years later this is the part they will remember and thank you for, and you will not be able to remember what you said, because you did not say anything, because there was nothing.' }),
      c('desk', 'Go back to your desk', 'What most people do, and there is no version of this that is brave', { stress: 10, hope: -6, labBond: -4 },
        { firesLabmate: true, followUps: [{ id: 'fired_room', delay: 1 }],
          result: 'You go back to your desk and you open the terminal and you look at it. You get eleven minutes of nothing done and then, alarmingly, you get two hours of real work done, and that is the part you think about later.' }),
      c('advisor', 'Ask your advisor what happened', 'They will tell you something true and incomplete', { energy: -4, stress: 6 },
        { firesLabmate: true, followUps: [{ id: 'fired_room', delay: 1 }], achievement: 'askedwhy',
          check: { rel: 'trust', difficulty: 46 },
          successEffects: { trust: 4, hope: -4 }, failureEffects: { satisfaction: -5, stress: 6 },
          successText: '“Three years and no first author, and I could not get them to tell me what was wrong.” It is said with real regret and it is a complete sentence about a person, and it is also missing every part where somebody could have done something. You notice the shape of the gap. You do not point at it.',
          failureText: '“That is between me and them.” Correct, professional, and it lands as a door closing. You have also just told them you are the kind of person who asks.' }),
    ] },

  { id: 'fired_room', title: 'Nobody mentions it', category: 'lab', scene: 'lab', speaker: 'narrator',
    scheduledOnly: true, once: true, cooldown: 99, conditions: { minMonth: 16 },
    text: 'Group meeting. Your advisor says one sentence — “{firedFirst} has decided to pursue other opportunities” — and moves to the agenda, and the agenda is forty minutes long and is about hyperparameters.\n\nNobody asks. Nobody asks the following week either. Within nine days the desk has been cleared by somebody from facilities, and within a month a new first-year is at it, and they will never be told, and there is no version of the lab’s story in which {fired} was ever here.',
    choices: [
      c('say', 'Say their name out loud in the meeting', 'It will be uncomfortable and it will be correct', { stress: 10, energy: -3, labBond: 12, satisfaction: -6 },
        { achievement: 'saidthename', personality: 'boundarySetter',
          result: 'You say “is anyone going to say anything about {fired}?” and the room does the thing where four people look at the table. Your advisor says “that is a fair question” and then does not answer it. Afterwards two people thank you separately, in corridors, quietly, which tells you everything about the building.' }),
      c('slack', 'Message the others privately instead', 'The lab’s actual communication channel', { labBond: 8, stress: 4 },
        { result: 'A DM thread forms with the two people you trust and it is, for about a week, the only honest room in the department. Then it goes quiet, because there is nothing to add and everybody has a deadline.' }),
      c('agenda', 'Follow the agenda', 'What the room is for', { stress: 6, hope: -5 },
        { result: 'You follow the agenda. You contribute a useful point about the learning rate schedule. It is a good meeting. You feel something close under you and you decide, without deciding, not to look at it.' }),
    ] },

  // Much later. This is the whole arc.
  { id: 'fired_after', title: 'You could just message them', category: 'peer', scene: 'home', speaker: 'narrator',
    scheduledOnly: false, once: true, cooldown: 99, probability: .55,
    prerequisites: ['labmateFired'], conditions: { minMonth: 30 },
    text: 'Fourteen months. Their name comes up because something they built is still in your pipeline, with their initials in a comment, and it works, and it has worked every day since they left.\n\nYou have their number. You have had their number the whole time. The message is four words long and you have not sent it, and the reason you have not sent it is not that you are busy, and you know that, and you have known it for fourteen months.',
    choices: [
      c('message', 'Send it', 'Four words. Fourteen months late. Send it.', { energy: -2, hope: 8, stress: -6 },
        { keepsFired: true, achievement: 'sentit',
          result: 'They reply in nine minutes. They are at a company you have heard of, on a team that is doing the thing they were trying to do here, with people who think they are excellent, because they are. They are not bitter. They ask about your chapter three by name, from memory, three years later.\n\nAt the end they say: “honestly, best thing that ever happened to me, and I would not say that if it were not true.” It is true. It is also true that it should not have had to be.' }),
      c('draft', 'Draft it and leave it', 'You will send it. You will send it this week.', { stress: 6, hope: -4 },
        { flags: { firedUnsent: true },
          result: 'You type it and you do not send it and it sits in the app, unsent, for the rest of your degree. You will see it every time you scroll past that thread. There is no version of this where sending it later is worse than this.' }),
      c('let', 'Let it go', 'People lose touch. That is what people do.', { stress: -2, hope: -3 },
        { result: 'You let it go, which is a normal thing that normal people do, and it costs nothing, and about one afternoon a year for the next decade you will think about the fact that you could have just sent it.' }),
    ] },
];
