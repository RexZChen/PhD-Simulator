// The reading session. You are working through the literature looking for the gap, and the gap is
// a real thing that either exists or does not. Timing is the skill: catching the moment a paper
// tells you something, before you have read four more and lost the thread.
//
// Critical — the aha: the gap is real and nobody has closed it.
// Hit     — a paper worth having read, which is most of them.
// Miss    — the 2008 paper that already did it, found at 1 a.m.

export const benchRounds = [
  { id: 'survey', label: 'The survey everyone cites',
    hint: 'Forty pages, and one paragraph in section 6 is about you. Find it before your attention goes.',
    crit: 'Section 6.3, third paragraph: “remains an open problem in the general case.” They wrote it in 2019 and nobody has closed it. The gap is real and it has a citation.',
    hit: 'You find the relevant subsection eventually. It positions your problem without solving it, which is what you needed.',
    miss: 'You read the whole survey and retain the abstract. Somewhere in there was the paragraph you were looking for.' },
  { id: 'baseline', label: 'The paper you are competing with',
    hint: 'Their numbers are better than yours. Work out whether that is the method or the setup.',
    crit: 'Appendix C: they tune on the test split. Not maliciously — the paper is from before anyone minded. Your numbers are the honest ones and you can say so.',
    hit: 'Their setup is different in a way you can name. It does not invalidate them and it does explain the gap.',
    miss: 'Their method is simply better. You read it three times hoping otherwise and it stays better.' },
  { id: 'citation', label: 'The reference that keeps appearing',
    hint: 'Four papers cite it for four different claims. Read the original and find out which one it actually supports.',
    crit: 'It supports none of them. The original makes a much narrower claim and the field has been citing it sideways for a decade. This is a paragraph in your related work and possibly a paper.',
    hit: 'It supports two of the four. You cite it correctly, which puts you ahead of two of the four.',
    miss: 'It supports all of them and is better written than yours. You add it to the pile.' },
  { id: 'preprint', label: 'Something posted this week',
    hint: 'Six days old, adjacent, and possibly the same idea. Read the method section first.',
    crit: 'Adjacent, not the same. They assume something you do not, and the thing you do not assume is the whole contribution. You send it to your advisor with one sentence.',
    hit: 'Overlapping but different enough. Concurrent work, cited, and slightly annoying.',
    miss: 'It is your idea, executed further, by four people with more compute. The date on it is Tuesday.' },
  { id: 'archive', label: 'A 2008 paper nobody cites',
    hint: 'It came up in a footnote. It should not be relevant. Check anyway.',
    crit: 'It is relevant and it is wrong — a subtle error in the proof of Lemma 2 that everyone has inherited. Finding this is worth more than the last three weeks.',
    hit: 'Adjacent, pre-deep-learning, and worth a sentence. You would not have found it by searching.',
    miss: 'It does exactly what you thought was yours. It is seventeen years old, it has eleven citations, and it is completely correct.' },
];

// A session at the bench is not free and not always worth it.
export const BENCH_ENERGY = 7;
export const benchNote = 'Five moments where the timing is the skill. The band is wider if you are good at this, and narrower when you are exhausted.';
export const benchGrades = {
  great: 'A session that went the way reading is supposed to go and almost never does. You know where the gap is now.',
  good: 'A real afternoon in the literature. Two things landed, one of them changes the framing.',
  ok: 'Some progress, some circling. That is most days and it does add up.',
  rough: 'You read for four hours and cannot say what you learned. The tabs are still open.',
};
