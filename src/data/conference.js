// Conference travel. Cities are the real ones these conferences actually rotate through
// (NeurIPS: New Orleans, Vancouver, San Diego, Paris; ICML: Vienna, Honolulu, Vancouver, Seoul;
// ICLR: Vienna, Singapore, Rio; CVPR: Seattle, Nashville, Denver; ACL: Bangkok, Vienna, Toronto;
// EMNLP: Miami, Budapest; CHI: Yokohama, Barcelona, Hamburg; ICRA: Atlanta, Vienna, Yokohama;
// SOSP/OSDI: Austin, Seoul, Prague, Boston; AAAI: Philadelphia, Vancouver, Singapore).
// The attractions are real places. The jokes are ours.

const a = (name, blurb, cost, effects) => ({ name, blurb, cost, effects });

export const cities = {
  vancouver: { name: 'Vancouver', country: 'Canada', flight: 'long', blurb: 'Rain, mountains, and a convention centre with a grass roof.',
    attractions: [
      a('the Stanley Park seawall', 'Ten kilometres of coastline and not one person asking about your baselines.', 0, { hope: 8, stress: -10, energy: -3, health: 3 }),
      a('Granville Island market', 'You buy a pastry the size of your head and eat it looking at boats.', 22, { hope: 6, stress: -6, health: 2 }),
      a('Grouse Mountain', 'A gondola, then a view of the whole city being rained on gently.', 68, { hope: 10, stress: -12, energy: -6 }),
    ] },
  neworleans: { name: 'New Orleans', country: 'USA', flight: 'medium', blurb: 'The conference centre is enormous and the city outside it is louder.',
    attractions: [
      a('Café du Monde', 'Beignets at 7 a.m., powdered sugar on a conference badge you forgot to remove.', 12, { hope: 7, stress: -6, health: -1 }),
      a('the St. Charles streetcar', 'Forty minutes past oak trees and houses, for three dollars, going nowhere.', 3, { hope: 6, stress: -9, energy: 2 }),
      a('Frenchmen Street', 'A three-piece band in a room the size of a kitchen. You stay for the second set.', 30, { hope: 12, stress: -10, energy: -8 }),
    ] },
  sandiego: { name: 'San Diego', country: 'USA', flight: 'medium', blurb: 'Seventy-two degrees and a conference hall with no windows.',
    attractions: [
      a('La Jolla Cove', 'Sea lions, entirely unbothered, doing what you are supposed to be doing.', 0, { hope: 9, stress: -10, health: 4 }),
      a('Balboa Park', 'Museums, gardens, and an organ pavilion. You sit on a bench for an hour.', 18, { hope: 7, stress: -8 }),
      a('Coronado beach', 'You put your feet in the Pacific in conference trousers.', 8, { hope: 8, stress: -9, health: 3 }),
    ] },
  paris: { name: 'Paris', country: 'France', flight: 'long', blurb: 'The venue is at Porte de Versailles, which is not the Paris on the postcard.',
    attractions: [
      a('the Musée d’Orsay', 'Two hours in a converted railway station. You cry slightly at a Caillebotte and blame the jet lag.', 16, { hope: 11, stress: -10 }),
      a('Père Lachaise', 'A cemetery the size of a neighbourhood. Extremely calming, which worries you.', 0, { hope: 6, stress: -12 }),
      a('a two-hour lunch', 'You order badly, in French, and it arrives anyway and it is perfect.', 40, { hope: 9, stress: -8, health: 4 }),
    ] },
  vienna: { name: 'Vienna', country: 'Austria', flight: 'long', blurb: 'Trams that arrive when the sign says, which alone is worth the flight.',
    attractions: [
      a('a Kaffeehaus', 'One coffee, one newspaper on a stick, three hours. The waiter is rude in a way you come to respect.', 9, { hope: 8, stress: -11, health: 1 }),
      a('the Kunsthistorisches Museum', 'Bruegel’s hunters in the snow, in person, smaller than you expected and better.', 21, { hope: 10, stress: -8 }),
      a('the Prater', 'A hundred-year-old ferris wheel that moves at the speed of thought.', 14, { hope: 7, stress: -7 }),
    ] },
  singapore: { name: 'Singapore', country: 'Singapore', flight: 'very long', blurb: 'The jet lag is a physical object you carry from room to room.',
    attractions: [
      a('Maxwell hawker centre', 'Four dollars, a queue of locals, the best thing you eat all year.', 6, { hope: 9, stress: -7, health: 4 }),
      a('Gardens by the Bay', 'Enormous fake trees that light up. It should be tacky. It is not.', 20, { hope: 8, stress: -8, energy: -3 }),
      a('the Botanic Gardens at dawn', 'Awake at 5 a.m. anyway. You may as well use it.', 0, { hope: 7, stress: -9, health: 3, energy: -2 }),
    ] },
  seoul: { name: 'Seoul', country: 'South Korea', flight: 'very long', blurb: 'The conference wifi is faster than your university’s. Everything is.',
    attractions: [
      a('Gwangjang Market', 'You point at something, eat it standing, and point at it again.', 11, { hope: 9, stress: -7, health: 3 }),
      a('Bukchon Hanok Village', 'Narrow lanes and tiled roofs, ten minutes from a subway that runs every three.', 0, { hope: 8, stress: -8, energy: -3 }),
      a('the Han River at night', 'Fried chicken on a mat by the water with two thousand other people doing the same.', 16, { hope: 11, stress: -10 }),
    ] },
  rio: { name: 'Rio de Janeiro', country: 'Brazil', flight: 'very long', blurb: 'A conference centre with a view you will not get to look at.',
    attractions: [
      a('the Sugarloaf cable car', 'The whole bay at once. You take fourteen photos and none of them work.', 32, { hope: 11, stress: -10, energy: -4 }),
      a('Escadaria Selarón', 'Two hundred and fifteen steps of other people’s broken tiles.', 0, { hope: 7, stress: -6 }),
      a('Copacabana at 6 a.m.', 'Old men doing calisthenics. You join, badly, for eleven minutes.', 0, { hope: 9, stress: -9, health: 5 }),
    ] },
  seattle: { name: 'Seattle', country: 'USA', flight: 'medium', blurb: 'Grey in a way that is genuinely restful after a deadline.',
    attractions: [
      a('Pike Place Market', 'You watch someone throw a fish and feel briefly uncomplicated.', 14, { hope: 6, stress: -6 }),
      a('the ferry to Bainbridge', 'Thirty-five minutes each way. You do not get off. You just ride back.', 10, { hope: 9, stress: -12, energy: 2 }),
      a('Discovery Park', 'A lighthouse, a beach, and the Olympics across the water on a clear day.', 0, { hope: 8, stress: -9, health: 4, energy: -3 }),
    ] },
  nashville: { name: 'Nashville', country: 'USA', flight: 'short', blurb: 'The conference hotel plays country music in the lift.',
    attractions: [
      a('Broadway at 4 p.m.', 'Three bars, three bands, all of them better than the keynote.', 25, { hope: 9, stress: -8, energy: -5 }),
      a('the Parthenon replica', 'A full-scale Parthenon in a park. Nobody can adequately explain why.', 10, { hope: 6, stress: -5 }),
      a('hot chicken', 'You order medium. Medium is a lie. You have a religious experience.', 18, { hope: 8, stress: -4, health: -2 }),
    ] },
  denver: { name: 'Denver', country: 'USA', flight: 'short', blurb: 'A mile up. Your first coffee hits differently and so does the second.',
    attractions: [
      a('Red Rocks', 'You walk up the steps with the tourists and the runners and sit at the top.', 12, { hope: 10, stress: -11, energy: -6, health: 3 }),
      a('Union Station', 'A grand hall with sofas where nobody minds if you sit and read.', 0, { hope: 5, stress: -7 }),
      a('a brewery in RiNo', 'Four small glasses in a paddle. You do not finish the sour.', 22, { hope: 7, stress: -8, health: -1 }),
    ] },
  miami: { name: 'Miami', country: 'USA', flight: 'medium', blurb: 'The convention centre air conditioning is set to a temperature that has no defenders.',
    attractions: [
      a('Little Havana', 'A window on Calle Ocho, a cortadito, dominoes being played seriously.', 8, { hope: 8, stress: -7 }),
      a('the Wynwood Walls', 'Enormous murals and a great deal of other people photographing them.', 12, { hope: 6, stress: -5 }),
      a('South Beach at 7 a.m.', 'Empty, warm, and completely unlike the South Beach in the photographs.', 0, { hope: 9, stress: -10, health: 4 }),
    ] },
  bangkok: { name: 'Bangkok', country: 'Thailand', flight: 'very long', blurb: 'You arrive at 1 a.m. and it is thirty-one degrees.',
    attractions: [
      a('Wat Pho', 'A reclining Buddha forty-six metres long. Scale does something to a person.', 6, { hope: 10, stress: -9 }),
      a('a Chao Phraya river boat', 'Fifteen baht, standing at the back, the whole city going past sideways.', 1, { hope: 8, stress: -10 }),
      a('Yaowarat after dark', 'Street food for hours. You eat six things and can name two.', 14, { hope: 11, stress: -8, health: 2 }),
    ] },
  yokohama: { name: 'Yokohama', country: 'Japan', flight: 'very long', blurb: 'Twenty-eight minutes from Tokyo and much quieter about it.',
    attractions: [
      a('Sankeien Garden', 'Relocated historic buildings around a pond. You sit for an hour without a phone.', 7, { hope: 9, stress: -12, health: 2 }),
      a('the Cup Noodles Museum', 'You design your own cup noodle. It is the highlight of the trip and you will defend that.', 5, { hope: 8, stress: -7 }),
      a('Minato Mirai at night', 'A harbour, a ferris wheel that is also a clock, and a lot of quiet walking.', 0, { hope: 7, stress: -9 }),
    ] },
  barcelona: { name: 'Barcelona', country: 'Spain', flight: 'long', blurb: 'The venue is in a business district; the city is elsewhere and knows it.',
    attractions: [
      a('the Sagrada Família', 'You booked the 9 a.m. slot. The light through the east windows does the thing.', 28, { hope: 12, stress: -9 }),
      a('Park Güell', 'Uphill, then a view of the whole city and the sea behind it.', 13, { hope: 8, stress: -8, energy: -4 }),
      a('the Gothic Quarter', 'You get lost on purpose for two hours and eat standing at a bar.', 20, { hope: 9, stress: -10 }),
    ] },
  atlanta: { name: 'Atlanta', country: 'USA', flight: 'short', blurb: 'The airport is the busiest in the world and you will feel every passenger.',
    attractions: [
      a('the BeltLine', 'A former railway, now a path with murals and a great deal of ice cream.', 6, { hope: 7, stress: -8, health: 3 }),
      a('the Center for Civil and Human Rights', 'An hour that reorders what you were worried about.', 20, { hope: 8, stress: -6 }),
      a('Ponce City Market', 'A converted Sears building with a rooftop and a slide. You take the slide.', 16, { hope: 6, stress: -6 }),
    ] },
  austin: { name: 'Austin', country: 'USA', flight: 'short', blurb: 'Thirty-eight degrees and the conference badge lanyard sticks to your neck.',
    attractions: [
      a('Barton Springs', 'A spring-fed pool at a constant twenty degrees. It is a shock and then it is heaven.', 9, { hope: 10, stress: -12, health: 5 }),
      a('the bats under Congress Bridge', 'A million and a half of them, at dusk, on schedule, unlike anything else this week.', 0, { hope: 8, stress: -7 }),
      a('the barbecue queue', 'Three hours in a line. You make friends. The brisket justifies the friends.', 32, { hope: 9, stress: -5, energy: -6, health: -1 }),
    ] },
  boston: { name: 'Boston', country: 'USA', flight: 'short', blurb: 'Everyone at the conference has a former labmate here.',
    attractions: [
      a('the Isabella Stewart Gardner', 'A courtyard in January, and empty frames where the stolen paintings were.', 20, { hope: 9, stress: -9 }),
      a('the Charles Esplanade', 'Sailboats, runners, and a bench that is yours for forty minutes.', 0, { hope: 7, stress: -10, health: 3 }),
      a('a cannoli in the North End', 'You join the argument about which bakery. You have no standing in this argument.', 8, { hope: 6, stress: -5, health: -1 }),
    ] },
  prague: { name: 'Prague', country: 'Czechia', flight: 'long', blurb: 'A conference venue in a building that used to be something grander.',
    attractions: [
      a('Charles Bridge at 6 a.m.', 'Empty, foggy, and briefly yours. By nine it belongs to four thousand people.', 0, { hope: 11, stress: -11, energy: -3 }),
      a('Vyšehrad', 'The other castle. Nobody goes. There is a view and a cemetery and nothing to buy.', 4, { hope: 8, stress: -9 }),
      a('a beer hall', 'They bring another one when the old one is empty. You must actively stop this.', 14, { hope: 7, stress: -9, health: -2 }),
    ] },
  philadelphia: { name: 'Philadelphia', country: 'USA', flight: 'short', blurb: 'The convention centre is downtown, which is unusual and useful.',
    attractions: [
      a('Reading Terminal Market', 'Eighty stalls under one roof. You do a full lap before choosing and choose wrong.', 15, { hope: 7, stress: -6 }),
      a('the Barnes Foundation', 'Paintings hung in an order that a dead man insisted on. It works.', 30, { hope: 9, stress: -8 }),
      a('the art museum steps', 'You run up them. You are alone in this and it is fine.', 0, { hope: 8, stress: -7, health: 3 }),
    ] },
  montreal: { name: 'Montreal', country: 'Canada', flight: 'medium', blurb: 'It is minus eighteen and the conference is underground, mercifully.',
    attractions: [
      a('Mont Royal', 'Up through the snow to a view of the whole island and the river beyond.', 0, { hope: 9, stress: -10, energy: -5, health: 3 }),
      a('Jean-Talon Market', 'In winter, half-shuttered, but the cheese counter is a place of worship.', 18, { hope: 7, stress: -7 }),
      a('the bagel argument', 'St-Viateur or Fairmount. You try both at midnight, warm, from the bag.', 7, { hope: 8, stress: -6 }),
    ] },
  honolulu: { name: 'Honolulu', country: 'USA', flight: 'very long', blurb: 'A conference in paradise, held in a windowless ballroom, for five days.',
    attractions: [
      a('Diamond Head at sunrise', 'Up at 4:30, which the jet lag has already arranged for you.', 5, { hope: 11, stress: -11, health: 4, energy: -6 }),
      a('the Bishop Museum', 'The actual history of the place you have flown to and were about to ignore.', 25, { hope: 8, stress: -6 }),
      a('shave ice', 'You get the one with the ice cream at the bottom. Obviously you do.', 6, { hope: 6, stress: -5, health: -1 }),
    ] },
  budapest: { name: 'Budapest', country: 'Hungary', flight: 'long', blurb: 'Two cities, one river, and a venue on the wrong side of it.',
    attractions: [
      a('the Széchenyi baths', 'Outdoor thermal pools in the cold. Old men playing chess in the water.', 24, { hope: 12, stress: -14, health: 5 }),
      a('the Great Market Hall', 'Paprika in quantities that suggest a national emergency.', 12, { hope: 6, stress: -6 }),
      a('the Danube at night', 'The parliament lit up from the far bank. You stand there longer than planned.', 0, { hope: 8, stress: -9 }),
    ] },
  baltimore: { name: 'Baltimore', country: 'USA', flight: 'short', blurb: 'The Inner Harbor convention centre, and a city that is much better than its reputation.',
    attractions: [
      a('the American Visionary Art Museum', 'Outsider art in a converted whiskey warehouse. Nothing in it is trying to impress a committee.', 16, { hope: 10, stress: -9 }),
      a('a crab house', 'Brown paper, a mallet, two hours of work for a modest amount of food. You love it.', 34, { hope: 8, stress: -7, health: 1 }),
      a('Fell’s Point', 'Cobbles, a harbour, and a bar that has been open since before the country was.', 14, { hope: 6, stress: -7 }),
    ] },
  santaclara: { name: 'Santa Clara', country: 'USA', flight: 'medium', blurb: 'A convention centre between a freeway and a theme park. This is the whole city, conference-wise.',
    attractions: [
      a('the Computer History Museum', 'A working PDP-1 and a room that makes your work feel both small and part of something.', 20, { hope: 9, stress: -6, readiness: 3 }),
      a('a train into San Francisco', 'Ninety minutes each way for four hours in a real city. Worth it.', 22, { hope: 10, stress: -9, energy: -6 }),
      a('the Mission Santa Clara gardens', 'Roses, a bell, and the only quiet within six kilometres.', 0, { hope: 5, stress: -7 }),
    ] },
  pittsburgh: { name: 'Pittsburgh', country: 'USA', flight: 'short', blurb: 'Three rivers, four hundred bridges, and a robotics department everyone has heard of.',
    attractions: [
      a('the Duquesne Incline', 'A wooden funicular from 1877 and the best view of any city on this list.', 3, { hope: 9, stress: -8 }),
      a('the Carnegie Museum', 'Dinosaurs and Impressionists in the same building, funded by the same steel.', 25, { hope: 8, stress: -7 }),
      a('a sandwich with the fries inside it', 'You are told this is essential. It is structurally unwise and completely correct.', 12, { hope: 6, stress: -4, health: -2 }),
    ] },
  munich: { name: 'Munich', country: 'Germany', flight: 'long', blurb: 'The venue runs precisely on time, which is disorienting.',
    attractions: [
      a('the Englischer Garten', 'People surfing a standing wave on a river, in the middle of a city, in October.', 0, { hope: 10, stress: -10, health: 3 }),
      a('the Deutsches Museum', 'Six floors of machines. You lose two hours in mining and regret nothing.', 15, { hope: 8, stress: -7 }),
      a('a beer garden', 'Long tables, strangers, a pretzel the size of a steering wheel.', 18, { hope: 8, stress: -9, health: -1 }),
    ] },
  tokyo: { name: 'Tokyo', country: 'Japan', flight: 'very long', blurb: 'The venue is one exit of a station that has fourteen. You will use the wrong one twice.',
    attractions: [
      a('the Shinjuku Gyoen garden', 'Five hundred yen buys silence in the middle of the largest city on earth.', 4, { hope: 10, stress: -12, health: 2 }),
      a('a standing sushi bar', 'Eleven minutes, eight pieces, no conversation, transcendent.', 22, { hope: 9, stress: -6, health: 3 }),
      a('Shimokitazawa at night', 'Record shops, second-hand coats, and a bar with six seats.', 26, { hope: 11, stress: -9, energy: -5 }),
    ] },
  kyoto: { name: 'Kyoto', country: 'Japan', flight: 'very long', blurb: 'A workshop venue in a temple district, which does complicated things to your priorities.',
    attractions: [
      a('Fushimi Inari at 6 a.m.', 'Ten thousand gates and, for an hour, almost nobody in them.', 0, { hope: 13, stress: -12, energy: -5 }),
      a('the Philosopher’s Path', 'A canal, cherry trees, and a two-kilometre walk designed for thinking.', 0, { hope: 9, stress: -11, health: 3 }),
      a('a kissaten', 'Coffee poured over four minutes by a man who has done this for forty years.', 9, { hope: 8, stress: -8 }),
    ] },
  london: { name: 'London', country: 'United Kingdom', flight: 'long', blurb: 'The conference is in a university building with no air conditioning and a heatwave.',
    attractions: [
      a('the British Museum', 'Free, enormous, and morally complicated. You do one wing properly.', 0, { hope: 8, stress: -7 }),
      a('a walk along the South Bank', 'Skateboarders, second-hand books under a bridge, the river doing its thing.', 0, { hope: 7, stress: -9, health: 2 }),
      a('a pub with no music', 'Two hours, one pint, a conversation with a stranger about nothing.', 18, { hope: 8, stress: -9 }),
    ] },
  amsterdam: { name: 'Amsterdam', country: 'Netherlands', flight: 'long', blurb: 'The venue is a fifteen-minute cycle from everything and you do not have a bicycle.',
    attractions: [
      a('the Rijksmuseum', 'The Vermeer room. You stand in front of the milk pourer for eleven minutes.', 24, { hope: 11, stress: -9 }),
      a('a canal walk at dusk', 'Bicycles, house-boats, and light that makes everything look deliberate.', 0, { hope: 9, stress: -10 }),
      a('the Jordaan on a Saturday', 'A market, a herring stand, an argument about the herring stand.', 14, { hope: 7, stress: -7 }),
    ] },
  copenhagen: { name: 'Copenhagen', country: 'Denmark', flight: 'long', blurb: 'Everything is expensive, well-designed, and closes early.',
    attractions: [
      a('a swim at Islands Brygge', 'Harbour water, clean enough to swim in, in the middle of a capital city.', 0, { hope: 11, stress: -12, health: 5 }),
      a('the Louisiana museum', 'A train up the coast to art in a house with a lawn that runs to the sea.', 30, { hope: 12, stress: -10, energy: -5 }),
      a('a bakery cardamom bun', 'You have four across three days and consider extending the trip.', 8, { hope: 6, stress: -5, health: -1 }),
    ] },
  stockholm: { name: 'Stockholm', country: 'Sweden', flight: 'long', blurb: 'Fourteen islands, one convention centre, twenty hours of daylight.',
    attractions: [
      a('the Vasa Museum', 'A warship that sank in 1628 after 1,300 metres. A cautionary tale about scope.', 22, { hope: 9, stress: -7 }),
      a('Gamla Stan', 'Narrow streets, ochre buildings, a coffee and a bun as a legal institution.', 12, { hope: 7, stress: -8 }),
      a('a ferry between islands', 'Twenty minutes on the water for the price of a bus ticket.', 5, { hope: 8, stress: -10 }),
    ] },
  lisbon: { name: 'Lisbon', country: 'Portugal', flight: 'long', blurb: 'The conference hotel is up a hill. Everything is up a hill.',
    attractions: [
      a('the 28 tram', 'A wooden tram through streets it barely fits in. Stand and hold on.', 4, { hope: 8, stress: -7 }),
      a('a miradouro at sunset', 'A viewpoint, a bottle, forty other people having the same good idea.', 9, { hope: 11, stress: -10 }),
      a('a pastel de nata, warm', 'You have three. The cinnamon is not optional and you will fight about it.', 5, { hope: 7, stress: -5 }),
    ] },
  zurich: { name: 'Zurich', country: 'Switzerland', flight: 'long', blurb: 'A lunch costs what your weekly grocery shop costs. You eat at the venue.',
    attractions: [
      a('a swim in the Limmat', 'The river runs through the city and in summer the city gets in it.', 0, { hope: 10, stress: -11, health: 4 }),
      a('the Kunsthaus', 'Giacometti in the building that has the most of him.', 26, { hope: 8, stress: -7 }),
      a('a train into the mountains', 'Ninety minutes to a lake with a colour you will describe badly for years.', 62, { hope: 13, stress: -13, energy: -6 }),
    ] },
  dublin: { name: 'Dublin', country: 'Ireland', flight: 'long', blurb: 'It rains in a way that is not quite rain, continuously, for four days.',
    attractions: [
      a('the Long Room at Trinity', 'Two hundred thousand books in a barrel-vaulted hall that smells like the past.', 20, { hope: 10, stress: -8 }),
      a('a walk out to Howth', 'A cliff path, a harbour, a bag of chips in the wind.', 8, { hope: 9, stress: -10, health: 3 }),
      a('a session in a back room', 'Six musicians, no microphone, nobody clapping until the end of the set.', 16, { hope: 11, stress: -9 }),
    ] },
  hongkong: { name: 'Hong Kong', country: 'Hong Kong', flight: 'very long', blurb: 'The venue is on the eleventh floor of something attached to a mall.',
    attractions: [
      a('the Star Ferry', 'Two dollars fifty across the harbour. The best value on this entire list.', 1, { hope: 8, stress: -8 }),
      a('the Dragon’s Back trail', 'Ninety minutes of ridge, then a beach, then a bus back into the towers.', 6, { hope: 11, stress: -11, health: 5, energy: -7 }),
      a('a dai pai dong', 'Plastic stools on the street, a wok on full flame, food at eleven at night.', 13, { hope: 9, stress: -7 }),
    ] },
  sydney: { name: 'Sydney', country: 'Australia', flight: 'very long', blurb: 'Twenty-two hours of flying, a day lost in transit, and a conference that starts on Monday.',
    attractions: [
      a('the Bondi to Coogee walk', 'Six kilometres of cliff path and four beaches. You do it before the keynote.', 0, { hope: 12, stress: -12, health: 5, energy: -6 }),
      a('the Opera House steps', 'You do not go in. You sit on the steps, which is the better experience.', 0, { hope: 8, stress: -8 }),
      a('a ferry to Manly', 'Thirty minutes past the heads, salt on the window, a flat white on arrival.', 10, { hope: 10, stress: -11 }),
    ] },
  melbourne: { name: 'Melbourne', country: 'Australia', flight: 'very long', blurb: 'Four seasons in the four hours of the poster session.',
    attractions: [
      a('a laneway coffee', 'They will ask how you want it and they will mean it. Do not say “regular.”', 6, { hope: 7, stress: -6 }),
      a('the NGV', 'Free, enormous, with a stained-glass ceiling people lie on the floor to look at.', 0, { hope: 9, stress: -8 }),
      a('the Queen Victoria Market', 'A borek, a bag of cherries, and a walk home with both.', 14, { hope: 7, stress: -6, health: 2 }),
    ] },
  mexicocity: { name: 'Mexico City', country: 'Mexico', flight: 'medium', blurb: 'Two thousand two hundred metres up. The first day is a slow one.',
    attractions: [
      a('the Museo Nacional de Antropología', 'Four hours minimum, and you will not have four hours, and you should make four hours.', 6, { hope: 12, stress: -9, energy: -5 }),
      a('a walk through Coyoacán', 'Cobbles, jacarandas, a market, and Frida Kahlo’s blue house if you booked ahead.', 15, { hope: 10, stress: -10 }),
      a('tacos al pastor at midnight', 'A vertical spit, a man with a knife, pineapple in flight. Eat five.', 8, { hope: 9, stress: -6, health: 1 }),
    ] },
  capetown: { name: 'Cape Town', country: 'South Africa', flight: 'very long', blurb: 'The venue faces a mountain and every session has people looking out of the window.',
    attractions: [
      a('Table Mountain', 'Cable car up, walk down, and the entire peninsula laid out below you.', 30, { hope: 13, stress: -12, energy: -7 }),
      a('the Company’s Garden', 'Oaks, squirrels, and a bench between two museums.', 0, { hope: 6, stress: -8 }),
      a('Kalk Bay', 'A train along the water to a harbour with a fish shop and seals in it.', 12, { hope: 10, stress: -10 }),
    ] },
  taipei: { name: 'Taipei', country: 'Taiwan', flight: 'very long', blurb: 'The convention centre is under a very tall building and the humidity is total.',
    attractions: [
      a('Elephant Mountain at dusk', 'Twenty minutes of stairs for the photograph everyone takes and it still works.', 0, { hope: 10, stress: -9, health: 3, energy: -4 }),
      a('a night market', 'You eat six things standing up and can identify three of them.', 11, { hope: 9, stress: -7 }),
      a('a mountain teahouse in Maokong', 'A gondola, then tea poured for two hours while the city sits below in the haze.', 18, { hope: 11, stress: -12 }),
    ] },
  addis: { name: 'Addis Ababa', country: 'Ethiopia', flight: 'very long', blurb: 'The first edition of this conference held on the continent, and half the field could not get visas.',
    attractions: [
      a('a coffee ceremony', 'Green beans roasted in front of you, three rounds, an hour and a half. This is where coffee is from.', 6, { hope: 12, stress: -11 }),
      a('the National Museum', 'Lucy, three and a half million years old, in a basement case. You stand there a while.', 4, { hope: 10, stress: -7 }),
      a('Mercato', 'The largest open-air market in Africa. You buy nothing and see everything.', 3, { hope: 8, stress: -5, energy: -5 }),
    ] },
  hamburg: { name: 'Hamburg', country: 'Germany', flight: 'long', blurb: 'A conference centre by a lake in the middle of the city, which should be normal and is not.',
    attractions: [
      a('the Elbphilharmonie plaza', 'A free escalator to a viewing deck over the port. You go twice.', 0, { hope: 9, stress: -8 }),
      a('the Sunday fish market at 5 a.m.', 'Still open from Saturday night. A band. Fish. It is 5 a.m.', 12, { hope: 10, stress: -6, energy: -6 }),
      a('a walk around the Alster', 'Seven kilometres round a lake, with swans that are not friendly.', 0, { hope: 7, stress: -9, health: 3 }),
    ] },
  glasgow: { name: 'Glasgow', country: 'United Kingdom', flight: 'long', blurb: 'The venue is Victorian and the wifi predates the building’s last refurbishment.',
    attractions: [
      a('the Kelvingrove', 'Free, a Dalí, an organ recital at one o’clock, and a stuffed elephant.', 0, { hope: 9, stress: -8 }),
      a('a walk up the Necropolis', 'A hill of Victorian tombs above the cathedral, and the whole city under grey light.', 0, { hope: 7, stress: -8 }),
      a('a pub on Ashton Lane', 'Three hours, four strangers, and someone explaining Scottish politics with total confidence.', 20, { hope: 10, stress: -10 }),
    ] },
  toronto: { name: 'Toronto', country: 'Canada', flight: 'medium', blurb: 'The convention centre is attached to a railway station, a hotel, and a mall.',
    attractions: [
      a('Kensington Market', 'Vintage shops, a Jamaican patty, and a street that refuses to be tidy.', 12, { hope: 7, stress: -7 }),
      a('the Toronto Islands ferry', 'Fifteen minutes across the harbour to somewhere with no cars.', 9, { hope: 9, stress: -11, health: 3 }),
      a('the AGO', 'A staircase by Gehry that is better than most of the art, which is also good.', 25, { hope: 7, stress: -7 }),
    ] },
};

