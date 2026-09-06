// Three job boards, because the field cannot agree on one. Each is a different website with a
// different idea of what a person is, and you will end up with an account on all of them.

export const portals = {
  linkedout: {
    id: 'linkedout', name: 'LinkedOut', tagline: 'The professional network, and the word professional is load-bearing.',
    tracks: ['product_eng', 'industry_research', 'quant', 'founder'],
    opens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],   // industry hires all year and means it about half the time
    minMonth: 30, needsLetters: false,
    chrome: 'A feed of people you went to undergrad with announcing that they are humbled and excited.',
    empty: 'Nothing new that fits. Someone you met once has posted a carousel about resilience.',
    applyNote: 'Four clicks, one of which uploads a résumé it then asks you to retype into nine boxes.',
  },
  crab: {
    id: 'crab', name: 'CRAB — Computing Research Announcement Board', tagline: 'One page, no styling, and the entire academic job market.',
    tracks: ['tenure_track', 'teaching_faculty', 'abroad'],
    opens: [9, 10, 11, 12],                            // the faculty season, and it is short
    minMonth: 44, needsLetters: true,
    chrome: 'HTML from 1998, sorted by posting date, and every faculty job in the field is on it.',
    empty: 'The season has not opened. In September the whole thing appears at once and then it is October.',
    applyNote: 'A cover letter, research statement, teaching statement, diversity statement, and four letters. Per application.',
  },
  pipeline: {
    id: 'pipeline', name: 'The Pipeline', tagline: 'University HR software. It will ask for your high school.',
    tracks: ['postdoc', 'soft_money', 'national_lab', 'policy'],
    opens: [1, 2, 3, 4, 9, 10, 11, 12],
    minMonth: 40, needsLetters: true,
    chrome: 'A portal per institution, each one a different vintage of the same underlying product.',
    empty: 'Nothing posted. Postdoc hiring happens when a grant lands, which is not a season.',
    applyNote: 'Create an account. Confirm the account. The account already exists. Reset the password.',
  },
};

export const portalFor = track => Object.values(portals).find(p => p.tracks.includes(track)) || null;

// How much you put into one application, and what it costs.
export const efforts = {
  easy: { id: 'easy', label: 'One-click apply', energy: 1, delta: -.05, hint: 'The button exists. So does the pile it lands in.' },
  standard: { id: 'standard', label: 'A normal application', energy: 4, delta: 0, hint: 'The letter names the department correctly.' },
  tailored: { id: 'tailored', label: 'Tailored, properly', energy: 9, delta: .05, hint: 'You read three of their papers and it shows, to the one person who checks.' },
};

// The work-authorisation question. It is two checkboxes and it decides more than the CV does.
export const AUTH_QUESTION = 'Are you legally authorised to work in the United States?';
export const SPONSOR_QUESTION = 'Will you now or in the future require sponsorship for employment visa status?';
export const SPONSOR_NOTE = 'There is no third box. There is no field for “yes, but the university does this constantly and it is four forms.”';

// What comes back, and how fast. The fastest rejection you will ever receive is the honest one.
export const rejections = {
  sponsorship: [
    'Dear Applicant, thank you for your interest. Unfortunately we are unable to consider candidates who require visa sponsorship for this position. We wish you every success. — sent forty-one minutes after you pressed submit, by something that did not read the rest of it.',
    'Thank you for applying. After reviewing your application we have decided not to move forward. This decision was based on work authorisation requirements for the role. Please do not reply to this message.',
  ],
  form: [
    'Thank you for your interest in this position. We received a large number of qualified applicants and have decided to move forward with other candidates.',
    'We have filled this position. The posting will remain up for six more weeks, for reasons internal to the company.',
  ],
  screen: [
    'Thank you for taking the time to speak with us. We have decided to move forward with candidates whose experience more closely matches the role.',
    'The committee has completed its first review and your application is no longer under consideration. We received over three hundred applications for one position, which we say as though it is a compliment.',
  ],
  onsite: [
    'It was a pleasure to host you. The search was extraordinarily strong and the committee has made an offer to another candidate. Several members asked me to say that they hope our paths cross again, and they meant it, which somehow makes it worse.',
    'Thank you for visiting. We have made an offer elsewhere. I want to be clear that this was not a close call in the way that phrase is usually used — it was genuinely close, and that is not a consolation, and I am telling you anyway.',
  ],
  internal: [
    'The search has been closed without an appointment. — Everyone on the shortlist knew by week two that there was an internal candidate. Nobody could say so, including the people who wished they could.',
  ],
  cancelled: [
    'We regret to inform you that the position has been cancelled due to changes in departmental funding. We appreciate your interest and hope you will consider us in future cycles. — There will not be a future cycle for this line.',
  ],
  ghost: null,   // there is no mail. That is the entire mechanic.
};

// Interview stages, in the voice of the people running them.
export const stageLines = {
  screen: [
    'A thirty-minute video call. Two people, one of whom has clearly not read the file and one of whom has read all of it.',
    'A phone screen scheduled for 8:00 a.m. their time, which is 5:00 a.m. yours, which nobody mentions.',
  ],
  onsite: [
    'Two days. A job talk, eleven half-hour meetings, a dinner where the wine is a test, and a chalk talk where they interrupt on purpose.',
    'A campus visit. You will explain your work to nine people in eleven hours and the ninth will ask the question the first one asked.',
  ],
  offer: [
    'An offer, with a deadline that is shorter than the time it took them to reply to your last email.',
  ],
};

// When the advisor finds out you have been applying without telling them.
export const tells = {
  recruiter: 'A recruiter cc’d your advisor on a scheduling email “to make it easier for everyone.”',
  seminar: 'Someone at another department mentioned your job talk to your advisor at a seminar, warmly, as a compliment.',
  labmate: 'A labmate saw the tab. They did not mean anything by it and they said something anyway.',
  referee: 'A search chair emailed your advisor for a reference you had not told them they were giving.',
  calendar: 'Three cancelled meetings in one month, all on Thursdays, all with the same non-explanation.',
  slip: 'You said “when I move” instead of “if I move,” in a corridor, and then watched them hear it.',
};

export const reactions = {
  ally: '“Why didn’t you tell me? I would have made calls.” They are hurt, briefly, and then they are on the phone. Within a week two people you did not apply to have emailed you.',
  professional: '“Right. Well. Send me the list so I know what I am writing for.” It is not warm. It is not a problem either, and by the following month it is simply a fact about the year.',
  chill: '“I see.” That is the whole response. The next four weeks are correct and cold and every email is signed with their full name.',
  punitive: '“I had to hear it from someone else.” The one-on-ones become fortnightly. Your draft comes back in nineteen days. Nothing is said and everything is different, and the letter — which you will never read — is written in this mood.',
};

export const DISCLOSE_LINE = 'You tell them you are on the market. It costs a bad ten minutes and buys back something you were spending every week without noticing.';
