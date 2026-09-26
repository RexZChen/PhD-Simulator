export const tenureStoryEvents = {
  tenure_result: {
    title: '终身教职的决定',
    text: '{advisor}打开了决定信。这次开会，终于先有一个确定的答案。',
    choices: {
      congrats: { text: '问问自己的研究接下来怎么安排', hint: '准备度；明确下一步', result: '你把已确定的安排和仍待确认的事分别记下。后一栏更长。至少，现在有了栏名。' },
      support: { text: '问问导师现在怎么样', hint: '信任；留点空间谈谈这件事', result: '你让导师把话说完，没有立刻把话题转回自己的草稿。散会以后，草稿还在那里。' },
    },
  },
  advisor_leaves: {
    title: '离职通知期到了',
    text: '终身教职被拒十二个月后，{advisor}在别处找到了职位。你可以下个月一起搬，也可以留在这里换一位导师。\n\n聘书是写给导师的。你的名字在附件里。',
    choices: {
      follow: { text: '跟着导师搬迁', hint: '预付搬迁费 $1,600；按上述条款，下个月搬迁。', result: '你签了转学协议。还在实验室的同门也一起签了。搬迁预付款已付；抵达新学校后，新的津贴和租约才开始。' },
      stay: { text: '留下，换一位本校导师', hint: '独立性；重新建立师生关系' },
    },
  },
  advisor_tenure_denied: {
    title: '投票没有通过',
    text: '{advisor}把拒绝信给你看。聘期将在十二个月后结束。这件事，信里写得很清楚；至于学生怎么办，几乎只字未提。\n\n现在还没有转学安排。今天可以先谈计划，也可以在本校换一位导师重新开始。',
    choices: {
      follow: { text: '请导师搬迁时也考虑自己的去向', hint: '信任；表达意愿，还不承诺转学。', result: '“有消息我会跟你商量。”你说，做决定前要先看实际的资助和转学条款。目前，你的学校和截止日期都没有变。' },
      stay: { text: '留下，在本校另找导师', hint: '换一位本校导师；师生关系从头建立。' },
      finish: { text: '一边考虑去向，一边推进手头的草稿', hint: '现在获得研究和草稿进展；不保证提前毕业。', result: '你们一起缩小下一节的范围，改完了它。完成的是一部分工作，不是其余毕业要求的豁免手续。' },
    },
  },
};
export const tenureStoryZh = {
  '{advisor} turns the letter toward you. Tenure granted. The next grant deadline is still on the calendar, but this particular clock has stopped.': '{advisor}把信转向你。终身教职通过了。下一笔基金的截止日期还在日历上，但至少这一项倒计时停了。',
  '{advisor} turns the letter toward you. Tenure denied. Their appointment ends in twelve months. No transfer is arranged today; you have notice, and a decision about whose lab to finish in.': '{advisor}把信转向你。终身教职没有通过，聘期将在十二个月后结束。今天还没有转学安排；你得到的是提前通知，以及接下来在哪个实验室完成学业的选择。',
};
