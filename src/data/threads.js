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

// The interview. It used to be three questions, identical at every school, asked by every advisor
// regardless of who they were — which is exactly wrong, because who is asking is the entire content
// of an interview. Each one now draws four from this pool, weighted by the archetype across the
// table: a Tenured Warlord asks the sweaty ones, a Rising Star asks about speed, and the kind ones
// ask what you want. `harsh` questions need toxicity or ambition; `intrusive` ones are the questions
// that are not supposed to be asked and are asked anyway, every cycle, by someone.
export const interviewQuestions = [
  { id: 'experience', them: 'Tell me about a research project you worked on. What went wrong?', options: [
    { id: 'honest', label: 'Walk through it honestly, including the part that failed', check: { skill: 'communication', difficulty: 50 }, good: .08, bad: -.03, goodReply: 'They nod at the failure more than at the success. “That is the part that matters.”', badReply: 'You over-explain the failure until it sounds like the whole project. They check the time.' },
    { id: 'pitch', label: 'Pitch the best version of it', check: { stat: 'confidence', difficulty: 55 }, good: .1, bad: -.06, goodReply: 'The pitch lands. They ask a follow-up you have an answer for.', badReply: 'They ask what the baseline was. It was not a baseline.' },
    { id: 'ask', label: 'Ask what they would want a first-year to work on', check: null, good: .04, goodReply: 'They talk for six minutes. You learn the project you would get, and that they like to talk.' } ] },
  { id: 'compute', them: 'What would you do with unlimited compute?', options: [
    { id: 'sleep', label: '“Sleep. Then a very large ablation.”', check: { skill: 'communication', difficulty: 45 }, good: .06, bad: -.04, goodReply: 'They laugh. It is a real laugh. You will remember it during the rejection.', badReply: 'Silence. Then: “Right.” A joke that did not survive the video compression.' },
    { id: 'scale', label: 'Scale the thing that works', check: { skill: 'research', difficulty: 55 }, good: .07, bad: -.04, goodReply: '“Which thing?” You say which thing. They write it down.', badReply: '“Which thing?” You do not have a thing.' },
    { id: 'eval', label: 'Fix the evaluation first; the rest is noise', check: null, good: .05, goodReply: '“Good. Nobody says that.” You have said the thing nobody says.' } ] },
  { id: 'questions', them: 'Do you have any questions for me?', last: true, options: [
    { id: 'style', label: 'How do you work with your students?', check: null, good: .03, reveal: 'management', goodReply: 'They answer at length. You learn that {hint}.' },
    { id: 'time', label: 'How long do students in your lab take to graduate?', check: null, good: .02, reveal: 'toxicity', goodReply: 'A pause, then a number, then a “but.” You learn that {hint}.' },
    { id: 'none', label: 'No questions, thank you', check: null, good: -.03, goodReply: '“Great.” The interview ends four minutes early. This is not a compliment.' } ] },

  // ── What they ask when they have read the file ─────────────────────────────────────────────
  { id: 'why_me', them: 'Why me, specifically? And please do not say my 2029 paper — everyone says my 2029 paper.', options: [
    { id: 'real', label: 'Name a different paper, and the thing in it you disagreed with', check: { skill: 'research', difficulty: 58 }, good: .12, bad: -.05, goodReply: 'They sit forward. Nobody has disagreed with them in an interview in four years and they have missed it.', badReply: 'You name the paper. You cannot name the disagreement. The sentence ends somewhere near the middle.' },
    { id: 'method', label: 'Because of the method, not the topic', check: { skill: 'communication', difficulty: 50 }, good: .08, bad: -.03, goodReply: '“That is the right reason.” They say it like a person confirming something about themselves.', badReply: 'It comes out as flattery with a technical word in it, which is worse than flattery.' },
    { id: 'honest', label: '“Honestly? Funding, location, and your students seem happy.”', check: null, good: .05, goodReply: 'A short laugh. “That is three more real reasons than I usually get.”' } ] },
  { id: 'gap', them: 'There is a gap in your record here. Walk me through it.', harsh: true, options: [
    { id: 'plain', label: 'Say what happened, plainly, and stop talking', check: { stat: 'confidence', difficulty: 46 }, good: .09, bad: -.04, goodReply: 'Four sentences and a full stop. They move on immediately, which is the whole thing you wanted.', badReply: 'You keep going after the explanation is finished, and the extra thirty seconds is what they remember.' },
    { id: 'spin', label: 'Reframe it as a deliberate choice', check: { skill: 'communication', difficulty: 62 }, good: .07, bad: -.09, goodReply: 'It holds, because it is half true and you told the half that was.', badReply: 'They have read four hundred of these. The reframe is visible from orbit.' },
    { id: 'decline', label: '“I would rather talk about the work.”', check: null, good: -.02, goodReply: 'Fair, and noted, and the note is a small one in a margin.' } ] },
  { id: 'weekend', them: 'How do you feel about weekends?', harsh: true, options: [
    { id: 'boundary', label: '“I work hard Monday to Friday and I protect Sunday.”', check: { stat: 'confidence', difficulty: 52 }, good: .06, bad: -.08, reveal: 'toxicity', goodReply: '“Good. The ones who do not last are the ones who cannot say that.” You have just learned something worth more than the offer.', badReply: 'A pause of a specific length. You have also just learned something.' },
    { id: 'eager', label: '“Whatever the work needs.”', check: null, good: .05, goodReply: 'They look pleased. Note what that means about the next six years and file it somewhere.' },
    { id: 'turn', label: 'Turn it around: “How do you feel about weekends?”', check: { skill: 'communication', difficulty: 60 }, good: .08, bad: -.05, reveal: 'toxicity', goodReply: 'They answer honestly, and the answer is the most useful sentence in the whole call: {hint}.', badReply: 'It lands as cheek rather than curiosity. The temperature drops two degrees.' } ] },
  { id: 'compare', them: 'I have another candidate with a paper already. Why should the slot be yours?', harsh: true, options: [
    { id: 'trajectory', label: 'Argue the trajectory, not the record', check: { skill: 'communication', difficulty: 58 }, good: .11, bad: -.06, goodReply: '“Say more.” You say more. It is the best two minutes of the call.', badReply: 'The trajectory argument requires evidence you have not brought.' },
    { id: 'concede', label: '“They probably should. I would still like you to hear the rest of this.”', check: { stat: 'confidence', difficulty: 55 }, good: .09, bad: -.04, goodReply: 'A real smile. Composure under a hostile question is the thing being tested and you have just passed it.', badReply: 'It reads as giving up rather than as poise, and the difference is entirely in the delivery.' },
    { id: 'compete', label: 'Compare yourself to them directly', check: { skill: 'research', difficulty: 66 }, good: .06, bad: -.11, goodReply: 'Specific, technical, not unkind. It works, narrowly.', badReply: 'You have criticised a person you have never met to someone who has met them.' } ] },
  { id: 'funding_q', them: 'Do you have any funding of your own? A fellowship, a government scholarship, anything?', options: [
    { id: 'no', label: '“No. Should I be applying to something?”', check: null, good: .03, goodReply: 'They name three you had not heard of and one deadline that is in nine days.' },
    { id: 'applying', label: 'Say what you have applied for and when you hear', check: { skill: 'communication', difficulty: 45 }, good: .07, bad: -.02, goodReply: '“Good.” A student who arrives with their own money is a student who arrives with their own agenda, and some advisors want that.', badReply: 'You are vague about the deadline. They are not vague about noticing.' },
    { id: 'why', label: 'Ask what it changes if you do', check: null, good: .04, reveal: 'funding', goodReply: 'They tell you what the money would actually buy: {hint}.' } ] },

  // ── The ones that are not supposed to be asked ─────────────────────────────────────────────
  { id: 'family', them: 'Are you planning to start a family during the program? I only ask for planning reasons.', intrusive: true, options: [
    { id: 'deflect', label: '“I plan to finish the program.”', check: { stat: 'confidence', difficulty: 50 }, good: .05, bad: -.03, goodReply: 'A beat, then a subject change. They know they should not have asked and you have given them the exit.', badReply: 'The beat lasts longer than it should. It is on both of you now.' },
    { id: 'answer', label: 'Answer it honestly', check: null, good: -.02, goodReply: 'You answer. It goes in a note that will not be shown to you and cannot be appealed.' },
    { id: 'name', label: '“I do not think you are allowed to ask me that.”', check: { stat: 'confidence', difficulty: 68 }, good: .04, bad: -.12, reveal: 'toxicity', goodReply: 'They apologise, immediately and genuinely, and the rest of the call is better than it would have been. You have learned that {hint}.', badReply: '“Of course, of course.” The call ends politely and eleven minutes early.' } ] },
  { id: 'visa_q', them: 'You would need sponsorship, is that right? I ask because it affects which grants can pay you.', international: true, options: [
    { id: 'facts', label: 'Give the facts, briefly, and move on', check: null, good: .04, goodReply: 'They write one word. It is genuinely administrative and it is genuinely a hurdle and both things are true.' },
    { id: 'prepared', label: 'Say which funding lines you are eligible for', check: { skill: 'research', difficulty: 52 }, good: .1, bad: -.02, goodReply: 'You have done the homework their administrator has not. It is the single most useful thing you say all call.', badReply: 'You are not sure. Neither are they. Nobody in this call knows and the answer exists in an office.' },
    { id: 'ask_back', label: 'Ask how many international students they have supervised', check: null, good: .03, reveal: 'caring', goodReply: 'The number tells you more than the answer does: {hint}.' } ] },
  { id: 'age', them: 'You are coming to this a little later than most. Any concerns about that?', intrusive: true, options: [
    { id: 'asset', label: 'Make the years the argument', check: { skill: 'communication', difficulty: 52 }, good: .09, bad: -.04, goodReply: '“You will be the only person in the lab who has shipped anything.” They mean it as a compliment and it is one.', badReply: 'It sounds defensive, which is the one register this question is designed to produce.' },
    { id: 'flat', label: '“No.”', check: { stat: 'confidence', difficulty: 58 }, good: .07, bad: -.03, goodReply: 'One syllable, no follow-up offered. It is the best possible answer and they know it.', badReply: 'The silence afterwards is longer than you intended and you fill it.' },
    { id: 'concern', label: 'Admit the concern you actually have', check: null, good: .02, goodReply: 'They are kinder about it than you expected, and slightly evasive about the stipend.' } ] },
  { id: 'first_gen', them: 'Does anyone in your family have a doctorate? I ask because it changes what nobody has told you yet.', options: [
    { id: 'no', label: '“No. Nobody.”', check: null, good: .04, reveal: 'caring', goodReply: 'They stop the interview for four minutes and explain three things that everyone else in your cohort already knows: {hint}.' },
    { id: 'yes', label: '“Yes, and it is the reason I know what I am walking into.”', check: { skill: 'communication', difficulty: 48 }, good: .06, bad: -.02, goodReply: '“Then you know what to ask me.” You do. You ask it.', badReply: 'It comes out as pedigree rather than preparation.' },
    { id: 'why_ask', label: 'Ask why that would change anything', check: null, good: .05, goodReply: '“Because the rules are not written down and I would rather tell you than let you find out.”' } ] },

  // ── The ones a particular kind of person asks ──────────────────────────────────────────────
  { id: 'speed', them: 'The deadline is in eleven weeks. Could you have something in it?', archetypes: ['star', 'empire', 'warlord'], options: [
    { id: 'yes', label: '“Yes.”', check: { stat: 'confidence', difficulty: 60 }, good: .09, bad: -.07, goodReply: 'They like it. Remember that you said this, because in fourteen months you will be asked to have meant it.', badReply: 'The confidence does not quite reach the end of the word.' },
    { id: 'depends', label: '“Depends what exists already. What exists already?”', check: { skill: 'research', difficulty: 54 }, good: .11, bad: -.03, goodReply: 'Exactly the right question. They describe a half-finished project and you can hear the shape of your first year in it.', badReply: 'A reasonable question, asked slightly too carefully.' },
    { id: 'no', label: '“Probably not well.”', check: null, good: -.04, reveal: 'ambition', goodReply: 'Honest. Costly. You learn that {hint}.' } ] },
  { id: 'independence', them: 'How much direction do you want? Be honest, because I will believe you.', archetypes: ['ghost', 'parent', 'chaos'], options: [
    { id: 'lots', label: '“A lot, at first. Less later, I hope.”', check: null, good: .07, reveal: 'availability', goodReply: 'They tell you what they actually provide, which is: {hint}.' },
    { id: 'little', label: '“Very little. Point me at a problem.”', check: { skill: 'research', difficulty: 58 }, good: .08, bad: -.06, goodReply: '“Good, because that is what you would get.” Both of you have been honest and it is a relief.', badReply: 'They ask what you would do first. It turns out you would want direction.' },
    { id: 'ask', label: 'Ask what their students say about it', check: null, good: .05, reveal: 'management', goodReply: 'They tell you, including the criticism, which is the answer: {hint}.' } ] },
  { id: 'money_talk', them: 'Do you have questions about the money? Most people do not ask and then find out.', archetypes: ['parent', 'star'], options: [
    { id: 'summer', label: 'Ask what happens in the summer', check: null, good: .06, reveal: 'funding', goodReply: 'A straight answer, including the year it did not work: {hint}.' },
    { id: 'ta', label: 'Ask how many semesters of teaching', check: null, good: .05, goodReply: '“Two, officially. Three, actually.” The gap between those two words is the most honest thing said all call.' },
    { id: 'fine', label: '“I have read the offer letter.”', check: null, good: 0, goodReply: 'The offer letter does not mention the fees. They do not mention that the offer letter does not mention the fees.' } ] },
];

