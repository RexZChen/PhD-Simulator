import { careerBeats } from './career-epilogue.js';
// Commencement, the market, and the twenty years after. Employers are invented; salaries are
// fabricated but sit in the right neighbourhood of the real ones, which is its own joke.

// Lines that go on the CV during the commencement animation, in order.
export const cvSections = [
  { id: 'education', label: 'Education', weight: 6 },
  { id: 'publications', label: 'Publications', weight: 34 },
  { id: 'citations', label: 'Citations', weight: 16 },
  { id: 'talks', label: 'Talks and service', weight: 12 },
  { id: 'teaching', label: 'Teaching', weight: 10 },
  { id: 'awards', label: 'Awards', weight: 8 },
  { id: 'funding', label: 'Funding', weight: 12 },
  { id: 'people', label: 'References', weight: 12 },
];

// The years after. `when` is years post-graduation; conditions filter by what happened.
export const epilogueBeats = [
  ...careerBeats,
  {
  "id": "hooding",
  "when": 1,
  "weight": 9,
  "needs": "deferredCeremony",
  "from": "advisor",
  "subject": "Are you coming back in May?",
  "text": "The department needs numbers for the May hooding ceremony. Your degree is already conferred. Attending is optional; travel, work and other commitments are yours to arrange. We need an answer by Friday.",
  "choices": [
    {
      "id": "come",
      "label": "Attend the ceremony",
      "line": "You rent a gown and join people you last knew by their projects. The hood goes on backwards on the first try. Someone gets a photograph before it is corrected.",
      "effects": {
        "hope": 10,
        "trust": 4
      }
    },
    {
      "id": "skip",
      "label": "Skip the ceremony",
      "line": "You send your answer. The degree remains conferred. Your advisor asks for a current mailing address; the hood arrives in a box marked fragile.",
      "effects": {
        "hope": 10,
        "capital": 4
      }
    },
    {
      "id": "later",
      "label": "Ask about a later ceremony",
      "line": "The office sends the next registration date. You put it in your calendar. This time it is an invitation, not a degree requirement.",
      "effects": {
        "hope": 10,
        "trust": 4
      }
    }
  ]
},
  { id: 'orphan_paper', when: 2, weight: 3, needs: 'abandoned',
    from: 'advisor', subject: 'You will not believe what happened to your old project',
    text: 'Do you remember the thing you shelved in year four? {labmate} picked it up, ran the experiment you never got to, and it is in at {venue}. You are second author. I put you there and I did not ask, which I hope is the right kind of not asking.\n\nThe camera-ready is next week. Come to the conference if you can — I cannot fund you any more, which is a sentence I have been looking forward to writing for years.',
    choices: [
      { id: 'go', label: 'Go, out of your own pocket', line: 'You pay for your own flight for the first time and it feels absurd and excellent. You stand at the poster for twenty minutes and then go and find your advisor at the coffee urn.', effects: { hope: 10, citations: 6 } },
      { id: 'cant', label: 'Send a note and your congratulations', line: 'You reply properly, at length, and mean it. They forward it to the student, who saves it.', effects: { hope: 5, citations: 3 } },
    ] },
  { id: 'citation_years_later', when: 3, weight: 3,
    from: 'system', subject: 'Your work was cited',
    text: 'A paper you have never heard of, from a lab in a country you have never been to, cites the thing you wrote at 3 a.m. in year three and thought was a failure. They call it “the standard treatment.”',
    choices: [{ id: 'ok', label: 'Sit with that for a minute', line: 'You read their paper. It is better than yours. It only exists because yours did.', effects: { hope: 12, citations: 12 } }] },
  {
  "id": "coffee",
  "when": 2,
  "weight": 4,
  "from": "advisor",
  "subject": "Back on campus?",
  "text": "Are you back near campus this month? The good machine is still broken. There is a new place across from the library that charges six dollars and is worth four.",
  "choices": [
    {
      "id": "yes",
      "label": "Meet for coffee",
      "line": "You talk about the old lab, then about what each of you is doing now. For once there is no progress report due at the end of the conversation.",
      "effects": {
        "hope": 6,
        "trust": 4
      }
    },
    {
      "id": "busy",
      "label": "Keep it to an email",
      "line": "You send a short update and a question about the lab. The reply answers the question. You leave the invitation open without booking a flight around it.",
      "effects": {
        "hope": 6,
        "capital": 4
      }
    }
  ]
},
  { id: 'review_request', when: 1, weight: 4,
    from: 'venue', subject: 'Invitation to review',
    text: 'You have been invited to review for {venue}. You are, apparently, an expert now. Nobody sent a certificate; they sent four PDFs and a deadline.',
    choices: [
      { id: 'careful', label: 'Write the review you always wanted to get', line: 'You spend four hours on it. Specific, generous, and hard where it needs to be. Somewhere, a second-year reads it and does not cry.', effects: { hope: 10, capital: 6 } },
      { id: 'fast', label: 'Do it in forty minutes at 11 p.m.', line: 'It is fine. It is not the review you always wanted to get. You know the difference, and that is new.', effects: { capital: 3 } },
    ] },
  { id: 'advisor_life', when: 4, weight: 3,
    from: 'advisor', subject: 'News',
    text: '{advisorNews}',
    choices: [{ id: 'reply', label: 'Write back properly', line: 'You write back at length, the way you never did while you were their student, because then it would have been homework and now it is a letter.', effects: { hope: 10, trust: 8 } }] },
  {
  "id": "student_email",
  "when": 5,
  "weight": 5,
  "from": "stranger",
  "subject": "A question about doing a PhD",
  "text": "Hi — I found your paper and then your page. I am applying this year and everyone tells me something different. Was it worth it? You can be honest. I would rather know.",
  "choices": [
    {
      "id": "honest",
      "label": "Say you would choose it again",
      "line": "You describe the work you would choose again and the costs you would negotiate differently. You suggest questions to ask current students. Whether they apply is their decision.",
      "effects": {
        "hope": 12
      },
      "final": true
    },
    {
      "id": "different",
      "label": "Say you would choose differently",
      "line": "You describe the work you still care about and the costs you would not pay twice. Their next email asks a better question: what should they ask the lab before accepting?",
      "effects": {
        "hope": 12
      },
      "final": true
    },
    {
      "id": "short",
      "label": "Describe it without deciding for them",
      "line": "You explain an ordinary week, the funding arrangement, and what you wish you had asked. There is no verdict in the email. There is enough detail for another question.",
      "effects": {
        "hope": 12
      },
      "final": true
    }
  ]
},
  {
  "id": "labmate_news",
  "when": 3,
  "weight": 3,
  "from": "labmate",
  "subject": "Found our old chat",
  "text": "{labmate} here. I found our old chat while clearing a laptop. Neither of us sounded as confident as we looked in group meeting. The printer appears in twelve consecutive messages.",
  "choices": [
    {
      "id": "reply",
      "label": "Reply to the message",
      "line": "You ask what they are doing now. The next message is about their current life, not the lab. You keep reading.",
      "effects": {
        "hope": 10
      }
    }
  ]
},
  { id: 'patent_granted', when: 3, weight: 4, needs: 'patentPending',
    from: 'system', subject: 'US 12,4XX,XXX B2 — Notice of Allowance',
    text: 'It is forwarded twice before it reaches you. The claims that survived are 1, 4 and 11, which are the three you argued for in a meeting you attended by phone from a parking lot.\n\nThe inventors are listed in the order the office received them: your advisor, then you. The revenue share is set out in a policy document dated eleven years before you arrived. Seventy per cent, thirty per cent, and the word used for it is “equitable”.\n\nThere is a licensing enquiry attached, from a company you have heard of. The figure, if it happens, is $41,000. Your share of the figure, if it happens, is $12,300.',
    choices: [
      { id: 'frame', label: 'Print it and frame it', line: 'It hangs in a hallway where nobody reads it, including you.\n\nIt cost the university $38,000 in attorney fees and it cost you the four best weekends of year four. Both numbers are on the record, in different offices, and no document anywhere contains both.', effects: { hope: 8, capital: 6 } },
      { id: 'ask', label: 'Ask, once, how the split was decided', line: 'The reply is prompt, courteous, and quotes the policy number twice. It does not answer the question, because the question does not have an answer of the kind you were asking for. It has a policy, and a policy is what you get instead.\n\nYou stop asking. Nine years later a postdoc asks you the same thing and you hear yourself quote the same number, in the same tone, and there is a full second where you can feel yourself decide not to notice it.', effects: { hope: 4, capital: 8 } },
      { id: 'nothing', label: 'File it in the drawer with the diploma', line: 'The licensing enquiry goes quiet in the spring, the way most of them do. Nothing arrives.\n\nThe patent stays granted, permanently, in a database, next to your name. It is the only thing you made in six years that has a number instead of a title.', effects: { hope: 6 } },
    ] },
  {
  "id": "the_book",
  "when": 2,
  "weight": 2,
  "from": "self",
  "subject": "Your first student",
  "text": "A first-year sits in your office and says they have an idea, and it is not good yet, and they are braced for you to say so.",
  "choices": [
    {
      "id": "listen",
      "label": "Ask what they want to test",
      "line": "You write the claim on the board and ask what result would change their mind. It is not yet a project. It is now a question you can both point at.",
      "effects": {
        "hope": 5,
        "capital": 3
      }
    },
    {
      "id": "scope",
      "label": "Agree on a small first experiment",
      "line": "You agree on one week and one experiment, then write down what can wait. The student photographs the board. You send the same list by email.",
      "effects": {
        "hope": 3,
        "capital": 5
      }
    }
  ],
  "tracks": [
    "tenure_track"
  ]
},
];

export const advisorNews = [
  'I got tenure. It took eleven years and two appeals and I am told I should feel something.',
  'I am on sabbatical, in a country where I do not speak the language, and I have read four novels.',
  'We had a baby. I have discovered that I was, in fact, capable of leaving the building at five.',
  'I am chairing the department, which is a punishment disguised as an honour. Do not do this.',
  'I am retiring next year. Forty-one students. I remember all of the projects and most of the arguments.',
  'The lab has moved buildings. Your old desk is in a room that is now a server closet, which feels apt.',
];
