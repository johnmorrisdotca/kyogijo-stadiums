// The geometry of the courts that follow the first five net sports: padel (FIP), squash (World Squash), racquetball (IRF), sepak takraw (ISTAF), teqball (FITEQ), roundnet
// (the International Roundnet Federation) and netball (World Netball). The same plain rectangles, rings and fixtures as court.ts, in feet, in the frame of a drawing lying wide:
// x along the court from the left end (the front wall, in squash and racquetball) and y across it from the top side. Each rulebook's measuring rule is said where it matters;
// docs/sources.md has the rule of every figure, and the sizes of the symbols (a wall's thickness, a post's mark) are ours.
import type { Band, CourtGeometry, Rect, Ring } from "./court.ts";
import type { NetballFigures, PadelFigures, RacquetballFigures, RoundnetFigures, SepakTakrawFigures, SquashFigures, TeqballFigures } from "./leagues/courts.ts";
import { convertLength } from "./units.ts";

const feet = (metres: number): number => convertLength(metres, "m", "ft");

/** The empty parts of a geometry, which each court fills in as it needs. */
export const none = (): Pick<CourtGeometry, "rings" | "bands" | "solids" | "wallLines" | "underNet"> => ({ rings: [], bands: [], solids: [], wallLines: [], underNet: null });

/** The four edges of a court's boundary lines, drawn inside its dimensions: each line's width inwards. */
const boundary = (L: number, W: number, w: number): Rect[] => [[0, 0, w, W], [L - w, 0, L, W], [0, 0, L, w], [0, W - w, L, W]];

/** Walls (or surrounds) of a thickness all round the outside of a court, but for the sides named in `omit`, in one piece each, corners included. */
function walls(L: number, W: number, t: number, omit: readonly ("left" | "right")[] = []): Band[] {
  const out: Band[] = [{ rect: [0, -t, L, 0], kind: "wall" }, { rect: [0, W, L, W + t], kind: "wall" }];
  if (!omit.includes("left")) out.push({ rect: [-t, -t, 0, W + t], kind: "wall" });
  if (!omit.includes("right")) out.push({ rect: [L, -t, L + t, W + t], kind: "wall" });
  return out;
}

/**
 * A padel court: no lines round it (its walls are its limits), a service line each side of the net, 6.95 m from it to the outside edge (the Rules give no edge: ours, as the
 * other rulebooks measure to the outside of a line), and the central service line from one service line to the other under the net, extending beyond each by the Rules' 20 cm. The
 * enclosure is drawn outside the court: the end walls and, at each end of each side, a wall 4 m long, with metal fence between (Ends and Sides).
 */
export function padelGeometry(f: PadelFigures): CourtGeometry {
  const { length: L, width: W, lineWidth: w, serviceLine: S, centreOverrun: ov } = f;
  const cx = L / 2;
  const cy = W / 2;
  const t = feet(0.15);
  const side = f.enclosure.sideWall;
  const bands: Band[] = [{ rect: [-t, -t, 0, W + t], kind: "wall" }, { rect: [L, -t, L + t, W + t], kind: "wall" }];
  for (const [y0, y1] of [[-t, 0], [W, W + t]] as const) {
    bands.push({ rect: [0, y0, side, y1], kind: "wall" }, { rect: [side, y0, L - side, y1], kind: "mesh" }, { rect: [L - side, y0, L, y1], kind: "wall" });
  }
  const post = feet(0.1);
  return {
    length: L,
    width: W,
    lines: [[cx - S, 0, cx - S + w, W], [cx + S - w, 0, cx + S, W], [cx - S - ov, cy - w / 2, cx + S + ov, cy + w / 2]],
    areas: [],
    small: [],
    // The net runs from side to side, 10 m: the outer side of each post is the court's lateral limit.
    net: { x: cx, y0: 0, y1: W },
    posts: [{ x: cx, y: post / 2, size: post, shape: "square" }, { x: cx, y: W - post / 2, size: post, shape: "square" }],
    antennae: [],
    sticks: [],
    ...none(),
    bands,
  };
}

/**
 * A squash court, the front wall at the left. Floor: the short line (its nearest edge 4.26 m from the back wall, across the whole width), the half court line from the back wall to
 * it, and in each back corner a service box, a square of 1.60 m inside its lines (5.05.03). The front wall is laid out flat beside the court, as if hinged on its foot: its tin (the
 * upper 50 mm of it a line), the service line (the lower edge 1.78 m up) and the front wall line (4.57 m up), each across its width. The other walls stand round the court.
 */
