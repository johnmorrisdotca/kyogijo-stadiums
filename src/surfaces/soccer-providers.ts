// The coordinate systems of the soccer data providers, as pitch specs (the idea of ggsoccer's `pitch_international` and
// its relatives, MIT, and of mplsoccer's pitch types, MIT), and the piecewise-linear map between any two of them that
// sends each landmark of one to the same landmark of the other (the idea of ggsoccer's `rescale_coordinates`). Our own
// code throughout; the providers' figures are facts, cited in docs/sources.md.
//
// A frame is the pitch as a provider writes it down: what x is at each goal line, what y is at each touchline, and where
// the provider puts the lines (the penalty area, the goal area, the penalty mark, the posts), in its own units. A
// provider that fixes its numbers (Opta, StatsBomb, Wyscout) puts the lines where its own figures say, which is rarely
// where the Laws put them on a pitch of 105 by 68 metres; the map keeps a point on a line on that line.
//
// This file asks nothing of the rest of the package except a pitch's length and width, so that it is easy to move.

import type { SoccerLayout, SoccerSpec } from "./soccer-spec.ts";

/** The providers, by the id the options use. */
export type SoccerProviderId = "opta" | "statsbomb" | "wyscout" | "tracab" | "metrica" | "skillcorner" | "secondspectrum" | "impect" | "uefa" | "international";

/**
 * A pitch as a data provider writes it down. Everything is in the provider's own unit.
 *
 * `xLeft` and `xRight` are x at the two goal lines, with the team attacking left to right; `yTop` and `yBottom` are y
 * at the touchlines as they lie in a picture with the first at the top. So the frame says both where the origin is and
 * which way y runs: Opta (y up) has `yTop: 100, yBottom: 0`; StatsBomb (y down) has `yTop: 0, yBottom: 80`. The depths
 * are measured from the goal line along x, the half widths from the middle of the pitch along y.
 */
export interface SoccerFrame {
  id: string;
  name: string;
  /** The unit of the numbers, for people. */
  unit: string;
  xLeft: number;
  xRight: number;
  yTop: number;
  yBottom: number;
  /** How far the penalty area reaches from the goal line, and half its width. */
  penaltyDepth: number;
  penaltyHalfWidth: number;
  /** How far the goal area reaches, and half its width. */
  goalAreaDepth: number;
  goalAreaHalfWidth: number;
  /** The penalty mark, from the goal line. */
  spot: number;
  /** Half the width of the goal, between the posts. */
  goalHalfWidth: number;
}

/** A provider: its name, the page its figures were read from, and its frame (which for some depends on the size of the pitch). */
export interface SoccerProvider {
  id: SoccerProviderId;
  name: string;
  /** The unit of its numbers. */
  unit: string;
  /** True when its extents follow the size of the pitch (Tracab's centimetres from the centre): the frame is made for a size. */
  sized: boolean;
  /** The page of the provider's own documentation the figures were read from. */
  source: string;
  /** One line on how the numbers run, for people. */
  note: string;
  /** The frame, for a pitch of this length and width in metres (ignored unless `sized`). */
  frame: (length: number, width: number) => SoccerFrame;
}

/** The Laws' landmarks, in metres, which every provider that reports metres (or a fraction of them) uses. */
const LAWS = { penaltyDepth: 16.5, penaltyHalfWidth: 20.16, goalAreaDepth: 5.5, goalAreaHalfWidth: 9.16, spot: 11, goalHalfWidth: 3.66 } as const;

/** A frame whose numbers are metres (or a fixed multiple of them), centred or not. */
function lawsFrame(id: string, name: string, unit: string, k: number, e: Pick<SoccerFrame, "xLeft" | "xRight" | "yTop" | "yBottom">): SoccerFrame {
  return {
    id,
    name,
    unit,
    ...e,
    penaltyDepth: LAWS.penaltyDepth * k,
    penaltyHalfWidth: LAWS.penaltyHalfWidth * k,
    goalAreaDepth: LAWS.goalAreaDepth * k,
    goalAreaHalfWidth: LAWS.goalAreaHalfWidth * k,
    spot: LAWS.spot * k,
    goalHalfWidth: LAWS.goalHalfWidth * k,
  };
}

