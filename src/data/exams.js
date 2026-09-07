// The three days.
//
// A prelim, a qual and a defense are not one dice roll each; they are structured hours, and the
// structure is most of what makes them frightening. So this file is a timetable. Each exam is a
// sequence of segments with real durations, and the duration is the drama: forty minutes of talking
// while four people decide what to ask you, then fifteen minutes of being asked it, then five
// minutes in a corridor with one chair while they decide, out loud, without you.
//
// Wall-clock is compressed — a forty-minute talk is twenty-eight seconds here — but the *shape* is
// exact, because the shape is what people remember. The proportions, the room emptying, the door
// closing, the one professor who says congratulations and is gone before you have your bag.

export const EXAM_TICK = 100;

// One segment kind each: `talk` is the deck and the clock, `qa` hands off to Room 214's question
// loop, `corridor` is the waiting, which is not a formality and never has been.
export const exams = {
  prelim: {
    id: 'prelim', label: 'Preliminary examination', room: 'Room 214', total: '1 hour',
    note: 'Four people, a projector that needs the other cable, and an hour blocked out. Yours is the third one this week.',
    segments: [
      { kind: 'talk', minutes: 40, seconds: 38, label: 'You present', sub: 'Forty minutes. Your deck is sixty-one slides.', deck: 'prelim' },
      { kind: 'qa', minutes: 15, seconds: null, label: 'Questions', sub: 'Fifteen minutes. One of them has decided to be the difficult one.', questions: 4, tone: 'badcop' },
      { kind: 'corridor', minutes: 5, seconds: 12, label: 'They confer', sub: 'You are asked to wait outside.' },
    ],
  },
  proposal: {
    id: 'proposal', label: 'Qualifying examination', room: 'Room 214', total: '2 hours',
    note: 'Committee only. No audience, no snacks, and nobody here is being polite for anyone else’s benefit.',
    segments: [
      { kind: 'talk', minutes: 60, seconds: 44, label: 'You present', sub: 'An hour, to four people who have all read it.', deck: 'proposal' },
      { kind: 'qa', minutes: 45, seconds: null, label: 'Questions', sub: 'Forty-five minutes. This is the part people mean when they say they did not sleep.', questions: 6, tone: 'harsh' },
      { kind: 'corridor', minutes: 15, seconds: 18, label: 'They confer', sub: 'Fifteen minutes. You can hear that they are talking and not what they are saying.' },
    ],
  },
  defense: {
    id: 'defense', label: 'Dissertation defense', room: 'Room 214', total: '2 hours 30',
    note: 'Public. Your labmates are here, two first-years are here because they were told to come, and somebody brought a cake that will be eaten by people who did not attend.',
    segments: [
      { kind: 'intro', minutes: 15, seconds: 8, label: 'You are introduced', sub: 'Your advisor introduces you. It takes eleven minutes and four of them are about their own trajectory. You stand at the side holding a clicker.' },
      { kind: 'talk', minutes: 60, seconds: 44, label: 'You present', sub: 'An hour, doors open. Six years, fifty-two slides, and the first four are the ones you rewrote last night.', deck: 'defense', audience: 'open' },
      { kind: 'qa', minutes: 15, seconds: null, label: 'Questions from the floor', sub: 'Fifteen minutes, in public, and the committee is being visibly kind to you in front of an audience.', questions: 3, tone: 'nice', audience: 'open' },
      { kind: 'clear', minutes: 15, seconds: 8, label: 'The room is cleared', sub: 'Everyone who is not on the committee is asked to leave. They file out. Your labmate mouths something at you from the door.' },
      { kind: 'qa', minutes: 30, seconds: null, label: 'The closed questions', sub: 'Thirty minutes, doors shut. This is the actual examination and it starts the second the last visitor is gone.', questions: 6, tone: 'harsh' },
      { kind: 'corridor', minutes: 15, seconds: 18, label: 'They confer', sub: 'Now you go outside.' },
    ],
  },
};

