// The dojo builder (道場): the floor of a hall in mats, laid out as real tatami units (the traditional lay, in which no four corners meet, or a grid, a checker or a border), with the walls, the
// doors, the windows, the shrine and the seat of honour (the kamiza, 上座) round it, in metres: the origin at the top left of the floor, north at the top. The areas of a room are given in mats (jō, 畳),
// the unit every Japanese floor is counted in, or in metres. Nothing here draws SVG.
import type { DojoFigures } from "../leagues/budo.ts";
import { DOJO_LEAGUES } from "../leagues/budo.ts";
import { boxD, rectArea } from "./kit.ts";
import { emptyParts, grow, type MBox, type MMark, type Parts } from "./parts.ts";
import { checker, heri, lay, matCount, seams, tatamiAreas, tint, type MatSize, type Piece } from "./tatami.ts";
import type { Compass, DojoEra, DojoPattern, DojoSize, DojoSpec, Entrance, Side4 } from "./types.ts";

/** The usual sizes of a room counted in jō, in the mats' widths across and along: 8 jō is 4 by 4 widths (3.64 m square of Chūkyōma mats), 20 jō 5 by 8. */
export const DOJO_SIZES: Readonly<Record<number, readonly [number, number]>> = Object.freeze({ 8: [4, 4], 12: [4, 6], 20: [5, 8], 50: [10, 10], 100: [10, 20], 200: [20, 20] });

/** The mats' widths across and along of a floor of `jo` mats: the usual shape where there is one, else the whole-number shape nearest to 1 to 1.6. @throws RangeError for a count that is not a whole number of 2 or more. */
export function shapeOfJo(jo: number): [number, number] {
  if (!Number.isInteger(jo) || jo < 2 || jo > 1000) throw new RangeError("The area of a dojo is a whole number of jō, 2 to 1000");
  const known = DOJO_SIZES[jo];
  if (known !== undefined) return [known[0], known[1]];
  const units = jo * 2;
  let best: [number, number] = [1, units];
  let score = Infinity;
  for (let a = 1; a * a <= units; a += 1) {
    if (units % a !== 0) continue;
    const b = units / a;
    const s = Math.abs(Math.log(b / a / 1.6));
    if (s < score) {
      score = s;
      best = [a, b];
    }
  }
  return best;
}

/** The floor's size in metres from the options: its width (across, x) and its length (along, y). */
export function floorOf(spec: DojoSpec, mat: MatSize): { width: number; length: number } {
  const size: DojoSize = spec.mats ?? spec.jo ?? 20;
  const fromJo = (jo: number): { width: number; length: number } => {
    const [a, b] = shapeOfJo(jo);
    return { width: a * mat.width, length: b * mat.width };
  };
  if (typeof size === "number") return fromJo(size);
  if (Array.isArray(size)) {
    const [across, along] = size as unknown as readonly [number, number];
    for (const n of [across, along]) if (!Number.isInteger(n) || n < 1 || n > 60) throw new RangeError("dojo.mats is [across, along]: whole numbers of mats, 1 to 60");
    return { width: across * mat.width, length: along * mat.length };
  }
  const o = size as Exclude<DojoSize, number | readonly [number, number]>;
  if (o.jo !== undefined) return fromJo(o.jo);
  const unit = o.unit ?? "m";
  if (unit === "jo") return fromJo(o.width ?? o.length ?? 20);
  const w = o.width;
  const l = o.length;
  if (typeof w !== "number" || typeof l !== "number" || !(w > 0) || !(l > 0) || !Number.isFinite(w) || !Number.isFinite(l)) throw new RangeError("dojo.mats is { width, length, unit } with a width and a length above 0");
  if (unit === "mat") return { width: w * mat.width, length: l * mat.length };
  const k = unit === "ft" ? 0.3048 : 1;
  if (unit !== "m" && unit !== "ft") throw new RangeError('dojo.mats.unit is "m", "ft", "mat" or "jo"');
  return { width: w * k, length: l * k };
}