// Which real cities each conference archetype actually rotates through.
export const venueCities = {
  NeurIPS: ['neworleans', 'vancouver', 'sandiego', 'paris', 'montreal', 'barcelona'],
  ICML: ['vienna', 'honolulu', 'vancouver', 'seoul', 'baltimore', 'stockholm', 'sydney'],
  ICLR: ['vienna', 'singapore', 'rio', 'seoul', 'addis', 'lisbon'],
  AAAI: ['philadelphia', 'vancouver', 'singapore'],
  IJCAI: ['vienna', 'montreal', 'yokohama', 'melbourne', 'stockholm'],
  CVPR: ['seattle', 'nashville', 'denver', 'neworleans', 'vancouver'],
  KDD: ['barcelona', 'toronto', 'seattle', 'london', 'amsterdam'],
  ACL: ['bangkok', 'vienna', 'toronto', 'sandiego', 'dublin', 'melbourne', 'lisbon'],
  EMNLP: ['miami', 'budapest', 'singapore', 'hongkong', 'lisbon'],
  NAACL: ['seattle', 'montreal', 'philadelphia'],
  OSDI: ['boston', 'santaclara', 'seattle'],
  SOSP: ['austin', 'seoul', 'prague', 'amsterdam', 'kyoto'],
  NSDI: ['boston', 'philadelphia', 'seattle'],
  STOC: ['vancouver', 'prague', 'denver', 'zurich', 'capetown'],
  FOCS: ['boston', 'sandiego', 'montreal', 'zurich'],
  SODA: ['neworleans', 'vancouver', 'philadelphia'],
  CHI: ['yokohama', 'barcelona', 'honolulu', 'toronto', 'hamburg', 'glasgow', 'melbourne'],
  UIST: ['pittsburgh', 'seoul', 'vancouver', 'tokyo', 'copenhagen'],
  CSCW: ['sandiego', 'toronto', 'yokohama', 'mexicocity'],
  ICRA: ['atlanta', 'vienna', 'yokohama', 'london', 'sydney'],
  RSS: ['seoul', 'denver', 'philadelphia', 'tokyo', 'zurich'],
  CoRL: ['seoul', 'munich', 'atlanta', 'taipei'],
};

