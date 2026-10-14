// One field event alone, at a large scale, from the diagram of its facility (Track and Field Facilities Manual 2019, Figures 2.3.1.1a, 2.3.2.1, 2.3.3.1, 2.3.4.1, 2.4.1.1 to 2.4.4.2; Technical Rules 25 to 38 of
// Book C2.1): the athlete throws or jumps to the right, from a point at the origin (a circle's centre, a javelin arc's centre point, a jump's take-off line, the bar, the vault's zero line). Metres.
import { line } from "../fields.kit.ts";
import type { Area } from "../fields.types.ts";
import { num } from "../format.ts";
import {
  bounds,
  cageShapes,
  circleParts,
  highJumpParts,
  javelinParts,
  pitParts,
  poleVaultEnd,
  runwayLines,
  sectorShapes,
  stopBoard,
  takeOffBoard,
  SECTOR_ANGLE,
  type Facility,
} from "./facilities.ts";
import { addParts, emptyParts, type Parts } from "./oval.ts";
import { SECTOR_REACH } from "./infield.ts";
import type { MBox, MMark } from "./plan.ts";
import type { AthleticsFieldEvent } from "./types.ts";

type Pt = readonly [number, number];

/** What a field event alone is: its shapes, its facility as data, the box round it and the parts to label. */
export interface Layout {
  parts: Parts;
  facility: Facility;
  box: MBox;
  marks: MMark[];
}

const O: Pt = [0, 0];

/** The landing sector as ground: mown grass between the sector lines from `rim` out to the arc (a circle's rim, or a javelin arc's). */
function sectorGrass(id: string, event: AthleticsFieldEvent, reach: number, half: number, rim = 0): Area {
  const at = (k: number, a: number): string => `${num(k * Math.cos(a))} ${num(k * Math.sin(a))}`;
  return { id: `${id}-sector-ground`, feature: event, cls: "ky-ath-grass", d: `M${at(rim, -half)}L${at(reach, -half)}A${num(reach)} ${num(reach)} 0 0 1 ${at(reach, half)}L${at(rim, half)}Z` };
}

/** A runway as ground: the track's own surface, `width` wide from `x0` to `x1`. */
function runwayGround(id: string, event: AthleticsFieldEvent, x0: number, x1: number, width: number): Area {
  return { id: `${id}-runway-ground`, feature: event, cls: "ky-ath-track", d: `M${num(x0)} ${num(-width / 2)}H${num(x1)}V${num(width / 2)}H${num(x0)}Z` };
}

/** The long jump's and the triple jump's facility: the runway 45 m long (Rule 29.1; Manual 2.3.1.2), the take-off boards, the landing area 3 m wide and 8 m long. */
function jumpLayout(event: "long-jump" | "triple-jump"): Layout {
  const parts = emptyParts();
  parts.areas.push(runwayGround(event, event, -45, event === "long-jump" ? 3 : 13, 1.22));
  // The pit: 8 m long, 3 m wide, its near end 3 m past the long jump's take-off line (Manual 2.3.1.4) or 13 m past the men's triple jump line (Rule 31.4: not less than 13 m for men, 11 for women).
  const near = event === "long-jump" ? 3 : 13;
  const len = 8;
  addParts(parts, pitParts(event, event, [near + len / 2, 0], 0, len, 3));
  parts.shapes.push(...runwayLines(event, event, [-45, 0], [near + len, 0]));
  parts.areas.push(takeOffBoard(`${event}-board`, event, [near, 0], 0, near));
  if (event === "triple-jump") parts.areas.push(takeOffBoard(`${event}-board-women`, event, [near, 0], 0, 11));
  // The window shows the last 24 m of the runway: the rest runs off its edge.
  const box = { x0: -24, y0: -3.2, x1: near + len + 2, y1: 3.2 };
  const facility: Facility = { id: event, event, x: 0, y: 0, heading: 0, box, reach: 45 };
  const marks: MMark[] = [
    { id: "runway", x: -25, y: -0.61, side: "top" },
    { id: "take-off-board", x: -0.1, y: 0.6, side: "bottom" },
    { id: "landing-area", x: near + len / 2, y: -1.5, side: "top" },
  ];
  return { parts, facility, box, marks };
}

