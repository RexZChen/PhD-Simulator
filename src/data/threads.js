// Conversation templates for the application phase: emails to prospective advisors,
// student intros, interviews, and visit-day questions. `outcomes` are weighted; `reply: null` is silence.
export const emailOpeners = [
  { id: 'generic', label: 'Express interest (the template everyone sends)', text: 'Dear Professor {last}, I am a prospective PhD applicant deeply interested in your lab’s work on {topic}. I would be grateful for the opportunity to discuss potential openings.', cost: 3,
    outcomes: [{ w: 6, reply: 'Thank you for your interest in our lab. Please apply through the official portal. — Sent from my phone', effect: {} }, { w: 2, reply: 'Thanks for reaching out. I am recruiting this cycle; mention me in your statement so the committee routes it to me.', effect: { fit: .05, openings: true } }, { w: 2, reply: null }] },
  { id: 'specific', label: 'Ask a specific question about their recent paper', text: 'Dear Professor {last}, I read your recent paper on {topic} and wondered whether the approach still holds when the assumptions in Section 4 are relaxed. I have a small experiment suggesting it might not.', cost: 5, check: { skill: 'research', difficulty: 55 },
    success: [{ w: 5, reply: 'Good question. We tried that; it fails for a reason I will not put in an email. Happy to do a 15-minute call if you like.', effect: { fit: .1, hint: true, followUp: 'call' } }, { w: 4, reply: 'Interesting — that is close to what a student here is looking at. Please apply; I will look for your file.', effect: { fit: .07 } }, { w: 1, reply: null }],
    failure: [{ w: 5, reply: 'Thanks for reaching out. Please apply through the portal.', effect: {} }, { w: 3, reply: 'Section 4 says the opposite, actually. Good luck with your applications.', effect: { fit: -.02 } }, { w: 2, reply: null }] },
  { id: 'student', label: 'Ask to be introduced to a current student', text: 'Dear Professor {last}, would it be possible to speak briefly with a current student in your lab about their experience?', cost: 3,
    outcomes: [{ w: 5, reply: 'Sure — cc’ing {student}, who has kindly agreed. (They did not agree; they will reply anyway.)', effect: { student: true } }, { w: 4, reply: 'Our students are very busy this term. Please apply through the portal; visit days include student panels.', effect: {} }, { w: 1, reply: null }] },
  { id: 'openings', label: 'Ask about openings and funding', text: 'Dear Professor {last}, are you accepting new PhD students this cycle, and is funding available for incoming students?', cost: 2,
    outcomes: [{ w: 6, reply: '{openingsLine} Funding is {fundingWord}.', effect: { openings: true } }, { w: 3, reply: 'It depends on grants I will hear about in February. Apply and we will see.', effect: {} }, { w: 1, reply: null }] },
];
export const emailFollowUps = {
  call: [
    { id: 'call_yes', label: 'Yes — schedule the call', cost: 4, reply: 'The call is fifteen minutes and starts eight minutes late. You learn that {hint}. At the end: “Apply. I’ll be looking for your name.”', effect: { fit: .05, hint: true } },
    { id: 'call_no', label: 'Apply first, follow up later', cost: 0, reply: 'They reply “Sounds good.” Two words, which for faculty is a paragraph.', effect: { fit: .01 } },
  ],
};
export const studentOpeners = [
  { id: 'lab', label: 'What is the lab actually like?', cost: 2, reveal: 'caring' },
  { id: 'meet', label: 'How often do you meet with them?', cost: 2, reveal: 'availability' },
  { id: 'last', label: 'What happened to the last student who left?', cost: 3, reveal: 'toxicity' },
  { id: 'plan', label: 'Do projects have a plan, or a vibe?', cost: 2, reveal: 'management' },
];
export const studentFlavor = ['Honestly? ', 'Off the record: ', 'Between us — ', 'Depends on the week, but ', 'Everyone will tell you the same thing: '];

