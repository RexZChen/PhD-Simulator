import test from 'node:test';
import assert from 'node:assert/strict';
import { START, holidays, daysIn, focusAvailability, isTeachingTerm } from '../src/data/calendar.js';
import { setAppLanguage } from '../src/i18n/apply.js';
import { t } from '../src/i18n/index.js';
import { createRun } from '../src/engine/state.js';
import { monthlyMail } from '../src/engine/lab.js';

const indexOf = (year, month) => (year - START.year) * 12 + month - START.month;

test('movable holidays occupy their real weekday in every year of a long run, in both languages', () => {
  const baseline = [];
  try {
    for (const lang of ['en', 'zh', 'en']) {
      setAppLanguage(lang);
      const dates = [];
      for (let year = 2028; year <= 2036; year++) {
        for (const [month, position, weekday, min, max] of [[1, 1, 1, 15, 21], [2, 1, 1, 15, 21], [5, 1, 1, 25, 31], [9, 0, 1, 1, 7], [11, 0, 4, 22, 28]]) {
          const index = indexOf(year, month), holiday = holidays(index)[position];
          assert.ok(holiday.day >= min && holiday.day <= max, `${year}/${month}: ${holiday.day}`);
          assert.equal(new Date(Date.UTC(year, month - 1, holiday.day)).getUTCDay(), weekday);
          dates.push(holiday.day);
        }
      }
      if (!baseline.length) baseline.push(...dates);
      else assert.deepEqual(dates, baseline, 'translation must never change date rules');
    }
    assert.equal(holidays(indexOf(2028, 9))[0].day, 4);
    assert.equal(holidays(indexOf(2029, 9))[0].day, 3);
    assert.equal(holidays(indexOf(2028, 11))[0].day, 23);
    assert.equal(holidays(indexOf(2029, 11))[0].day, 22);
  } finally { setAppLanguage('en'); }
});

test('fictional campus dates and fixed holiday dates stay authored and returned entries cannot mutate the catalog', () => {
  setAppLanguage('en');
  for (let year = 2028; year <= 2036; year++) {
    for (const [month, position, day] of [[1, 0, 1], [2, 0, 14], [3, 0, 11], [4, 0, 15], [4, 1, 5], [5, 0, 12], [6, 0, 19], [7, 0, 4], [8, 0, 1], [8, 1, 26], [10, 0, 31], [12, 0, 15], [12, 1, 24]]) {
      const index = indexOf(year, month);
      const entry = holidays(index)[position];
      assert.equal(entry.day, day);
      assert.ok(entry.day <= daysIn(index));
      entry.day = 99;
      assert.equal(holidays(index)[position].day, day);
    }
  }
  assert.equal(holidays(indexOf(2030, 4))[0].name, 'Tax paperwork');
  assert.match(holidays(indexOf(2030, 4))[0].note, /Campus reminder/);
  assert.equal(daysIn(indexOf(2032, 2)), 29);
});

test('coursework explains winter, finals, and summer without changing teaching eligibility', () => {
  try {
    for (const lang of ['en', 'zh']) {
      setAppLanguage(lang);
      for (let month = 1; month <= 12; month++) {
        const index = indexOf(2029, month), availability = focusAvailability(index);
        assert.equal(availability.coursework === null, isTeachingTerm(index));
        assert.equal(availability.teach === null, isTeachingTerm(index));
      }
      assert.match(focusAvailability(indexOf(2028, 12)).coursework, lang === 'en' ? /winter break.*January/ : /寒假.*一月/);
      assert.match(focusAvailability(indexOf(2029, 5)).coursework, lang === 'en' ? /commencement.*September/ : /毕业季.*九月/);
      assert.match(focusAvailability(indexOf(2029, 7)).coursework, lang === 'en' ? /summer/ : /暑假|夏天|夏季/);
      assert.match(holidays(indexOf(2029, 4))[0].name, lang === 'en' ? /Tax paperwork/ : /报税材料/);
    }
  } finally { setAppLanguage('en'); }
});

test('closure mail uses stable holiday identity and consumes identical RNG in English and Chinese', () => {
  setAppLanguage('en');
  const base = createRun(842, { topic: 'ml' });
  try {
    for (const [month, id] of [[11, 'thanksgiving'], [12, 'winter_break'], [3, 'spring_break'], [4, null]]) {
      let closures = 0;
      for (let seed = 1; seed <= 24; seed++) {
        const outcomes = ['en', 'zh'].map(lang => {
          setAppLanguage(lang);
          const s = structuredClone(base);
          s.month = indexOf(2029, month); s.phase = 'playing'; s.rng = seed;
          s.inbox = []; s.recent = {};
          if (id) assert.ok(holidays(s.month).some(holiday => holiday.id === id));
          monthlyMail(s);
          return { rng: s.rng, closure: s.inbox.filter(mail => mail.sender === t('Facilities')).length,
            mail: s.inbox.map(mail => ({ id: mail.id, kind: mail.kind, folder: mail.folder })) };
        });
        assert.deepEqual(outcomes[1], outcomes[0], `month ${month}, seed ${seed}`);
        closures += outcomes[0].closure;
      }
      if (id) assert.ok(closures > 0 && closures < 24, 'both the closure-mail and skipped-mail branches execute');
      else assert.equal(closures, 0, 'an unrelated holiday does not become a closure');
    }
  } finally { setAppLanguage('en'); }
});
