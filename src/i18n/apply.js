import { applyLanguage, getLanguage } from './index.js';
import { events } from '../data/events.js';
import { meetings } from '../data/meetings.js';
import { requests } from '../data/requests.js';
import { asks } from '../data/asks.js';
import { schools, focuses, internshipFocus, rebuttals, mutators, advisorArchetypes, achievements, backgrounds, topics, personalityTitles } from '../data/catalog.js';
import { sprintSets } from '../engine/time.js';
import { emailOpeners, emailFollowUps, studentOpeners, studentFlavor, interviewQuestions, visitQuestions } from '../data/threads.js';
import { chatter } from '../data/chatter.js';
import { memeOverrides, memeDefaults } from '../data/memes.js';
import { calendarText, setCalendarLocale } from '../data/calendar.js';
import { venues } from '../data/venues.js';
import { labmateRoles, labmateTraits } from '../data/names.js';
const bundle = { events, meetings, requests, asks, schools, focuses, internshipFocus, rebuttals, mutators, advisorArchetypes, achievements, backgrounds, topics, personalityTitles, sprintSets, emailOpeners, emailFollowUps, studentOpeners, studentFlavor, interviewQuestions, visitQuestions, chatter, memeOverrides, memeDefaults, calendarText, setCalendarLocale, venues, labmateRoles, labmateTraits };
export function setAppLanguage(lang) { applyLanguage(lang, bundle); return getLanguage(); }
