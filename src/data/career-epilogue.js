// One promised consequence of the career the player chose.
export const careerBeats = [
  {
    "id": "career_teaching",
    "tracks": [
      "teaching_faculty"
    ],
    "when": 2,
    "weight": 1,
    "from": "self",
    "subject": "The course that worked",
    "text": "A student asks to reuse your assignment in a study group. The renewal form has fields for contact hours and evaluation scores. There is no field for this email.",
    "choices": [
      {
        "id": "share",
        "label": "Share the materials",
        "line": "You send the editable files. Someone else will improve them, and someone else will remove your name from the footer. Both are possible.",
        "effects": {
          "hope": 6,
          "capital": 2
        }
      },
      {
        "id": "record",
        "label": "Document the teaching work",
        "line": "You attach the assignment, the revisions, and the student feedback. The appendix is longer than the form. This time you keep the receipts.",
        "effects": {
          "hope": 2,
          "capital": 6
        }
      }
    ]
  },
  {
    "id": "career_postdoc",
    "tracks": [
      "postdoc"
    ],
    "when": 2,
    "weight": 1,
    "from": "self",
    "subject": "The new end date",
    "text": "The renewal arrives with a new end date and the same title. Your PI asks whether the next paper could come out before you go on the market.",
    "choices": [
      {
        "id": "paper",
        "label": "Give the paper a defined window",
        "line": "You agree on eight weeks and put the date in an email. The experiment now has a stopping rule. So does the arrangement.",
        "effects": {
          "hope": 5,
          "capital": 3
        }
      },
      {
        "id": "apply",
        "label": "Apply while the paper continues",
        "line": "The draft and the job spreadsheet share a screen. Neither gets your best hours every day. Both get hours.",
        "effects": {
          "hope": 3,
          "capital": 5
        }
      }
    ]
  },
  {
    "id": "career_staff",
    "tracks": [
      "soft_money"
    ],
    "when": 2,
    "weight": 1,
    "from": "self",
    "subject": "Who maintains it",
    "text": "Three labs depend on the code you maintain. The grant pays for new features. The bug reports did not read the grant.",
    "choices": [
      {
        "id": "scope",
        "label": "Publish a maintenance schedule",
        "line": "You list what is supported and what is not. Someone calls it unhelpful. Two students say it is the first time they knew what to expect.",
        "effects": {
          "hope": 6,
          "capital": 2
        }
      },
      {
        "id": "credit",
        "label": "Ask for funded maintenance time",
        "line": "The proposal now contains a maintenance line. It is cut in half in the budget meeting. Half a line is more than the previous accounting contained.",
        "effects": {
          "hope": 2,
          "capital": 6
        }
      }
    ]
  },
  {
    "id": "career_release",
    "tracks": [
      "industry_research",
      "national_lab"
    ],
    "when": 2,
    "weight": 1,
    "from": "self",
    "subject": "Waiting for release",
    "text": "The result is ready. The manuscript is waiting for internal review. Your old coauthor asks whether silence means rejection; you send the tracking number.",
    "choices": [
      {
        "id": "document",
        "label": "Document the result for the team",
        "line": "The internal note gets used before the public paper exists. You save the contribution record in a folder that is not called final.",
        "effects": {
          "hope": 5,
          "capital": 3
        }
      },
      {
        "id": "review",
        "label": "Work through the release questions",
        "line": "You answer the reviewer in the next building. The questions are different from conference reviews. They still arrive in a PDF.",
        "effects": {
          "hope": 3,
          "capital": 5
        }
      }
    ]
  },
  {
    "id": "career_product",
    "tracks": [
      "product_eng"
    ],
    "when": 2,
    "weight": 1,
    "from": "self",
    "subject": "Someone used it",
    "text": "A fix ships on Thursday. On Friday support forwards a message from a user who no longer needs a workaround. Nobody asks for a novelty statement.",
    "choices": [
      {
        "id": "user",
        "label": "Read the support thread",
        "line": "The thread contains a use case your benchmark never included. You write it down before it becomes an anecdote you tell instead of a test.",
        "effects": {
          "hope": 6,
          "capital": 2
        }
      },
      {
        "id": "team",
        "label": "Make the fix reproducible for the team",
        "line": "You leave a short debugging note. A colleague uses it next week and adds the step you forgot. There are two names on the page.",
        "effects": {
          "hope": 2,
          "capital": 6
        }
      }
    ]
  },
  {
    "id": "career_quant",
    "tracks": [
      "quant"
    ],
    "when": 2,
    "weight": 1,
    "from": "self",
    "subject": "The page you cannot update",
    "text": "Your old public profile still ends at the thesis. This month you found an error before it became an expensive position. The useful plot cannot go on the page.",
    "choices": [
      {
        "id": "record",
        "label": "Keep a permitted internal record",
        "line": "The note names the assumption, the check, and the people who caught it. The audience is small. They read it.",
        "effects": {
          "hope": 3,
          "capital": 5
        }
      },
      {
        "id": "outside",
        "label": "Make time for something outside the work",
        "line": "You leave the laptop at work. At dinner someone asks about your day. You find an answer that is true and does not require clearance.",
        "effects": {
          "hope": 6,
          "capital": 2
        }
      }
    ]
  },
  {
    "id": "career_founder",
    "tracks": [
      "founder"
    ],
    "when": 2,
    "weight": 1,
    "from": "self",
    "subject": "The paying customer",
    "text": "The customer wants an export button. The demo has a new model. Payroll is Friday. The roadmap is a document on which these facts disagree.",
    "choices": [
      {
        "id": "customer",
        "label": "Ship the export button",
        "line": "It is not the reason you started the company. It is the reason the customer renews this month. You put a date beside the research work instead of deleting it.",
        "effects": {
          "hope": 2,
          "capital": 6
        }
      },
      {
        "id": "limit",
        "label": "Negotiate a smaller delivery",
        "line": "You offer a simpler export and explain the limit. They accept the limit and ask for it in writing. The model gets one more week.",
        "effects": {
          "hope": 5,
          "capital": 3
        }
      }
    ]
  },
  {
    "id": "career_abroad",
    "tracks": [
      "abroad"
    ],
    "when": 2,
    "weight": 1,
    "from": "self",
    "subject": "Two calendars",
    "text": "Your old lab schedules a reunion during a week of meetings at your current institution. The invitation says “just a short flight.” The flight has a connection. The meetings have other people in them.",
    "choices": [
      {
        "id": "visit",
        "label": "Plan a visit around current commitments",
        "line": "You propose two dates instead of apologizing. Three people can make one of them. It becomes a smaller dinner and a real date on the calendar.",
        "effects": {
          "hope": 6,
          "capital": 2
        }
      },
      {
        "id": "remote",
        "label": "Keep the collaboration remote",
        "line": "You decline the trip and book a call about the paper. You miss the dinner. The collaboration survives a calendar that contains your current life.",
        "effects": {
          "hope": 3,
          "capital": 5
        }
      }
    ]
  },
  {
    "id": "career_policy",
    "tracks": [
      "policy"
    ],
    "when": 2,
    "weight": 1,
    "from": "self",
    "subject": "The paragraph that stays",
    "text": "The briefing has room for one paragraph. Your draft has six caveats. A colleague asks which uncertainty changes the decision, rather than merely making the paragraph longer.",
    "choices": [
      {
        "id": "caveat",
        "label": "Keep the consequential caveat",
        "line": "You cut five sentences and keep one uncomfortable condition. It survives the edit. Nobody cites the sentence; the decision cites its limit.",
        "effects": {
          "hope": 5,
          "capital": 3
        }
      },
      {
        "id": "appendix",
        "label": "Attach the evidence separately",
        "line": "The main paragraph is readable. The appendix records the uncertainty. One staffer phones with a question that proves they opened it.",
        "effects": {
          "hope": 3,
          "capital": 5
        }
      }
    ]
  },
  {
    "id": "career_search",
    "tracks": [
      "unplaced"
    ],
    "when": 2,
    "weight": 1,
    "from": "self",
    "subject": "A reply, not an offer",
    "text": "Someone outside your original shortlist asks to see the work. There is no promise attached. There is a named person and a time for a conversation.",
    "choices": [
      {
        "id": "talk",
        "label": "Take the conversation",
        "line": "You ask about the actual work, the contract, and the next step. One answer rules it out. Another gives you a useful contact. Neither is a verdict on the thesis.",
        "effects": {
          "hope": 5,
          "capital": 3
        }
      },
      {
        "id": "broaden",
        "label": "Broaden the search on your terms",
        "line": "You rewrite the first paragraph of the CV for a different kind of job. The papers stay. They no longer have to explain the whole person.",
        "effects": {
          "hope": 3,
          "capital": 5
        }
      }
    ]
  }
];