export function squashGeometry(f: SquashFigures): CourtGeometry {
  const { length: L, width: W, lineWidth: w, shortLine: sl, serviceBox: sb, wall } = f;
  const cy = W / 2;
  const t = feet(0.15);
  const near = L - sl;
  const lines: Rect[] = [
    // The short line: its nearest edge to the back wall is `sl` from it, so it lies in front of that edge.
    [near - w, 0, near, W],
    // The half court line, from the back wall to the short line.
    [near - w, cy - w / 2, L, cy + w / 2],
  ];
  for (const top of [true, false]) {
    // A service box: inside 1.60 m by 1.60 m behind the short line, bounded by the short line, the side wall, and a line across the back and one along the side.
    lines.push(top ? [near + sb, 0, near + sb + w, sb + w] : [near + sb, W - sb - w, near + sb + w, W]);
    lines.push(top ? [near, sb, near + sb + w, sb + w] : [near, W - sb - w, near + sb + w, W - sb]);
  }
  // The front wall laid flat beside the court: distances to the left of the wall are heights up it. Each line's lower edge is at its height, and it is 50 mm tall.
  const high = wall.frontWallLine + w;
  const wallLines: Rect[] = [[-(wall.serviceLine + w), 0, -wall.serviceLine, W], [-(wall.frontWallLine + w), 0, -wall.frontWallLine, W], [-wall.tin, 0, -(wall.tin - w), W]];
  const bands: Band[] = [{ rect: [-high, 0, 0, W], kind: "face" }, { rect: [-wall.tin, 0, 0, W], kind: "tin" }, ...walls(L, W, t, ["left"])];
  return { length: L, width: W, lines, areas: [], small: [], net: null, posts: [], antennae: [], sticks: [], ...none(), bands, wallLines };
}

/**
 * A racquetball court, the front wall at the left. The short line's back edge is 20 ft from the back wall, the service line's front edge 5 ft in front of it, a service box's line
 * and a drive serve line at 18 in and 3 ft from each side wall (to the edge nearest the centre) across the service zone, and the receiving line, broken, with its back edge 5 ft
 * behind the short line's: an end segment of 21 in at each wall and sixteen 6 in segments with 6 in spaces between. The walls stand round the court.
 */
export function racquetballGeometry(f: RacquetballFigures): CourtGeometry {
  const { length: L, width: W, lineWidth: w, serviceBox: sb, driveServe: ds } = f;
  const t = 0.5;
  const back = L - f.shortLine;
  const front = back - f.serviceLine;
  const lines: Rect[] = [
    [back - w, 0, back, W],
    [front, 0, front + w, W],
    // The service boxes' lines, from one line of the zone to the other, and the drive serve lines.
    [front, sb - w, back, sb], [front, W - sb, back, W - sb + w],
    [front, ds - w, back, ds], [front, W - ds, back, W - ds + w],
  ];
  // The receiving line: its back edge `behind` behind the short line's back edge.
  const rear = back + f.receiving.behind;
  const { end, dash, gap } = f.receiving;
  lines.push([rear - w, 0, rear, end], [rear - w, W - end, rear, W]);
  for (let y = end + gap; y + dash <= W - end - gap + 1e-9; y += dash + gap) lines.push([rear - w, y, rear, y + dash]);
  return { length: L, width: W, lines, areas: [], small: [], net: null, posts: [], antennae: [], sticks: [], ...none(), bands: walls(L, W, t) };
}

/**
 * A sepak takraw court: the boundary lines drawn inwards, the centre line across the middle under the net, a quarter circle of 0.9 m radius at each end of the centre line (four, each
 * inside the court on its side of the net), and a service circle of 0.3 m radius on each side of the net, its centre 2.45 m from the back line on the middle of the width. The radius
 * is taken to the outside of the circle's line (the Law gives none: ours). The posts stand 0.3 m outside the sidelines, in line with the centre line.
 */
export function sepakTakrawGeometry(f: SepakTakrawFigures): CourtGeometry {
  const { length: L, width: W, lineWidth: w, centreLine: c, quarterCircle: q, serviceCircle: s } = f;
  const cx = L / 2;
  const cy = W / 2;
  const half = Math.PI / 2;
  const rings: Ring[] = [
    { cx, cy: 0, r: q, w, a0: half, a1: 2 * half },
    { cx, cy: 0, r: q, w, a0: 0, a1: half },
    { cx, cy: W, r: q, w, a0: 2 * half, a1: 3 * half },
    { cx, cy: W, r: q, w, a0: 3 * half, a1: 4 * half },
    { cx: s.fromBack, cy, r: s.radius, w },
    { cx: L - s.fromBack, cy, r: s.radius, w },
  ];
  const out = f.net.postsOutside;
  const post = Math.max(2 * f.net.postRadius, L * 0.006);
  return {
    length: L,
    width: W,
    lines: [...boundary(L, W, w), [cx - c / 2, 0, cx + c / 2, W]],
    areas: [],
    small: [],
    net: { x: cx, y0: -out, y1: W + out },
    posts: [{ x: cx, y: -out, size: post, shape: "round" }, { x: cx, y: W + out, size: post, shape: "round" }],
    antennae: [],
    sticks: [],
    ...none(),
    rings,
    underNet: c,
  };
}

