const c = (text, hint, result) => ({ text, hint, ...(result ? { result } : {}) });
export const events = {
  ambulance: {
    title: '工作不能再照原样继续',
    text: ['你的健康状况已经连续几个月偏低。今天，工作停了下来。联系学生支持部门后，第一张表还没问需要调整什么，就先问你预计什么时候回来。', '日历上有下一个截止日期，也有一次健康预约。系里问你需要休假还是退出项目；两张表看起来差不多，实际却是两件很不同的事。'],
    choices: {
      recover: c('安排四周休假和照护', '获得恢复支持，继续本局；需要支付照护费用', '你选择的是休假，不是退出项目。你发去一份需要暂缓的工作清单。办公室请你把同一份清单再填进他们的模板。'),
      withdraw: c('选择因健康原因退出项目，结束本局', '离开项目；已经完成的工作仍保留在记录中'),
      discharge: c('暂缓支持安排，先继续工作', '现在不休假；健康和压力会恶化，可能需要重新寻求支持', '你推迟了安排。工作仍留在日历上，尚未解决的支持需求也仍然存在。你之后仍然可以改变决定。'),
    },
  },
  flatline: {
    title: '重新看看支持安排',
    text: '你曾推迟支持安排，而目前健康状况仍然很差。以前的回答，不必成为现在的回答。学生支持部门重新打开了你的个案。系统要求再填一份新表，因为旧表已经结项。',
    choices: {
      recover: c('重新安排四周休假和照护', '获得支持，继续本局；以前的推迟不会让你失去求助机会', '你接受帮助，安排休假。以前的拒绝留在一张旧表里，它不能决定你今天可以提出什么请求。'),
      withdraw: c('选择因健康原因退出项目，结束本局', '离开项目，不再恢复原有的工作量'),
    },
  },
  special_care: {
    title: '为支持腾出空间',
    text: ['持续的高压力成了工作的背景，希望也所剩无几。在支持面谈中，有人问哪些事情可以暂时停下来。这和问你怎样做得更快，是不同的问题。', '你提出需要帮助调整工作量。支持办公室分别说明了休假和退出项目两个选项。系里想知道预计什么时候完成学业。此刻，你想先把下个月安排好。'],
    choices: {
      recover: c('安排四周休假和支持', '减轻眼前的负担，继续本局；需要支付照护费用', '你选择暂时离开工作负担。接下来怎么办，可以之后再谈。今天，你不必给出整个未来的答案。'),
      go: c('选择因健康原因退出项目，结束本局', '在这里结束这个项目；学位不是对照护和未来的评分'),
    },
  },
};

export const endingUI = {
  "You choose to leave this programme and make room for care. The office records a withdrawal date. Your completed work does not disappear, even though the student portal puts it behind a different tab.\n\nThere are practical questions about money, housing, and what support continues. Those need answers; they do not need to become a story about your discipline. This run ends here. It does not decide whether you return to study, change direction, or need more time.": "你选择离开这个项目，为照护留出空间。办公室登记了退学日期。已经完成的工作并没有消失，只是学生系统把它放进了另一个标签页。\n\n经费、住房、哪些支持还能继续，都是需要处理的实际问题。它们需要答案，但不需要被解释成你是否自律。这一局在这里结束。它不会替你决定以后是否重返学业、换个方向，或者需要更多时间。",
  "Stepping Away for Care": "为照护离开项目",
  "You choose medical withdrawal rather than returning to the same workload. The support office helps you record the next steps. The department still asks for an expected completion date; for once, you leave that field unanswered.\n\nLeaving the programme does not resolve everything, and returning is not a condition of having recovered. Your care and your future continue beyond what this transcript can record.": "你选择因健康原因退出项目，而不是回到原来的工作量。支持办公室帮你记下接下来的安排。系里仍然要求填写预计毕业日期；这一次，你把那一栏留空了。\n\n离开项目不会解决所有问题，而重返学业也不是恢复的条件。你的照护和未来，都不止于这份成绩单所能记录的内容。",
  "The department sends a notice, and the people who knew you receive it in different places. There is work left unfinished. There are also relationships, conversations, and ordinary days that no publication list records.\n\nThe notice has a place for your name and your affiliation. It has much less room for what people remember. The institutional record is not the whole life.": "系里发出一则通知。认识你的人在不同的地方收到它。有些工作还没有完成。还有那些关系、交谈和普通的日子，不会出现在任何发表清单上。\n\n通知有位置填写你的姓名和单位，却没有多少地方放下人们记得的事。机构留下的记录，不是一个人的全部生活。"
};
