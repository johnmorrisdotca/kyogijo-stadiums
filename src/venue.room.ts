// The room round a budō surface, raised from `dojoRoom()`: the walls of a dojo with the doors and windows in them, the raised seat of honour (the kamiza's dais), the banner, the shrine, the balconies with their
// rows of seats and their rails, and the edge of the mats, a few centimetres over the floor. The sumo dohyō's mound is the budō uprights' own (from the plan's data). Metres in the room's data, feet here.
import { densityOf, resolveCrowd } from "./crowd.ts";
import { patterns } from "./crowd.draw.ts";
import { dojoRoom, type DojoRoom, type RoomBalcony, type RoomOpening, type RoomWall } from "./budo/room.ts";
import { NO_VENUE, type Venue, type VenueBuild } from "./venue.ts";
import { flat, n, plane, shy as shyOf, wall, type Plane, type Upright } from "./turn.kit.ts";
import type { Pt } from "./crowd.ts";
import type { MBox } from "./budo/parts.ts";
import type { SurfaceOptions } from "./types.ts";

const K = 1 / 0.3048;

/** The height of the wood on a dojo's walls, in metres (ours: no source gives it). */
export const WAINSCOT = 0.9;



/** How far a gallery's floor slab projects in front of the first row beyond the wall's own thickness, and how thick it is, in metres (ours). */
export const SLAB_PROJECTION = 0.5;
export const SLAB = 0.35;

/**
 * The tile of the gallery's seats: one seat wide and one row deep, a cushion at the front and its back behind it, read by every tread. A seat is as wide as the side's seats make it (`RoomBalcony.seatWidth`).
 * The blocks of seats come from `seatBlocks`.
 */
const seatTile = (id: string, width: number, row: number): string => `<pattern id="${id}-seat" width="${n(width)}" height="${n(row)}" patternUnits="userSpaceOnUse"><rect class="u-seatcush" x="${n(width * 0.1)}" y="${n(row * 0.1)}" width="${n(width * 0.8)}" height="${n(row * 0.55)}" rx=".2"/><rect class="u-seatback" x="${n(width * 0.1)}" y="${n(row * 0.72)}" width="${n(width * 0.8)}" height="${n(row * 0.2)}" rx=".12"/></pattern>`;

/** The blocks of seats along a row as one path of rectangles, and the aisles between them as another, from the balcony's own sections and seat width. Feet along the row, `row` deep. */
function seatBlocks(b: RoomBalcony, row: number): { seats: string; aisles: string; pieces: [number, number][] } {
  const w = b.seatWidth * K;
  const aisle = b.aisle * K;
  let x = 0;
  let seats = "";
  let aisles = "";
  const pieces: [number, number][] = [];
  b.sections.forEach((k, i) => {
    seats += `M${n(x)} 0h${n(k * w)}v${n(row)}h${n(-k * w)}Z`;
    x += k * w;
    if (i < b.sections.length - 1) {
      aisles += `M${n(x)} 0h${n(aisle)}v${n(row)}h${n(-aisle)}Z`;
      pieces.push([x, aisle]);
      x += aisle;
    }
  });
  return { seats, aisles, pieces };
}

/** The thinnest a mat's edge is drawn, in feet, so that the 5 cm of a competition mat does not vanish on a large floor. */
const LEAST_EDGE = 0.12;

/** A plane of the room that gives way to the eye: down to a hundredth, because the gallery's steps and its walls lie over one another on the screen and would add up to a veil. */
const shy = (p: Plane, centre: readonly [number, number]): Plane => ({ ...shyOf(p, centre), fadeTo: 0.01 });

const box = (b: MBox): [number, number, number, number] => [b.x0 * K, b.y0 * K, b.x1 * K, b.y1 * K];

