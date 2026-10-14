import type { CourtStyle } from "./types.ts";

/**
 * Five looks for a basketball court, made of plain colours and no one's marks, to start from: the paint, the border,
 * the wood and the words on the baselines are the parts a court's design is made of. Pass one as `court`, or spread it
 * and change a part.
 * @example
 * ```ts
 * import { COURT_THEMES, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
 * const svg = drawKyogijo({ sport: "nba", court: { ...COURT_THEMES.twoTone, baselineText: "HARBOUR CITY" } });
 * console.log(svg.includes("--ky-key:#1e4f8f"));
 * // true
 * ```
 */
export const COURT_THEMES: Readonly<Record<"maple" | "twoTone" | "night" | "sunburst" | "tournament", CourtStyle>> = {
  /** Natural maple, a brick-red key and a darker border: the plain court. */
  maple: { wood: "#d9a766", woodAlt: "#cf9c5b", apron: "#c9c3b4", border: "#a97d46", key: "#c25b3c", line: "#ffffff" },
  /** A pale floor with a deep blue key, centre circle and border: one colour carries the whole court. */
  twoTone: { wood: "#e7c78f", woodAlt: "#dfbd82", apron: "#cfd6df", border: "#1e4f8f", key: "#1e4f8f", centreCircle: "#1e4f8f", line: "#ffffff", baselineInk: "#ffffff" },
  /** A dark stain with a black key and gold words: the court of a night game. */
  night: { wood: "#5f4932", woodAlt: "#57422d", apron: "#0b0f16", border: "#0b1220", key: "#0f1b2e", centreCircle: "#0f1b2e", line: "#f3f0e6", baselineInk: "#e8c36a" },
  /** Maple with the whole three-point area painted gold and a red border: a court that is painted wall to wall. */
  /** A floor painted from edge to edge, not wood: a deep blue ground, a gold key and gold three-point areas, a gold border and centre. */
  tournament: { wood: "#12508a", woodAlt: "#12508a", apron: "#0a2a47", border: "#e0a100", key: "#e0a100", centreCircle: "#e0a100", line: "#ffffff", baselineInk: "#ffffff", paintThreePoint: false },
  sunburst: { wood: "#e0b373", woodAlt: "#d8a966", apron: "#e6dfd0", border: "#b5452c", key: "#f2c230", paintThreePoint: true, line: "#1b1b1b", baselineInk: "#b5452c" },
};
