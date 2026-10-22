// A district: several real venues of one city placed on one plan at their real relative positions and orientations, read from the same OpenStreetMap outlines each venue is drawn from (`venues.ts`, `stadiums.ts`).
// It is generic: a district is a list of venue keys, whichever kinds they are (an NHL arena, a football or soccer stadium, a ballpark, a hall with a boxing ring), and the plan fits itself to them. Two modes say how far apart the venues are:
// `neighbours` fits the plan tight round buildings that stand within a few hundred metres of each other, with no more than a margin between them; `city` keeps the real distances between venues that are kilometres
// apart, with a grid, a scale and a name beside each. Nothing is drawn but what the venues are drawn from: no street, no park and no mark of a team, a league or a tournament; the credit
// `VENUE_ATTRIBUTION` goes with it. Pure: options in, a plan, and markup, out; `district.turn.ts` raises it in 3D.
import { arenaById, arenaNameIn } from "./arenas.ts";
import { kodokanMember } from "./kodokan.ts";
import { contextFloor, contextFrame, placeContext, toneOf, type ContextPlan, type ContextArea } from "./context.ts";
import { crowdStands, drawKyogijo } from "./draw.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { esc, hash } from "./format.ts";
import { STADIUM_IDS, stadiumById, stadiumConfigs, stadiumFrameHeading, stadiumKind, stadiumNames, stadiumSeats, type RealStadium, type StadiumConfigId } from "./stadiums.ts";
import { VENUE_ATTRIBUTION, VENUE_IDS, venueById, type RealVenue } from "./venues.ts";
import { hullOf, metresFrom, middleOf, smallestBox, type LonLat } from "./venues.geo.ts";
import { venueGates } from "./gates.ts";
import { walkIdFor } from "./walk.ts";
import type { OutsideOptions } from "./outside.ts";
import type { Pt } from "./crowd.ts";
import type { Language, SurfaceOptions } from "./types.ts";

/** How a district is fitted: `neighbours` tight round venues that stand close together, `city` at the real distances between venues that are kilometres apart. */
export type DistrictMode = "neighbours" | "city";

export const DISTRICT_MODES: readonly DistrictMode[] = ["neighbours", "city"];

/** A venue of a district: its key, and for a stadium the configuration it is drawn in (`cfl` or `soccer`; the first it has where none is given; a ballpark's is `mlb` and a hall's `boxing`). `"bc-place:soccer"` is the same as `{ id: "bc-place", config: "soccer" }`. */
export type DistrictVenueInput = string | { id: string; config?: StadiumConfigId };

/** What can be asked of a district. */
export interface DistrictOptions {
  /** The venues, by key: any key of `VENUES` (the arenas) and `STADIUMS` (the stadiums); at least one. */
  venues: readonly DistrictVenueInput[];
  /** `neighbours` (the default) or `city`. */
  mode?: DistrictMode;
  /** How far the plan is turned, in degrees clockwise: 0 (the default) has north at the top; `"auto"` turns it so that the district's long way lies across the page. */
  turn?: number | "auto";
  /** Write each venue's name beside it. On for `city`, off for `neighbours`. */
  labels?: boolean;
  language?: Language;
  theme?: "light" | "dark";
  /** The prefix of the ids in the drawing, for a page with more than one. A hash of the options when missing. */
  id?: string;
  /** `"none"` leaves the stylesheet out, as for every drawing. */
  style?: "none";
  /** Draw every venue's stands in 2D (true, the default) or its building only. */
  stands?: boolean;
  /** Mark each venue's gates on the plan (`venueGates`: a door's bar on the building's outline and a dashed stub the way a queue runs). Off when left out. */
  gates?: boolean;
  /**
   * The crowd outside the venues (`outside.ts`): `{ level: 25 }` puts a quarter of the seats' worth of people on the sidewalks, plazas and grounds round them, in the mounted views (`mountDistrict`, `mountDistrictTurn`). Off when left out. Asking
   * for it at all, even at level 0, makes room round the buildings for the crowd (`OUTSIDE_ROOM`), so that the plan does not move when the level does; only a district with a venue that has a walkable mask (`OUTSIDE_VENUES`) is changed.
   */
  outside?: OutsideOptions;
  /**
   * The buildings round the venues, as areas of data a page passes in (`TOKYO_DOME_CITY` of `@johnmorrisdotca/kyogijo-stadiums/plateau`): low in detail, flat on the floor shaded by height and, for the biggest and the tallest, standing
   * in the 3D view. The frame is widened to take in the streets round the venues. None (the default) draws the district as it always was, and carries no data. The credit of each area goes into the description.
   */
  context?: readonly ContextArea[];
  /**
   * The building a raised venue stands in (the Kodokan's main dojo, on the 7th floor): `xray` (the default) draws it with its walls giving way to the eye as it looks in, `solid` draws it whole, `none` leaves it out, and the dojo floats on its floor
   * alone. Only a venue that stands in a building (`DistrictMember.shell`) is changed.
   */
  building?: "xray" | "solid" | "none";
}

