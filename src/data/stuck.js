// Who do you ask.
//
// Being stuck is the default state of research and the game had no verb for it. This is the verb:
// six doors, each of which is a different kind of disappointment, and one of which is occasionally
// exactly right. Which one is right depends on what kind of stuck you are, and you do not get to
// know that in advance.
//
// The design rule: no door is strictly best. The advisor is high-variance and expensive in ways
// that are not energy. The AI is fast, plausible and sometimes confidently wrong. Google is mostly
// noise with a real answer buried in it. A collaborator will help exactly as much as their name
// position deserves.

export const OBSTACLES = {
  method: { id: 'method', label: 'The method does not work', hint: 'It runs. The numbers are wrong and you do not know why.' },
  framing: { id: 'framing', label: 'You cannot say what the contribution is', hint: 'Three paragraphs in and it is still setup.' },
  bug: { id: 'bug', label: 'Something is broken and it is not the obvious thing', hint: 'Eleven hours. It is not the obvious thing.' },
  scope: { id: 'scope', label: 'It has grown past what a deadline can hold', hint: 'Every part is necessary. That cannot be true.' },
  motivation: { id: 'motivation', label: 'You cannot make yourself start', hint: 'Nothing is wrong. You have not opened it.' },
};

// `fit` is which obstacles this door is actually good for. Everything else is a coin flip at best.
export const doors = {
  advisor: {
    id: 'advisor', label: 'Ask your advisor', icon: 'user',
    hint: 'High variance. They are not always there, and they are not always kind about it.',
    fit: ['framing', 'scope'], energy: 3,
    good: [
      'Four minutes at a whiteboard and the problem is a different, smaller problem. You have been carrying it for three weeks and they put it down in four minutes and you are not sure how to feel about that.',
      '“You are answering the wrong question.” They are right. It costs you a fortnight of work and saves you four months, and you will only be sure of the second part in the spring.',
    ],
    bad: [
      'They reframe it into something twice the size, get visibly excited, and you leave with a bigger problem and less time. This is the most common way an advisor makes things worse and they will never know they did it.',
      '“Have you tried the obvious thing?” You have tried the obvious thing. You say so. “Then try it again.” This is not advice; this is a person with four minutes.',
      'They answer a question you did not ask, at length, about their own work from 2019. It is genuinely interesting. You still have the problem.',
    ],
  },
  labmate: {
    id: 'labmate', label: 'Ask a labmate', icon: 'people',
    hint: 'Free, immediate, and they may not actually be listening.',
    fit: ['bug', 'method'], energy: 2,
    good: [
      'They look at it for eleven seconds and say “that is a version thing.” It is a version thing. This is the single highest-yield interaction available to anybody in a building.',
      'They hit exactly the same wall in March and did not tell anybody, and now you both know, and you are quietly furious that this was not written down anywhere.',
    ],
    bad: [
      'They say “huh, weird” and go back to their own screen. They were not being unhelpful; they were four lines into something and you were noise.',
      'They suggest restarting it. You restart it. It does not help and now you have lost the state you were debugging.',
      'They listen properly, ask two good questions, and have no idea. It is still the best twenty minutes of your day and you are exactly where you were.',
    ],
  },
  collab: {
    id: 'collab', label: 'Ask a collaborator', icon: 'chat',
    hint: 'They will help in proportion to their name position, which is honest of them.',
    fit: ['method', 'framing'], energy: 3, needsContact: true,
    good: [
      'They are first author on the thing this feeds, so they answer in nine minutes with a working script and an apology for the variable names.',
      'A twenty-minute call, screen shared, and they solve it live. They are enormously good at this and it is the reason you wanted the collaboration.',
    ],
    bad: [
      '“Sounds like a plan!” with an exclamation mark, which is what somebody sends when they are not going to look at it.',
      'Three days. Then two sentences that restate your own question back to you, warmly, with a suggestion to loop in somebody else.',
      'They are not on this paper. They are lovely about it. Nothing arrives.',
    ],
  },
  google: {
    id: 'google', label: 'Search for it', icon: 'browser',
    hint: 'Mostly noise. The answer is in it about one time in five.',
    fit: ['bug'], energy: 1,
    good: [
      'Page two, a 2011 blog post with three comments, and the third comment is the answer. The person who wrote it has not posted since.',
      'An issue thread, closed as wontfix, in which somebody describes your exact problem and somebody else describes the fix and then argues about whether it is a fix.',
    ],
    bad: [
      'A question identical to yours, closed as a duplicate of a question that is not a duplicate of it, in 2014.',
      'Nine results, four of them SEO content that restates the documentation, three of them the documentation, and two in a language you do not read.',
      'Forty minutes. You now know a great deal about an adjacent problem you do not have.',
    ],
  },
  ai: {
    id: 'ai', label: 'Ask ChatPHD', icon: 'chat',
    hint: 'Fast, fluent, and occasionally confidently wrong in a way that costs you a day.',
    fit: ['bug', 'motivation'], energy: 1,
    good: [
      'It restates your problem back in cleaner language, and the cleaner language is the answer. It did not know anything you did not; it just said it in an order you had not.',
      'Four options, ranked, with the trade-offs. Two are wrong, one is obvious, and the fourth is a thing you would not have thought of for a month.',
    ],
    bad: [
      'A confident, well-structured, entirely fictional API. Two functions do not exist. You find this out ninety minutes later, having built on them.',
      'It agrees with you enthusiastically, which is worse than useless, because it is exactly what a person who is stuck wants and exactly what they should not get.',
      'A citation that does not exist. The authors are real. The paper is not. It takes you four searches to be sure.',
    ],
  },
  sleep: {
    id: 'sleep', label: 'Stop and go home', icon: 'moon',
    hint: 'The one that always works and that nobody counts as work.',
    fit: ['motivation', 'bug'], energy: -6,
    good: [
      'You wake up at ten past six knowing what is wrong. Nothing happened in between. This is the least explicable and most reliable debugging technique in the field.',
      'In the shower, unbidden, with shampoo in your hand: the assumption you never checked. You are back at the desk in forty minutes.',
    ],
    bad: [
      'You sleep badly and think about it the whole time, which is the worst of both and is what "stop and go home" usually means at this stage.',
      'A full night, and in the morning it is exactly as broken as it was, and you have lost the evening as well.',
    ],
  },
};

export const doorOrder = ['advisor', 'labmate', 'collab', 'google', 'ai', 'sleep'];

export const stuckNote = 'Nobody teaches this and everybody has to work it out: which of these to try, and in what order, and how long to give each one.';
export const alreadyAsked = 'You have already been round this one this month.';