/** The planes of a box standing on the floor: four sides and a top, in feet. */
function block(id: string, kind: Plane["kind"], b: MBox, z0: number, z1: number, side: string, top: string, centre: readonly [number, number]): Plane[] {
  const [x0, y0, x1, y1] = box(b);
  const edge = (a: number, b2: number, c: number, d: number, i: number): Plane => shy(wall(`${id}-${i}`, kind, a, b2, c, d, z0, z1, `<rect class="${side}" width="${n(Math.hypot(c - a, d - b2))}" height="${n(z1 - z0)}"/>`), centre);
  return [edge(x0, y0, x1, y0, 1), edge(x1, y0, x1, y1, 2), edge(x1, y1, x0, y1, 3), edge(x0, y1, x0, y0, 4), flat(`${id}-top`, kind, x0, y0, x1, y1, z1, `<rect class="${top}" width="${n(x1 - x0)}" height="${n(y1 - y0)}"/>`)];
}

/** A wall of the room with its doors and windows drawn on it. */
function wallPlane(w: RoomWall, openings: readonly { o: RoomOpening; kind: "door" | "window" }[], centre: readonly [number, number], room: DojoRoom): Plane | undefined {
  if (w.height === undefined || w.thickness === 0) return undefined;
  const [ax, ay] = [w.from[0] * K, w.from[1] * K];
  const [bx, by] = [w.to[0] * K, w.to[1] * K];
  const long = Math.hypot(bx - ax, by - ay);
  const dx = (bx - ax) / long;
  const dy = (by - ay) / long;
  const H = w.height * K;
  // A dojo with a gallery has honey wood panelling the whole height of its walls, up to the gallery's floor (boards a metre or so wide, ours); one without has a cream wall over a wainscot of wood a belt high.
  const panelled = room.balconies.length > 0;
  const band = panelled ? H : Math.min(WAINSCOT * K, H);
  let svg = panelled ? `<rect class="u-wainscot" width="${n(long)}" height="${n(H)}"/>` : `<rect class="u-room" width="${n(long)}" height="${n(H)}"/><rect class="u-wainscot" y="${n(H - band)}" width="${n(long)}" height="${n(band)}"/><path class="u-wainline" fill="none" d="M0 ${n(H - band)}H${n(long)}"/>`;
  if (panelled) {
    let seams = "";
    for (let at = 1.2 * K; at < long; at += 1.2 * K) seams += `M${n(at)} 0V${n(H)}`;
    svg += `<path class="u-panel" fill="none" d="${seams}"/>`;
  }
  // The kamiza: on its wall a recessed alcove of darker wood with a white-framed shrine and a hanging scroll in it, a tall purple banner (plain) beside it; the dark banner of the room's data stands in front (ours).
  const kamiza = room.banners.find((m) => m.wall === w.side);
  if (panelled && kamiza !== undefined) {
    const [bx0, by0, bx1, by1] = box(kamiza.box);
    const centreAt = ((bx0 + bx1) / 2 - ax) * dx + ((by0 + by1) / 2 - ay) * dy;
    const z = (m: number): number => H - m * K;
    const m2 = K;
    svg += `<rect class="u-alcove" x="${n(centreAt - 2.2 * m2)}" y="${n(z(3.4))}" width="${n(4.4 * m2)}" height="${n(3.2 * m2)}"/><path class="u-frame" fill="none" d="M${n(centreAt - 2.2 * m2)} ${n(z(0.2))}V${n(z(3.4))}H${n(centreAt + 2.2 * m2)}V${n(z(0.2))}"/>`;
    svg += `<rect class="u-shrinef" x="${n(centreAt - 1.7 * m2)}" y="${n(z(1.9))}" width="${n(1.1 * m2)}" height="${n(0.9 * m2)}"/><rect class="u-scroll" x="${n(centreAt + 0.9 * m2)}" y="${n(z(2.9))}" width="${n(0.55 * m2)}" height="${n(1.5 * m2)}"/>`;
    svg += `<rect class="u-purple" x="${n(centreAt + 2.9 * m2)}" y="${n(z(3.5))}" width="${n(0.9 * m2)}" height="${n(2.7 * m2)}"/>`;
  }
  for (const { o, kind } of openings) {
    if (o.wall !== w.side) continue;
    const [x0, y0, x1, y1] = box(o.box);
    const s = [(x0 - ax) * dx + (y0 - ay) * dy, (x1 - ax) * dx + (y1 - ay) * dy].sort((p, q) => p - q);
    const top = H - o.head * K;
    const height = (o.head - o.sill) * K;
    const width = s[1] - s[0];
    svg += `<rect class="u-${kind}" x="${n(s[0])}" y="${n(top)}" width="${n(width)}" height="${n(height)}"/>`;
    // A door has a leaf's panels; a window its sash, a cross.
    svg += kind === "window" ? `<path class="u-sash" fill="none" d="M${n(s[0] + width / 2)} ${n(top)}v${n(height)}M${n(s[0])} ${n(top + height / 2)}h${n(width)}"/>` : `<path class="u-sash" fill="none" d="M${n(s[0] + width / 2)} ${n(top)}v${n(height)}"/>`;
  }
  return shy(wall(`wall-${w.side}`, "wall", ax, ay, bx, by, 0, H, svg), centre);
}