/** The throws: a circle with its sector and, for the discus and the hammer, the cage; the shot's stop board. */
function throwLayout(event: "shot-put" | "discus-throw" | "hammer-throw"): Layout {
  const parts = emptyParts();
  const d = event === "discus-throw" ? 2.5 : 2.135;
  const reach = SECTOR_REACH[event];
  parts.areas.push(sectorGrass(event, event, reach, SECTOR_ANGLE / 2));
  addParts(parts, circleParts(event, event, O, 0, d));
  if (event === "shot-put") parts.areas.push(stopBoard(event, O, 0, d));
  else parts.shapes.push(...cageShapes(event, O, 0));
  parts.shapes.push(...sectorShapes(event, event, O, 0, d / 2, reach));
  const half = SECTOR_ANGLE / 2;
  const box = { x0: -8, y0: -reach * Math.sin(half) - 2, x1: reach + 2, y1: reach * Math.sin(half) + 2 };
  const facility: Facility = { id: event, event, x: 0, y: 0, heading: 0, box, reach };
  const marks: MMark[] = [
    { id: "throwing-circle", x: 0, y: -d / 2 - 0.6, side: "top" },
    { id: "sector", x: reach * 0.5, y: -reach * 0.5 * Math.tan(half), side: "top" },
  ];
  if (event === "shot-put") marks.push({ id: "stop-board", x: d / 2, y: d / 2 + 0.5, side: "bottom" });
  else marks.push({ id: "cage", x: 7, y: -3, side: "top" });
  return { parts, facility, box, marks };
}

/** The layout of one field event alone. */
export function layoutOf(event: AthleticsFieldEvent): Layout {
  switch (event) {
    case "long-jump":
    case "triple-jump":
      return jumpLayout(event);
    case "shot-put":
    case "discus-throw":
    case "hammer-throw":
      return throwLayout(event);
    case "javelin-throw": {
      const made = javelinParts("javelin", O, 0);
      const half = Math.asin(2 / 8);
      made.parts.areas.unshift(runwayGround("javelin", "javelin-throw", -36.5 + 8 * Math.cos(half), 8 * Math.cos(half), 4), sectorGrass("javelin", "javelin-throw", 100, half, 8));
      const box = { x0: -18, y0: -100 * Math.sin(half) - 2, x1: 102, y1: 100 * Math.sin(half) + 2 };
      return { parts: made.parts, facility: made.facility, box, marks: [{ id: "runway", x: -20, y: -2.1, side: "top" }, { id: "throwing-arc", x: 8, y: -1.5, side: "top" }, { id: "sector", x: 50, y: -50 * Math.tan(half), side: "top" }] };
    }
    case "high-jump": {
      const made = highJumpParts("high-jump", O, 0);
      made.parts.areas.unshift({ id: "high-jump-runway-ground", feature: "high-jump", cls: "ky-ath-track", d: `M0 -8H${num(-Math.sqrt(15 * 15 - 64))}A15 15 0 0 0 ${num(-Math.sqrt(15 * 15 - 64))} 8H0Z` });
      const box = made.facility.box;
      return { parts: made.parts, facility: made.facility, box: { x0: box.x0 - 1, y0: box.y0 - 1, x1: box.x1 + 1, y1: box.y1 + 1 }, marks: [{ id: "crossbar", x: 0, y: -2, side: "top" }, { id: "landing-mat", x: 1.5, y: 3.2, side: "bottom" }, { id: "run-up", x: -9, y: -8, side: "top" }] };
    }
    default: {
      // The pole vault: a runway of 45 m to the box, the box, the zero line and the mat beyond.
      const made = poleVaultEnd("pole-vault", O, 0);
      made.parts.areas.unshift(runwayGround("pole-vault", "pole-vault", -45, 0, 1.22));
      made.parts.shapes.push(...runwayLines("pole-vault", "pole-vault", [-45, 0], [0, 0]));
      made.parts.shapes.push(line("pole-vault-runway-end", "pole-vault", -45, -0.61, -45, 0.61, { w: 0.05 }));
      const box = bounds([[-24, -3.5], [9, 3.5]]);
      return { parts: made.parts, facility: made.facility, box, marks: [{ id: "runway", x: -25, y: -0.61, side: "top" }, { id: "zero-line", x: 0, y: -2.9, side: "top" }, { id: "landing-mat", x: 4.2, y: 3.1, side: "bottom" }, { id: "box", x: -0.5, y: 0.5, side: "bottom" }] };
    }
  }
}
