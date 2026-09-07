import { esc, btn, bar, group, tag, money, note, gauge } from '../helpers.js';
import { icon } from '../icons.js';
import { conditions as conditionDefs, clinics, budgets, lifeActions, recharges, housingMoves, COFFEE } from '../../data/life.js';
import { budgetOf, activeConditions, clinicQuote, lifeActionAvailable, healthWord, healthBand, lonelyWord, outOfPocket } from '../../engine/life.js';
import { quitBand } from '../../engine/divergence.js';
import { dateLabel } from '../../data/calendar.js';
import { t } from '../../i18n/index.js';

function vitals(s) {
  const st = s.player.stats, hid = s.player.hidden;
  const band = healthBand(st.health);
  const caption = {
    well: t('You are, by the standards of this building, fine.'),
    tired: t('Tired in the ordinary way. A weekend would fix most of it. There is no weekend.'),
    rundown: t('You get through the day and then the day gets through you. Things are starting to hurt in order.'),
    unwell: t('This is not sustainable and some part of you has known that for a while.'),
  }[band];
  return `<div class="vitals ${band}">
    ${bar(t('Health'), st.health, { cls: band === 'unwell' ? 'red' : band === 'rundown' ? 'gold' : 'green', title: t('Sleep, food, stress, and everything you have postponed.') })}
    ${bar(t('Energy'), st.energy, { cls: 'green' })}
    <div class="gauge-row"><span class="lbl">${t('Stress')}</span>${gauge(hid.stress, hid.stress > 65 ? 'red' : 'gold')}<b class="right">${hid.stress > 70 ? t('high') : hid.stress > 45 ? t('medium') : t('low')}</b></div>
    <div class="gauge-row"><span class="lbl">${t('Connection')}</span>${gauge(100 - (hid.loneliness || 0), (hid.loneliness || 0) > 65 ? 'red' : '')}<b class="right">${esc(lonelyWord(hid.loneliness || 0))}</b></div>
    <p class="tiny muted" style="margin:6px 0 0">${esc(caption)}</p>
  </div>`;
}

function conditionList(s) {
  const list = activeConditions(s);
  if (!list.length) return `<p class="muted small">${t('Nothing currently wrong that a doctor could name. Enjoy this sentence.')}</p>`;
  return `<div class="cond-list">${list.map(c => `<div class="cond">
    <div class="row between"><b>${esc(t(c.def.name))}</b>${tag(c.ignored > (c.def.months || 99) - 2 ? t('getting worse') : t('untreated'), c.ignored > (c.def.months || 99) - 2 ? 'bad' : 'warn')}</div>
    <p class="small muted">${esc(t(c.def.blurb))}</p>
    <p class="tiny muted">${t('Since {month} · treated at: {where}', { month: dateLabel(c.since), where: t((clinics.find(x => x.id === c.def.clinic) || {}).name || '') })}</p>
  </div>`).join('')}</div>`;
}

function clinicList(s) {
  const mine = new Set(activeConditions(s).map(c => c.id));
  return `<div class="clinic-list">${clinics.map(c => {
    const q = clinicQuote(s, c.id);
    const helps = c.treats.filter(x => mine.has(x));
    return `<div class="clinic ${helps.length ? 'helps' : ''}">
      <div class="row between"><b>${esc(t(c.name))}</b><span class="price"><b>${money(q.you)}</b> <span class="muted tiny">${t('of {list}', { list: money(c.list) })}</span></span></div>
      <p class="small muted">${esc(t(c.blurb))}</p>
      <p class="tiny muted">${t('Wait: {wait}', { wait: t(c.wait) })}${helps.length ? ` · ${t('would treat: {names}', { names: helps.map(x => t(conditionDefs[x].name)).join(', ') })}` : ''}</p>
      ${btn(t('Book it — {price}', { price: money(q.you) }), 'clinic', { id: c.id, cls: helps.length ? 'small primary' : 'small', disabled: s.stage !== 'plan' })}
    </div>`;
  }).join('')}</div>`;
}

function insuranceBox(s) {
  const ins = s.insurance || {};
  return `<table class="grid">
    <tr><td>${t('Monthly premium')}</td><td class="num">${money(ins.premium || 0)}</td></tr>
    <tr><td>${t('Deductible remaining')}</td><td class="num">${money(ins.deductibleLeft || 0)} ${t('of {n}', { n: money(ins.deductible || 0) })}</td></tr>
    <tr><td>${t('Your share after that')}</td><td class="num">${Math.round((ins.coinsurance || 0) * 100)}%</td></tr>
    <tr><td>${t('Spent on care this run')}</td><td class="num">${money(s.spend?.care || 0)}</td></tr>
  </table>
  <p class="tiny muted">${t('You are insured. This means the bill is smaller and arrives in two parts, later, from people you have never met.')}</p>
  ${(s.bills || []).length ? `<p class="small">${tag(t('{n} bill(s) still in the post', { n: s.bills.length }), 'warn')}</p>` : ''}`;
}

