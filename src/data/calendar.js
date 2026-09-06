// Academic calendar. The simulation counts months from September 2028 (index 0).
// Every date-related label and seasonal rule derives from this file so the start year
// can be changed in one place.
import { t, rememberSource } from '../i18n/index.js';
export const START = { year: 2028, month: 9 };
let locale = 'en';
export const setCalendarLocale = l => { locale = l; };
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function calendarOf(index) {
  const absolute = START.month - 1 + index;
  return { month: (absolute % 12) + 1, year: START.year + Math.floor(absolute / 12), index };
}
export const monthOf = index => calendarOf(index).month;
export const dateLabel = index => { const c = calendarOf(index); return rememberSource(locale === 'zh' ? `${c.year}年${c.month}月` : `${MONTHS[c.month - 1]} ${c.year}`, { d: index }); };
export const shortLabel = index => { const c = calendarOf(index); return locale === 'zh' ? `${c.year}年${c.month}月` : `${SHORT[c.month - 1]} ${c.year}`; };
export const phdYear = index => Math.floor(index / 12) + 1;
export function daysIn(index) { const c = calendarOf(index); return new Date(Date.UTC(c.year, c.month, 0)).getUTCDate(); }
export function firstWeekday(index) { const c = calendarOf(index); return new Date(Date.UTC(c.year, c.month - 1, 1)).getUTCDay(); }
// Index of the next month (>= from) whose calendar month equals `month` (1-12).
export function nextIndexFor(month, from) { for (let i = from; i < from + 12; i++) if (monthOf(i) === month) return i; return from; }

export function semester(index) {
  const m = monthOf(index);
  if (m >= 9 && m <= 11) return t('Fall semester');
  if (m === 12) return t('Finals & winter break');
  if (m >= 1 && m <= 4) return t('Spring semester');
  if (m === 5) return t('Finals & commencement');
  return t('Summer');
}
export const isTeachingTerm = index => [9, 10, 11, 1, 2, 3, 4].includes(monthOf(index));
export const isSummer = index => [6, 7, 8].includes(monthOf(index));

// Holidays and campus rhythms by calendar month. `day` is only used to place them on the calendar grid.
export const HOLIDAYS = {
  9: [{ day: 4, name: 'Labor Day', note: 'Campus closed. The semester starts a day later than everyone thinks.' }],
  10: [{ day: 31, name: 'Halloween', note: 'The lab party has a costume theme nobody agreed on.' }],
  11: [{ day: 23, name: 'Thanksgiving', note: 'Four days without meetings. Allegedly.' }],
  12: [{ day: 15, name: 'Finals week', note: 'The undergrads are panicking. So are the TAs.' }, { day: 24, name: 'Winter break', note: 'Campus closes for a week. Your inbox does not.' }],
  1: [{ day: 1, name: 'New Year', note: 'Resolutions are due. So is the ICMLater deadline.' }, { day: 15, name: 'MLK Day', note: 'A Monday off in the coldest week of the year.' }],
  2: [{ day: 14, name: 'Valentine’s Day', note: 'The lab has opinions about this.' }, { day: 19, name: 'Presidents’ Day', note: 'A Monday off you will spend in the lab.' }],
  3: [{ day: 11, name: 'Spring break', note: 'Undergraduates leave. Graduate students notice the parking.' }],
  4: [{ day: 15, name: 'Tax Day', note: 'Form 1042-S is not a typo.' }, { day: 5, name: 'Visit days', note: 'Prospective students ask you how it is going. Honestly.' }],
  5: [{ day: 12, name: 'Commencement', note: 'People in robes. Some of them are your friends.' }, { day: 27, name: 'Memorial Day', note: 'The lab is open. It is always open.' }],
  6: [{ day: 19, name: 'Juneteenth', note: 'A holiday. The cluster is still running.' }],
  7: [{ day: 4, name: 'Independence Day', note: 'Fireworks. Someone brings a grill to the lab roof.' }],
  8: [{ day: 1, name: 'Lease turnover', note: 'Half the city moves on the same day.' }, { day: 26, name: 'New students arrive', note: 'They look young. They are.' }],
};
export const holidays = index => HOLIDAYS[monthOf(index)] || [];

// Short seasonal flavor for month headings. Kept dry on purpose.
export const FLAVOR = {
  9: ['Fall. New notebooks, old problems.', 'The trees are turning. So is the semester.', 'September again. The campus smells like fresh syllabi.'],
  10: ['Midterms for them. Deadlines for you.', 'The leaves are lovely. You saw them through a window.', 'October. Sweater weather in the server room.'],
  11: ['The days get shorter. The to-do list does not.', 'November. Everyone is tired in a seasonal way.', 'Thanksgiving is coming. So is a reviewer.'],
  12: ['Finals week. Campus is a stress heat map.', 'December. The building is quiet, which is suspicious.', 'The year ends. The paper does not.'],
  1: ['A new year. The same cluster queue.', 'January. Resolutions and deadlines share a calendar.', 'Cold outside. Colder reviews.'],
  2: ['February. Short month, long nights.', 'The heating works in exactly one room.', 'Valentine’s week. The lab orders pizza anyway.'],
  3: ['Spring break for someone else.', 'March. The snow melts into deadlines.', 'The clocks change. Your sleep does not.'],
  4: ['April. Tax forms and prospective students.', 'Visit day: you are now the “current student.”', 'Spring. The campus is beautiful. You are indoors.'],
  5: ['May. The deadline month.', 'Commencement season. Robes everywhere.', 'The semester ends. The submission portal opens.'],
  6: ['Summer. The lab empties out.', 'June. Quiet halls, loud fans.', 'The interns have arrived. They have snacks.'],
  7: ['July. Conference season and heat.', 'The building AC and the cluster are competing.', 'Summer research, uninterrupted. In theory.'],
  8: ['August. Leases end. Deadlines begin.', 'The new cohort arrives, looking rested.', 'The last quiet week before the semester.'],
};
export const seasonalFlavor = (index, pickIndex = 0) => { const options = FLAVOR[monthOf(index)]; return options[pickIndex % options.length]; };

// Which focuses make sense this month. Teaching and coursework follow the semester.
export function focusAvailability(index) {
  const teaching = isTeachingTerm(index);
  return {
    coursework: teaching ? null : t('No classes in summer. Read on your own time, which is all of it.'),
    teach: teaching ? null : t('No sections to teach until the semester resumes.'),
  };
}

export const calendarText = { HOLIDAYS, FLAVOR };
