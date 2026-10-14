// What stands on the courts of the net sports that came after the first five: the walls and fence of a padel court, the walls of a squash court and of a racquetball court,
// the net of sepak takraw, a teqball table with its net, a roundnet set, and the goalposts of netball. The heights are the rulebooks' own (docs/sources.md, "Heights in the 3D
// view"); what a rulebook leaves to the maker (a mesh's cell, the thickness of a bar) is ours and said so there.
import type { Band, CourtGeometry, CourtPlan } from "./court.ts";
import type { NetballFigures, PadelFigures, RacquetballFigures, RoundnetFigures, SepakTakrawFigures, SquashFigures, TeqballFigures } from "./leagues/courts.ts";
import { bar, mesh, n, plane, pole, polygon, shy, threads, wall, type Plane, type Upright } from "./turn.kit.ts";
import { netPlane, sag, tableBody } from "./uprights.netkit.ts";
import type { NetEnd } from "./uprights.net.ts";
import { convertLength } from "./units.ts";

const feet = (metres: number): number => convertLength(metres, "m", "ft");

/** The walls of a court, each giving way when it is between the eye and the court. */
const shyAll = (planes: Plane[], geo: CourtGeometry): Plane[] => planes.map((p) => shy(p, [geo.length / 2, geo.width / 2]));

/** The posts of a court at the fixtures' places, `height` high. */
const postsOf = (geo: CourtGeometry, x: number, y0: number, y1: number, height: number, thin: number): Upright => ({
  id: "posts",
  kind: "netposts",
  at: [x, (y0 + y1) / 2],
  height,
  planes: geo.posts.flatMap((p, i) => pole(`post-${i === 0 ? "a" : "b"}`, "post", p.x, p.y, 0, height, Math.max(p.size, thin * 1.4), "u-pole")),
});

/** The line a wall stands on: the inner edge of the band that stands for it, from end to end of the court's side. */
function standsOn(band: Band, L: number, W: number): readonly [number, number, number, number] {
  const [a, b, c, d] = band.rect;
  if (c - a < d - b) {
    const x = c <= L / 2 ? c : a;
    return [x, Math.max(b, 0), x, Math.min(d, W)];
  }
  const y = d <= W / 2 ? d : b;
  return [Math.max(a, 0), y, Math.min(c, L), y];
}

/** A solid or glass wall between two heights along a line, with a cap along its top. */
function solidWall(id: string, x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, cls: string, thin: number): Plane {
  const run = Math.hypot(x1 - x0, y1 - y0);
  return wall(id, "wall", x0, y0, x1, y1, z0, z1, `<rect width="${n(run)}" height="${n(z1 - z0)}" class="${cls}"/><rect width="${n(run)}" height="${n(Math.max(thin * 0.8, 0.1))}" class="u-cap"/>`);
}

/** Metal fence between two heights: a mesh. */
function fencing(id: string, x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, cell: number): Plane {
  const run = Math.hypot(x1 - x0, y1 - y0);
  const h = z1 - z0;
  return wall(id, "wall", x0, y0, x1, y1, z0, z1, `<rect width="${n(run)}" height="${n(h)}" class="u-netfill"/>${threads(mesh(run, h, cell), cell)}`);
}

/**
 * A padel court's enclosure (The Court: Enclosures): the end walls 3 m of wall with 1 m of metal fence over them, 4 m in all; at each end of each side a wall 3 m high and
 * 4 m long, and the fence between. The part of the Rules read gives the fence along the sides no height of its own: it is drawn as high as the side walls, 3 m (ours).
 */
function padelWalls(f: PadelFigures, geo: CourtGeometry, thin: number): Upright {
  const { length: L, width: W } = geo;
  const cell = Math.max(feet(0.045), thin * 5);
  const planes: Plane[] = [];
  geo.bands.forEach((band, i) => {
    const [x0, y0, x1, y1] = standsOn(band, L, W);
    if (Math.hypot(x1 - x0, y1 - y0) <= 0) return;
    if (band.kind === "mesh") planes.push(fencing(`fence-${i}`, x0, y0, x1, y1, 0, f.enclosure.sideHeight, cell));
    else if (x0 === x1) planes.push(solidWall(`wall-${i}`, x0, y0, x1, y1, 0, f.enclosure.endWall, "u-glass", thin), fencing(`fence-${i}`, x0, y0, x1, y1, f.enclosure.endWall, f.enclosure.endHeight, cell));
    else planes.push(solidWall(`wall-${i}`, x0, y0, x1, y1, 0, f.enclosure.sideHeight, "u-glass", thin));
  });
  return { id: "walls", kind: "walls", at: [L / 2, W / 2], height: f.enclosure.endHeight, planes: shyAll(planes, geo) };
}

