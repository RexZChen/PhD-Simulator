// A conference is four days long and contains exactly one thing you flew there for.
import { t } from '../i18n/index.js';
import { cities, venueCities, flights, hotels, talkSlots, questioners, tripActivities, caughtScenes } from '../data/conference.js';
import { venueById } from '../data/venues.js';
import { dateLabel } from '../data/calendar.js';
import { meetContact } from './network.js';
import { random, roll, clamp, pick, shuffle } from './probability.js';
import { effects, log, message, chat, award, activeProject, lastName, firstName, fill } from './state.js';
import { charge } from './life.js';

export const TRIP_DAYS = 4;

function pickCity(s, venue) {
  const pool = (venueCities[venue.real] || Object.keys(cities)).filter(id => cities[id]);
  const seen = s.citiesVisited || [];
  const fresh = pool.filter(id => !seen.includes(id));
  return pick(s, fresh.length ? fresh : pool);
}
function pickFlight(s, funded) {
  if (funded) return roll(s, .7) ? 'direct' : 'normal';
  if (s.player.stats.money < 900) return roll(s, .6) ? 'redeye' : 'layover';
  return pick(s, ['redeye', 'layover', 'normal', 'layover']);
}
function pickHotel(s, funded) {
  if (funded) return 'conference';
  const mate = s.labmates.find(l => l.status === 'active' && l.role !== 'phantom');
  if (mate && roll(s, .45)) return 'share';
  return s.player.stats.money < 700 ? 'hostel' : 'far';
}

// Crossing a border to give a twelve-minute talk. Easy with one passport, a project with another.
// Domestic students mostly need nothing; F-1 students need the destination's visa AND, for
// re-entry, a valid US stamp. It usually works. "Usually" is doing a lot of work in that sentence.
export function visaNeed(s, city) {
  if (city.country === 'USA') return null;
  const intl = s.player.profile.international;
  const visaFree = ['Canada', 'United Kingdom', 'Ireland', 'France', 'Austria', 'Germany', 'Spain', 'Portugal', 'Netherlands', 'Denmark', 'Sweden', 'Switzerland', 'Czechia', 'Hungary', 'Japan', 'South Korea', 'Singapore', 'Taiwan', 'Hong Kong', 'Mexico', 'Thailand', 'Australia', 'South Africa', 'Brazil'];
  if (!intl) return visaFree.includes(city.country) ? null : { kind: 'evisa', risk: .04, weeks: 2 };
  const easy = ['Japan', 'South Korea', 'Singapore', 'Thailand', 'Mexico', 'Hong Kong', 'Taiwan'];
  const schengen = ['France', 'Austria', 'Germany', 'Spain', 'Portugal', 'Netherlands', 'Denmark', 'Sweden', 'Switzerland', 'Czechia', 'Hungary'];
  if (schengen.includes(city.country)) return { kind: 'schengen', risk: .10, weeks: 6 };
  if (city.country === 'Canada') return { kind: 'canada', risk: .12, weeks: 8 };
  if (city.country === 'United Kingdom' || city.country === 'Ireland') return { kind: 'uk', risk: .11, weeks: 6 };
  if (easy.includes(city.country)) return { kind: 'easy', risk: .05, weeks: 3 };
  return { kind: 'hard', risk: .18, weeks: 10 };
}
// Re-entering the US on an expired stamp means a consulate appointment and, sometimes, months.
export const stampRisk = s => s.player.profile.international && s.month >= 30 && !s.flags.stampRenewed ? .12 : 0;

