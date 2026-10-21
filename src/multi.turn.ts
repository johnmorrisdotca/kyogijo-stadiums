// A tournament layout in 3D: the 3D view of `turn.ts`, with a layout's several surfaces on its floor. Nothing here is drawn a second way. Each surface stands as it does on its own page (`uprightsFor`: the nets and posts, a table
// tennis table's legs and skirt), moved to where the layout puts it, and the stands of the stadium round the hall are the 3D view's own (`standsVenueOf`); what only a layout has (the surrounds between the areas, the umpires'
// chairs and score tables, the scoreboards) is stood up from the same figures the flat drawing draws, and the floor is the flat drawing itself, `multiDrawing` made for raising. The model it makes is a `TurnModel`, so the
// camera, the controls, the pointer, the auto-turn and the tests of every other 3D view are this one's.
import { FEET_PER_METRE } from "./geometry.ts";
import { multiDrawing, type MultiDrawing } from "./multi.draw.ts";
import type { MultiCell, MultiOptions } from "./multi.types.ts";
import { outlineOf } from "./outline.ts";
import { hash } from "./format.ts";
import { TURN_PRESETS, NET_PRESETS, wrap, type PresetTable } from "./turn.camera.ts";
import { box, flat, n, plane, rect, shy, thinnest, wall, type Plane, type Rect, type Upright } from "./turn.kit.ts";
import { mountTurn, type KyogijoTurn } from "./turn.dom.ts";
import { turnMarkupOf } from "./turn.markup.ts";
import { openingView, sceneBox, type TurnModel, type TurnSettings } from "./turn.model.ts";
import { describeUprights, planesOf, uprightsFor, type UprightOptions, type Uprights } from "./uprights.ts";
import { standsVenueOf } from "./venue.ts";
import { isNetSport } from "./court.ts";
import type { Language, Sport, SurfaceOptions } from "./types.ts";

/** How high a surround stands: the ITTF's "about 75 cm" (Handbook 3.2.3.3). A layout of another sport with surrounds has the same (ours: no other rulebook is read for it). */
export const SURROUND_HEIGHT = 0.75 * FEET_PER_METRE;

/** The longest piece a surround is cut into, in feet: a long wall is several planes, so that each is drawn in its place among the surfaces and the chairs and not as one slab sorted by its middle. */
const SURROUND_PIECE = 10;

/** An umpire's chair's seat and a score table's top, in feet over the floor (ours: the rule gives no height for either). */
const CHAIR = 1.5;
const DESK = 2.5;

/** Where the scoreboards hang (ours): the one over the middle of the floor has its lower edge 13 feet up and its cables run 8 feet above its top; the one at each surface stands 2.6 feet off the floor. */
const HUNG = { bottom: 13, cables: 8 } as const;
const STANDING = { legs: 2.6, tall: 1.4 } as const;