/**
 * A squash court's walls, up to their out lines: the front wall to the front wall line (4.57 m), the back wall to the back wall line (2.13 m), and each side wall between
 * them, its top running straight from the one to the other (only its two ends are among the figures; the straight line is ours). The front wall is solid, the rest glass.
 */
function squashWalls(f: SquashFigures, geo: CourtGeometry, thin: number): Upright {
  const { length: L, width: W } = geo;
  const front = f.wall.frontWallLine;
  const back = f.wall.backWallLine;
  const planes: Plane[] = [solidWall("wall-front", 0, 0, 0, W, 0, front, "u-wall", thin), solidWall("wall-back", L, 0, L, W, 0, back, "u-glass", thin)];
  const side = polygon([[0, 0], [L, front - back], [L, front], [0, front]]);
  for (const [id, y] of [["wall-side-a", 0], ["wall-side-b", W]] as const) planes.push(wall(id, "wall", 0, y, L, y, 0, front, `<path d="${side}" class="u-glass"/>`));
  return { id: "walls", kind: "walls", at: [L / 2, W / 2], height: front, planes: shyAll(planes, geo) };
}

/** A racquetball court's walls, 20 feet high all round (Rule 2.1(a): the court is 20 feet high, the back wall at least 12), the front wall solid and the others glass. */
function racquetballWalls(f: RacquetballFigures, geo: CourtGeometry, thin: number): Upright {
  const { length: L, width: W } = geo;
  const h = f.height;
  const planes: Plane[] = [
    solidWall("wall-front", 0, 0, 0, W, 0, h, "u-wall", thin),
    solidWall("wall-back", L, 0, L, W, 0, h, "u-glass", thin),
    solidWall("wall-side-a", 0, 0, L, 0, 0, h, "u-glass", thin),
    solidWall("wall-side-b", 0, W, L, W, 0, h, "u-glass", thin),
  ];
  return { id: "walls", kind: "walls", at: [L / 2, W / 2], height: h, planes: shyAll(planes, geo) };
}

/** A roundnet set: a net stretched in a ring 91.4 cm across, its rim 20.3 cm over the ground, on four legs (Rule 1.1.2). */
function roundnetSet(f: RoundnetFigures, geo: CourtGeometry, thin: number): Upright {
  const solid = geo.solids.find((one) => one.kind === "set");
  const cx = solid?.kind === "set" ? solid.cx : geo.length / 2;
  const cy = solid?.kind === "set" ? solid.cy : geo.width / 2;
  const r = f.set.diameter / 2;
  const h = f.set.height;
  const rim = Math.max(feet(0.02), thin * 1.5);
  const ring = (rr: number): string => `M${n(r - rr)} ${n(r)}a${n(rr)} ${n(rr)} 0 1 0 ${n(2 * rr)} 0a${n(rr)} ${n(rr)} 0 1 0 ${n(-2 * rr)} 0`;
  let lines = [0.34, 0.67].map((k) => ring(r * k)).join("");
  for (let i = 0; i < 8; i += 1) {
    const a = (Math.PI * i) / 8;
    lines += `M${n(r - r * Math.cos(a))} ${n(r - r * Math.sin(a))}L${n(r + r * Math.cos(a))} ${n(r + r * Math.sin(a))}`;
  }
  const top = plane("set-net", "net", [cx - r, cy - r, h], [2 * r, 0, 0], [0, 2 * r, 0], `<circle cx="${n(r)}" cy="${n(r)}" r="${n(r)}" class="u-netfill"/>${threads(lines, r / 3)}<circle cx="${n(r)}" cy="${n(r)}" r="${n(r - rim / 2)}" class="u-rimline" stroke-width="${n(rim)}" fill="none"/>`);
  const legs: Plane[] = [];
  for (let i = 0; i < 4; i += 1) {
    const a = Math.PI / 4 + (Math.PI * i) / 2;
    legs.push(...pole(`leg-${i}`, "leg", cx + r * 0.9 * Math.cos(a), cy + r * 0.9 * Math.sin(a), 0, h, Math.max(feet(0.02), thin * 1.2), "u-leg"));
  }
  return { id: "net", kind: "net", at: [cx, cy], height: h, planes: [top, ...legs] };
}