// ── The deck ──────────────────────────────────────────────────────────────────────────────────
// `core` slides are the talk. `filler` is what you added because sixty-one slides looks like more
// work than twenty-two. Lingering on a core slide is what a good talk is; lingering on filler is
// how people run out of time before the results, which happens in roughly half of all talks given
// by anybody at any level.
export const decks = {
  prelim: [
    { w: 'core', title: 'The problem', line: 'One slide, one sentence, no citations. Everything else in the hour depends on this landing.' },
    { w: 'filler', title: 'Outline', line: 'An outline slide. Nobody in the history of talks has been helped by an outline slide.' },
    { w: 'filler', title: 'Background (1/4)', line: 'Background, part one of four. You made four of these at two in the morning and they are all the same slide.' },
    { w: 'core', title: 'Why the obvious thing fails', line: 'The load-bearing slide. If they believe this, the next forty minutes are a conversation instead of an examination.' },
    { w: 'filler', title: 'Related work (a wall of citations)', line: 'Thirty-one citations at nine point. The outsider takes their glasses off, which is not a good sign.' },
    { w: 'core', title: 'The method', line: 'Your actual idea, on one slide, with the part you are least sure about drawn slightly smaller.' },
    { w: 'trap', title: 'Table 2', line: 'Table 2. The baseline is missing from Table 2 and the methodologist found that out four minutes into your talk.' },
    { w: 'core', title: 'What the numbers say', line: 'The result. You have looked at this plot so many times that you cannot tell any more whether it is convincing.' },
    { w: 'filler', title: 'Implementation details', line: 'Framework versions and a hardware list. This slide is for you and it is not for them.' },
    { w: 'core', title: 'The next two years', line: 'Three things in order, the risky one marked risky. This is the slide the committee is actually grading.' },
  ],
  proposal: [
    { w: 'core', title: 'The thesis statement', line: 'One sentence that has to be true, falsifiable, and worth six years. You have rewritten it eleven times and this is version seven.' },
    { w: 'filler', title: 'Acknowledgements (already)', line: 'You put the acknowledgements at slide three by accident and you are not going back for them now.' },
    { w: 'core', title: 'Chapter one, already done', line: 'The published one. Showing something finished this early is the single most effective move available and almost nobody makes it.' },
    { w: 'filler', title: 'A taxonomy', line: 'A taxonomy of the field with four quadrants, and your work in the top right, where everybody’s work is.' },
    { w: 'core', title: 'Chapter two, in flight', line: 'Half a result and an honest error bar. The honest error bar is why they will believe chapter three.' },
    { w: 'trap', title: 'Chapter three, the risky one', line: 'The chapter that does not exist yet. You have a page of it and a great deal of confidence, and they can tell which is which.' },
    { w: 'core', title: 'What would falsify this', line: 'You put up the conditions under which your own thesis is wrong. The chair stops writing and looks at you properly for the first time.' },
    { w: 'filler', title: 'Broader impacts', line: 'The broader impacts slide, required by a form, read by nobody, present in every deck in the building.' },
    { w: 'core', title: 'The timeline', line: 'Dates and dependencies, with the one that slips first named out loud. Naming it is what makes the rest credible.' },
    { w: 'filler', title: 'Backup slides (31)', line: 'Thirty-one backup slides. You will use one of them and it will feel like the best moment of your life.' },
  ],
  defense: [
    { w: 'core', title: 'Six years, one sentence', line: 'The whole dissertation in a sentence, to a room that includes two first-years and your mother on a video call.' },
    { w: 'filler', title: 'A photograph of the lab', line: 'A photo of the lab in 2029 with four people in it who have all left. You put it in last night and you are not sure why.' },
    { w: 'core', title: 'Chapter two: the negative result', line: 'The thing that did not work, presented first and on purpose, which is a senior move and reads as one.' },
    { w: 'filler', title: 'Methodology overview', line: 'A flowchart with nine boxes. It was accurate in the second year.' },
    { w: 'core', title: 'Chapter four: the derivation', line: 'Page ninety-one, at the board, from memory. This is the part you have known longest and it is where your hands stop shaking.' },
    { w: 'trap', title: 'The figure you never fixed', line: 'Figure 6. The axis label is still wrong. It has been wrong through two conferences and a journal and it is wrong on the projector right now.' },
    { w: 'core', title: 'What is actually new here', line: 'The claim, unhedged, with your name attached to it. Say it once, plainly, and then stop talking for a second.' },
    { w: 'core', title: 'What is still open', line: 'The limitations, including the real one. Committees pass people who can find the real one.' },
    { w: 'filler', title: 'Publication list', line: 'Your publications, in a font size that indicates how you feel about the number of them.' },
    { w: 'core', title: 'Thank you', line: 'The last slide. You have been talking for an hour and you would keep going, because the moment it ends they get to start.' },
  ],
};

export const talkMoves = {
  next: { id: 'next', label: 'Next slide', hint: 'Keep moving. Time is the thing you cannot get back.' },
  hold: { id: 'hold', label: 'Take your time here', hint: 'Worth it on the slides that carry the talk. Expensive on the ones that do not.' },
};

// What happens when you dwell, by slide kind. `hold` on filler is the commonest way a talk dies.
export const talkLines = {
  holdCore: 'You slow down, and the room slows down with you. Somebody stops taking notes to listen, which is the highest compliment available in this building.',
  holdFiller: 'You spend ninety seconds on a slide that exists to make the deck longer. The chair looks at the clock, not unkindly.',
  holdTrap: 'You linger, and lingering is how they notice. Two people write at the same time.',
  skipCore: 'You skip past the slide the whole talk rests on. It goes by in four seconds and it needed forty.',
  skipFiller: 'Gone in three seconds. Nobody will ever know it was there, which is the correct fate for it.',
  skipTrap: 'You move past it quickly. Moving past it quickly is itself a piece of information and at least one person receives it.',
  cut: 'The chair says “let us leave time for questions,” which is the sentence that ends every talk that ran long, and yours ran long.',
  clean: 'You finish with two minutes in hand. Nobody has ever done this and the chair looks briefly disoriented.',
  rushed: 'You finish nine minutes early, having said everything you had. The silence afterwards is longer than you would like.',
};