/** A frame whose extents are a fraction of the pitch: its landmarks are the Laws', as a fraction of the size. */
function fractionFrame(id: string, name: string, unit: string, length: number, width: number, e: Pick<SoccerFrame, "xLeft" | "xRight" | "yTop" | "yBottom">): SoccerFrame {
  const kx = Math.abs(e.xRight - e.xLeft) / length;
  const ky = Math.abs(e.yBottom - e.yTop) / width;
  return {
    id,
    name,
    unit,
    ...e,
    penaltyDepth: LAWS.penaltyDepth * kx,
    penaltyHalfWidth: LAWS.penaltyHalfWidth * ky,
    goalAreaDepth: LAWS.goalAreaDepth * kx,
    goalAreaHalfWidth: LAWS.goalAreaHalfWidth * ky,
    spot: LAWS.spot * kx,
    goalHalfWidth: LAWS.goalHalfWidth * ky,
  };
}

const centred = (length: number, width: number, k: number): Pick<SoccerFrame, "xLeft" | "xRight" | "yTop" | "yBottom"> => ({ xLeft: (-length / 2) * k, xRight: (length / 2) * k, yTop: (width / 2) * k, yBottom: (-width / 2) * k });

/**
 * The providers. Where a provider's own page gives the figures (StatsBomb's and Wyscout's diagrams, Impect's glossary,
 * Metrica's and SkillCorner's READMEs) they are those; Opta's, Tracab's and Second Spectrum's specifications are not
 * public, so theirs are the figures the open-source libraries mplsoccer, ggsoccer and kloppy agree on, which docs/sources.md says.
 */