export function applyForVisa(s, cityId, choice) {
  const city = cities[cityId];
  const need = visaNeed(s, city);
  s.visaCase = s.visaCase || {};
  if (choice === 'skip') {
    s.visaCase = { cityId, outcome: 'skipped' };
    log(s, t('You do not apply. A co-author presents in {city} and sends you a photograph of eleven people in a room.', { city: t(city.name) }));
    effects(s, { hope: -8, academicCapital: -3, stress: -4 });
    return 'skipped';
  }
  const fee = { schengen: 105, canada: 185, uk: 140, easy: 60, hard: 195, evisa: 45 }[need?.kind] || 0;
  const rush = choice === 'rush';
  charge(s, fee + (rush ? 240 : 0), 'fees');
  const risk = clamp((need?.risk || 0) * (rush ? .8 : 1) - (s.program.prestige > 90 ? .02 : 0), 0, .5);
  const r = random(s);
  if (r < risk * .45) {
    s.visaCase = { cityId, outcome: 'denied' };
    log(s, t('The visa is refused. No reason is given; none is required. Your co-author will present.'));
    message(s, t('Consular Section'), t('Decision on your application'), t('Your application has been refused under section 214(b). This decision is final and not subject to appeal. You may reapply at any time. The fee is not refundable.'), 'life', 'inbox', 'visaDenied');
    effects(s, { hope: -16, stress: 16, confidence: -6 });
    return 'denied';
  }
  if (r < risk) {
    s.visaCase = { cityId, outcome: 'delayed' };
    log(s, t('Administrative processing. The passport is in a building somewhere. The conference starts on Monday.'));
    message(s, t('Consular Section'), t('Your case is in administrative processing'), t('Your application requires additional administrative processing. Processing times vary and cannot be estimated. Please do not make travel arrangements until your passport is returned.'), 'life', 'inbox', 'visaDelayed');
    effects(s, { hope: -10, stress: 14 });
    return 'delayed';
  }
  s.visaCase = { cityId, outcome: 'granted' };
  log(s, t('The visa comes through {when}. You exhale for the first time in three weeks.', { when: rush ? t('in nine days') : t('four days before the flight') }));
  effects(s, { stress: -6, hope: 5 });
  return 'granted';
}

// Entry point at the conference month: the border, then the trip.
export function prepareTrip(s, project) {
  const venue = venueById[project.venueId];
  if (!venue) return null;
  const cityId = pickCity(s, venue);
  const need = visaNeed(s, cities[cityId]);
  if (!need) return startTrip(s, project, cityId);
  s.trip = { phase: 'visa', projectId: project.id, venueId: venue.id, venueName: venue.name, cityId, need, day: 0 };
  s.stage = 'trip';
  return s.trip;
}
export function resolveVisa(s, choice) {
  const trip = s.trip;
  if (!trip || trip.phase !== 'visa') throw new Error(t('There is no application open.'));
  const project = s.projects.find(p => p.id === trip.projectId);
  const outcome = applyForVisa(s, trip.cityId, choice);
  if (outcome === 'granted') { const cityId = trip.cityId; s.trip = null; return startTrip(s, project, cityId); }
  remotePresentation(s, project, trip.cityId, outcome);
  s.trip = null;
  s.stage = 'plan';
  return outcome;
}