function moneyBox(s) {
  const l = s.ledger;
  const b = budgetOf(s);
  const rows = l ? [[t('Stipend (gross)'), l.stipend, 1], ...(l.tax ? [[t('Withholding'), -l.tax]] : []), ...(l.refund ? [[t('Tax refund'), l.refund, 1]] : []), [t('Rent'), -l.rent], [t('Food ({mode})', { mode: t(b.name).toLowerCase() }), -l.food], [t('Insurance premium'), -l.premium], ...(l.fees ? [[t('Term fees'), -l.fees]] : []), ...(l.visa ? [[t('Visa and immigration fees'), -l.visa]] : []), ...(l.remit ? [[t('Sent home'), -l.remit]] : []), ...(l.interest ? [[t('Card interest'), -l.interest]] : []), ...(l.repaid ? [[t('Paid off the card'), -l.repaid]] : []), [t('Everything else'), -l.other]] : [];
  const net = rows.reduce((a, r) => a + r[1], 0);
  return `${l ? `<table class="grid money-table">${rows.map(([k, v]) => `<tr><td>${k}</td><td class="num ${v < 0 ? 'down' : 'up'}">${v < 0 ? '−' : '+'}${money(Math.abs(v))}</td></tr>`).join('')}<tr class="total"><td><b>${t('Net this month')}</b></td><td class="num ${net < 0 ? 'down' : 'up'}"><b>${net < 0 ? '−' : '+'}${money(Math.abs(net))}</b></td></tr></table>` : `<p class="muted small">${t('The first statement arrives at the end of the month.')}</p>`}
  <div class="row between" style="margin-top:8px"><span>${t('In the account')}</span><b class="${s.player.stats.money < 500 ? 'low' : ''}">${money(s.player.stats.money)}</b></div>
  <div class="row between"><span>${t('On the card')}</span><b class="${(s.debt || 0) > 0 ? 'low' : ''}">${money(s.debt || 0)}</b></div>
  ${(s.debt || 0) > 0 ? `<div class="row" style="margin-top:6px">${btn(t('Pay $200'), 'pay-debt', { id: '200', cls: 'small', disabled: s.stage !== 'plan' || s.player.stats.money < 200 })}${btn(t('Pay it off'), 'pay-debt', { id: 'all', cls: 'small', disabled: s.stage !== 'plan' || s.player.stats.money < (s.debt || 0) })}<span class="tiny muted">${t('1.2% a month. It compounds while you sleep, which is when it does its best work.')}</span></div>` : ''}`;
}

function budgetBox(s) {
  return `<div class="budget-list">${Object.entries(budgets).map(([id, b]) => `<button class="option ${s.budget === id ? 'selected' : ''}" data-action="budget" data-id="${id}" ${s.stage !== 'plan' ? 'disabled' : ''}><span class="radio"></span><span><b>${esc(t(b.name))} · ${money(b.food)}${t('/mo')}</b><span class="muted">${esc(t(b.blurb))}</span></span></button>`).join('')}</div>`;
}

// What it takes out of you, in the units the player is watching. Money and Energy are printed
// separately; this is everything else that a recharge quietly costs.
const TOLL = { health: 'Health', hope: 'Hope', stress: 'Stress', satisfaction: 'Advisor', progress: 'Progress', loneliness: 'Loneliness' };
const INVERTED = new Set(['stress', 'loneliness']);
const toll = a => Object.entries(a.effects || {})
  .filter(([k, v]) => TOLL[k] && (INVERTED.has(k) ? v > 0 : v < 0))
  .map(([k, v]) => t('{sign}{n} {what}', { sign: v < 0 ? '−' : '+', n: Math.abs(v), what: t(TOLL[k]) }));

// One figure per thing the player is watching. The gym costs five Energy and gives two back, and
// printing both produced "+2 Energy · −5 Energy" on the same button, which reads as a
// contradiction rather than as a trade. Net it, and say what actually happens to the bar.
function pills(a) {
  const net = (v, cost) => (v || 0) - (cost || 0);
  const e = net(a.effects?.energy, a.cost?.energy);
  const m = net(a.effects?.money, a.cost?.money);
  return [
    e ? t('{sign}{n} Energy', { sign: e > 0 ? '+' : '−', n: Math.abs(e) }) : '',
    ...toll(a),
    m ? `${m > 0 ? '+' : '−'}${money(Math.abs(m))}` : '',
  ].filter(Boolean);
}

function actionList(s, list = lifeActions) {
  return `<div class="life-actions">${list.map(a => {
    const why = lifeActionAvailable(s, a);
    return `<button class="life-act ${why ? 'off' : ''}" data-action="life" data-id="${a.id}" ${why || s.stage !== 'plan' ? 'disabled' : ''} title="${esc(why || t(a.line))}">
      ${icon(a.icon, 20)}<span><b>${esc(t(a.name))}</b><small class="muted">${why ? esc(why) : pills(a).join(' · ') || t('free')}</small></span>
    </button>`;
  }).join('')}</div>`;
}