/** A venue of a district as the district needs it: what it is called, where it stands, how it lies, and how it is drawn. */
export interface DistrictMember {
  /** The key of the venue and the configuration, unique in a district: `rogers-arena`, `bc-place:soccer`. */
  key: string;
  id: string;
  kind: "arena" | "stadium" | "park" | "hall";
  config?: StadiumConfigId;
  /** The name in both languages. */
  name: { en: string; ja: string };
  /** The building's outline, `[longitude, latitude]`. */
  ring: readonly (readonly [number, number])[];
  /** The middle of the surface (the rink, the field): the point the venue's drawing is turned about. */
  centre: readonly [number, number];
  /** The heading of the surface's long side, degrees clockwise from north, 0 to under 180, and how it is known (`none` stands in 90). */
  heading: number;
  basis: string;
  /** The seats of the drawing. */
  seats: number;
  /** The options the venue is drawn from. */
  options: SurfaceOptions;
  /** How high the venue's floor stands above the ground, in feet: the Kodokan's main dojo is on the 7th floor of its building, drawn in the air on its real floor. Missing: on the ground. */
  elevation?: number;
  /** The building the venue stands in, when the district draws it (`building`): its outline is `ring`, and its height in feet and storeys are these. */
  shell?: { height: number; storeys: number };
  /** The credit of data this venue is made from that is not OpenStreetMap's (the Kodokan's building: Project PLATEAU). */
  attribution?: { en: string; ja: string };
}

const venueMember = (venue: RealVenue, language: Language): DistrictMember => {
  const arena = arenaById(venue.id);
  if (arena === undefined) throw new Error(`${venue.id} is not an arena`);
  return {
    key: venue.id,
    id: venue.id,
    kind: "arena",
    name: { en: arenaNameIn(arena, undefined, "en"), ja: arenaNameIn(arena, undefined, "ja") },
    ring: venue.osm.ring,
    centre: venue.osm.axis.centre,
    heading: venue.osm.axis.heading,
    basis: venue.osm.axis.basis,
    seats: venue.seats.hockey,
    options: { sport: "nhl", arena: venue.id, crowd: { real: true }, language },
  };
};

const stadiumMember = (stadium: RealStadium, config: StadiumConfigId, language: Language): DistrictMember => {
  const park = stadiumKind(stadium) === "park";
  return {
    key: `${stadium.id}:${config}`,
    id: stadium.id,
    kind: park ? "park" : stadiumKind(stadium) === "hall" ? "hall" : "stadium",
    config,
    name: stadiumNames(stadium),
    ring: stadium.osm.ring,
    centre: stadium.osm.axis.centre,
    heading: stadiumFrameHeading(stadium),
    basis: stadium.osm.axis.basis,
    seats: stadiumSeats(stadium, config),
    options: park ? { sport: "mlb", park: stadium.id, crowd: { real: true }, language } : { sport: config, stadium: stadium.id, crowd: { real: true }, language },
  };
};

/** Every key a district can be asked for: the arenas of `VENUES` and the stadiums of `STADIUMS`. */
export const DISTRICT_IDS: readonly string[] = Object.freeze([...VENUE_IDS, ...STADIUM_IDS, "kodokan"]);

/** Whether a key is a venue a district can place. */
export const isDistrictId = (id: string): boolean => DISTRICT_IDS.includes(id);

/**
 * A venue of a district, from its key: `rogers-arena` (an arena), `bc-place` or `bc-place:soccer` (a stadium in its first configuration or the one named). Throws for a key no venue has, and says which keys there are.
 * @example
 * ```ts
 * import { districtMember } from "@johnmorrisdotca/kyogijo-stadiums/district";
 * const member = districtMember("bc-place:soccer");
 * console.log(member.key, member.kind, member.seats);
 * // bc-place:soccer stadium 52497
 * ```
 */
export function districtMember(input: DistrictVenueInput, language: Language = "en"): DistrictMember {
  const [id, named] = typeof input === "string" ? input.split(":") : [input.id, input.config];
  const venue = venueById(id);
  if (venue !== undefined) {
    if (named !== undefined && named !== "nhl") throw new Error(`${id} is an arena with one configuration, not ${named}`);
    return venueMember(venue, language);
  }
  const stadium = stadiumById(id);
  if (stadium !== undefined) {
    const config = (named ?? stadiumConfigs(stadium)[0]) as StadiumConfigId;
    if (stadium.configs[config] === undefined) throw new Error(`${id} has no configuration ${String(named)}: ${stadiumConfigs(stadium).join(", ")}`);
    return stadiumMember(stadium, config, language);
  }
  // The Kodokan: a hall of the budō, its main dojo in the air in its building (`kodokan.ts`).
  if (id === "kodokan") {
    if (named !== undefined) throw new Error(`kodokan has one configuration, not ${named}`);
    return kodokanMember(language);
  }
  throw new Error(`no venue ${String(id)}: the venues are ${DISTRICT_IDS.join(", ")}`);
}