// Flights, hotels, and the difference funding makes.
export const flights = {
  redeye: { name: 'The red-eye', blurb: 'Departs 11:40 p.m., arrives 6:15 a.m., you have a session at nine.', energy: -22, cost: .8, health: -4 },
  layover: { name: 'Two connections', blurb: 'Cheapest fare on the portal. Four hours in an airport you will not remember.', energy: -16, cost: .72, health: -2 },
  normal: { name: 'One connection, daytime', blurb: 'Reasonable. Middle seat. A man beside you watches an action film with no headphones.', energy: -9, cost: 1 },
  direct: { name: 'Direct, booked early', blurb: 'The lab has funding and someone did the paperwork in March.', energy: -4, cost: 1.35, hope: 4 },
};
export const hotels = {
  far: { name: 'A place forty minutes out', blurb: 'Two trains each way. You will do this eight times.', cost: .55, energy: -4, stress: 3 },
  share: { name: 'Share a room with a labmate', blurb: 'They snore. You will learn something about them that changes nothing and everything.', cost: .45, energy: -2, bond: 10 },
  conference: { name: 'The conference hotel', blurb: 'Expensive, adjacent, and full of people who will corner you by the lifts.', cost: 1.6, energy: 4 },
  hostel: { name: 'A hostel bunk', blurb: 'Nineteen years old and travelling, all of them, in the same room as you.', cost: .22, energy: -8, health: -3, hope: 2 },
};

