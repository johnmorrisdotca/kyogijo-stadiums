// The named features of each surface, so that a caller can list them and give each a colour of its own (`featureColors`). A feature is the part
// of a drawing that carries one class, `ky-f-<name>`, which the surface puts on its elements only for a feature that was given a colour; the
// colour is the custom property `--ky-f-<name>` on the drawing, and a rule hands it to the property the part is painted with. Written for this
// package. sportypy's `update_colors` (a colour per named feature) was the idea; none of its code or names is used.
import { safeColour } from "./colour.ts";
import type { Sport } from "./types.ts";

/** A part of a surface that can be coloured on its own. */
export interface Feature {
  /** What a caller names it by: `blue-lines`. */
  name: string;
  /**
   * What its colour is given to: the custom properties the part is painted with (`--ky-red`), or a CSS property (`stroke`) for a part the stylesheet paints in a
   * colour that is not a property.
   */
  props: readonly string[];
  /** What it is, for the docs. */
  about: string;
}

const f = (name: string, props: string | readonly string[], about: string): Feature => ({ name, props: typeof props === "string" ? [props] : props, about });

const LINE = "--ky-line";
const FOOTBALL: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the field."),
  f("turf", "--ky-surface", "The grass."),
  f("mowing", "--ky-surface-alt", "The lighter tone of the mown pattern."),
  f("end-zone-left", "--ky-left", "The left end zone."),
  f("end-zone-right", "--ky-right", "The right end zone."),
  f("boundary", LINE, "The sidelines and the end lines."),
  f("yard-lines", LINE, "The lines across the field every five yards."),
  f("goal-lines", LINE, "The two goal lines."),
  f("hash-marks", LINE, "The hash marks and the sideline ticks."),
  f("numbers", LINE, "The yard numbers and their arrows."),
  f("posts", "--ky-post", "The goal posts."),
  f("pylons", "--ky-pylon", "The pylons at the corners."),
];

const HOCKEY: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the rink."),
  f("boards", "--ky-boards", "The boards."),
  f("ice", "--ky-surface", "The ice."),
  f("centre-line", "--ky-red", "The red centre line."),
  f("centre-dashes", "--ky-surface", "The dashes in the centre line."),
  f("blue-lines", "--ky-blue", "The two blue lines."),
  f("goal-lines", "--ky-red", "The two goal lines."),
  f("centre-circle", "--ky-blue", "The centre face-off circle."),
  f("centre-dot", "--ky-blue", "The centre face-off dot."),
  f("face-off-circles", "--ky-red", "The four end-zone face-off circles."),
  f("face-off-dots", "--ky-red", "The end-zone and neutral-zone face-off dots."),
  f("hash-marks", "--ky-red", "The hash marks beside the end-zone circles."),
  f("crease", "--ky-crease", "The fill of the goalkeeper's crease."),
  f("crease-marks", "--ky-red", "The short marks on the crease's edge."),
  f("trapezoid", "--ky-red", "The goalkeeper's trapezoid behind the goal."),
  f("nets", "--ky-red", "The nets."),
  f("referee-crease", "--ky-red", "The referee's crease at the boards."),
];

const KEY = ["--ky-key", "--ky-key-left", "--ky-key-right"];
const BASKETBALL: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the court."),
  f("border", "--ky-boards", "The out-of-bounds border."),
  f("floor", "--ky-surface", "The wood."),
  f("planks", "--ky-surface-alt", "The second tone of the planks."),
  f("key", KEY, "The paint of both keys."),
  f("three-point-area", KEY, "The three-point areas, when they are painted."),
  f("centre-paint", "--ky-centre", "The paint inside the centre circle."),
  f("boundary", LINE, "The sidelines and the baselines."),
  f("halfway-line", LINE, "The halfway line."),
  f("centre-circle", LINE, "The centre circle."),
  f("lane-lines", LINE, "The edges of the keys."),
  f("free-throw-circles", LINE, "The free-throw circles."),
  f("three-point-line", LINE, "The three-point lines."),
  f("restricted-areas", LINE, "The restricted areas under the baskets."),
  f("court-marks", LINE, "The marks along the keys, the sidelines and the lower defensive boxes."),
  f("backboards", LINE, "The backboards and their arms."),
  f("rims", "stroke", "The rims."),
  f("baseline-text", "--ky-baseline", "The words along the baselines."),
];