// ---- The plan. ----

const RAD = Math.PI / 180;
/** Turn a point of the map (east, down the page) by `degrees` clockwise on the page. */
export const turnBy = ([x, y]: Pt, degrees: number): Pt => [x * Math.cos(degrees * RAD) - y * Math.sin(degrees * RAD), x * Math.sin(degrees * RAD) + y * Math.cos(degrees * RAD)];

/** A venue placed in the district: where its surface's middle is, how far its drawing is turned, and where its building stands, all in feet in the district's frame (x to the right, y down the page). */
export interface DistrictPlaced {
  member: DistrictMember;
  /** The middle of the surface. */
  at: Pt;
  /** The degrees the venue's own drawing (its field along x) is turned clockwise to lie as it does in the world. */
  angle: number;
  /** The building's outline. */
  footprint: Pt[];
  /** Its convex hull, which the depth order of the 3D view separates buildings by. */
  hull: Pt[];
}

/** A gate placed in a district: where it is on its venue's outline in the plan's frame, in feet, and the way it faces on the page, in degrees clockwise from the top. */
export interface DistrictGate {
  key: string;
  venue: string;
  name: { en: string; ja: string };
  at: Pt;
  angle: number;
  basis: "documented" | "plausible";
}

/** What a district is: its venues placed, the box that fits them, and how the map lies. */
export interface DistrictPlan {
  options: DistrictOptions;
  mode: DistrictMode;
  /** The degrees the map is turned clockwise (0 has north at the top). */
  turn: number;
  /** The way north points on the page, degrees clockwise from the top. */
  north: number;
  members: DistrictPlaced[];
  /** The buildings round the venues that the options' `context` brings, placed in the frame; `undefined` without it. */
  context: ContextPlan | undefined;
  /** The gates of the venues, where the options ask for them: each on its building's outline in the plan's frame (feet), and the way it faces on the page. Empty otherwise. */
  gates: DistrictGate[];
  /** The frame the plan is drawn in, in feet: the venues' buildings with the margin the mode gives them. */
  view: { x: number; y: number; w: number; h: number };
  /** The distance between each pair of surfaces' middles, in metres, as the ground gives it. */
  between: { a: string; b: string; metres: number }[];
  /** The `[longitude, latitude]` the plan's metres are measured from: the middle of the venues' surfaces. */
  origin: readonly [number, number];
}

/** The margin round the buildings, as a share of the longer side of the district: tight for neighbours, wide for a city's grid and names. */
export const DISTRICT_MARGIN: Readonly<Record<DistrictMode, number>> = { neighbours: 0.09, city: 0.12 };

/** The ground kept round the buildings for the crowd outside, in metres, when a district asks for one. */
export const OUTSIDE_ROOM = 160;

const EARTH = 6371008.8;
const haversine = (a: readonly [number, number], b: readonly [number, number]): number => {
  const [p, q] = [a[1] * RAD, b[1] * RAD];
  const h = Math.sin((q - p) / 2) ** 2 + Math.cos(p) * Math.cos(q) * Math.sin(((b[0] - a[0]) * RAD) / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.sqrt(h));
};

/**
 * The plan of a district: each venue's surface placed where it is on the ground (the distance and the direction between middles come from the coordinates of OpenStreetMap's outlines, to a metre or so) and turned so
 * that its long side points where it does in the world, and the frame that fits them. A venue whose orientation is not known (an arena the building gives no axis for) is placed with its rink east-west, as it is drawn alone.
 * @example
 * ```ts
 * import { planDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district";
 * const plan = planDistrict({ venues: ["bc-place", "rogers-arena"] });
 * console.log(plan.mode, plan.members.length, Math.round(plan.between[0].metres));
 * // neighbours 2 264
 * ```
 */