// The talk itself. Six sections; the right words build a talk, the hype words build a reputation.
export const talkSlots = [
  { id: 'motivation', label: 'Motivation', good: ['the problem', 'why it matters', 'a real failure case'], hype: ['revolutionary', 'paradigm shift'], filler: ['as we all know', 'basically', 'so yeah'] },
  { id: 'problem', label: 'The gap', good: ['what is missing', 'prior work stops here', 'the open question'], hype: ['nobody has ever', 'completely unsolved'], filler: ['moving on', 'anyway', 'um'] },
  { id: 'method', label: 'Method', good: ['the key idea', 'one clean diagram', 'why it should work'], hype: ['a general framework', 'end-to-end'], filler: ['a lot of details', 'it is complicated', 'trust me'] },
  { id: 'results', label: 'Results', good: ['the main number', 'the honest baseline', 'an ablation'], hype: ['state of the art', 'crushes prior work'], filler: ['see the paper', 'the table is small', 'hard to read'] },
  { id: 'limits', label: 'Limitations', good: ['where it breaks', 'what we did not test', 'the assumption'], hype: ['no real limitations', 'future work will fix it'], filler: ['next slide', 'skipping this', 'time check'] },
  { id: 'takeaway', label: 'Takeaway', good: ['one sentence', 'what to remember', 'the contribution'], hype: ['this changes everything', 'the future of the field'], filler: ['that is all', 'questions?', 'thanks I guess'] },
];

