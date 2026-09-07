// Commencement, the market, and the twenty years after. Employers are invented; salaries are
// fabricated but sit in the right neighbourhood of the real ones, which is its own joke.

// Lines that go on the CV during the commencement animation, in order.
export const cvSections = [
  { id: 'education', label: 'Education', weight: 6 },
  { id: 'publications', label: 'Publications', weight: 34 },
  { id: 'citations', label: 'Citations', weight: 16 },
  { id: 'talks', label: 'Talks and service', weight: 12 },
  { id: 'teaching', label: 'Teaching', weight: 10 },
  { id: 'awards', label: 'Awards', weight: 8 },
  { id: 'funding', label: 'Funding', weight: 12 },
  { id: 'people', label: 'References', weight: 12 },
];

// The years after. `when` is years post-graduation; conditions filter by what happened.
export const epilogueBeats = [
  { id: 'hooding', when: 1, weight: 9, needs: 'deferredCeremony',
    from: 'advisor', subject: 'Are you coming back in May?',
    text: 'The department needs numbers for the hooding ceremony. You defended months ago, so you have been Doctor on paper for a while — but the gown, the hood, the walk across the stage and the part where I get to put it over your head all happen in May.\n\nIt is not compulsory. It costs a flight you now, technically, earn enough to afford. Your family would like it more than you will admit.\n\nEither way: you did the thing.',
    choices: [
      { id: 'come', label: 'Fly back for it', line: 'You rent a gown that does not fit and stand in a line of people you spent six years with and barely know. Your advisor gets the hood the wrong way round on the first try, in front of everyone, and you both laugh in a way neither of you managed once in the lab. Your family takes 200 photographs. You keep four.', effects: { hope: 18, trust: 12 } },
      { id: 'skip', label: 'Skip it — you have a job now', line: 'Three weeks into the new role, taking a Thursday off feels impossible in a way it will not, in hindsight, have actually been. Your advisor mails the hood in a box. You find it two moves later, still in the box, and that is the first time any of it makes you cry.', effects: { hope: 6 } },
      { id: 'later', label: 'Ask whether you can walk next year instead', line: 'They say yes, of course, people do it all the time. You go the following May with a year of distance and enjoy it more than you would have. The photographs are better because you are, by then, sleeping.', effects: { hope: 14, trust: 6 } },
    ] },
  { id: 'orphan_paper', when: 2, weight: 3, needs: 'abandoned',
    from: 'advisor', subject: 'You will not believe what happened to your old project',
    text: 'Do you remember the thing you shelved in year four? {labmate} picked it up, ran the experiment you never got to, and it is in at {venue}. You are second author. I put you there and I did not ask, which I hope is the right kind of not asking.\n\nThe camera-ready is next week. Come to the conference if you can — I cannot fund you any more, which is a sentence I have been looking forward to writing for years.',
    choices: [
      { id: 'go', label: 'Go, out of your own pocket', line: 'You pay for your own flight for the first time and it feels absurd and excellent. You stand at the poster for twenty minutes and then go and find your advisor at the coffee urn.', effects: { hope: 10, citations: 6 } },
      { id: 'cant', label: 'Send a note and your congratulations', line: 'You reply properly, at length, and mean it. They forward it to the student, who saves it.', effects: { hope: 5, citations: 3 } },
    ] },
  { id: 'citation_years_later', when: 3, weight: 3,
    from: 'system', subject: 'Your work was cited',
    text: 'A paper you have never heard of, from a lab in a country you have never been to, cites the thing you wrote at 3 a.m. in year three and thought was a failure. They call it “the standard treatment.”',
    choices: [{ id: 'ok', label: 'Sit with that for a minute', line: 'You read their paper. It is better than yours. It only exists because yours did.', effects: { hope: 12, citations: 12 } }] },
  { id: 'coffee', when: 2, weight: 4,
    from: 'advisor', subject: 'Back on campus?',
    text: 'I hear you are in town for the workshop. Coffee? The good machine is still broken; there is a new place across from the library that charges six dollars and is worth four.',
    choices: [
      { id: 'yes', label: 'Go for the coffee', line: 'Ninety minutes. Twenty of it about research. You tell them the truth about year four and they say, quietly, “I know. I should have noticed sooner.” Nobody has ever said that to you before.', effects: { hope: 14, trust: 10 } },
      { id: 'busy', label: 'You are only in town for the day', line: 'You mean to reschedule. You do, eventually, eleven months later, and it is still good.', effects: { hope: 4 } },
    ] },
  { id: 'review_request', when: 1, weight: 4,
    from: 'venue', subject: 'Invitation to review',
    text: 'You have been invited to review for {venue}. You are, apparently, an expert now. Nobody sent a certificate; they sent four PDFs and a deadline.',
    choices: [
      { id: 'careful', label: 'Write the review you always wanted to get', line: 'You spend four hours on it. Specific, generous, and hard where it needs to be. Somewhere, a second-year reads it and does not cry.', effects: { hope: 10, capital: 6 } },
      { id: 'fast', label: 'Do it in forty minutes at 11 p.m.', line: 'It is fine. It is not the review you always wanted to get. You know the difference, and that is new.', effects: { capital: 3 } },
    ] },
  { id: 'advisor_life', when: 4, weight: 3,
    from: 'advisor', subject: 'News',
    text: '{advisorNews}',
    choices: [{ id: 'reply', label: 'Write back properly', line: 'You write back at length, the way you never did while you were their student, because then it would have been homework and now it is a letter.', effects: { hope: 10, trust: 8 } }] },
  { id: 'student_email', when: 5, weight: 5,
    from: 'stranger', subject: 'A question about doing a PhD',
    text: 'Hi — I found your paper and then your page. I am applying this year and everyone tells me something different. Was it worth it? You can be honest. I would rather know.',
    choices: [
      { id: 'honest', label: 'Tell them the truth, all of it', line: 'You write six paragraphs. You do not sell it. You describe the worst month and the best afternoon and you say that both were real and that only one of them is in the CV. You tell them it is not for everyone, that it costs more than anyone says, and that you would do it again. They apply. Of course they apply.', effects: { hope: 20 }, final: true },
      { id: 'short', label: 'Keep it short and kind', line: 'Three sentences: it is hard, it is specific, pick the advisor and not the school. It is the most useful email they receive all year.', effects: { hope: 12 }, final: true },
    ] },
  { id: 'labmate_news', when: 3, weight: 3,
    from: 'labmate', subject: 'guess who',
    text: '{labmate} here. I finally defended. Four months of revisions and my committee made me rerun everything, but it is done. I keep thinking about the week you sat with me in the lab at 2 a.m. when my code was broken. You probably do not remember it. I do.',
    choices: [{ id: 'reply', label: 'Reply immediately', line: 'You do remember it. You had a deadline that week and you sat with them anyway. It turns out that is the part that lasted.', effects: { hope: 14 } }] },
  // The patent takes thirty months from the first meeting to a grant, and nobody is still a student
  // by then. Resolving it in the run was never possible; resolving it here is not a workaround, it
  // is the actual shape of the thing — a letter about work you did at a desk that is now a server
  // closet, addressed to a person the university has no current address for.
  { id: 'patent_granted', when: 3, weight: 4, needs: 'patentPending',
    from: 'system', subject: 'US 12,4XX,XXX B2 — Notice of Allowance',
    text: 'It is forwarded twice before it reaches you. The claims that survived are 1, 4 and 11, which are the three you argued for in a meeting you attended by phone from a parking lot.\n\nThe inventors are listed in the order the office received them: your advisor, then you. The revenue share is set out in a policy document dated eleven years before you arrived. Seventy per cent, thirty per cent, and the word used for it is “equitable”.\n\nThere is a licensing enquiry attached, from a company you have heard of. The figure, if it happens, is $41,000. Your share of the figure, if it happens, is $12,300.',
    choices: [
      { id: 'frame', label: 'Print it and frame it', line: 'It hangs in a hallway where nobody reads it, including you.\n\nIt cost the university $38,000 in attorney fees and it cost you the four best weekends of year four. Both numbers are on the record, in different offices, and no document anywhere contains both.', effects: { hope: 8, capital: 6 } },
      { id: 'ask', label: 'Ask, once, how the split was decided', line: 'The reply is prompt, courteous, and quotes the policy number twice. It does not answer the question, because the question does not have an answer of the kind you were asking for. It has a policy, and a policy is what you get instead.\n\nYou stop asking. Nine years later a postdoc asks you the same thing and you hear yourself quote the same number, in the same tone, and there is a full second where you can feel yourself decide not to notice it.', effects: { hope: 4, capital: 8 } },
      { id: 'nothing', label: 'File it in the drawer with the diploma', line: 'The licensing enquiry goes quiet in the spring, the way most of them do. Nothing arrives.\n\nThe patent stays granted, permanently, in a database, next to your name. It is the only thing you made in six years that has a number instead of a title.', effects: { hope: 6 } },
    ] },
  { id: 'the_book', when: 6, weight: 2, needs: 'faculty',
    from: 'self', subject: 'Your first student',
    text: 'A first-year sits in your office and says they have an idea, and it is not good yet, and they are braced for you to say so.',
    choices: [
      { id: 'listen', label: 'Say “tell me more”', line: 'You hear yourself say the thing your advisor said, in year one, that made you stay. You did not know you had kept it.', effects: { hope: 16 }, final: true },
      { id: 'norush', label: 'Say “no rush”', line: 'You hear it come out of your mouth. You mean it entirely. They will not believe you, and that is how it works, and one day they will say it too.', effects: { hope: 12 }, final: true },
    ] },
];

export const advisorNews = [
  'I got tenure. It took eleven years and two appeals and I am told I should feel something.',
  'I am on sabbatical, in a country where I do not speak the language, and I have read four novels.',
  'We had a baby. I have discovered that I was, in fact, capable of leaving the building at five.',
  'I am chairing the department, which is a punishment disguised as an honour. Do not do this.',
  'I am retiring next year. Forty-one students. I remember all of the projects and most of the arguments.',
  'The lab has moved buildings. Your old desk is in a room that is now a server closet, which feels apt.',
];