export const SOCCER_PROVIDERS: Readonly<Record<SoccerProviderId, SoccerProvider>> = {
  opta: {
    id: "opta",
    name: "Opta / Stats Perform",
    unit: "0 to 100",
    sized: false,
    source: "Stats Perform's event specification is not public: the figures are those mplsoccer and ggsoccer agree on (docs/sources.md)",
    note: "0 to 100 on both axes, the origin at the bottom left, y up, each team attacking left to right; the lines stand at fixed numbers, whatever the pitch",
    frame: () => ({ id: "opta", name: "Opta / Stats Perform", unit: "0 to 100", xLeft: 0, xRight: 100, yTop: 100, yBottom: 0, penaltyDepth: 17, penaltyHalfWidth: 28.9, goalAreaDepth: 5.8, goalAreaHalfWidth: 13.2, spot: 11.5, goalHalfWidth: 4.8 }),
  },
  statsbomb: {
    id: "statsbomb",
    name: "StatsBomb",
    unit: "yards",
    sized: false,
    source: "StatsBomb Open Data Events v4.0.0, Appendix 2, Locations (github.com/statsbomb/open-data, doc/)",
    note: "120 by 80 yards, the origin at the top left, y down; the lines stand at 6, 12 and 18 yards from the goal line",
    frame: () => ({ id: "statsbomb", name: "StatsBomb", unit: "yards", xLeft: 0, xRight: 120, yTop: 0, yBottom: 80, penaltyDepth: 18, penaltyHalfWidth: 22, goalAreaDepth: 6, goalAreaHalfWidth: 10, spot: 12, goalHalfWidth: 4 }),
  },
  wyscout: {
    id: "wyscout",
    name: "Wyscout",
    unit: "0 to 100",
    sized: false,
    source: "Wyscout Data Glossary, Pitch coordinates (dataglossary.wyscout.com/pitch_coordinates); the posts are from ggsoccer, which the glossary does not mark",
    note: "0 to 100 on both axes, the origin at the top left, y down, the team attacking left to right; the lines stand at fixed numbers",
    frame: () => ({ id: "wyscout", name: "Wyscout", unit: "0 to 100", xLeft: 0, xRight: 100, yTop: 0, yBottom: 100, penaltyDepth: 16, penaltyHalfWidth: 31, goalAreaDepth: 6, goalAreaHalfWidth: 13, spot: 10, goalHalfWidth: 6 }),
  },
  tracab: {
    id: "tracab",
    name: "Tracab",
    unit: "centimetres",
    sized: true,
    source: "Tracab's specification is not public: the origin, unit and y direction are those mplsoccer, kloppy and floodlight use (docs/sources.md); the lines are the Laws'",
    note: "centimetres from the middle of the pitch, y up, so the extents follow the pitch (about 5250 and 3400 on 105 by 68 m)",
    frame: (length, width) => lawsFrame("tracab", "Tracab", "centimetres", 100, centred(length, width, 100)),
  },
  metrica: {
    id: "metrica",
    name: "Metrica Sports",
    unit: "0 to 1",
    sized: true,
    source: "Metrica Sports sample-data README (github.com/metrica-sports/sample-data)",
    note: "0 to 1 on both axes, the origin at the top left, y down, (0.5, 0.5) the kick-off; the lines are the Laws' as a fraction of the pitch",
    frame: (length, width) => fractionFrame("metrica", "Metrica Sports", "0 to 1", length, width, { xLeft: 0, xRight: 1, yTop: 0, yBottom: 1 }),
  },
  skillcorner: {
    id: "skillcorner",
    name: "SkillCorner",
    unit: "metres",
    sized: true,
    source: "SkillCorner open data README and field diagram (github.com/SkillCorner/opendata)",
    note: "metres from the middle of the pitch, y up, the long side x; the extents follow the pitch in the match's own file",
    frame: (length, width) => lawsFrame("skillcorner", "SkillCorner", "metres", 1, centred(length, width, 1)),
  },
  secondspectrum: {
    id: "secondspectrum",
    name: "Second Spectrum",
    unit: "metres",
    sized: true,
    source: "Second Spectrum's specification is not public: the origin, unit and y direction are those mplsoccer, kloppy and floodlight use (docs/sources.md)",
    note: "metres from the middle of the pitch, y up; the extents follow the pitch",
    frame: (length, width) => lawsFrame("secondspectrum", "Second Spectrum", "metres", 1, centred(length, width, 1)),
  },
  impect: {
    id: "impect",
    name: "Impect",
    unit: "metres",
    sized: false,
    source: "Impect Glossary, context variables, \"How is the pitch defined?\" (glossary.impect.com/context-variable)",
    note: "105 by 68 metres from the middle, x from -52.5 to 52.5 and y from -34 to 34, y up, the team attacking left to right",
    frame: () => lawsFrame("impect", "Impect", "metres", 1, centred(105, 68, 1)),
  },
  uefa: {
    id: "uefa",
    name: "UEFA",
    unit: "metres",
    sized: false,
    source: "UEFA Stadium Infrastructure Regulations, Article 5.01: 105 by 68 metres for categories 3 and 4; mplsoccer's 'uefa' type is the same in its code (its text says 65)",
    note: "105 by 68 metres, the origin at the bottom left, y up",
    frame: () => lawsFrame("uefa", "UEFA", "metres", 1, { xLeft: 0, xRight: 105, yTop: 68, yBottom: 0 }),
  },
  international: {
    id: "international",
    name: "International",
    unit: "metres",
    sized: true,
    source: "IFAB Laws of the Game, Law 1; ggsoccer's pitch_international",
    note: "metres from the bottom left corner, y up, the pitch as long and as wide as it is drawn (105 by 68 by default)",
    frame: (length, width) => lawsFrame("international", "International", "metres", 1, { xLeft: 0, xRight: length, yTop: width, yBottom: 0 }),
  },
};

/** The ids of the providers, in the order a menu lists them. */
export const SOCCER_PROVIDER_IDS: readonly SoccerProviderId[] = ["opta", "statsbomb", "wyscout", "tracab", "metrica", "skillcorner", "secondspectrum", "impect", "uefa", "international"];

