// The standard stadium's field events, each in its usual place (Track and Field Facilities Manual 2019, 2.5, Figure 2.5a "Standard layout of competition facility", and the Marking Plan for the 400 m
// Standard Track, Figure 2.2.1.6a, at 1:350): the pole vaults and the shot put circles in the first segment, the discus and hammer circle, the high jumps and the other shot put in the second, a
// javelin runway through the middle of each, and the long and triple jumps beyond the back straight. The places are read off the Marking Plan to the metre, which is the precision of its scale; the
// sizes of everything are the Manual's and the Rules'. Metres, in the frame of track.ts.
import { line } from "../fields.kit.ts";
import type { Area, Shape } from "../fields.types.ts";
import { num } from "../format.ts";
import {
  bounds,
  cageShapes,
  circleParts,
  highJumpParts,
  javelinParts,
  pitParts,
  poleVaultEnd,
  rectArea,
  runwayLines,
  sectorShapes,
  stopBoard,
  takeOffBoard,
  type Facility,
} from "./facilities.ts";
import { addParts, emptyParts, type Parts } from "./oval.ts";
import type { Oval } from "./track.ts";
import type { AthleticsFieldEvent } from "./types.ts";

type Pt = readonly [number, number];

/** The sectors' lengths (Manual 2.1.1.3 and Figures 2.4.1.1, 2.4.2.1, 2.4.3.1, 2.4.4.1): the shot's 25 m, the discus's 80 m, the hammer's 90 m, the javelin's 100 m. */
export const SECTOR_REACH = { "shot-put": 25, "discus-throw": 80, "hammer-throw": 90, "javelin-throw": 100 } as const;

/** Where the standard stadium puts each facility, in metres from the centre of the semicircle of its segment (CP1 at the left, CP2 at the right), read from the Marking Plan. */
export const ARENA = {
  /** The synthetic surface of a segment ends, and the turf of the infield begins, this far from the semicircle's centre along the straights' axis (Marking Plan; 108.39 m of turf between: a 105 m pitch fits). */
  turf: 12,
  /** The javelin arc's apex is this far beyond the segment's centre; the centre point is 8 m behind it. */
  javelinApex: 55.1 - 42.195,
  /** The shot put circles: from the segment's centre outward along the axis, and the distance up or down. */
  shotWest: { out: 13.5, across: 18.15 },
  shotEast: { out: 14.2, across: 18.5 },
  /** The combined discus and hammer circle of the second segment. */
  discus: { out: 20.4, across: -24.1, heading: Math.PI * (1 - 0.097) },
  /** The two pole vault runways of the first segment: their middle lines, the boxes' places and the length, from the axis. */
  vaultA: { out: 23.26, box: 16.5 },
  vaultB: { out: 15.82, box: 20.7 },
  vaultReach: 26,
  /** The high jumps: the bar's distance beyond the segment's centre and the distance of each from the axis (the spacing of two sets of uprights is 12 to 15 m: 13.5 m). */
  highJump: { out: 15, across: 6.75 },
  /** The long and triple jump beyond the back straight (Figure 2.5a, Marking Plan): the strip, the two runways' middle lines, and the pits' places along the straight. */
  strip: { x0: -45.6, x1: 46.2, y0: -56.6 },
  rows: [
    { y: -54.2, west: [-39.7, -31.7], east: [23, 31.1] },
    { y: -50.4, west: [-30.9, -22.9], east: [31.9, 40] },
  ],
} as const;

/** What the infield is made of: shapes and areas, the facilities as data, and the box of what lies beyond the oval. */
export interface Infield {
  parts: Parts;
  facilities: Facility[];
}

const rad = (deg: number): number => (deg * Math.PI) / 180;
void rad;

