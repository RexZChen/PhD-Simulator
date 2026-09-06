// Being in a channel rather than reading one. Reactions cost nothing and mean something;
// replies are optional, because most messages do not need one and pretending otherwise is
// what makes a chat sim feel like a quiz.

// The six that actually get used in a lab, and what using them says about you.
export const reactions = [
  { id: 'plus1', glyph: '👍', label: 'Acknowledge', effects: { labBond: 1 } },
  { id: 'heart', glyph: '❤️', label: 'Warmth', effects: { labBond: 3, hope: 1 }, personality: 'peoplePleaser' },
  { id: 'laugh', glyph: '😂', label: 'Laugh', effects: { labBond: 2, stress: -1 } },
  { id: 'sob',   glyph: '😭', label: 'Solidarity', effects: { labBond: 2, stress: -2 } },
  { id: 'eyes',  glyph: '👀', label: 'Noted', effects: { labBond: 1 } },
  { id: 'fire',  glyph: '🔥', label: 'Genuine admiration', effects: { labBond: 3, confidence: -1 }, personality: 'networker' },
];
export const reactionById = id => reactions.find(r => r.id === id) || null;

// A reply to one specific message, rather than to the channel. Most messages get none of these,
// which is the point: you choose the ones worth answering.
export const replyKinds = {
  support: {
    id: 'support', label: 'Say something kind', energy: 1,
    drafts: [
      'that sounds genuinely rough. i am around if you want to not talk about it in person somewhere.',
      'for what it is worth, i think you are doing better than you think you are. from out here it looks fine.',
      'this happened to me in the spring. it passed. that is not advice, it is just information.',
    ],
    effects: { labBond: 6, hope: 2, energy: -1 }, personality: 'peoplePleaser',
    replies: ['“thanks. genuinely.”', 'They react with a heart and say nothing, which is the correct amount.', '“…yeah. ok. thanks.” They are typing, then not typing, then not typing again.'],
  },
  help: {
    id: 'help', label: 'Offer to actually help', energy: 4,
    drafts: [
      'send me the file and i will look at it tonight. i am not doing anything useful anyway.',
      'i had this exact error in march. give me twenty minutes and i will find what i changed.',
      'want me to read it? i am a bad reader but i am a fast one.',
    ],
    effects: { labBond: 9, energy: -4, evidence: 2 },
    replies: ['They send it within ninety seconds. It was already attached to a draft email.', '“you are a lifesaver.” It takes forty minutes and you would do it again.', 'They say no, and then an hour later they send it anyway.'],
  },
  joke: {
    id: 'joke', label: 'Make it worse, affectionately', energy: 0,
    drafts: [
      'have you tried turning the entire research direction off and on again',
      'counterpoint: what if we simply did not have a deadline',
      'i am choosing to read this as a positive result',
    ],
    effects: { labBond: 4, stress: -3 }, personality: 'cynic',
    replies: ['Three reactions in twenty seconds. The channel moves on, lighter.', '“i hate that this helped.”', 'Somebody replies with a photograph of the broken chair. No context. It is perfect.'],
  },
  ask: {
    id: 'ask', label: 'Ask them how they actually are', energy: 2,
    drafts: [
      'genuine question, not a channel question: how are you doing?',
      'that is the third time you have mentioned the cluster this week. are you ok?',
      'do you want to get a coffee that is not from the machine on four?',
    ],
    effects: { labBond: 8, energy: -2, stress: -2 },
    replies: ['They tell you. It takes a while and it is more than you expected and you are glad you asked.', '“fine! why?” Then, six minutes later: “ok not fine.”', '“i am ok. thank you for asking.” They mean the second sentence more than the first.'],
  },
  boast: {
    id: 'boast', label: 'Mention your own result', energy: 1,
    drafts: [
      'unrelated but the thing i have been stuck on for three weeks finally worked at 1am',
      'small win: the baseline reproduces. i am aware nobody else cares. i care enormously.',
    ],
    effects: { labBond: 2, confidence: 5, hope: 3 }, personality: 'networker',
    replies: ['Four reactions. The senior student asks a real question about it, which is the actual compliment.', '“nice!!” and then the channel returns to the printer.', 'Nobody responds for nine minutes. Then your advisor reacts with 👍, having read it from an airport.'],
  },
};
export const replyKindById = id => replyKinds[id] || null;

