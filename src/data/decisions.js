// The update on your application.
//
// A real decision does not arrive as an email that tells you the answer. It arrives as an email
// that tells you there is an answer, in a subject line drained of every trace of what it is, with a
// link to a portal you have to log into. The gap between opening the email and reading the word is
// where the whole feeling lives, and the game was giving it away in the subject line and resolving
// all twenty-two at once.
//
// So: neutral notification, one at a time, and the letter is on a page that looks like the ugly
// applicant portal it is.

export const UPDATE_SUBJECT = 'There is an update on your application';
export const UPDATE_BODY = 'Dear applicant,\n\nThe status of your application to {school} has been updated. Please sign in to the applicant portal to view your update.\n\nThis is an automated message. Please do not reply to this address.\n\n— Graduate Admissions, {school}';

// What the portal says while you are looking at the button.
export const PORTAL_WAIT = [
  'The portal has one button and the button says View Update.',
  'The page took four seconds to load and you watched all four of them.',
  'You have logged into this portal eleven times this week. This is the first time there has been anything in it.',
  'The session timed out while you were reading the email. You logged in again.',
];

// The reveal, by outcome. `head` is the line at the top of the letter — the one your eye finds
// before you have decided to read anything.
export const letters = {
  accept: {
    head: 'Congratulations!',
    body: 'It is my pleasure to offer you admission to the Ph.D. program in Computer Science at {school} for the {year} academic year.\n\nYour admission includes a {funding} with an annual stipend of ${stipend}, and a tuition waiver, contingent on satisfactory academic progress.\n\nWe hope you will join us. Please respond by April 15.',
    signed: '{poi} · Graduate Admissions Committee',
    after: [
      'You read it four times. The fourth time you read the stipend figure and did the rent arithmetic, and that is the moment it became real rather than good.',
      'You sit still for a second. Then you tell one person, and the sentence comes out wrong, and they understand anyway.',
      'Somewhere in this sentence there is a version of the next six years, and you cannot see any of it from here, which is the only mercy in the whole document.',
    ],
  },
  reject: {
    head: 'Regarding your application',
    body: 'Thank you for your interest in the Ph.D. program in Computer Science at {school}.\n\nThe admissions committee has completed its review. We received {volume} applications for approximately {seats} positions this year, and were unable to offer you admission.\n\nWe wish you every success in your academic career.',
    signed: 'Graduate Admissions, {school}',
    after: [
      'Four sentences. Somebody wrote them once, in about 2016, and they have been sent several thousand times since, and the third one is doing all the work.',
      'The number in the second paragraph is there so that the decision reads as arithmetic rather than as a judgement of you. It is arithmetic. It is also a judgement of you.',
      'You close the tab. Then you open it again, twenty minutes later, to check that it says what it said.',
      'You look for the sentence that explains it. There is no sentence that explains it. There never is; that is a policy, and the policy is correct, and it does not help.',
    ],
  },
  waitlist: {
    head: 'Your application status',
    body: 'Thank you for your application to the Ph.D. program in Computer Science at {school}.\n\nWe are unable to make you an offer of admission at this time. However, your application remains under active consideration, and we have placed you on our waiting list.\n\nWe expect to have more information after April 15. No action is required on your part.',
    signed: 'Graduate Admissions, {school}',
    after: [
      '“No action is required on your part” is the cruellest sentence in academic correspondence, because it is true and because it means you will spend six weeks doing nothing about something.',
      'A waitlist is a yes that is waiting to find out whether somebody else says no. There is no version of this where you get to influence it.',
      'You are, right now, a contingency in a spreadsheet in a room you have never seen. Somebody in that room likes your file. It may not matter.',
    ],
  },
  // The waitlist, resolved in April.
  waitlistYes: {
    head: 'An update from the waiting list',
    body: 'A position has become available in our incoming cohort, and I am pleased to offer you admission to the Ph.D. program at {school}.\n\nBecause this offer comes late in the cycle, we would appreciate a response within one week. Funding is available in the form of a {funding}.',
    signed: '{poi} · Graduate Admissions Committee',
    after: [
      'Somebody said no, three weeks after the deadline, and the chain moved, and you are the end of the chain. You will never know who they were and you will think about them occasionally for a decade.',
      'The word “available” is doing a great deal of quiet work in that first sentence and you notice it and you do not care.',
    ],
  },
  waitlistNo: {
    head: 'Regarding your place on the waiting list',
    body: 'Thank you for your patience during the admissions cycle at {school}.\n\nOur incoming cohort is now full, and we are unable to make you an offer of admission. We are sorry that we could not send you better news, and we wish you well.',
    signed: 'Graduate Admissions, {school}',
    after: [
      'Six weeks of holding a place in a queue that resolved into a sentence. It is not worse than a rejection in March. It is longer.',
      'This is the one that arrives while you are doing something else, and you read it standing up, and then you carry on doing the something else.',
    ],
  },
};

// The number in the second paragraph of a rejection, which exists to make it arithmetic.
export const volumeFor = school => Math.round(180 + (school.prestige - 55) * 32);
export const seatsFor = school => Math.max(3, Math.round(4 + (100 - school.prestige) / 9));

export const acceptedNote = 'You accept. The form takes ninety seconds and asks for your legal name twice, and at the end of it there is a page that says thank you and nothing else, and you sit and look at it.';
export const declinedNote = 'You decline. There is a text box marked “Reason (optional)” and you type something honest into it and then delete it and leave it empty, the way everybody does.';
export const declinedMail = 'Thank you for letting us know. We wish you every success, and we hope our paths cross at a conference.';
export const portalNote = 'Every one of these is a different portal with a different password rule, and you have written all of them on the same piece of paper.';

// ── Saying yes ────────────────────────────────────────────────────────────────────────────────
// The reply form. Ninety seconds, your legal name twice, and a page at the end that says thank you
// and nothing else — and you sit and look at it, because that page is the last moment before six
// years start and some part of you knows it.
export const replyForm = {
  title: 'Reply to Offer of Admission',
  note: 'This decision is binding under the April 15 Resolution. Please respond by 11:59pm local time.',
  fields: [
    ['Applicant', '{name}'],
    ['Program', 'Ph.D. Computer Science'],
    ['Term of entry', 'Fall 2028'],
    ['Advisor of record', '{poi}'],
    ['Support offered', '{funding} · ${stipend}/mo'],
  ],
  accept: 'I accept this offer of admission',
  decline: 'I decline this offer of admission',
  reason: 'Reason (optional)',
  reasonPlaceholder: 'Everybody leaves this empty.',
  submit: 'Submit reply',
};

export const acceptedPage = {
  head: 'Thank you.',
  body: 'Your reply has been recorded. You will receive further correspondence from the Graduate School regarding registration, orientation, and required immunisation records.',
  after: 'That is the whole page. There is no button. You sit and look at it for a while, because on the other side of it are six years, and this is the last minute in which they are still only an idea.',
};
