// The demo's made-up games: a team and a whole game for a sport, in a language. The page's examples and the cards of the sections (place-grid.js) draw them,
// and so does the build, which writes the first cards into the page.
import { EMBLEMS, FAMILIES, GAMES, TEAMS, TEAMS_JA } from "./examples.js";
import { curlingExtras, fieldExtras, netExtras } from "./model.js";

/** A made-up team of a sport with a score: its names in the language, its colour and emblem, and what its sport adds (sets, boards, goals and behinds). */
export const teamOf = (sport, role, score, lang) => {
  const base = TEAMS[FAMILIES[sport]][role];
  return { name: lang === "ja" ? TEAMS_JA[FAMILIES[sport]][role] : base.name, abbr: base.abbr, color: base.color, logo: EMBLEMS[base.emblem], score, ...(sport === "curling" ? curlingExtras(role, score) : {}), ...(GAMES[sport].awaySets !== undefined ? netExtras(sport, role, score) : {}), ...fieldExtras(sport, role, score) };
};

const withPens = (team, pens) => (pens === undefined ? team : { ...team, penalties: pens });

/** The made-up game of a sport, as drawing options; `extra` overrides any of them. */
export const gameOf = (sport, extra, lang) => ({
  sport,
  away: withPens(teamOf(sport, "away", GAMES[sport].away, lang), GAMES[sport].awayPens),
  home: withPens(teamOf(sport, "home", GAMES[sport].home, lang), GAMES[sport].homePens),
  status: GAMES[sport].status,
  competition: GAMES[sport].competition,
  date: GAMES[sport].date,
  language: lang,
  style: "none",
  ...extra,
});
