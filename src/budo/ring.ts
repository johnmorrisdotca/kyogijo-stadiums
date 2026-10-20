// A ring: the raised square platform with its canvas, the ropes held by a post at each corner (with the corner pads in the boxers' colours and two neutral ones), the apron beyond the ropes and the steps up to it, from the
// rules a commission or a federation writes (the Nevada Rules of Unarmed Combat 2.050, Wisconsin's SPS 192.38, the WBC Amateur rules, Ontario's amateur rules). Boxing draws it with its own figures, and the professional
// wrestling ring will with its own. In metres, the origin at the top left of the platform, north at the top. Nothing here draws SVG.
import { box, line } from "../fields.kit.ts";
import type { RingFigures } from "../leagues/combat.ts";
import { rectArea, within } from "./kit.ts";
import { emptyParts, grow, union, type MBox, type MMark, type Parts } from "./parts.ts";

/** The colour of a corner's post and pad: the red and the blue corner of the two boxers, and two neutral ones in white. */
export type CornerColour = "red" | "blue" | "white";

/** One corner of the ring: its post's place on the platform, the corner of the rope square its ropes turn at, its colour and which of the four it is (0 top left, clockwise). */
export interface RingCorner {
  index: number;
  colour: CornerColour;
  post: [number, number];
  rope: [number, number];
}

/** A set of steps: the box it covers outside the platform's edge, and the edge it is on. */
export interface RingSteps {
  edge: "north" | "south";
  corner: number;
  box: MBox;
}

/** What a ring plan is. */
export interface RingLayout {
  parts: Parts;
  /** The platform, which is the surface's own box: the canvas inside the ropes and the apron round it. */
  platform: MBox;
  extent: MBox;
  centre: [number, number];
  /** The ring inside the ropes, and its side. */
  ring: MBox;
  size: number;
  /** The apron's width as drawn, from the ropes to the platform's edge. */
  apron: number;
  corners: RingCorner[];
  steps: RingSteps[];
  /** The platform's height over the floor of the building, in metres. */
  height: number;
  marks: MMark[];
  ranges: Record<string, MBox>;
}

/** The size the options ask for, held to what the rules allow. */
export const ringSize = (asked: number | undefined, fig: RingFigures, rule: string): number => (asked === undefined ? fig.size.drawn : within(asked, fig.size.min, fig.size.max, "The ring", rule));

/** The platform's height the options ask for, held to what the rules allow. */
export const ringHeight = (asked: number | undefined, fig: RingFigures, rule: string): number => (asked === undefined ? fig.platform.height.drawn : within(asked, 0, fig.platform.height.max, "The ring's platform", rule));

/** The colours of the four corners, clockwise from the top left: neutral, blue, neutral, red (the red corner at the left and near the table). */
const COLOURS: readonly CornerColour[] = ["white", "blue", "white", "red"];

const rd = (v: number): number => Math.round(v * 1000) / 1000;