// The one who has decided to be difficult. Every committee has one, it is sometimes assigned, and
// it is occasionally the kindest thing anybody in the room does for you.
export const badCop = {
  intro: 'One of them has decided to be the difficult one today. It is a role, it is allocated in advance, and knowing that does not help at all while it is happening.',
  interrupts: [
    '“Sorry — before you move on. Go back two slides.”',
    '“I am going to stop you there. Define ‘efficient.’ You have used it four times.”',
    '“Can you put the previous slide back up? No, the one before that.”',
    '“Is that a result or is that a hope?”',
    '“Whose number is that?”',
  ],
  handled: 'You answer it, at the board, and go back to where you were. It costs you two minutes of the talk and it buys you the rest of the room.',
  ignored: 'You say “I will come to that,” and keep going. They write something down. You do not come to that.',
  afterward: 'Afterwards, in the corridor, they are perfectly warm to you and ask about your funding. It is genuinely not personal. It is genuinely also what just happened.',
};

// The corridor. One chair, because the corridor has been used this way before.
export const corridor = {
  intro: 'You are asked to step outside. The door closes. It is a heavy door and it closes properly.',
  things: [
    { id: 'phone', label: 'Look at your phone', line: 'Four minutes of a feed you will not remember. Somebody you went to undergrad with has bought a house.' },
    { id: 'slide', label: 'Reread slide 12', line: 'You reread slide 12 on your laptop, in the corridor, after the talk has ended, which cannot possibly help and which you do anyway.' },
    { id: 'ceiling', label: 'Count the ceiling tiles', line: 'Forty-one, and one of them is water-stained in the shape of something you decide not to think about.' },
    { id: 'text', label: 'Text the person who has been waiting all day', line: 'You type “done, waiting outside” and delete it and type it again and send it. They reply instantly, which means they have had the phone in their hand.' },
    { id: 'poster', label: 'Look at the poster you have walked past four hundred times', line: 'A 2018 poster about protein folding. You read it properly for the first time. It is quite good.' },
    { id: 'door', label: 'Listen at the door', line: 'You hear the cadence of speech and none of the words. Somebody laughs. You will spend a while deciding what that laugh was.' },
    { id: 'nothing', label: 'Sit in the one chair and do nothing', line: 'You sit in the chair that is in the corridor for this. You do not look at anything. It is the longest you have been alone with yourself in about two years.' },
  ],
  ready: 'The door opens. It is the chair, and their face is doing nothing at all, which is a professional skill and is currently being used on you.',
};

// ── After ─────────────────────────────────────────────────────────────────────────────────────
// Passing a prelim or a qual: someone congratulates you and is gone before you have your bag.
export const verdicts = {
  pass: {
    prelim: 'You are called back in. The chair says the word “pass” inside a longer sentence, and you miss the rest of the sentence.',
    proposal: 'You are called back in. “Congratulations, candidate.” The word means someone who has not finished, with a title.',
    defense: 'You are called back in. Everyone is standing. Your advisor is smiling in a way you have not seen before and will not see again.',
  },
  quickCongrats: [
    'One of them shakes your hand, says “congratulations, well done,” and is out of the door before you have picked your laptop up. They have a two o’clock.',
    'The outsider says “nice work, really” with what is clearly sincerity, and leaves, and you will not see them again for two years and then only at a poster session.',
    'The methodologist says congratulations, then adds one sentence about Table 2 that you will think about for eleven months, then leaves.',
  ],
  advisorLine: '“Well — it is your PhD, not mine.” They have said this to you for six years, in every register it has, and this is the first time it has been a compliment.',
  // The defense photograph. The ritual is that everybody stays for it, and everybody has done it
  // before, and one person in the picture has not.
  photo: {
    line: 'Somebody produces a phone. The committee arranges itself around you without being asked, in an order they clearly know, and holds a smile that four of them have held at approximately forty of these.',
    faces: 'Four practised smiles and one that is not practised at all. You will look at this photo in eight years and be able to name exactly what your face is doing.',
    after: 'Your advisor says “Doctor” out loud, to you, in front of everyone, and it is the only time it will ever be the first time.',
    unfinished: 'On the walk back you remember, precisely and unavoidably, that Chapter 4 is not finished, that the revisions are due, and that the library has a formatting checklist with forty items on it.',
  },
};

export const examNote = 'The hour is the exam. What you are graded on is what you do with the parts of it that are not questions.';