// Q&A. Each questioner wants a different thing; the same answer does not work twice.
export const questioners = [
  { id: 'friendly', who: 'someone in the third row', tone: 'friendly', portrait: 'peer',
    text: 'I liked this. Have you thought about applying it to the streaming setting?',
    best: 'engage', options: {
      engage: { label: 'Say yes, and say honestly how far you have got', effects: { confidence: 5, academicCapital: 3 }, cites: 1, line: 'You say what you have tried and where it stalls. They nod and write something down. That is a person who will read your next paper.' },
      overclaim: { label: 'Say it works there too', effects: { confidence: -2, hype: 6 }, line: 'You say it generalizes. It does not, yet. Someone in row two writes that down too, less kindly.' },
      deflect: { label: '“That is future work.”', effects: { confidence: -1 }, line: 'The oldest sentence in the field. It does its job and nothing more.' },
    } },
  { id: 'reviewer2', who: 'a man with a laptop open', tone: 'harsh', portrait: 'harsh',
    text: 'You did not compare against the obvious baseline. Why should we believe any of this?',
    best: 'concede', options: {
      concede: { label: 'Concede the point precisely, then say what you do have', effects: { confidence: 4, trust: 2, academicCapital: 2 }, cites: 1, line: 'You say: you are right, we did not run it, here is what we ran instead and here is why. The room relaxes. So does he, slightly.' },
      defend: { label: 'Defend it hard', effects: { confidence: -4, stress: 6 }, line: 'You argue. He argues back. It goes four rounds and the session chair intervenes, which is a kind of losing.' },
      dismiss: { label: '“That baseline is not comparable.”', effects: { confidence: -6, academicCapital: -2 }, line: 'It is comparable. Everyone knows it is comparable. The silence has a texture.' },
    } },
  { id: 'emeritus', who: 'a senior professor near the front', tone: 'harsh', portrait: 'senior',
    text: 'This is essentially the method of Kowalski and Ohta, 1987. Are you aware of that work?',
    best: 'credit', options: {
      credit: { label: 'Credit it, and name the actual difference', effects: { confidence: 6, academicCapital: 4 }, cites: 2, line: 'You know the paper. You say what it did and the one thing yours does that it could not. He sits back. Afterwards he gives you his card, which is a physical card.' },
      bluff: { label: 'Say you will look it up', effects: { confidence: -3, academicCapital: -1 }, line: 'Everyone can tell. He is not offended; he is disappointed, which travels further.' },
      argue: { label: 'Say it is completely different', effects: { confidence: -5, academicCapital: -3 }, line: 'It is not completely different. He has the 1987 paper open on his phone. He offers to show the room.' },
    } },
  { id: 'promoter', who: 'someone standing at the back', tone: 'tedious', portrait: 'peer',
    text: 'More of a comment than a question — we did something similar last year, in our paper, which I can send you.',
    best: 'graceful', options: {
      graceful: { label: 'Thank them and ask them to send it', effects: { academicCapital: 2, confidence: 2 }, cites: 1, line: 'They send it that evening. It is genuinely relevant. You cite it. They cite you back, eighteen months later.' },
      cut: { label: 'Move to the next question', effects: { confidence: 1 }, line: 'The chair is grateful. The person at the back is not. They are on your next review panel; everyone is, eventually.' },
      spar: { label: 'Point out what theirs did not do', effects: { confidence: -3, academicCapital: -2 }, line: 'You win the exchange and lose something less visible.' },
    } },
  { id: 'student', who: 'a first-year, visibly nervous', tone: 'friendly', portrait: 'student',
    text: 'Sorry — could you explain again what the y-axis on slide nine was?',
    best: 'kind', options: {
      kind: { label: 'Answer it properly, and slowly', effects: { hope: 6, confidence: 3, academicCapital: 1 }, cites: 1, line: 'You go back to the slide. Four other people needed that and would not have asked. They find you at the coffee break.' },
      brief: { label: 'Answer in one sentence', effects: { confidence: 1 }, line: 'Correct, complete, and slightly too fast. They nod as if it helped.' },
      condescend: { label: '“It is in the caption.”', effects: { confidence: -4, hope: -4 }, line: 'They sit down. You remember being them. You will think about this on the flight home.' },
    } },
];

