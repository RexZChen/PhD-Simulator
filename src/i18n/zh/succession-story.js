import { eventsG } from './events-g.js';

// Keep the existing choices while replacing claims the simulation has not earned yet.
export const successionStoryEvents = {
  advisor_retires: {
    title: '退休交接表',
    text: '“荣休聘任现在生效。”{advisor}递来一张表。接任导师的名字已经填好了。谁来读草稿，表上没写。',
    choices: {
      coadvise: { text: '保留荣休导师的指导', hint: '由新导师接任；请原导师继续参与指导。',
        successText: '一位本校同事接任在册导师。原导师同意每月留一次讨论机会，由你决定是否预约。你保留了另一位读稿人，不是又多了一套必须参加的会。表格上仍然只能填一个名字。',
        failureText: '一位本校同事接任在册导师。原导师无法承诺定期讨论。已完成的工作保留；只是那些从前不必解释的背景，下次读稿时得重新讲起。' },
      inherit_lab: { text: '接受有资助的交接', hint: '继续当前课题；负责维护资料。',
        result: '协议写明了当前课题、接任导师和结束日期。交接期间，基础助研津贴有保障，不承担助教任务；你负责让课题资料保持可用。系里称之为“保持连续性”。你收好那份写着结束日期的副本。' },
      transfer: { text: '转到本校另一位导师', hint: '重新建立关系，不附加其他任务。',
        result: '新导师要了草稿和截止日期清单。研究接着做。至于双方说的“快做完了”是不是一回事，还得再开一次会。' },
    },
  },
  advisor_industry: {
    ...eventsG.advisor_industry,
    choices: {
      ...eventsG.advisor_industry.choices,
      follow_intern: { text: '接受导师那边的暑期实习', hint: '下个暑期带薪科研实习；此前改为远程指导。',
        result: '{company} 的录用信写了日期、薪资，还在指导人一栏写了{advisor}。你接受了。六月之前，你们通过视频开会。工牌照片可以晚点再拍。' },
      remote: { ...eventsG.advisor_industry.choices.remote,
        result: '你们商量好减少会面，改为视频。下一封会议邀请标了两个时区。没有人承诺会更快回复草稿。' },
    },
  },
  advisor_moves: {
    ...eventsG.advisor_moves,
    text: '更大的一笔启动经费。下个月到岗。{advisor}把聘书放在你的草稿旁边。\n\n新院系认可你已完成的学业。搬家费你出。',
    choices: {
      ...eventsG.advisor_moves.choices,
      move: { text: '决定跟着导师走', hint: '预付搬迁费 $1,600；按上述条款，下个月搬迁。',
        result: '你签了字，付了预付款。同门也签了，实验室一起搬。文件复制起来很快。收拾厨房，是另一个研究课题。' },
      stay_here: { text: '留下，接受远程指导', hint: '保留本校学籍和住处；改为视频，见面减少。',
        result: '学籍和住房都留在这里。讨论改成视频，次数也少了。你在日历邀请里放上一份长期更新的文档；白板得找个替代品。' },
    },
  },
  advisor_leaves: {
    title: '实验室要搬家了',
    text: '{advisor}接受了别处的职位。你可以下个月搬过去，也可以在这里换一位导师。\n\n聘书写的是导师的名字。你的名字在附件里。',
    choices: {
      follow: { text: '跟着导师走', hint: '预付搬迁费 $1,600；按上述条款，下个月搬迁。',
        result: '你签了转学协议，还在实验室的同门也一起签了。搬迁预付款已付；下个月抵达后，开始按新的标准领津贴、付房租。' },
      stay: { text: '留下，换一位本校导师', hint: '更独立；师生关系重新开始' },
    },
  },
  advisor_dies: {
    ...eventsG.advisor_dies,
    text: '来自系主任，四句话，第三句是那一句。第四句里有一个心理咨询的电话。\n\n实验室十一点在那个房间碰头，因为没有人想得出还能做什么。有人带了点心，这很荒谬，而所有人都吃了。白板上还留着导师的字。没有人去拿板擦。',
    choices: {
      ...eventsG.advisor_dies.choices,
      committee: { ...eventsG.advisor_dies.choices.committee,
        successText: '两位委员会成员愿意分担阅读，一位同事同意担任在册导师。你离开时，手里有了一个名字和一个会面时间。今天的日历上总算能填一项了。',
        failureText: '所有人都很难过，也都没有余力。系主任指定了在册导师，却没人主动分担阅读。你的第一封邮件，得从头解释课题。' },
      finish_it: { ...eventsG.advisor_dies.choices.finish_it,
        text: '接着做你们一起开始的那篇论文', hint: '花精力推进草稿、改善写作；更换导师。',
        result: '你先写了致谢，再回到摘要。草稿往前走了一点。导师的名字还在上面；投稿和审稿，都还没有发生。' },
    },
  },
};
export const successionStoryZh = {
  'A transfer is already arranged.': '已经安排了一次转学。',
  'There is no time left to complete a transfer.': '剩下的时间已不足以完成转学。',
  'Transfer arranged to {school}. Moving deposit: ${cost}. Arrival is next month; the new stipend and rent begin then.': '转学安排已确认：{school}。搬迁预付款：${cost}。下个月抵达，届时开始按新标准领津贴、付房租。',
  'The transfer arrangement no longer matches your advisor or program. The move is cancelled and the ${cost} deposit is refunded.': '这份转学安排已不再对应你目前的导师或项目。搬迁取消，${cost}预付款已退回。',
  'Arrived at {school} with your advisor and lab. The new housing starts at ${rent} a month, with a ${stipend} gross monthly stipend and {months} months of RA support. Completed academic work and your continuing committee are preserved; your former cohort stays in touch remotely.': '你随导师和实验室抵达{school}。新住处月租${rent}，税前月津贴${stipend}，有{months}个月的助研资助。已完成的学业成果保留，原委员会继续指导；老同学通过线上保持联系。',
  'The departmental transfer funding guarantee has ended. Your regular teaching and funding rules apply again this month.': '转学时确认的院系资助已到期。本月起，恢复通常的助教安排和资助规则。',
  'Archived message · replies closed': '历史消息 · 已关闭回复',
  'The pending advisor read of “{title}” is closed. The draft is intact; send it to your new advisor when you are ready.': '《{title}》原定的导师审阅已取消。草稿保留，准备好后可以发给新导师。',
  'Prof. {name} is now your advisor of record. Your completed milestones and paper authors stay as they were. Open requests from Prof. {old} are closed.': '{name} 教授现在是你的在册导师。已通过的阶段考核和论文作者不变；{old} 教授尚未完成的任务已撤销。',
  'Could you send me your current draft and a list of deadlines? We can use our first meeting to work out what needs attention first.': '能把目前的草稿和截止日期列表发给我吗？第一次见面，我们先理一理哪些事情最急。',
  'Select an unfinished, editable paper to take this path.': '这条路需要一篇尚未完成、可以编辑的论文。',
  'You already have an internship arranged.': '你已经安排了一份实习。',
  'There is no full summer left before your funding ends.': '资助结束前，已经没有足够时间完成一个暑期实习。',
  'Your advisor is off campus. Request a meeting in LabChat.': '导师不在本校。可以到 LabChat 预约视频讨论。',
  'Message remote advisor': '联系远程导师',
  'withdrawn': '已撤销',
};