// Called when an accepted paper's conference month arrives.
export function startTrip(s, project, forcedCity = null) {
  const venue = venueById[project.venueId];
  if (!venue) return null;
  const cityId = forcedCity || pickCity(s, venue);
  const city = cities[cityId];
  const funded = !!s.flags.travelFunded || (s.advisor.funding > 45 && roll(s, clamp(.35 + s.advisor.funding / 140, 0, .92)));
  const flightId = pickFlight(s, funded);
  const hotelId = pickHotel(s, funded);
  const base = { short: 380, medium: 620, long: 1180, 'very long': 1650 }[city.flight] || 800;
  const airfare = Math.round(base * flights[flightId].cost);
  const nightly = Math.round((city.flight === 'very long' ? 210 : 175) * hotels[hotelId].cost);
  const lodging = nightly * TRIP_DAYS;
  const nightlyRate = nightly;
  const registration = venue.tier === 1 ? 520 : 340;   // the student rate, which is the only rate you will ever pay
  const total = airfare + lodging + registration;
  const covered = funded
    ? Math.round(total * (s.advisor.funding > 75 ? 1 : .88))
    : Math.round(total * (s.advisor.funding > 55 ? .55 : s.advisor.funding > 30 ? .3 : 0));
  const yours = Math.max(0, total - covered);

  charge(s, yours, 'care');
  effects(s, { energy: flights[flightId].energy + (hotels[hotelId].energy || 0), health: (flights[flightId].health || 0) + (hotels[hotelId].health || 0), stress: hotels[hotelId].stress || 0, hope: (flights[flightId].hope || 0) + (hotels[hotelId].hope || 0) });
  if (hotels[hotelId].bond) { const mate = s.labmates.find(l => l.status === 'active' && l.role !== 'phantom'); if (mate) mate.bond = clamp(mate.bond + hotels[hotelId].bond); }
  s.flags.travelFunded = false;

  s.trip = {
    projectId: project.id, venueId: venue.id, venueName: venue.name, cityId,
    flight: flightId, hotel: hotelId, funded, airfare, lodging, registration, covered, yours, nightly: nightlyRate,
    day: 0, talkDay: 1 + Math.floor(random(s) * 2), talkDone: false, talk: null, qa: null, qaIndex: 0,
    activities: [], seenAttractions: [], caught: false, connections: 0, cites: 0, note: null, phase: 'days', days: TRIP_DAYS, upgrades: [],
  };
  s.citiesVisited = [...(s.citiesVisited || []), cityId];
  s.stage = 'trip';
  log(s, t('Flew to {city} for {venue}. {flight} {hotel} You paid ${yours} of ${total}.', { city: t(city.name), venue: venue.name, flight: t(flights[flightId].blurb), hotel: t(hotels[hotelId].blurb), yours, total }));
  if (!funded && yours > 900) log(s, t('The lab covered ${covered} of it. The rest is yours, because the grant ended in March and nobody said so out loud.', { covered }));
  message(s, venue.name, t('Your presentation slot'), t('You are scheduled to present “{title}” on day {n}, in a room whose name is a number. Please arrive fifteen minutes early and bring your slides on a device that has an HDMI port, which yours does not.', { title: project.title, n: s.trip.talkDay + 1 }), 'trip', 'inbox', null);
  return s.trip;
}

// The talk you give at 3 a.m. from your kitchen because the passport did not come back.
export function remotePresentation(s, project, cityId, why) {
  const city = cities[cityId];
  effects(s, { academicCapital: 3, confidence: -2, hope: -4, energy: -6, stress: 4 });
  if (project) { s.citations = s.citations || {}; s.citations[project.id] = (s.citations[project.id] || 0) + 1; }
  const line = why === 'denied'
    ? t('You present over a video link at 3 a.m. your time. The room in {city} is dark and the microphone picks up someone’s chair. Two people ask questions. It counts, on paper, and paper is what counts.', { city: t(city.name) })
    : t('The passport arrives eleven days after the session. You present remotely from your kitchen to a half-empty room in {city}, wearing a shirt above and pyjamas below.', { city: t(city.name) });
  log(s, line);
  s.lastTrip = { city: city.name, venue: venueById[project?.venueId]?.name || '', grade: 'remote', conn: 0, cites: 1 };
  return line;
}

export const tripCity = s => cities[s.trip?.cityId] || null;
export const tripVenue = s => venueById[s.trip?.venueId] || null;
export const tripProject = s => s.projects.find(p => p.id === s.trip?.projectId) || null;