/** The compass side a name means: north is the top of the drawing. @throws Error for a name that is not a side. */
export function compassOf(side: Side4 | undefined, fallback: Compass): Compass {
  if (side === undefined) return fallback;
  const map: Record<string, Compass> = { north: "north", south: "south", east: "east", west: "west", top: "north", bottom: "south", left: "west", right: "east" };
  const found = map[String(side)];
  if (found === undefined) throw new Error(`Unknown side "${String(side)}": use north, south, east or west (or top, bottom, left or right)`);
  return found;
}

const OPPOSITE: Readonly<Record<Compass, Compass>> = { north: "south", south: "north", east: "west", west: "east" };

/** What a dojo is: its floor, its mats, its walls and what is in them. */
export interface DojoLayout {
  parts: Parts;
  floor: MBox;
  /** The floor and the walls round it. */
  extent: MBox;
  width: number;
  length: number;
  mat: MatSize;
  pattern: DojoPattern;
  pieces: Piece[];
  /** The mats counted as whole ones (a half mat is a half): the area in jō. */
  jo: number;
  counts: { full: number; half: number; cut: number };
  kamiza: Compass;
  wall: number;
  /** The floor and the wood surround round it: the room inside the walls. */
  room: MBox;
  /** The width of the wood surround, 0 for none. */
  surround: number;
  entrances: { wall: Compass; box: MBox }[];
  windows: { wall: Compass; box: MBox }[];
  shrine: MBox | undefined;
  /** The contest areas laid on the floor. */
  contests: MBox[];
  /** The raised platform of the seat of honour, and the banner on its wall. */
  dais: MBox | undefined;
  banner: MBox | undefined;
  /** The era of the floor, where it has them. */
  era: DojoEra | undefined;
  marks: MMark[];
}

/** The league of mats a spec asks for. */
export function dojoLeague(standard: string | undefined): DojoFigures {
  const id = standard ?? "chukyoma";
  const found = DOJO_LEAGUES.find((l) => l.id === id);
  if (found === undefined) throw new Error(`Unknown mat standard "${id}": use one of ${DOJO_LEAGUES.map((l) => l.id).join(", ")}`);
  return found.dimensions;
}

const along = (wall: Compass, box: MBox, at: number, width: number, depth: number): MBox =>
  wall === "north" ? { x0: box.x0 + at - width / 2, y0: box.y0 - depth, x1: box.x0 + at + width / 2, y1: box.y0 } : wall === "south" ? { x0: box.x0 + at - width / 2, y0: box.y1, x1: box.x0 + at + width / 2, y1: box.y1 + depth } : wall === "west" ? { x0: box.x0 - depth, y0: box.y0 + at - width / 2, x1: box.x0, y1: box.y0 + at + width / 2 } : { x0: box.x1, y0: box.y0 + at - width / 2, x1: box.x1 + depth, y1: box.y0 + at + width / 2 };

/** The length of a wall of the floor, and the distance along it a thing at `at` (0 to 1) stands, held so that it keeps clear of the corners. */
function place(wall: Compass, box: MBox, at: number | undefined, width: number): { at: number; width: number } {
  const len = wall === "north" || wall === "south" ? box.x1 - box.x0 : box.y1 - box.y0;
  const w = Math.min(width, len * 0.8);
  const t = typeof at === "number" && Number.isFinite(at) ? Math.min(1, Math.max(0, at)) : 0.5;
  return { at: Math.min(len - w / 2 - 0.1, Math.max(w / 2 + 0.1, t * len)), width: w };
}

/**
 * The era a spec asks for, and the spec as it was then: the era's look, colours, pattern, contest areas and outline laid over the spec's own. `era` picks an era by name, `year` the first whose
 * years hold it (an era with an unknown year, `null`, never holds one), and with neither the last era, the floor as it is now. A spec without eras is its own era.
 * @throws Error for an `era` that no era is named, RangeError for a `year` no era holds.
 */