export function planDistrict(options: DistrictOptions): DistrictPlan {
  if (options.venues.length === 0) throw new Error("a district needs a venue");
  const language: Language = options.language === "ja" ? "ja" : "en";
  const mode: DistrictMode = options.mode === "city" ? "city" : "neighbours";
  const members = options.venues.map((v) => districtMember(v, language));
  const keys = new Set<string>();
  for (const m of members) {
    if (keys.has(m.key)) throw new Error(`${m.key} is in the district twice`);
    keys.add(m.key);
  }
  const origin = middleOf(members.map((m) => m.centre as LonLat));
  const ground = (ring: readonly LonLat[]): Pt[] => metresFrom(origin, ring).map(([east, north]): Pt => [east * FEET_PER_METRE, -north * FEET_PER_METRE]);
  const raw = members.map((m) => ({ at: ground([m.centre as LonLat])[0], footprint: ground(m.ring as LonLat[]) }));
  // The map's turn: as asked, or the one that lays the district's long way across the page (the smallest box round every building).
  const all = raw.flatMap((r) => r.footprint);
  let turn = 0;
  if (typeof options.turn === "number" && Number.isFinite(options.turn)) turn = ((options.turn % 360) + 360) % 360;
  else if (options.turn === "auto" && members.length > 1) {
    // `smallestBox` reads its points as east and north; these are east and down the page, so its heading is 90 degrees less the long side's angle on the page, and turning the map by (heading - 90) lays that side along x.
    const box = smallestBox(all);
    turn = (((box.heading - 90) % 360) + 360) % 360;
  }
  const placed: DistrictPlaced[] = members.map((member, i) => {
    const footprint = raw[i].footprint.map((p) => turnBy(p, turn));
    return { member, at: turnBy(raw[i].at, turn), angle: member.heading - 90 + turn, footprint, hull: hullOf(footprint) };
  });
  const xs = placed.flatMap((p) => p.footprint.map((q) => q[0]));
  const ys = placed.flatMap((p) => p.footprint.map((q) => q[1]));
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const context = options.context !== undefined && options.context.length > 0;
  // A district that asks for a crowd outside (and has a mask to put it on) keeps room round its buildings for it, whatever the level, so that the plan stays where it is as the level changes.
  const room = options.outside !== undefined && walkIdFor(members.map((m) => m.id)) !== undefined ? OUTSIDE_ROOM * FEET_PER_METRE : 0;
  const margin = Math.max(Math.max(x1 - x0, y1 - y0) * DISTRICT_MARGIN[mode], room);
  // With context the frame takes in the streets round the buildings (and any landmark near them) as well.
  const round = { x0: x0 - margin, y0: y0 - margin, x1: x1 + margin, y1: y1 + margin };
  const wide = context ? contextFrame(options.context!, origin, turn, { x0, y0, x1, y1 }) : round;
  const framed = { x0: Math.min(round.x0, wide.x0), y0: Math.min(round.y0, wide.y0), x1: Math.max(round.x1, wide.x1), y1: Math.max(round.y1, wide.y1) };
  const view = { x: framed.x0, y: framed.y0, w: framed.x1 - framed.x0, h: framed.y1 - framed.y0 };
  const between: DistrictPlan["between"] = [];
  members.forEach((a, i) => members.slice(i + 1).forEach((b) => between.push({ a: a.key, b: b.key, metres: Math.round(haversine(a.centre, b.centre) * 10) / 10 })));
  const around = context ? placeContext(options.context!, origin, turn, view, placed.map((p) => ({ footprint: p.footprint, shell: p.member.shell !== undefined }))) : undefined;
  const gates: DistrictGate[] = options.gates !== true ? [] : placed.flatMap((p) => venueGates(p.member.id).map((g): DistrictGate => ({ key: g.key, venue: p.member.key, name: g.name, at: turnBy(ground([g.at])[0], turn), angle: ((g.bearing + turn) % 360 + 360) % 360, basis: g.basis })));
  return { options, mode, turn, north: turn, members: placed, origin, context: around, gates, view, between };
}

// ---- The drawing. ----

