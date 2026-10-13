// The outline of a playing surface in the drawing's own frame (feet, x along the surface from the left, y across it from the top;
// a ballpark's x is across the field and its y minus the distance out from home plate): where a data layer is cut, and the size
// its marks follow.
import { FEET_PER_METRE, FOOTBALL, NBA, NHL, footballLength, surfaceSize, type SizedSport } from "./geometry.ts";
import { chooseLeague, courtOf, diamondOf, fieldOf, rinkOf } from "./leagues.ts";
import { diamondFence } from "./leagues/baseball.ts";
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
  /** True when a point (in the drawing's frame, feet) is on the surface, or on its edge. */
  contains(x: number, y: number): boolean;
}

const inBox = (box: Outline["box"], x: number, y: number): boolean => x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;

const rect = (w: number, h: number): Outline => {
  const box = { x: 0, y: 0, w, h };
  return { d: `M0 0H${num(w)}V${num(h)}H0Z`, box, contains: (x, y) => inBox(box, x, y) };
};

/** Whether a point is in a polygon (even-odd). */
function inPolygon(points: readonly (readonly [number, number])[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The outline of the surface the options draw. */
export function outlineOf(o: Pick<SurfaceOptions, "sport" | "park" | "fence" | "units" | "pitch" | "league" | "year">): Outline {
  const { sport, league } = chooseLeague(o);
  switch (sport) {
    case "nfl":
    case "cfl":
    case "ifaf": {
      if (league?.family === "football") {
        const field = fieldOf(league, o.year);
        return rect(footballLength(field), field.width);
      }
      return rect(footballLength(FOOTBALL[sport]), FOOTBALL[sport].width);
    }
    case "nhl": {
      const rink = league?.family === "hockey" ? rinkOf(league, o.year) : undefined;
      const [length, width, r] = rink === undefined ? [NHL.length, NHL.width, NHL.cornerRadius] : [rink.length, rink.width, rink.cornerRadius];
      const box = { x: 0, y: 0, w: length, h: width };
      // A rectangle with quarter-circle corners: outside only when a point is in a corner's square but beyond its arc.
      const contains = (x: number, y: number): boolean => {
        if (!inBox(box, x, y)) return false;
        const cx = x < r ? r : x > box.w - r ? box.w - r : x;
        const cy = y < r ? r : y > box.h - r ? box.h - r : y;
        return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
      };
      return { d: roundedRect(0, 0, length, width, r), box, contains };
    }
    case "nba": {
      if (league?.family === "basketball") {
        const court = courtOf(league, o.year);
        return rect(court.length, court.width);
      }
      return rect(NBA.length, NBA.width);
    }
    case "mlb": {
      const generic = league?.family === "baseball" ? diamondFence(diamondOf(league, o.year)) : undefined;
      const outline = fenceOutline(fenceFor(parkById(o.park), feetFence(o.fence, lengthUnit(o)), o.year, generic));
      const us = outline.map(([u]) => u);
      const vs = outline.map(([, v]) => v);
      const x = Math.min(...us);
      const vmax = Math.max(...vs);
      const d = `M0 0L${outline.map(([u, v]) => `${num(u)} ${num(-v)}`).join("L")}Z`;
      const polygon: [number, number][] = [[0, 0], ...outline.map(([u, v]): [number, number] => [u, -v])];
      return { d, box: { x, y: -vmax, w: Math.max(...us) - x, h: vmax }, contains: (px, py) => inPolygon(polygon, px, py) };
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
