// An MMA cage (a fenced area): the platform it stands on with its steps, the canvas inside the fence, the eight-sided fence with its two gates and its padded posts, from the rules a commission or the IMMAF
// writes for a fenced area (the Nevada Rules of Unarmed Combat 5.010 3, the IMMAF's Unified Rules for amateur competition). The cage is named for what it is, an eight-sided cage: no promotion's own name is used.
// In metres, the origin at the top left of the platform, north at the top. Nothing here draws SVG.
import { arc, line } from "../fields.kit.ts";
import type { MmaFigures } from "../leagues/combat.ts";
import { discArea, rectArea, within } from "./kit.ts";
import { emptyParts, grow, union, type MBox, type MMark, type Parts } from "./parts.ts";
import { num } from "../format.ts";

/** One gate of the cage: the flat it is in, the two ends of its opening, and the way it opens (outward). */
export interface CageGate {
  side: "north" | "south";
  /** The number of the flat it is in, counted from the first corner. */
  flat: number;
  from: readonly [number, number];
  to: readonly [number, number];
}

/** What a cage plan is. */
export interface CageLayout {
  parts: Parts;
  /** The platform, which is the surface's own box: the cage's canvas and the apron round it. */
  platform: MBox;
  extent: MBox;
  centre: [number, number];
  /** The cage's width across the flats, and the distance from its middle to a post. */
  width: number;
  apothem: number;
  corner: number;
  /** The posts, one at each corner of the cage, as points on the platform. */
  posts: [number, number][];
  /** The gates, and the steps (the boxes outside the platform's edge, where a gate faces). */
  gates: CageGate[];
  steps: MBox[];
  /** The height of the platform over the floor of the building and of the fence over the canvas, in metres. */
  height: number;
  fence: number;
  marks: MMark[];
  ranges: Record<string, MBox>;
}

/** The width the options ask for, held to 20 feet to 32 feet. */
export const cageWidth = (asked: number | undefined, fig: MmaFigures): number => (asked === undefined ? fig.width.drawn : within(asked, fig.width.min, fig.width.max, "The cage's width", "NRUC 5.010 3(a) and the IMMAF's rules"));

/** The platform's height the options ask for, held to 0 to 4 feet. */
export const cageHeight = (asked: number | undefined, fig: MmaFigures): number => (asked === undefined ? fig.platform.height.drawn : within(asked, fig.platform.height.min, fig.platform.height.max, "The cage's platform", "NRUC 5.010 3(c)"));

/** The fence's height the options ask for, held to 5 feet to 7 feet. */
export const fenceHeight = (asked: number | undefined, fig: MmaFigures): number => (asked === undefined ? fig.fence.drawn : within(asked, fig.fence.min, fig.fence.max, "The cage's fence", "NRUC 5.010 3(d)"));

const rd = (v: number): number => Math.round(v * 1000) / 1000;