/** The banner on the kamiza's wall: a plain dark band, drawn on its own plane in front of the wall's inner face. */
function bannerPlane(room: DojoRoom, centre: readonly [number, number]): Plane[] {
  return room.banners.map((b) => {
    const [x0, y0, x1, y1] = box(b.box);
    const alongX = x1 - x0 >= y1 - y0;
    // The face of the banner's footprint that is nearest the room.
    const face = b.wall === "north" ? y1 : b.wall === "south" ? y0 : b.wall === "west" ? x1 : x0;
    const [ax, ay, bx, by] = alongX ? [x0, face, x1, face] : [face, y0, face, y1];
    const long = Math.hypot(bx - ax, by - ay);
    const h = (b.top - b.bottom) * K;
    return shy(wall(b.id, "banner", ax, ay, bx, by, b.bottom * K, b.top * K, `<rect class="u-banner" width="${n(long)}" height="${n(h)}"/><path class="u-bannerline" fill="none" d="M${n(long * 0.08)} ${n(h * 0.06)}H${n(long * 0.92)}M${n(long * 0.08)} ${n(h * 0.94)}H${n(long * 0.92)}"/>`), centre);
  });
}

/**
 * One balcony: its rows of seats as steps (a tread of seats and a riser to each row, the first row a step over the gallery's floor and the last at the height the gallery's data gives), a rail along its front
 * edge, and a wall behind the last row. The room's wall stays below the gallery's floor: the gallery overlooks the floor over it.
 */