export function resolveEra(spec: DojoSpec | undefined): { spec: DojoSpec; era: DojoEra | undefined } {
  const s = spec ?? {};
  const eras = s.eras;
  if (eras === undefined || eras.length === 0) return { spec: s, era: undefined };
  let era: DojoEra | undefined;
  if (s.era !== undefined) {
    era = eras.find((e) => e.name === s.era);
    if (era === undefined) throw new Error(`Unknown era "${String(s.era)}": use one of ${eras.map((e) => e.name).join(", ")}`);
  } else if (s.year !== undefined) {
    if (typeof s.year !== "number" || !Number.isFinite(s.year)) throw new RangeError("dojo.year is a year");
    const year = s.year;
    era = eras.find((e) => typeof e.from === "number" && year >= e.from && (typeof e.to !== "number" || year <= e.to));
    if (era === undefined) throw new RangeError(`No era of this dojo holds the year ${year}: ${eras.map((e) => `${e.name} (${e.from ?? "?"} to ${e.to ?? "?"})`).join(", ")}`);
  } else {
    era = eras[eras.length - 1];
  }
  const without = <T extends object>(o: T, keys: readonly string[]): Record<string, unknown> => Object.fromEntries(Object.entries(o).filter(([k, v]) => !keys.includes(k) && v !== undefined));
  const colours = era.colours;
  const merged = { ...without(s, ["eras", "era", "year"]), ...without(era, ["name", "nameJa", "from", "to", "colours"]) } as DojoSpec;
  const own = s.colours ?? s.colors;
  if (colours !== undefined || own !== undefined) merged.colours = { ...own, ...colours };
  delete merged.colors;
  return { spec: merged, era };
}

/** The dojo's spec as drawn: the era's changes laid over it. */
export const dojoSpecOf = (spec: DojoSpec | undefined): DojoSpec => resolveEra(spec).spec;