export const interviewQuestions = [
  { id: 'experience', them: 'Tell me about a research project you worked on. What went wrong?', options: [
    { id: 'honest', label: 'Walk through it honestly, including the part that failed', check: { skill: 'communication', difficulty: 50 }, good: .08, bad: -.03, goodReply: 'They nod at the failure more than at the success. “That is the part that matters.”', badReply: 'You over-explain the failure until it sounds like the whole project. They check the time.' },
    { id: 'pitch', label: 'Pitch the best version of it', check: { stat: 'confidence', difficulty: 55 }, good: .1, bad: -.06, goodReply: 'The pitch lands. They ask a follow-up you have an answer for.', badReply: 'They ask what the baseline was. It was not a baseline.' },
    { id: 'ask', label: 'Ask what they would want a first-year to work on', check: null, good: .04, goodReply: 'They talk for six minutes. You learn the project you would get, and that they like to talk.' } ] },
  { id: 'compute', them: 'What would you do with unlimited compute?', options: [
    { id: 'sleep', label: '“Sleep. Then a very large ablation.”', check: { skill: 'communication', difficulty: 45 }, good: .06, bad: -.04, goodReply: 'They laugh. It is a real laugh. You will remember it during the rejection.', badReply: 'Silence. Then: “Right.” A joke that did not survive the video compression.' },
    { id: 'scale', label: 'Scale the thing that works', check: { skill: 'research', difficulty: 55 }, good: .07, bad: -.04, goodReply: '“Which thing?” You say which thing. They write it down.', badReply: '“Which thing?” You do not have a thing.' },
    { id: 'eval', label: 'Fix the evaluation first; the rest is noise', check: null, good: .05, goodReply: '“Good. Nobody says that.” You have said the thing nobody says.' } ] },
  { id: 'questions', them: 'Do you have any questions for me?', options: [
    { id: 'style', label: 'How do you work with your students?', check: null, good: .03, reveal: 'management', goodReply: 'They answer at length. You learn that {hint}.' },
    { id: 'time', label: 'How long do students in your lab take to graduate?', check: null, good: .02, reveal: 'toxicity', goodReply: 'A pause, then a number, then a “but.” You learn that {hint}.' },
    { id: 'none', label: 'No questions, thank you', check: null, good: -.03, goodReply: '“Great.” The interview ends four minutes early. This is not a compliment.' } ] },
];

export const visitQuestions = [
  { id: 'expect', label: 'What do you expect from a first-year?', select: a => a.ambition > 75 ? 0 : a.ambition > 50 ? 1 : 2, replies: ['“A paper by the spring deadline. Two if the first one is good.” They are not joking; you check.', '“Learn the area, find a question, get a result by summer.” Reasonable, in the way that weather forecasts are reasonable.', '“Take classes. Read. Get lost a little. That is the point of the first year.”'], reveal: null },
  { id: 'funding', label: 'How is funding looking for the next few years?', select: a => a.funding > 75 ? 0 : a.funding > 45 ? 1 : 2, replies: ['“We are fine. We are very fine.” They gesture at a wall of GPUs as if it were a garden.', '“Fine for two years. After that we write more grants.” The “we” includes you.', '“You would TA the first year or two.” They say it quickly, like a side effect on a label.'], reveal: 'funding' },
  { id: 'after', label: 'Where do your students end up?', select: a => a.connections > 75 ? 0 : a.connections > 45 ? 1 : 2, replies: ['“Faculty, mostly, and a few at places you have heard of.” They name three; you have heard of all three.', '“Industry, some faculty. It depends on what they want.” A diplomatic answer, in a diplomatic voice.', '“Good places.” They do not name one. You do not ask which.'], reveal: 'connections' },
  { id: 'stuck', label: 'What happens when a project is not working?', select: a => a.management > 65 ? 0 : a.caring > 65 ? 1 : a.toxicity > 55 ? 2 : 3, replies: ['“We decide by a date whether to cut it. Sunk cost is not a research method.”', '“We talk about it. Sometimes the project is the problem; sometimes it is the week you are having.”', '“Projects work if you work.” The sentence has a temperature.', '“We try something else.” They do not say what, or when.'], reveal: 'management' },
];