function balconyPlanes(b: RoomBalcony, pid: string, people: boolean, centre: readonly [number, number], room: DojoRoom): Plane[] {
  const [x0, y0, x1, y1] = box(b.box);
  // The direction away from the room, and the front edge of the balcony: the line along it nearest the room.
  const out: Pt = b.side === "north" ? [0, -1] : b.side === "south" ? [0, 1] : b.side === "west" ? [-1, 0] : [1, 0];
  const front: [Pt, Pt] = b.side === "north" ? [[x0, y1], [x1, y1]] : b.side === "south" ? [[x0, y0], [x1, y0]] : b.side === "west" ? [[x1, y0], [x1, y1]] : [[x0, y0], [x0, y1]];
  const at = (offset: number): [Pt, Pt] => [[front[0][0] + out[0] * offset, front[0][1] + out[1] * offset], [front[1][0] + out[0] * offset, front[1][1] + out[1] * offset]];
  const floor = b.height * K;
  const rise = b.rowRise * K;
  const row = (b.box.x1 - b.box.x0 > b.box.y1 - b.box.y0 ? b.box.y1 - b.box.y0 : b.box.x1 - b.box.x0) * K / b.rows;
  const planes: Plane[] = [];
  const long = Math.hypot(front[1][0] - front[0][0], front[1][1] - front[0][1]);
  for (let r = 0; r < b.rows; r += 1) {
    const [a, c] = at(r * row);
    const [d] = at((r + 1) * row);
    const z = floor + (r + 1) * rise;
    // The tread: a dark floor with the aisles across it in lighter wood and the blocks of seats between them, flat at the row's height. The riser under its front edge is dark too, with the stairs of the aisles in lighter wood.
    const blocks = seatBlocks(b, row);
    const tread = plane(`gallery-${b.side}-${r + 1}`, "seats", [a[0], a[1], z], [c[0] - a[0], c[1] - a[1], 0], [d[0] - a[0], d[1] - a[1], 0], `<rect class="u-gbed" width="${n(long)}" height="${n(row)}"/><path class="u-aisle" d="${blocks.aisles}"/><path fill="url(#${pid}-${b.side}-seat)" d="${blocks.seats}"/>${people ? `<path fill="url(#${pid}-cr-h)" d="${blocks.seats}"/>` : ""}`);
    planes.push({ ...tread, shy: out, fadeTo: 0.01 });
    const stairs = blocks.pieces.map(([x, w]) => `M${n(x)} 0h${n(w)}v${n(rise)}h${n(-w)}Z`).join("");
    planes.push(shy(wall(`gallery-${b.side}-riser-${r + 1}`, "fascia", a[0], a[1], c[0], c[1], z - rise, z, `<rect class="u-gbed u-riser" width="${n(long)}" height="${n(rise)}"/><path class="u-aisle u-stair" d="${stairs}"/>`), centre));
  }
  // The floor slab projects from the wall over the room: its edge is a wall's thickness and half a metre in front of the first row, with a band of its thickness under it, and the rail stands on that edge.
  const wallT = room.walls[0]?.thickness ?? 0.3;
  const reach = (wallT + SLAB_PROJECTION) * K;
  const [fa, fc] = at(-reach);
  const slabT = SLAB * K;
  planes.push({ ...plane(`gallery-${b.side}-slab`, "platform", [fa[0], fa[1], floor], [fc[0] - fa[0], fc[1] - fa[1], 0], [front[0][0] - fa[0], front[0][1] - fa[1], 0], `<rect class="u-slab" width="${n(long)}" height="${n(reach)}"/>`), shy: out, fadeTo: 0.01 });
  planes.push(shy(wall(`gallery-${b.side}-slab-edge`, "fascia", fa[0], fa[1], fc[0], fc[1], floor - slabT, floor, `<rect class="u-slabedge" width="${n(long)}" height="${n(slabT)}"/>`), centre));
  // The rail along the slab's edge, white: a top bar and posts about every half metre.
  const rail = b.rail * K;
  let posts = "";
  for (let s2 = 0; s2 <= long + 0.01; s2 += (1 / 0.3048) / 2) posts += `M${n(Math.min(s2, long))} 0V${n(rail)}`;
  planes.push(shy(wall(`rail-${b.side}`, "rail", fa[0], fa[1], fc[0], fc[1], floor, floor + rail, `<path class="u-railline" fill="none" d="M0 0H${n(long)}M0 ${n(rail / 2)}H${n(long)}${posts}"/>`), centre));
  // The wall behind the last row, up to the ceiling, with the large windows high in it on the side that has them.
  const [e0, e1] = at(b.rows * row);
  const top = room.ceiling === undefined ? floor + b.rows * rise + rail : room.ceiling.height * K;
  // Plain off-white above the seats; on the kamiza's side a round clock at the middle and a door at each end, high in the wall (ours).
  let back = `<rect class="u-room" width="${n(long)}" height="${n(top)}"/>`;
  if (room.banners.some((m) => m.wall === b.side)) {
    const seatsTop = floor + b.rows * rise + rail;
    const cr = 0.6 * K;
    const cy = top - (room.ceiling === undefined ? 1.6 : 2.2) * K;
    back += `<circle class="u-clockface" cx="${n(long / 2)}" cy="${n(cy)}" r="${n(cr)}"/><path class="u-clockhands" fill="none" d="M${n(long / 2)} ${n(cy)}v${n(-cr * 0.7)}M${n(long / 2)} ${n(cy)}l${n(cr * 0.45)} ${n(cr * 0.2)}"/>`;
    for (const at of [long * 0.06, long * 0.94 - 1.8 * K]) back += `<rect class="u-door" x="${n(at)}" y="${n(top - seatsTop > 0 ? top - (seatsTop + 0.4 * K + 2.1 * K) : 0)}" width="${n(1.8 * K)}" height="${n(2.1 * K)}"/>`;
  }
  for (const w of room.upperWindows) {
    if (w.side !== b.side) continue;
    // The stretch along the wall is measured from the balcony's start, which is the wall's start side of the box.
    const s0 = w.from * K;
    const s1 = w.to * K;
    back += `<rect class="u-window" x="${n(s0)}" y="${n(top - w.head * K)}" width="${n(s1 - s0)}" height="${n((w.head - w.sill) * K)}"/><path class="u-sash" fill="none" d="M${n((s0 + s1) / 2)} ${n(top - w.head * K)}v${n((w.head - w.sill) * K)}M${n(s0)} ${n(top - ((w.head + w.sill) / 2) * K)}h${n(s1 - s0)}"/>`;
  }
  planes.push(shy(wall(`gallery-back-${b.side}`, "fascia", e0[0], e0[1], e1[0], e1[1], 0, top, back), centre));
  return planes;
}

