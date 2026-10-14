// The short track: the rink, the padding, the oval of 111.12 m with its seven blocks in each curve, the finishing line, the starting lines of the tracks laid out beside the standard one, and the starting
// positions of the 500 m and the 1000 m. Every figure is the ISU's (Special Regulations and Technical Rules Short Track Speed Skating, Rule 280 and its diagram), in metres. Nothing here draws SVG.
import { line } from "../fields.kit.ts";
import type { Shape } from "../fields.types.ts";
import { ISU_SHORT_TRACK, type ShortTrackFigures } from "../leagues/skating.ts";
import { addParts, curvePoint, emptyParts, stadiumD, type MBox, type Parts } from "./parts.ts";
import type { ShortTrackRace } from "./types.ts";

/** The oval of the standard track. */
export interface ShortOval {
  straight: number;
  radius: number;
  /** The radius of the blocks, 0.5 m inside the line of the track. */
  blocks: number;
  lap: number;
  /** The rink: its length and width. */
  length: number;
  width: number;
}

/** The oval for a rink. */
export function shortOval(length = ISU_SHORT_TRACK.rink.length, width = ISU_SHORT_TRACK.rink.width, fig: ShortTrackFigures = ISU_SHORT_TRACK): ShortOval {
  return { straight: fig.straight, radius: fig.radius, blocks: fig.blocks, lap: 2 * fig.straight + 2 * Math.PI * fig.radius, length, width };
}

/** The pose of a skater `v` metres along a lap that begins at the left end of the finishing straight (the bottom one), `out` metres outside the line of the track: the skaters go counter-clockwise. */
export function shortPose(o: ShortOval, v: number, out = 0): { x: number; y: number; heading: number } {
  const S = o.straight;
  const r = o.radius + out;
  const L = 2 * S + 2 * Math.PI * o.radius;
  let s = ((v % L) + L) % L;
  if (s < S) return { x: -S / 2 + s, y: r, heading: 0 };
  s -= S;
  const half = Math.PI * o.radius;
  if (s < half) {
    const t = s / o.radius;
    const [x, y] = curvePoint(S, "right", r, t);
    return { x, y, heading: -t };
  }
  s -= half;
  if (s < S) return { x: S / 2 - s, y: -r, heading: Math.PI };
  s -= S;
  const t = s / o.radius;
  const [x, y] = curvePoint(S, "left", r, t);
  return { x, y, heading: Math.PI - t };
}

/** Where each race starts: the half-lap races (500 m and 1500 m) on the starting lines of the straight opposite the finishing line, the others on the finishing line (the diagram's laps: 4 1/2, 9, 13 1/2, 18, 27 and 45). */
export const startsOnOppositeStraight = (race: ShortTrackRace): boolean => race === "500m" || race === "1500m";

/** The x of the starting line of each of the tracks, from the one at the left: a track moved `shift` along the straight starts 2 x shift on from the standard track's line (the diagram). */
export function trackLines(tracks: 5 | 7, fig: ShortTrackFigures = ISU_SHORT_TRACK): number[] {
  const t = tracks === 5 ? fig.tracks.five : fig.tracks.seven;
  return Array.from({ length: tracks }, (_, i) => (i - (tracks - 1) / 2) * t.lines);
}

/** The starting positions of the 500 m and the 1000 m: five dots every 1.3 m, from 50 cm out from the inner side of the track (Rule 280.2c), on the line at `x` and the side `side` (-1 the top, 1 the bottom). */
export function startingPositions(o: ShortOval, x: number, side: 1 | -1, fig: ShortTrackFigures = ISU_SHORT_TRACK): { x: number; y: number }[] {
  return Array.from({ length: fig.dots.count }, (_, i) => ({ x, y: side * (o.blocks + fig.dots.from + i * fig.dots.step) }));
}

export interface ShortOptions {
  fig: ShortTrackFigures;
  tracks: 5 | 7;
  blocks: boolean;
  padding: boolean;
  races: readonly ShortTrackRace[];
  /** The corner radius of the rink: ours. */
  corner: number;
}

