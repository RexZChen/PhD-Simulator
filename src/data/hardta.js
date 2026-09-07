// The year the money went.
//
// Not the ordinary teaching assistantship, which is a semester of sections and a supplement. This
// is what happens when the renewal does not come through: the RA line disappears and the department
// keeps you whole by teaching you out of a different budget. The package is intact. The tuition
// waiver is intact. The stipend arrives on the same day of the month.
//
// You are also now teaching two sections, holding office hours, and grading for two hundred and
// forty people, for two semesters, and your research does approximately nothing for a year, and
// nobody involved has done anything wrong or will apologise, because on paper you are fully funded.
//
// Rare on purpose. It is the thing that happens to somebody in every cohort and almost never to you.

export const HARD_TA = {
  semesters: 2,           // an academic year, extendable if the money does not come back
  energy: -9,             // per month, on top of everything else
  progress: -6,           // per month; the research does not stop so much as it stalls
  stipendKeep: 1,         // the whole point: the money is the same
};

export const raLostText = [
  '{advisor} closes the door, which they do not usually do.\n\n“The renewal did not come through. I have appealed and I will not win. I can cover you until the end of May and after that the department will pick you up as a TA.”\n\nA pause. “You will not lose any money. I want to be clear about that first, because everybody hears the other thing first.”',
  'It is in the budget spreadsheet before it is in a conversation. Your name moves from one column to another, and the column it moves to is the one with the course numbers in it, and the total at the bottom does not change.',
];

export const raBackText = [
  'An email in June. The new grant landed. You are back on an RA line in the autumn.\n\nYou read it twice and feel almost nothing, which surprises you, and then about four hours later you feel all of it at once in a supermarket.',
  '{advisor}, in a meeting, at the end, as an afterthought: “Oh — you are back on the grant from September.” Then they carry on about the figures.\n\nA year of your life closes with a subordinate clause.',
];

export const raExtendText = [
  'The renewal did not land this time either. The department will keep you on teaching for another year.\n\nNobody is doing anything wrong. That is the part that is hard to hold.',
];

export const hardTaNote = 'Your funding package is intact and your research year is gone. Both of those sentences are true, and only the first one appears in any document.';
