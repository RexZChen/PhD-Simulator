// Your advisor leaves before you do.
//
// The single most destabilising thing that can happen to a PhD, and the one nobody warns you about,
// because from the outside it looks like an administrative change. It is not. Your funding, your
// project, your committee, your letters and the only person on earth who has read chapter three are
// all the same person, and that person has just been told something about their own life.
//
// The register holds: they are not villains here either. They are one lap ahead, and the lap ahead
// has its own cliff.
const c = (id, text, hint, effects = {}, extra = {}) => ({ id, text, hint, effects, ...extra });
export default [
  { id: 'advisor_tenure_denied', title: 'The vote went the other way', category: 'advisor', scene: 'office', speaker: 'advisor',
    probability: .5, once: true, cooldown: 99, conditions: { minMonth: 14, maxMonth: 46, stage: ['pre_tenure'] },
    text: ['{advisor} tells you in the office with the door closed, quickly, in the flat voice people use for the fourth telling. Six external letters, a unanimous department, and a decision one level up that nobody in the building can explain to you and several of them have tried.\n\nThey have a year. The lab has a year. You have whatever you can make of a year.',
      'You hear it from a labmate before you hear it from them, which is nobody\'s fault and is going to sit in you anyway. The case was strong. Everyone says the case was strong. Everyone also says that about most of the cases that go this way, which is the part that gets to you at three in the morning.'],
    choices: [
      c('follow', 'Ask to go with them, wherever they land', 'Loyal. Costs a year, and they may not land.', { hope: 6, stress: 8, energy: -6 },
        { flags: { followingAdvisor: true }, check: { rel: 'trust', difficulty: 50 },
          successEffects: { trust: 14, satisfaction: 8, hope: 8 }, failureEffects: { hope: -8, stress: 8 },
          successText: '“If there is a line, you are on it.” They say it before you finish the sentence, which means they had already decided, which means they had already thought about you in the worst week of their career.',
          failureText: '“I do not know what I have yet.” It is the honest answer. It is also the one that leaves you exactly where you were, holding a year.' }),
      c('stay', 'Stay, and find someone here', 'The pragmatic move. The relationship starts over.', { stress: 12, energy: -8, hope: -4 },
        { newAdvisor: true, personality: 'boundarySetter' }),
      c('finish', 'Race to finish inside their year', 'Brutal, and it does work for some people', { stress: 18, energy: -12, progress: 10, draft: 10 },
        { flags: { racingClock: true }, personality: 'grinder',
          result: 'You agree, out loud, to compress two years into one. They agree too, and for about eleven weeks both of you behave as though this is a plan rather than a hope with a schedule attached.' }),
    ] },

  { id: 'advisor_retires', title: 'A date in the spring', category: 'advisor', scene: 'office', speaker: 'advisor',
    probability: .45, once: true, cooldown: 99, conditions: { minMonth: 18, stage: ['late', 'mid_career'] },
    text: '“I am going emeritus in the spring.” It is said the way you would mention a train time. Forty-one years, six hundred students, and the announcement takes eleven seconds and then they ask about your figure 4.\n\nEmeritus means the office stays and the funding does not. There are two years of grant left and no more after that, and the arithmetic on your remaining time is now a thing you do at night.',
    choices: [
      c('coadvise', 'Ask them to co-advise to the end', 'The best outcome, and it needs their goodwill and someone else\'s signature', { energy: -6 },
        { check: { rel: 'satisfaction', difficulty: 52 },
          successEffects: { trust: 10, hope: 10, stress: -8 }, failureEffects: { hope: -6, stress: 10 },
          successText: 'They keep the appointment, a colleague signs as advisor of record, and functionally nothing changes except a line on a form. This is the version everybody wants and roughly half of people get.',
          failureText: 'The department wants an advisor of record with a lab and a grant. Emeritus is not that. Nobody is being unkind; the form simply has no box for what you are asking.',
          flags: { coadvised: 'onSuccess' }, successAchievement: 'keptemeritus' }),
      c('inherit_lab', 'Take on the lab\'s unfinished work', 'Their legacy, and your next two years', { energy: -10, stress: 8, progress: 12, academicCapital: 6 },
        { flags: { labInheritor: true }, achievement: 'labinheritor',
          result: 'Four half-finished projects, three of them by people who left, one of them genuinely good. You become the person who knows where everything is, which is a form of power and a form of sentence.' }),
      c('transfer', 'Move to a younger professor now', 'Cut it clean while you still have a choice', { stress: 10, energy: -8 },
        { newAdvisor: true }),
    ] },

  { id: 'advisor_industry', title: 'A company you have heard of', category: 'advisor', scene: 'office', speaker: 'advisor',
    probability: .4, once: true, cooldown: 99, conditions: { minMonth: 12, minAmbition: 55 },
    text: '“I am taking a leave.” The word is leave and the length is two years and the renewal is not mentioned, and everyone in the lab understands the grammar of this completely.\n\nThe compensation is a number nobody says out loud and everybody has estimated. The students are being distributed like furniture, kindly, over the course of one Thursday afternoon meeting that has an agenda.',
    choices: [
      c('follow_intern', 'Ask to come along as an intern first', 'Keeps the tie. Costs a summer, maybe a year.', { career: 8, money: 2200, energy: -6, progress: -8 },
        { flags: { advisorIndustry: true }, personality: 'riskTaker',
          result: 'You get a badge, a mentor who is your advisor with a different title, and a summer of work you cannot publish. The tie holds. The dissertation does not move.' }),
      c('remote', 'Keep them as advisor of record, remotely', 'Common, workable, and slower than anyone admits', { stress: 6, hope: -2 },
        { flags: { remoteAdvisor: true }, cadence: 'down',
          result: 'Monthly calls at 8 p.m. their time, cancelled about a third of the time, and genuinely useful when they happen. Your review latency doubles and your independence, which nobody planned, roughly triples.' }),
      c('reassign', 'Take the reassignment', 'A new advisor with their own students and their own agenda', { stress: 10, energy: -6 },
        { newAdvisor: true }),
    ] },

  { id: 'advisor_moves', title: 'They are being recruited', category: 'advisor', scene: 'office', speaker: 'advisor',
    probability: .4, once: true, cooldown: 99, conditions: { minMonth: 14, maxMonth: 50 },
    text: 'A better department, a bigger startup package, and a start date in August. They tell you before it is public, which is a courtesy and also a request you have not been asked yet.\n\nThe question underneath is whether you move. Moving means a new city, a new cohort, transferred credits that mostly transfer, and a milestone clock that in some departments restarts and in others does not, and nobody can tell you which yours is until you ask in writing.',
    choices: [
      c('move', 'Go with them', 'The strongest research outcome. Costs the life you built here.', { hope: 4, stress: 14, energy: -10, money: -1600 },
        { flags: { movedWithAdvisor: true }, achievement: 'wentwiththem',
          check: { rel: 'dependency', difficulty: 40 },
          successEffects: { trust: 12, satisfaction: 8, career: 6 }, failureEffects: { stress: 8, hope: -4 },
          successText: 'You arrive with a project, a funded line and the only person in the building who knows your work. Two years later this is obviously the right call and you still miss the old kitchen.',
          failureText: 'You move. The new department has its own hierarchy and you enter it at the bottom, again, at twenty-eight, with a paper under review and no friends.' }),
      c('stay_here', 'Stay, and be advised at a distance', 'Two institutions, one of which is now optional about you', { stress: 12, hope: -4 },
        { flags: { remoteAdvisor: true }, cadence: 'down',
          result: 'On paper it is fine. In practice you are the student in the other time zone, and the whiteboard conversations that shaped every good idea you have had are now happening without you.' }),
      c('newlocal', 'Stay and switch to someone here', 'Clean break, real cost, real fresh start', { stress: 10, energy: -8 },
        { newAdvisor: true }),
    ] },

  { id: 'advisor_dies', title: 'The email goes out at 7:40 a.m.', category: 'advisor', scene: 'campus',
    probability: .12, once: true, cooldown: 99, conditions: { minMonth: 20, stage: ['late', 'mid_career'] },
    text: 'It is from the chair and it is four sentences and the third one is the one. There is a number for counselling in the fourth.\n\nThe lab meets in the room at eleven because nobody can think of anything else to do. Somebody has brought pastries, which is absurd, and everybody eats them. The whiteboard still has their handwriting on it and it stays there for five months because no one is willing to be the person who picks up the eraser.',
    choices: [
      c('committee', 'Ask the committee to see you through', 'The kindest institutional outcome, and it depends on people', { energy: -8, stress: 12, hope: -6 },
        { check: { rel: 'satisfaction', difficulty: 45 },
          successEffects: { hope: 10, trust: 8, stress: -10 }, failureEffects: { hope: -10, stress: 12 },
          successText: 'Two of them split it without being asked and the third handles the paperwork, and the department finds the funding in a week, and for once the machine is fast because a human decided it would be.',
          failureText: 'Everyone is sorry and everyone is at capacity. It takes four months and an email from the dean to produce an advisor of record, and the four months are yours.',
          newAdvisor: true }),
      c('finish_it', 'Finish the paper you were working on together', 'For them. And it is the best thing you write.', { energy: -14, stress: 10, draft: 18, writingQuality: 10, hope: 4 },
        { newAdvisor: true, flags: { finishedForThem: true }, achievement: 'finishedforthem',
          result: 'You write the acknowledgement first, before the abstract, and then you cannot look at it for two weeks. It goes in with their name on it and it is accepted, and the notification email is addressed to a mailbox that is still receiving.' }),
      c('leave', 'You cannot do this without them', 'End the run. Nobody in this game would blame you.', {}, { ending: 'advisor' }),
    ] },
];
