export const lifeStoryEvents = {
  relationship_strain: {
    title: '“哪一个截止日期？”',
    text: '“哪一个截止日期？”伴侣问。你开始报会议的名字。对方问的不是这个。',
    choices: {
      weekend: { text: '腾出时间，合上电脑', hint: '照顾关系；初稿先放一放', result: '你听对方说话，没有在另一个窗口里改段落。谈完以后，工作还在。这次谈话也留下了点什么。' },
      explain: { text: '请对方等这次投稿结束', hint: '现在继续工作；这件事还没谈妥' },
    },
  },
  relationship_checkin: {
    title: '一份没附议程的邀请',
    text: '伴侣发来周六的日历邀请。两个小时。“这次能不挪了吗？”邀请上那个“接受”按钮，和导师约你开会时的一模一样。',
    choices: {
      keep: { text: '接受邀请，把时间留出来', hint: '初稿可以等；这次约定不再等', result: '这次你挪的是工作，不是邀请。两小时解决不了所有事。下一个安排，你们一起定。' },
      postpone: { text: '再请求延期一次', hint: '现在有科研进度；这段关系未必还会等', result: '对方拒绝了新的时间，没有另约。' },
    },
  },
};
