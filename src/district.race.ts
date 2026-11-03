// A race on a district's ground: the race of `mountCircuitRace` (made-up cars, or a feed's), its cars on the circuit where the district lays it, among the venues and the city round them, flat or in 3D. The race and its view in
// a page are the circuits' (`circuits.race.*`), read from the held table (`district.circuit.ts`): the district entry has them, and the lean district reads them with `loadCircuits()`, so a page of venues alone carries none of it.
import type { KyogijoRace, RaceScene, RaceViewSettings } from "./circuits.race.dom.ts";
import type { CircuitRace, RaceOptions } from "./circuits.race.ts";
import type { Pt } from "./crowd.ts";
import { circuitSupport } from "./district.circuit.ts";
import { circuitPointIn, drawDistrict, planDistrict, type DistrictOptions, type DistrictPlan } from "./district.ts";
import { buildDistrictTurn, type DistrictTurnSettings } from "./district.turn.ts";
import { esc } from "./format.ts";
import { fill } from "./strings.core.ts";
import type { Language } from "./types.ts";

/** What a race on a district's ground is drawn from: the district's options, its `circuit` named, and the race's (`seed`, `laps`, `cars`). */
export type DistrictRaceOptions = DistrictOptions & { circuit: string } & Omit<RaceOptions, "circuit">;

/** A race on a district's ground at a moment: the district's and the race's options, and the seconds from the start (0, the grid, by default). */
export type DistrictRaceDrawOptions = DistrictRaceOptions & { t?: number };

/** How a race on a district's ground is shown and played: as a circuit's race, with the district's 3D view's settings (its viewpoint, the walls and roofs of its venues, its quality). */
export type DistrictRaceSettings = RaceViewSettings & { turn?: DistrictTurnSettings };

/** Where a point of the circuit's plan lies on a district's ground. */
function placer(plan: DistrictPlan): (p: Pt) => Pt {
  const placed = plan.circuit;
  if (placed === undefined) throw new Error("a race on a district needs the district's `circuit`");
  return (p) => circuitPointIn(placed, p);
}

/** The size of the cars' dots on a district: a thousandth of its longer side, as on a circuit's own drawing, so that they read as large on the page. */
const sizeOf = (plan: DistrictPlan): number => Math.max(plan.view.w, plan.view.h) / 1000;

/**
 * A race on a district's ground at a moment, as one SVG string: the district's plan with a dot for each car where the race has it then, on the circuit where the district lays it, in its team's colour with the position it holds
 * written on it. The race is the simulation the options make (made-up cars, from a seed), or the one given (from a feed, `raceFromFeed`).
 * @example
 * ```ts
 * import { drawDistrictRace } from "@johnmorrisdotca/kyogijo-stadiums/district";
 * const svg = drawDistrictRace({ venues: ["t-mobile-arena"], circuit: "las-vegas", laps: 3, cars: 6, t: 120 });
 * console.log(svg.match(/class="ky-ci-car"/g)!.length, svg.includes('data-circuit="las-vegas"'));
 * // 6 true
 * ```
 */
export function drawDistrictRace(options: DistrictRaceDrawOptions, given?: CircuitRace): string {
  const { simulateRace, raceAt, carsMarkup, carRadius, words } = circuitSupport().race;
  const language: Language = options.language === "ja" ? "ja" : "en";
  const plan = planDistrict(options);
  const put = placer(plan);
  const race = given ?? simulateRace(options);
  const moment = raceAt(race, options.t ?? 0);
  const onGround = { ...moment, standings: moment.standings.map((line) => ({ ...line, at: put(line.at) })) };
  const w = words[language];
  const extra = fill(given === undefined ? w.description : w.fromFeed, { cars: race.cars.length, laps: race.laps });
  return drawDistrict(options, plan)
    .replace(/<desc id="([^"]+)">([^<]*)<\/desc>/, (_, id: string, text: string) => `<desc id="${id}">${text}${language === "ja" ? "" : " "}${esc(extra)}</desc>`)
    .replace(/<\/svg>$/, `${carsMarkup(onGround, carRadius(sizeOf(plan)), language)}</svg>`);
}

/**
 * Mount a race on a district's ground in a page: the district flat (or in 3D, with its venues, its landmarks and the circuit's pit building standing) with a dot for each car on the circuit, and the race's clock, controls and
 * timing board, as `mountCircuitRace` has them. It does nothing until it is played, and nothing while it is paused, hidden or out of sight; in 3D the view's turn and the race share one frame. The lean district reads the
 * circuits first (`await loadCircuits()`), with the venues' records and the area round them as for any district.
 * @example
 * ```ts no-run
 * import { mountDistrictRace } from "@johnmorrisdotca/kyogijo-stadiums/district";
 * const race = mountDistrictRace(document.querySelector("#strip")!, { venues: ["t-mobile-arena"], circuit: "las-vegas", labels: true }, { view: "3d", speed: 10 });
 * race.play();
 * ```
 */
export function mountDistrictRace(host: HTMLElement, options: DistrictRaceOptions, settings: DistrictRaceSettings = {}): KyogijoRace<DistrictRaceOptions, DistrictOptions> {
  const support = circuitSupport();
  const scene: RaceScene<DistrictRaceOptions, DistrictOptions> = {
    flat: (o, t, given) => drawDistrictRace({ ...o, t }, given),
    view: (o) => o,
    build: buildDistrictTurn,
    point: (o) => placer(planDistrict(o)),
  };
  return support.race.mountRaceIn(host, options, scene, settings);
}
