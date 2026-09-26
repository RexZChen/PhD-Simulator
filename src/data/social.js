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

// Stage-specific conversations keep the same action identity and cooldown.
export const socialStories = {
  "commiserate": {
    "prelim": {
      "exchanges": [
        [
          "does anyone else feel like the qualifier is less an exam and more a personality test that nobody has published the rubric for",
          "Eleven replies. Everyone feels exactly this. Nobody had said it out loud."
        ],
        [
          "the reading list has acquired three more papers since i printed it. is it reproducing",
          "Someone shares their annotated list. The annotations include “ask someone else” seven times. Still useful."
        ],
        [
          "practiced saying “i do not know” without adding a five-minute theory of why i should know. mixed results",
          "A classmate offers to practice together. One difficult sentence gets easier in an empty seminar room."
        ]
      ]
    },
    "proposal": {
      "label": "Compare proposal doubts",
      "exchanges": [
        [
          "passed prelims. now apparently i have to propose something that does not already exist. small escalation",
          "“One question, not a field,” someone replies. You delete two arrows from the diagram. It helps."
        ],
        [
          "my proposal currently promises three dissertations and a minor improvement to civilization. working on scope",
          "Someone shares the slide their committee crossed out. The entire slide. You feel less alone."
        ],
        [
          "does “future work” become “proposed work” if i move it six slides earlier",
          "“Only if you explain which experiment could prove you wrong.” Annoyingly good advice, freely given."
        ]
      ]
    },
    "thesis": {
      "label": "Compare dissertation survival notes",
      "exchanges": [
        [
          "the committee approved the plan. the plan has now become a folder called thesis and i am afraid to open it",
          "Someone suggests starting with the methods you already know. “The introduction is allowed to arrive last.”"
        ],
        [
          "wrote the same paragraph three times today. do the discarded versions count toward the degree",
          "“No, but lunch counts as lunch.” A classmate saves you a seat. You take it."
        ],
        [
          "my thesis has five chapters and one transition sentence doing the work of a suspension bridge",
          "Two people admit to the same bridge. You trade outlines instead of pretending the structure was inevitable."
        ]
      ]
    },
    "deposit": {
      "label": "Compare the paperwork after passing",
      "exchanges": [
        [
          "defense passed. the remaining antagonist appears to be a PDF with the wrong margins",
          "Someone sends the format checklist they wish they had read. You pin it. This is what the channel is for."
        ],
        [
          "the committee says doctor. the upload portal says required field missing. negotiating between institutions",
          "“Use the title on the signed form, character for character.” A tiny piece of institutional folklore saves an afternoon."
        ],
        [
          "anyone else spending the week after defending renaming files and returning keys",
          "A graduate replies from their new city: “Keep a copy of the final receipt.” They stay in the channel for a reason."
        ]
      ]
    }
  },
  "study": {
    "proposal": {
      "label": "Trade proposal outlines",
      "hint": "Practice the research question together · +6 Readiness",
      "conditions": {},
      "effects": {
        "peerBond": 8,
        "readiness": 6
      },
      "exchanges": [
        [
          "proposal swap? one page each. please circle the first sentence you do not believe",
          "You each cut one claim and rescue one question. The proposals get smaller and more defensible."
        ]
      ]
    },
    "thesis": {
      "label": "Run a mock defense with the cohort",
      "hint": "Explain the contribution aloud · +6 Readiness",
      "conditions": {},
      "effects": {
        "peerBond": 8,
        "readiness": 6
      },
      "exchanges": [
        [
          "practice talk? ten minutes each. ask the obvious question i have become unable to see",
          "They ask why the baseline is fair. You answer it badly here, then work out how to answer it in the room."
        ]
      ]
    }
  },
  "cluster": {
    "any": {
      "exchanges": [
        [
          "whoever is running the job called final_final_v2 on all eight GPUs: i respect the ambition and i will find you.",
          "Four reactions in ninety seconds. Nobody admits to the job. The job keeps running."
        ],
        [
          "the queue estimate is now longer than the conference review period. impressive commitment to uncertainty",
          "Someone offers a smaller GPU overnight. The model will fit if you stop pretending batch size is a principle."
        ],
        [
          "the cluster status page says operational. would love to meet the optimist who maintains it",
          "The admin reacts with a tired face. You send a thank-you. The status page remains aspirational."
        ]
      ]
    }
  },
  "coffee": {
    "any": {
      "exchanges": [
        [
          "coffee run in ten minutes. i am going regardless, this is a courtesy notification.",
          "Three people come. The conversation is about work for four minutes and then, mercifully, it is not."
        ],
        [
          "leaving the building for something served in a cup. anyone who has been staring at the same line since lunch may join",
          "You learn someone has a dog. You have shared an office for eight months. The dog is excellent."
        ],
        [
          "coffee, tea, or just walking somewhere with windows. ten minutes. no slides",
          "Nobody solves anything. Two people laugh. It still counts as a good use of the afternoon."
        ]
      ]
    }
  }
};

const hints = {
  "offer_help": "Help the lab · stronger bonds, a little hope",
  "cluster": "Vent together · less stress, stronger lab bonds",
  "coffee": "$12 · less stress, stronger lab bonds",
  "ask_lab": "After a rejection · +4 Evidence, +2 Writing quality",
  "study": "Work through the problem set · +6 Coursework",
  "commiserate": "Less stress · stronger cohort bonds",
  "market": "Compare leads · +6 Career, +2 Academic capital",
  "rent": "Compare rent · solidarity, some unwelcome perspective"
};
for (const actions of Object.values(channelActions)) for (const action of actions) action.hint = hints[action.id];