/** A map of the plane that is a turn by a quarter or none, and a shift: (x, y) goes to (a x + b y + e, c x + d y + f). */
interface Map2 {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

const mapOf = (to: (x: number, y: number) => readonly [number, number]): Map2 => {
  const [e, f] = to(0, 0);
  const [px, py] = to(1, 0);
  const [qx, qy] = to(0, 1);
  return { a: px - e, b: qx - e, c: py - f, d: qy - f, e, f };
};
const at = (m: Map2, x: number, y: number): [number, number] => [m.a * x + m.b * y + m.e, m.c * x + m.d * y + m.f];
const dir = (m: Map2, x: number, y: number): [number, number] => [m.a * x + m.b * y, m.c * x + m.d * y];

/** A plane moved by a map, under a new id. A plane that stands in a frame turned a quarter turns with it: its corner, its two sides and the way it faces out. */
function place(p: Plane, m: Map2, id: string): Plane {
  const [ox, oy] = at(m, p.o[0], p.o[1]);
  const [ux, uy] = dir(m, p.u[0], p.u[1]);
  const [vx, vy] = dir(m, p.v[0], p.v[1]);
  const moved: Plane = { ...p, id, o: [ox, oy, p.o[2]], u: [ux, uy, p.u[2]], v: [vx, vy, p.v[2]] };
  if (p.shy !== undefined) moved.shy = dir(m, p.shy[0], p.shy[1]);
  if (p.crop === true) {
    // A picture of the floor over a rectangle keeps its sides along x and y.
    const corners = [at(m, p.o[0], p.o[1]), at(m, p.o[0] + p.u[0], p.o[1] + p.u[1]), at(m, p.o[0] + p.v[0], p.o[1] + p.v[1]), at(m, p.o[0] + p.u[0] + p.v[0], p.o[1] + p.u[1] + p.v[1])];
    const [x0, x1] = [Math.min(...corners.map((c) => c[0])), Math.max(...corners.map((c) => c[0]))];
    const [y0, y1] = [Math.min(...corners.map((c) => c[1])), Math.max(...corners.map((c) => c[1]))];
    moved.o = [x0, y0, p.o[2]];
    moved.u = [x1 - x0, 0, 0];
    moved.v = [0, y1 - y0, 0];
  }
  return moved;
}

/** The surround of one area: four sides over the rectangle, each in pieces of at most `SURROUND_PIECE`, facing out from the area's middle (it gives way to a nearly level eye, as the glass of a rink does, but only then). */
function surround(id: string, r: Rect): Plane[] {
  const centre: [number, number] = [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2];
  const sides: [number, number, number, number][] = [[r.x0, r.y0, r.x1, r.y0], [r.x1, r.y0, r.x1, r.y1], [r.x1, r.y1, r.x0, r.y1], [r.x0, r.y1, r.x0, r.y0]];
  const planes: Plane[] = [];
  sides.forEach(([xa, ya, xb, yb], side) => {
    const long = Math.hypot(xb - xa, yb - ya);
    const pieces = Math.max(1, Math.ceil(long / SURROUND_PIECE));
    const rim = Math.min(0.3, SURROUND_HEIGHT * 0.12);
    for (let i = 0; i < pieces; i += 1) {
      const [t0, t1] = [i / pieces, (i + 1) / pieces];
      const run = long / pieces;
      const svg = `<rect width="${n(run)}" height="${n(SURROUND_HEIGHT)}" class="u-surround"/><rect width="${n(run)}" height="${n(rim)}" class="u-surround-rim"/>`;
      const p = wall(`${id}-${side + 1}-${i + 1}`, "surround", xa + (xb - xa) * t0, ya + (yb - ya) * t0, xa + (xb - xa) * t1, ya + (yb - ya) * t1, 0, SURROUND_HEIGHT, svg);
      planes.push({ ...shy(p, centre), fadeTo: 0.35, fadeAt: 0.85 });
    }
  });
  return planes;
}

/** A scoreboard that faces the eye: its panel (and where it is divided into the panels of the areas), hung on cables from over its top, or standing on legs. */
function board(id: string, cx: number, cy: number, wide: number, tall: number, bottom: number, extra: number, hung: boolean, cuts: string): Plane {
  const total = tall + extra;
  const top = hung ? extra : 0;
  const line = Math.max(0.12, wide * 0.008);
  const holds = hung
    ? `<path d="M${n(wide * 0.12)} 0V${n(extra)}M${n(wide * 0.88)} 0V${n(extra)}" class="u-sbline" fill="none" stroke-width="${n(line)}"/>`
    : `<path d="M${n(wide * 0.14)} ${n(tall)}V${n(total)}M${n(wide * 0.86)} ${n(tall)}V${n(total)}" class="u-sbline" fill="none" stroke-width="${n(line * 1.6)}"/>`;
  const panel = `<rect x="0" y="${n(top)}" width="${n(wide)}" height="${n(tall)}" rx="${n(wide * 0.02)}" class="u-sbframe"/>${cuts === "" ? "" : `<path d="${cuts}" transform="translate(0 ${n(top)})" class="u-sbline" fill="none" stroke-width="${n(line * 0.7)}"/>`}`;
  return { ...plane(id, "screen", [cx - wide / 2, cy, bottom + total], [wide, 0, 0], [0, 0, -total], `${holds}${panel}`), billboard: true };
}

/**
 * The viewpoints of a layout. Overhead, broadcast and the low corner are a single surface's (`TURN_PRESETS`); the end-on view of a net sport looks along its surfaces' length, where the nets are seen whole, as `NET_PRESETS` does. All are turned a quarter where
 * the floor or the surfaces stand across the picture, so that the long way of the floor runs across the screen. `floor` is the picture's frame (the hall's, turned if the hall asks) and `lengthAlongX` says whether the surfaces' length runs along its x.
 */
export function multiPresets(sport: Sport, floor: { w: number; h: number }, lengthAlongX: boolean): PresetTable {
  const portrait = floor.h > floor.w ? 90 : 0;
  const nets = isNetSport(sport);
  const end = nets ? NET_PRESETS.end : TURN_PRESETS.end;
  const along = nets ? (lengthAlongX ? 0 : 90) : portrait;
  return {
    overhead: { ...TURN_PRESETS.overhead, yaw: portrait },
    broadcast: { ...TURN_PRESETS.broadcast, yaw: wrap(TURN_PRESETS.broadcast.yaw + portrait) },
    end: { ...end, yaw: wrap(end.yaw + along) },
    corner: { ...TURN_PRESETS.corner, yaw: wrap(TURN_PRESETS.corner.yaw + portrait) },
  };
}

/**
 * A tournament layout as a 3D model: the floor is the layout's flat drawing, and on it stand each surface as it stands on its own page, the surrounds, the umpires' chairs and score tables, the scoreboards and, with `stadium`, the stands
 * of the hall. A `TurnModel` like any other: `turnMarkupOf` and `mountMultiTurn` make a view of it.
 */
export function buildMultiTurn(options: MultiOptions, settings: TurnSettings = {}): TurnModel {
  const wanted = settings.uprights;
  const upOptions: UprightOptions = wanted === false || wanted === true || wanted === undefined ? {} : wanted;
  const on = wanted !== false;
  const stadiumOn = settings.venue !== false && options.stadium !== undefined && options.stadium !== false;
  const drawn: MultiDrawing = multiDrawing(stadiumOn ? options : { ...options, stadium: undefined }, true, on);
  const { frame, title, description } = drawn;
  const layout = frame.layout;
  const spec = layout.spec;
  const language: Language = options.language === "ja" ? "ja" : "en";
  const id = settings.id ?? (typeof options.id === "string" && options.id !== "" ? `${options.id}-turn` : `ky-turn-${hash(JSON.stringify([options, settings.uprights, settings.preset, settings.venue]))}`);
  const only = upOptions.only;
  const keep = (kind: Upright["kind"]): boolean => only === undefined || only.includes(kind);
  const items: Upright[] = [];
  const toPicture = mapOf(frame.to);

  if (on) {
    // ---- Each surface, as it stands on its own page, moved to its cell. ----
    const common = { ...spec.surface, margin: 0, language } as SurfaceOptions;
    if (spec.kind === "cells") {
      const own = uprightsFor(common, { ...upOptions, venue: undefined, score: "floor" });
      const surfaceBox = outlineOf(spec.surface).box;
      for (const cell of layout.cells) {
        const into = mapOf((x, y) => frame.to(...(cell.turn ? ([cell.x + cell.w - y, cell.y + x] as const) : ([cell.x + x, cell.y + y] as const))));
        for (const item of own.items) {
          // The hall's floor under a table is the layout's own, so the planes that stood in for it are left behind.
          const planes = item.planes.filter((p) => p.kind !== "ground").map((p) => place(p, into, `c${cell.n}-${p.id}`));
          if (planes.length > 0) items.push({ ...item, id: `c${cell.n}-${item.id}`, at: at(into, item.at[0], item.at[1]), planes });
        }
      }
      // A surface that stands over the floor (a table's top) is a plane of its own, with the surface's own drawing on it.
      for (const lifted of drawn.lifted) {
        const local = flat("table-top", "table", 0, 0, surfaceBox.w, surfaceBox.h, lifted.lift, `<g transform="translate(${n(-lifted.box.x)} ${n(-lifted.box.y)})">${lifted.body}</g>`);
        const into = mapOf((x, y) => frame.to(...(lifted.cell.turn ? ([lifted.cell.x + lifted.cell.w - y, lifted.cell.y + x] as const) : ([lifted.cell.x + x, lifted.cell.y + y] as const))));
        items.push({ id: `c${lifted.cell.n}-table-top`, kind: "table-legs", at: at(into, surfaceBox.w / 2, surfaceBox.h / 2), height: lifted.lift, planes: [place(local, into, `c${lifted.cell.n}-table-top`)] });
      }
    }

    // ---- What only a layout has. ----
    const parts = spec.parts;
    const layoutPlanes = (ps: Plane[]): Plane[] => ps.map((p) => place(p, toPicture, p.id));
    if (parts.barriers === true && upOptions.boards !== false && keep("surrounds")) {
      const planes = layout.cells.flatMap((c) => surround(`c${c.n}-surround`, { x0: c.bay.x + 0.5, y0: c.bay.y + 0.5, x1: c.bay.x + c.bay.w - 0.5, y1: c.bay.y + c.bay.h - 0.5 }));
      items.push({ id: "surrounds", kind: "surrounds", at: at(toPicture, layout.floor.w / 2, layout.floor.h / 2), height: SURROUND_HEIGHT, planes: layoutPlanes(planes) });
    }
    if (parts.officials === true && keep("officials")) {
      const planes: Plane[] = [];
      for (const c of layout.cells) planes.push(...officialsOf(c));
      items.push({ id: "officials", kind: "officials", at: at(toPicture, layout.floor.w / 2, layout.floor.h / 2), height: DESK, planes: layoutPlanes(planes) });
    }
    if (keep("scoreboard")) {
      const boards: Plane[] = [];
      if (parts.scoreboard === "each") for (const c of layout.cells) boards.push(board(`c${c.n}-scoreboard`, c.x + c.w / 2, c.y + c.h + 1.9, 4, STANDING.tall, 0, STANDING.legs, false, ""));
      const sb = layout.shared;
      if (sb !== undefined) {
        const count = layout.cells.length;
        const cols = count <= 4 ? Math.min(2, count) : count;
        const rows = count <= 4 && count > 2 ? 2 : 1;
        let cuts = "";
        for (let i = 1; i < cols; i += 1) cuts += `M${n((sb.w * i) / cols)} 0v${n(sb.h)}`;
        for (let j = 1; j < rows; j += 1) cuts += `M0 ${n((sb.h * j) / rows)}h${n(sb.w)}`;
        boards.push(board("scoreboard", sb.x + sb.w / 2, sb.y + sb.h / 2, sb.w, sb.h, HUNG.bottom, HUNG.cables, true, cuts));
      }
      if (boards.length > 0) items.push({ id: "scoreboard", kind: "scoreboard", at: at(toPicture, layout.floor.w / 2, layout.floor.h / 2), height: parts.scoreboard === "shared" ? HUNG.bottom : STANDING.legs, planes: layoutPlanes(boards) });
    }
  }

  // ---- The stands of the stadium round the hall, in the picture's own frame. ----
  let defs = "";
  let crowdStyle = "";
  if (drawn.stands !== undefined && keep("stands")) {
    const roof = typeof settings.venue === "object" && settings.venue.roof !== undefined ? settings.venue.roof : typeof options.stadium === "object" && options.stadium.roof === true;
    const venue = standsVenueOf(drawn.stands.stands, drawn.stands.crowd, { sport: drawn.stands.standsLike as Sport }, { fill: true, ...(typeof settings.venue === "object" ? settings.venue : {}), roof, id, noCentre: true }, 0);
    items.push(...venue.items.filter((item) => item.kind !== "roof" || roof));
    defs = venue.defs;
    crowdStyle = "--ky-cr-home:#8b94a3;--ky-cr-away:#8b94a3";
  }

  // ---- The model. ----
  const uprights: Uprights = { items, lift: 0, thin: thinnest(drawn.view.w, drawn.view.h), area: { x0: drawn.view.x, y0: drawn.view.y, x1: drawn.view.x + drawn.view.w, y1: drawn.view.y + drawn.view.h }, whole: true, ...(defs === "" ? {} : { defs }) };
  const planes = planesOf(uprights);
  const scale = 1400 / Math.max(drawn.view.w, drawn.view.h);
  const centre: [number, number] = [drawn.view.x + drawn.view.w / 2, drawn.view.y + drawn.view.h / 2];
  const box3 = sceneBox(planes, uprights.area!, 0, centre, scale);
  const look = /^<svg[^>]* data-look="([^"]*)"/.exec(drawn.svg)?.[1];
  const surfaceLike = { sport: spec.sport, language, ...(options.theme === undefined ? {} : { theme: options.theme }), ...(options.style === undefined ? {} : { style: options.style }) } as SurfaceOptions;
  const standing = describeUprights(surfaceLike, uprights, language);
  const first = layout.cells[0];
  const presets = multiPresets(spec.sport, { w: frame.lw, h: frame.lh }, first === undefined || first.turn === frame.turned);
  return {
    id,
    language,
    options: surfaceLike,
    title,
    description: standing === "" ? description : `${description}${language === "ja" ? "" : " "}${standing}`,
    standing,
    floor: drawn.svg,
    viewBox: { x: drawn.view.x, y: drawn.view.y, w: drawn.view.w, h: drawn.view.h },
    scale,
    uprights,
    defs,
    crowdStyle,
    venue: drawn.stands !== undefined,
    look: { sport: spec.sport, look: look ?? "plain" },
    planes,
    box: box3,
    centre,
    view: openingView(settings, presets),
    turnable: true,
    presets,
    flat: multiDrawing(options, false).svg,
  };
}