// ── The talk ──────────────────────────────────────────────────────────────────
// The minigame runs in the UI; the engine takes the tally and decides what it meant.
export function scoreTalk(s, tally) {
  const p = tripProject(s);
  const hits = clamp(Number(tally?.hits) || 0, 0, talkSlots.length * 2);
  const hype = clamp(Number(tally?.hype) || 0, 0, talkSlots.length * 2);
  const misses = clamp(Number(tally?.misses) || 0, 0, talkSlots.length * 2);
  const poise = clamp((hits / talkSlots.length) * 100 - hype * 6 - misses * 9 + s.player.skills.communication * .25);
  const grade = poise >= 78 ? 'great' : poise >= 55 ? 'good' : poise >= 32 ? 'ok' : 'rough';
  const lines = {
    great: t('You land it. The room is with you by the third slide and there is a small, real laugh at the limitation slide. Someone films the last minute on their phone.'),
    good: t('Solid. You run four minutes long and the chair does the hand signal, but the argument arrives intact.'),
    ok: t('It happens. You read two slides aloud that did not need reading. Nobody is harmed.'),
    rough: t('You lose the thread in the method and get it back in the results. The chair says “let’s take questions” with visible relief.'),
  };
  const gain = { great: { confidence: 14, academicCapital: 10, hope: 10 }, good: { confidence: 8, academicCapital: 6, hope: 6 }, ok: { confidence: 2, academicCapital: 3 }, rough: { confidence: -6, academicCapital: 1, stress: 8 } }[grade];
  effects(s, gain);
  if (p) { p.writingQuality = clamp(p.writingQuality + { great: 4, good: 2, ok: 0, rough: 0 }[grade]); p.hype = clamp(p.hype + hype * 3); }
  s.trip.talk = { hits, hype, misses, poise: Math.round(poise), grade, line: lines[grade] };
  s.trip.talkDone = true;
  s.trip.connections += { great: 4, good: 2, ok: 1, rough: 0 }[grade];
  s.trip.cites += { great: 3, good: 2, ok: 1, rough: 0 }[grade];
  s.player.skills.communication = clamp(s.player.skills.communication + (grade === 'great' ? 3 : grade === 'good' ? 2 : 1));
  // Who asks, and how hostile they are, depends on how you presented.
  const pool = shuffle(s, questioners);
  const harsh = pool.filter(q => q.tone === 'harsh');
  const soft = pool.filter(q => q.tone !== 'harsh');
  const nHarsh = hype >= 3 ? 2 : hype >= 1 ? 1 : grade === 'rough' ? 2 : 1;
  s.trip.qa = shuffle(s, [...harsh.slice(0, nHarsh), ...soft.slice(0, 3 - nHarsh)]).map(q => q.id);
  s.trip.qaIndex = 0;
  s.trip.qaResults = [];
  log(s, `${t('Presented “{title}” at {venue}.', { title: p?.title || '', venue: s.trip.venueName })} ${lines[grade]}`);
  return s.trip.talk;
}

export function answerQuestion(s, choiceId) {
  const trip = s.trip;
  const qid = trip.qa?.[trip.qaIndex];
  const q = questioners.find(x => x.id === qid);
  if (!q) throw new Error(t('There is no question on the floor.'));
  const opt = q.options[choiceId];
  if (!opt) throw new Error(t('That is not one of the things you could say.'));
  const hyped = (trip.talk?.hype || 0) >= 2;
  const scale = hyped && q.tone === 'harsh' ? 1.4 : 1;
  const good = choiceId === q.best;
  const delta = Object.fromEntries(Object.entries(opt.effects || {}).map(([k, v]) => [k, v < 0 ? v * scale : v]));
  effects(s, delta);
  if (opt.cites) trip.cites += opt.cites;
  if (good) trip.connections += 1;
  trip.qaResults = [...(trip.qaResults || []), { qid, choiceId, good, line: t(opt.line) }];
  trip.qaIndex++;
  if (trip.qaIndex >= (trip.qa?.length || 0)) {
    const wins = trip.qaResults.filter(r => r.good).length;
    trip.qaDone = true;
    effects(s, wins >= 2 ? { confidence: 6, hope: 5 } : wins === 0 ? { confidence: -4, stress: 5 } : {});
    log(s, t('Q&A: {n} of {m} landed. {tail}', { n: wins, m: trip.qaResults.length, tail: wins >= 2 ? t('Three people come up afterwards, which is three more than last year.') : wins === 1 ? t('One person comes up afterwards. It only takes one.') : t('Nobody comes up afterwards. The chair thanks you and calls the next speaker.') }));
    if (wins >= 2) award(s, 'qa');
  }
  return { good, line: t(opt.line) };
}

