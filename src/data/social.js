// Things the player can say in the lab and cohort channels. Small effects, real cooldowns —
// the point is that the channels are somewhere you act, not a wall you read.
// `draft` is typed into the composer before the message is posted.

export const channelActions = {
  general: [
    {
      id: 'offer_help', label: 'Offer to help whoever is closest to a deadline', cooldown: 6,
      draft: 'if anyone is up against a deadline this week and needs a second pair of eyes on a figure or a proof, I have a couple of hours. genuinely, not politely.',
      cost: { energy: 4 }, effects: { labBond: 8, hope: 3 }, personality: 'peoplePleaser',
      reply: () => 'Two people react. One of them takes you up on it at 11 p.m.',
    },
    {
      id: 'cluster', label: 'Complain about the cluster', cooldown: 4,
      draft: 'whoever is running the job called final_final_v2 on all eight GPUs: i respect the ambition and i will find you.',
      cost: {}, effects: { stress: -5, labBond: 4 },
      reply: () => 'Four reactions in ninety seconds. Nobody admits to the job. The job keeps running.',
    },
    {
      id: 'coffee', label: 'Suggest a coffee run', cooldown: 5,
      draft: 'coffee run in ten minutes. i am going regardless, this is a courtesy notification.',
      cost: { energy: 2 }, effects: { labBond: 6, stress: -4, money: -12 },
      reply: () => 'Three people come. The conversation is about work for four minutes and then, mercifully, it is not.',
    },
    {
      id: 'ask_lab', label: 'Ask the lab how they handled a reviewer like this', cooldown: 6,
      draft: 'has anyone dealt with a reviewer who wants a baseline that has no public code? asking for a paper i am currently losing to.',
      cost: { energy: 2 }, effects: { labBond: 5, evidence: 4, writingQuality: 2 },
      reply: () => 'The senior student answers with three sentences that would have saved you a week.',
    },
  ],
  cohort: [
    {
      id: 'study', label: 'Organize a study group', cooldown: 6, conditions: { season: 'teaching' },
      draft: 'study group for the problem set? tonight, 9pm, the room that smells like 9pm. i will bring the bad snacks.',
      cost: { energy: 4 }, effects: { peerBond: 8, coursework: 6 }, personality: 'networker',
      reply: () => 'Five people say yes. Three show up. Problem four is still unsolved at midnight, but collectively.',
    },
    {
      id: 'commiserate', label: 'Commiserate about the qualifier', cooldown: 5,
      draft: 'does anyone else feel like the qualifier is less an exam and more a personality test that nobody has published the rubric for',
      cost: {}, effects: { stress: -6, peerBond: 6, hope: 2 },
      reply: () => 'Eleven replies. Everyone feels exactly this. Nobody had said it out loud.',
    },
    {
      id: 'market', label: 'Ask who else is on the job market', cooldown: 8, conditions: { minMonth: 44 },
      draft: 'quietly: who else is applying this cycle? i would like to compare notes on which places actually reply to emails.',
      cost: { energy: 2 }, effects: { peerBond: 6, career: 6, academicCapital: 2 },
      reply: () => 'A private thread forms within the hour. It is more useful than any careers seminar.',
    },
    {
      id: 'rent', label: 'Ask what everyone pays in rent', cooldown: 10,
      draft: 'possibly rude question: what is everyone paying in rent? i want to know whether i am being taken for a ride or whether this is simply the city.',
      cost: {}, effects: { peerBond: 4, hope: -2 },
      reply: () => 'The range is wider than you expected. You are, it turns out, in the middle. This is somehow worse.',
    },
  ],
};

export const channelActionById = (channel, id) => (channelActions[channel] || []).find(a => a.id === id) || null;