/** The colours and the type of a district's drawing, light and dark. Defaults sit in `:where()`, so a page's own rule wins. */
export const KYOGIJO_DISTRICT_STYLE = `
:where(.ky-district){--ky-dist-ground:#e1e4da;--ky-dist-grid:rgba(40,46,42,.16);--ky-dist-ink:#1f2320;--ky-dist-halo:rgba(255,255,255,.9);--ky-dist-people:#c2410c;--ky-dist-b0:#d1d4cb;--ky-dist-b1:#c3c7be;--ky-dist-b2:#b2b7ae;--ky-dist-b3:#9ea49b;--ky-dist-bline:rgba(40,46,42,.28);--ky-dist-road:#cbcfc4;--ky-dist-deck:#bdc2b7;--ky-dist-walk:#eef0e8;--ky-dist-rail:#8b9288;--ky-dist-gate:#1f5fa8;--ky-dist-water:#c7d5dc;--ky-dist-green:#d2dcc4;--ky-dist-wood:#c3d0b6;--ky-dist-tree:#b3c2a3}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .ky-district:not([data-theme=light])){--ky-dist-ground:#1b2025;--ky-dist-grid:rgba(220,226,220,.16);--ky-dist-ink:#e8ece8;--ky-dist-halo:rgba(14,18,16,.85);--ky-dist-people:#fbbf24;--ky-dist-b0:#262c31;--ky-dist-b1:#2e353b;--ky-dist-b2:#394148;--ky-dist-b3:#474f57;--ky-dist-bline:rgba(220,226,220,.22);--ky-dist-road:#2b3239;--ky-dist-deck:#353d45;--ky-dist-walk:#242b31;--ky-dist-rail:#5b646c;--ky-dist-gate:#7fb2ee;--ky-dist-water:#1c2d3b;--ky-dist-green:#202d26;--ky-dist-wood:#1c2b23;--ky-dist-tree:#2e4337}}
:where(html[data-theme=dark] .ky-district,.ky-district[data-theme=dark]){--ky-dist-ground:#1b2025;--ky-dist-grid:rgba(220,226,220,.16);--ky-dist-ink:#e8ece8;--ky-dist-halo:rgba(14,18,16,.85);--ky-dist-people:#fbbf24;--ky-dist-b0:#262c31;--ky-dist-b1:#2e353b;--ky-dist-b2:#394148;--ky-dist-b3:#474f57;--ky-dist-bline:rgba(220,226,220,.22);--ky-dist-road:#2b3239;--ky-dist-deck:#353d45;--ky-dist-walk:#242b31;--ky-dist-rail:#5b646c;--ky-dist-gate:#7fb2ee;--ky-dist-water:#1c2d3b;--ky-dist-green:#202d26;--ky-dist-wood:#1c2b23;--ky-dist-tree:#2e4337}
.ky-district .ky-dist-ground{fill:var(--ky-dist-ground)}
.ky-district .ky-dist-grid{fill:none;stroke:var(--ky-dist-grid);stroke-width:1}
.ky-district .ky-dist-block{stroke:var(--ky-dist-bline);stroke-width:.5;stroke-linejoin:round}
.ky-district .ky-dist-b0{fill:var(--ky-dist-b0)}
.ky-district .ky-dist-b1{fill:var(--ky-dist-b1)}
.ky-district .ky-dist-b2{fill:var(--ky-dist-b2)}
.ky-district .ky-dist-b3{fill:var(--ky-dist-b3)}
.ky-district .ky-dist-street{stroke-linejoin:round;stroke-linecap:butt}
.ky-district .ky-dist-street-0{stroke:var(--ky-dist-road)}
.ky-district .ky-dist-street-1{stroke:var(--ky-dist-deck)}
.ky-district .ky-dist-street-2{stroke:var(--ky-dist-rail);stroke-dasharray:6 3}
.ky-district .ky-dist-street-3{stroke:var(--ky-dist-walk)}
.ky-district .ky-dist-land{stroke:none}
.ky-district .ky-dist-water{fill:var(--ky-dist-water)}
.ky-district .ky-dist-green{fill:var(--ky-dist-green)}
.ky-district .ky-dist-wood{fill:var(--ky-dist-wood)}
.ky-district .ky-dist-tree{fill:none;stroke:var(--ky-dist-tree);stroke-linecap:round}
.ky-district .ky-dist-gate rect{fill:var(--ky-dist-gate);stroke:var(--ky-dist-gate);stroke-width:2.4}
.ky-district .ky-dist-gate-plausible rect{fill:var(--ky-dist-ground);fill-opacity:.85}
.ky-district .ky-dist-gate-queue{fill:none;stroke:var(--ky-dist-gate);stroke-width:3;stroke-dasharray:9 7}
.ky-district .ky-dist-ghost{fill:var(--ky-dist-b1);fill-opacity:.35}
.ky-district .ky-dist-ink{fill:none;stroke:var(--ky-dist-ink);stroke-linecap:round;stroke-linejoin:round}
.ky-district .ky-dist-text{fill:var(--ky-dist-ink);font-family:var(--ky-font,system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif);font-weight:600;paint-order:stroke;stroke:var(--ky-dist-halo);stroke-linejoin:round}`;

const ROOT = /^<svg([^>]*)>/;
const VIEWBOX = /viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/;

/** The north arrow of a venue's drawing and the apron (a ballpark's foul ground) under it: a district has one of each of its own. */
const withoutOwn = (svg: string): string => svg.replace(/<rect class="ky-(?:apron|foul)"[^>]*\/>/, "").replace(/<path class="ky-cr-north"[^>]*\/>/, "").replace(/<path class="ky-cr-north-n"[^>]*\/>/, "");

/**
 * A venue's drawing as a part of the district's: its root made a nested `svg` that keeps the class, the sport and the colours the drawing's stylesheet reads, its box laid in its own frame (so that the group's turn
 * and shift put it in place), and its title, description, apron, arrow and stylesheet taken out (the stylesheet is given back in `styles`).
 */
