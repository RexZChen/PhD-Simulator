import { misc } from './misc.js';
import { asksStoryZh } from './research-story.js';

const dialogue = {
  "after_crisis": {
    "draft": "我还在恢复。能谈谈现在实际能承担多少工作吗？",
    "success": {
      "text": [
        "导师承认恢复需要纳入计划。截止日期还没动；至少这次谈话不再假装你能满负荷工作。"
      ],
      "reply": [
        "我们按你目前能承担的量来计划。哪些安排需要重新看看？"
      ]
    },
    "failure": {
      "text": [
        "导师表示理解，却没有调整工作量。允许休息的措辞很宽泛，任务清单却很具体。"
      ],
      "reply": [
        "当然，需要休息就休息。工作情况还是要告诉我。"
      ]
    }
  },
  "summer_money": {
    "success": {
      "text": [
        "暑期资助确认了。难得这次经费讨论以到账收尾，而不是以另一场讨论收尾。"
      ],
      "reply": [
        "暑期资助可以确认，用来支付生活开销。"
      ]
    },
    "failure": {
      "text": [
        "经费仍未确认。房租倒是确认得非常充分。"
      ],
      "reply": [
        "还没有确定的资助。"
      ]
    },
    "draft": "能确认一下今年夏天的资助吗？我希望房租能靠实际的经费安排，而不是对您上一封邮件的乐观解读。"
  },
  "after_reject": {
    "success": {
      "text": [
        "导师把缺少证据和表述不清分开。你理清了部分论证，也找到了下一项要做的对比。重投仍得靠你，但不再是一团迷雾。"
      ],
      "reply": [
        "先分清哪些需要新证据，哪些需要解释清楚。从核心论断开始。"
      ]
    },
    "failure": {
      "text": [
        "分析到此结束。情绪上很解气，执行上毫无帮助。"
      ],
      "reply": [
        "审稿人2错了。"
      ]
    },
    "draft": "关于《{project}》，哪些审稿意见意味着要重做研究，哪些只需要把解释写清楚？"
  },
  "why_quiet": {
    "draft": "最近不太联系得上您。有没有更合适的方式，标明最需要先答复的问题？",
    "success": {
      "text": [
        "导师承认一直没及时回复，也说明沉默不是对你工作的评价。这封回信解释了之前的空白，却没有承诺下一次何时填上。"
      ],
      "reply": [
        "我最近回复得慢，这不代表我对你的工作有意见。下次发消息，请把最急的问题放在最前面。"
      ]
    },
    "failure": {
      "text": [
        "回信确认了导师很忙，却没告诉你什么时候能联系上。"
      ],
      "reply": [
        "我现在很忙，暂时没法给你一个回复时间。"
      ]
    }
  },
  "authorship": {
    "success": {
      "text": [
        "你记下导师对作者排序的意向。投稿时，作者名单仍然需要对应实际贡献。"
      ],
      "reply": [
        "我的想法是由你主导这篇论文。把我们的共识记下来，投稿前再对照实际贡献确认。"
      ]
    },
    "failure": {
      "text": [
        "你问哪些贡献能确定排序。谈话结束时，还是没有书面标准。"
      ],
      "reply": [
        "先看看最后做成什么样。"
      ]
    },
    "draft": "能不能在投稿前就谈谈这篇的作者排序，而不是等到截稿那一周？"
  },
  "visa_help": {
    "success": {
      "text": [
        "签名拿到了，手续费用也付了。一个办公室完成了它的环节，后面的流程仍然要走。"
      ],
      "reply": [
        "表格签好了。下一步再和办公室确认。"
      ]
    },
    "failure": {
      "text": [
        "没有收到带签名的答复。表格还在等，办公室的截止日期却不会陪着等。"
      ],
      "reply": null
    },
    "draft": "我的身份手续需要院系签字，办公室说必须由您签。就是一张表和一个日期。"
  },
  "labmate_left": {
    "draft": "最近有人离开了，我想确认自己的处境有没有变化。不需要了解别人的私事。",
    "success": {
      "text": [
        "导师把别人的离开与你自己的处境分开谈，没有拿对方的私事来安慰你。"
      ],
      "reply": [
        "你的情况要单独讨论。对方离开这件事本身，不改变你的工作计划。"
      ]
    },
    "failure": {
      "text": [
        "这句话本想让你安心，却没有提供任何与你自身处境有关的具体信息。"
      ],
      "reply": [
        "那是不同的情况。"
      ]
    }
  },
  "postdoc_here": {
    "success": {
      "text": [
        "留下成为一个可以考虑的选项。这是工作机会，不是偿还实验室培养之恩的义务。"
      ],
      "reply": [
        "这里有这个可能。也继续看看别处，你的下一份工作不欠我。"
      ]
    },
    "failure": {
      "text": [
        "导师没有提供本组职位。去其他实验室是不是更好的下一步，仍要由你判断。"
      ],
      "reply": [
        "我没法给你本组的职位。你可以看看其他实验室。"
      ]
    },
    "draft": "如果我想留下，这里会有博后机会吗？我想早点问，这样即使答案是否定的，双方也不必为难。"
  },
  "cut_scope": {
    "success": {
      "text": [
        "论文范围缩小了，草稿也更清楚了。剩下的工作仍然要做。"
      ],
      "reply": [
        "保留支撑核心论断的部分，把扩展放到未来工作里。"
      ]
    },
    "failure": {
      "text": [
        "范围原封不动。故事更大了，并不会因此多出把它做完的时间。"
      ],
      "reply": [
        "更完整的故事才是贡献。"
      ]
    },
    "draft": "我觉得这其实是两篇论文硬凑成了一篇。我想先缩小范围，把能完成的那一篇投出去。"
  },
  "grant_help_ask": {
    "success": {
      "text": [
        "导师同意让你参与申请书工作。这次谈话并没有提交申请，更没有获得资助。"
      ],
      "reply": [
        "下一份申请书可以让你参与。先看看预算说明怎样对应研究计划。"
      ]
    },
    "failure": {
      "text": [
        "导师这次拒绝了，没有解释原因。你得到了答复，没有得到对方日程表的内幕。"
      ],
      "reply": [
        "这份先不用。"
      ]
    },
    "draft": "如果这轮要提交项目申请，我想参与一下。我是想积累这方面的经验，不只是想帮忙。"
  },
  "update": {
    "draft": "这是目前的情况、尚未解决的问题，以及我打算尝试的下一步。如果优先级需要调整，请告诉我。",
    "success": {
      "text": [
        "进度说明收到了。简短的一次交流，没有顺带发来新任务。",
        "导师确认收到了。回复到此结束。"
      ],
      "reply": [
        "谢谢，有帮助。",
        "收到了。"
      ]
    }
  },
  "leave": {
    "draft": "我想休息一周。能商量一下那段时间哪些事情需要交接或调整吗？",
    "success": {
      "text": [
        "一周休假获批。电脑会不会一直合着，不由这条消息决定。",
        "双方确认休假一周。批准只需一句话，腾出这段时间可能要久一点。"
      ],
      "reply": [
        "可以，休息一周吧。",
        "就休你申请的这一周。"
      ]
    },
    "failure": {
      "text": [
        "申请被认为时机不对。日历里最不缺的，就是关键阶段。",
        "导师让你再等等。这条答复并没有批准之后的休假。"
      ],
      "reply": [
        "现在？我们正处在关键阶段。",
        "等手头工作再推进一些，我们再谈好吗？"
      ]
    }
  },
  "sick": {
    "success": {
      "text": [
        "一周病假已记录。导师的理解不会自动改变外部截止日期。"
      ],
      "reply": [
        "先休息，回来后再谈工作。"
      ]
    },
    "failure": {
      "text": [
        "病假仍然生效。工作要求也跟着到了；这段对话没有替你发出任何图表。"
      ],
      "reply": [
        "知道了，还能发个进度说明吗？"
      ]
    },
    "draft": "我身体不太舒服——接下来几天我会离线。等能起来了我就马上接回去。"
  },
  "travel": {
    "draft": "能谈谈下一次会议出行的资助吗？决定出行前，我想先确认有哪些支持。",
    "success": {
      "text": [
        "下一次会议出行标记为有资助。这句行政用语值得装框。"
      ],
      "reply": [
        "你下一次会议出行，实验室可以承担费用。"
      ]
    },
    "failure": {
      "text": [
        "没有拿到差旅资助承诺。预算有归属，你没有。",
        "导师把你指向另一份申请。院系并没有因此发放资助。"
      ],
      "reply": [
        "差旅预算已经分配完了。",
        "试试院系的差旅资助。"
      ]
    }
  },
  "letter": {
    "draft": "您愿意为我的申请提供推荐吗？我可以发来简历和具体要求。",
    "success": {
      "text": [
        "可用的推荐已记录。难得这次，推荐信的安排有了明确答复。"
      ],
      "reply": [
        "我的推荐可以确定。申请材料记得保持更新。"
      ]
    },
    "failure": {
      "text": [
        "导师要求先看草稿，没有确认可用的推荐信。形容词现在归你操心。"
      ],
      "reply": [
        "先发一份草稿给我。"
      ]
    }
  },
  "meeting": {
    "draft": "能额外安排一次讨论吗？我想在投入更多时间前，先谈清下一步。",
    "success": {
      "text": [
        "额外讨论安排好了。议程从你原本想问的问题开始。"
      ],
      "reply": [
        "可以，我们一起谈谈。"
      ]
    },
    "failure": {
      "text": [
        "导师建议改用邮件。没有安排额外会面。",
        "导师推迟了请求，却没有约另一个时间。"
      ],
      "reply": [
        "我们用邮件说吧。",
        "现在排不出额外的会面时间。"
      ]
    }
  },
  "direction": {
    "success": {
      "text": [
        "你们商定缩小范围，下一步也更容易着手。这个小一点的盒子有门。"
      ],
      "reply": [
        "先把问题缩小一些。"
      ]
    },
    "failure": {
      "text": [
        "范围反而扩大了。解释也同样宏大。"
      ],
      "reply": [
        "范围本身就是贡献。"
      ]
    },
    "draft": "说实话，我觉得这个课题范围太大，很难好好完成。能不能缩小到已经做通的部分，先写出来？"
  },
  "timeline": {
    "success": {
      "text": [
        "你们列出了准备步骤。这能帮助备考，不会改变正式考试日程。"
      ],
      "reply": [
        "先列出要准备什么，再从考试日期往回排。"
      ]
    },
    "failure": {
      "text": [
        "话题被带回研究。备考计划仍然没有更清楚。"
      ],
      "reply": [
        "先把研究做好。"
      ]
    },
    "draft": "我们能不能画一个到资格考的时间线？我想知道您期待我做到什么、大概什么时候，这样我可以据此安排整个学期。"
  },
  "more": {
    "success": {
      "text": [
        "会面频率提高一档。双方都没有保证每次会开得短。"
      ],
      "reply": [
        "我们增加会面频率。"
      ]
    },
    "failure": {
      "text": [
        "会面频率不变。导师用日历作了解释，日历却没给你留空位。"
      ],
      "reply": [
        "目前的日程安排不了更多会面。"
      ]
    },
    "draft": "我觉得如果沟通更频繁一些我会推进得更快——哪怕每周十五分钟。您的日程能安排得下吗？"
  },
  "less": {
    "success": {
      "text": [
        "会面频率降低一档。是否发送书面进度，仍由你选择。"
      ],
      "reply": [
        "可以减少会面。有需要讨论的事时，发书面进度给我。"
      ]
    },
    "failure": {
      "text": [
        "导师用一句没有文献支持的论断拒绝了调整。"
      ],
      "reply": [
        "会开得少，论文就发得少。"
      ]
    },
    "draft": "我想试一段时间：少开会，多用书面进展汇报。每次开会前后我基本会损失一整天，我更想把那一天花在实验上。"
  },
  "coauthor": {
    "success": {
      "text": [
        "导师同意多一个人会有帮助。谁实际参与，以课题记录为准。"
      ],
      "reply": [
        "好主意，可以请组里的人参与。"
      ]
    },
    "failure": {
      "text": [
        "导师倾向于保持现有团队。团队小，不等于人手够。"
      ],
      "reply": [
        "暂时保持现在的团队吧。"
      ]
    },
    "draft": "能不能再请一个人参与？评估工作多一个人手，我们赶到截止日期时至少不会太难看。"
  }
};