/** The parts of the short track. */
export function shortParts(o: ShortOval, opt: ShortOptions): { parts: Parts; box: MBox } {
  const { fig } = opt;
  const parts = emptyParts();
  const S = o.straight;
  const W = o.width / 2;
  const Lh = o.length / 2;
  const roundD = (hx: number, hy: number, r: number): string => `M${-hx + r} ${-hy}H${hx - r}A${r} ${r} 0 0 1 ${hx} ${-hy + r}V${hy - r}A${r} ${r} 0 0 1 ${hx - r} ${hy}H${-hx + r}A${r} ${r} 0 0 1 ${-hx} ${hy - r}V${-hy + r}A${r} ${r} 0 0 1 ${-hx + r} ${-hy}Z`;
  const rd = (n: number): number => Math.round(n * 100) / 100;
  parts.areas.push({ id: "ice", feature: "ice", cls: "ky-ska-ice", d: roundD(rd(Lh), rd(W), opt.corner) });
  if (opt.padding) parts.areas.push({ id: "padding", feature: "padding", cls: "ky-ska-pad", d: `${roundD(rd(Lh + 0.5), rd(W + 0.5), opt.corner + 0.5)}${roundD(rd(Lh), rd(W), opt.corner)}`, evenodd: true });
  // The inner surface of the track, when it is coloured: inside the blocks by the finishing line's extra 1.5 m (Rule 280.2d and the diagram).
  parts.areas.push({ id: "inner", feature: "infield", cls: "ky-ska-warm", d: stadiumD(S, o.blocks - fig.inner) });
  // The line of the standard track, 111.12 m round, and the line between the last block of a curve and the first of the next (Rule 280.1g).
  parts.shapes.push({ kind: "path", id: "track-line", feature: "track-line", d: stadiumD(S, o.radius), w: 0.02, cls: "ky-ska-b" });
  for (const side of [-1, 1]) parts.shapes.push(line(`straight-line-${side}`, "track-line", -S / 2, side * o.blocks, S / 2, side * o.blocks, { w: 0.02, cls: "ky-ska-k" }));
  // The blocks: seven in each curve (Rule 280.4), the first and the last at the ends of the straights and the apex in the middle, 30 degrees apart.
  if (opt.blocks) {
    for (const side of ["right", "left"] as const) {
      for (let k = 0; k < fig.blocksPerCurve; k += 1) {
        const [cx, cy] = curvePoint(S, side, o.blocks, (k * Math.PI) / (fig.blocksPerCurve - 1));
        parts.shapes.push({ kind: "dot", id: `block-${side}-${k}`, feature: "blocks", cx, cy, r: 0.12, paint: k === 0 || k === 3 ? "cone" : "block" });
      }
    }
  }
  // The finishing line, from the barrier across the width of the straight and 1.5 m more (Rule 280.2b), 2 cm wide.
  parts.shapes.push(line("finish-line", "finish-line", 0, W, 0, o.blocks - fig.finishExtra, { w: fig.line, cls: "ky-ska-r" }));
  // The starting lines of the half-lap races, one for each track, from the barrier across the width of the straight (Rule 280.2b).
  const lines = trackLines(opt.tracks, fig);
  const wanted = opt.races.some(startsOnOppositeStraight);
  if (wanted) lines.forEach((x, i) => parts.shapes.push(line(`start-line-${i + 1}`, "start-lines", x, -W, x, -o.blocks, { w: fig.line, cls: "ky-ska-r" })));
  // The starting positions of the 500 m (on the standard track's line) and of the 1000 m (at the finishing line): five dots.
  const dotsFor = (x: number, side: 1 | -1, id: string): void => {
    for (const [i, p] of startingPositions(o, x, side, fig).entries()) parts.shapes.push({ kind: "dot", id: `${id}-${i + 1}`, feature: "start-positions", cx: p.x, cy: p.y, r: 0.1, paint: "block" });
  };
  if (opt.races.includes("500m")) dotsFor(0, -1, "position-500m");
  if (opt.races.includes("1000m")) dotsFor(0, 1, "position-1000m");
  void addParts;
  return { parts, box: { x0: -Lh - 0.5, y0: -W - 0.5, x1: Lh + 0.5, y1: W + 0.5 } };
}

export type { Shape };