// Not a stat bar. A sentence, and a door that is always unlocked.
function reflection(s) {
  const band = quitBand(s);
  const line = {
    low: t('You are, on balance, still glad you came. Write that down somewhere you will find it in February.'),
    some: t('Some weeks you would not choose this again. Most weeks you would. That ratio is normal and nobody says so out loud.'),
    high: t('You have been thinking about leaving. Not as a threat — as an option. It is an option. It has always been an option.'),
    critical: t('You are running on nothing and you know it. Whatever you decide, decide it deliberately rather than by collapsing into it.'),
  }[band];
  return `<p class="small">${esc(line)}</p>
  <div class="row" style="margin-top:6px">${btn(t('Sit down and think about it properly'), 'reflect', { cls: 'small', disabled: s.stage !== 'plan' || s.month < 4, title: t('An honest hour with yourself. It can end this run, or renew it.') })}</div>
  <p class="tiny muted">${t('Leaving a PhD is a decision, not a defeat. So is staying. Both deserve to be chosen rather than defaulted into.')}</p>`;
}

export function lifeApp(s, ui) {
  const intl = s.player.profile.international;
  const tab = ui.lifeTab || 'body';
  const tabs = [['body', t('Body'), 'heart'], ['money', t('Money'), 'money'], ['living', t('Living'), 'home'], ...(intl ? [['visa', t('Visa'), 'plane']] : [])];
  const head = `<div class="tabs">${tabs.map(([id, label, ic]) => `<button class="btn tab ${tab === id ? 'active' : ''}" data-action="life-tab" data-id="${id}">${icon(ic, 14)} ${esc(label)}</button>`).join('')}</div>`;
  const body = {
    body: `<div class="cols two"><div>${group(t('Vitals'), vitals(s))}${group(t('Getting it back'), `<p class="tiny muted">${t('None of these costs Energy. All of them cost something.')}</p>` + actionList(s, recharges))}</div>
      <div>${group(t('What is currently wrong'), conditionList(s))}${group(t('Where you could go'), clinicList(s))}${group(t('Your insurance, explained'), insuranceBox(s))}</div></div>`,
    money: `<div class="cols two"><div>${group(t('This month'), moneyBox(s))}</div>
      <div>${group(t('How you are living'), budgetBox(s))}${group(t('Where you live'), `<p class="tiny muted">${t('Rent is the largest line on the ledger and the only one you can actually move.')}</p>` + actionList(s, housingMoves))}${group(t('Ways to make it through'), actionList(s))}</div></div>`,
    living: `<div class="cols two"><div>${group(t('Getting it back'), actionList(s, recharges))}${group(t('Things you could do that are not the PhD'), actionList(s))}</div>
      <div>${group(t('Vitals'), vitals(s))}${group(t('How you are doing, honestly'), reflection(s))}${s.lifeOutcome ? note(esc(s.lifeOutcome)) : note(t('The life side is not a reward for finishing the work. It is the thing that lets you finish the work.'))}</div></div>`,
    visa: `<div class="cols two"><div>${group(t('Immigration status'), `<table class="grid">
      <tr><td>${t('Status')}</td><td class="num">F-1</td></tr>
      <tr><td>${t('Full-time enrolment')}</td><td class="num">${t('required, every term, no exceptions')}</td></tr>
      <tr><td>${t('Off-campus work')}</td><td class="num">${t('not permitted')}</td></tr>
      <tr><td>${t('Annual fees')}</td><td class="num">${money(510)}</td></tr>
      <tr><td>${t('Travel home')}</td><td class="num">${t('requires a signature and a queue')}</td></tr>
    </table><p class="tiny muted">${t('Leaving the program means leaving the country within sixty days. Every decision in this game is a slightly different decision for you.')}</p>`)}</div>
      <div>${group(t('The distance'), `<div class="gauge-row"><span class="lbl">${t('Loneliness')}</span>${gauge(s.player.hidden.loneliness || 0, (s.player.hidden.loneliness || 0) > 65 ? 'red' : 'gold')}<b class="right">${esc(lonelyWord(s.player.hidden.loneliness || 0))}</b></div>
      <p class="small muted">${t('Your family is asleep when you are awake. The cohort dinner is at a restaurant with nothing you grew up with. Someone will ask, kindly, where you are “really” from. None of this is a crisis. All of it is weight.')}</p>
      ${s.flags.remitting ? `<p class="small">${tag(t('Sending $250 home each month'), 'warn')}</p>` : ''}`)}
      ${group(t('Things that help'), actionList(s))}</div></div>`,
  }[tab];
  return `<div class="lifeapp">${head}${body}</div>`;
}
