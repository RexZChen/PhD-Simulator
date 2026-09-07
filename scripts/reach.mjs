// Content reachability probe.
//
// The recurring failure on this project is not "the code is broken", it is "the code exists and
// nobody can get to it". Twelve career endings sat behind a stage check that graduating never
// sets. Hard TA fired in 0 of 180 runs. A scene fired in 27% of runs and announced nothing.
// Each time the unit tests were green, because a unit test asks whether a function works, not
// whether a player will ever call it.
//
// So this harness plays whole runs and then asks the only question that matters for content:
// which of it did anybody see? It reports every event, achievement and ending that never fired,
// and the state of the systems that are supposed to be rare but real.
//
//   node scripts/reach.mjs [seeds]
//
// A name in the "never reached" list is not automatically a bug — some content is gated on a
// choice these three scripted styles never make. But it is always a question, and the answer
// should be a sentence you can say out loud, not a shrug.

import { run } from './balance.mjs';
import { events } from '../src/data/events.js';
import { achievements } from '../src/data/catalog.js';
import { trackEndings, exitEndings } from '../src/data/endings.js';

const SEEDS = Number(process.argv[2] || 30);
const STYLES = ['diligent', 'lazy', 'grinder'];

const rows = [];
for (const style of STYLES) {
  for (let seed = 1; seed <= SEEDS; seed++) rows.push({ style, ...(await run(seed, style)) });
}
const N = rows.length;
const count = (pick) => { const m = {}; for (const r of rows) for (const k of pick(r) || []) m[k] = (m[k] || 0) + 1; return m; };

const seen = count(r => r.seen);
const got = count(r => r.achievements);
const ends = count(r => (r.ending ? [r.ending] : []));

const pct = n => `${((n / N) * 100).toFixed(0)}%`;
const report = (title, all, tally, label = x => x) => {
  const missing = all.filter(id => !tally[id]);
  console.log(`\n=== ${title}: ${all.length - missing.length}/${all.length} reached in ${N} runs ===`);
  if (missing.length) console.log('  never reached: ' + missing.map(label).join(', '));
  const rare = all.filter(id => tally[id] && tally[id] / N < 0.02).sort((a, b) => tally[a] - tally[b]);
  if (rare.length) console.log('  under 2%: ' + rare.map(id => `${label(id)} (${tally[id]})`).join(', '));
  return missing.length;
};

let gaps = 0;
gaps += report('events', events.map(e => e.id), seen);
gaps += report('achievements', Object.keys(achievements), got);
const allEndings = [...new Set([...Object.values(trackEndings).flat().map(e => e.id), ...Object.keys(exitEndings())])];
report('endings', allEndings, ends);   // endings are style-gated by design; reported, not counted

const bucket = (name, pick) => {
  const m = {};
  for (const r of rows) { const k = pick(r); if (k !== undefined && k !== null) m[k] = (m[k] || 0) + 1; }
  console.log(`  ${name.padEnd(14)} ` + (Object.keys(m).length ? Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v} (${pct(v)})`).join('  ') : 'never'));
};
console.log(`\n=== systems that are meant to be rare but real (${N} runs) ===`);
bucket('patent', r => r.patentStage);
bucket('spinout', r => (r.flags?.ipDisclosed ? (r.venture ? `venture:${r.venture.stage}` : 'disclosed only') : null));
bucket('hard TA', r => (r.hardTaYears ? `${r.hardTaYears} year(s)` : null));   // a count, not a flag: the flag is cleared when the year ends
bucket('found out', r => (r.found ? 'yes' : null));

console.log(`\n${gaps} unreachable event(s) or achievement(s).`);
process.exit(gaps ? 1 : 0);
