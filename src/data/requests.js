// Advisor requests: tasks that arrive in Lab Chat with a due date. Doing them costs Energy now;
// ignoring them costs relationship later. Tone scales with the advisor's traits and pressure.
export const requests = [
  { id: 'figure', kind: 'figure', due: 1, weight: 1.2, cost: { energy: 4 }, reward: { satisfaction: 4, writingQuality: 2 }, penalty: { satisfaction: -5 }, conditions: { hasProject: true, minProgress: 20 },
    text: ['Can you remake Figure 2 with the other colormap? The one from the paper I sent. Not that paper, the other one.', 'Fig 3 needs error bars. And a different y-axis. And, ideally, a different result.'] },
  { id: 'baseline', kind: 'experiment', due: 1, weight: 1.1, cost: { energy: 6, progress: -2 }, reward: { evidence: 5, satisfaction: 5 }, penalty: { satisfaction: -6, pressure: 4 }, conditions: { hasProject: true, minProgress: 25 },
    text: ['We need one more baseline before Thursday. Should be quick.', 'Can you run the comparison on the other dataset? Just the one. Maybe two.'] },
  { id: 'slides', kind: 'slides', due: 1, weight: 1, cost: { energy: 5 }, reward: { satisfaction: 6, readiness: 3, academicCapital: 2 }, penalty: { satisfaction: -6 }, conditions: {},
    text: ['Slides for my talk at {company}? 5–6 on your project. Tonight if possible, tomorrow at the latest.', 'I’m presenting to the department chair. Can you send me 3 slides that make your project sound finished?'] },
  { id: 'review', kind: 'review', due: 2, weight: .9, cost: { energy: 6 }, reward: { trust: 4, skill: { research: 1 } }, penalty: { trust: -4 }, conditions: { minMonth: 3 },
    text: ['Can you review these two papers for me? Due Sunday. Good training.', 'Two reviews, one weekend. Be kinder than they were to us.'] },
  { id: 'help_student', kind: 'help', due: 1, weight: .8, cost: { energy: 5, progress: -2 }, reward: { trust: 3, labBond: 8 }, penalty: { satisfaction: -4, labBond: -4 }, conditions: { minLabSize: 6 },
    text: ['{labmate} is stuck on their pipeline. Can you spend a couple of days with them this week?', 'Please help {labmate} get their eval running. Their deadline is before yours.'] },
  { id: 'grant', kind: 'writing', due: 1, weight: .8, cost: { energy: 5 }, reward: { trust: 6 }, penalty: { satisfaction: -5, trust: -2 }, conditions: { maxFunding: 75 },
    text: ['Two paragraphs on your project for the renewal. Friday. Make it sound inevitable.', 'The proposal needs a “preliminary results” section. Use your results. They are preliminary.'] },
  { id: 'demo', kind: 'demo', due: 1, weight: .7, cost: { energy: 4 }, reward: { academicCapital: 3, satisfaction: 4 }, penalty: { satisfaction: -4 }, conditions: { hasProject: true, minProgress: 40 },
    text: ['Visitors from {company} on Wednesday. Can you demo? It doesn’t have to work, it has to look like it works.', 'The dean is touring the lab. Please have something on the screen that moves.'] },
  { id: 'read', kind: 'reading', due: 1, weight: .9, cost: { energy: 3 }, reward: { trust: 2, skill: { research: 1 } }, penalty: { trust: -3 }, conditions: {},
    text: ['Read this by tomorrow, we’ll discuss. It’s short (34 pages).', 'Attached: a thesis from 2009 that “basically did our thing.” Read chapters 3–6 before we meet.'] },
  { id: 'reschedule', kind: 'schedule', due: 1, weight: .9, cost: { energy: 3, stress: 4 }, reward: { satisfaction: 3 }, penalty: { satisfaction: -3 }, toxicPenalty: { satisfaction: -6, conflict: 3 }, conditions: { minCadence: 'monthly' },
    text: ['Can we move our meeting to Sunday 9pm? Only slot I have this week.', 'Meeting moved to 7:30am Thursday. Bring the numbers.'] },
  { id: 'email', kind: 'email', due: 1, weight: 1, cost: { energy: 2 }, reward: { trust: 2 }, penalty: { trust: -3, satisfaction: -2 }, conditions: {},
    text: ['Please reply to the collaborator thread ASAP, they think we ghosted them. (We did.)', 'Can you answer the questions from the {company} people? Politely. Not too politely.'] },
  { id: 'seeds', kind: 'experiment', due: 2, weight: 1, cost: { energy: 8 }, reward: { evidence: 8, reproducibility: 6, satisfaction: 4 }, penalty: { satisfaction: -6, pressure: 4 }, conditions: { hasProject: true, minProgress: 45 },
    text: ['Rerun everything with 5 seeds. Reviewers will ask, and they will be right.', 'The results are one seed. That is a story, not a result. Five seeds by Monday.'] },
  { id: 'ablation', kind: 'experiment', due: 2, weight: .9, cost: { energy: 6 }, reward: { evidence: 6, satisfaction: 3 }, penalty: { satisfaction: -5 }, conditions: { hasProject: true, minProgress: 40 },
    text: ['Add the ablation we discussed. You know the one. (The one from the meeting where I was on the phone.)', 'Without the ablation the story has a hole. Fill the hole.'] },
  { id: 'related', kind: 'writing', due: 2, weight: .8, cost: { energy: 5 }, reward: { writingQuality: 5, satisfaction: 3 }, penalty: { satisfaction: -4 }, conditions: { hasProject: true, minDraft: 20 },
    text: ['Related work is thin. 20 more citations, and cite the area chair’s group. Twice.', 'The related work reads like we invented the field. Some people did work before us. Cite three of them.'] },
  { id: 'cover', kind: 'teaching', due: 1, weight: .6, cost: { energy: 6 }, reward: { trust: 5, skill: { teaching: 2 } }, penalty: { satisfaction: -5 }, conditions: { season: 'teaching' },
    text: ['Can you cover my lecture Thursday? I’m traveling. The slides are “mostly done.”', 'Guest-lecture my undergrad class next week. 80 minutes. They love graduate students; they think you are old.'] },
  { id: 'babysit', kind: 'experiment', due: 1, weight: .9, cost: { energy: 5, stress: 3 }, reward: { satisfaction: 5, evidence: 3 }, penalty: { satisfaction: -5 }, conditions: { hasProject: true, minProgress: 30, topicsIn: ['ml', 'nlp', 'robotics', 'systems'] },
    text: ['Can you babysit the runs over the weekend? Just check them every few hours. And at night.', 'The sweep will crash at some point. Please be awake when it does.'] },
  { id: 'letter_draft', kind: 'writing', due: 1, weight: .5, cost: { energy: 4 }, reward: { academicCapital: 3, trust: 2 }, penalty: { trust: -2 }, conditions: { months: [10, 11, 12, 1] },
    text: ['Draft the letter for your fellowship and send it to me. I’ll add adjectives.', 'Write your own recommendation letter. Be generous but plausible. I will sign it.'] },
];
export const requestById = Object.fromEntries(requests.map(r => [r.id, r]));

export const pushbackLines = {
  success: ['“…Fine. Next week, then.”', '“OK. Not urgent.” It was, apparently, not urgent.', '“Good point.” Two words you will frame.'],
  failure: ['“I need this. Please.”', '“If you want to be competitive—”', '“This is part of the job.”'],
};
export const declineLines = { mild: ['“Understood.”', '“OK. Noted.”'], sharp: ['“Noted.” One word, no period, somehow.', '“I see.” Two words. A door closing.'] };
export const expireLines = ['“Did you see my message?”', '“?”', '“Following up on the below.”', '“Still waiting on this.”'];

// Indexed for translation: lines picked from here are stored in the run by reference.
import { registerCatalog } from '../i18n/index.js';
registerCatalog('requests', requests);
