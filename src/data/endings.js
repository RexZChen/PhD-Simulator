// What you end up as. Twelve outcomes, each written in the register of the fired/quit endings:
// the institution is absurd, the person never is, and nobody is called a failure.
export const trackEndings = {
  tenure_track: {
    title: "Assistant Professor",
    text: "The department sends a welcome message and a spreadsheet for the startup budget. Your name is on an office door. The first student who asks to work with you wants to know what the project would involve; the spreadsheet wants to know which account will pay for it.\n\nYou begin an agenda of your own alongside the courses, proposals, and committee invitations. They cannot all be first. For the first time, someone else may organize their week around how you answer that question.",
  },
  teaching_faculty: {
    title: "Teaching Professor",
    text: "The course site contains last year’s slides, three broken links, and a welcome message addressed to someone else’s students. You start with the first class. Before it ends, a student asks a question that the inherited slides do not answer.\n\nPreparing a useful answer takes time. So do grading, office hours, and documenting the work for your next review. The workload form counts the hours in the classroom very precisely. You start a second list for the hours that make them possible.",
  },
  postdoc: {
    title: "Postdoctoral Researcher",
    text: "Your new account works before your building access does. The PI sends a draft project plan and asks what you would change. The contract has an end date; the project plan has several arrows pointing beyond it.\n\nThere is room here to pursue the problem, and work to do before you know how much. You put research milestones and application dates in the same calendar. The calendar accepts both without asking whether the experiment will cooperate.",
  },
  national_lab: {
    title: "Staff Scientist",
    text: "The badge gets you through the front door. The instrument account requires another approval. A colleague shows you a facility you used to know from papers, then explains which part is waiting for a replacement component.\n\nThe work belongs to a larger mission, with a budget and reporting requirements attached. Before sharing a result outside the lab, you learn the release process. The experiment, the funding cycle, and the approval queue each keep their own time.",
  },
  industry_research: {
    title: "Research Scientist",
    text: "You can launch the experiment once the compute allocation is approved. The team has people who understand the problem and a roadmap that explains why the company currently wants it solved. At the first meeting, someone asks what a useful negative result would look like.\n\nYou begin a research plan and learn the publication review process. A result may become a paper, a product change, or an internal document. Those routes need different kinds of evidence, and the roadmap can change before any of them is ready.",
  },
  product_eng: {
    title: "Software Engineer",
    text: "Your first task is a bug with steps to reproduce it. Step three does not reproduce it. A teammate helps you find the missing condition, and your first change goes into review with a comment about a variable name.\n\nThe team needs working software, explanations other people can use, and estimates for work you have not done yet. Some research habits help; some need adjusting. The backlog contains enough unsolved problems. Deciding which ones deserve a week is now part of the job.",
  },
  quant: {
    title: "Quantitative Researcher",
    text: "The first backtest looks promising. A colleague asks about transaction costs, and the line on the chart becomes less promising. You save both versions. The review meeting spends most of its time on the assumptions beneath the graph.\n\nThe work brings data access, confidentiality rules, and decisions with money attached. A good result in the past is not a promise about the next trade. You start learning how the team sets limits, and how to explain work that will not appear on your public page.",
  },
  founder: {
    title: "Cofounder",
    text: "The company has a name, a demo, and a spreadsheet showing how long the money lasts. A prospective customer likes the demo and asks whether it can do something it currently cannot. Nobody asks about the theorem.\n\nYou have decisions to make about the product, ownership, and what you can afford to promise. Research still matters, but it shares the week with invoices and calls. The next milestone is getting someone to use the thing when you are not standing beside it.",
  },
  soft_money: {
    title: "Research Scientist, university",
    text: "The new title is in the directory. The codebase still needs a release, and two students want help before lunch. Your appointment is tied to project funding; the dependency list does not have an end date.\n\nYou begin negotiating what you can maintain, what needs another person, and how the work will be credited. New features have a place in the proposal template. Keeping old features working takes a little more explanation, usually after one stops.",
  },
  abroad: {
    title: "Faculty or researcher, outside the US",
    text: "The offer becomes an address, a local account, and a folder of documents whose names you are still learning. A colleague explains how this institution works. Another colleague gives a different explanation. You keep both sets of notes.\n\nThe contract sets some expectations; the first weeks reveal others. You begin fitting the work around the commitments you brought with you, while old collaborations now require more scheduling. The move changes the practical questions. It does not supply one agreed reason for having moved.",
  },
  policy: {
    title: "Research Fellow",
    text: "The first brief needs to fit on two pages. The evidence does not. You ask who will read it, what decision it informs, and which uncertainties the deadline leaves time to investigate. The template has more room for recommendations than caveats.\n\nYour research training helps with the sources. You are learning how budgets, consultation, and implementation change what can be recommended. A careful paragraph may shape a decision or remain in an attachment. You start finding out who reads the attachments.",
  },
  unplaced: {
    title: "Kept on File",
    text: "No position is signed when you finish. The application spreadsheet has dates, contacts, and several versions of the word pending. You check which university access ends when, and what expenses need covering next.\n\nThe degree is complete; the employment question is open. You can follow up, widen the search, ask for practical help, or reconsider what you want to pursue. Those choices have costs and constraints. None requires you to turn this interval into an inspiring story before you have lived it.",
  },
};