/** The plan of the dojo a spec asks for. */
export function dojoLayout(asked: DojoSpec, league: DojoFigures): DojoLayout {
  const spec = dojoSpecOf(asked);
  const mat = league.mat;
  const dims = floorOf(spec, mat);
  // The floor lies wide, as every surface does: its longer side is x, and the mats run along it.
  const width = Math.max(dims.width, dims.length);
  const length = Math.min(dims.width, dims.length);
  const pattern: DojoPattern = spec.pattern ?? "traditional";
  if (pattern !== "traditional" && pattern !== "competition" && pattern !== "checker" && pattern !== "border") throw new Error(`Unknown pattern "${String(pattern)}": use traditional, competition, checker or border`);
  const floor: MBox = { x0: 0, y0: 0, x1: width, y1: length };
  const alongAxis = "x" as "x" | "y";
  const kamiza = compassOf(spec.kamiza, "north");
  const wallsOn = spec.walls !== false;
  const wall = wallsOn ? (typeof spec.walls === "object" && spec.walls !== null && typeof spec.walls.thickness === "number" && spec.walls.thickness > 0 ? spec.walls.thickness : 0.3) : 0;
  const parts = emptyParts();
  const raw = lay(floor, mat, alongAxis, pattern !== "checker");
  // Contest areas laid on the floor: squares of 8 m, centred along the longer side and 4 m apart, the mats inside them the first colour and the rest the second.
  const contests: MBox[] = [];
  const grid = spec.areas === undefined ? undefined : typeof spec.areas === "number" ? { across: spec.areas, down: 1 } : spec.areas;
  const a = spec.areaSize === undefined ? 8 : spec.areaSize;
  if (typeof a !== "number" || !Number.isFinite(a) || a < 8 || a > 10) throw new RangeError("dojo.areaSize is 8 m to 10 m (the IJF's contest area)");
  if (grid !== undefined && !(grid.across === 0 && grid.down === 0)) {
    for (const k of [grid.across, grid.down]) if (!Number.isInteger(k) || k < 1 || k > 6) throw new RangeError("dojo.areas is a whole number of 1 to 6, or { across, down } of whole numbers of 1 to 6");
    const gap = 4;
    const margin = 3;
    const runX = grid.across * a + (grid.across - 1) * gap;
    const runY = grid.down * a + (grid.down - 1) * gap;
    const needX = runX + 2 * margin;
    const needY = runY + 2 * margin;
    if (width < needX - 1e-9 || length < needY - 1e-9) throw new RangeError(`A floor of ${Math.round(width * 100) / 100} m by ${Math.round(length * 100) / 100} m is too small for ${grid.across * grid.down} contest area${grid.across * grid.down === 1 ? "" : "s"}: it needs ${needX} m by ${needY} m`);
    for (let j = 0; j < grid.down; j += 1) {
      for (let i = 0; i < grid.across; i += 1) {
        const x0 = (width - runX) / 2 + i * (a + gap);
        const y0 = (length - runY) / 2 + j * (a + gap);
        contests.push({ x0, y0, x1: x0 + a, y1: y0 + a });
      }
    }
  }
  // The tones: the contest areas laid on the floor are the first, the rest of the floor the second; a border puts a band of the third round the floor (and the floor inside it is the first, or the second when contest areas lie on it).
  let pieces: Piece[];
  // An outline puts a band one mat wide in the third colour round the inside of each contest area.
  const zones: { box: MBox; tone: 1 | 2 | 3 }[] = spec.outline === true && contests.length > 0 ? [...contests.map((b) => ({ box: grow(b, -mat.width), tone: 1 as const })), ...contests.map((b) => ({ box: b, tone: 3 as const }))] : contests.map((b) => ({ box: b, tone: 1 as const }));
  let rest: 1 | 2 | 3 = contests.length > 0 ? 2 : 1;
  if (pattern === "border") {
    zones.push({ box: grow(floor, -mat.width), tone: contests.length > 0 ? 2 : 1 });
    rest = 3;
  } else if (pattern === "competition" && contests.length === 0) {
    // A floor in the colours of a contest area: a safety area of up to 3 m round the first colour.
    const m = Math.min(3, Math.max(mat.width, Math.min(width, length) * 0.2));
    if (Math.min(width, length) > 2 * m + mat.width) {
      zones.push({ box: grow(floor, -m), tone: 1 });
      rest = 2;
    }
  }
  if (pattern === "checker" && contests.length === 0) pieces = checker(raw, floor, mat);
  else pieces = zones.length > 0 || rest !== 1 ? tint(raw, zones, rest, mat) : raw;
  const named = { 1: "mats", 2: "mats-alt", 3: "border" } as const;
  parts.areas.push(...tatamiAreas("mats", pieces, { 1: "ky-bud-t1", 2: "ky-bud-t2", 3: "ky-bud-t3" }, named));
  parts.shapes.push(...seams("mats", pieces, 0.02));
  if (pattern === "traditional" || pattern === "border") parts.areas.push(...heri("mats", pieces, Math.min(0.05, mat.width * 0.06), mat));
  // The walls: a band of the thickness round the floor; the doors and the windows are cut in it.
  const entrances: DojoLayout["entrances"] = [];
  const windows: DojoLayout["windows"] = [];
  const marks: MMark[] = [];
  const surround = spec.surround === undefined ? 0 : spec.surround;
  if (typeof surround !== "number" || !Number.isFinite(surround) || surround < 0 || surround > 5) throw new RangeError("dojo.surround is the wood round the mats, 0 m to 5 m");
  const room = grow(floor, surround);
  const frame = grow(room, wall);
  if (surround > 0) parts.areas.unshift({ id: "surround", feature: "floor", cls: "ky-bud-floor", d: `${boxD(room)}${boxD(floor)}`, evenodd: true });
  if (wallsOn) {
    parts.areas.push({ id: "walls", feature: "walls", cls: "ky-bud-wall", d: `${boxD(frame)}${boxD(room)}`, evenodd: true });
    const doors: readonly Entrance[] = spec.entrances ?? [{ wall: OPPOSITE[kamiza] }];
    doors.forEach((e, i) => {
      const w = compassOf(e.wall, OPPOSITE[kamiza]);
      const p = place(w, room, e.at, e.width ?? 1.8);
      const b = along(w, room, p.at, p.width, wall);
      entrances.push({ wall: w, box: b });
      parts.areas.push(rectArea(`door-${i + 1}`, "doors", "ky-bud-door", b));
    });
    const windowList = windowsOf(spec.windows, floor);
    windowList.forEach((e, i) => {
      const w = compassOf(e.wall, "east");
      const p = place(w, room, e.at, e.width ?? 1.8);
      const b = along(w, room, p.at, p.width, wall);
      const mid = wall / 2;
      const thin = w === "north" || w === "south" ? { x0: b.x0, y0: b.y0 + mid * 0.7, x1: b.x1, y1: b.y1 - mid * 0.7 } : { x0: b.x0 + mid * 0.7, y0: b.y0, x1: b.x1 - mid * 0.7, y1: b.y1 };
      windows.push({ wall: w, box: thin });
      parts.areas.push(rectArea(`window-${i + 1}`, "windows", "ky-bud-window", thin));
    });
  }
  // The dais: the seat of honour's platform, against the middle of the kamiza wall, 1.5 m deep (ours: no source gives its size) and a third of the wall wide, up to 5 m.
  let dais: MBox | undefined;
  if (spec.dais === true) {
    const w = Math.min(5, (kamiza === "north" || kamiza === "south" ? width : length) * 0.34);
    const p = place(kamiza, room, 0.5, w);
    const d = Math.min(1.5, (kamiza === "north" || kamiza === "south" ? length : width) * 0.2);
    const edge = along(kamiza, room, p.at, w, d);
    dais = kamiza === "north" ? { ...edge, y0: room.y0, y1: room.y0 + d } : kamiza === "south" ? { ...edge, y0: room.y1 - d, y1: room.y1 } : kamiza === "west" ? { ...edge, x0: room.x0, x1: room.x0 + d } : { ...edge, x0: room.x1 - d, x1: room.x1 };
    parts.areas.push(rectArea("dais", "dais", "ky-bud-dais", dais));
  }
  // The banner: a plain dark band 0.9 m wide on the kamiza wall, in the wall's thickness, over the dais or the shrine.
  let banner: MBox | undefined;
  if (spec.banner === true && wallsOn) {
    const p = place(kamiza, room, 0.5, 0.9);
    banner = along(kamiza, room, p.at, 0.9, wall * 0.7);
    parts.areas.push(rectArea("banner", "banner", "ky-bud-banner", banner));
  }
  // The shinzen (神前): the shrine at the middle of the kamiza wall, on the floor against it.
  let shrine: MBox | undefined;
  if (spec.shinzen === true) {
    const w = Math.min(1.8, (kamiza === "north" || kamiza === "south" ? width : length) * 0.3);
    const p = place(kamiza, room, 0.5, w);
    const d = 0.35;
    const edge = along(kamiza, room, p.at, w, d);
    shrine = kamiza === "north" ? { ...edge, y0: room.y0, y1: room.y0 + d } : kamiza === "south" ? { ...edge, y0: room.y1 - d, y1: room.y1 } : kamiza === "west" ? { ...edge, x0: room.x0, x1: room.x0 + d } : { ...edge, x0: room.x1 - d, x1: room.x1 };
    parts.areas.push(rectArea("shinzen", "shrine", "ky-bud-shrine", shrine));
  }
  const cx = width / 2;
  const cy = length / 2;
  const inset = (c: Compass): { x: number; y: number } => (c === "north" ? { x: cx, y: Math.min(1.2, length * 0.1) } : c === "south" ? { x: cx, y: length - Math.min(1.2, length * 0.1) } : c === "west" ? { x: Math.min(1.2, width * 0.1), y: cy } : { x: width - Math.min(1.2, width * 0.1), y: cy });
  const k = inset(kamiza);
  const s = inset(OPPOSITE[kamiza]);
  marks.push({ id: "kamiza", x: k.x, y: k.y, side: kamiza === "south" ? "bottom" : "top" });
  marks.push({ id: "shimoza", x: s.x, y: s.y, side: kamiza === "north" ? "bottom" : "top" });
  if (dais !== undefined) marks.push({ id: "dais", x: (dais.x0 + dais.x1) / 2, y: (dais.y0 + dais.y1) / 2, side: kamiza === "south" ? "bottom" : "top" });
  if (banner !== undefined) marks.push({ id: "banner", x: (banner.x0 + banner.x1) / 2, y: (banner.y0 + banner.y1) / 2, side: kamiza === "south" ? "bottom" : "top" });
  if (shrine !== undefined) marks.push({ id: "shinzen", x: (shrine.x0 + shrine.x1) / 2, y: (shrine.y0 + shrine.y1) / 2, side: kamiza === "south" ? "bottom" : "top" });
  const door = entrances[0];
  if (door !== undefined) marks.push({ id: "entrance", x: (door.box.x0 + door.box.x1) / 2, y: (door.box.y0 + door.box.y1) / 2, side: door.wall === "north" ? "top" : "bottom" });
  const win = windows[0];
  if (win !== undefined) marks.push({ id: "window", x: (win.box.x0 + win.box.x1) / 2, y: (win.box.y0 + win.box.y1) / 2, side: win.wall === "north" ? "top" : "bottom" });
  if (contests.length > 0) marks.push({ id: "contest-area", x: (contests[0].x0 + contests[0].x1) / 2, y: contests[0].y0 + 1.2, side: "top" });
  marks.push({ id: "tatami", x: cx, y: cy, side: "bottom" });
  const edge = pieces.find((p) => p.kind === "full");
  if (edge !== undefined && (pattern === "traditional" || pattern === "border")) marks.push({ id: "heri", x: (edge.x0 + edge.x1) / 2, y: edge.y0 + 0.02, side: "top" });
  if (wallsOn) marks.push({ id: "wall", x: cx * 0.4, y: -wall / 2, side: "top" });
  const counts = { full: pieces.filter((p) => p.kind === "full").length, half: pieces.filter((p) => p.kind === "half").length, cut: pieces.filter((p) => p.kind === "cut").length };
  return { parts, floor, extent: grow(room, wall + 0.2), width, length, mat, pattern, pieces, jo: Math.round(matCount(pieces, mat) * 100) / 100, counts, kamiza, wall, entrances, windows, room, surround, shrine, contests, dais, banner, era: resolveEra(asked).era, marks };
}

/** The windows a spec asks for: the list, or `count` of them spread along the long walls. */
function windowsOf(w: DojoSpec["windows"], floor: MBox): { wall: Side4; at?: number; width?: number }[] {
  if (w === undefined) return [];
  if (typeof w === "number") {
    if (!Number.isInteger(w) || w < 0 || w > 24) throw new RangeError("dojo.windows is a list or a whole number of 0 to 24");
    const long: Compass[] = floor.x1 - floor.x0 >= floor.y1 - floor.y0 ? ["north", "south"] : ["west", "east"];
    const out: { wall: Side4; at?: number; width?: number }[] = [];
    for (let i = 0; i < w; i += 1) out.push({ wall: long[i % 2], at: (Math.floor(i / 2) + 1) / (Math.ceil(w / 2) + 1) });
    return out;
  }
  return [...w];
}