const BASEBALL: readonly Feature[] = [
  f("foul-ground", "--ky-foul", "The ground outside the foul lines."),
  f("outfield", "--ky-surface", "The grass of fair ground."),
  f("mowing", "--ky-surface-alt", "The lighter tone of the mown pattern."),
  f("warning-track", "--ky-dirt", "The warning track."),
  f("infield-dirt", "--ky-dirt", "The dirt of the infield, the mound and the circles about the bases."),
  f("infield-grass", "--ky-infield", "The grass inside the bases."),
  f("foul-lines", LINE, "The two foul lines."),
  f("batters-boxes", LINE, "The batter's boxes."),
  f("running-lane", LINE, "The running lane to first base."),
  f("home-plate", LINE, "Home plate."),
  f("pitchers-plate", LINE, "The pitcher's plate or box."),
  f("bases", LINE, "The bases."),
  f("fence", "--ky-boards", "The outfield fence."),
];

const SOCCER: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the pitch."),
  f("turf", "--ky-surface", "The grass."),
  f("mowing", "--ky-surface-alt", "The lighter tone of the mown pattern."),
  f("touchlines", LINE, "The touchlines and the goal lines."),
  f("halfway-line", LINE, "The halfway line."),
  f("centre-circle", LINE, "The centre circle."),
  f("centre-mark", LINE, "The centre mark."),
  f("penalty-areas", LINE, "The penalty areas, the goal areas and the penalty arcs."),
  f("penalty-marks", LINE, "The penalty marks."),
  f("corner-arcs", LINE, "The corner arcs."),
  f("corner-marks", LINE, "The corner-kick marks off the pitch."),
  f("goals", LINE, "The goals: the posts' line, the net and the strip."),
  f("goal-posts", "--ky-post", "The ends of the goalposts."),
  f("corner-flags", ["--ky-pylon", "--ky-post"], "The corner flags."),
];

const CURLING: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the sheet."),
  f("boards", "--ky-boards", "The boards."),
  f("ice", "--ky-surface", "The ice."),
  f("pebble", "--ky-pebble", "The pebble, when it is drawn."),
  f("guard-zone", "--ky-fgz", "The free guard zone, when it is shaded."),
  f("house-outer", "--ky-rg-o", "The band of the house between the 12-foot and the 8-foot circles."),
  f("house-middle", "--ky-rg-m", "The band between the 8-foot and the 4-foot circles."),
  f("house-inner", "--ky-rg-i", "The band between the 4-foot circle and the button."),
  f("button", "--ky-rg-b", "The button."),
  f("tee-lines", LINE, "The tee lines."),
  f("back-lines", LINE, "The back lines."),
  f("centre-line", LINE, "The centre line."),
  f("courtesy-lines", LINE, "The hack lines and the courtesy lines."),
  f("hog-lines", "--ky-hog", "The hog lines."),
  f("hacks", "--ky-hack", "The hacks."),
];

const NET: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the court."),
  f("free-zone", "--ky-free", "The free zone round the court, where the rules give one."),
  f("court", "--ky-surface", "The court."),
  f("areas", "--ky-area", "The painted areas: the non-volley zones and the volleyball front zones."),
  f("lines", LINE, "The painted lines."),
  f("net", "--ky-net", "The net."),
  f("posts", "--ky-net", "The posts and the singles sticks."),
  f("antennae", "--ky-red", "The antennae of a volleyball net."),
];

