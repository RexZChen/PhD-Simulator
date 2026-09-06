# US CS PhD Simulator — Academic OS

A satirical life-and-research simulation about doing a computer science PhD in the United States,
presented as a deliberately dated desktop operating system. It runs entirely in your browser: no
backend, no account, no telemetry. A full run starts with graduate applications, continues through
prelims, the proposal, papers, conferences, the dissertation, the defense and the job market, and
then keeps going — because a PhD does not end at graduation, and neither does your advisor.

The tone it is aiming for: **miserable and enjoyable at once.** A PhD is not for everyone, it is
genuinely hard, you go through a lot — and over a long enough horizon it is worth it. You start as
a first-year who knows nothing and end, if you get there, as someone who knows what they are doing.

---

## Disclaimer

**This is a vibe-coded side project, made for fun. It is not an attack on anyone.**

Everything in it is invented. Every school, advisor, labmate, committee member, company, employer,
lab and venue is fictional or a parody placeholder; names are generated at random from made-up
lists. Any resemblance to real people, institutions or venues — living, dead or tenured — is
coincidental and unintended. Nothing here is affiliated with, endorsed by, or advice about any real
program, employer or person.

Salaries, fees, visa outcomes, medical bills and acceptance rates are made up for comic effect and
are **not advice** — not financial, medical, immigration, career or academic advice. Venue timing is
modelled on representative published 2025–2027 cycles and projected forward into fictional years; it
is not a live deadline calendar. Real city names and their landmarks appear affectionately as travel
settings, and nothing said about them is a claim about any real business or organisation.

The satire is pointed at *systems and situations* — funding gaps, review lotteries, immigration
paperwork, the job market — and not at individuals. If any of it lands close to home, that is
because these situations are widely shared, not because anyone in particular was in mind.

---

## Run it