/** A netball goalpost, 3.05 m high, at the middle of each goal line, with its ring on a bar that projects 150 mm from the pole (Rule 1, items 13 and 14). */
function netballPosts(f: NetballFigures, geo: CourtGeometry, thin: number): Upright {
  const { length: L, width: W } = geo;
  const h = f.post.height;
  const { inside, rod, bar: reach } = f.post.ring;
  const d = f.post.poleDiameter;
  const R = inside / 2 + rod;
  const cy = W / 2;
  const planes: Plane[] = [];
  for (const left of [true, false]) {
    const tag = left ? "left" : "right";
    const sign = left ? 1 : -1;
    const x = left ? d / 2 : L - d / 2;
    const cx = x + sign * (d / 2 + reach + R);
    planes.push(...pole(`pole-${tag}`, "post", x, cy, 0, h, Math.max(d, thin * 1.4), "u-pole"));
    planes.push(...bar(`bar-${tag}`, "post", [x, cy, h], [cx - sign * R, cy, h], Math.max(rod, thin * 1.2), "u-pole"));
    const line = Math.max(rod, thin * 1.6);
    planes.push(plane(`ring-${tag}`, "rim", [cx - R, cy - R, h], [2 * R, 0, 0], [0, 2 * R, 0], `<circle cx="${n(R)}" cy="${n(R)}" r="${n(R - line / 2)}" class="u-rimline" stroke-width="${n(line)}" fill="none"/>`));
  }
  return { id: "goalposts", kind: "goalposts", at: [L / 2, cy], height: h, planes };
}

/** The uprights of the court sports that have walls, a table, a ring or a net of their own: padel, squash, racquetball, sepak takraw, teqball, roundnet and netball. */
export function moreUprights(plan: CourtPlan, geo: CourtGeometry, settings: { netHeight?: "men" | "women"; boards?: boolean }, thin: number): NetEnd {
  const items: Upright[] = [];
  const { x, y0, y1 } = geo.net ?? { x: geo.length / 2, y0: 0, y1: geo.width };
  const at: [number, number] = [x, (y0 + y1) / 2];
  const walls = settings.boards !== false;
  switch (plan.sport) {
    case "padel": {
      const f: PadelFigures = plan.figures;
      const { heightCentre: c, heightEnds: e, postHeight: p } = f.net;
      const cell = Math.max(feet(0.045), thin * 5);
      items.push({ id: "net", kind: "net", at, height: e, low: c, planes: [netPlane({ id: "net", x, y0, y1, top: sag(y0, y1, c, e), bottom: () => 0, cell, tape: Math.max(feet(0.05), thin) }, 0)] });
      items.push(postsOf(geo, x, y0, y1, p, thin));
      if (walls) items.push(padelWalls(f, geo, thin));
      break;
    }
    case "squash":
      if (walls) items.push(squashWalls(plan.figures, geo, thin));
      break;
    case "racquetball":
      if (walls) items.push(racquetballWalls(plan.figures, geo, thin));
      break;
    case "sepaktakraw": {
      const f: SepakTakrawFigures = plan.figures;
      const women = settings.netHeight === "women";
      const centre = women ? f.net.heightWomen : f.net.heightMen;
      const post = women ? f.net.postWomen : f.net.postMen;
      const top = sag(y0, y1, centre, post);
      const cell = Math.max(feet(0.045), thin * 5);
      items.push({ id: "net", kind: "net", at, height: post, low: centre, planes: [netPlane({ id: "net", x, y0, y1, top, bottom: (y) => top(y) - f.net.width, cell, tape: Math.max(feet(0.05), thin) }, 0)] });
      items.push(postsOf(geo, x, y0, y1, post, thin));
      break;
    }
    case "teqball": {
      const f: TeqballFigures = plan.figures;
      // The table is 900 mm high with its net (1.1.4) and the net stands 140 mm over it (1.2.3): the top is 760 mm up.
      const lift = f.table.height - f.net.height;
      const solid = geo.solids.find((one) => one.kind === "table");
      const [tx0, ty0, tx1, ty1] = solid?.kind === "table" ? solid.rect : [0, 0, geo.length, geo.width];
      const cell = Math.max(feet(0.02), thin * 3);
      items.push({ id: "net", kind: "net", at, height: lift + f.net.height, planes: [netPlane({ id: "net", x, y0, y1, top: () => f.net.height, bottom: () => 0, cell, tape: Math.max(feet(0.02), thin * 0.8) }, lift)] });
      items.push({ id: "table", kind: "table-legs", at: [(tx0 + tx1) / 2, (ty0 + ty1) / 2], height: lift, planes: tableBody(tx0, ty0, tx1, ty1, lift, thin, true) });
      break;
    }
    case "roundnet":
      items.push(roundnetSet(plan.figures, geo, thin));
      break;
    case "netball":
      items.push(netballPosts(plan.figures, geo, thin));
      break;
    default:
      break;
  }
  return { items, lift: 0 };
}