// ── Days ──────────────────────────────────────────────────────────────────────
export function tripDayOptions(s) {
  const trip = s.trip;
  const isTalkDay = trip.day === trip.talkDay && !trip.talkDone;
  return tripActivities.filter(x => !isTalkDay || x.id !== 'sleep').map(x => ({ ...x }));
}

export function spendTripDay(s, id) {
  const trip = s.trip;
  const act = tripActivities.find(x => x.id === id);
  if (!act) throw new Error(t('That is not on the programme.'));
  if (trip.day === trip.talkDay && !trip.talkDone) throw new Error(t('You present today. Do that first.'));
  let note = t(act.blurb);
  if (act.explore) return exploreCity(s);
  effects(s, { energy: act.energy, ...(act.effects || {}) });
  if (act.connections) trip.connections += act.connections;
  if (act.skill) s.player.skills[act.skill] = clamp(s.player.skills[act.skill] + 1);
  if (act.personality) s.player.personality[act.personality]++;
  if (id === 'coffee' && roll(s, .35)) {
    const who = pick(s, s.peers);
    if (who) { who.bond = clamp(who.bond + 8); note += ' ' + t('{name} is here too, holding two coffees, one of which turns out to be for you.', { name: firstName(who.name) }); }
  }
  if (id === 'banquet' && roll(s, .3)) { trip.cites += 1; note += ' ' + t('You end up at a table with someone whose paper you have cited nine times. They have read yours.'); }
  trip.activities.push(id);
  trip.note = note;
  advanceTripDay(s);
  return note;
}

export function exploreCity(s) {
  const trip = s.trip, city = tripCity(s);
  const unseen = city.attractions.filter((_, i) => !trip.seenAttractions.includes(i));
  const idx = city.attractions.indexOf(pick(s, unseen.length ? unseen : city.attractions));
  const spot = city.attractions[idx];
  trip.seenAttractions.push(idx);
  const tour = (trip.tourCredits || 0) > 0;
  if (tour) trip.tourCredits--;
  charge(s, tour ? 0 : spot.cost);
  const boost = tour ? 1.6 : 1;
  effects(s, { energy: -4, ...Object.fromEntries(Object.entries(spot.effects).map(([k, v]) => [k, Math.round(v * boost)])) });
  s.player.personality.boundarySetter++;
  trip.activities.push('explore');
  let note = tour
    ? t('The booked slot at {place}. {blurb} Doing it properly turns out to be entirely different from doing it.', { place: t(spot.name), blurb: t(spot.blurb) })
    : t('You skip the afternoon sessions and go to {place}. {blurb}', { place: t(spot.name), blurb: t(spot.blurb) });
  // The odds of being seen go up if your advisor came, and if you keep doing it.
  const advisorHere = trip.funded || s.advisor.availability > 60;
  const chance = clamp((advisorHere ? .3 : .12) + trip.seenAttractions.length * .1, 0, .7);
  if (!trip.caught && roll(s, chance)) {
    trip.caught = true;
    const scene = pick(s, caughtScenes);
    trip.caughtScene = { id: scene.id, place: t(spot.name) };
    note += ' ' + fill(s, t(scene.text)).replace('{place}', t(spot.name));
  }
  trip.note = note;
  if (!trip.caughtScene) advanceTripDay(s);
  return note;
}

