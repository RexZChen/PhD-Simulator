import { events } from './events.js';

// Local outcomes keep the pressure in the room without inventing a player's history or future.
const patches = {
  "group_praise_public": {
    "text": [
      "“开始之前说一下——{you}有篇论文被{venue}录用了。”掌声持续了大约四秒。然后：“我说的把项目做到底，就是这个意思。”\n\n掌声是给你的。第二句话附带的眼神，分给了桌边其他人。",
      "“{you}的论文中了{venue}。”导师把会议名念得稍慢，让它落到实处。“把稿子投出去。这很重要。”最后几个字，是看着整张桌子说的。\n\n两个人记了点东西。其中一个记的不是祝贺。",
      null
    ],
    "choices": {
      "uncomfortable": {
        "result": "夸奖是真的。给其他人的指令也是真的。你记下会议名；至于那番比较，就留在桌子另一边。"
      }
    }
  },
  "group_round_thin": {
    "choices": {
      "deflect": {
        "result": "十一个词，一个句号。{advisor}停了一下，像是在等一个数字，然后叫了下一个人。你的汇报结束了；后面那段空白，声学效果很好。"
      }
    }
  },
  "group_round_strong": {
    "choices": {
      "credit": {
        "result": "你说出脚本的名字，也说出写它的人。对方抬起头，说了声“谢谢”。下一个问题是脚本怎么工作的，这次轮到对方回答。"
      }
    }
  },
  "group_public_correction": {
    "text": [
      "讲了两分钟，{advisor}打断：“那张图不是这个意思。”屋里忽然安静下来，所有人都来了兴趣。会议室有时候就是这样。",
      "你报出数字。{advisor}说：“这不可能。”也许不是存心让你难堪，但声音很大，谈的是你的工作，全屋都听得见。"
    ],
    "choices": {
      "check": {
        "hint": "风险高；把证据摆到屏幕上",
        "successText": "你调出笔记本，带大家逐步看了一遍。数字没错。{advisor}说：“行——很好。”下一个问题开始讨论方法，而屏幕还在你手里。"
      },
      "fold": {
        "hint": "结束这轮对话；证据还没核对",
        "result": "你说：“哦——可能是您说得对。”幻灯片翻了页。还没有人查过笔记本，但那句质疑已经成了这张图的结论。"
      }
    }
  },
  "group_laughed_at": {
    "choices": {
      "carry": {
        "result": "你把汇报讲完了。那位高年级学生低头看手机。没人问刚才的打断是怎么回事；{advisor}问起了基线。"
      },
      "name": {
        "successText": "对方脸红了：“没事，抱歉——你继续。”散会后，在烧水壶旁，对方又道了一次歉，这回没有观众。至少这次汇报余下的时间，大家在听你说。"
      },
      "after": {
        "result": "对方给你看手机上的消息：笑的是那个，不是你的汇报。“时机太差了，抱歉。”九十秒的对话，补上了刚才全屋人都缺的背景。"
      }
    }
  },
  "group_someone_else": {
    "choices": {
      "support": {
        "hint": "花一点精力；给出具体的支持",
        "result": "你指出有效的部分，也解释了为什么。{labmate}终于不用替整个项目辩护，能停下来讨论这个结果。屋里有了一个可以继续往下谈的起点。"
      }
    }
  },
  "group_derail": {
    "choices": {
      "notes": {
        "hint": "从争论里找出一个有用的问题",
        "result": "争论底下，是大家对什么才算证据意见不一。你把两套标准并排记下来。会议没有得出决定，但你的笔记里多了一个研究问题。"
      }
    }
  },
  "group_visitor": {
    "choices": {
      "normal": {
        "result": "你照平常的方式汇报。结束后，访客问{advisor}刚才是谁讲的。你的名字又被说了一遍，这次听的人来自实验室外。"
      }
    }
  },
  "group_reading": {
    "choices": {
      "cancel": {
        "result": "好几个人同时打开日历。有人问下次讨论前重点读哪一节。大家已经同意去读论文；PDF 本人还没有收到这个消息。"
      }
    }
  },
  "group_your_turn_again": {
    "text": [
      "幻灯片打开，标题很熟悉。多了一张新图。图是好图，也就这一张。",
      "日历上写着“进展汇报”。项目没有征求过日历的意见。你有一张新图，却被分到了足够讲一个完整故事的时间。"
    ],
    "choices": {
      "honest": {
        "failureText": "“就这些？”{advisor}等着。有人转头又看了一眼那张图，试图找到并不存在的第二个结果。"
      }
    }
  }
};
// These scenes use present work and named participants, rather than invented prior contributions.
patches.group_nobody_read = {
  text: ['你打开《{project}》目前的草稿。“有人来得及读一下吗？”一阵沉默。第一个问题是：“抱歉，再说一下这是做什么的？”',
    '草稿放到了屏幕上。桌边的人同时开始读开头。这场会议有了一个现场加载进度条。'],
  choices: {
    rebook: { text: '先停在这里，请大家准备后再讨论', hint: '现在省些精力；尚未得到反馈，也没有约好新时间',
      result: '大家都同意提前阅读会有帮助。新的时间还没约。眼下，草稿仍归你管，这个时段剩下的时间却不必再由你撑着。' },
  },
};
patches.group_round_strong = {
  text: '轮流汇报，每人三十秒。《{project}》已经推进到可以讲清方法、说明还需要检查什么的程度。{labmate}合上电脑来听。计时器没这么体贴。',
  choices: {
    plain: { result: '你讲清方法和最主要的局限，然后停下。{advisor}问了一个关于下一步的问题。难得这次，问题也能装进分配给你的时段里。' },
    long: { text: '用三分钟解释细节', hint: '讲得更细；留给别人的时间更少',
      result: '你讲了细节，又解释每个细节为什么重要。大家还能跟上，下一位发言的人却在看钟。属于对方的三十秒，已经开始给你交房租。' },
    credit: { text: '请{labmate}质疑一下下一步计划', hint: '让出一点发言时间，增进真实的工作关系',
      result: '你问{labmate}接下来会检查什么。对方请你讲清一个假设。汇报变成了讨论，而且你没有顺手替对方认领那个实验。' },
  },
};
patches.group_public_correction = {
  text: ['讲了两分钟，{advisor}打断：“你展示的这些，推不出那个结论。”屋里忽然安静下来，所有人都来了兴趣。会议室有时候就是这样。',
    '你解释《{project}》中的一个步骤。{advisor}说：“这不可能。”质疑是否成立，还没有弄清。声音很大，这一点所有人都弄清了。'],
  choices: {
    check: { hint: '风险高；把证据摆到屏幕上',
      successText: '你逐步解释推理，找出了质疑背后的假设。在这一点上，你的解释站得住。{advisor}说：“行——很好。”讨论转向还有哪些地方需要检验。',
      failureText: '逐步解释论证时，一个缺口露了出来。你没法当场解决。好处是知道了要查什么；投影仪让这个发现格外公开。' },
    note: { hint: '把核查留到之后；不等于承认结论有错',
      result: '你记下质疑，回到议程。这个论断仍未核实。至少下一次检查有了一个具体问题，而不只是一档音量。' },
    fold: { hint: '结束这轮对话；推理还没核对',
      result: '你说：“哦——可能是您说得对。”幻灯片翻了页。还没有人查过推理，但那句质疑已经成了这个论断的定论。' },
  },
};
export const groupStoryEvents = Object.fromEntries(Object.entries(patches).map(([id, patch]) => {
  const base = events[id];
  return [id, {
    ...base, ...patch,
    ...(patch.text ? { text: Array.isArray(patch.text) ? patch.text.map((text, i) => text ?? base.text[i]) : patch.text } : {}),
    choices: Object.fromEntries(Object.entries(base.choices).map(([choiceId, choice]) =>
      [choiceId, { ...choice, ...patch.choices?.[choiceId] }])),
  }];
}));
