// Fictional venues built on the real annual cycles of their archetypes.
// `real` names the archetype so the parody name can be swapped without touching the engine.
// Calendar months are 1-12. `deadlines` lists submission months; `review` is months from
// deadline to decision; `rebuttal` / `phaseOne` are months after the deadline when those
// stages happen (null when the venue has none); `conference` is the calendar month of the
// meeting. Acceptance baselines are approximate and never shown as precise numbers.
// Representative official reference cycles used (2025–2027 editions). The simulation
// projects their month-level rhythm into fictional later years; it is not a live calendar.
//   NeurIPS: full paper mid-May, rebuttal late Jul/early Aug, decisions mid-Sep, conference early Dec.
//   ICML: deadline late Jan, rebuttal early Apr, decisions early May, conference July.
//   ICLR: deadline late Sep, reviews early Nov + discussion, decisions Dec/Jan, conference late Apr.
//   AAAI: deadline late Jul/early Aug, phase-1 rejections late Sep, feedback Oct, decisions Nov, conference Jan/Feb.
//   IJCAI: deadline mid-Jan, decisions Apr, conference Aug.   CVPR: deadline mid-Nov, rebuttal late Jan, decisions late Feb, conference June.
//   ACL (ARR January cycle): deadline early Jan, reviews Mar, decisions early Apr, conference July.
//   EMNLP (ARR May cycle): deadline late May, response mid-Jul, decisions late Aug, conference Nov.
//   NAACL (ARR October cycle): deadline mid-Oct, decisions Jan, conference Apr/May.
//   OSDI: deadline early Dec, decisions Mar, conference July.  SOSP: deadline early Apr, decisions Jul, conference Oct.
//   NSDI: spring (late Apr) and fall (mid-Sep) deadlines, conference May.
//   STOC: deadline early Nov, decisions Feb, conference June.  FOCS: deadline early Apr, decisions early Jul, conference Oct/Nov.
//   SODA: deadline early Jul, decisions Oct, conference Jan.
//   CHI: deadline mid-Sep, reviews + revise-and-resubmit Nov, decisions mid-Jan, conference late Apr/May.
//   UIST 2026: deadline late Mar, rebuttal early Jun, decisions late Jun, conference Nov.
//   CSCW: journal/conference hybrid with no stable annual deadline; modeled as rolling.
//   ICRA: deadline mid-Sep, decisions late Jan, conference May/Jun.  RSS: deadline late Jan, rebuttal late Mar, decisions Apr, conference July.
//   CoRL: deadline late May, decisions early Sep, conference Nov.
//   KDD: two cycles (early Aug, early Feb), conference Aug.   TMLR and workshops: rolling.
export const venueReferences = {
  NeurIPS: { cycle: 'NeurIPS 2026', submitted: '2026-05-06', source: 'https://dev.neurips.cc/Conferences/2026/Dates' },
  ICML: { cycle: 'ICML 2026', submitted: '2026-01-28', source: 'https://icml.cc/Conferences/2026/Dates' },
  ICLR: { cycle: 'ICLR 2026', submitted: '2025-09-24', source: 'https://iclr.cc/Conferences/2026/Dates' },
  AAAI: { cycle: 'AAAI-27', submitted: '2026-07-28', source: 'https://aaai.org/conference/aaai/aaai-27/' },
  CVPR: { cycle: 'CVPR 2026', submitted: '2025-11-13', source: 'https://cvpr.thecvf.com/Conferences/2026/Dates' },
  ACL: { cycle: 'ACL 2027 / ARR', submitted: '2027-01', source: 'https://aclrollingreview.org/dates' },
  EMNLP: { cycle: 'EMNLP 2026 / ARR', submitted: '2026-05-25', source: 'https://aclrollingreview.org/dates' },
  NAACL: { cycle: 'NAACL 2027 / ARR', submitted: '2026-10-12', source: 'https://aclrollingreview.org/dates' },
  OSDI: { cycle: "OSDI '26", submitted: '2025-12-11', source: 'https://www.usenix.org/conference/osdi26/call-for-papers' },
  IJCAI: { cycle: 'IJCAI 2026', submitted: '2026-01-19', source: 'https://2026.ijcai.org/important-dates/' },
  NSDI: { cycle: "NSDI '26", submitted: '2025-04-25 / 2025-09-18', source: 'https://www.usenix.org/conference/nsdi26/call-for-papers' },
  FOCS: { cycle: 'FOCS 2026', submitted: '2026-04-01', source: 'https://focs.computer.org/2026/call-for-papers-2/' },
  CHI: { cycle: 'CHI 2026', submitted: '2025-09-11', source: 'https://chi2026.acm.org/authors/papers/' },
  RSS: { cycle: 'RSS 2026', submitted: '2026-01-30', source: 'https://roboticsconference.org/information/cfp/' },
  UIST: { cycle: 'UIST 2026', submitted: '2026-03-31', source: 'https://uist.acm.org/2026/cfp/' },
  CSCW: { cycle: 'CSCW journal model', submitted: 'rolling', source: 'https://cscw.acm.org/rolling.html' },
};

const V = (id, name, real, category, topics, deadlines, review, rebuttal, phaseOne, conference, baseline, hypeTolerance, tier, travel = 'far') =>
  ({ id, name, real, category, topics, primary: topics[0], deadlines, review, rebuttal, phaseOne, conference, baseline, hypeTolerance, tier, travel, rolling: deadlines === 'rolling', reference: venueReferences[real] || null });