/** Whether a frame can be drawn and mapped: its numbers are finite, its extents are not empty and its landmarks lie in order. */
export function validFrame(f: unknown): f is SoccerFrame {
  if (typeof f !== "object" || f === null) return false;
  const v = f as Record<string, unknown>;
  const num = (key: string): number => (typeof v[key] === "number" && Number.isFinite(v[key]) ? (v[key] as number) : Number.NaN);
  const [xl, xr, yt, yb] = [num("xLeft"), num("xRight"), num("yTop"), num("yBottom")];
  const [pd, pw, gd, gw, sp, gp] = [num("penaltyDepth"), num("penaltyHalfWidth"), num("goalAreaDepth"), num("goalAreaHalfWidth"), num("spot"), num("goalHalfWidth")];
  if ([xl, xr, yt, yb, pd, pw, gd, gw, sp, gp].some(Number.isNaN)) return false;
  const halfX = Math.abs(xr - xl) / 2;
  const halfY = Math.abs(yb - yt) / 2;
  return halfX > 0 && halfY > 0 && gd > 0 && gd < sp && sp < pd && pd < halfX && gp > 0 && gp < gw && gw < pw && pw < halfY;
}

/** Where the landmarks of a frame stand on each axis, in its units, from the left goal line to the right and from the top touchline to the bottom. */
export function soccerLandmarks(f: SoccerFrame): { x: number[]; y: number[] } {
  const sx = f.xRight >= f.xLeft ? 1 : -1;
  const sy = f.yBottom >= f.yTop ? 1 : -1;
  const mx = (f.xLeft + f.xRight) / 2;
  const my = (f.yTop + f.yBottom) / 2;
  const depths = [f.goalAreaDepth, f.spot, f.penaltyDepth];
  const halves = [f.penaltyHalfWidth, f.goalAreaHalfWidth, f.goalHalfWidth];
  return {
    x: [f.xLeft, ...depths.map((d) => f.xLeft + sx * d), mx, ...depths.map((d) => f.xRight - sx * d).reverse(), f.xRight],
    y: [f.yTop, ...halves.map((h) => my - sy * h), my, ...halves.map((h) => my + sy * h).reverse(), f.yBottom],
  };
}

/** A length and width in metres: what a provider whose numbers follow the pitch needs to know. */
export interface PitchMetres {
  length: number;
  width: number;
}

/** The size a frame is made for when none is given: the international 105 by 68 metres. */
const STANDARD: PitchMetres = { length: 105, width: 68 };

/**
 * The frame of a provider (by id), or a frame of your own as it is, for a pitch of this size in metres (which matters
 * only to a provider whose numbers follow the pitch). An id that is not a provider, or a frame that cannot be
 * drawn, gives `undefined`.
 * @example
 * ```ts
 * import { soccerFrame } from "@johnmorrisdotca/kyogijo";
 * const opta = soccerFrame("opta");
 * console.log(opta?.xRight, opta?.yTop);
 * // 100 100
 * ```
 */
export function soccerFrame(frame: SoccerProviderId | SoccerFrame | string | undefined, pitch: PitchMetres = STANDARD): SoccerFrame | undefined {
  if (typeof frame === "string") {
    if (!Object.prototype.hasOwnProperty.call(SOCCER_PROVIDERS, frame)) return undefined;
    const length = Number.isFinite(pitch.length) && pitch.length > 0 ? pitch.length : STANDARD.length;
    const width = Number.isFinite(pitch.width) && pitch.width > 0 ? pitch.width : STANDARD.width;
    return SOCCER_PROVIDERS[frame as SoccerProviderId].frame(length, width);
  }
  return validFrame(frame) ? frame : undefined;
}

/** The frame an option asks for, for the pitch being drawn. */
export const resolveFrame = (pitchType: SoccerProviderId | SoccerFrame | string | undefined, spec: Pick<SoccerSpec, "length" | "width">): SoccerFrame | undefined => (pitchType === undefined ? undefined : soccerFrame(pitchType, spec));

/** How the frame's units stand to metres on the pitch: metres per unit along x and along y. */
function unitsToMetres(f: SoccerFrame, spec: Pick<SoccerSpec, "length" | "width">): { sx: number; sy: number } {
  return { sx: spec.length / Math.abs(f.xRight - f.xLeft), sy: spec.width / Math.abs(f.yBottom - f.yTop) };
}

