// The made-up teams the playground's Lineup choice draws: for each sport that has formations, the formation each side takes and its players, named and numbered from short lists.
// The positions come from the formations themselves (the package's `FORMATIONS`), so a sample can never name a place that is not there.
import { FORMATIONS } from "./dist/layers-entry.js";

/** The sports with a lineup, and the formation each side takes (a sport with one side has no visitors). */
export const SAMPLE_FORMATIONS = {
  soccer: ["4-2-3-1", "4-4-2"],
  nhl: ["hockey-two-lines", "hockey-5v5"],
  nba: ["basketball-traditional", "basketball-5-out"],
  nfl: ["football-i-formation", "football-4-3"],
  mlb: ["baseball-standard", null],
  rugby: ["rugby-15", "rugby-15"],
  afl: ["afl-18", "afl-18"],
  cricket: ["cricket-test-attacking", null],
  volleyball: ["volleyball-rotation", "volleyball-rotation"],
  handball: ["handball-attack", "handball-6-0"],
  waterpolo: ["waterpolo-attack", "waterpolo-attack"],
  fieldhockey: ["fieldhockey-4-3-3", "fieldhockey-3-4-3"],
  netball: ["netball-start", "netball-start"],
};
export const LINEUP_SPORTS = Object.keys(SAMPLE_FORMATIONS);

const SURNAMES = {
  home: ["Okafor", "Silva", "Mbeki", "Rossi", "Ito", "Nakamura", "Costa", "Dubois", "Haddad", "Kowalski", "Eze", "Lindqvist", "Moreau", "Tanaka", "Haas", "Castillo", "Novak", "Abara"],
  away: ["Meyer", "Lund", "Park", "Silvestre", "Cruz", "Ahmed", "Jovanovic", "Hughes", "Moretti", "Sato", "Bianchi", "Ferreira", "Olsen", "Kim", "Reyes", "Petrov", "Haugen", "Diallo"],
};

/** The lineup layers a state asks for: one for each side that has a formation, as discs or as jerseys. */
export function sampleLayers(sport, shape) {
  const ids = SAMPLE_FORMATIONS[sport];
  if (ids === undefined) return [];
  return ["home", "away"].flatMap((side, i) => {
    const formation = FORMATIONS[ids[i] ?? ""];
    if (formation === undefined) return [];
    const players = [...formation.positions, ...(formation.extra ?? [])].map((place, n) => ({ pos: place.id, number: n + 1, name: SURNAMES[side][n % SURNAMES[side].length], ...(n === 1 ? { captain: true } : {}) }));
    return [{ kind: "lineup", side, formation: formation.id, ...(shape === "jersey" ? { shape } : {}), players }];
  });
}
