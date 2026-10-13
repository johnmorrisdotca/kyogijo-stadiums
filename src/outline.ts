// The outline of a playing surface in the drawing's own frame (feet, x along the surface from the left, y across it from the top;
// a ballpark's x is across the field and its y minus the distance out from home plate): where a data layer is cut, and the size
// its marks follow.
import { FEET_PER_METRE, FOOTBALL, NBA, NHL, footballLength, surfaceSize, type SizedSport } from "./geometry.ts";
import { fenceFor, parkById } from "./parks.ts";
import { fenceOutline } from "./surfaces/baseball.ts";
import { soccerSpec } from "./surfaces/soccer-spec.ts";
import { roundedRect } from "./surfaces/surface.ts";
import { feetFence, lengthUnit } from "./common.ts";
import { num } from "./format.ts";
import type { SurfaceOptions } from "./types.ts";

/** A surface's outline as a path, with the box round it. */
export interface Outline {
  /** The path of the playing surface's edge: the boards for a rink, the lines of a court, the fence and the foul lines for a ballpark. */
  d: string;
  box: { x: number; y: number; w: number; h: number };
}

const rect = (w: number, h: number): Outline => ({ d: `M0 0H${num(w)}V${num(h)}H0Z`, box: { x: 0, y: 0, w, h } });

/** The outline of the surface the options draw. */
export function outlineOf(o: Pick<SurfaceOptions, "sport" | "park" | "fence" | "units" | "pitch">): Outline {
  switch (o.sport) {
    case "nfl":
    case "cfl":
    case "ifaf":
      return rect(footballLength(FOOTBALL[o.sport]), FOOTBALL[o.sport].width);
    case "nhl":
      return { d: roundedRect(0, 0, NHL.length, NHL.width, NHL.cornerRadius), box: { x: 0, y: 0, w: NHL.length, h: NHL.width } };
    case "nba":
      return rect(NBA.length, NBA.width);
    case "mlb": {
      const outline = fenceOutline(fenceFor(parkById(o.park), feetFence(o.fence, lengthUnit(o))));
      const us = outline.map(([u]) => u);
      const vs = outline.map(([, v]) => v);
      const x = Math.min(...us);
      const vmax = Math.max(...vs);
      const d = `M0 0L${outline.map(([u, v]) => `${num(u)} ${num(-v)}`).join("L")}Z`;
      return { d, box: { x, y: -vmax, w: Math.max(...us) - x, h: vmax } };
    }
    case "soccer": {
      const spec = soccerSpec(o.pitch, o.units === undefined ? "m" : lengthUnit(o));
      return rect(spec.length * FEET_PER_METRE, spec.width * FEET_PER_METRE);
    }
    default: {
      // A surface added later with one size is a rectangle until it says otherwise.
      const size = surfaceSize(o.sport as SizedSport, "ft");
      return rect(size.length, size.width);
    }
  }
}