/** The plan of the ring the options ask for. */
export function ringParts(fig: RingFigures, o: { size: number; height: number; steps: boolean; corners: boolean }): RingLayout {
  const out = fig.post.fromRopes;
  // The apron reaches at least to the far side of the posts and their pads.
  const apron = Math.max(fig.apron.drawn, out + fig.post.pad / 2 + 0.02);
  const side = o.size + 2 * apron;
  const platform: MBox = { x0: 0, y0: 0, x1: side, y1: side };
  const ring: MBox = { x0: apron, y0: apron, x1: apron + o.size, y1: apron + o.size };
  const parts = emptyParts();
  parts.areas.push(rectArea("platform", "canvas", "ky-bud-t1", platform));
  const rope = (i: number): [number, number] => [i === 0 || i === 3 ? ring.x0 : ring.x1, i === 0 || i === 1 ? ring.y0 : ring.y1];
  const corners: RingCorner[] = [0, 1, 2, 3].map((i) => {
    const [rx, ry] = rope(i);
    const sx = i === 0 || i === 3 ? -1 : 1;
    const sy = i === 0 || i === 1 ? -1 : 1;
    return { index: i, colour: COLOURS[i], post: [rd(rx + sx * out), rd(ry + sy * out)], rope: [rx, ry] };
  });
  // The steps: one in each boxer's corner (the red and the blue) and one in a neutral corner, on the apron's edge beside the corner.
  const steps: RingSteps[] = [];
  const s = fig.platform.steps;
  if (o.steps && o.height > 0) {
    const depth = s.treads * s.tread;
    const at = (corner: number): void => {
      const c = corners[corner];
      const north = corner === 0 || corner === 1;
      // Beside the post, a metre and a half along the edge from the corner, towards the middle.
      const cx = c.post[0] < side / 2 ? c.post[0] + 1.3 : c.post[0] - 1.3;
      const b: MBox = north ? { x0: cx - s.width / 2, y0: -depth, x1: cx + s.width / 2, y1: 0 } : { x0: cx - s.width / 2, y0: side, x1: cx + s.width / 2, y1: side + depth };
      steps.push({ edge: north ? "north" : "south", corner, box: b });
      for (let t = 0; t < s.treads; t += 1) {
        const y0 = north ? -depth + t * s.tread : side + t * s.tread;
        parts.areas.push(rectArea(`step-${corner}-${t + 1}`, "steps", "ky-bud-step", { x0: b.x0, y0, x1: b.x1, y1: y0 + s.tread }));
      }
    };
    // The red corner (bottom left), the blue corner (top right) and the neutral corner nearest the table (bottom right).
    for (const corner of [3, 1, 2]) at(corner);
  }
  // The ropes seen from above are one line each side; each turns to its post by the extension.
  const w = Math.max(fig.ropes.diameter.drawn, 0.03);
  parts.shapes.push(box("ropes", "ropes", ring.x0, ring.y0, ring.x1, ring.y1, { w, cls: "ky-bud-rope", least: w }));
  for (const c of corners) parts.shapes.push(line(`rope-extension-${c.index + 1}`, "ropes", c.rope[0], c.rope[1], c.post[0], c.post[1], { w, cls: "ky-bud-rope", least: w }));
  // The posts with their pads, in the corner colours (or plain when the corners are not coloured).
  for (const c of corners) {
    const pad = fig.post.pad;
    parts.areas.push(rectArea(`corner-${c.index + 1}`, "corners", o.corners ? (`ky-bud-corner-${c.colour}` as const) : "ky-bud-pad", { x0: c.post[0] - pad / 2, y0: c.post[1] - pad / 2, x1: c.post[0] + pad / 2, y1: c.post[1] + pad / 2 }));
  }
  const extent = grow(union([platform, ...steps.map((x) => x.box)]), 0.6);
  const mid = side / 2;
  const ranges: Record<string, MBox> = { ropes: grow(ring, 0.3), corner: { x0: -0.4, y0: side - apron - 2.4, x1: apron + 3, y1: side + 0.6 } };
  const red = corners[3];
  const blue = corners[1];
  const marks: MMark[] = [
    { id: "ring-canvas", x: mid - o.size * 0.2, y: mid + o.size * 0.15, side: "bottom" },
    { id: "ring-ropes", x: ring.x1, y: mid - o.size * 0.2, side: "bottom" },
    { id: "ring-post", x: corners[0].post[0], y: corners[0].post[1], side: "top" },
    { id: "ring-red-corner", x: red.post[0], y: red.post[1], side: "bottom" },
    { id: "ring-blue-corner", x: blue.post[0], y: blue.post[1], side: "top" },
    { id: "ring-apron", x: mid, y: apron / 2, side: "top" },
  ];
  if (steps.length > 0) {
    const last = steps[steps.length - 1];
    marks.push({ id: "ring-steps", x: (last.box.x0 + last.box.x1) / 2, y: side + (last.box.y1 - last.box.y0) / 2, side: "bottom" });
  }
  return { parts, platform, extent, centre: [mid, mid], ring, size: o.size, apron, corners, steps, height: o.height, marks, ranges };
}