// Being found outside the venue. None of the answers is wrong; they are just different people.
export function resolveCaught(s, choice) {
  const trip = s.trip;
  const scene = trip.caughtScene;
  if (!scene) throw new Error(t('Nobody is looking for you.'));
  const lines = {
    back: [t('You go back. The idea is good and the conversation is the best twenty minutes of the conference. You do not mention where you were.'), { academicCapital: 4, satisfaction: 6, novelty: 4, hope: -3, energy: -4 }],
    later: [t('“Tomorrow, first thing?” They say fine. They mean fine. You spend an hour deciding whether they meant fine.'), { stress: 5, satisfaction: -3 }],
    honest: [t('“I am at {place}. I flew nine thousand kilometres and I would like to see one thing.” A pause. Then: “Fair. Send me a photo.”', { place: scene.place }), { trust: 6, hope: 8, satisfaction: -2 }],
    join: [t('They join you. For three hours they are a person with opinions about architecture, and on Monday neither of you mentions it, and something has changed anyway.'), { trust: 10, hope: 10, satisfaction: 4, dependency: 3 }],
    awkward: [t('You both pretend to be leaving. You end up walking the same direction for four hundred metres in near silence and then split at a junction with visible relief.'), { stress: 6, hope: 2 }],
  };
  const [line, eff] = lines[choice] || lines.later;
  effects(s, eff);
  trip.caughtScene = null;
  trip.note = line;
  advanceTripDay(s);
  return line;
}

function advanceTripDay(s) {
  const trip = s.trip;
  trip.day++;
  if (trip.day >= (trip.days || TRIP_DAYS)) endTrip(s);
}

// What money buys at a conference: sleep, proximity, and a day that is yours.
export const upgradeOptions = s => {
  const trip = s.trip;
  if (!trip) return [];
  const nightly = trip.nightly || 180;
  const left = Math.max(1, (trip.days || TRIP_DAYS) - trip.day);
  return [
    { id: 'hotel', name: t('Move to the conference hotel'), blurb: t('No more two trains each way. You will be in the lobby where things happen.'),
      cost: Math.round(nightly * 1.5 * left), can: trip.hotel !== 'conference', why: t('You are already in it.') },
    { id: 'extend', name: t('Stay an extra day'), blurb: t('Change the flight, keep the room, and have one day in this city that is not about the conference.'),
      cost: Math.round(nightly + 260), can: (trip.days || TRIP_DAYS) < 6, why: t('Any longer and someone will notice.') },
    { id: 'tour', name: t('Book the proper version of the thing'), blurb: t('The guided one, the early slot, the ticket that skips the queue. You flew here; see it properly.'),
      cost: 140, can: true, why: '' },
  ].map(u => ({ ...u, afford: s.player.stats.money >= u.cost }));
};

export function upgradeTrip(s, id) {
  const trip = s.trip;
  const u = upgradeOptions(s).find(x => x.id === id);
  if (!u) throw new Error(t('That is not on offer.'));
  if (!u.can) throw new Error(u.why || t('Not available.'));
  if (s.player.stats.money < u.cost) throw new Error(t('You cannot afford that, and putting it on the card would follow you home.'));
  charge(s, u.cost);
  trip.upgrades = [...(trip.upgrades || []), id];
  if (id === 'hotel') {
    trip.hotel = 'conference';
    effects(s, { energy: 12, stress: -8, health: 3 });
    trip.note = t('You move hotels mid-conference like a person with a life. The room has a desk and a window and the lifts open onto the poster hall.');
  }
  if (id === 'extend') {
    trip.days = (trip.days || TRIP_DAYS) + 1;
    effects(s, { hope: 8, stress: -6 });
    trip.note = t('One more day. The conference ends and the city stays open and for twenty-four hours you are simply a person who is somewhere.');
  }
  if (id === 'tour') {
    trip.tourCredits = (trip.tourCredits || 0) + 1;
    effects(s, { hope: 5 });
    trip.note = t('Booked. The good slot, the early entry, the one with the guide who actually knows things.');
  }
  trip.yours += u.cost;
  log(s, `${t('Conference upgrade: {name}. −${cost}.', { name: u.name, cost: u.cost })} ${trip.note}`);
  return trip.note;
}