**Play it now: [rexzchen.github.io/PhD-Simulator](https://rexzchen.github.io/PhD-Simulator/)** — no install, no account, nothing saved anywhere but your own browser.

Or run it locally:

```bash
npm install
npm run dev
```

Open the address Vite prints. The game autosaves to browser LocalStorage. Sound is synthesized in
the browser and can be muted from the system tray. English and 简体中文 are both complete and can be
switched at any point mid-run, including for mail and chat you have already received.

```bash
npm test          # 87 deterministic engine tests (node --test)
npm run test:e2e  # 19 Playwright browser flows (uses installed Google Chrome)
npm run build     # production build
npm run balance   # 40 seeds x 3 playstyles; prints outcome and economy distributions
```

## What is in it

**Applications.** A preparation budget, three recommenders with hidden reliability, an "optional"
GRE, fee waivers, email threads with prospective advisors and their current students, 22 parody
programs with generated crests, interviews, waitlists that move in April, and visit days where
people tell you true things about advisors if you ask well.

**Variable time.** Calm months resolve in one step. Deadline weeks and rebuttal windows drop to
week-by-week. When a deadline is genuinely close, the game drops again to **day by day** — five
working days a week, with coffee (temporary energy, a later mental-health bill, and dizziness past
a threshold), skipped lunches, pop-in advisor meetings, and labmate conversations that change how
the week goes.

**Papers.** 24 fictional venues whose month-level timing follows representative real cycles.
Every paper carries an absolute quality of **1–5 diamonds**, and quality tilts the odds without
deciding them: a bad paper can get in and a good paper can get rejected, which is the point.
Targets, desk rejections, rebuttal windows, decisions, preprints, and persistent submission
histories across recycles.

**Advisor.** Meeting cadence derived from availability, ambition and lab size. A monthly mode —
attentive, deadline mode, grant season, travelling, gone quiet — that changes ping frequency,
cancellations, reply odds and review latency. Requests with due dates you can do, push back on, or
decline. Timed pushback exchanges where they have the last word and you have to answer it.

**Health and money.** A health bar with visible consequences, chronic conditions that accumulate,
and a clinic that puts a hole in your bank account *after* insurance — deductible, coinsurance and
all. An itemised monthly ledger: stipend, rent, food, premium, term fees, visa fees, remittances,
interest. Debt that compounds quietly and gets paid down when there is slack.

**International students** carry it differently and the model says so: higher loneliness, visa fees,
CPT paperwork, remittances home, employers that will not sponsor, national labs that are closed to
them outright, and travel that needs a visa which usually comes through and sometimes does not.

**Conferences.** 46 real cities that actually host these venues. Flights are red-eye and hotels are
poor unless your advisor has funding or you pay to upgrade. A real-time presentation minigame, then
senior professors asking the questions senior professors ask. Coffee breaks and social events, or
skip them and see the city — and risk running into your advisor at the museum. Connections turn
into citations, collaborations and side projects.

**Google Scholar.** Live, not a fixed number. Citations arrive as email — *"someone at somewhere
cited your work"* — driven by paper quality, your connections and your advisor's. Bar charts for
you, your advisor and your labmates, so you can do the thing everyone does.

**Internships.** Applications open every August. Landing one is the easy half: whether you go is
decided by your advisor, whose objections are drawn from your actual calendar — *"and what about
the deadline in July?"*, *"what about the rebuttal for that paper?"* You can bring a written plan,
say the salary out loud, name the mentor, ask a labmate who went whether the objection is real, go
anyway, or decline. Going anyway always works and is never free. The job title moves your research
skill — an SDE summer takes some of it away, and it comes back around February.

**Finishing.** From year four you have to ask, yourself, whether you can graduate next year — and
be told you are not ready, sometimes fairly and sometimes not. Getting out on time with a strong
record depends on your record *and* on communication and their willingness. Most people take six
years. After the defense your advisor keeps after you about revisions, because defending is not
finishing; the degree is conferred on deposit, and the margins have opinions. Defend after May and
you will be asked whether you want to come back for hooding.

**Letters.** Four minimum, for faculty jobs and postdocs only; industry asks for referees it never
calls. You ask people the run actually produced — your advisor, the committee, a collaborator from a
conference, the manager from a summer. A letter from outside the lab is worth more than one from
inside it. And one writer may quietly write a lukewarm one: a big name who barely knows you is the
classic way to acquire it, three good letters do not average it away, and you never, ever see it.

**The market.** Three seasonal job boards — LinkedOut all year, CRAB for the short faculty season,
The Pipeline for postdocs — over 48 fictional employers across 12 tracks named after the paperwork
that governs them. Applications freeze their odds *and the committee's mood* at submit, so volume
cannot average away a bad draw; you find out in March what you did in October. Silence is a normal
outcome and never resolves. **Most people do not land the thing they wanted**, and the game does not
treat that as a verdict on them.

**The checkbox.** *Will you now or in the future require sponsorship for employment visa status?*
Answer honestly and roughly half the industry board closes, inside the hour, by something that did
not read the rest of the file. The rejection is the fastest mail you will ever receive.

**Applying quietly.** You do not have to tell your advisor. It accrues, and it comes out — through a
recruiter who cc'd them, a seminar compliment, three cancelled Thursdays — and there are four
different advisors waiting on the other side of that. Two of them remember it when the letters are
written. Telling them yourself costs a bad ten minutes and buys all of it back. And if an offer
lands while your graduation date is still unsettled, you can put it on the table: one move, once per
run, that works more often than anything else and casts a shadow you are never shown.

**After.** It does not end at graduation. Your advisor stays in touch: work you left behind gets
finished by someone newer and accepted, and you are invited to the venue at your own expense; life
updates; coffee when you are back on campus as alumni. That relationship is the long-run return on
the whole thing.

**Endings and achievements.** 12 endings and 52 achievements, in a register that refuses to call
you a failure for any of them.

## How it is built

Vanilla ES modules and Vite. No framework. About 16k lines.

- `src/data/` — content: schools, venues, calendar, 171 event templates, 21 meeting scenes, employers, tracks, cities, internships, names. Placeholders live here so they can be swapped without touching the engine.
- `src/engine/` — simulation: state, time, events, advisor, papers, life, scholar, trips, internships, letters, the job search, the graduation negotiation, thesis, market, epilogue, saves.
- `src/ui/` — the desktop shell, its apps (PhD Manager, Mail, LabChat, Netscope, Portal, Calendar, Scholar, About Me, GradApply), scenes, real-time minigames, icons and synthesized sound.
- `src/i18n/` — English source strings plus 3,739 Chinese entries, with provenance tracking so stored text re-translates on a language switch.
- `tests/`, `scripts/balance.mjs` — engine tests, browser flows, and the multi-seed balance harness.

Every random draw goes through a seeded generator, so a run is reproducible from its seed and the
balance harness measures real distributions rather than vibes.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, rewrite the jokes.

The licence covers the code and the writing in this repository. It is not a licence to present the
game, or anything generated from it, as being about a real person or institution — see the
disclaimer above, which is the part that actually matters.

## Contributing

Issues and PRs welcome, especially: content that rings true, translation fixes, and balance reports
from `npm run balance` with a seed. Please keep the tone in the disclaimer above — punch at
situations, never at people or real institutions.
