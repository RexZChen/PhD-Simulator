// Who you could ask for a letter. More people than you have Energy to ask, which is the choice.
// `strength` is what they would write; `reliability` is whether it arrives. You see neither.

// Seven candidates per background. The first is always the strongest tie you have.
export const recommenderPools = {
  undergrad: [
    { relation: 'undergraduate thesis advisor', base: 72, rel: 70, note: 'Supervised the thesis. Knows the work and the way you got stuck in March.' },
    { relation: 'REU mentor', base: 66, rel: 62, note: 'One summer, closely. A short letter with something specific in it.' },
    { relation: 'course professor (advanced)', base: 54, rel: 74, note: 'You were the best student in a hard class. That is a real sentence to have written about you.' },
    { relation: 'course professor (large lecture)', base: 40, rel: 84, note: 'Will confirm the grade and the enrolment dates, promptly.' },
    { relation: 'lab postdoc who supervised you', base: 63, rel: 78, note: 'Knows the work in detail. Junior, so committees weight it down.' },
    { relation: 'department chair', base: 47, rel: 58, note: 'Prestigious signature, thin content. Has met you twice.' },
    { relation: 'internship manager', base: 50, rel: 66, note: 'Industry. Warm, and slightly the wrong shape for a PhD file.' },
  ],
  masters: [
    { relation: 'research advisor', base: 78, rel: 72, note: 'Two years of it. The letter that carries the file.' },
    { relation: 'thesis committee member', base: 62, rel: 68, note: 'Read the thesis. Different subfield, which reads as breadth.' },
    { relation: 'co-author from your paper', base: 70, rel: 64, note: 'Can say you did the work, because they watched you do it.' },
    { relation: 'course professor (advanced)', base: 52, rel: 76, note: 'A seminar and a good final project.' },
    { relation: 'former undergraduate advisor', base: 58, rel: 54, note: 'Knew you well, four years ago, before any of this.' },
    { relation: 'visiting professor you worked with', base: 66, rel: 48, note: 'Prestigious and external. Currently on another continent and hard to reach.' },
    { relation: 'department chair', base: 45, rel: 60, note: 'Letterhead, a seal, and eleven sentences of nothing.' },
  ],
  industry: [
    { relation: 'former manager', base: 68, rel: 76, note: 'Will describe shipping something. Committees read that as evidence you finish.' },
    { relation: 'staff engineer you worked under', base: 62, rel: 70, note: 'Technical, detailed, and written by someone who has never written one of these.' },
    { relation: 'undergraduate advisor', base: 55, rel: 52, note: 'The only academic who knows you. It has been six years.' },
    { relation: 'research scientist on your team', base: 71, rel: 62, note: 'Has a PhD and publications, and knows exactly what this letter is for.' },
    { relation: 'skip-level director', base: 48, rel: 66, note: 'Senior title, minimal contact. A letter about headcount.' },
    { relation: 'open-source collaborator', base: 57, rel: 44, note: 'Has read more of your code than anyone alive. May simply not reply.' },
    { relation: 'evening-course professor', base: 42, rel: 80, note: 'One semester, part-time, and they remember you, which is something.' },
  ],
  theory: [
    { relation: 'thesis advisor', base: 74, rel: 68, note: 'Proof-checked the whole thing twice. Writes short letters that land hard.' },
    { relation: 'olympiad coach', base: 60, rel: 74, note: 'Knows how you think under a clock. An unusual letter, in a good way.' },
    { relation: 'course professor (graduate seminar)', base: 64, rel: 70, note: 'You gave the best talk in the seminar and they said so at the time.' },
    { relation: 'co-author on the workshop paper', base: 69, rel: 60, note: 'Can speak to the result and to who actually had the idea.' },
    { relation: 'reading-group organiser', base: 51, rel: 72, note: 'Watched you present other people’s work well for a year.' },
    { relation: 'a famous professor whose class you took', base: 46, rel: 50, note: 'The name opens the envelope. The content is one paragraph and a grade.' },
    { relation: 'department chair', base: 44, rel: 62, note: 'Confirms enrolment on headed paper.' },
  ],
  changer: [
    { relation: 'former manager', base: 65, rel: 78, note: 'The strongest thing you have, and it is about a different career.' },
    { relation: 'evening-course professor', base: 56, rel: 74, note: 'Saw you do this while holding a job. That is the story of your file.' },
    { relation: 'a colleague with a PhD', base: 60, rel: 66, note: 'Understands the process and will write to it. Junior, though.' },
    { relation: 'the professor whose lab you volunteered in', base: 70, rel: 56, note: 'Unpaid, evenings, for eight months. The letter nobody expects you to have.' },
    { relation: 'undergraduate advisor (a decade ago)', base: 43, rel: 46, note: 'A long time ago, in another subject. May not remember which one.' },
    { relation: 'online-course instructor', base: 38, rel: 70, note: 'Genuinely enthusiastic. Carries very little weight and knows it.' },
    { relation: 'skip-level director', base: 47, rel: 68, note: 'Impressive title, four conversations.' },
  ],
};

export const LETTERS_EXPECTED = 3;
export const RECOMMENDER_NOTE = 'Most programs want three. You may ask more as insurance, but a weak fourth letter dilutes the file rather than padding it — the average is what gets read.';
