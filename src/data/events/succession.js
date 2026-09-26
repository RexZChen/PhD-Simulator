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
    probability: .5, once: true, conditions: { stage: ['pre_tenure'] },
    text: '{advisor} shows you the denial. Their appointment ends in twelve months. The letter is precise about that and remarkably quiet about the students.\n\nThere is no transfer offer yet. Today you can discuss a plan, or start again with another advisor here.',
    choices: [
      c('follow', 'Ask to be included if they move', 'Trust; express interest, without committing to a transfer.', { trust: 8, hope: 3, energy: -4 },
        { flags: { followingAdvisor: true }, result: '“I will keep you in the conversation.” You ask to see the actual funding and transfer terms before deciding. For now, your school and your deadlines stay the same.' }),
      c('stay', 'Stay, and find someone here', 'A new local advisor; the relationship starts over.', { stress: 12, energy: -8, hope: -4 },
        { newAdvisor: true, personality: 'boundarySetter' }),
      c('finish', 'Work on the current draft while considering options', 'Progress and draft work now; no promised early graduation.', { stress: 10, energy: -10, progress: 10, draft: 10 },
        { requiresEditableProject: true, flags: { racingClock: true }, personality: 'grinder', result: 'You narrow the next section and revise it together. That is one piece of work done, not a waiver of your remaining degree requirements.' }),
    ] },

  { id: 'advisor_retires', title: 'The retirement paperwork', category: 'advisor', scene: 'office', speaker: 'advisor',
    probability: .45, once: true, cooldown: 99, conditions: { minMonth: 18, stage: ['late', 'mid_career'] },
    text: '“The emeritus appointment is effective now.” {advisor} slides over a form. It names a successor. It does not say who will read the draft.',
    choices: [
      c('coadvise', 'Keep emeritus feedback', 'A new primary; ask the retiring advisor to stay involved.', { energy: -6 },
        { retirement: 'coadvise', check: { rel: 'satisfaction', difficulty: 52 },
          successEffects: { trust: 10, hope: 10, stress: -8 }, failureEffects: { hope: -6, stress: 10 },
          successText: 'A local colleague takes over as advisor of record. Your retiring advisor agrees to a monthly check-in when you request one. You keep a second reader, not a second set of compulsory meetings. The form still has room for only one name.',
          failureText: 'A local colleague takes over as advisor of record. Your retiring advisor cannot commit to regular check-ins. You keep your completed work, but the next reader will need the context that used to go without saying.',
          successAchievement: 'keptemeritus' }),
      c('inherit_lab', 'Accept the funded handover', 'Keep this project moving; maintain its records.', { energy: -10, stress: 8, progress: 12, academicCapital: 6 },
        { retirement: 'handover', requiresEditableProject: true, achievement: 'labinheritor',
          result: 'The agreement names your current project, a local successor, and an end date. It protects your base RA stipend and excuses TA work while you keep the project materials usable. The department calls this continuity. You keep the copy with the end date.' }),
      c('transfer', 'Switch to a local advisor', 'A fresh relationship, without extra commitments.', { stress: 10, energy: -8 },
        { retirement: 'local',
          result: 'Your new advisor asks for the draft and the deadline list. The work carries over. Whether you mean the same thing by “nearly done” will take another meeting.' }),
    ] },

  { id: 'advisor_industry', title: 'A company you have heard of', category: 'advisor', scene: 'office', speaker: 'advisor',
    probability: .4, once: true, cooldown: 99, conditions: { minMonth: 12, minAmbition: 55 },
    text: '“I am taking a leave.” The word is leave and the length is two years and the renewal is not mentioned, and everyone in the lab understands the grammar of this completely.\n\nThe compensation is a number nobody says out loud and everybody has estimated. The students are being distributed like furniture, kindly, over the course of one Thursday afternoon meeting that has an agenda.',
    choices: [
      c('follow_intern', 'Accept a summer internship with them', 'A paid research summer next June; remote advising until then.', { energy: -6, stress: 4 },
        { advisorInternship: true, flags: { advisorIndustry: true, remoteAdvisor: true }, cadence: 'down', personality: 'riskTaker',
          result: 'The offer from {company} has dates, a salary, and {advisor} in the mentor field. You accept. Until June, your meetings are by video. The badge photograph can wait.' }),
      c('remote', 'Keep them as advisor of record, remotely', 'Common, workable, and slower than anyone admits', { stress: 6, hope: -2 },
        { flags: { remoteAdvisor: true }, cadence: 'down',
          result: 'You agree to meet less often, by video. The next invitation includes two time zones. Nobody has promised a faster reply to the draft.' }),
      c('reassign', 'Take the reassignment', 'A new advisor with their own students and their own agenda', { stress: 10, energy: -6 },
        { newAdvisor: true }),
    ] },

  { id: 'advisor_moves', title: 'They are being recruited', category: 'advisor', scene: 'office', speaker: 'advisor',
    probability: .4, once: true, cooldown: 99, conditions: { minMonth: 14, maxMonth: 50 },
    text: 'A bigger startup package. A start date next month. {advisor} puts the offer beside your draft.\n\nThe department will honor your completed work. The moving bill is yours.',
    choices: [
      c('move', 'Commit to going with them', '$1,600 deposit; move next month under the terms above.', { hope: 4, stress: 14, energy: -10, trust: 6, satisfaction: 4 },
        { relocate: true,
          result: 'You sign and pay the deposit. Your labmates have signed too; the lab is going together. The files will copy quickly. Packing the kitchen is a separate research problem.' }),
      c('stay_here', 'Stay, and be advised at a distance', 'Keep this campus and rent; fewer meetings, by video.', { stress: 6, hope: -2 },
        { flags: { remoteAdvisor: true }, cadence: 'down',
          result: 'You keep your registration and housing here. The meetings move to video and become less frequent. You put a standing document beside the calendar invitation; the whiteboard will need a substitute.' }),
      c('newlocal', 'Stay and switch to someone here', 'Clean break, real cost, real fresh start', { stress: 10, energy: -8 },
        { newAdvisor: true }),
    ] },

  { id: 'advisor_dies', title: 'The email goes out at 7:40 a.m.', category: 'advisor', scene: 'campus', noMeme: true,
    probability: .12, once: true, cooldown: 99, conditions: { minMonth: 20, stage: ['late', 'mid_career'] },
    text: 'It is from the chair and it is four sentences and the third one is the one. There is a number for counselling in the fourth.\n\nThe lab meets in the room at eleven because nobody can think of anything else to do. Somebody has brought pastries, which is absurd, and everybody eats them. The whiteboard still has their handwriting on it. Nobody reaches for the eraser.',
    choices: [
      c('committee', 'Ask the committee to see you through', 'The kindest institutional outcome, and it depends on people', { energy: -8, stress: 12, hope: -6 },
        { check: { rel: 'satisfaction', difficulty: 45 },
          successEffects: { hope: 10, trust: 8, stress: -10 }, failureEffects: { hope: -10, stress: 12 },
          successText: 'Two committee members offer to share the reading. A colleague agrees to become advisor of record. You leave with a name and a meeting time. That is enough to put in the calendar today.',
          failureText: 'Everyone is sorry and everyone is at capacity. The chair assigns an advisor of record, but no one offers to share the reading. Your first email will need to explain the project from the beginning.',
          newAdvisor: true }),
      c('finish_it', 'Work on the paper you began together', 'Energy into the draft and writing; a new advisor.', { energy: -14, stress: 10, draft: 18, writingQuality: 10, hope: 4 },
        { newAdvisor: true, requiresEditableProject: true, flags: { finishedForThem: true }, achievement: 'finishedforthem',
          result: 'You write the acknowledgement before returning to the abstract. The draft moves forward. Their name stays on it; submission and the reviewers are still ahead.' }),
      c('leave', 'You cannot do this without them', 'End the run. Nobody in this game would blame you.', {}, { ending: 'advisor' }),
    ] },
];
