// The twelve things a CS PhD turns into, each named after the piece of paperwork that governs it.
// `difficulty` is the probability of being selected, nothing else. `permanence` is whether there is
// a clock: 0 = it restarts in about two years, 1 = there is one and it can end, 2 = there is none.
// `ceiling` is what the job still lets you become — leaving research is not a lower ceiling.
export const tracks = [
  {
    id: 'tenure_track', name: 'The Six-Year Review',
    subtitle: '"I just started my own lab." — Assistant Professor, tenure-track',
    pitch: 'Forty applications, four flyouts, and if it works you begin another six-year evaluation the week you unpack.',
    truth: 'You choose the questions now, which is the entire point and is not nothing. You also fundraise the stipend of the student who works for you. The case is decided in year six, partly by six letters from strangers you are never allowed to read.',
    difficulty: 5, permanence: 1, ceiling: 5,
    drivers: ["publications", "people", "citations", "talks", "awards"],
  },
  {
    id: 'teaching_faculty', name: 'The Annual Renewal',
    subtitle: '"I actually love the teaching part." — Teaching Professor / Lecturer',
    pitch: 'A teaching statement, a sample lecture delivered to a room of people grading it, and a contract that ends in August and is renewed in March.',
    truth: 'The load is the job: four courses, three preps, three hundred people who need you in October. You will be the best instructor in the building and be introduced at the faculty meeting as teaching faculty, with the adjective, by someone who means nothing by it.',
    difficulty: 3, permanence: 1, ceiling: 3,
    drivers: ["teaching", "people", "talks", "publications"],
  },
  {
    id: 'postdoc', name: 'Contingent on Funding',
    subtitle: '"It\'s a two-year thing." — Postdoctoral Researcher',
    pitch: 'Two years on somebody else\'s grant, renewable once, in a building that may or may not be this one.',
    truth: 'It is the only job that pays you to publish and to do nothing else, which makes it either the best two years of your research life or the same desk with a new payroll code. Both are common, and you will not know which until month eighteen. Your PI has a concrete reason to want your paper out: their renewal is the same spring as your market.',
    difficulty: 3, permanence: 0, ceiling: 4,
    drivers: ["people", "publications", "citations", "talks"],
  },
  {
    id: 'national_lab', name: 'The Clearance Queue',
    subtitle: '"I can\'t really talk about it." — Staff Scientist, federal laboratory',
    pitch: 'An offer in March, a background investigation through the summer, and a badge in November.',
    truth: 'Equipment no university can afford, a pension, a forty-hour week that is genuinely forty hours, and problems that stay funded for decades because they are national problems rather than fashionable ones. Weapons-program and clearance-track lines are US-citizen only, and so are the federal associateships. The open-science facilities hire foreign nationals through a process measured in quarters. Which door you are standing at decides the answer.',
    difficulty: 4, permanence: 2, ceiling: 3,
    drivers: ["publications", "awards", "people", "education"],
  },
  {
    id: 'industry_research', name: 'Pending Legal Review',
    subtitle: '"I still publish." — Research Scientist, industrial lab',
    pitch: 'The compute you queued three years for, available on a Tuesday, on a problem chosen in a different building.',
    truth: 'You do still publish, and often better work, right up to the quarter your result touches the roadmap. The pay has a comma where the stipend had a decimal point, and the person at the next desk wrote the paper your thesis cites in chapter two. You are also one reorg away from a manager with a different theory of what your team is for.',
    difficulty: 4, permanence: 1, ceiling: 4,
    drivers: ["publications", "citations", "people", "awards"],
  },
  {
    id: 'product_eng', name: 'Two Years of Equivalent Experience',
    subtitle: '"You\'ve used the thing I work on." — Software Engineer',
    pitch: 'They bring you in at mid-level, count the doctorate as two years of equivalent experience, and hand you something a million people will use.',
    truth: 'This is the most common outcome for a CS PhD and it is a good one, and the field trained you to apologize for it. Six years convert to exactly one rung on a ladder someone else designed. What transfers is not the thesis: it is that you can hold an unsolved problem for a year without panicking, which is rarer on a team than anyone there will tell you.',
    difficulty: 2, permanence: 1, ceiling: 4,
    drivers: ["education", "people", "publications"],
  },
  {
    id: 'quant', name: 'The Non-Compete',
    subtitle: '"It\'s basically the same math." — Quantitative Researcher',
    pitch: 'Five rounds, four of them mathematics, and the one that decides it is the one where they watch you be wrong out loud.',
    truth: 'It is real research with a merciless numerical referee that answers by Friday. None of it will be published, cited, or explicable at a dinner party, and the half-life of your best idea is months. It buys your parents a roof and a flight whenever they want one. It does not buy one person who wants to hear how the day went, and nobody there claims it does.',
    difficulty: 4, permanence: 1, ceiling: 3,
    drivers: ["education", "awards", "publications"],
  },
  {
    id: 'founder', name: 'The One-Year Cliff',
    subtitle: '"It\'s early, but it\'s going well." — Cofounder',
    pitch: 'You, a cofounder, a demo, and four years of equity that starts existing twelve months from now.',
    truth: 'You are the recruiter, the payroll, and the person who calls the landlord; the research is now about a fifth of the week and the best fifth. Most of these end quietly, the founders are fine, hired within a month, and telling the story for a decade. The equity is a house or a story and you cannot know which for roughly seven years.',
    difficulty: 1, permanence: 0, ceiling: 5,
    drivers: ["talks", "people", "awards", "publications"],
  },
  {
    id: 'soft_money', name: 'The Soft Money Line',
    subtitle: '"I run the lab, technically." — Research Scientist / Research Software Engineer, university',
    pitch: 'Stay in the research and skip the professorship: a university post paid entirely from grants somebody else has to keep winning.',
    truth: 'You do the science and skip the part that makes you eligible to do the science, which is an excellent trade right up until the renewal. Research staff hold up more labs than the field admits, and the code outlives most of the papers it produced. There is no tenure clock, which is a relief, and no tenure, which is the same sentence.',
    difficulty: 2, permanence: 0, ceiling: 3,
    drivers: ["people", "publications", "awards", "citations"],
  },
  {
    id: 'abroad', name: 'The Residence Permit',
    subtitle: '"The flight\'s only nine hours." — Faculty or research post outside the US',
    pitch: 'A post where the salary is lower, the contract is longer, and the health insurance is not attached to your job.',
    truth: 'For a large share of international students this is the better offer, and the US market describes it as leaving. You can be permanent five years before your American cohort is reviewed. The reasons are usually a parent, a partner\'s licence that only transfers one direction, and a permanent contract at thirty-two — and only sometimes the science. What it costs is proximity: you are the one in the group chat who is asleep during the deadline.',
    difficulty: 3, permanence: 2, ceiling: 4,
    drivers: ["publications", "citations", "people", "talks"],
  },
  {
    id: 'policy', name: 'The Program Solicitation',
    subtitle: '"I\'m on the other side of the panel now." — Science-policy fellow',
    pitch: 'A fellowship year inside an agency or a foundation, and then the two pages a legislative staffer reads at eleven at night.',
    truth: 'You stop producing results and start deciding whose results get funded, which is more influence than your thesis was going to have and a much worse story at a reunion. You will read four hundred proposals and write the one paragraph that redirects a subfield, and you will be cited for it by nobody. Federal fellowships require US citizenship; foundations, standards bodies and think tanks do not, and hire the same people.',
    difficulty: 4, permanence: 0, ceiling: 4,
    drivers: ["talks", "teaching", "people", "publications", "awards"],
  },
  {
    id: 'unplaced', name: 'Kept on File',
    subtitle: '"I\'m figuring out the next thing." — graduating without a placement',
    pitch: 'You defend, you graduate, and nothing is signed in May, because May is not when this resolves.',
    truth: 'Searches close in April and the phone rings in July, August, September. Almost everyone who has been through it leaves it out of the retelling, which is exactly why it looks rare and never is. The quiet belongs to the field, not to you. The costs are money and, if your status is stapled to the university, a calendar somebody else wrote. The only real risk is deciding the calendar was about you.',
    difficulty: 1, permanence: 0, ceiling: 5,
    drivers: [],
  },
];
export const trackById = Object.fromEntries(tracks.map(t => [t.id, t]));
// Academic tracks share a file; the penalty for crossing between them is asymmetric on purpose.
export const ACADEMIC = ['tenure_track', 'teaching_faculty', 'postdoc', 'soft_money', 'abroad'];
