export const asksStoryZh = {
  after_reject: {
    name: '讨论被拒后究竟该改什么',
    desc: '针对当前被拒的论文。每次拒稿只能获得一次有效建议；答复无帮助时可以之后再问。',
    success: { text: ['导师把意见分成缺少证据和表述不清两类。你带着一个待补的对比实验和一段待改的文字离开。重投仍然得靠你，但至少不再是一团迷雾。'] },
    failure: { text: ['“审稿人 2 错了。”分析到此结束。情绪上很解气，执行上毫无帮助。'] },
  },
  authorship: {
    name: '提前谈作者排序', desc: '在截稿周之前谈，那时它还是一次讨论。',
    success: { text: ['“你是一作。写下来，省得咱们俩都靠记忆。”你把它写了下来。'] },
    failure: { text: ['“先看看最后做成什么样。”你问，要有哪些贡献才能确定排序。会开完了，还是没有人把标准写下来。'] },
  },
  cut_scope: {
    name: '提议缩小研究范围', desc: '项目已经膨胀到无法在截止日期前完成时。',
    success: { text: ['“可以。保留能支持论点的对比实验。扩展部分放进未来工作。”论文变小了，计划难得变清楚了。'] },
    failure: { text: ['“更完整的故事才是贡献。”更完整的故事仍然需要额外的实验。你带着同样的研究范围离开，可用于完成它的时间却更少了。'] },
  },
};

export const researchStoryUi = {
  'For “{project}”, which reviewer concern changes the work, and which needs a clearer explanation?': '关于《{project}》，哪些审稿意见意味着要重做研究，哪些只需要把解释写清楚？',
  'Can we talk about author order on this one before it goes out, rather than in the week it goes out?': '能不能在投稿前就谈谈这篇的作者排序，而不是等到截稿那一周？',
  'I think this is two papers pretending to be one. I would like to cut it and send the smaller thing now.': '我觉得这其实是两篇论文硬凑成了一篇。我想先缩小范围，把能完成的那一篇投出去。',
  'Open a rejected paper whose decision you have not yet discussed.': '请打开一篇尚未获得有效拒稿建议的被拒论文。',
  'The paper does not resolve my central concern. I would need a direct comparison to assess the claimed improvement.': '论文没有消除我的主要疑虑。要判断所声称的改进，我需要看到直接对比。',
};