export function nestedDrawing(svg: string): { markup: string; box: { x: number; y: number; w: number; h: number }; styles: string[] } {
  const root = ROOT.exec(svg);
  const found = root === null ? null : VIEWBOX.exec(root[1]);
  if (root === null || found === null) throw new Error("a venue's drawing is an SVG with a viewBox");
  const [x, y, w, h] = found.slice(1).map(Number);
  const keep = [...root[1].matchAll(/\s(class|data-[\w-]+|style)="([^"]*)"/g)].map((m) => ` ${m[1]}="${m[2]}"`).join("");
  // The drawing's stylesheet is taken out and given back apart: the district writes each distinct one once (venues of one family share the base style, which is most of it).
  const styles: string[] = [];
  const body = withoutOwn(svg.slice(root[0].length))
    .replace(/<style>[\s\S]*?<\/style>/g, (block) => {
      styles.push(block);
      return "";
    })
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>|<desc\b[^>]*>[\s\S]*?<\/desc>/g, "")
    .replace(/<\/svg>\s*$/, "");
  return { markup: `<svg${keep} x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" aria-hidden="true" focusable="false">${body}</svg>`, box: { x, y, w, h }, styles };
}

const num = (value: number): string => String(Math.round(value * 100) / 100);

/** The point of a venue's own drawing the district puts at the venue's place on the ground and turns it about: the middle of its surface (the box the stands are laid round), or home plate, the origin of a ballpark's frame. */
export function surfaceCentre(options: SurfaceOptions): Pt {
  if (options.sport === "mlb") return [0, 0];
  const stands = crowdStands(options);
  if (stands === undefined) throw new Error("a district's venue has a crowd");
  return [stands.box.x + stands.box.w / 2, stands.box.y + stands.box.h / 2];
}

/** A length in metres worth drawing as a scale: the largest of 50, 100, 200, 500, 1000, 2000, 5000 that is not more than a fifth of the plan's width. */
export function scaleOf(view: { w: number }): number {
  const fifth = (view.w / FEET_PER_METRE) / 5;
  return [5000, 2000, 1000, 500, 200, 100, 50].find((m) => m <= fifth) ?? 50;
}

/** The distance a scale says, as it is read: metres under a kilometre, else kilometres. */
export const metresText = (metres: number): string => (metres >= 1000 ? `${metres / 1000} km` : `${metres} m`);

/** The id of a district's drawing: the option's, or a hash of the options. */
export const districtId = (options: DistrictOptions): string => (typeof options.id === "string" && options.id !== "" ? options.id : `ky-district-${hash(JSON.stringify([options.venues, options.mode, options.turn, options.language, options.theme, options.stands, ...(options.context === undefined || options.context.length === 0 ? [] : [options.context.map((a) => a.key)]), ...(options.building === undefined ? [] : [options.building])]))}`);

/** The title and the description of a district, in its language: what is drawn, where each venue stands from the first, how far apart they are, and the credit. */
export function describeDistrict(options: DistrictOptions, plan: DistrictPlan = planDistrict(options)): { title: string; description: string } {
  const language: Language = options.language === "ja" ? "ja" : "en";
  const names = plan.members.map((p) => p.member.name[language]);
  const words = KYOGIJO_STRINGS[language].said;
  const list = language === "ja" ? (names.length > 1 ? `${names.slice(0, -1).join("、")}と${names[names.length - 1]}` : names[0]) : names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  const title = language === "ja" ? `${list}の位置関係` : `${list}: where they stand`;
  const gap = language === "ja" ? "" : " ";
  const first = plan.between[0];
  const nameOf = (key: string): string => plan.members.find((p) => p.member.key === key)!.member.name[language];
  const apart = first === undefined ? "" : language === "ja" ? `${gap}${nameOf(first.a)}と${nameOf(first.b)}の中心は約${Math.round(first.metres)}m離れています。` : `${gap}The middles of ${nameOf(first.a)} and ${nameOf(first.b)} are about ${Math.round(first.metres)} metres apart.`;
  const text = fillWords(words.district, { count: String(plan.members.length), mode: words[plan.mode === "city" ? "districtCity" : "districtNeighbours"] });
  const level = options.outside?.level ?? 0;
  const standing = level > 0 ? Math.round(plan.members.filter((p) => walkIdFor([p.member.id]) !== undefined).reduce((sum, p) => sum + p.member.seats, 0) * level / 100) : 0;
  const crowd = standing > 0 ? `${gap}${fillWords(words.districtOutside, { percent: String(level), people: String(standing).replace(/\B(?=(\d{3})+(?!\d))/g, ",") })}` : "";
  const credits = [...new Set([...(plan.context?.attribution[language] ?? []), ...plan.members.flatMap((p) => (p.member.attribution === undefined ? [] : [p.member.attribution[language]]))])];
  const credit = credits.length === 0 ? "" : `${gap}${credits.join(language === "ja" ? "。" : "; ")}${language === "ja" ? "。" : "."}`;
  return { title, description: `${text}${apart}${crowd}${gap}${words.districtCredit}${gap}${VENUE_ATTRIBUTION}${language === "ja" ? "。" : "."}${credit}` };
}

