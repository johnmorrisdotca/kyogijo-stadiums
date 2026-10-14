// What a budō score says of itself: the total of a judo, karate or kendo side from what it has scored, as each sport's rules count it, and the cleaned numbers a board draws. Nothing here draws SVG.
import type { BudoScore, Sport, Team } from "./types.ts";

const whole = (v: unknown, hi: number): number | undefined => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.min(hi, Math.floor(v)) : undefined);

/** The budō score of a team, cleaned: each count a whole number held to what the sport allows. */
export interface BudoView {
  ippon?: number;
  wazaari?: number;
  yuko?: number;
  shido?: number;
  senshu?: boolean;
  techniques?: string[];
  kimarite?: string;
}

/** Read a team's `budo`. */
export function budoView(score: BudoScore | undefined): BudoView | undefined {
  if (score === undefined || score === null || typeof score !== "object") return undefined;
  const out: BudoView = {};
  const ippon = whole(score.ippon, 9);
  const wazaari = whole(score.wazaari, 9);
  const yuko = whole(score.yuko, 99);
  const shido = whole(score.shido, 9);
  if (ippon !== undefined) out.ippon = ippon;
  if (wazaari !== undefined) out.wazaari = wazaari;
  if (yuko !== undefined) out.yuko = yuko;
  if (shido !== undefined) out.shido = shido;
  if (score.senshu === true) out.senshu = true;
  if (Array.isArray(score.techniques)) out.techniques = score.techniques.filter((t): t is string => typeof t === "string").map((t) => t.trim().toLowerCase().slice(0, 12)).filter((t) => t !== "").slice(0, 3);
  if (typeof score.kimarite === "string" && score.kimarite.trim() !== "") out.kimarite = score.kimarite.trim().slice(0, 40);
  return Object.keys(out).length === 0 ? undefined : out;
}

/**
 * The total of a side as its sport counts it, when the side gave no `score` of its own. Judo's scoreboard writes ippon (and two waza-ari, waza-ari-awasete-ippon) as 100, a waza-ari as 10 and a yuko as 1 (IJF
 * SOR 2.5.5.1 and the scoreboard's notes); karate's points are yuko 1, waza-ari 2 and ippon 3 (WKF Kumite 8.6); kendo's is the number of its points (the techniques that are not hansoku).
 */
export function budoScoreText(sport: Sport, team: Pick<Team, "budo" | "score">): string | undefined {
  if (team.score !== undefined && team.score !== null && String(team.score).trim() !== "") return undefined;
  const v = budoView(team.budo);
  if (v === undefined) return undefined;
  if (sport === "judo") {
    if ((v.ippon ?? 0) > 0 || (v.wazaari ?? 0) >= 2) return "100";
    if (v.wazaari === undefined && v.yuko === undefined) return undefined;
    return String((v.wazaari ?? 0) * 10 + (v.yuko ?? 0));
  }
  if (sport === "karate") {
    if (v.ippon === undefined && v.wazaari === undefined && v.yuko === undefined) return undefined;
    return String((v.ippon ?? 0) * 3 + (v.wazaari ?? 0) * 2 + (v.yuko ?? 0));
  }
  if (sport === "kendo") return v.techniques === undefined ? undefined : String(v.techniques.filter((t) => t !== "hansoku").length);
  return undefined;
}