/** Where a provider's lines stand on a pitch of this size, in metres: its figures turned to metres. */
export function layoutFromFrame(f: SoccerFrame, spec: Pick<SoccerSpec, "length" | "width">): SoccerLayout {
  const { sx, sy } = unitsToMetres(f, spec);
  return {
    penaltyDepth: f.penaltyDepth * sx,
    penaltyHalfWidth: f.penaltyHalfWidth * sy,
    goalAreaDepth: f.goalAreaDepth * sx,
    goalAreaHalfWidth: f.goalAreaHalfWidth * sy,
    spot: f.spot * sx,
    goalHalfWidth: f.goalHalfWidth * sy,
  };
}

/**
 * The matrix `[a, b, c, d, e, f]` of an SVG `transform` that turns a provider's numbers into metres on a pitch of this
 * size, the left goal line at x 0 and the top touchline at y 0. A group with this transform takes the provider's raw
 * x and y: that is the `ky-data` group in a drawing made with `pitchType`.
 */
export function frameMatrix(f: SoccerFrame, spec: Pick<SoccerSpec, "length" | "width">): [number, number, number, number, number, number] {
  const a = spec.length / (f.xRight - f.xLeft);
  const d = spec.width / (f.yBottom - f.yTop);
  return [a, 0, 0, d, -f.xLeft * a, -f.yTop * d];
}

/** A value mapped through paired landmarks, piecewise linear, running on past the ends along the end segments. */
function piecewise(from: readonly number[], to: readonly number[], v: number): number {
  const n = from.length;
  const up = from[n - 1] > from[0];
  let i = 0;
  while (i < n - 2 && (up ? v > from[i + 1] : v < from[i + 1])) i += 1;
  const t = (v - from[i]) / (from[i + 1] - from[i]);
  return to[i] + t * (to[i + 1] - to[i]);
}

/** A map from one provider's coordinates to another's. */
export interface Rescaler {
  (x: number, y: number): [number, number];
  /** Only the x of a point. */
  x(value: number): number;
  /** Only the y of a point. */
  y(value: number): number;
  from: SoccerFrame;
  to: SoccerFrame;
}

/**
 * The map from one coordinate system to another, piecewise linear between the landmarks, so that a point on a line of
 * the pitch (the goal line, the goal area, the penalty mark, the penalty area, the halfway line, the touchline, the
 * posts) lands on the same line in the other system. Between two landmarks the map is linear; beyond the goal lines and
 * the touchlines (a ball out of play) it runs on along the last piece. Give a pitch size in metres for a provider
 * whose numbers follow the pitch (Tracab, SkillCorner, Second Spectrum, Impect).
 * @example
 * ```ts
 * import { rescale } from "@johnmorrisdotca/kyogijo";
 * const toStatsBomb = rescale("opta", "statsbomb");
 * // The middle of Opta's penalty-box line, 17 units from the goal line, is on StatsBomb's, 18 yards from it.
 * const [x, y] = toStatsBomb(100 - 17, 50);
 * console.log(x, y);
 * // 102 40
 * ```
 */
export function rescale(from: SoccerProviderId | SoccerFrame, to: SoccerProviderId | SoccerFrame, pitch: PitchMetres = STANDARD): Rescaler {
  const a = soccerFrame(from, pitch);
  const b = soccerFrame(to, pitch);
  if (a === undefined || b === undefined) throw new Error(`Unknown pitch type "${String(a === undefined ? from : to)}": use one of ${Object.keys(SOCCER_PROVIDERS).join(", ")}, or a frame`);
  const la = soccerLandmarks(a);
  const lb = soccerLandmarks(b);
  const x = (value: number): number => piecewise(la.x, lb.x, value);
  const y = (value: number): number => piecewise(la.y, lb.y, value);
  const map = ((px: number, py: number): [number, number] => [x(px), y(py)]) as Rescaler;
  map.x = x;
  map.y = y;
  map.from = a;
  map.to = b;
  return map;
}
