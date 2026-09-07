// Every person in this game is fictional. Names are assembled at random from these pools;
// any resemblance to a real person is coincidental. Keep the disclaimer visible in the UI.
export const DISCLAIMER = 'This is a vibe-coded side project, made for fun, and it is not an attack on anyone. It is a work of satire. Every school, advisor, labmate, committee member, company, employer, and venue in this game is fictional or a parody placeholder. Names are generated at random; any resemblance to real people, institutions, or venues — living, dead, or tenured — is coincidental and unintended. Real city names and the places in them are used affectionately as travel settings, and nothing in those descriptions is a claim about any real business or organisation. Salaries, fees, visa outcomes, and medical bills are invented for comic effect and are not advice — financial, medical, immigration, or academic. The jokes are aimed at systems and situations, never at individuals. Nothing here is affiliated with, endorsed by, or advice about any real program.';
export const SHORT_DISCLAIMER = 'Satire. All people, schools, and venues are fictional; resemblance to real ones is coincidental.';

export const firstNames = ['Ada', 'Bram', 'Calla', 'Dev', 'Elio', 'Fenna', 'Gideon', 'Halia', 'Idris', 'Juno', 'Kalinda', 'Lior', 'Maren', 'Nils', 'Odalys', 'Petra', 'Quill', 'Rune', 'Saoirse', 'Tobiah', 'Ulla', 'Vasco', 'Wren', 'Xiomara', 'Yael', 'Zephyr', 'Anouk', 'Bastian', 'Cosima', 'Dorian', 'Esperanza', 'Farid', 'Greta', 'Hollis', 'Ingrid', 'Jasper', 'Kavi', 'Leontine', 'Marlowe', 'Nadia', 'Oren', 'Priya', 'Rafferty', 'Signe', 'Tamsin', 'Uriel', 'Vesna', 'Wilhelmina'];
export const surnames = ['Abernathy', 'Brightwater', 'Castellane', 'Duvalier', 'Everhart', 'Fairweather', 'Galloway', 'Hartwell', 'Ibarra-Kane', 'Jorgenssen', 'Kowalczyk', 'Lindqvist', 'Marchetti', 'Nakashima-Roe', 'Okonkwo', 'Pemberton', 'Quintero', 'Rasmussen', 'Sorensen', 'Thackeray', 'Underhill', 'Vasquez-Holt', 'Whitcombe', 'Xylander', 'Yarrow', 'Zielinski', 'Ashdown', 'Bellweather', 'Cordovan', 'Delacroix-Tan', 'Ellsworth', 'Featherstone', 'Grimaldi', 'Holloway', 'Iversen', 'Juniper', 'Kirkbride', 'Lockhart', 'Montclair', 'Nightingale', 'Oyelaran', 'Pellegrino', 'Ravensworth', 'Silverthorne', 'Tremblay', 'Vantongeren', 'Wexford', 'Zaragoza'];

export const companies = ['Hexadecimal Labs', 'Stochastic Parrot Inc.', 'Cloudvale', 'Bramble Systems', 'Nimbus Robotics', 'Lexicon.ai', 'Gradient Descent LLC', 'Bitter Lesson Capital', 'Overfit Technologies', 'Latency Zero'];

export const labmateRoles = [
  { id: 'senior', label: 'sixth-year student', lines: ['Do not let them add a baseline in the last week.', 'I have submitted this paper four times. It is a good paper.', 'The trick is to send the draft before they ask for it.'] },
  { id: 'postdoc', label: 'postdoc', lines: ['Your first year is for reading. Your second year is for regretting what you read.', 'I can look at your rebuttal tonight if you send it by nine.', 'The job market is fine. I say this every week.'] },
  { id: 'peer', label: 'fellow first-year', lines: ['Did anyone understand the homework? Asking for me.', 'Coffee run? I need to not look at this proof.', 'I found the form for the form. It requires a form.'] },
  { id: 'phantom', label: 'student nobody has seen since spring', lines: ['Remote this week. And next week.', 'Sorry, missed group meeting. Time zones.', 'Can someone forward the slides?'] },
];
export const labmateTraits = [
  { id: 'helpful', label: 'helpful', effect: 'answers questions before you finish asking' },
  { id: 'competitive', label: 'competitive', effect: 'reads your drafts a little too closely' },
  { id: 'dramatic', label: 'dramatic', effect: 'every review is a personal tragedy' },
  { id: 'wholesome', label: 'wholesome', effect: 'organizes the lab potluck, remembers birthdays' },
  { id: 'burned', label: 'quietly burned out', effect: 'has a plant. The plant is not doing well either' },
  { id: 'startup', label: 'startup-curious', effect: 'has a pitch deck in the shared drive' },
];

// Where it lives. Shown in About, in the wizard, and on the ending screen — the three places a
// player is either deciding whether to trust it, or has just finished and might want to say so.
export const REPO_URL = 'https://github.com/RexZChen/PhD-Simulator';
export const REPO_LABEL = 'github.com/RexZChen/PhD-Simulator';
