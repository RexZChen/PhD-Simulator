// The bench: five moments in a working session where timing is the whole skill. Each round is a
// needle crossing a band. Hitting the middle is the moment you actually caught the thing.
export const benchRounds = [
  { id: 'converge', label: 'The run is converging',
    hint: 'Kill it at the right epoch. Too early and you learn nothing; too late and you have overfit to the validation set you promised not to look at.',
    crit: 'You stop it exactly where the curve flattens. The number is real and you can defend it.',
    hit: 'You stop it a bit late. Fine. Slightly worse, entirely usable.',
    miss: 'It runs four hours past the point of usefulness and the checkpoint you wanted is gone.' },
  { id: 'bug', label: 'The bug is in one of these three places',
    hint: 'You have a guess. Commit to it while you still remember why.',
    crit: 'First guess. It was the index. It is always the index, and knowing that is the job.',
    hit: 'Second guess, twenty minutes. You found it and you wrote down why.',
    miss: 'Ninety minutes later it turns out to have been a stale cache, and you have changed six things you now have to change back.' },
  { id: 'read', label: 'The related-work paper you were dreading',
    hint: 'Find the one paragraph that says whether they already did your idea.',
    crit: 'Page four, second column. They did something adjacent and left your exact question open. This is the best news of the month.',
    hit: 'You find it eventually. They are close but not on it. You can work with close.',
    miss: 'You read the whole thing twice and still cannot tell. You will have to email someone.' },
  { id: 'figure', label: 'The figure that has to carry the claim',
    hint: 'One axis, one comparison, no cleverness.',
    crit: 'It is legible at a glance and it is honest at a glance, which is rarer. Your advisor will not change a thing.',
    hit: 'It works. Somebody will ask you to add error bars, and they will be right.',
    miss: 'Three panels, two colour scales, and a caption doing the work the figure refused to.' },
  { id: 'ablate', label: 'The ablation you have been avoiding',
    hint: 'Turn the component off and find out whether the paper survives it.',
    crit: 'The component matters, and now you can prove it in one line. The paper just got harder to reject.',
    hit: 'It matters, mostly. There is one setting where it does not and you will mention it in a footnote.',
    miss: 'It does not matter at all. You now know something true that you did not want to know, at eleven at night.' },
];

// A working session is not free and not always worth it.
export const BENCH_ENERGY = 7;
export const benchNote = 'Five moments where the timing is the skill. The band is wider if you are good at this and narrower when you are exhausted.';
export const benchGrades = {
  great: 'A session that went the way sessions are supposed to go and almost never do.',
  good: 'A real afternoon of work. Two things moved, one thing broke and got fixed.',
  ok: 'Some progress, some circling. That is most days and it does add up.',
  rough: 'You lost the thread early and spent the rest of it trying to find where. Nothing is broken. Nothing moved either.',
};
