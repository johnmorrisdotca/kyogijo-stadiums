// The scores the field sports write their own way: an Australian football team's goals and behinds ("10.12 (72)": a goal is 6, a behind 1) and a Gaelic games team's goals and points ("2-14 (20)": a goal is 3, a
// point 1). The total is the team's `score` when it gives one, else worked out. Nothing here draws.
import type { Team } from "./types.ts";

const whole = (value: number | string | undefined): number | undefined => {
  if (typeof value === "number") return Number.isInteger(value) && value >= 0 ? value : undefined;
  if (typeof value === "string" && /^\s*\d+\s*$/.test(value)) return Number(value);
  return undefined;
};

/** What a goal is worth in a sport that counts goals and a lesser score: `[goal, lesser]`, or `undefined` for a sport that does not. */
const WORTH: Readonly<Record<string, readonly [number, number]>> = { afl: [6, 1], gaelic: [3, 1] };

/** The goals and the lesser scores (behinds, points) a team gives, when the sport counts them and both are given. */
function parts(sport: string | undefined, team: Pick<Team, "goals" | "behinds" | "points">): { goals: number; lesser: number } | undefined {
  if (sport === undefined || WORTH[sport] === undefined) return undefined;
  const goals = whole(team.goals);
  const lesser = whole(sport === "afl" ? team.behinds : team.points);
  return goals === undefined || lesser === undefined ? undefined : { goals, lesser };
}

/** The total a team has: its `score` when it is a number, else its goals and behinds (or points) worked out; `undefined` when neither says. */
export function fieldTotal(sport: string | undefined, team: Pick<Team, "score" | "goals" | "behinds" | "points">): number | undefined {
  const given = typeof team.score === "number" ? (Number.isFinite(team.score) ? team.score : undefined) : typeof team.score === "string" && /^\s*-?\d+(?:\.\d+)?\s*$/.test(team.score) ? Number(team.score) : undefined;
  if (given !== undefined) return given;
  const p = parts(sport, team);
  return p === undefined || sport === undefined ? undefined : p.goals * WORTH[sport][0] + p.lesser * WORTH[sport][1];
}

/** The score as the sport writes it, or `undefined` for a team that gives no goals and behinds (or points): `10.12 (72)`, `2-14 (20)`. */
export function fieldScoreText(sport: string | undefined, team: Pick<Team, "score" | "goals" | "behinds" | "points">): string | undefined {
  const p = parts(sport, team);
  if (p === undefined) return undefined;
  const total = fieldTotal(sport, team);
  return `${p.goals}${sport === "afl" ? "." : "-"}${p.lesser}${total === undefined ? "" : ` (${total})`}`;
}