const fillWords = (text: string, values: Record<string, string>): string => text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** How a venue is drawn for a district: its own options with the district's language, theme and ids, in 2D with its stands or as the floor of the 3D view (its building only). */
export function drawMember(member: DistrictMember, options: DistrictOptions, index: number, id: string, how: { floor?: boolean } = {}): string {
  const stands = options.stands !== false && how.floor !== true;
  return drawKyogijo({
    ...member.options,
    crowd: { real: true, ...(stands ? {} : { stands: false }) },
    language: options.language === "ja" ? "ja" : "en",
    ...(options.theme === undefined ? {} : { theme: options.theme }),
    id: `${id}-m${index}`,
  } as SurfaceOptions);
}

/**
 * The plan of a district as one SVG: the ground, a grid and a scale, a north arrow, and each venue's own drawing (its stands, or its building only for `stands: false`) put where it stands and turned as it lies, with a name beside each
 * where `labels` says. `drawing` is how each venue is drawn; the 3D view gives it the building-only floor.
 * @example
 * ```ts
 * import { drawDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district";
 * const svg = drawDistrict({ venues: ["bc-place", "rogers-arena"] });
 * console.log(svg.includes("ky-district"), svg.includes("ky-cr-shell"));
 * // true true
 * ```
 */
export function drawDistrict(options: DistrictOptions, plan: DistrictPlan = planDistrict(options), drawing?: (member: DistrictMember, index: number) => string): string {
  const language: Language = options.language === "ja" ? "ja" : "en";
  const id = districtId(options);
  const { view } = plan;
  const labels = options.labels ?? plan.mode === "city";
  const { title, description } = describeDistrict(options, plan);
  const diag = Math.max(view.w, view.h);
  const parts: string[] = [];
  // A grid every `step` feet of the ground: the kilometre in a city, the hundred metres among neighbours.
  const step = (plan.mode === "city" ? 1000 : 100) * FEET_PER_METRE;
  const grid: string[] = [];
  const reach = Math.hypot(view.w, view.h);
  // The grid lines run along the map's east and north, turned with it: lines of constant east and of constant north through the district's origin (the plan's centre of the venues), drawn long enough to cross the frame.
  const origin: Pt = [0, 0];
  for (let k = -Math.ceil(reach / step); k <= Math.ceil(reach / step); k += 1) {
    const [ax, ay] = turnBy([k * step, -reach], plan.turn);
    const [bx, by] = turnBy([k * step, reach], plan.turn);
    const [cx, cy] = turnBy([-reach, k * step], plan.turn);
    const [dx, dy] = turnBy([reach, k * step], plan.turn);
    grid.push(`M${num(origin[0] + ax)} ${num(origin[1] + ay)}L${num(origin[0] + bx)} ${num(origin[1] + by)}M${num(origin[0] + cx)} ${num(origin[1] + cy)}L${num(origin[0] + dx)} ${num(origin[1] + dy)}`);
  }
  parts.push(`<rect class="ky-dist-ground" x="${num(view.x)}" y="${num(view.y)}" width="${num(view.w)}" height="${num(view.h)}"/>`);
  parts.push(`<clipPath id="${id}-clip"><rect x="${num(view.x)}" y="${num(view.y)}" width="${num(view.w)}" height="${num(view.h)}"/></clipPath>`);
  parts.push(`<path class="ky-dist-grid" clip-path="url(#${id}-clip)" d="${grid.join("")}"/>`);
  if (plan.context !== undefined) parts.push(`<g clip-path="url(#${id}-clip)">${contextFloor(plan.context)}</g>`);
  // The building a raised venue stands in, flat under it: pale as a ghost where it is see-through, in its tone of height where it is solid.
  if (options.building !== "none") {
    for (const placed of plan.members) {
      const shell = placed.member.shell;
      if (shell === undefined) continue;
      const tone = options.building === "solid" ? `ky-dist-b${toneOf(shell.height)}` : "ky-dist-ghost";
      parts.push(`<path class="ky-dist-block ${tone}" data-shell="${esc(placed.member.key)}" clip-path="url(#${id}-clip)" d="M${placed.footprint.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}Z"/>`);
    }
  }
  const styles: string[] = [];
  plan.members.forEach((placed, i) => {
    const svg = drawing === undefined ? drawMember(placed.member, options, i, id) : drawing(placed.member, i);
    const { markup, styles: own } = nestedDrawing(svg);
    for (const block of own) if (!styles.includes(block)) styles.push(block);
    // The 3D view draws a raised floor in the air itself: the ground under it is left bare.
    if (drawing !== undefined && (placed.member.elevation ?? 0) > 0) return;
    const centre = surfaceCentre(placed.member.options);
    parts.push(`<g class="ky-dist-venue" data-venue="${esc(placed.member.key)}" transform="translate(${num(placed.at[0])} ${num(placed.at[1])}) rotate(${num(placed.angle)}) translate(${num(-centre[0])} ${num(-centre[1])})">${markup}</g>`);
  });
  if (plan.gates.length > 0) {
    // A door's bar on the outline, and a dashed stub out from it the way a queue would run; a gate a source names is filled, one that is ours is drawn hollow.
    const bars = plan.gates.map((g) => `<g class="ky-dist-gate ky-dist-gate-${g.basis}" data-gate="${esc(g.key)}" transform="translate(${num(g.at[0])} ${num(g.at[1])}) rotate(${num(g.angle)})"><path class="ky-dist-gate-queue" d="M0 -9V-90"/><rect x="-24" y="-5" width="48" height="10" rx="3.5"/></g>`);
    parts.push(`<g class="ky-dist-gates" aria-hidden="true">${bars.join("")}</g>`);
  }
  if (labels) {
    const size = diag * (plan.mode === "city" ? 0.018 : 0.026);
    plan.members.forEach((placed) => {
      const bottom = Math.max(...placed.footprint.map((p) => p[1]));
      const x = placed.footprint.reduce((s, p) => s + p[0], 0) / placed.footprint.length;
      parts.push(`<text class="ky-dist-text" x="${num(x)}" y="${num(bottom + size * 1.3)}" text-anchor="middle" font-size="${num(size)}" stroke-width="${num(size * 0.22)}">${esc(placed.member.name[language])}</text>`);
    });
  }
  // The north arrow, in the top right corner of the frame, and the scale bar at the bottom left.
  const arrow = diag * 0.05;
  const [ax, ay] = [view.x + view.w - arrow * 1.2, view.y + arrow * 1.6];
  const tip = turnBy([0, -arrow], plan.turn);
  const tail = turnBy([0, arrow * 0.6], plan.turn);
  const left = turnBy([-arrow * 0.28, 0], plan.turn);
  const right = turnBy([arrow * 0.28, 0], plan.turn);
  const nPos = turnBy([0, -arrow * 1.35], plan.turn);
  parts.push(`<g class="ky-dist-north" aria-hidden="true"><path class="ky-dist-ink" stroke-width="${num(arrow * 0.06)}" d="M${num(ax + tail[0])} ${num(ay + tail[1])}L${num(ax + tip[0])} ${num(ay + tip[1])}M${num(ax + left[0])} ${num(ay + left[1])}L${num(ax + tip[0])} ${num(ay + tip[1])}L${num(ax + right[0])} ${num(ay + right[1])}"/><text class="ky-dist-text" x="${num(ax + nPos[0])}" y="${num(ay + nPos[1] + arrow * 0.18)}" text-anchor="middle" font-size="${num(arrow * 0.5)}" stroke-width="${num(arrow * 0.1)}">N</text></g>`);
  const metres = scaleOf(view);
  const bar = metres * FEET_PER_METRE;
  const [sx, sy] = [view.x + diag * 0.03, view.y + view.h - diag * 0.04];
  parts.push(`<g class="ky-dist-scale" aria-hidden="true"><path class="ky-dist-ink" stroke-width="${num(diag * 0.004)}" d="M${num(sx)} ${num(sy - diag * 0.01)}V${num(sy)}H${num(sx + bar)}V${num(sy - diag * 0.01)}"/><text class="ky-dist-text" x="${num(sx + bar / 2)}" y="${num(sy - diag * 0.018)}" text-anchor="middle" font-size="${num(diag * 0.022)}" stroke-width="${num(diag * 0.005)}">${metresText(metres)}</text></g>`);
  const sheet = options.style === "none" ? "" : `<style>${KYOGIJO_DISTRICT_STYLE}</style>${styles.join("")}`;
  const theme = options.theme === "light" || options.theme === "dark" ? ` data-theme="${options.theme}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" class="kyogijo ky-district" viewBox="${num(view.x)} ${num(view.y)} ${num(view.w)} ${num(view.h)}" role="img" aria-labelledby="${id}-t ${id}-d" data-sport="district" data-mode="${plan.mode}"${(options.outside?.level ?? 0) > 0 ? ` data-outside="${options.outside?.level}"` : ""}${theme} lang="${language}"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(description)}</desc>${sheet}${parts.join("")}</svg>`;
}

/** The venues a district was asked for that the package has no key for: none when it can be drawn. */
export const unknownVenues = (venues: readonly DistrictVenueInput[]): string[] => venues.map((v) => (typeof v === "string" ? v.split(":")[0] : v.id)).filter((id) => !isDistrictId(id));