export const asksDialogueZh = Object.fromEntries(Object.entries(dialogue).map(([id, patch]) => {
  const base = { ...misc.asks[id], ...asksStoryZh[id] };
  return [id, { ...base, ...patch,
    ...(patch.success ? { success: { ...base.success, ...patch.success } } : {}),
    ...(patch.failure ? { failure: { ...base.failure, ...patch.failure } } : {}),
  }];
}));

// Legacy outgoing messages stored the English draft as a flat source key.
export const askDraftCompatibilityZh = {
  "I am still recovering. Can we discuss what I can realistically take on right now?": "我还在恢复。能谈谈现在实际能承担多少工作吗？",
  "Can we confirm support for this summer? I would like the rent to depend on a funding arrangement rather than an optimistic reading of your last email.": "能确认一下今年夏天的资助吗？我希望房租能靠实际的经费安排，而不是对您上一封邮件的乐观解读。",
  "For “{project}”, which reviewer concern changes the work, and which needs a clearer explanation?": "关于《{project}》，哪些审稿意见意味着要重做研究，哪些只需要把解释写清楚？",
  "I have had trouble reaching you. Is there a better way to flag the question that needs an answer first?": "最近不太联系得上您。有没有更合适的方式，标明最需要先答复的问题？",
  "Can we talk about author order on this one before it goes out, rather than in the week it goes out?": "能不能在投稿前就谈谈这篇的作者排序，而不是等到截稿那一周？",
  "My status paperwork needs a signature from the department and the office says it has to come from you. It is one form and a date.": "我的身份手续需要院系签字，办公室说必须由您签。就是一张表和一个日期。",
  "After the recent departure, I would like to discuss whether anything about my own situation has changed. I do not need anyone else’s private details.": "最近有人离开了，我想确认自己的处境有没有变化。不需要了解别人的私事。",
  "Would there be a postdoc here, if I wanted one? I am asking early so that the answer can be no without either of us minding.": "如果我想留下，这里会有博后机会吗？我想早点问，这样即使答案是否定的，双方也不必为难。",
  "I think this is two papers pretending to be one. I would like to cut it and send the smaller thing now.": "我觉得这其实是两篇论文硬凑成了一篇。我想先缩小范围，把能完成的那一篇投出去。",
  "If a proposal is going out this cycle, I would like to work on it. I am asking because I want the experience, not because I want to be useful.": "如果这轮要提交项目申请，我想参与一下。我是想积累这方面的经验，不只是想帮忙。",
  "Here is my current status, what remains unresolved, and what I plan to try next. Please let me know if the priority should change.": "这是目前的情况、尚未解决的问题，以及我打算尝试的下一步。如果优先级需要调整，请告诉我。",
  "I would like to take a week off. Can we discuss what would need to be covered or moved around that time?": "我想休息一周。能商量一下那段时间哪些事情需要交接或调整吗？",
  "I am not well — I am going to be offline for a few days. I will pick things up as soon as I am upright.": "我身体不太舒服——接下来几天我会离线。等能起来了我就马上接回去。",
  "Can we discuss funding for my next conference trip? I would like to know what support is available before committing to travel.": "能谈谈下一次会议出行的资助吗？决定出行前，我想先确认有哪些支持。",
  "Would you be willing to provide a recommendation for my applications? I can send my CV and the requirements.": "您愿意为我的申请提供推荐吗？我可以发来简历和具体要求。",
  "Could we arrange an extra discussion? I would like to talk through the next steps before committing more time.": "能额外安排一次讨论吗？我想在投入更多时间前，先谈清下一步。",
  "Honestly, I think the project is too broad to finish well. Could we cut it down to the part that already works and write that up?": "说实话，我觉得这个课题范围太大，很难好好完成。能不能缩小到已经做通的部分，先写出来？",
  "Could we sketch a timeline to the prelim? I would like to know what you expect from me and roughly by when, so I can plan the semester around it.": "我们能不能画一个到资格考的时间线？我想知道您期待我做到什么、大概什么时候，这样我可以据此安排整个学期。",
  "I think I would move faster with more frequent check-ins — even fifteen minutes weekly. Would that work for your calendar?": "我觉得如果沟通更频繁一些我会推进得更快——哪怕每周十五分钟。您的日程能安排得下吗？",
  "I would like to try fewer meetings and more written updates for a while. I lose most of a day around each one and I would rather spend it on the experiments.": "我想试一段时间：少开会，多用书面进展汇报。每次开会前后我基本会损失一整天，我更想把那一天花在实验上。",
  "Could we bring someone else onto this? A second pair of hands on the evaluation would get us to the deadline in a state I am not embarrassed by.": "能不能再请一个人参与？评估工作多一个人手，我们赶到截止日期时至少不会太难看。",
  "I have not heard from you in a few weeks and I would rather ask than guess. Is everything all right on your end?": "有几周没收到您的消息了，我想直接问问，而不是自己猜。您那边还好吗？"
};
