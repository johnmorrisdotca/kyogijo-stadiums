// What a walkable mask makes of OpenStreetMap's tags: which features a crowd can stand on, which stop it, and how wide a line is. Shared by the build (scripts/build-walk.mjs) and by the tests that hold the mask to
// the raw answers (src/outside.test.ts), so that a rule is written once. Pure: tags in, a verdict out. The rules are ours; the data is OpenStreetMap's (ODbL 1.0, (c) OpenStreetMap contributors).

/** The kinds a feature can be: a line or an area that people can stand on, or one that stops them. `null` is neither: it is left out of the mask. */
export const KINDS = ["walk-line", "walk-area", "block-line", "block-area"];

const yes = (value) => value !== undefined && value !== "no";
const number = (value) => {
  const found = /^\s*(\d+(?:\.\d+)?)/.exec(String(value ?? ""));
  return found === null ? undefined : Number(found[1]);
};

/** Whether a feature is at street level: not in a tunnel, on a bridge or an overpass, a level above or below the ground, indoors or underground. A viaduct is not a carriageway people stand on, and not one they are stopped by. */
export const atGround = (t) => !yes(t.tunnel) && !yes(t.bridge) && !(Number(t.layer ?? 0) !== 0) && t.location !== "underground" && t.indoor !== "yes" && t.highway !== "corridor";

/** The roads a vehicle drives on. */
export const CARRIAGEWAYS = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "service", "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link", "road"]);
/** The lines of area:highway that are carriageways drawn as areas. */
const CARRIAGEWAY_AREAS = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "service", "road"]);
/** The lines of area:highway that people stand on. */
const WALKING_AREAS = new Set(["footway", "pedestrian", "steps", "path"]);
/** Roofs and the like are not walls: people walk under them. */
const NOT_WALLS = new Set(["roof", "canopy", "carport", "no", "ruins", "construction", "proposed"]);

/** The width of a road's carriageway in metres: its `width`, or its lanes at 3.2 metres, with 2.4 metres more for each side parked along. */
export function carriagewayWidth(t) {
  const link = String(t.highway).endsWith("_link");
  const parked = ["parking:lane:both", "parking:lane:left", "parking:lane:right", "parking:both", "parking:left", "parking:right"].reduce((sum, key) => sum + (yes(t[key]) && !["no_parking", "no_stopping", "no", "separate"].includes(t[key]) ? (key.endsWith("both") ? 4.8 : 2.4) : 0), 0);
  const asked = number(t.width);
  if (asked !== undefined) return Math.min(30, Math.max(2.5, asked));
  if (t.highway === "service") return 3.5;
  const lanes = number(t.lanes) ?? (link ? 1 : 2);
  return Math.min(30, Math.max(3.2, lanes * 3.2 + Math.min(parked, 4.8)));
}

/** The width of a path people walk on, in metres: its `width`, else 2.4 for a sidewalk, 2 for any other path and steps, 4 for a pedestrian street drawn as a line and 3 for a platform. */
export function walkWidth(t) {
  const asked = number(t.width);
  if (asked !== undefined) return Math.min(8, Math.max(1.2, asked));
  if (t.highway === "pedestrian") return 4;
  if (t.public_transport === "platform" || t.railway === "platform" || t.highway === "platform") return 3;
  if (t.footway === "sidewalk") return 2.4;
  return 2;
}

/**
 * What a way or a relation of OpenStreetMap is for a crowd, from its tags: `{ kind, width }` (width for a line), or `null` when it is neither somewhere to stand nor something that stops a crowd. `closed` says whether a way is a
 * ring. A crossing and a traffic island are on the carriageway: no one waits there. Elevated and underground things are not at street level and are left out. Parking, grass and a pitch are left out, so that a lot or a lawn is neither.
 */
export function classify(t, closed) {
  if (t.highway !== undefined) {
    if (!atGround(t)) return null;
    if (CARRIAGEWAYS.has(t.highway)) return { kind: "block-line", width: carriagewayWidth(t) };
    if (t.highway === "cycleway") return yes(t.foot) && t.foot !== "private" && t.foot !== "customers" ? { kind: "walk-line", width: Math.max(3, number(t.width) ?? 3) } : { kind: "block-line", width: Math.max(1.8, number(t.width) ?? 1.8) };
    if (t.highway === "construction" || t.highway === "proposed" || t.highway === "raceway") return null;
    if (["private", "no"].includes(t.access ?? "") && t.highway !== "pedestrian") return null;
    if (t.highway === "footway" && ["crossing", "traffic_island"].includes(t.footway)) return null;
    if (t.highway === "pedestrian" && (t.area === "yes" || (closed && t.area !== "no"))) return { kind: "walk-area" };
    if (t.highway === "platform" && closed) return { kind: "walk-area" };
    if (["footway", "path", "steps", "pedestrian", "platform"].includes(t.highway)) return closed && t.highway !== "steps" && t.area === "yes" ? { kind: "walk-area" } : { kind: "walk-line", width: walkWidth(t) };
    return null;
  }
  if (t["area:highway"] !== undefined) {
    if (!atGround(t)) return null;
    if (WALKING_AREAS.has(t["area:highway"])) return { kind: "walk-area" };
    if (CARRIAGEWAY_AREAS.has(t["area:highway"])) return { kind: "block-area" };
    return null;
  }
  if (t.building !== undefined) return NOT_WALLS.has(t.building) || !atGround(t) || t.bridge !== undefined ? null : { kind: "block-area" };
  if (t.natural === "water" || t.waterway === "riverbank" || t.waterway === "dock") return { kind: "block-area" };
  if (t.railway !== undefined) {
    if (!atGround(t)) return null;
    if (["rail", "light_rail", "tram", "narrow_gauge", "monorail", "funicular", "preserved"].includes(t.railway)) return { kind: "block-line", width: 3 };
    if (t.railway === "platform") return closed ? { kind: "walk-area" } : { kind: "walk-line", width: walkWidth(t) };
    return null;
  }
  if (t.public_transport === "platform") return atGround(t) ? (closed ? { kind: "walk-area" } : { kind: "walk-line", width: walkWidth(t) }) : null;
  if (t.place === "square") return { kind: "walk-area" };
  if (["park", "garden", "playground", "common"].includes(t.leisure) && !["private", "no", "customers", "permit"].includes(t.access ?? "") && t.fee !== "yes") return { kind: "walk-area" };
  return null;
}