export function endTrip(s) {
  const trip = s.trip;
  const p = tripProject(s);
  const city = tripCity(s);
  // Connections made turn into future citations and a warmer field.
  const conn = trip.connections;
  s.conferenceConnections = (s.conferenceConnections || 0) + conn;
  if (p) { s.citations = s.citations || {}; s.citations[p.id] = (s.citations[p.id] || 0) + trip.cites; s.pendingCites = [...(s.pendingCites || []), { projectId: p.id, n: trip.cites + Math.round(conn / 2), from: 'conference', due: s.month + 2 }]; }
  effects(s, { academicCapital: Math.round(conn * .8), career: Math.round(conn * .6), energy: -6, hope: conn >= 6 ? 8 : 2 });
  if (conn >= 8) award(s, 'hallway');
  // What you actually bring home: two or three people who will answer an email.
  let collab = null;
  if (conn >= 5 && roll(s, clamp(.18 + conn * .045 + s.advisor.connections / 400, 0, .7)) && !s.flags.collabOffer) {
    const from = pick(s, ['a group in {city}', 'a lab you have cited eleven times', 'two people from the poster next to yours', 'a postdoc who is leaving for a faculty job']);
    s.flags.collabOffer = true;
    s.collabFrom = fill(s, t(from)).replace('{city}', t(city.name));
    collab = s.collabFrom;
    effects(s, { hope: 8, academicCapital: 4 });
    message(s, t('A new collaborator'), t('Following up from {venue}', { venue: trip.venueName }), t('Hi — great talk. We have a dataset that would suit your method and no time to run it ourselves. Would you be interested in something joint? Low pressure, and I have told my student to be realistic about timelines, which he will ignore.'), 'dashboard', 'inbox', 'collabOffer');
    log(s, t('You come home with a collaboration offer from {who}. Your advisor will have opinions.', { who: collab }));
  }
  // What you actually bring home is people, not a number. One for a decent trip, two for a good
  // one, three if you spent the whole week in the hallway rather than the sessions.
  const met = conn >= 9 ? 3 : conn >= 5 ? 2 : conn >= 2 ? 1 : 0;
  for (let i = 0; i < met; i++) {
    const kind = pick(s, ['prof', 'postdoc', 'postdoc', 'researcher', 'student', 'student']);
    const who = meetContact(s, { kind, where: i === 0 ? 'poster' : 'conference', venue: trip.venueName });
    if (who) log(s, t('You come home knowing {name} ({org}), met {where}. They will answer an email for about four months unless you give them a reason not to.', { name: who.kind === 'prof' ? t('Prof. {n}', { n: lastName(who.name) }) : who.name, org: who.org, where: t(i === 0 ? 'at the poster next to yours' : 'at {venue}', { venue: trip.venueName }) }));
  }
  if (conn >= 3 && s.advisor.connections < 92) s.advisor.connections = clamp(s.advisor.connections + 1);
  const summary = t('Home from {city}. {conn} real conversations, {cites} people who said they would cite it, and a lanyard you will find in a coat pocket in March.', { city: t(city.name), conn, cites: trip.cites });
  log(s, summary);
  message(s, trip.venueName, t('Thank you for attending'), t('We hope you enjoyed {venue} in {city}. Slides are due to the chairs by Friday. Next year’s edition will be somewhere further away.', { venue: trip.venueName, city: t(city.name) }), 'browser', 'inbox', null);
  s.lastTrip = { city: city.name, venue: trip.venueName, grade: trip.talk?.grade || 'none', conn, cites: trip.cites };
  s.trip = null;
  s.stage = s.stage === 'trip' ? 'plan' : s.stage;
  return summary;
}
