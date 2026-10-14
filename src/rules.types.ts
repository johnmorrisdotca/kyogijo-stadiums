// The names of the zones the rules engine (rules.ts) answers with. They are the same in every language; the words are in strings.ts (`rules`).

/** The zones and areas that `zoneAt` names from a sport's rulebook, as ids. A zone set of the package's (`ZONE_SETS`) has ids of its own, which `zoneAt` passes on as they are. */
export const RULE_IDS = [
  // Hockey
  "defensive-zone",
  "neutral-zone",
  "offensive-zone",
  "crease",
  "trapezoid",
  "behind-goal-line",
  "inner-slot",
  "outer-slot",
  "slot",
  "faceoff-circle",
  "centre-circle",
  // Basketball
  "frontcourt",
  "backcourt",
  "restricted-area",
  "paint",
  "mid-range",
  "corner-three-left",
  "corner-three-right",
  "above-the-break",
  "three-point",
  // Soccer
  "defensive-third",
  "middle-third",
  "attacking-third",
  "six-yard-box",
  "own-six-yard-box",
  "penalty-area",
  "own-penalty-area",
  "penalty-arc",
  "own-penalty-arc",
  "wing-left",
  "half-space-left",
  "central-corridor",
  "half-space-right",
  "wing-right",
  // Baseball
  "infield",
  "outfield",
  "fair-territory",
  "foul-territory",
  "over-the-wall",
  "warning-track",
  "left-field",
  "centre-field",
  "right-field",
  "third-base-side",
  "middle-infield",
  "first-base-side",
  // Football
  "own-end-zone",
  "own-half",
  "opponent-half",
  "red-zone",
  "opponent-end-zone",
  "end-zone",
  "between-the-hashes",
  "outside-hashes-left",
  "outside-hashes-right",
] as const;

/** The id of a zone the rules engine names itself. */
export type RuleId = (typeof RULE_IDS)[number];
