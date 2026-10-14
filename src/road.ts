// The road-to-the-final chart: the two finalists of a tournament with the matches each played on the way, as round flags (or crests) of both teams with the score between
// them, the rounds named down the middle, and the group stage as a compact row at the foot. The idea is that of the "road to the final" graphics that sports sites post
// for a World Cup or a Stanley Cup; the arrangement, the type and the code are this package's own, and no one's artwork is used: the marks are the caller's flags and
// logos, or the team's initials on its colour.
import { withEmblems } from "./emblems-source.ts";
import { hash } from "./format.ts";
import { safeClass } from "./common.ts";
import { drawRoad } from "./road.draw.ts";
import { nameOf, readModel, summaryOf, tableOf, totalsOf } from "./road.model.ts";
import type { RoadChart, RoadFinalist, RoadOptions } from "./road.types.ts";
import { VERSION } from "./version.ts";

export { ROAD_SIZES } from "./road.draw.ts";

const SIZES = ["card", "square", "wide", "phone"];

/**
 * The road to the final: the two finalists as large round marks with their names at the top, each one's matches on its side (the round mark of both teams with the
 * score between them, and FT, AET or the shoot-out under it), the round names down the middle, and the group stage as a compact row of small marks, codes and scores.
 * A finalist is a team (`name`, `abbr`, `logo` for the flag or the crest, `color`) with its `path`, the matches before the final, the earliest first, and optionally its
 * `group`. A match is `{ round, opponent, score: [for, against], decidedBy, pens }`; a round is a key (`quarter-final`) with words in English and Japanese, or any
 * key you name in `labels`, so a series (`First round`, `4-2`) draws as well as a knockout. A team with no `logo` is drawn as its initials on its colour. The side that won
 * each match is brighter; the sizes are `card` (1080 by 1350), `square`, `wide` (1200 by 675) and `phone` (390 wide). `table()` lists every match as text.
 * @example
 * ```ts
 * import { roadToFinal, type RoadFinalist } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const owls: RoadFinalist = { name: "Northern Owls", abbr: "NOW", color: "#3a2d6b", path: [
 *   { round: "quarter-final", opponent: { name: "Coastal Pines", abbr: "CPN" }, score: [2, 0] },
 *   { round: "semi-final", opponent: { name: "Valley Stars", abbr: "VAL" }, score: [1, 1], decidedBy: "pens", pens: [4, 3] },
 * ] };
 * const gulls: RoadFinalist = { name: "Harbour City Gulls", abbr: "HCG", color: "#1d4f91", path: [
 *   { round: "quarter-final", opponent: { name: "Summit Peaks", abbr: "SMT" }, score: [3, 1] },
 *   { round: "semi-final", opponent: { name: "Metro Bolts", abbr: "MTB" }, score: [2, 1], decidedBy: "aet" },
 * ] };
 * const chart = roadToFinal([owls, gulls], { title: "Northern Cup 2030", size: "square" });
 * console.log(chart.totals.rounds.join(" "), chart.draw().startsWith("<svg"), chart.table().includes("Semi-final"));
 * // quarter-final semi-final true true
 * ```
 */
export function roadToFinal(finalists: readonly [RoadFinalist, RoadFinalist], options: RoadOptions = {}): RoadChart {
  if (typeof options !== "object" || options === null) throw new TypeError("options is an object");
  const check = (o: RoadOptions): void => {
    if (o.size !== undefined && !SIZES.includes(o.size)) throw new RangeError(`Unknown size "${String(o.size)}": use one of ${SIZES.join(", ")}`);
  };
  check(options);
  const model = readModel(finalists, options);
  const build = (extra: Partial<RoadOptions> = {}): string => {
    const merged: RoadOptions = { ...options, ...extra };
    check(merged);
    const m = readModel(finalists, merged);
    const gid = safeClass(merged.id).replace(/ /g, "-") || `kr-${hash(JSON.stringify([finalists, merged, VERSION]))}`;
    return withEmblems(merged.emblems, () => drawRoad(m, merged, gid));
  };
  return {
    options: { ...options },
    title: nameOf(model),
    summary: summaryOf(model),
    totals: totalsOf(model),
    draw: build,
    table: (tableOptions = {}) => tableOf(tableOptions.language === undefined ? model : readModel(finalists, { ...options, language: tableOptions.language }), tableOptions),
  };
}