// Days at a conference, minus the talk.
export const tripActivities = [
  { id: 'sessions', name: 'Sit in on sessions', icon: 'people', blurb: 'Four talks, two of which are relevant and one of which is excellent.', energy: -7, effects: { readiness: 5, novelty: 3, academicCapital: 2 } },
  { id: 'posters', name: 'Work the poster hall', icon: 'browser', blurb: 'Three hours of standing. The best conversations happen at poster 214.', energy: -9, effects: { academicCapital: 5, evidence: 3, confidence: 2 }, connections: 2, skill: 'networking' },
  { id: 'coffee', name: 'Linger at the coffee break', icon: 'coffee', blurb: 'The actual conference. Everything real happens in twenty-minute gaps.', energy: -4, effects: { academicCapital: 4, hope: 3 }, connections: 3, skill: 'networking', personality: 'networker' },
  { id: 'banquet', name: 'Go to the social event', icon: 'gift', blurb: 'A banquet in a hall with terrible acoustics and one good conversation.', energy: -8, cost: 0, effects: { hope: 6, stress: -6, academicCapital: 3 }, connections: 2, personality: 'networker' },
  { id: 'hallway', name: 'Take the hallway track', icon: 'chat', blurb: 'Skip the sessions. Find the three people you actually came to find.', energy: -6, effects: { academicCapital: 6, career: 4 }, connections: 4, skill: 'networking' },
  { id: 'explore', name: 'Skip a day and see the city', icon: 'plane', blurb: 'You flew nine thousand kilometres to sit in a ballroom. You could go outside.', energy: -5, explore: true, personality: 'boundarySetter' },
  { id: 'sleep', name: 'Sleep through the morning', icon: 'moon', blurb: 'The jet lag wins. You wake at eleven and feel human for the first time in a week.', energy: 16, effects: { stress: -8, health: 5 } },
  { id: 'work', name: 'Work in the hotel room', icon: 'paper', blurb: 'You are at a conference in a city you may never return to. You open the laptop.', energy: -7, effects: { progress: 5, draft: 5 }, personality: 'grinder' },
];

// Getting caught outside the venue.
export const caughtScenes = [
  { id: 'message', text: '{advisor} messages while you are at {place}: “Where are you? I have had an idea and I want to talk it through before I forget it.” The idea is, annoyingly, good.',
    choices: ['back', 'later', 'honest'] },
  { id: 'inperson', text: 'You turn a corner at {place} and there is {advisor}, holding a guidebook, wearing shorts. Neither of you has a protocol for this. They recover first: “Good, isn’t it.”',
    choices: ['join', 'awkward', 'honest'] },
];