/** The features of each sport, with what each colours. A sport whose surface has none named (one added since) is missing here. */
export const FEATURE_INFO: Readonly<Record<string, readonly Feature[]>> = Object.freeze({
  nfl: FOOTBALL,
  cfl: FOOTBALL,
  ifaf: FOOTBALL,
  nhl: HOCKEY,
  nba: BASKETBALL,
  mlb: BASEBALL,
  soccer: SOCCER,
  curling: CURLING,
  tennis: NET,
  volleyball: NET,
  badminton: NET,
  pickleball: NET,
  tabletennis: NET,
});

/**
 * The names of the features of each sport: the keys `featureColors` takes. Football's three fields have the same, and so have the five net sports.
 * @example
 * ```ts
 * import { FEATURES } from "@johnmorrisdotca/kyogijo";
 * console.log(FEATURES.nhl.includes("blue-lines"), FEATURES.nfl.length);
 * // true 12
 * ```
 */
export const FEATURES: Readonly<Record<string, readonly string[]>> = Object.freeze(Object.fromEntries(Object.entries(FEATURE_INFO).map(([sport, list]) => [sport, Object.freeze(list.map((one) => one.name))])));

const has = (table: object, key: string): boolean => Object.prototype.hasOwnProperty.call(table, key);

/** The features a drawing was asked to colour, as `[name, colour]`: a colour that is not safe is left out, and a name the sport does not have is an error that lists the names. */
export function featureColours(sport: Sport | string, given: Readonly<Record<string, string>> | undefined): [string, string][] {
  if (given === undefined || given === null || typeof given !== "object") return [];
  const known = has(FEATURES, sport) ? FEATURES[sport] : [];
  const out: [string, string][] = [];
  for (const [name, value] of Object.entries(given)) {
    if (!known.includes(name)) throw new RangeError(`Unknown feature "${name}" for ${sport}: ${known.length === 0 ? "this surface has none named" : `use one of ${known.join(", ")}`}`);
    const colour = safeColour(value);
    if (colour !== undefined) out.push([name, colour]);
  }
  return out;
}

/** The rule that hands a feature's colour to the properties its part is painted with. */
const rule = (selector: string, name: string, props: readonly string[]): string => `${selector}{${props.map((prop) => `${prop}:var(--ky-f-${name})`).join(";")}}`;

/** The rules for the features a drawing colours: its own stylesheet, for a drawing of one sport. */
export function featureStyle(sport: Sport | string, names: Iterable<string>): string {
  const list = has(FEATURE_INFO, sport) ? FEATURE_INFO[sport] : [];
  return [...names]
    .map((name) => list.find((one) => one.name === name))
    .filter((one): one is Feature => one !== undefined)
    .map((one) => rule(`.kyogijo .ky-f-${one.name}`, one.name, one.props))
    .join("\n");
}

/** Every feature of every sport as rules, for a page that draws with `style: "none"`: a rule is said once for the sports that share it. */
function allFeatureRules(): string {
  const groups = new Map<string, { sports: string[]; name: string; props: readonly string[] }>();
  for (const [sport, list] of Object.entries(FEATURE_INFO)) {
    for (const one of list) {
      const key = `${one.name}|${one.props.join(",")}`;
      const group = groups.get(key) ?? { sports: [], name: one.name, props: one.props };
      group.sports.push(sport);
      groups.set(key, group);
    }
  }
  return [...groups.values()].map((group) => rule(group.sports.map((sport) => `.kyogijo[data-sport=${sport}] .ky-f-${group.name}`).join(","), group.name, group.props)).join("\n");
}

/** The rules of every named feature: a colour in `--ky-f-<name>` on the drawing goes to the part. A drawing that colours a feature carries the rules it needs; a page that draws with `style: "none"` puts this in once. */
export const KYOGIJO_FEATURE_STYLE = allFeatureRules();