/** The umpire's chair and the score table beside a surface, where the flat drawing has them (feet, in the layout's frame). */
function officialsOf(c: MultiCell): Plane[] {
  if (c.turn) {
    // Beside the net, on the right of a surface that stands across the layout.
    const cy = c.y + c.h / 2;
    return [...box(`c${c.n}-chair`, "chair", rect(c.x + c.w + 1.8, cy - 3.2, 1.6, 1.6), CHAIR, "u-chair"), ...box(`c${c.n}-desk`, "desk", rect(c.x + c.w + 1.5, cy - 0.8, 1.1, 3.6), DESK, "u-chair")];
  }
  const cx = c.x + c.w / 2;
  return [...box(`c${c.n}-chair`, "chair", rect(cx + 1.6, c.y - 3.4, 1.6, 1.6), CHAIR, "u-chair"), ...box(`c${c.n}-desk`, "desk", rect(cx - 5, c.y - 3.1, 3.6, 1.1), DESK, "u-chair")];
}

/**
 * Mount a tournament layout as a 3D view in a container: the same view as `mountKyogijoTurn`'s, with the controls, the pointer, the keys and the auto-turn of every 3D view, over the layout's floor with each surface standing on it.
 * @example
 * ```ts no-run
 * import { mountMultiTurn } from "@johnmorrisdotca/kyogijo-stadiums/multi";
 * const view = mountMultiTurn(document.querySelector("#hall")!, { preset: "tabletennis-4", stadium: true }, { preset: "broadcast" });
 * view.set({ yaw: 40 });
 * ```
 */
export function mountMultiTurn(host: HTMLElement, options: MultiOptions, settings: TurnSettings = {}): KyogijoTurn<MultiOptions> {
  return mountTurn(host, options, settings, buildMultiTurn);
}

/** A tournament layout as the markup of a 3D view, still until a page's script makes it turn: pure, so a server can make it. */
export function multiTurnMarkup(options: MultiOptions, settings: TurnSettings = {}): string {
  return turnMarkupOf(buildMultiTurn(options, settings), settings);
}