// The exits: the ways a run stops that are not a job title. Each one gets the same courtesy as the
// track endings — the system is the absurd thing, the person is not, and nobody here is a failure.
// Called through a function so the strings go through t() at the moment they are read, which is how
// they re-translate when the language is switched mid-run.
import { t } from '../i18n/index.js';
// Ordinary departures have a next page, without promising a salary, a cure, or a return.
export const ordinaryExitEpilogues = {
  abd: 'You save the unfinished dissertation with the code and the notes. The filename still says draft. The work has a place in the archive even without a defense date; whether you return to it is a question for another calendar.',
  master: 'The transcript lists the master’s degree. Ordering a copy costs twelve dollars. You put it beside the work you can show and start deciding which parts belong on the next application.',
  industry: 'The new job has its own forms, acronyms, and people who know where things are kept. When someone asks about the PhD, you give the version you want to give. Then the conversation returns to the work in front of you.',
  burnout: 'The calendar has an empty space where group meeting used to be. At first you still check the time. There is no recovery deadline in the space, and no progress report to send about it.',
  advisor: 'The office asks for a preferred next advisor on a form you have not yet decided to submit. You leave the field blank while asking what can transfer and what cannot. A blank field is not an agreement to start over.',
  no_offer: 'You put the application materials in a folder with the year on it. They are available if you choose another cycle. The next calendar could contain applications, work, or something you were postponing; none of those decisions is due tonight.',
  fail: 'You request the committee’s written decision and a record of the coursework you completed. The decision does not change. The record is more specific than the word you have been using for the whole experience.',
  startup: 'The prototype reaches someone who was not in the lab. Their first question is about a button, not the method. You write it down. Whether there is a business here is still a question, and this is a different way of investigating it.',
};
export const exitEndings = () => ({
  burnout: [t('Burnout Exit'), t('You leave the program. Recovery no longer has to fit between meetings. The withdrawal form still asks for an expected return date.')],
  startup: [t('Startup Escape'), t('You leave to work on the product. There is no committee to approve it; there are customers who may not want it.')],
  advisor: [t('Advisor Breakdown'), t('This advising arrangement cannot continue. The department has a form for changing it, and questions the form does not answer.')],
  industry: [t('Industry Escape'), t('You accept the offer and arrange the handover. The research files stay in the lab; you keep a permitted copy of your own work.')],
  master: [t('Mastered Out'), t('You leave with an MS. The department changes the degree line in its records. You keep the completed work and the questions that remain open.')],

  inherit: [t('Managing Director'), t('You are on a plane within nine days, which is the fastest you have moved on anything in four years.\n\nThe firm is smaller than the story about the firm and it is also entirely real: forty-one people, a payroll, a warehouse, and a spreadsheet your father maintains by hand and understands completely. You rebuild it in a week. Everyone is amazed. You are quietly embarrassed at how easy the first thing you did here was.\n\nWhat surprises you is that the PhD training is the part that transfers, and not the way anyone would have predicted. Not the topic. The habit of sitting in front of something that does not make sense yet, on purpose, without flinching, for as long as it takes. Nobody in that building has been trained to do that and you cannot un-know it. Two years in you fund a scholarship at your old department, anonymously, and specify that it is for the fifth year, because you remember exactly which one nobody funds.')],

  hospital: [t("Medical Withdrawal"), t("You choose to leave this programme and make room for care. The office records a withdrawal date. Your completed work does not disappear, even though the student portal puts it behind a different tab.\n\nThere are practical questions about money, housing, and what support continues. Those need answers; they do not need to become a story about your discipline. This run ends here. It does not decide whether you return to study, change direction, or need more time.")],

  posthumous: [t("In Memoriam"), t("The department sends a notice, and the people who knew you receive it in different places. There is work left unfinished. There are also relationships, conversations, and ordinary days that no publication list records.\n\nThe notice has a place for your name and your affiliation. It has much less room for what people remember. The institutional record is not the whole life.")],

  institution: [t("Stepping Away for Care"), t("You choose medical withdrawal rather than returning to the same workload. The support office helps you record the next steps. The department still asks for an expected completion date; for once, you leave that field unanswered.\n\nLeaving the programme does not resolve everything, and returning is not a condition of having recovered. Your care and your future continue beyond what this transcript can record.")],

  perpetual: [t('The Institution'), t('Year seven. Then eight, and the ones after that stop having numbers.\n\nYou know where the master key is kept, which radiator makes the noise, how to get a purchase order through in a day, and the name of every person who has cried in the fourth-floor kitchen since 2029. Three faculty have arrived and two have left. The first-years assume you are staff and you have stopped correcting them because the correction takes longer than the conversation.\n\nThe dissertation is done. It has been done for a while. What is not done is the sentence where you say it is done, because the day after that sentence you are a person with a doctorate and no building, and this building is the only place on earth where the thing you are best at is legible.\n\nEverybody in this hallway thinks you are stuck. What you actually are is at home, in a way that will end anyway when the grant does. It ends in the spring. You are fine. You were always going to be fine — you just wanted to be here when it happened.')],

  spinout: [t('Founder, and the University Owns a Piece'), t('The round closes in September and you are, on paper, the chief executive of a company built on a method you invented in a windowless room in year three.\n\nThe cap table is the honest document. The university has a slice, because you assigned it on day one in a stack of enrolment forms nobody read to you and which you had no ability to negotiate. Your advisor has a slice roughly the size of the one you kept, for a board seat, a name on a website, and — to be completely fair — one introduction that was worth more than any quarter of your own work. Everybody was delighted for you throughout. Nobody was lying.\n\nWhat nobody tells you: the research was the easy part. It was hard, but it was the part you knew how to do. Now it is hiring, and payroll, and a customer who wants a feature that is scientifically uninteresting and commercially decisive, and you say yes, and you are right to say yes, and something in you notices.\n\nFour years on it is a real company with forty people in it, or it is a good story and a soft landing. You cannot know which for a while yet. Either way you have done the thing the whole degree was secretly training you for, which is to hold something that does not exist yet in your head for years without external evidence that it should. Nobody else can do that. It is the only part of this that was ever yours alone, and it is the part no cap table has a line for.')],
  deported: [t('Removed'), t('You get thirty days and you use nine of them. The lab helps you pack. Someone drives you to the airport at four in the morning and neither of you says very much, and the goodbye at the barrier is the worst two minutes of the entire six years and lasts about eleven seconds.\n\nThe work is not confiscated. That is the thing nobody expects: it is on a laptop and in a repository and in your head, and none of those are subject to the order. Your advisor keeps you on the paper. It goes in from an address in another country and it is accepted and your affiliation line reads differently and means the same.\n\nWhat you actually lose is the room — the corridor conversation, the whiteboard, being ten metres from the person who knows the answer. That is not recoverable and there is no version of this where it is. So you rebuild it. It takes four years and it is somewhere else and it is smaller and it is yours, and there is a student in it now who is on a visa, and you are extremely careful with them in ways you never explain.')],
});