/**
 * A teqball court: the table (3 m by 1.5 m) in the exact middle, its net across the middle of its length and parallel to the shorter sides, the halfway line under it across the whole
 * width, and a service line each side 3.5 m from the middle of the table. The line widths are the greatest of the 20 to 50 mm; the Rules give no edge for the service line, so its
 * axis is taken to be 3.5 m from the middle (ours). The court's surrounds stand round it, outside.
 */
export function teqballGeometry(f: TeqballFigures): CourtGeometry {
  const { length: L, width: W, lineWidth: w, serviceLine: S } = f;
  const cx = L / 2;
  const cy = W / 2;
  const { table, net } = f;
  return {
    length: L,
    width: W,
    lines: [[cx - w / 2, 0, cx + w / 2, W], [cx - S - w / 2, 0, cx - S + w / 2, W], [cx + S - w / 2, 0, cx + S + w / 2, W]],
    areas: [],
    small: [],
    net: { x: cx, y0: cy - net.width / 2, y1: cy + net.width / 2 },
    posts: [],
    antennae: [],
    sticks: [],
    ...none(),
    bands: walls(L, W, feet(0.1)),
    solids: [{ kind: "table", rect: [cx - table.length / 2, cy - table.width / 2, cx + table.length / 2, cy + table.width / 2] }],
  };
}

/**
 * A roundnet court: the recommended 10 by 10 m of ground (there are no out of bounds), the set (91.4 cm across) at its centre, the no hit zone line (a circle of 0.9 m) and the serving
 * line (a circle of 2.6 m) round it, and a mark across the serving line at each of the four service positions, 90 degrees apart, along the court's axes. The rules give no widths for
 * the lines or the marks: ours.
 */
export function roundnetGeometry(f: RoundnetFigures): CourtGeometry {
  const { length: L, width: W, lineWidth: w, servingRadius: R, noHitRadius: n } = f;
  const cx = L / 2;
  const cy = W / 2;
  const tick = feet(0.4);
  return {
    length: L,
    width: W,
    lines: [
      [cx + R - tick / 2, cy - w / 2, cx + R + tick / 2, cy + w / 2], [cx - R - tick / 2, cy - w / 2, cx - R + tick / 2, cy + w / 2],
      [cx - w / 2, cy + R - tick / 2, cx + w / 2, cy + R + tick / 2], [cx - w / 2, cy - R - tick / 2, cx + w / 2, cy - R + tick / 2],
    ],
    areas: [],
    small: [],
    net: null,
    posts: [],
    antennae: [],
    sticks: [],
    ...none(),
    rings: [{ cx, cy, r: n, w }, { cx, cy, r: R, w }],
    solids: [{ kind: "set", cx, cy, r: f.set.diameter / 2 }],
  };
}

/**
 * A netball court: the boundary lines drawn inwards, the two transverse lines that divide it into thirds (each line common to the two areas it bounds, so its axis is on the third),
 * the centre circle (0.9 m across), the goal circles (semicircles of 4.9 m radius centred on the middle of the outside of each goal line) and the goalposts. The radii are taken to the
 * outside of the lines; the pole is drawn at its greatest, 100 mm, with its back at the outer edge of the goal line, and the ring of each goal is seen from above.
 */
export function netballGeometry(f: NetballFigures): CourtGeometry {
  const { length: L, width: W, lineWidth: w } = f;
  const cy = W / 2;
  const half = Math.PI / 2;
  const d = f.post.poleDiameter;
  // The goal ring hangs on a bar that projects from the front of the pole: its nearest edge is a bar's length from the pole, and it is drawn at its rod's width.
  const { inside, rod, bar } = f.post.ring;
  const hoop = (x: number): Ring => ({ cx: x, cy, r: inside / 2 + rod, w: rod });
  return {
    length: L,
    width: W,
    lines: [...boundary(L, W, w), [L / 3 - w / 2, 0, L / 3 + w / 2, W], [(2 * L) / 3 - w / 2, 0, (2 * L) / 3 + w / 2, W]],
    areas: [],
    small: [],
    net: null,
    posts: [{ x: d / 2, y: cy, size: d, shape: "round" }, { x: L - d / 2, y: cy, size: d, shape: "round" }],
    antennae: [],
    sticks: [],
    ...none(),
    rings: [
      { cx: L / 2, cy, r: f.centreCircle / 2, w },
      { cx: 0, cy, r: f.goalCircle, w, a0: -half, a1: half },
      { cx: L, cy, r: f.goalCircle, w, a0: half, a1: 3 * half },
      hoop(d + bar + inside / 2 + rod),
      hoop(L - d - bar - inside / 2 - rod),
    ],
  };
}
