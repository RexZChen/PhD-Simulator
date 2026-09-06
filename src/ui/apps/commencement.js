import { esc, btn, group, tag, money, note } from '../helpers.js';
import { icon } from '../icons.js';
import { avatar } from '../avatars.js';
import { cvSections } from '../../data/epilogue.js';
import { trackById } from '../../data/tracks.js';
import { currentBeat, beatText } from '../../engine/epilogue.js';
import { lastName } from '../../engine/state.js';
import { t } from '../../i18n/index.js';

const usd = n => n ? `$${n.toLocaleString('en-US')}` : t('no salary, yet');

// The ceremony: your name is read out, and the CV assembles itself line by line.
export function commencementScreen(s, ui) {
  const cv = s.cv;
  const step = ui.cvStep ?? 0;
  const shown = cv.lines.slice(0, step);
  const running = Math.min(100, shown.reduce((a, l) => a + l.points, 0));
  const done = step >= cv.lines.length;
  const bySection = cvSections.map(sec => ({ ...sec, lines: shown.filter(l => l.section === sec.id) })).filter(sec => sec.lines.length);
  const band = cv.score >= 72 ? t('a strong file') : cv.score >= 50 ? t('a real file') : cv.score >= 30 ? t('a thin file, honestly kept') : t('a short file and a long six years');

  return `<div class="commence">
    <div class="ceremony">
      <div class="cer-stage"><div class="cer-banner">${esc(s.program.name.toUpperCase())} · ${t('COMMENCEMENT')}</div>
        <div class="cer-figures">${avatar(s.player.name, 56)}<span class="cer-hood"></span>${avatar(s.advisor.id, 46)}</div>
        <div class="cer-read">${t('“{name}, Doctor of Philosophy, advised by Professor {advisor}.”', { name: s.player.name, advisor: lastName(s.advisor.name) })}</div>
      </div>
      <p class="muted small">${t('The hood goes over your head backwards on the first try. Somebody in the third row shouts your name. Nine seconds, after six years.')}</p>
    </div>

    <div class="cols main-side">
      <div>${group(t('Curriculum vitae'), `<div class="cv ${done ? 'all-at-once' : ''}">
        ${bySection.map(sec => `<div class="cv-sec"><h3>${esc(t(sec.label))}</h3>${sec.lines.map(l => `<div class="cv-line"><span>${esc(l.text)}</span>${l.points ? `<b>+${l.points}</b>` : ''}</div>`).join('')}</div>`).join('')
      || `<p class="muted small">${t('The page is blank for a moment. Then it is not.')}</p>`}
      </div>`)}</div>
      <div>
        ${group(t('What the file argues'), `<div class="cv-score"><b>${Math.round(running)}</b><span class="muted small">${done ? esc(band) : t('assembling…')}</span></div>
          <div class="progress gold"><i style="width:${Math.min(100, running)}%"></i></div>
          <p class="tiny muted">${t('This number is not you. It is what a hiring committee can see in eleven minutes.')}</p>`)}
        ${done ? '' : `<div class="row">${btn(t('Next line →'), 'cv-step', { cls: 'primary', attrs: 'data-default="1"' })}${btn(t('Show the whole page'), 'cv-all', { cls: 'small link' })}</div>`}
      </div>
    </div>
    ${done ? offersBlock(s) : ''}
  </div>`;
}

function offersBlock(s) {
  const offers = s.jobs.market || [];
  return `<div class="offers">
    <h2>${t('What happens in September')}</h2>
    <p class="muted small">${t('The market ran while you were finishing. Here is what came back.')}</p>
    <div class="offer-grid">${offers.map((o, i) => {
      const tr = trackById[o.kind];
      const clock = o.permanence === 0 ? t('no clock — it restarts in about two years') : o.permanence === 2 ? t('no clock at all') : t('there is a clock and it can end');
      return `<button class="offer" data-action="take-offer" data-id="${esc(o.kind)}" data-hotkey="${i + 1}">
      <div class="row between"><b>${esc(t(o.name))}</b>${tag(t(o.org))}</div>
      ${tr ? `<div class="offer-track">${esc(t(tr.name))} <span class="muted">· ${esc(t(tr.subtitle))}</span></div>` : ''}
      <div class="offer-pay">${esc(usd(o.salary))}<span class="muted small">${o.months === 9 ? ' · ' + t('nine months of it') : ''} · ${esc(o.where)}</span></div>
      <div class="offer-meta"><span>${esc(clock)}</span>${o.equity && o.equity !== 'none' ? `<span>${o.equity === 'lottery' ? t('equity: a story') : t('equity: possibly a house')}</span>` : ''}</div>
      <p class="small muted">${esc(o.catch)}</p>
      <span class="offer-take">${t('Take it')} →</span>
    </button>`; }).join('')}</div>
    ${s.jobs.weatherLine ? `<p class="tiny muted">${esc(s.jobs.weatherLine)}</p>` : ''}
    ${(s.jobs.shortlists || []).length ? `<p class="tiny muted">${t('You were shortlisted at {n} more and heard nothing. They hired someone internal, or their first choice said yes.', { n: s.jobs.shortlists.length })}</p>` : ''}
  </div>`;
}

// The years after. One message at a time, each a few years apart.
export function epilogueScreen(s, ui) {
  const ep = s.epilogue;
  const beat = currentBeat(s);
  const froms = { advisor: () => t('Prof. {name}', { name: s.advisor.name }), labmate: () => s.labmates[0]?.name || t('a labmate'), venue: () => t('Programme Committee'), system: () => t('Gaggle Scholar'), stranger: () => t('someone you have never met'), self: () => t('Your office, {school}', { school: s.jobs.taken?.name || s.program.name }) };
  const job = s.jobs.taken;
  return `<div class="epilogue">
    <div class="epi-head">
      <h1>${t('After')}</h1>
      <p class="muted">${job && job.salary ? t('{name} · {org} · {where}', { name: t(job.name), org: job.org, where: job.where }) : t('Between things, for a while.')}</p>
      <div class="epi-years">${ep.done.map(d => `<span class="epi-dot" title="${esc(d.subject)}">${t('+{n}y', { n: d.year })}</span>`).join('')}${beat ? `<span class="epi-dot now">${t('+{n}y', { n: beat.when })}</span>` : ''}</div>
    </div>
    ${ep.note ? `<div class="epi-note">${esc(ep.note)}</div>` : ''}
    ${beat ? `<div class="epi-mail">
      <div class="epi-from">${avatar(beat.from === 'advisor' ? s.advisor.id : beat.id, 36)}<div><b>${esc(froms[beat.from] ? froms[beat.from]() : t('A message'))}</b><span class="muted small">${esc(t(beat.subject))}</span></div><span class="muted tiny">${t('{n} year(s) after', { n: beat.when })}</span></div>
      <div class="epi-body">${esc(beatText(s, beat))}</div>
      <div class="choices">${beat.choices.map((c, i) => `<button class="btn choice" data-action="epilogue" data-id="${c.id}" data-hotkey="${i + 1}"><span><kbd>${i + 1}</kbd></span><span><b>${esc(t(c.label))}</b></span><span class="arrow">→</span></button>`).join('')}</div>
    </div>` : `<div class="row">${btn(t('And that is the story →'), 'epilogue-end', { cls: 'primary', attrs: 'data-default="1"' })}</div>`}
  </div>`;
}