/** The plan of the cage the options ask for. */
export function cageParts(fig: MmaFigures, o: { width: number; height: number; fence: number; gates: boolean; steps: boolean }): CageLayout {
  const a = o.width / 2;
  const corner = a / Math.cos(Math.PI / fig.sides);
  const side = o.width + 2 * fig.apron;
  const c = side / 2;
  const platform: MBox = { x0: 0, y0: 0, x1: side, y1: side };
  const parts = emptyParts();
  // The corners of the cage: the flats face the four sides of the platform and the four diagonals, and the first corner lies a sixteenth of a turn clockwise of north.
  const step = (2 * Math.PI) / fig.sides;
  const start = -Math.PI / 2 + step / 2;
  const posts: [number, number][] = Array.from({ length: fig.sides }, (_, i) => [rd(c + corner * Math.cos(start + i * step)), rd(c + corner * Math.sin(start + i * step))]);
  parts.areas.push(rectArea("platform", "platform", "ky-bud-platform", platform));
  parts.areas.push({ id: "canvas", feature: "canvas", cls: "ky-bud-t1", d: `M${posts.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}Z` });
  // The steps, one at each gate: three treads, outside the platform's edge.
  const steps: MBox[] = [];
  const s = fig.platform.steps;
  const gateSides = ["north", "south"] as const;
  if (o.steps && o.gates) {
    for (const side_ of gateSides) {
      const depth = s.treads * s.tread;
      const b: MBox = side_ === "north" ? { x0: c - s.width / 2, y0: -depth, x1: c + s.width / 2, y1: 0 } : { x0: c - s.width / 2, y0: side, x1: c + s.width / 2, y1: side + depth };
      steps.push(b);
      for (let t = 0; t < s.treads; t += 1) {
        const y0 = side_ === "north" ? -depth + t * s.tread : side + t * s.tread;
        parts.areas.push(rectArea(`step-${side_}-${t + 1}`, "steps", "ky-bud-step", { x0: b.x0, y0, x1: b.x1, y1: y0 + s.tread }));
      }
    }
  }
  // The fence is one line along each flat; where a gate is, the line stops at its opening and the gate's swing is drawn dashed, outward.
  const gates: CageGate[] = [];
  const g = fig.gates.width;
  const gateAt = (i: number): "north" | "south" | undefined => (o.gates ? (i === 7 ? "north" : i === 3 ? "south" : undefined) : undefined);
  // Flat i runs from corner i to corner i+1; the flat that faces north is the last (corner 7 to corner 0), the one that faces south is 3.
  for (let i = 0; i < fig.sides; i += 1) {
    const p = posts[i];
    const q = posts[(i + 1) % fig.sides];
    const gate = gateAt(i);
    if (gate === undefined) {
      parts.shapes.push(line(`fence-${i + 1}`, "fence", p[0], p[1], q[0], q[1], { w: 0.1, cls: "ky-bud-ink", least: 0.1 }));
      continue;
    }
    // Along the flat, from p to q, the opening lies in the middle.
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const ux = (q[0] - p[0]) / len;
    const uy = (q[1] - p[1]) / len;
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as const;
    const from: [number, number] = [rd(m[0] - (ux * g) / 2), rd(m[1] - (uy * g) / 2)];
    const to: [number, number] = [rd(m[0] + (ux * g) / 2), rd(m[1] + (uy * g) / 2)];
    gates.push({ side: gate, flat: i, from, to });
    parts.shapes.push(line(`fence-${i + 1}a`, "fence", p[0], p[1], from[0], from[1], { w: 0.1, cls: "ky-bud-ink", least: 0.1 }), line(`fence-${i + 1}b`, "fence", to[0], to[1], q[0], q[1], { w: 0.1, cls: "ky-bud-ink", least: 0.1 }));
    // The gate opens outward, about the end of the opening that lies on the right of the north gate and on the left of the south one (the cage is the same turned half a turn).
    const hinge = to;
    parts.shapes.push(arc(`gate-${gate}`, "gates", hinge[0], hinge[1], g, gate === "north" ? 180 : 0, gate === "north" ? 270 : 90, { w: 0.04, dash: [0.14, 0.1], cls: "ky-bud-ink", least: 0.04 }));
  }
  gates.sort((x, y) => (x.side === "north" ? -1 : 1) - (y.side === "north" ? -1 : 1));
  // The posts, padded, drawn over the fence.
  posts.forEach(([x, y], i) => parts.areas.push(discArea(`post-${i + 1}`, "posts", "ky-bud-pad", x, y, fig.post.pad / 2)));
  const extent = grow(union([platform, ...steps]), 0.6);
  const north = gates.find((x) => x.side === "north");
  const ranges: Record<string, MBox> = {
    cage: { x0: c - a - 0.3, y0: c - a - 0.3, x1: c + a + 0.3, y1: c + a + 0.3 },
  };
  if (north !== undefined) ranges.gate = { x0: c - 2.4, y0: -0.5 - s.treads * s.tread, x1: c + 2.4, y1: c - a + 2 };
  const marks: MMark[] = [
    { id: "cage-canvas", x: c - a * 0.35, y: c + a * 0.25, side: "bottom" },
    { id: "cage-fence", x: c + a, y: c + a * 0.35, side: "bottom" },
    { id: "cage-post", x: posts[1][0], y: posts[1][1], side: "top" },
    { id: "cage-platform", x: side * 0.04, y: side * 0.1, side: "top" },
  ];
  if (north !== undefined) marks.push({ id: "cage-gate", x: (north.from[0] + north.to[0]) / 2, y: north.from[1] + 0.2, side: "top" });
  if (steps.length > 0) marks.push({ id: "cage-steps", x: c, y: side + s.treads * s.tread * 0.5, side: "bottom" });
  return { parts, platform, extent, centre: [c, c], width: o.width, apothem: a, corner, posts, gates, steps, height: o.height, fence: o.fence, marks, ranges };
}