// Which pool a given interview draws from, and how many.
export const INTERVIEW_QUESTIONS = 4;


export const visitQuestions = [
  { id: 'expect', label: 'What do you expect from a first-year?', select: a => a.ambition > 75 ? 0 : a.ambition > 50 ? 1 : 2, replies: ['“A paper by the spring deadline. Two if the first one is good.” They are not joking; you check.', '“Learn the area, find a question, get a result by summer.” Reasonable, in the way that weather forecasts are reasonable.', '“Take classes. Read. Get lost a little. That is the point of the first year.”'], reveal: null },
  { id: 'funding', label: 'How is funding looking for the next few years?', select: a => a.funding > 75 ? 0 : a.funding > 45 ? 1 : 2, replies: ['“We are fine. We are very fine.” They gesture at a wall of GPUs as if it were a garden.', '“Fine for two years. After that we write more grants.” The “we” includes you.', '“You would TA the first year or two.” They say it quickly, like a side effect on a label.'], reveal: 'funding' },
  { id: 'after', label: 'Where do your students end up?', select: a => a.connections > 75 ? 0 : a.connections > 45 ? 1 : 2, replies: ['“Faculty, mostly, and a few at places you have heard of.” They name three; you have heard of all three.', '“Industry, some faculty. It depends on what they want.” A diplomatic answer, in a diplomatic voice.', '“Good places.” They do not name one. You do not ask which.'], reveal: 'connections' },
  { id: 'stuck', label: 'What happens when a project is not working?', select: a => a.management > 65 ? 0 : a.caring > 65 ? 1 : a.toxicity > 55 ? 2 : 3, replies: ['“We decide by a date whether to cut it. Sunk cost is not a research method.”', '“We talk about it. Sometimes the project is the problem; sometimes it is the week you are having.”', '“Projects work if you work.” The sentence has a temperature.', '“We try something else.” They do not say what, or when.'], reveal: 'management' },
];