export const venues = [
  V('neuripsy', 'NeurIPSy', 'NeurIPS', 'Elite general ML', ['ml', 'nlp', 'robotics'], [5], 4, 2, null, 12, .25, 45, 1),
  V('icmlater', 'ICMLater', 'ICML', 'Elite general ML', ['ml'], [1], 4, 2, null, 7, .27, 40, 1),
  V('iclearn', 'ICLeaRn', 'ICLR', 'Elite ML, public reviews', ['ml', 'nlp'], [9], 4, 2, null, 4, .31, 50, 1),
  V('aaaight', 'AAAIght', 'AAAI', 'Major AI', ['ml', 'nlp', 'robotics'], [7], 3, 2, 1, 2, .23, 35, 2),
  V('ijcaiguess', 'IJCAI Guess', 'IJCAI', 'Major AI', ['ml', 'nlp', 'robotics'], [1], 3, null, null, 8, .19, 35, 2),
  V('cvpretty', 'CVPRetty', 'CVPR', 'Vision', ['ml', 'robotics'], [11], 3, 2, null, 6, .23, 45, 1),
  V('kddish', 'KDDish', 'KDD', 'Data mining', ['ml'], [2, 8], 3, 2, null, 8, .20, 40, 2),
  V('aclmao', 'ACLmao', 'ACL', 'NLP flagship', ['nlp'], [1], 3, 2, null, 7, .22, 40, 1),
  V('emnlplease', 'EMNLPlease', 'EMNLP', 'NLP', ['nlp'], [5], 3, 2, null, 11, .22, 40, 1),
  V('naaclose', 'NAACLose', 'NAACL', 'NLP', ['nlp'], [10], 3, 2, null, 5, .24, 40, 2),
  V('osdisaster', 'OSDIsaster', 'OSDI', 'Systems flagship', ['systems'], [12], 3, null, null, 7, .17, 25, 1),
  V('sospicious', 'SOSPicious', 'SOSP', 'Systems flagship', ['systems'], [4], 3, null, null, 10, .17, 25, 1),
  V('nsdiy', 'NSDIY', 'NSDI', 'Networked systems', ['systems'], [4, 9], 3, null, null, 5, .19, 30, 1),
  V('stock', 'STOCk', 'STOC', 'Theory flagship', ['theory'], [11], 3, null, null, 6, .28, 20, 1),
  V('focsed', 'FOCSed', 'FOCS', 'Theory flagship', ['theory'], [4], 3, null, null, 11, .30, 20, 1),
  V('sodastream', 'SODAstream', 'SODA', 'Algorithms', ['theory'], [7], 3, null, null, 1, .30, 20, 1),
  V('chill', 'CHIll', 'CHI', 'HCI flagship', ['hci'], [9], 4, 2, null, 4, .25, 45, 1),
  V('uisted', 'UISTed', 'UIST', 'Interfaces', ['hci'], [3], 3, 2, null, 11, .24, 40, 1),
  V('cscwhy', 'CSCWhy', 'CSCW', 'Social computing', ['hci'], 'rolling', 5, 2, null, 10, .28, 45, 2),
  V('icramble', 'ICRAmble', 'ICRA', 'Robotics flagship', ['robotics'], [9], 4, null, null, 6, .42, 40, 2),
  V('rsstress', 'RSStress', 'RSS', 'Robotics, selective', ['robotics'], [1], 3, 2, null, 7, .28, 40, 1),
  V('corly', 'CoRLy', 'CoRL', 'Robot learning', ['robotics', 'ml'], [5], 4, 2, null, 11, .33, 45, 1),
  V('tmlrgh', 'TMLRgh', 'TMLR', 'Rolling ML journal', ['ml', 'nlp', 'robotics'], 'rolling', 3, 2, null, null, .42, 35, 2, 'none'),
  V('workshop', 'Workshop on Almost Working', 'a workshop', 'Cross-disciplinary workshop', ['any'], 'rolling', 1, null, null, null, .65, 70, 3, 'near'),
];
export const venueById = Object.fromEntries(venues.map(v => [v.id, v]));

export const selectivityLabel = v => v.baseline < .2 ? 'Very selective' : v.baseline < .27 ? 'Selective' : v.baseline < .4 ? 'Competitive' : 'Welcoming';
export const tierLabel = v => v.tier === 1 ? 'Top venue' : v.tier === 2 ? 'Major venue' : 'Workshop';
export const fitsTopic = (v, topic) => v.topics.includes('any') || v.topics.includes(topic);
export const topicFit = (v, topic) => v.topics.includes('any') ? 0 : v.primary === topic ? .05 : v.topics.includes(topic) ? -.01 : -.09;

// Month index of the next deadline at or after `from`. Rolling venues accept every month.
export function nextDeadline(v, from, monthOf) {
  if (v.rolling) return from;
  let best = Infinity;
  for (const m of v.deadlines) for (let i = from; i < from + 12; i++) if (monthOf(i) === m) { best = Math.min(best, i); break; }
  return best;
}
export const acceptsThisMonth = (v, index, monthOf) => v.rolling || v.deadlines.includes(monthOf(index));

// Review timeline for a submission made at `submitted`.
export function timelineFor(v, submitted, monthOf) {
  const decision = submitted + v.review;
  let conference = null;
  if (v.conference) { for (let i = decision; i < decision + 13; i++) if (monthOf(i) === v.conference) { conference = i; break; } }
  else if (v.id === 'workshop') conference = decision + 1;
  return {
    submitted,
    phaseOne: v.phaseOne === null ? null : submitted + v.phaseOne,
    rebuttal: v.rebuttal === null ? null : submitted + v.rebuttal,
    decision,
    conference,
  };
}
export const venuesForTopic = topic => venues.filter(v => fitsTopic(v, topic));