/** The raised parts of a budō surface's room: what `dojoRoom()` says, for the options. An empty venue for a surface with no room. */
export function roomVenue(o: SurfaceOptions, v: VenueBuild, lift: number): Venue {
  const room = dojoRoom(o);
  if (room === undefined) return NO_VENUE;
  const centre: readonly [number, number] = [((room.floor.x0 + room.floor.x1) / 2) * K, ((room.floor.y0 + room.floor.y1) / 2) * K];
  const items: Upright[] = [];
  let defs = "";

  // Walls with their openings.
  const openings = [...room.doors.map((o2) => ({ o: o2, kind: "door" as const })), ...room.windows.map((o2) => ({ o: o2, kind: "window" as const }))];
  const walls = room.walls.flatMap((w) => wallPlane(w, openings, centre, room) ?? []);
  if (walls.length > 0) items.push({ id: "walls", kind: "walls", at: centre, height: Math.max(...room.walls.map((w) => (w.height ?? 0) * K)), planes: walls });

  // The seat of honour's dais, the banner and the shrine.
  for (const p of room.platforms) {
    if (p.id !== "dais") continue;
    items.push({ id: "dais", kind: "dais", at: [((p.box.x0 + p.box.x1) / 2) * K, ((p.box.y0 + p.box.y1) / 2) * K], height: p.height * K, planes: block("dais", "platform", p.box, 0, p.height * K, "u-dais-side", "u-dais", centre) });
  }
  if (room.banners.length > 0) items.push({ id: "banner", kind: "banner", at: centre, height: Math.max(...room.banners.map((b) => b.top)) * K, planes: bannerPlane(room, centre) });
  if (room.shrine !== undefined) items.push({ id: "shrine", kind: "shrine", at: [((room.shrine.box.x0 + room.shrine.box.x1) / 2) * K, ((room.shrine.box.y0 + room.shrine.box.y1) / 2) * K], height: room.shrine.height * K, planes: block("shrine", "shrine", room.shrine.box, 0, room.shrine.height * K, "u-shrine-side", "u-shrine", centre) });

  // The balconies, with the crowd of the drawing in them (a few people when it has one, the empty seats when it has none).
  if (room.balconies.length > 0) {
    const crowd = resolveCrowd(o.crowd);
    const fine = (crowd === undefined || crowd.detail !== "plain") && o.detail !== "simple";
    const own = crowd ?? resolveCrowd(true)!;
    // The seats at a seat's 2 by 2.3 feet; a gallery is empty unless the options say how full.
    const seats = room.balconies.reduce((sum, b) => sum + ((b.box.x1 - b.box.x0) * (b.box.y1 - b.box.y0) * K * K) / 4.6, 0);
    const density = crowd === undefined ? 0 : crowd.density !== undefined || crowd.attendance !== undefined ? densityOf(own, seats, undefined) : 0;
    const pid = `${v.id}-v`;
    for (const bal of room.balconies) defs += seatTile(`${pid}-${bal.side}`, bal.seatWidth * K, bal.rowDepth * K);
    if (fine && density > 0) defs += patterns(pid, own, density, undefined, true, true);
    const planes = room.balconies.flatMap((b) => balconyPlanes(b, pid, density > 0 && fine, centre, room));
    const top = Math.max(...room.balconies.map((b) => (b.height + b.rows * b.rowRise) * K));
    items.push({ id: "gallery", kind: "gallery", at: centre, height: top, planes });
    // A pale ceiling over the galleries when a roof is asked for: a strip over each, open over the floor so that the floor is never hidden.
    if (v.roof === true && room.ceiling !== undefined) {
      const z = room.ceiling.height * K;
      // A pale grey band, with a box light every 6 m or so along it.
      const ceiling = room.balconies.map((b) => {
        const w = (b.box.x1 - b.box.x0) * K;
        const h = (b.box.y1 - b.box.y0) * K;
        const alongX = w >= h;
        const long = alongX ? w : h;
        const wide = alongX ? h : w;
        let lights = "";
        for (let at = 3 * K; at < long - 2 * K; at += 6 * K) lights += alongX ? `<rect class="u-light" x="${n(at)}" y="${n(wide * 0.3)}" width="${n(1.2 * K)}" height="${n(wide * 0.4)}"/>` : `<rect class="u-light" x="${n(wide * 0.3)}" y="${n(at)}" width="${n(wide * 0.4)}" height="${n(1.2 * K)}"/>`;
        return shy(flat(`ceiling-${b.side}`, "roof", ...box(b.box), z, `<rect class="u-ceiling" width="${n(w)}" height="${n(h)}"/>${lights}`), centre);
      });
      items.push({ id: "roof", kind: "roof", at: centre, height: z, planes: ceiling });
    }
  }

  // The edge of the mats: they stand a few centimetres over the floor round them (the IJF's 5 cm), so that their thickness shows at the outer edge.
  if (room.mats !== undefined) {
    const m = room.surround?.inner ?? room.floor;
    const t = Math.max(room.mats.thickness * K, LEAST_EDGE);
    const [x0, y0, x1, y1] = box(m);
    const side = room.mats.edge === "rounded" ? "u-matedge u-rounded" : "u-matedge";
    const edge = (a: number, b: number, c: number, d: number, i: number): Plane => shy(wall(`mat-edge-${i}`, "matedge", a, b, c, d, lift - t, lift, `<rect class="${side}" width="${n(Math.hypot(c - a, d - b))}" height="${n(t)}"/>`), centre);
    items.push({ id: "mat-edge", kind: "mat-edge", at: centre, height: room.mats.thickness * K, planes: [edge(x0, y0, x1, y0, 1), edge(x1, y0, x1, y1, 2), edge(x1, y1, x0, y1, 3), edge(x0, y1, x0, y0, 4)] });
  }
  // The ground the balconies stand on: how far they reach beyond the floor.
  const f = room.floor;
  const reach = room.balconies.reduce((most, b) => Math.max(most, f.x0 - b.box.x0, f.y0 - b.box.y0, b.box.x1 - f.x1, b.box.y1 - f.y1), 0) * K;
  return { items, defs, reach: reach > 0 ? reach + 3 : 0 };
}