/** The standard stadium's field events, those asked for. */
export function infieldParts(o: Oval, events: ReadonlySet<AthleticsFieldEvent>): Infield {
  const parts = emptyParts();
  const facilities: Facility[] = [];
  const S = o.straight;
  const cp1x = -S / 2;
  const cp2x = S / 2;
  const has = (e: AthleticsFieldEvent): boolean => events.has(e);

  // The javelin: a runway through the middle of each segment, thrown towards the middle of the infield.
  if (has("javelin-throw")) {
    const apex = ARENA.javelinApex;
    for (const [id, cx, heading] of [
      ["javelin-west", cp1x - apex - 8 + 0, 0],
      ["javelin-east", cp2x + apex + 8, Math.PI],
    ] as const) {
      // The centre point is 8 m behind the arc's apex, so beyond the segment's centre by `apex + 8` on its own side.
      const made = javelinParts(id, [id === "javelin-west" ? cp1x - apex - 8 : cx, 0], heading);
      addParts(parts, made.parts);
      facilities.push(made.facility);
    }
  }

  // The shot put: two circles in the first segment, throwing to the east, and one in the second, throwing to the west.
  if (has("shot-put")) {
    const circles: [string, Pt, number][] = [
      ["shot-west-north", [cp1x - ARENA.shotWest.out, -ARENA.shotWest.across], 0],
      ["shot-west-south", [cp1x - ARENA.shotWest.out, ARENA.shotWest.across], 0],
      ["shot-east-south", [cp2x + ARENA.shotEast.out, ARENA.shotEast.across], Math.PI],
    ];
    for (const [id, c, heading] of circles) {
      addParts(parts, circleParts(id, "shot-put", c, heading, 2.135));
      parts.areas.push(stopBoard(id, c, heading, 2.135));
      parts.shapes.push(...sectorShapes(id, "shot-put", c, heading, 1.0675, SECTOR_REACH["shot-put"]));
      const reach = SECTOR_REACH["shot-put"];
      facilities.push({ id, event: "shot-put", x: c[0], y: c[1], heading, reach, box: bounds([c, [c[0] + Math.cos(heading) * reach, c[1] + Math.sin(heading) * reach + reach * 0.31], [c[0] + Math.cos(heading) * reach, c[1] + Math.sin(heading) * reach - reach * 0.31]]) });
    }
  }

  // The discus and the hammer: one circle and cage in the second segment, near the 1500 m start, throwing across the infield.
  if (has("discus-throw") || has("hammer-throw")) {
    const c: Pt = [cp2x + ARENA.discus.out, ARENA.discus.across];
    const heading = ARENA.discus.heading;
    const both = has("discus-throw") && has("hammer-throw");
    // A circle of 2.50 m, reduced to 2.135 m for the hammer by a ring inside it (Rule 32, throwing circle): both are drawn when both events are.
    addParts(parts, circleParts("discus-hammer", has("discus-throw") ? "discus-throw" : "hammer-throw", c, heading, has("discus-throw") ? 2.5 : 2.135));
    if (both) parts.shapes.push(...circleParts("hammer-insert", "hammer-throw", c, heading, 2.135).shapes.filter((s) => s.kind === "ring"));
    parts.shapes.push(...cageShapes("discus-hammer", c, heading));
    const reach = has("hammer-throw") ? SECTOR_REACH["hammer-throw"] : SECTOR_REACH["discus-throw"];
    parts.shapes.push(...sectorShapes("discus-hammer", has("discus-throw") ? "discus-throw" : "hammer-throw", c, heading, has("discus-throw") ? 1.25 : 1.0675, reach));
    if (both) {
      // The discus's shorter arc across the same sector.
      const half = Math.asin(0.3);
      const a = heading - half;
      const b = heading + half;
      const r = SECTOR_REACH["discus-throw"];
      const p = [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
      const q = [c[0] + r * Math.cos(b), c[1] + r * Math.sin(b)];
      parts.shapes.push({ kind: "path", id: "discus-sector-arc", feature: "discus-throw", d: `M${num(p[0])} ${num(p[1])}A${num(r)} ${num(r)} 0 0 1 ${num(q[0])} ${num(q[1])}` });
    }
    const end = [c[0] + Math.cos(heading) * reach, c[1] + Math.sin(heading) * reach];
    for (const event of ["discus-throw", "hammer-throw"] as const) if (has(event)) facilities.push({ id: event === "discus-throw" ? "discus" : "hammer", event, x: c[0], y: c[1], heading, reach: SECTOR_REACH[event], box: bounds([c, [end[0], end[1] + 0.31 * reach], [end[0], end[1] - 0.31 * reach], [c[0] - 5, c[1] - 5], [c[0] + 8, c[1] + 8]]) });
  }

  // The high jump: two, symmetrical about the javelin runway of the second segment, the athletes running up from the track and jumping towards the middle.
  if (has("high-jump")) {
    for (const [id, side] of [["high-jump-north", -1], ["high-jump-south", 1]] as const) {
      const made = highJumpParts(id, [cp2x + ARENA.highJump.out, side * ARENA.highJump.across], Math.PI);
      addParts(parts, made.parts);
      facilities.push(made.facility);
    }
  }

  // The pole vault: two runways in the first segment, each with a box and a mat at both ends, and the runway cut where the javelin's crosses it.
  if (has("pole-vault")) {
    for (const [name, v] of [["pole-vault-a", ARENA.vaultA], ["pole-vault-b", ARENA.vaultB]] as const) {
      const x = cp1x - v.out;
      const reach = ARENA.vaultReach;
      const gap = has("javelin-throw") ? 2.1 : 0;
      for (const side of [-1, 1]) {
        const lo = side === -1 ? -reach : gap;
        const hi = side === -1 ? -gap : reach;
        parts.shapes.push(...runwayLines(`${name}-${side}`, "pole-vault", [x, lo], [x, hi]));
      }
      for (const side of [-1, 1]) {
        const made = poleVaultEnd(`${name}-${side === -1 ? "north" : "south"}`, [x, side * v.box], side === -1 ? -Math.PI / 2 : Math.PI / 2);
        // The vaulter runs towards the box from the far end, so the box's 0-line faces the mat beyond it, away from the runway's middle.
        addParts(parts, made.parts);
        facilities.push(made.facility);
      }
    }
  }

  // The long and the triple jump, beyond the back straight: two runways in a strip, each with a pit at either end, a take-off board for each run.
  if (has("long-jump") || has("triple-jump")) {
    const strip: Area = { id: "jump-strip", feature: "track", cls: "ky-ath-track", d: `M${num(ARENA.strip.x0)} ${num(ARENA.strip.y0)}H${num(ARENA.strip.x1)}V${num(-o.radius - o.lanes * o.lane + 0.3)}H${num(ARENA.strip.x0)}Z` };
    parts.areas.push(strip);
    const boxes: { x0: number; y0: number; x1: number; y1: number }[] = [];
    for (const [r, row] of ARENA.rows.entries()) {
      const west = row.west;
      const east = row.east;
      // The runway between the pits' near ends, and across both to the pits' far ends so that it reads as one facility with a pit at either end.
      parts.shapes.push(...runwayLines(`jump-${r}`, has("long-jump") ? "long-jump" : "triple-jump", [west[1], row.y], [east[0], row.y]));
      for (const [pit, edge, heading, name] of [
        [west, west[1], Math.PI, "west"],
        [east, east[0], 0, "east"],
      ] as const) {
        const id = `jump-${r}-${name}`;
        const event: AthleticsFieldEvent = has("long-jump") ? "long-jump" : "triple-jump";
        addParts(parts, pitParts(id, event, [(pit[0] + pit[1]) / 2, row.y], 0, pit[1] - pit[0], 3));
        const jumpHeading = heading;
        // The athlete runs towards the pit: for the west pit that is westward, so the board is east of the pit's near end (the east edge), and the run comes from the east.
        const near: Pt = [edge, row.y];
        if (has("long-jump")) parts.areas.push(takeOffBoard(`${id}-lj-board`, "long-jump", near, jumpHeading + 0, 3));
        if (has("triple-jump")) {
          parts.areas.push(takeOffBoard(`${id}-tj-board-men`, "triple-jump", near, jumpHeading, 13), takeOffBoard(`${id}-tj-board-women`, "triple-jump", near, jumpHeading, 11));
        }
        boxes.push({ x0: pit[0] - 1, x1: pit[1] + 1, y0: row.y - 2, y1: row.y + 2 });
        // One facility for each of the two events that jump into this pit, the pit's near end being its place.
        for (const e of ["long-jump", "triple-jump"] as const) if (has(e)) facilities.push({ id, event: e, x: edge, y: row.y, heading: jumpHeading, reach: 45, box: { x0: Math.min(pit[0], pit[1]) - 1, x1: Math.max(pit[0], pit[1]) + 1, y0: row.y - 2.5, y1: row.y + 2.5 } });
      }
    }
    void boxes;
  }
  void line;
  void rectArea;
  return { parts, facilities };
}

/** The strip beyond the back straight where the long and the triple jumps are, as a box, when they are drawn. */
export const jumpStrip = (): { x0: number; y0: number; x1: number; y1: number } => ({ x0: ARENA.strip.x0, y0: ARENA.strip.y0, x1: ARENA.strip.x1, y1: -46 });

export type { Shape };
