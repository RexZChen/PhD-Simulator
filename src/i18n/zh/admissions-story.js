// Admissions continuity: flat engine/email strings and the revised recommendation-letter scene.
export const admissionsStoryZh = {
  'one-on-ones are {oneOnOne}; group meetings are {group}. That is the calendar, at least': '一对一通常是{oneOnOne}，组会是{group}。日历上是这么写的',
  'Thanks for reaching out. {openingsLine} Mention our research area in your statement so the committee can route your file.': '谢谢来信。{openingsLine} 请在个人陈述里说明你感兴趣的研究方向，方便委员会分配材料。',
  'A short video call with your professor of interest: four questions. Answer honestly — they are better at spotting a rehearsed answer than you are at giving one.': '和意向导师进行一次简短的视频面试：四个问题。诚实回答——比起你背答案的本事，他们识别背过的答案更在行。',
};
export const admissionsEventsZh = {
  letter: {
    title: '你的推荐人“正在处理”',
    text: '一位推荐人还没交推荐信。截止日期还有三天。自动回复说，对方在参加一个关于“如何指导学生”的研讨会。',
    choices: {
      nudge: { text: '发一封礼貌而惊恐的提醒', hint: '沟通检定',
        successText: '系统状态变成了“已收到”。推荐人是在研讨会的洗手间里提交的。你终于不用再刷新这一栏。',
        failureText: '晚了四小时。系统记下了迟交；至少信已经在那里了。' },
      backup: { text: '请对方今天先交一封简短的推荐信', hint: '按时提交，但细节更少',
        result: '午饭前，三段话发了过来。你做过的工作都写了，形容词没剩下多少空间。' },
    },
  },
};
