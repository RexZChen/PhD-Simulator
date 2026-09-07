// The thing on the calendar that was not on the calendar.
//
// Every other event in this game happens around your turn. This one happens *to* it: it arrives
// after you have chosen what the month goes to, and it takes a piece of that choice away. That is
// the entire mechanic and it is the honest one — an unscheduled ninety minutes does not cost you
// ninety minutes, it costs you the afternoon either side of it and the thread you were holding.
//
// It lands worst when the calendar is worst, on purpose: a crunch week, a rest month, a day you had
// finally cleared. Declining is always available and is never free.

export const SUMMONS = {
  bite: .42,          // fraction of the turn's output the meeting takes
  biteHard: .62,      // if it lands during a crunch
};

export const summonsKinds = {
  advisor_now: {
    id: 'advisor_now', from: 'advisor', weight: 3,
    title: '“Are you around? Now would be good.”',
    text: [
      'Sent at 9:14. It is 9:16. There is no agenda and no indication of length, and the two things it could be about are separated by roughly a year of your life.',
      '“Can you come by?” Three words, no punctuation, from somebody who normally writes in paragraphs. You are standing up before you have decided to.',
      'They put a meeting in your calendar for eleven o\'clock this morning. The title of the meeting is a single word and the word is "chat."',
    ],
    good: 'It is forty minutes and about half of it matters. One sentence in the middle reorganises what you were going to do this month, which is worth the morning and does not feel like it until Thursday.',
    bad: 'It is ninety minutes. It is about a grant report you are not on, a figure you did not make, and a conference you are not attending. You take one note and it is a date.',
  },
  advisor_panic: {
    id: 'advisor_panic', from: 'advisor', weight: 2, crunchOnly: true,
    title: 'They have had an idea about your paper',
    text: [
      'Four days before the deadline. They have had an idea. The idea is good, which is the problem, and it is two days of work, which is the other problem.',
      '“One more experiment.” The deadline is Friday. It is Tuesday. They are not wrong that it would strengthen the paper.',
    ],
    good: 'You do it and it does strengthen the paper, and you find out in March that a reviewer specifically mentioned it, and you never tell anybody how close that was.',
    bad: 'Two days, a worse night\'s sleep, and a result that goes in the appendix. The paper is one per cent better and you are eleven per cent worse.',
  },
  collab_deadline: {
    id: 'collab_deadline', from: 'contact', weight: 2, needsContact: true,
    title: '{who} needs an hour, today',
    text: [
      'Their deadline, not yours. The message says "so sorry — an hour, max," and it is never an hour and they are genuinely sorry.',
      '{who} calls. They do not usually call. Something in their submission has come apart and you are the person who knows why.',
    ],
    good: 'Two hours, and you fix it, and they say so to somebody who matters. This is what the relationship was for and it is being spent correctly.',
    bad: 'Three hours on somebody else\'s figure. It is fine. It is also three hours, on a Tuesday, in a week you had planned carefully.',
  },
  dept_admin: {
    id: 'dept_admin', from: 'department', weight: 2,
    title: 'Mandatory, and it is today',
    text: [
      'An email from an office you have never interacted with, marked mandatory, scheduled for this afternoon, about a system that is being replaced by a system.',
      'Safety training. You do not work in a lab with anything in it. It is ninety minutes and there is a quiz and the quiz is about a chemical you will never meet.',
    ],
    good: 'Ninety minutes, and one genuinely useful fact about who to email when the payroll system fails, which you will use twice.',
    bad: 'Ninety minutes. There is a certificate. The certificate expires in two years and you will do this again.',
  },
  labmate_crisis: {
    id: 'labmate_crisis', from: 'labmate', weight: 2,
    title: '{labmateFirst} is not okay',
    text: [
      'They ask if you have a minute in a tone that means it is not a minute. You have a deadline. You have always got a deadline.',
      '{labmateFirst} is sitting in the stairwell. You were on your way to somewhere and now you are not.',
    ],
    good: 'An hour and a half in a stairwell. It is the most important thing you do that week and it will appear on no record of any kind.',
    bad: 'You listen and it helps and you carry some of it home, and the thing you were going to do today does not happen and does not happen tomorrow either.',
  },
};

export const summonsMoves = {
  go: {
    id: 'go', label: 'Go',
    hint: 'It takes what it takes',
  },
  late: {
    id: 'late', label: 'Go, and say you have four days to a deadline',
    hint: 'Sometimes it shortens the meeting. Sometimes it is heard as a complaint.',
  },
  decline: {
    id: 'decline', label: 'Say you cannot today',
    hint: 'Always available. Never free.',
  },
};

export const summonsDeclined = {
  advisor: '“No problem — tomorrow then.” It is not tomorrow. It is nine days, and the thing it was about has moved on without you in it.',
  contact: 'They say of course, immediately, and solve it themselves at one in the morning. Nothing is said about it and something is slightly different afterwards.',
  department: 'You do not go. Four weeks later a different email notes that your record is incomplete, and there is a make-up session, and it is three hours.',
  labmate: 'You say you have a deadline, which is true. They say of course, which is also true. You will think about the stairwell in about a fortnight.',
};

export const summonsNote = 'An unscheduled ninety minutes does not cost you ninety minutes. It costs the afternoon either side of it and the thread you were holding.';
