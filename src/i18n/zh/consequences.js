const c = (text, hint, extra = {}) => ({ text, hint, ...extra });
export const consequenceEventsZh = {
  stipend_late: {
    title: '津贴“处理中”',
    text: '薪资部门“换了新系统”。新系统把你的名字拼成了新样子。可惜房租还用旧系统。',
    choices: {
      wait: c('等修好', '现在少发1,200美元；下个月补回'),
      emergency: c('向研究生院申请预支', '沟通检定；成功则用预支款补上延迟的1,200美元', {
        successText: '一张纸质支票补上了延迟的1,200美元。你的可用余额不变；薪资部门会在内部结清预支款。这张纸总算干了一件有用的事。',
        failureText: '“我们可以升级处理。”这1,200美元仍要等下个月补发。升级申请有了工单号；房东不收工单号。',
      }),
    },
  },
  stipend_fix: {
    title: '薪资部门道歉了',
    text: '薪资部门准备补回上次少发的1,200美元。道歉信同时也是一份问卷。',
    choices: { ok: c('收钱，跳过问卷', '补回1,200美元；结清这次欠款', {
      result: '少发的1,200美元到账了。这次工资已经结清。问卷仍然可以不填，房租可不行。',
    }) },
  },
  parents_visa: {
    title: '拒签，214(b)',
    text: '答辩日期定下来后，你父母申请来参加。他们的申请被拒了。信上勾了一个框；你的日历上仍写着答辩室的房间号。\n\n你母亲问，会有视频连线吗。你还没安排。现在还有时间决定怎么办。',
    choices: {
      reapply: c('花钱再申请一次', '钱，和一次抛硬币', {
        successText: '这次申请获批了。你把答辩日期发给他们，也解释了通过答辩后还要修改、存档。你父亲问，那间屋子冷不冷。',
        failureText: '这次申请也被拒了。520美元已经花掉。你把消息告诉他们；答辩日期没有变。',
      }),
      stream: c('架个摄像头，就当是一回事', '它不是一回事', {
        result: '你测试了视频连线，发出答辩当天的邀请。你母亲比你先找到了取消静音的按钮。答辩本身还没开始。',
      }),
      after: c('计划存档后回家庆祝', '先留着回家的打算；以后成行才付900美元路费', {
        result: '你们说好，等学位论文存档后再商量这趟行程。舅舅愿意出场地和手机摄像头。机票还没买，仪式也还没发生；现在，你有了一个能告诉家人的计划。',
      }),
    },
  },
};

export const consequencesZh = {
  'After the defense, you stay on the video call with your parents. They heard the questions and the result. You explain that the revisions and deposit still come next.': '答辩结束后，你继续和父母视频。他们听到了提问和结果。你解释说，接下来还要修改论文、办理存档。',
  'The travel is already paid for. There is no second charge.': '这趟行程已经付过款，不会再次扣钱。',
  'Making the trip costs $900. You can also leave the visit for another time.': '这趟行程需要900美元。你也可以以后再回去。',
  'The family celebration waits until the degree is deposited.': '家里的庆祝要等学位论文存档后再举行。',
  'Inventor names are unavailable in this record.': '这份记录没有可确认的发明人姓名。',
  'The photograph can happen now': '现在可以拍那张照片了',
  'Your degree is deposited. Your family returns to the idea of celebrating at home. Your uncle still has a room and a phone camera. Neither requires a committee signature.': '学位论文已经存档。家人又提起回家庆祝的打算。舅舅仍有场地和手机摄像头。这两样都不需要委员会签字。',
  'Make the trip': '回去一趟',
  'At the family celebration, your uncle helps with the hood while someone else holds his phone. There are several photographs. For once, none is a required attachment.': '家里的庆祝会上，舅舅帮你披好学位兜帽，另一个人替他拿着手机。你们拍了好几张照片。终于，没有一张是必交附件。',
  'Leave the visit for another time': '以后再回去',
  'You tell them the visit has to wait. They congratulate you on the call. The degree is finished; the family photograph can wait for a date that works.': '你告诉他们，这趟行程还得等等。他们在电话里向你道贺。学位已经完成；全家的合照可以等到合适的日子。',
};