// Which replies a given message invites. Most invite none.
export function repliesFor(text = '') {
  const t = text.toLowerCase();
  const out = [];
  if (/stuck|broke|failed|reject|error|again|why does|cannot|can't|lost|died|crash/.test(t)) out.push('help');
  if (/sorry|rough|tired|exhausted|awful|hate|quit|leaving|cry|worst|alone/.test(t)) out.push('support', 'ask');
  if (/printer|chair|fridge|cluster|gpu|coffee|snack|smell|parking|wifi/.test(t)) out.push('joke');
  if (/accept|got in|passed|defended|congrat|offer|landed/.test(t)) out.push('support', 'boast');
  if (/\?$/.test(text.trim())) out.push('help');
  if (!out.length && /\b(i|my|we)\b/.test(t)) out.push('joke');
  return [...new Set(out)].slice(0, 3);
}

// Direct messages with people who are not your advisor.
export const dmOpeners = {
  senior: [
    { id: 'how_did_you', label: 'Ask how they got through the qualifier', energy: 2,
      draft: 'can i ask you something about the qualifier that i do not want to ask in the channel',
      reply: '“I failed the first one. Nobody tells you that because nobody says it out loud. Here is the folder I used.” They send a folder.',
      effects: { readiness: 8, labBond: 6, hope: 4 } },
    { id: 'advisor_read', label: 'Ask how to read your advisor', energy: 2,
      draft: 'you have worked with them for four years. how do i tell when they actually mean something?',
      reply: '“When they say ‘interesting’ they mean no. When they say nothing for a week they are thinking about it. When they forward you a paper at 2am, drop everything.”',
      effects: { labBond: 7, satisfaction: 2, evidence: 2 } },
  ],
  postdoc: [
    { id: 'method', label: 'Ask a question you are embarrassed by', energy: 2,
      draft: 'this is probably a stupid question and i have been avoiding asking it for two weeks',
      reply: '“It is not a stupid question, it is the question, and the reason you could not find the answer is that nobody writes it down.” Forty minutes at a whiteboard.',
      effects: { evidence: 6, progress: 5, labBond: 5, confidence: 4 } },
    { id: 'after', label: 'Ask what happens after the PhD', energy: 2,
      draft: 'do you mind if i ask what the job market was actually like for you?',
      reply: '“It was worse than they told me and better than I feared. Apply to more places than feels dignified. Start the letters in August, not October.”',
      effects: { career: 8, labBond: 5, hope: -2 } },
  ],
  peer: [
    { id: 'compare', label: 'Compare notes, honestly', energy: 1,
      draft: 'be honest — how much of the reading are you actually doing',
      reply: '“About a third. I have been pretending otherwise since September and it is exhausting.” You both feel enormously better.',
      effects: { peerBond: 8, stress: -6, hope: 3 } },
    { id: 'vent', label: 'Complain properly, off the record', energy: 1,
      draft: 'i need to say something unkind about this week and i need it to not be in a channel',
      reply: 'They match you, escalate, and then send a photograph of their desk at 11pm. You are both laughing by the end of it.',
      effects: { peerBond: 7, stress: -8 } },
  ],
  phantom: [
    { id: 'check', label: 'Check whether they are alright', energy: 2,
      draft: 'you have been quiet for a while. no pressure, just checking you are ok.',
      reply: 'Two days later: “thank you for asking. i am not really ok but i am dealing with it.” They come to group meeting the following week.',
      effects: { labBond: 10, hope: 4, energy: -2 } },
  ],
};
export const DM_NOTE = 'A direct message is not a channel. Nobody else sees it, and that is the entire reason it works.';
