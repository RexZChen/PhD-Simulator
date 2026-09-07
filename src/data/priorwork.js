// The paper you had before you started.
//
// The questionnaire asks whether you arrive with a publication and then does nothing with the
// answer, which makes it a question about nothing. In reality it is one of the largest single
// differences between two incoming students: one of them has been through a review cycle and one
// of them has not, and it shows in the first year in ways that have nothing to do with talent.
//
// So it is a real paper. It sits in Gaggle Scholar from the day you arrive, it accrues citations on
// the same curve as everything else, and it is four years old before your first PhD paper lands —
// which is exactly the shape of a real early profile, where the top entry is something you did as
// an undergraduate and are quietly tired of being known for.

export const priorTitles = {
  ml: [
    'A Comparative Study of Attention Mechanisms for Low-Resource Text Classification',
    'On the Sample Efficiency of Curriculum Ordering in Small-Data Regimes',
    'Revisiting Data Augmentation for Fine-Grained Visual Recognition',
  ],
  nlp: [
    'Annotator Disagreement as Signal: A Case Study in Sentiment Corpora',
    'A Lightweight Baseline for Cross-Lingual Named Entity Recognition',
  ],
  systems: [
    'Measuring Tail Latency in Serverless Function Cold Starts',
    'An Empirical Study of Cache Configuration in Undergraduate Teaching Clusters',
  ],
  theory: [
    'Tighter Bounds for a Restricted Case of the Online Bipartite Matching Problem',
    'A Simpler Proof of a Known Result, With One Fewer Assumption',
  ],
  hci: [
    'What Twelve Undergraduates Said About a Prototype: A Qualitative Study',
    'Designing for Interruption in Shared Study Spaces',
  ],
  robotics: [
    'Sim-to-Real Transfer for a Low-Cost Manipulator: What Did Not Work',
    'A Benchmark Nobody Asked For, and the Three Baselines It Broke',
  ],
};

// Where an undergraduate paper actually lands: a workshop, a regional venue, or the B-tier
// conference that took it on the third try.
export const priorVenues = [
  'a workshop at a conference you have still never attended',
  'the student track',
  'a regional symposium',
  'a workshop, after two rejections',
  'an IEEE venue whose name you have to look up every time',
];

export const priorNote = 'You arrive with one paper. It is a workshop paper, you were third author, and for the next six years it will be the top entry on your Scholar page and you will be quietly tired of it.';
export const priorMail = 'You set up the Scholar profile in your first week, the way everybody does, and there is exactly one thing on it. The citation count is a number you will refresh more often than you would admit to anybody.';
